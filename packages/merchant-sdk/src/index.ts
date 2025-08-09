import { ethers } from 'ethers';
import type {
  SDKConfig,
  SDKOptions,
  Offer,
  OfferRequest,
  TxResult,
  AgreementStatus
} from './types';

// Extend Window interface for ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

// Import addresses from config
import addresses from '../../../apps/config/addresses.json';

export enum ErrorCodes {
  WALLET_NOT_CONNECTED = 'WALLET_NOT_CONNECTED',
  WALLET_CONNECTION_FAILED = 'WALLET_CONNECTION_FAILED',
  WRONG_NETWORK = 'WRONG_NETWORK',
  INSUFFICIENT_CREDIT = 'INSUFFICIENT_CREDIT',
  SCORE_NOT_FOUND = 'SCORE_NOT_FOUND',
  SCORE_EXPIRED = 'SCORE_EXPIRED',
  AGREEMENT_FAILED = 'AGREEMENT_FAILED',
  AGREEMENT_NOT_FOUND = 'AGREEMENT_NOT_FOUND',
  AGREEMENT_EXPIRED = 'AGREEMENT_EXPIRED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  RPC_ERROR = 'RPC_ERROR',
  TIMEOUT = 'TIMEOUT',
  USER_REJECTED = 'USER_REJECTED',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  INVALID_ADDRESS = 'INVALID_ADDRESS',
  INVALID_AMOUNT = 'INVALID_AMOUNT',
  INVALID_OFFER = 'INVALID_OFFER'
}

export class MorphCreditError extends Error {
  code: string;
  details?: any;
  retryable: boolean;
  
  constructor(code: string, message: string, details?: any, retryable = false) {
    super(message);
    this.code = code;
    this.details = details;
    this.retryable = retryable;
    this.name = 'MorphCreditError';
  }
}

export class MorphCreditSDK {
  private config: SDKConfig;
  private options: SDKOptions;
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;
  private eventCallbacks: Map<string, Function[]> = new Map();
  private offersCache: Map<string, Offer> = new Map();

  constructor(config: Partial<SDKConfig> = {}, options: SDKOptions = {}) {
    this.config = {
      rpcUrl: 'https://rpc-holesky.morphl2.io',
      contracts: {
        scoreOracle: (addresses as any).scoreOracle,
        creditRegistry: (addresses as any).creditRegistry,
        lendingPool: (addresses as any).lendingPool,
        bnplFactory: (addresses as any).bnplFactory,
      },
      scoringService: 'http://localhost:8787',
      networkId: 2810,
      gasLimit: 800000,
      confirmations: 1,
      ...config
    };

    this.options = {
      autoConnect: false,
      enableLogging: false,
      retryAttempts: 3,
      retryDelay: 1000,
      ...options
    };

    this.initializeProviders();
  }

  // Minimal ABIs
  private static readonly BNPL_FACTORY_ABI = [
    'function createAgreement(address borrower,address merchant,uint256 principal,uint256 installments,uint256 apr) returns (address)'
  ];
  private static readonly BNPL_AGREEMENT_ABI = [
    'function getAgreement() view returns (tuple(uint256 principal,address borrower,address merchant,uint256 installments,uint256 installmentAmount,uint256 apr,uint256 penaltyRate,uint256[] dueDates,uint8 status,uint256 paidInstallments,uint256 lastPaymentDate,uint256 gracePeriod,uint256 writeOffPeriod))',
    'function getAllInstallments() view returns (tuple(uint256 id,uint256 amount,uint256 dueDate,bool isPaid,uint256 paidAt,uint256 penaltyAccrued)[])'
  ];

  private async getSigner(): Promise<ethers.JsonRpcSigner> {
    if (!this.provider) throw new MorphCreditError(ErrorCodes.WALLET_CONNECTION_FAILED, 'Provider not initialized');
    if (!this.signer) {
      this.signer = await this.provider.getSigner();
    }
    return this.signer;
  }

  private initializeProviders() {
    try {
      // Initialize ethers provider
      if (typeof window !== 'undefined' && window.ethereum) {
        this.provider = new ethers.BrowserProvider(window.ethereum);
      }

      if (this.options.enableLogging) {
        console.log('MorphCreditSDK initialized with config:', this.config);
      }
    } catch (error) {
      console.error('Failed to initialize providers:', error);
    }
  }

