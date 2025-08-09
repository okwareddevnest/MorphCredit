export interface SDKConfig {
  rpcUrl: string;
  contracts: {
    scoreOracle: string;
    creditRegistry: string;
    lendingPool: string;
    bnplFactory: string;
  };
  scoringService: string;
  networkId: number;
  gasLimit?: number;
  confirmations?: number;
}

export interface SDKOptions {
  autoConnect?: boolean;
  enableLogging?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
  /**
   * If true, skip pre-checking FACTORY_ROLE before calling createAgreement.
   * Useful on some RPCs/proxies where static calls may return empty data.
   */
  skipRoleCheck?: boolean;
}

export interface Offer {
  id: string;
  principal: bigint;
  installments: number;
  installmentAmount: bigint;
  totalCost: bigint;
  apr: number;
  dueDates: number[];
  merchant: string;
  status: 'available' | 'expired' | 'unavailable';
  tier: 'A' | 'B' | 'C' | 'D' | 'E';
  features: {
    noLateFees?: boolean;
    earlyPayoff?: boolean;
    autoRepay?: boolean;
  };
}

export interface OfferRequest {
  address: string;
  amount: number;
  currency?: string;
  includeFeatures?: boolean;
}

export interface TxResult {
  success: boolean;
  txHash: string;
  agreementId: string;
  blockNumber: number;
  gasUsed: number;
  gasPrice: bigint;
  error?: string;
  receipt?: any;
}

export interface AgreementStatus {
  id: string;
  status: 'active' | 'completed' | 'defaulted' | 'written_off';
  paidInstallments: number;
  totalInstallments: number;
  nextDueDate: number;
  nextAmount: bigint;
  remainingBalance: bigint;
  lastPaymentDate?: number;
  delinquencyDays: number;
}

export interface AgreementEvent {
  type: 'created' | 'funded' | 'installment_paid' | 'late' | 'completed' | 'defaulted';
  agreementId: string;
  timestamp: number;
  data: any;
}

export interface PaymentEvent {
  agreementId: string;
  installmentId: number;
  amount: bigint;
  timestamp: number;
  txHash: string;
}

export interface MorphCreditError extends Error {
  code: string;
  details?: any;
  retryable: boolean;
}

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

// React component props
export interface MorphCreditButtonProps {
  amount: number;
  userAddress?: string;
  onSuccess?: (result: TxResult) => void;
  onError?: (error: MorphCreditError) => void;
  onOffersLoaded?: (offers: Offer[]) => void;
  onWalletConnect?: (address: string) => void;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  showOffers?: boolean;
}

export interface OfferSelectorProps {
  offers: Offer[];
  selectedOffer?: Offer;
  onSelect: (offer: Offer) => void;
  onClose?: () => void;
  className?: string;
  showFeatures?: boolean;
  showComparison?: boolean;
} 