# MorphCredit MVP Contracts Specification

## Overview

This document specifies the smart contract interfaces, events, storage structures, roles, error codes, and testing requirements for the MorphCredit MVP protocol.

## Core Contracts

### 1. ScoreOracle.sol

#### Interfaces
```solidity
interface IScoreOracle {
    function setScore(address user, ScoreReport calldata sr) external;
    function getScore(address user) external view returns (ScoreReport memory);
    function getOracleSigner() external view returns (address);
    function setOracleSigner(address newSigner) external;
}
```

#### Storage Structs
```solidity
struct ScoreReport {
    uint16 score;         // 300..900
    uint16 pd_bps;        // 0..10000 (basis points)
    bytes32 featuresRoot; // Merkle root of feature commitments
    uint64  expiry;       // unix timestamp (30-day validity)
    bytes   sig;          // ECDSA oracle signature
}
```

#### Events
```solidity
event ScoreSet(
    address indexed user,
    uint16 score,
    uint16 pd_bps,
    uint64 expiry,
    bytes32 featuresRoot
);

event OracleSignerUpdated(address indexed oldSigner, address indexed newSigner);
```

#### Roles
- `DEFAULT_ADMIN_ROLE`: Can update oracle signer
- `ORACLE_SIGNER_ROLE`: Can set scores (ECDSA signer)

#### Error Codes
```solidity
error ScoreOracle_InvalidSignature();
error ScoreOracle_ScoreExpired();
error ScoreOracle_InvalidScore();
error ScoreOracle_Unauthorized();
error ScoreOracle_ScoreAlreadyExists();
```

### 2. CreditRegistry.sol

#### Interfaces
```solidity
interface ICreditRegistry {
    function getState(address user) external view returns (CreditState memory);
    function markDelinquent(address user) external;
    function updateUtilization(uint256 newUtilization) external;
    function getTierConfig(uint8 tier) external view returns (TierConfig memory);
}
```

#### Storage Structs
```solidity
struct CreditState {
    uint256 limit;        // Credit limit in wei
    uint256 utilized;     // Currently utilized amount
    uint16  apr_bps;      // Annual percentage rate in basis points
    uint64  lastUpdate;   // Last update timestamp
    bool    delinquent;   // Delinquency flag
}

struct TierConfig {
    uint256 maxLimit;     // Maximum limit for tier
    uint16  baseApr;      // Base APR for tier
    uint16  pdMultiplier; // PD multiplier for tier
    bool    active;       // Tier availability
}
```

#### Events
```solidity
event CreditStateUpdated(
    address indexed user,
    uint256 limit,
    uint256 utilized,
    uint16 apr_bps,
    bool delinquent
);

event DelinquencyMarked(address indexed user, uint64 timestamp);
event TierConfigUpdated(uint8 indexed tier, uint256 maxLimit, uint16 baseApr);
```

#### Roles
- `DEFAULT_ADMIN_ROLE`: Can update tier configurations
- `REGISTRY_ROLE`: Can mark delinquencies and update utilization

#### Error Codes
```solidity
error CreditRegistry_InvalidTier();
error CreditRegistry_UserNotFound();
error CreditRegistry_LimitExceeded();
error CreditRegistry_Unauthorized();
error CreditRegistry_InvalidAPR();
```

### 3. LendingPool.sol (ERC4626-like)

#### Interfaces
```solidity
interface ILendingPool {
    function depositSenior(uint256 amt) external;
    function depositJunior(uint256 amt) external;
    function withdraw(uint256 shares, bool senior) external;
    function borrow(address to, uint256 amt, uint8 tier) external;
    function repay(uint256 amt) external;
    function utilization() external view returns (uint256);
    function totalAssets() external view returns (uint256);
    function reserveBalance() external view returns (uint256);
}
```

#### Storage Structs
```solidity
struct PoolState {
    uint256 totalSeniorShares;
    uint256 totalJuniorShares;
    uint256 totalBorrowed;
    uint256 totalReserve;
    uint256 lastInterestAccrual;
    uint256 utilizationCap;    // 85% = 8500
    uint256 reserveRatio;      // 25% = 2500
}

struct TrancheInfo {
    uint256 shares;
    uint256 assets;
    uint256 apr;
}
```

