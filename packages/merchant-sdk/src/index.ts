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

  constructor(config: Partial<SDKConfig> = {}, options: SDKOptions = {}) {
    this.config = {
      rpcUrl: 'https://rpc-testnet.morphl2.io',
      contracts: {
        scoreOracle: addresses.scoreOracle,
        creditRegistry: '0x0000000000000000000000000000000000000000', // TODO: Add to addresses.json
        lendingPool: '0x0000000000000000000000000000000000000000', // TODO: Add to addresses.json
        bnplFactory: '0x0000000000000000000000000000000000000000', // TODO: Add to addresses.json
      },
      scoringService: 'https://scoring.morphcredit.xyz',
      networkId: 17000,
      gasLimit: 500000,
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

      // Convert amount to wei (assuming USDC has 6 decimals)
      const amountInWei = BigInt(Math.floor(request.amount * 1e6));

      // Mock offer generation based on amount
      // In a real implementation, this would call the scoring service
      const offers: Offer[] = this.generateMockOffers(request.address, amountInWei);

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

  private generateMockOffers(address: string, amount: bigint): Offer[] {
    const now = Math.floor(Date.now() / 1000);
    const biweekly = 14 * 24 * 60 * 60; // 14 days in seconds

    return [
      {
        id: `offer_${address}_${amount}_tier_a`,
        principal: amount,
        installments: 4,
        installmentAmount: amount * BigInt(2625) / BigInt(10000), // 26.25% of principal
        totalCost: amount * BigInt(10500) / BigInt(10000), // 105% of principal
        apr: 0.20, // 20% APR
        dueDates: [
          now + biweekly,
          now + biweekly * 2,
          now + biweekly * 3,
          now + biweekly * 4
        ],
        merchant: address,
        status: 'available',
        tier: 'A',
        features: {
          noLateFees: true,
          earlyPayoff: true,
          autoRepay: true
        }
      },
      {
        id: `offer_${address}_${amount}_tier_b`,
        principal: amount,
        installments: 4,
        installmentAmount: amount * BigInt(2750) / BigInt(10000), // 27.5% of principal
        totalCost: amount * BigInt(11000) / BigInt(10000), // 110% of principal
        apr: 0.25, // 25% APR
        dueDates: [
          now + biweekly,
          now + biweekly * 2,
          now + biweekly * 3,
          now + biweekly * 4
        ],
        merchant: address,
        status: 'available',
        tier: 'B',
        features: {
          earlyPayoff: true,
          autoRepay: true
        }
      }
    ];
  }

  async createAgreement(offerId: string): Promise<TxResult> {
    try {
      if (!this.signer) {
        throw new MorphCreditError(
          ErrorCodes.WALLET_NOT_CONNECTED,
          'Wallet not connected'
        );
      }

      // Validate offer ID format
      if (!offerId || !offerId.startsWith('offer_')) {
        throw new MorphCreditError(
          ErrorCodes.INVALID_OFFER,
          'Invalid offer ID'
        );
      }

      // Mock transaction result
      // In a real implementation, this would call the BNPL contract
      const mockTxResult: TxResult = {
        success: true,
        txHash: `0x${Math.random().toString(16).substring(2, 66)}`,
        agreementId: `agreement_${offerId}_${Date.now()}`,
        blockNumber: Math.floor(Math.random() * 1000000),
        gasUsed: Math.floor(Math.random() * 200000) + 100000,
        gasPrice: BigInt(Math.floor(Math.random() * 1000000000) + 1000000000)
      };

      if (this.options.enableLogging) {
        console.log('Agreement created:', mockTxResult);
      }

      this.triggerEvent('agreementCreated', mockTxResult);
      return mockTxResult;
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

  async getAgreementStatus(agreementId: string): Promise<AgreementStatus> {
    try {
      // Mock agreement status
      // In a real implementation, this would query the contract
      const mockStatus: AgreementStatus = {
        id: agreementId,
        status: 'active',
        paidInstallments: 0,
        totalInstallments: 4,
        nextDueDate: Math.floor(Date.now() / 1000) + 14 * 24 * 60 * 60,
        nextAmount: BigInt(262500000), // 26.25 USDC in wei
        remainingBalance: BigInt(1000000000), // 1000 USDC in wei
        delinquencyDays: 0
      };

      return mockStatus;
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