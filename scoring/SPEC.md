# MorphCredit MVP Scoring Service Specification

## Overview

This document specifies the credit scoring algorithm, feature extraction, probability of default (PD) calculation, score mapping, API endpoints, and testing requirements for the MorphCredit MVP.

## Feature Engineering

### Core Features (v0 Heuristic)

#### 1. Address Age (f₁)
**Purpose**: Sybil resistance and wallet maturity indicator
**Calculation**: `f₁ = min((current_timestamp - first_tx_timestamp) / 86400, 365) / 365`
**Range**: [0, 1] (normalized to 1 year max)
**Weight**: b₁ = 0.25

#### 2. Active Days (f₂)
**Purpose**: Transaction frequency and engagement
**Calculation**: `f₂ = COUNT(DISTINCT date) FROM tx_history WHERE date >= now - 180d`
**Normalization**: `f₂ = min(active_days / 180, 1)`
**Range**: [0, 1]
**Weight**: b₂ = 0.20

#### 3. 30d Net Inflow (f₃)
**Purpose**: Income stability and cash flow quality
**Calculation**: `f₃ = MEDIAN(daily_net_stablecoin) OVER 30 days`
**Normalization**: `f₃ = max(min(net_inflow / 1000, 1), -1)` (cap at ±1000 USDC)
**Range**: [-1, 1]
**Weight**: b₃ = 0.30

#### 4. Stable Balance Average (f₄)
**Purpose**: Asset quality and financial stability
**Calculation**: `f₄ = AVG(stablecoin_balance) OVER 30 days WITH 7d moving window`
**Normalization**: `f₄ = min(stable_balance / 5000, 1)` (cap at 5000 USDC)
**Range**: [0, 1]
**Weight**: b₄ = 0.15

#### 5. Transaction Streak (f₅)
**Purpose**: Consistency and reliability
**Calculation**: `f₅ = MAX(consecutive_days_with_tx) FROM tx_history`
**Normalization**: `f₅ = min(tx_streak / 30, 1)` (cap at 30 days)
**Range**: [0, 1]
**Weight**: b₅ = 0.10

#### 6. Delinquency Flags (f₆)
**Purpose**: Historical payment behavior
**Calculation**: `f₆ = -1 * (missed_payments_count / total_payments_count)`
**Range**: [-1, 0] (negative impact)
**Weight**: b₆ = -0.20

## Probability of Default (PD) Calculation

### Logistic Regression Model

**Formula**: PD = σ(a + Σbᵢfᵢ) = 1/(1 + e^-(a+Σbᵢfᵢ))

**Parameters**:
- Intercept: a = -2.5 (base logit)
- Feature weights: [b₁, b₂, b₃, b₄, b₅, b₆] = [0.25, 0.20, 0.30, 0.15, 0.10, -0.20]

**Calculation Steps**:
1. Extract raw features from blockchain data
2. Normalize features to [0,1] or [-1,1] ranges
3. Compute weighted sum: z = a + Σbᵢfᵢ
4. Apply sigmoid: PD = 1/(1 + e^(-z))
5. Convert to basis points: pd_bps = PD × 10000

### Score Mapping

**Score Range**: [300, 900]

**Mapping Function**: S = 300 + (1 - PD) × 600

**Tier Boundaries**:
- **Tier A**: S ≥ 760 or PD ≤ 2% (200 bps)
- **Tier B**: 700 ≤ S < 760 or PD ≤ 5% (500 bps)
- **Tier C**: 640 ≤ S < 700 or PD ≤ 10% (1000 bps)
- **Tier D**: 580 ≤ S < 640 or PD ≤ 18% (1800 bps)
- **Tier E**: S < 580 or PD > 18% (no credit / secured mode)

## API Specification

### POST /score

#### Request Schema
```typescript
interface ScoreRequest {
  address: string;                    // 0x-prefixed Ethereum address
  featureCommitments?: string[];      // Optional pre-computed feature hashes
  includeRawFeatures?: boolean;       // Include raw feature values in response
}
```

#### Response Schema
```typescript
interface ScoreResponse {
  score: number;                      // 300-900
  pd_bps: number;                     // 0-10000 (basis points)
  featuresRoot: string;               // Merkle root of feature commitments
  expiry: number;                     // Unix timestamp (30-day validity)
  sig: string;                        // ECDSA signature
  rawFeatures?: {                     // Optional raw feature values
    addressAge: number;
    activeDays: number;
    netInflow: number;
    stableBalance: number;
    txStreak: number;
    delinquencyFlags: number;
  };
  tier: 'A' | 'B' | 'C' | 'D' | 'E';
  confidence: number;                 // 0-1 confidence score
}
```

