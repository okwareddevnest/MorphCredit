# MorphCredit Merchant SDK Specification

## Overview

This document specifies the TypeScript API, React components, and integration patterns for the MorphCredit Merchant SDK, enabling merchants to add "Pay with MorphCredit" BNPL functionality to their applications.

## Package Structure

```
@morphcredit/merchant-sdk/
├── src/
│   ├── index.ts              # Main exports
│   ├── sdk.ts                # Core SDK class
│   ├── types.ts              # TypeScript definitions
│   ├── components/
│   │   ├── MorphCreditButton.tsx
│   │   └── OfferSelector.tsx
│   ├── hooks/
│   │   ├── useOffers.ts
│   │   ├── useAgreement.ts
│   │   └── useWallet.ts
│   ├── utils/
│   │   ├── contracts.ts
│   │   ├── scoring.ts
│   │   └── validation.ts
│   └── errors.ts             # Error handling
├── dist/                     # Built package
├── package.json
└── README.md
```

## TypeScript API

### Core Types

#### SDK Configuration
```typescript
interface SDKConfig {
  rpcUrl: string;                   // Morph testnet RPC endpoint
  contracts: {
    scoreOracle: string;            // ScoreOracle contract address
    creditRegistry: string;         // CreditRegistry contract address
    lendingPool: string;            // LendingPool contract address
    bnplFactory: string;            // BNPLFactory contract address
  };
  scoringService: string;           // Scoring API endpoint
  networkId: number;                // Chain ID (17000 for Morph testnet)
  gasLimit?: number;                // Default gas limit for transactions
  confirmations?: number;           // Block confirmations to wait
}

interface SDKOptions {
  autoConnect?: boolean;            // Auto-connect wallet on init
  enableLogging?: boolean;          // Enable debug logging
  retryAttempts?: number;           // Number of retry attempts
  retryDelay?: number;              // Delay between retries (ms)
}
```

#### Offer Types
```typescript
interface Offer {
  id: string;                       // Unique offer identifier
  principal: bigint;                // Total amount in wei
  installments: number;             // Number of installments (4 for bi-weekly)
  installmentAmount: bigint;        // Amount per payment in wei
  totalCost: bigint;                // Principal + fees in wei
  apr: number;                      // Annual percentage rate (e.g., 0.12 for 12%)
  dueDates: number[];               // Unix timestamps for due dates
  merchant: string;                 // Merchant address
  status: 'available' | 'expired' | 'unavailable';
  tier: 'A' | 'B' | 'C' | 'D' | 'E';
  features: {
    noLateFees?: boolean;           // No late fees for on-time payments
    earlyPayoff?: boolean;          // Allow early payoff without penalty
    autoRepay?: boolean;            // Automatic repayment available
  };
}

interface OfferRequest {
  address: string;                  // User wallet address
  amount: number;                   // Cart total in USDC equivalent
  currency?: string;                // Currency code (default: 'USDC')
  includeFeatures?: boolean;        // Include offer features
}
```

#### Transaction Types
```typescript
interface TxResult {
  success: boolean;                 // Transaction success status
  txHash: string;                   // Transaction hash
  agreementId: string;              // Created agreement ID
  blockNumber: number;              // Block number
  gasUsed: number;                  // Gas used
  gasPrice: bigint;                 // Gas price in wei
  error?: string;                   // Error message if failed
  receipt?: TransactionReceipt;     // Full transaction receipt
}

interface AgreementStatus {
  id: string;                       // Agreement ID
  status: 'active' | 'completed' | 'defaulted' | 'written_off';
  paidInstallments: number;         // Number of paid installments
  totalInstallments: number;        // Total number of installments
  nextDueDate: number;              // Next due date timestamp
  nextAmount: bigint;               // Next payment amount
  remainingBalance: bigint;         // Remaining principal balance
  lastPaymentDate?: number;         // Last payment timestamp
  delinquencyDays: number;          // Days past due (0 if current)
}
```