#### Events
```solidity
event SeniorDeposited(address indexed user, uint256 amount, uint256 shares);
event JuniorDeposited(address indexed user, uint256 amount, uint256 shares);
event Withdrawn(address indexed user, uint256 shares, uint256 assets, bool senior);
event Borrowed(address indexed to, uint256 amount, uint8 tier);
event Repaid(address indexed from, uint256 amount);
event InterestAccrued(uint256 seniorInterest, uint256 juniorInterest, uint256 reserve);
event UtilizationUpdated(uint256 utilization);
```

#### Roles
- `DEFAULT_ADMIN_ROLE`: Can update pool parameters
- `BORROWER_ROLE`: Can borrow from pool (BNPLAgreement, LineOfCredit)
- `REGISTRY_ROLE`: Can read utilization

#### Error Codes
```solidity
error LendingPool_UtilizationCapExceeded();
error LendingPool_InsufficientLiquidity();
error LendingPool_InvalidAmount();
error LendingPool_Unauthorized();
error LendingPool_TransferFailed();
error LendingPool_InterestAccrualFailed();
```

### 4. BNPLAgreement.sol

#### Interfaces
```solidity
interface IBNPLAgreement {
    function fund(address merchant, uint256 principal, uint8 n, uint64[] calldata dueDates) external;
    function repay(uint256 installmentId, uint256 amt) external;
    function penalize() external;
    function writeOff() external;
    function getAgreement() external view returns (AgreementInfo memory);
}
```

#### Storage Structs
```solidity
struct AgreementInfo {
    address borrower;
    address merchant;
    uint256 principal;
    uint8   numInstallments;
    uint16  apr_bps;
    uint16  penalty_bps;
    uint64  gracePeriod;      // 5 days
    uint64  writeOffPeriod;   // 60 days
    uint64  createdAt;
    bool    active;
    bool    writtenOff;
}

struct Installment {
    uint64  dueAt;
    uint256 amount;
    uint64  paidAt;
    bool    paid;
    bool    late;
}
```

#### Events
```solidity
event AgreementFunded(
    address indexed borrower,
    address indexed merchant,
    uint256 principal,
    uint8 numInstallments,
    uint16 apr_bps
);

event InstallmentPaid(
    address indexed borrower,
    uint256 installmentId,
    uint256 amount,
    uint64 paidAt
);

event Late(address indexed borrower, uint256 installmentId, uint64 dueAt);
event WrittenOff(address indexed borrower, uint64 writeOffAt);
```

#### Roles
- `FACTORY_ROLE`: Can create new agreements
- `REGISTRY_ROLE`: Can mark delinquencies

#### Error Codes
```solidity
error BNPLAgreement_InvalidInstallment();
error BNPLAgreement_AlreadyPaid();
error BNPLAgreement_NotDue();
error BNPLAgreement_InvalidAmount();
error BNPLAgreement_Unauthorized();
error BNPLAgreement_AgreementInactive();
```

### 5. LineOfCredit.sol (Optional MVP)

#### Interfaces
```solidity
interface ILineOfCredit {
    function open(uint256 limit) external;
    function draw(uint256 amount) external;
    function repay(uint256 amount) external;
    function close() external;
    function getCreditLine() external view returns (CreditLineInfo memory);
}
```

#### Storage Structs
```solidity
struct CreditLineInfo {
    uint256 limit;
    uint256 drawn;
    uint256 available;
    uint16  apr_bps;
    uint64  openedAt;
    bool    active;
}
```

#### Events
```solidity
event CreditLineOpened(address indexed borrower, uint256 limit, uint16 apr_bps);
event AmountDrawn(address indexed borrower, uint256 amount);
event AmountRepaid(address indexed borrower, uint256 amount);
event CreditLineClosed(address indexed borrower);
```

## Unit Test Matrix

### ScoreOracle Tests
- [ ] `test_setScore_valid_signature()` - Valid ECDSA signature acceptance
- [ ] `test_setScore_invalid_signature()` - Reject invalid signatures
- [ ] `test_setScore_expired()` - Reject expired scores
- [ ] `test_setScore_unauthorized()` - Reject non-oracle calls
- [ ] `test_getScore_not_found()` - Return empty for non-existent scores
- [ ] `test_oracle_signer_update()` - Admin can update signer

