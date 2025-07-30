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

  constructor(rpcUrl: string) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
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
    // In a real implementation, you'd query a block explorer API or indexer
    // For now, we'll simulate with a reasonable default
    const now = Math.floor(Date.now() / 1000);
    const daysAgo = Math.floor(Math.random() * 365) + 30; // 30-395 days ago
    return now - (daysAgo * 24 * 60 * 60);
  }

  /**
   * Get last transaction timestamp
   */
  private async getLastTransaction(address: string): Promise<number> {
    // In a real implementation, you'd query recent transactions
    const now = Math.floor(Date.now() / 1000);
    const daysAgo = Math.floor(Math.random() * 30); // 0-30 days ago
    return now - (daysAgo * 24 * 60 * 60);
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
    const now = Math.floor(Date.now() / 1000);
    const days90 = 90 * 24 * 60 * 60;
    const startTime = now - days90;
    
    // In a real implementation, you'd query historical balances
    // For now, we'll simulate with some realistic data
    const history: Array<{ timestamp: number; balance: bigint }> = [];
    const currentBalance = await this.provider.getBalance(address);
    
    for (let i = 0; i < 10; i++) {
      const timestamp = startTime + (i * days90 / 10);
      const balance = currentBalance + BigInt(Math.floor(Math.random() * 1000000000000000000)); // ±1 ETH
      history.push({ timestamp, balance });
    }
    
    return history;
  }

  /**
   * Get inflow history over last 30 days
   */
  private async getInflowHistory(address: string): Promise<Array<{ timestamp: number; amount: bigint }>> {
    const now = Math.floor(Date.now() / 1000);
    const days30 = 30 * 24 * 60 * 60;
    const startTime = now - days30;
    
    // In a real implementation, you'd query transaction history
    // For now, we'll simulate with some realistic inflow data
    const history: Array<{ timestamp: number; amount: bigint }> = [];
    
    for (let i = 0; i < 5; i++) {
      const timestamp = startTime + (i * days30 / 5);
      const amount = BigInt(Math.floor(Math.random() * 1000000000000000000)); // 0-1 ETH
      history.push({ timestamp, amount });
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
    
    // Address age in days
    const addressAge = Math.max(1, Math.floor((now - data.firstTx) / (24 * 60 * 60)));
    
    // Active days in last 90 days
    const days90 = 90 * 24 * 60 * 60;
    const activeDays = Math.min(90, Math.floor((now - data.lastTx) / (24 * 60 * 60)));
    
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