#### Event Types
```typescript
interface AgreementEvent {
  type: 'created' | 'funded' | 'installment_paid' | 'late' | 'completed' | 'defaulted';
  agreementId: string;
  timestamp: number;
  data: any;
}

interface PaymentEvent {
  agreementId: string;
  installmentId: number;
  amount: bigint;
  timestamp: number;
  txHash: string;
}
```

### Core SDK Class

#### MorphCreditSDK
```typescript
class MorphCreditSDK {
  constructor(config: SDKConfig, options?: SDKOptions);
  
  // Core API methods
  getOffers(request: OfferRequest): Promise<Offer[]>;
  createAgreement(offerId: string): Promise<TxResult>;
  getAgreementStatus(agreementId: string): Promise<AgreementStatus>;
  
  // Event handling
  onAgreementCreated(callback: (agreement: AgreementStatus) => void): void;
  onInstallmentPaid(callback: (event: PaymentEvent) => void): void;
  onAgreementStatusChange(callback: (agreementId: string, status: string) => void): void;
  
  // Utility methods
  connectWallet(): Promise<string>;
  disconnectWallet(): void;
  getWalletAddress(): string | null;
  isWalletConnected(): boolean;
  
  // Configuration
  updateConfig(config: Partial<SDKConfig>): void;
  getConfig(): SDKConfig;
  
  // Error handling
  setErrorHandler(handler: (error: MorphCreditError) => void): void;
}
```

### React Components

#### MorphCreditButton
```typescript
interface MorphCreditButtonProps {
  amount: number;                    // Cart total in USDC
  userAddress?: string;             // Optional, auto-detect if connected
  onSuccess?: (result: TxResult) => void;
  onError?: (error: MorphCreditError) => void;
  onOffersLoaded?: (offers: Offer[]) => void;
  onWalletConnect?: (address: string) => void;
  disabled?: boolean;               // Disable button state
  className?: string;               // CSS classes
  style?: React.CSSProperties;      // Inline styles
  children?: React.ReactNode;       // Button content
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;                // Show loading state
  showOffers?: boolean;             // Show offer selector on click
}

const MorphCreditButton: React.FC<MorphCreditButtonProps>;
```

#### OfferSelector
```typescript
interface OfferSelectorProps {
  offers: Offer[];
  selectedOffer?: Offer;
  onSelect: (offer: Offer) => void;
  onClose?: () => void;
  className?: string;
  showFeatures?: boolean;
  showComparison?: boolean;
}

const OfferSelector: React.FC<OfferSelectorProps>;
```

### React Hooks

#### useOffers
```typescript
interface UseOffersOptions {
  address?: string;
  amount?: number;
  autoFetch?: boolean;
  refetchInterval?: number;
}

interface UseOffersResult {
  offers: Offer[];
  loading: boolean;
  error: MorphCreditError | null;
  refetch: () => Promise<void>;
  selectOffer: (offerId: string) => void;
  selectedOffer: Offer | null;
}

const useOffers: (options: UseOffersOptions) => UseOffersResult;
```

#### useAgreement
```typescript
interface UseAgreementOptions {
  agreementId?: string;
  autoFetch?: boolean;
  refetchInterval?: number;
}

interface UseAgreementResult {
  agreement: AgreementStatus | null;
  loading: boolean;
  error: MorphCreditError | null;
  refetch: () => Promise<void>;
  repay: (installmentId: number, amount: bigint) => Promise<TxResult>;
}

const useAgreement: (options: UseAgreementOptions) => UseAgreementResult;
```

#### useWallet
```typescript
interface UseWalletResult {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => Promise<string>;
  disconnect: () => void;
  error: MorphCreditError | null;
}

const useWallet: () => UseWalletResult;
```

## Usage Examples

### Basic Integration