### CreditRegistry Tests
- [ ] `test_getState_no_score()` - Return zero state for new users
- [ ] `test_limit_calculation()` - Correct limit based on score and tier
- [ ] `test_apr_calculation()` - Dynamic APR based on utilization and PD
- [ ] `test_mark_delinquent()` - Registry can mark delinquencies
- [ ] `test_tier_config_updates()` - Admin can update tier configurations
- [ ] `test_utilization_impact()` - APR changes with utilization

### LendingPool Tests
- [ ] `test_senior_deposit()` - Senior tranche deposits work correctly
- [ ] `test_junior_deposit()` - Junior tranche deposits work correctly
- [ ] `test_withdraw_senior()` - Senior withdrawals with correct shares
- [ ] `test_withdraw_junior()` - Junior withdrawals with correct shares
- [ ] `test_borrow_authorized()` - Only authorized contracts can borrow
- [ ] `test_repay_reduces_debt()` - Repayments reduce total borrowed
- [ ] `test_interest_accrual()` - Interest accrues correctly over time
- [ ] `test_reserve_siphoning()` - 25% of interest goes to reserve
- [ ] `test_utilization_cap()` - Borrowing stops at 85% utilization
- [ ] `test_total_assets_conservation()` - Assets are conserved in all operations

### BNPLAgreement Tests
- [ ] `test_fund_agreement()` - Agreement funding pays merchant
- [ ] `test_installment_payment()` - Installment payments work correctly
- [ ] `test_late_penalty()` - Late fees applied after grace period
- [ ] `test_write_off()` - Write-off after 60 days of delinquency
- [ ] `test_partial_payment()` - Partial payments handled correctly
- [ ] `test_agreement_completion()` - Agreement marked complete when all paid
- [ ] `test_unauthorized_repay()` - Only borrower can repay

### Integration Tests
- [ ] `test_end_to_end_bnpl()` - Complete BNPL flow: score → borrow → repay
- [ ] `test_utilization_impact_on_apr()` - APR changes affect new agreements
- [ ] `test_delinquency_propagation()` - Delinquency marks update registry
- [ ] `test_reserve_waterfall()` - Reserve absorbs losses correctly
- [ ] `test_circuit_breaker()` - Pool pauses at utilization cap

### Property Tests (Invariants)
- [ ] `test_total_assets_never_decreases()` - Assets only increase or stay same
- [ ] `test_utilization_bounds()` - Utilization always 0-100%
- [ ] `test_reserve_monotonicity()` - Reserve only increases
- [ ] `test_apr_bounds()` - APR always positive and reasonable
- [ ] `test_credit_limit_bounds()` - Limits within tier constraints

### Fuzz Tests
- [ ] `test_random_repayment_sequences()` - Random payment patterns
- [ ] `test_interest_accrual_overflow()` - Large time periods
- [ ] `test_utilization_edge_cases()` - Boundary utilization values
- [ ] `test_score_boundaries()` - Edge case scores (300, 900)

### Security Tests
- [ ] `test_reentrancy_protection()` - All external calls protected
- [ ] `test_role_permissions()` - Only authorized roles can call functions
- [ ] `test_pause_functionality()` - Emergency pause works correctly
- [ ] `test_upgrade_safety()` - UUPS upgrades don't break functionality
- [ ] `test_oracle_manipulation()` - Oracle signer compromise scenarios

## Gas Optimization Targets

- **ScoreOracle.setScore()**: ~150k gas
- **LendingPool.deposit()**: ~100k gas
- **BNPLAgreement.fund()**: ~200k gas
- **BNPLAgreement.repay()**: ~100k gas
- **CreditRegistry.getState()**: ~50k gas (view function)

## Security Considerations

1. **Reentrancy Guards**: All external calls protected
2. **Input Validation**: Amount bounds, date sanity checks
3. **Role-Based Access**: Granular permissions for different functions
4. **Circuit Breakers**: Pause functionality for emergencies
5. **Oracle Security**: Multi-signer support, score expiry
6. **Upgrade Safety**: UUPS pattern with timelock
7. **Overflow Protection**: Safe math operations throughout
8. **Event Emission**: All state changes emit events for transparency 