# MorphCredit MVP Apps Specification

## Overview

This document specifies the user interface architecture, component structure, state management, and user experience flows for the MorphCredit MVP applications: Borrower PWA and Merchant Demo.

## Borrower PWA (React/Vite + wagmi/viem)

### Application Architecture

#### Tech Stack
- **Framework**: React 18 + Vite
- **Wallet Integration**: wagmi + viem
- **Styling**: Tailwind CSS + Headless UI
- **State Management**: Zustand + React Query
- **Routing**: React Router v6
- **Build**: PWA with service worker

#### Global State Management
```typescript
interface AppState {
  user: {
    address: Address;
    isConnected: boolean;
    chainId: number;
    score: number;
    limit: bigint;
    apr: number;
    isPublished: boolean;
  };
  agreements: BNPLAgreement[];
  notifications: Notification[];
  settings: {
    autoRepay: boolean;
    notifications: boolean;
    theme: 'light' | 'dark';
  };
  ui: {
    loading: boolean;
    error: string | null;
    sidebarOpen: boolean;
  };
}
```

### Routes & Components

#### `/` - Landing Page
**Component**: `LandingPage`
**Purpose**: Wallet connection and app introduction

**State**:
```typescript
interface LandingState {
  wallet: Address | null;
  isConnecting: boolean;
  supportedChains: number[];
  error: string | null;
}
```

**API Calls**:
- `wagmi.useAccount()` - Get connected account
- `wagmi.useConnect()` - Wallet connection
- `wagmi.useNetwork()` - Chain validation

**UX Flow**:
1. Display MorphCredit branding and value proposition
2. Show "Connect Wallet" button
3. Support MetaMask and WalletConnect
4. Validate chain (Morph testnet only)
5. Redirect to `/score` on successful connection

**Features**:
- Mobile-first responsive design
- Chain validation with helpful error messages
- Loading states during connection
- Fallback for unsupported wallets

#### `/score` - Credit Score & Publish
**Component**: `ScorePage`
**Purpose**: Display credit score and publish to blockchain

**State**:
```typescript
interface ScoreState {
  score: number;           // 300-900
  pd_bps: number;          // 0-10000
  limit: bigint;           // credit limit
  apr_bps: number;         // annual rate
  isPublished: boolean;    // on-chain status
  loading: boolean;
  error: string | null;
  rawFeatures?: {
    addressAge: number;
    activeDays: number;
    netInflow: number;
    stableBalance: number;
    txStreak: number;
    delinquencyFlags: number;
  };
}
```

**API Calls**:
- `POST /score` → signed ScoreReport
- `ScoreOracle.setScore()` → on-chain publish
- `CreditRegistry.getState()` → limit/APR

**UX Flow**:
1. Show loading spinner while fetching score
2. Display score with visual indicator (300-900 scale)
3. Show PD explanation and tier classification
4. Display credit limit and APR
5. Show "Publish to Chain" button if not published
6. Handle transaction confirmation and gas estimation

**Features**:
- Score visualization with color-coded tiers
- PD explanation tooltip
- Gas estimation for on-chain publish
- Transaction status tracking
- Error handling with retry options

#### `/repay` - Repayment Dashboard
**Component**: `RepayPage`
**Purpose**: Manage BNPL agreements and payments

**State**:
```typescript
interface RepayState {
  agreements: BNPLAgreement[];
  schedule: Installment[];
  autoRepayEnabled: boolean;
  notifications: Notification[];
  loading: boolean;
  selectedAgreement: string | null;
  paymentInProgress: boolean;
}
```

**API Calls**:
- `BNPLAgreement.getAgreements()` → user's active agreements
- `BNPLAgreement.repay()` → installment payment
- `BNPLAgreement.toggleAutoRepay()` → auto-payment setup

**UX Flow**:
1. Load user's active agreements
2. Display installment schedule with due dates
3. Show "Pay Now" buttons for each installment
4. Toggle auto-repay functionality
5. Display penalty timers and late fees
6. Show payment confirmation and transaction status

**Features**:
- Installment schedule with visual timeline
- Payment buttons with amount display
- Auto-repay toggle with confirmation
- Penalty timer countdown
- On-time payment streak badges
- Transaction history

#### `/settings` - User Settings
**Component**: `SettingsPage`
**Purpose**: Manage user preferences and notifications