#### 1. Initialize SDK
```typescript
import { MorphCreditSDK } from '@morphcredit/merchant-sdk';

const sdk = new MorphCreditSDK({
  rpcUrl: 'https://morph-testnet.rpc',
  contracts: {
    scoreOracle: '0x1234567890123456789012345678901234567890',
    creditRegistry: '0x2345678901234567890123456789012345678901',
    lendingPool: '0x3456789012345678901234567890123456789012',
    bnplFactory: '0x4567890123456789012345678901234567890123'
  },
  scoringService: 'https://scoring.morphcredit.xyz',
  networkId: 17000
}, {
  autoConnect: true,
  enableLogging: true,
  retryAttempts: 3
});
```

#### 2. Get BNPL Offers
```typescript
// Get offers for user and cart amount
const offers = await sdk.getOffers({
  address: '0x1234...',
  amount: 100.00,
  currency: 'USDC',
  includeFeatures: true
});

console.log('Available offers:', offers);
// [
//   {
//     id: 'offer_1',
//     principal: 100000000000000000000n, // 100 USDC
//     installments: 4,
//     installmentAmount: 26250000000000000000n, // 26.25 USDC
//     totalCost: 105000000000000000000n, // 105 USDC
//     apr: 0.20, // 20%
//     dueDates: [1640995200, 1641600000, 1642204800, 1642809600],
//     tier: 'B',
//     status: 'available'
//   }
// ]
```

#### 3. Create BNPL Agreement
```typescript
// Create agreement from selected offer
const result = await sdk.createAgreement('offer_1');

if (result.success) {
  console.log('Agreement created:', result.agreementId);
  console.log('Transaction hash:', result.txHash);
} else {
  console.error('Failed to create agreement:', result.error);
}
```

#### 4. React Component Integration
```typescript
import { MorphCreditButton, useOffers } from '@morphcredit/merchant-sdk';

function CheckoutPage() {
  const { offers, loading, error } = useOffers({
    address: '0x1234...',
    amount: 100.00,
    autoFetch: true
  });

  const handleSuccess = (result: TxResult) => {
    console.log('Payment successful:', result.txHash);
    // Redirect to success page
  };

  const handleError = (error: MorphCreditError) => {
    console.error('Payment failed:', error.message);
    // Show error message to user
  };

  return (
    <div>
      <h2>Checkout</h2>
      <p>Total: $100.00</p>
      
      <MorphCreditButton
        amount={100.00}
        onSuccess={handleSuccess}
        onError={handleError}
        onOffersLoaded={(offers) => console.log('Offers loaded:', offers)}
        variant="primary"
        size="lg"
        disabled={loading}
      >
        Pay with MorphCredit
      </MorphCreditButton>
      
      {error && <p className="error">{error.message}</p>}
    </div>
  );
}
```

### Advanced Integration

#### 1. Event Handling
```typescript
// Listen for agreement events
sdk.onAgreementCreated((agreement) => {
  console.log('New agreement created:', agreement.id);
  // Update merchant dashboard
});

sdk.onInstallmentPaid((event) => {
  console.log('Payment received:', event.amount);
  // Send notification to merchant
});

sdk.onAgreementStatusChange((agreementId, status) => {
  console.log('Agreement status changed:', agreementId, status);
  // Update UI accordingly
});
```

#### 2. Custom Offer Selection
```typescript
import { OfferSelector } from '@morphcredit/merchant-sdk';

function CustomCheckout() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [showSelector, setShowSelector] = useState(false);

  const handleGetOffers = async () => {
    const offers = await sdk.getOffers({
      address: '0x1234...',
      amount: 100.00
    });
    setOffers(offers);
    setShowSelector(true);
  };

  const handleSelectOffer = (offer: Offer) => {
    setSelectedOffer(offer);
    setShowSelector(false);
  };

  return (
    <div>
      <button onClick={handleGetOffers}>View BNPL Options</button>
      
      {showSelector && (
        <OfferSelector
          offers={offers}
          selectedOffer={selectedOffer}
          onSelect={handleSelectOffer}
          onClose={() => setShowSelector(false)}
          showFeatures={true}
          showComparison={true}
        />
      )}
      
      {selectedOffer && (
        <div>
          <h3>Selected Plan</h3>
          <p>{selectedOffer.installments} payments of ${formatAmount(selectedOffer.installmentAmount)}</p>
          <p>APR: {selectedOffer.apr * 100}%</p>
          <button onClick={() => sdk.createAgreement(selectedOffer.id)}>
            Confirm Purchase
          </button>
        </div>
      )}
    </div>
  );
}
```