  async connectWallet(): Promise<string> {
    try {
      if (!this.provider) {
        throw new MorphCreditError(
          ErrorCodes.WALLET_CONNECTION_FAILED,
          'Provider not initialized'
        );
      }

      this.signer = await this.provider.getSigner();
      const address = await this.signer.getAddress();

      if (this.options.enableLogging) {
        console.log('Wallet connected:', address);
      }

      this.triggerEvent('walletConnected', address);
      return address;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new MorphCreditError(
        ErrorCodes.WALLET_CONNECTION_FAILED,
        `Failed to connect wallet: ${errorMessage}`,
        error
      );
    }
  }

  disconnectWallet(): void {
    this.signer = null;
    this.triggerEvent('walletDisconnected');
  }

  getWalletAddress(): string | null {
    return this.signer ? this.signer.address : null;
  }

  isWalletConnected(): boolean {
    return this.signer !== null;
  }

  async getOffers(request: OfferRequest): Promise<Offer[]> {
    try {
      if (!request.address) {
        throw new MorphCreditError(
          ErrorCodes.INVALID_ADDRESS,
          'Address is required'
        );
      }

      if (!request.amount || request.amount <= 0) {
        throw new MorphCreditError(
          ErrorCodes.INVALID_AMOUNT,
          'Amount must be greater than 0'
        );
      }

      const amountInWei = BigInt(Math.floor(request.amount * 1e6));
      // Call scoring service to get current score/tier
      const res = await fetch(`${this.config.scoringService.replace(/\/$/, '')}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: request.address }),
      });
      if (!res.ok) {
        throw new MorphCreditError(ErrorCodes.NETWORK_ERROR, `Scoring service error: ${res.status}`);
      }
      const json = await res.json();
      if (!json?.success || !json?.data?.scoring) {
        throw new MorphCreditError(ErrorCodes.SCORE_NOT_FOUND, 'Score response invalid');
      }
      const tier: 'A'|'B'|'C'|'D'|'E' = json.data.scoring.tier;
      // Map tier to APR bands
      const tierAprMap: Record<string, number[]> = {
        A: [0.10, 0.14],
        B: [0.14, 0.20],
        C: [0.20, 0.28],
        D: [0.28, 0.36],
        E: [0.36, 0.50],
      };
      const [aprLow, aprHigh] = tierAprMap[tier] || [0.25, 0.35];
      const aprChoices = [aprLow, (aprLow + aprHigh) / 2, aprHigh];
      const now = Math.floor(Date.now() / 1000);
      const biweekly = 14 * 24 * 60 * 60;
      const installments = 4;
      const offers: Offer[] = aprChoices.map((apr, idx) => {
        const totalCost = BigInt(Math.floor(Number(amountInWei) * (1 + apr)));
        const installmentAmount = BigInt(Number(totalCost) / installments);
        const id = `offer_${request.address}_${amountInWei}_${tier}_${idx}`;
        const offer: Offer = {
          id,
          principal: amountInWei,
          installments,
          installmentAmount,
          totalCost,
          apr,
          dueDates: [now + biweekly, now + biweekly * 2, now + biweekly * 3, now + biweekly * 4],
          merchant: request.address,
          status: 'available',
          tier,
          features: { earlyPayoff: true, autoRepay: true },
        };
        this.offersCache.set(id, offer);
        return offer;
      });

      if (this.options.enableLogging) {
        console.log('Generated offers:', offers);
      }

      this.triggerEvent('offersLoaded', offers);
      return offers;
    } catch (error) {
      if (error instanceof MorphCreditError) {
        throw error;
      }
      throw new MorphCreditError(
        ErrorCodes.NETWORK_ERROR,
        `Failed to get offers: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      );
    }
  }

  // Removed mock offer generation