#### Error Responses
```typescript
interface ScoreError {
  error: string;
  code: 'INVALID_ADDRESS' | 'RATE_LIMITED' | 'SCORE_NOT_FOUND' | 'INTERNAL_ERROR';
  message: string;
  retryAfter?: number;                // Seconds to wait for rate limit
}
```

### GET /health

**Response**: `{ "status": "healthy", "timestamp": number, "version": "1.0.0" }`

## Signer Workflow

### 1. Feature Extraction
```typescript
async function extractFeatures(address: string): Promise<FeatureVector> {
  const [firstTx, txHistory, balanceHistory] = await Promise.all([
    getFirstTransaction(address),
    getTransactionHistory(address, 180), // 180 days
    getBalanceHistory(address, 30)       // 30 days
  ]);
  
  return {
    addressAge: calculateAddressAge(firstTx.timestamp),
    activeDays: countActiveDays(txHistory),
    netInflow: calculateNetInflow(txHistory),
    stableBalance: calculateStableBalance(balanceHistory),
    txStreak: calculateTxStreak(txHistory),
    delinquencyFlags: getDelinquencyFlags(address)
  };
}
```

### 2. Feature Normalization
```typescript
function normalizeFeatures(features: FeatureVector): NormalizedFeatures {
  return {
    f1: Math.min((features.addressAge / 86400) / 365, 1),
    f2: Math.min(features.activeDays / 180, 1),
    f3: Math.max(Math.min(features.netInflow / 1000, 1), -1),
    f4: Math.min(features.stableBalance / 5000, 1),
    f5: Math.min(features.txStreak / 30, 1),
    f6: -1 * (features.delinquencyFlags / Math.max(features.totalPayments, 1))
  };
}
```

### 3. PD Calculation
```typescript
function calculatePD(features: NormalizedFeatures): number {
  const weights = [0.25, 0.20, 0.30, 0.15, 0.10, -0.20];
  const intercept = -2.5;
  
  const z = intercept + weights.reduce((sum, w, i) => 
    sum + w * Object.values(features)[i], 0
  );
  
  return 1 / (1 + Math.exp(-z));
}
```

### 4. Score Mapping
```typescript
function mapScoreToTier(pd: number): { score: number, tier: string } {
  const score = 300 + (1 - pd) * 600;
  
  if (score >= 760 || pd <= 0.02) return { score, tier: 'A' };
  if (score >= 700 || pd <= 0.05) return { score, tier: 'B' };
  if (score >= 640 || pd <= 0.10) return { score, tier: 'C' };
  if (score >= 580 || pd <= 0.18) return { score, tier: 'D' };
  return { score, tier: 'E' };
}
```

### 5. Feature Commitment
```typescript
function createFeatureCommitment(features: FeatureVector): string {
  const leaves = Object.entries(features).map(([key, value]) => 
    ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(
      ['string', 'uint256'], [key, value]
    ))
  );
  
  return createMerkleRoot(leaves);
}
```

### 6. ECDSA Signing
```typescript
function signScoreReport(report: ScoreReport, privateKey: string): string {
  const domain = {
    name: 'MorphCredit Score Oracle',
    version: '1.0.0',
    chainId: 17000 // Morph testnet
  };
  
  const types = {
    ScoreReport: [
      { name: 'score', type: 'uint16' },
      { name: 'pd_bps', type: 'uint16' },
      { name: 'featuresRoot', type: 'bytes32' },
      { name: 'expiry', type: 'uint64' }
    ]
  };
  
  const wallet = new ethers.Wallet(privateKey);
  return wallet._signTypedData(domain, types, report);
}
```

## Rate Limiting

### Implementation
- **Window**: 1 minute sliding window
- **Limit**: 5 requests per IP address
- **Storage**: Redis with TTL
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

### Rate Limit Response
```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1640995200
Retry-After: 60

{
  "error": "RATE_LIMITED",
  "message": "Rate limit exceeded. Try again in 60 seconds.",
  "retryAfter": 60
}
```

## Test Vectors

### Feature Calculation Tests

#### Test Case 1: New Wallet
```typescript
const newWallet = {
  address: "0x1234...",
  firstTx: { timestamp: Date.now() - 86400 }, // 1 day ago
  txHistory: [{ date: "2025-07-28" }],
  balanceHistory: [{ balance: 100, timestamp: Date.now() }]
};

// Expected features
const expected = {
  addressAge: 1/365,      // 1 day normalized
  activeDays: 1/180,      // 1 day out of 180
  netInflow: 0,           // No transactions
  stableBalance: 100/5000, // 100 USDC normalized
  txStreak: 1/30,         // 1 day streak
  delinquencyFlags: 0     // No history
};

// Expected PD ≈ 0.15 (15%), Score ≈ 510, Tier D
```