#### 3. Agreement Management
```typescript
import { useAgreement } from '@morphcredit/merchant-sdk';

function AgreementDetails({ agreementId }: { agreementId: string }) {
  const { agreement, loading, error, repay } = useAgreement({
    agreementId,
    autoFetch: true,
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  const handleRepay = async (installmentId: number) => {
    try {
      const result = await repay(installmentId, agreement!.nextAmount);
      if (result.success) {
        console.log('Payment successful:', result.txHash);
      }
    } catch (error) {
      console.error('Payment failed:', error);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!agreement) return <div>Agreement not found</div>;

  return (
    <div>
      <h3>Agreement {agreement.id}</h3>
      <p>Status: {agreement.status}</p>
      <p>Progress: {agreement.paidInstallments}/{agreement.totalInstallments}</p>
      <p>Next Payment: ${formatAmount(agreement.nextAmount)}</p>
      <p>Due Date: {new Date(agreement.nextDueDate).toLocaleDateString()}</p>
      
      {agreement.delinquencyDays > 0 && (
        <p className="warning">Days Past Due: {agreement.delinquencyDays}</p>
      )}
      
      <button 
        onClick={() => handleRepay(agreement.paidInstallments + 1)}
        disabled={agreement.status !== 'active'}
      >
        Pay Next Installment
      </button>
    </div>
  );
}
```

## Merchant Demo Integration

### Step 1: Install SDK
```bash
npm install @morphcredit/merchant-sdk
# or
yarn add @morphcredit/merchant-sdk
```

### Step 2: Configure Environment
```typescript
// config/sdk.ts
export const sdkConfig = {
  rpcUrl: process.env.NEXT_PUBLIC_MORPH_RPC || 'https://morph-testnet.rpc',
  contracts: {
    scoreOracle: process.env.NEXT_PUBLIC_SCORE_ORACLE!,
    creditRegistry: process.env.NEXT_PUBLIC_CREDIT_REGISTRY!,
    lendingPool: process.env.NEXT_PUBLIC_LENDING_POOL!,
    bnplFactory: process.env.NEXT_PUBLIC_BNPL_FACTORY!,
  },
  scoringService: process.env.NEXT_PUBLIC_SCORING_SERVICE!,
  networkId: 17000
};
```

### Step 3: Initialize SDK Provider
```typescript
// providers/SDKProvider.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { MorphCreditSDK } from '@morphcredit/merchant-sdk';
import { sdkConfig } from '../config/sdk';

const SDKContext = createContext<MorphCreditSDK | null>(null);

export function SDKProvider({ children }: { children: React.ReactNode }) {
  const [sdk, setSdk] = useState<MorphCreditSDK | null>(null);

  useEffect(() => {
    const sdkInstance = new MorphCreditSDK(sdkConfig, {
      autoConnect: true,
      enableLogging: process.env.NODE_ENV === 'development'
    });
    
    setSdk(sdkInstance);
    
    return () => {
      sdkInstance.disconnectWallet();
    };
  }, []);

  return (
    <SDKContext.Provider value={sdk}>
      {children}
    </SDKContext.Provider>
  );
}

export const useSDK = () => {
  const sdk = useContext(SDKContext);
  if (!sdk) throw new Error('useSDK must be used within SDKProvider');
  return sdk;
};
```