  async createAgreement(offerId: string, borrowerAddress?: string): Promise<TxResult> {
    try {
      const signer = await this.getSigner();
      const offer = this.offersCache.get(offerId);
      if (!offer) throw new MorphCreditError(ErrorCodes.INVALID_OFFER, 'Offer not found in cache');
      const borrower = borrowerAddress || (await signer.getAddress());
      const merchant = await signer.getAddress();
      const fac = new ethers.Contract(this.config.contracts.bnplFactory, MorphCreditSDK.BNPL_FACTORY_ABI, signer);
      const aprBps = Math.floor(offer.apr * 10000);
      const tx = await fac.createAgreement(borrower, merchant, offer.principal, offer.installments, aprBps, {
        gasLimit: this.config.gasLimit,
      });
      const receipt = await tx.wait(this.config.confirmations);
      const txResult: TxResult = {
        success: receipt?.status === 1,
        txHash: tx.hash,
        agreementId: tx.hash, // address emitted in event; for now return hash
        blockNumber: receipt?.blockNumber ?? 0,
        gasUsed: Number(receipt?.gasUsed ?? 0n),
        gasPrice: (tx as any).gasPrice ?? 0n,
        receipt,
      };
      this.triggerEvent('agreementCreated', txResult);
      return txResult;
    } catch (error) {
      if (error instanceof MorphCreditError) {
        throw error;
      }
      throw new MorphCreditError(
        ErrorCodes.AGREEMENT_FAILED,
        `Failed to create agreement: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      );
    }
  }

  async getAgreementStatus(agreementAddress: string): Promise<AgreementStatus> {
    try {
      if (!this.provider) throw new MorphCreditError(ErrorCodes.WALLET_CONNECTION_FAILED, 'Provider not initialized');
      const ag = new ethers.Contract(agreementAddress, MorphCreditSDK.BNPL_AGREEMENT_ABI, this.provider);
      const a = await ag.getAgreement();
      const installments = await ag.getAllInstallments();
      const next = installments.find((i: any) => !i.isPaid);
      const remaining = Number(a.installments) - Number(a.paidInstallments);
      const statusNum = Number(a.status);
      const status: AgreementStatus['status'] = statusNum === 2 ? 'completed' : statusNum === 3 ? 'defaulted' : statusNum === 4 ? 'written_off' : 'active';
      return {
        id: agreementAddress,
        status,
        paidInstallments: Number(a.paidInstallments),
        totalInstallments: Number(a.installments),
        nextDueDate: next ? Number(next.dueDate) : 0,
        nextAmount: next ? BigInt(next.amount) : BigInt(0),
        remainingBalance: BigInt(remaining) * BigInt(a.installmentAmount),
        lastPaymentDate: Number(a.lastPaymentDate),
        delinquencyDays: 0,
      };
    } catch (error) {
      throw new MorphCreditError(
        ErrorCodes.AGREEMENT_NOT_FOUND,
        `Failed to get agreement status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      );
    }
  }

  // Event handling
  onAgreementCreated(callback: (agreement: TxResult) => void): void {
    this.addEventCallback('agreementCreated', callback);
  }

  onOffersLoaded(callback: (offers: Offer[]) => void): void {
    this.addEventCallback('offersLoaded', callback);
  }

  onWalletConnected(callback: (address: string) => void): void {
    this.addEventCallback('walletConnected', callback);
  }

  onWalletDisconnected(callback: () => void): void {
    this.addEventCallback('walletDisconnected', callback);
  }

  private addEventCallback(event: string, callback: Function): void {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, []);
    }
    this.eventCallbacks.get(event)!.push(callback);
  }

  private triggerEvent(event: string, data?: any): void {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event callback for ${event}:`, error);
        }
      });
    }
  }

  // Configuration methods
  updateConfig(config: Partial<SDKConfig>): void {
    this.config = { ...this.config, ...config };
    this.initializeProviders();
  }

  getConfig(): SDKConfig {
    return { ...this.config };
  }

  setErrorHandler(handler: (error: MorphCreditError) => void): void {
    this.addEventCallback('error', handler);
  }
}

// Export types
export type {
  SDKConfig,
  SDKOptions,
  Offer,
  OfferRequest,
  TxResult,
  AgreementStatus
};

// Export default instance
export default MorphCreditSDK;

// Export the button component
export { default as MorphCreditButton } from './button'; 