#### Test Case 2: Established User
```typescript
const establishedUser = {
  address: "0x5678...",
  firstTx: { timestamp: Date.now() - 365 * 86400 }, // 1 year ago
  txHistory: Array.from({length: 90}, (_, i) => ({ 
    date: new Date(Date.now() - i * 86400).toISOString().split('T')[0] 
  })),
  balanceHistory: Array.from({length: 30}, (_, i) => ({ 
    balance: 2000 + Math.sin(i) * 500, 
    timestamp: Date.now() - i * 86400 
  }))
};

// Expected features
const expected = {
  addressAge: 1.0,        // Full year
  activeDays: 90/180,     // 90 days out of 180
  netInflow: 0.5,         // Positive inflow
  stableBalance: 2000/5000, // 2000 USDC average
  txStreak: 30/30,        // 30 day streak
  delinquencyFlags: 0     // Good history
};

// Expected PD ≈ 0.03 (3%), Score ≈ 780, Tier A
```

#### Test Case 3: Delinquent User
```typescript
const delinquentUser = {
  address: "0x9abc...",
  firstTx: { timestamp: Date.now() - 180 * 86400 }, // 6 months ago
  txHistory: Array.from({length: 30}, (_, i) => ({ 
    date: new Date(Date.now() - i * 86400).toISOString().split('T')[0] 
  })),
  balanceHistory: Array.from({length: 30}, (_, i) => ({ 
    balance: 100, 
    timestamp: Date.now() - i * 86400 
  })),
  missedPayments: 3,
  totalPayments: 10
};

// Expected features
const expected = {
  addressAge: 0.5,        // 6 months
  activeDays: 30/180,     // 30 days out of 180
  netInflow: -0.1,        // Negative inflow
  stableBalance: 100/5000, // Low balance
  txStreak: 5/30,         // Short streak
  delinquencyFlags: -0.3  // 30% missed payments
};

// Expected PD ≈ 0.25 (25%), Score ≈ 450, Tier E
```

### PD Calculation Tests

#### Test Case 4: Perfect Score
```typescript
const perfectFeatures = {
  f1: 1.0,   // 1 year old
  f2: 1.0,   // 180 active days
  f3: 1.0,   // High positive inflow
  f4: 1.0,   // High stable balance
  f5: 1.0,   // 30 day streak
  f6: 0.0    // No delinquencies
};

// z = -2.5 + 0.25 + 0.20 + 0.30 + 0.15 + 0.10 + 0 = -1.5
// PD = 1/(1 + e^1.5) ≈ 0.18 (1.8%)
// Score = 300 + (1 - 0.018) × 600 ≈ 889
// Tier A
```

#### Test Case 5: Poor Score
```typescript
const poorFeatures = {
  f1: 0.1,   // New wallet
  f2: 0.1,   // Few active days
  f3: -1.0,  // Negative inflow
  f4: 0.1,   // Low balance
  f5: 0.1,   // Short streak
  f6: -1.0   // High delinquencies
};

// z = -2.5 + 0.025 + 0.02 - 0.30 + 0.015 + 0.01 + 0.20 = -2.53
// PD = 1/(1 + e^2.53) ≈ 0.92 (92%)
// Score = 300 + (1 - 0.92) × 600 ≈ 348
// Tier E
```

## Performance Requirements

### Latency Targets
- **Feature Extraction**: ≤ 3 seconds
- **PD Calculation**: ≤ 100ms
- **Total Response Time**: ≤ 5 seconds
- **Caching**: 24-hour cooldown per address

### Accuracy Targets
- **Approval Rate**: 40-60% for Tier-0 users
- **Average PD**: < 6% for approved borrowers
- **False Positive Rate**: < 10%
- **False Negative Rate**: < 15%

### Availability
- **Uptime**: 99.5% during demo window
- **Error Rate**: < 1% of requests
- **Recovery Time**: < 30 seconds after failure

## Security Considerations

1. **Private Key Management**: HSM or secure KMS for oracle signing
2. **Rate Limiting**: Prevent abuse and DoS attacks
3. **Input Validation**: Sanitize all address inputs
4. **Error Handling**: No sensitive data in error messages
5. **Logging**: No PII in application logs
6. **CORS**: Restrict cross-origin requests
7. **HTTPS**: TLS 1.3 for all communications 