### Step 4: Add to App
```typescript
// pages/_app.tsx
import { SDKProvider } from '../providers/SDKProvider';

function MyApp({ Component, pageProps }) {
  return (
    <SDKProvider>
      <Component {...pageProps} />
    </SDKProvider>
  );
}

export default MyApp;
```

### Step 5: Product Page Integration
```typescript
// pages/product/[id].tsx
import { MorphCreditButton } from '@morphcredit/merchant-sdk';
import { useState } from 'react';

export default function ProductPage({ product }) {
  const [cartTotal, setCartTotal] = useState(product.price);

  return (
    <div>
      <h1>{product.name}</h1>
      <p>Price: ${product.price}</p>
      
      <MorphCreditButton
        amount={cartTotal}
        onSuccess={(result) => {
          console.log('Purchase successful:', result.txHash);
          // Redirect to receipt page
          router.push(`/receipt/${result.agreementId}`);
        }}
        onError={(error) => {
          console.error('Purchase failed:', error.message);
          // Show error message
        }}
        variant="primary"
        size="lg"
      >
        Pay with MorphCredit
      </MorphCreditButton>
    </div>
  );
}
```

### Step 6: Checkout Page
```typescript
// pages/checkout.tsx
import { useOffers, useWallet } from '@morphcredit/merchant-sdk';
import { OfferSelector } from '@morphcredit/merchant-sdk';

export default function CheckoutPage() {
  const { address, isConnected, connect } = useWallet();
  const { offers, loading, selectOffer, selectedOffer } = useOffers({
    address,
    amount: 100.00,
    autoFetch: isConnected
  });

  if (!isConnected) {
    return (
      <div>
        <h2>Connect Wallet</h2>
        <button onClick={connect}>Connect Wallet</button>
      </div>
    );
  }

  return (
    <div>
      <h2>Checkout</h2>
      <p>Total: $100.00</p>
      
      {loading ? (
        <div>Loading offers...</div>
      ) : (
        <OfferSelector
          offers={offers}
          selectedOffer={selectedOffer}
          onSelect={selectOffer}
          showFeatures={true}
          showComparison={true}
        />
      )}
      
      {selectedOffer && (
        <div>
          <h3>Selected Plan</h3>
          <p>{selectedOffer.installments} payments of ${formatAmount(selectedOffer.installmentAmount)}</p>
          <p>APR: {selectedOffer.apr * 100}%</p>
          <button onClick={() => sdk.createAgreement(selectedOffer.id)}>
            Complete Purchase
          </button>
        </div>
      )}
    </div>
  );
}
```

## Error Handling

### Error Types
```typescript
class MorphCreditError extends Error {
  code: string;
  details?: any;
  retryable: boolean;
  
  constructor(code: string, message: string, details?: any, retryable = false) {
    super(message);
    this.code = code;
    this.details = details;
    this.retryable = retryable;
  }
}

enum ErrorCodes {
  // Wallet errors
  WALLET_NOT_CONNECTED = 'WALLET_NOT_CONNECTED',
  WALLET_CONNECTION_FAILED = 'WALLET_CONNECTION_FAILED',
  WRONG_NETWORK = 'WRONG_NETWORK',
  
  // Credit errors
  INSUFFICIENT_CREDIT = 'INSUFFICIENT_CREDIT',
  SCORE_NOT_FOUND = 'SCORE_NOT_FOUND',
  SCORE_EXPIRED = 'SCORE_EXPIRED',
  
  // Agreement errors
  AGREEMENT_FAILED = 'AGREEMENT_FAILED',
  AGREEMENT_NOT_FOUND = 'AGREEMENT_NOT_FOUND',
  AGREEMENT_EXPIRED = 'AGREEMENT_EXPIRED',
  
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  RPC_ERROR = 'RPC_ERROR',
  TIMEOUT = 'TIMEOUT',
  
  // User errors
  USER_REJECTED = 'USER_REJECTED',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  
  // Validation errors
  INVALID_ADDRESS = 'INVALID_ADDRESS',
  INVALID_AMOUNT = 'INVALID_AMOUNT',
  INVALID_OFFER = 'INVALID_OFFER'
}
```