**State**:
```typescript
interface SettingsState {
  autoRepay: boolean;
  notifications: {
    dueSoon: boolean;
    dueToday: boolean;
    overdue: boolean;
    paymentConfirmations: boolean;
  };
  theme: 'light' | 'dark';
  language: string;
  privacy: {
    shareAnalytics: boolean;
    shareData: boolean;
  };
}
```

**Features**:
- Auto-repay toggle with explanation
- Notification preferences
- Theme selection
- Privacy settings
- Export transaction history

### Shared Components

#### `WalletConnect`
```typescript
interface WalletConnectProps {
  onConnect: (address: Address) => void;
  onError: (error: Error) => void;
  supportedChains: number[];
  children: React.ReactNode;
}
```

**Features**:
- MetaMask and WalletConnect support
- Chain validation
- Connection status display
- Error handling with retry

#### `LoadingSpinner`
```typescript
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  overlay?: boolean;
}
```

#### `ErrorBoundary`
```typescript
interface ErrorBoundaryProps {
  fallback: React.ComponentType<{ error: Error; reset: () => void }>;
  children: React.ReactNode;
}
```

#### `NotificationToast`
```typescript
interface NotificationToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  onClose?: () => void;
}
```

## Merchant Demo (Next.js/Vite)

### Application Architecture

#### Tech Stack
- **Framework**: Next.js 14 + Vite
- **Styling**: Tailwind CSS + Radix UI
- **State Management**: Zustand
- **SDK Integration**: MorphCredit Merchant SDK
- **Database**: Local storage + IndexedDB

#### Global State Management
```typescript
interface MerchantState {
  products: Product[];
  cart: CartItem[];
  userAddress: Address | null;
  offers: Offer[];
  selectedOffer: Offer | null;
  agreementId: string | null;
  morphCreditEnabled: boolean;
  ui: {
    loading: boolean;
    error: string | null;
  };
}
```

### Routes & Components

#### `/` - Product Catalog
**Component**: `ProductPage`
**Purpose**: Display products and enable BNPL checkout

**State**:
```typescript
interface ProductState {
  products: Product[];
  cart: CartItem[];
  morphCreditEnabled: boolean;
  loading: boolean;
  filters: {
    category: string;
    priceRange: [number, number];
    sortBy: 'name' | 'price' | 'popularity';
  };
}
```

**API Calls**:
- Local product data
- Cart management (local storage)

**UX Flow**:
1. Display product grid with images and prices
2. Add items to cart with quantity selection
3. Show cart total and "Pay with MorphCredit" button
4. Enable BNPL only if user has valid score
5. Redirect to checkout on button click

**Features**:
- Product grid with search and filters
- Cart management with quantity controls
- BNPL availability indicator
- Mobile-responsive design

#### `/checkout` - BNPL Checkout Flow
**Component**: `CheckoutPage`
**Purpose**: Complete BNPL purchase flow

**State**:
```typescript
interface CheckoutState {
  cart: CartItem[];
  userAddress: Address | null;
  offers: Offer[];
  selectedOffer: Offer | null;
  agreementId: string | null;
  loading: boolean;
  step: 'cart' | 'offers' | 'confirmation' | 'success';
}
```

**API Calls**:
- `getOffer(address, amount)` → 4× bi-weekly plans
- `createAgreement(offerId)` → BNPL deployment
- `BNPLAgreement.fund()` → merchant payment

**UX Flow**:
1. Display cart summary and total
2. Connect wallet if not connected
3. Fetch BNPL offers for user and amount
4. Display offer options (4× bi-weekly plans)
5. User selects preferred offer
6. Create agreement and fund merchant
7. Show success confirmation

**Features**:
- Multi-step checkout process
- Offer comparison with APR and fees
- Transaction status tracking
- Error handling with retry options
- Mobile-optimized flow

#### `/receipt/:agreementId` - On-Chain Receipt
**Component**: `ReceiptPage`
**Purpose**: Display purchase confirmation and agreement details

**State**:
```typescript
interface ReceiptState {
  agreement: BNPLAgreement | null;
  txHash: string | null;
  merchantPaid: boolean;
  loading: boolean;
  error: string | null;
}
```

**API Calls**:
- `BNPLAgreement.getAgreement()`
- `getTransactionReceipt()`

**UX Flow**:
1. Load agreement details from blockchain
2. Display transaction hash and confirmation
3. Show "Paid on Chain" status
4. Display installment schedule
5. Provide block explorer links

**Features**:
- Transaction hash display with copy button
- Block explorer integration
- Installment schedule visualization
- Print/share receipt functionality

