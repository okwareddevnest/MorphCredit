import { ethers } from 'ethers';
import { config } from './config';

export interface AddressFeatures {
  addressAge: number;        // Days since first transaction
  activeDays: number;        // Days with transactions in last 90 days
  netInflow: number;         // Net ETH inflow in last 30 days (wei)
  stableBalance: number;     // Average stable token balance (wei)
  txStreak: number;          // Current transaction streak
  delinquencyFlags: number;  // Number of delinquency flags
}

export interface FeatureExtractionResult {
  features: AddressFeatures;
  rawData: {
    firstTx: number;
    lastTx: number;
    txCount: number;
    balanceHistory: Array<{ timestamp: number; balance: bigint }>;
    inflowHistory: Array<{ timestamp: number; amount: bigint }>;
  };
}

/**
 * Extract credit features from blockchain data
 */
export class FeatureExtractor {
  private provider: ethers.JsonRpcProvider;
  private stableToken?: `0x${string}`;

  constructor(rpcUrl: string) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.stableToken = (config as any).stableTokenAddress as `0x${string}` | undefined;
  }

  /**
   * Extract all features for an address
   */
  async extractFeatures(address: string): Promise<FeatureExtractionResult> {
    // Normalize address to checksum format
    const normalizedAddress = ethers.getAddress(address);
    
    const [firstTx, lastTx, txCount, balanceHistory, inflowHistory] = await Promise.all([
      this.getFirstTransaction(normalizedAddress),
      this.getLastTransaction(normalizedAddress),
      this.getTransactionCount(normalizedAddress),
      this.getBalanceHistory(normalizedAddress),
      this.getInflowHistory(normalizedAddress),
    ]);

    const features = this.computeFeatures({
      firstTx,
      lastTx,
      txCount,
      balanceHistory,
      inflowHistory,
    });

    return {
      features,
      rawData: {
        firstTx,
        lastTx,
        txCount,
        balanceHistory,
        inflowHistory,
      },
    };
  }

  /**
   * Get first transaction timestamp
   */
  private async getFirstTransaction(address: string): Promise<number> {
    // Approximate by earliest stable token Transfer involving address if token configured
    if (!this.stableToken) return 0;
    const topicTransfer = ethers.id('Transfer(address,address,uint256)');
    const padded = ethers.zeroPadValue(address, 32);
    const fromFilter = {
      address: this.stableToken,
      fromBlock: '0x0',
      toBlock: 'latest',
      topics: [topicTransfer, padded, null],
    } as any;
    const toFilter = {
      address: this.stableToken,
      fromBlock: '0x0',
      toBlock: 'latest',
      topics: [topicTransfer, null, padded],
    } as any;
    const logs = [
      ...(await this.provider.getLogs(fromFilter)),
      ...(await this.provider.getLogs(toFilter)),
    ];
    if (logs.length === 0) return 0;
    const earliest = logs.reduce((min, l) => (l.blockNumber < min.blockNumber ? l : min), logs[0]);
    const block = await this.provider.getBlock(earliest.blockHash as string);
    return block?.timestamp ?? 0;
  }

  /**
   * Get last transaction timestamp
   */
  private async getLastTransaction(address: string): Promise<number> {
    if (!this.stableToken) return 0;
    const topicTransfer = ethers.id('Transfer(address,address,uint256)');
    const padded = ethers.zeroPadValue(address, 32);
    const latestBlock = await this.provider.getBlockNumber();
    const fromBlock = Math.max(0, latestBlock - 200_000); // recent window
    const filterIn = { address: this.stableToken, fromBlock, toBlock: 'latest', topics: [topicTransfer, null, padded] } as any;
    const filterOut = { address: this.stableToken, fromBlock, toBlock: 'latest', topics: [topicTransfer, padded, null] } as any;
    const logs = [
      ...(await this.provider.getLogs(filterIn)),
      ...(await this.provider.getLogs(filterOut)),
    ];
    if (logs.length === 0) return 0;
    const latest = logs.reduce((max, l) => (l.blockNumber > max.blockNumber ? l : max), logs[0]);
    const block = await this.provider.getBlock(latest.blockHash as string);
    return block?.timestamp ?? 0;
  }

  /**
   * Get total transaction count
   */
  private async getTransactionCount(address: string): Promise<number> {
    try {
      const count = await this.provider.getTransactionCount(address, 'latest');
      return Number(count);
    } catch (error) {
      console.warn(`Failed to get transaction count for ${address}:`, error);
      return 0;
    }
  }

  /**
   * Get balance history over last 90 days
   */
  private async getBalanceHistory(address: string): Promise<Array<{ timestamp: number; balance: bigint }>> {
    const history: Array<{ timestamp: number; balance: bigint }>= [];
    const latest = await this.provider.getBlockNumber();
    const step = Math.max(1, Math.floor(latest / 10));
    for (let i = 9; i >= 0; i--) {
      const blockNumber = latest - i * step;
      const [block, balance] = await Promise.all([
        this.provider.getBlock(blockNumber),
        this.provider.getBalance(address, blockNumber),
      ]);
      if (block) history.push({ timestamp: block.timestamp, balance });
    }
    return history;
  }

  /**
   * Get inflow history over last 30 days
   */
  private async getInflowHistory(address: string): Promise<Array<{ timestamp: number; amount: bigint }>> {
    const history: Array<{ timestamp: number; amount: bigint }> = [];
    if (!this.stableToken) return history;
    const topicTransfer = ethers.id('Transfer(address,address,uint256)');
    const padded = ethers.zeroPadValue(address, 32);
    const latestBlock = await this.provider.getBlockNumber();
    const fromBlock = Math.max(0, latestBlock - 200_000);
    const logs = await this.provider.getLogs({
      address: this.stableToken,
      fromBlock,
      toBlock: 'latest',
      topics: [topicTransfer, null, padded],
    } as any);
    for (const log of logs) {
      const block = await this.provider.getBlock(log.blockHash as string);
      const amount = BigInt(log.data);
      history.push({ timestamp: block?.timestamp ?? 0, amount });
    }
    return history;
  }

  /**
   * Compute features from raw data
   */
  private computeFeatures(data: {
    firstTx: number;
    lastTx: number;
    txCount: number;
    balanceHistory: Array<{ timestamp: number; balance: bigint }>;
    inflowHistory: Array<{ timestamp: number; amount: bigint }>;
  }): AddressFeatures {
    const now = Math.floor(Date.now() / 1000);
    // Address age in days (0 if unknown)
    const addressAge = data.firstTx === 0 ? 0 : Math.max(0, Math.floor((now - data.firstTx) / (24 * 60 * 60)));
    
    // Active days in last 90 days
    const days90 = 90 * 24 * 60 * 60;
    const activeDays = data.lastTx === 0 ? 0 : Math.min(90, Math.floor((now - data.lastTx) / (24 * 60 * 60)));
    
    // Net inflow in last 30 days
    const days30 = 30 * 24 * 60 * 60;
    const recentInflow = data.inflowHistory
      .filter(tx => tx.timestamp > now - days30)
      .reduce((sum, tx) => sum + tx.amount, BigInt(0));
    const netInflow = Number(recentInflow);
    
    // Average stable balance
    const avgBalance = data.balanceHistory
      .reduce((sum, entry) => sum + entry.balance, BigInt(0)) / BigInt(data.balanceHistory.length);
    const stableBalance = Number(avgBalance);
    
    // Transaction streak (simplified)
    const txStreak = Math.min(30, Math.floor(data.txCount / 10));
    
    // Delinquency flags (simplified)
    const delinquencyFlags = data.txCount === 0 ? 1 : 0;
    
    return {
      addressAge,
      activeDays,
      netInflow,
      stableBalance,
      txStreak,
      delinquencyFlags,
    };
  }
} 