### Error Handling Example
```typescript
const handleError = (error: MorphCreditError) => {
  switch (error.code) {
    case ErrorCodes.WALLET_NOT_CONNECTED:
      showMessage('Please connect your wallet to continue');
      break;
      
    case ErrorCodes.INSUFFICIENT_CREDIT:
      showMessage('Insufficient credit limit for this purchase');
      break;
      
    case ErrorCodes.SCORE_NOT_FOUND:
      showMessage('Credit score not found. Please try again later');
      break;
      
    case ErrorCodes.USER_REJECTED:
      showMessage('Transaction was cancelled');
      break;
      
    case ErrorCodes.NETWORK_ERROR:
      showMessage('Network error. Please check your connection and try again');
      break;
      
    default:
      showMessage('An unexpected error occurred. Please try again');
      console.error('Unhandled error:', error);
  }
  
  if (error.retryable) {
    showRetryButton(() => retryOperation());
  }
};
```

## Performance Optimization

### Caching Strategy
```typescript
// Cache offers for 5 minutes
const offerCache = new Map<string, { offers: Offer[], timestamp: number }>();

const getOffersWithCache = async (request: OfferRequest) => {
  const cacheKey = `${request.address}-${request.amount}`;
  const cached = offerCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
    return cached.offers;
  }
  
  const offers = await sdk.getOffers(request);
  offerCache.set(cacheKey, { offers, timestamp: Date.now() });
  return offers;
};
```

### Lazy Loading
```typescript
// Lazy load SDK components
const MorphCreditButton = lazy(() => import('@morphcredit/merchant-sdk').then(m => ({ default: m.MorphCreditButton })));

function LazyCheckout() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MorphCreditButton amount={100.00} />
    </Suspense>
  );
}
```

## Testing

### Unit Tests
```typescript
// __tests__/sdk.test.ts
import { MorphCreditSDK } from '@morphcredit/merchant-sdk';

describe('MorphCreditSDK', () => {
  let sdk: MorphCreditSDK;
  
  beforeEach(() => {
    sdk = new MorphCreditSDK(mockConfig);
  });
  
  test('should get offers for valid request', async () => {
    const offers = await sdk.getOffers({
      address: '0x1234...',
      amount: 100.00
    });
    
    expect(offers).toHaveLength(1);
    expect(offers[0].installments).toBe(4);
  });
  
  test('should handle insufficient credit', async () => {
    await expect(sdk.getOffers({
      address: '0x5678...',
      amount: 10000.00
    })).rejects.toThrow('INSUFFICIENT_CREDIT');
  });
});
```

### Integration Tests
```typescript
// __tests__/integration.test.ts
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MorphCreditButton } from '@morphcredit/merchant-sdk';

test('should complete BNPL purchase flow', async () => {
  render(<MorphCreditButton amount={100.00} />);
  
  const button = screen.getByText('Pay with MorphCredit');
  fireEvent.click(button);
  
  await waitFor(() => {
    expect(screen.getByText('Select Plan')).toBeInTheDocument();
  });
  
  const plan = screen.getByText('4 payments of $26.25');
  fireEvent.click(plan);
  
  await waitFor(() => {
    expect(screen.getByText('Purchase Complete')).toBeInTheDocument();
  });
});
```

## Security Considerations

1. **Private Key Security**: Never store private keys in the SDK
2. **Input Validation**: Validate all user inputs before processing
3. **Network Security**: Use HTTPS for all API communications
4. **Error Handling**: Don't expose sensitive information in error messages
5. **Rate Limiting**: Implement rate limiting for API calls
6. **Audit Logging**: Log all transactions for audit purposes 