#### `/admin` - Demo Management
**Component**: `AdminPage`
**Purpose**: Manage demo products and view analytics

**State**:
```typescript
interface AdminState {
  products: Product[];
  orders: Order[];
  analytics: {
    totalSales: number;
    conversionRate: number;
    averageOrderValue: number;
  };
  loading: boolean;
}
```

**Features**:
- Product management (add/edit/remove)
- Order history and analytics
- BNPL conversion tracking
- Demo configuration

### SDK Integration

#### `<MorphCreditButton />`
```typescript
interface MorphCreditButtonProps {
  amount: number;
  userAddress?: string;
  onSuccess?: (result: TxResult) => void;
  onError?: (error: Error) => void;
  onOffersLoaded?: (offers: Offer[]) => void;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}
```

**Features**:
- Drop-in React component
- Automatic offer fetching
- Wallet connection handling
- Loading states and error handling
- Customizable styling

## UX Flows

### Primary User Journey: Score → BNPL → Repay

#### 1. Score Acquisition Flow
```
Connect Wallet → Fetch Score → Display Results → Publish to Chain
     ↓              ↓              ↓              ↓
   MetaMask    POST /score    Score Display   ScoreOracle.setScore()
```

#### 2. BNPL Purchase Flow
```
Browse Products → Add to Cart → Checkout → Select Offer → Complete Purchase
      ↓              ↓           ↓           ↓              ↓
   ProductPage   Cart State   CheckoutPage  Offer Selection  Agreement Creation
```

#### 3. Repayment Flow
```
View Schedule → Select Installment → Pay → Confirm → Update Status
      ↓              ↓              ↓      ↓          ↓
   RepayPage    Installment Card  Pay Now  Transaction  Real-time Update
```

### Error Handling Flows

#### Network Error Recovery
```
Error Detected → Show Error Message → Retry Button → Re-attempt Operation
      ↓              ↓                    ↓              ↓
   API Failure   User Notification    User Action    Automatic Retry
```

#### Wallet Connection Issues
```
Connection Failed → Show Help Text → Alternative Wallets → Manual Retry
      ↓              ↓                ↓                ↓
   MetaMask Error  Troubleshooting  WalletConnect    User Retry
```

## API Integration

### Smart Contract Calls

#### ScoreOracle Integration
```typescript
// Publish score to blockchain
const publishScore = async (scoreReport: ScoreReport) => {
  const tx = await scoreOracle.setScore(userAddress, scoreReport);
  await tx.wait();
  return tx.hash;
};
```

#### CreditRegistry Integration
```typescript
// Get user credit state
const getCreditState = async (address: Address) => {
  return await creditRegistry.getState(address);
};
```

#### BNPLAgreement Integration
```typescript
// Get user agreements
const getAgreements = async (address: Address) => {
  // Query events or use subgraph
  return await bnplFactory.getAgreementsByBorrower(address);
};

// Repay installment
const repayInstallment = async (agreementId: string, installmentId: number, amount: bigint) => {
  const agreement = await bnplFactory.getAgreement(agreementId);
  const tx = await agreement.repay(installmentId, amount);
  await tx.wait();
  return tx.hash;
};
```

### External API Calls

#### Scoring Service
```typescript
// Request credit score
const requestScore = async (address: Address) => {
  const response = await fetch('/api/score', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address })
  });
  return response.json();
};
```

#### Real-time Updates
```typescript
// WebSocket for payment confirmations
const ws = new WebSocket('wss://api.morphcredit.xyz/events');
ws.onmessage = (event) => {
  const { type, data } = JSON.parse(event.data);
  if (type === 'PAYMENT_CONFIRMED') {
    updatePaymentStatus(data.agreementId, data.installmentId);
  }
};
```

## Performance Requirements

### Loading Times
- **Initial App Load**: < 3 seconds
- **Score Request**: < 5 seconds
- **BNPL Checkout**: < 10 seconds
- **Payment Confirmation**: < 2 seconds

### Responsiveness
- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px
- **Desktop**: 1024px+

### Accessibility
- **WCAG 2.1 AA** compliance
- **Keyboard navigation** support
- **Screen reader** compatibility
- **High contrast** mode support

## Security Considerations

1. **Wallet Security**: No private key storage in app
2. **Input Validation**: Sanitize all user inputs
3. **HTTPS**: TLS 1.3 for all communications
4. **CORS**: Restrict cross-origin requests
5. **Rate Limiting**: Prevent API abuse
6. **Error Handling**: No sensitive data in error messages 