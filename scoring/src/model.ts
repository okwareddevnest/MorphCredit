import { AddressFeatures } from './features';
import { config } from './config';

export interface ScoringResult {
  score: number;        // 300-900
  pd_bps: number;       // Probability of default in basis points (0-10000)
  tier: 'A' | 'B' | 'C' | 'D' | 'E';
  confidence: number;   // Model confidence (0-1)
}

/**
 * Credit scoring model using logistic regression
 */
export class ScoringModel {
  private weights: Record<keyof AddressFeatures, number>;
  private bias: number;

  constructor() {
    // Initialize with config weights
    this.weights = config.featureWeights;
    this.bias = -2.5; // Base bias for logistic regression
  }

  /**
   * Score an address based on its features
   */
  scoreAddress(features: AddressFeatures): ScoringResult {
    // Normalize features
    const normalizedFeatures = this.normalizeFeatures(features);
    
    // Compute logistic regression score
    const logit = this.computeLogit(normalizedFeatures);
    
    // Convert to probability of default (0-1)
    const pd = this.sigmoid(logit);
    
    // Convert to basis points (0-10000)
    const pd_bps = Math.round(pd * 10000);
    
    // Convert to credit score (300-900)
    const score = this.pdToScore(pd);
    
    // Determine tier
    const tier = this.scoreToTier(score);
    
    // Compute confidence based on feature quality
    const confidence = this.computeConfidence(features);
    
    return {
      score,
      pd_bps,
      tier,
      confidence,
    };
  }

  /**
   * Normalize features for scoring
   */
  private normalizeFeatures(features: AddressFeatures): AddressFeatures {
    return {
      addressAge: this.normalizeAge(features.addressAge),
      activeDays: this.normalizeActiveDays(features.activeDays),
      netInflow: this.normalizeAmount(Number(features.netInflow)),
      stableBalance: this.normalizeAmount(Number(features.stableBalance)),
      txStreak: this.normalizeStreak(features.txStreak),
      delinquencyFlags: this.normalizeDelinquency(features.delinquencyFlags),
    };
  }

  /**
   * Normalize address age (0-365 days to 0-1)
   */
  private normalizeAge(age: number): number {
    return Math.min(1, Math.max(0, age / 365));
  }

  /**
   * Normalize active days (0-90 days to 0-1)
   */
  private normalizeActiveDays(days: number): number {
    return Math.min(1, Math.max(0, days / 90));
  }

  /**
   * Normalize amount (wei to 0-1 scale)
   */
  private normalizeAmount(amount: number): number {
    const ethAmount = amount / 1e18; // Convert wei to ETH
    return Math.min(1, Math.max(0, ethAmount / 10)); // Normalize to 10 ETH max
  }

  /**
   * Normalize transaction streak (0-30 days to 0-1)
   */
  private normalizeStreak(streak: number): number {
    return Math.min(1, Math.max(0, streak / 30));
  }

  /**
   * Normalize delinquency flags (0-1 scale, negative impact)
   */
  private normalizeDelinquency(flags: number): number {
    return Math.min(1, Math.max(0, flags / 10)); // Normalize to 10 flags max
  }

  /**
   * Compute logistic regression logit
   */
  private computeLogit(normalizedFeatures: Record<keyof AddressFeatures, number>): number {
    let logit = this.bias;
    
    for (const [feature, value] of Object.entries(normalizedFeatures)) {
      const weight = this.weights[feature as keyof AddressFeatures];
      logit += weight * value;
    }
    
    return logit;
  }

  /**
   * Sigmoid function
   */
  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x));
  }

  /**
   * Convert probability of default to credit score
   */
  private pdToScore(pd: number): number {
    // Inverse relationship: higher PD = lower score
    const score = config.scoring.scoreRange.max - 
      (pd * (config.scoring.scoreRange.max - config.scoring.scoreRange.min));
    
    return Math.round(Math.max(
      config.scoring.scoreRange.min,
      Math.min(config.scoring.scoreRange.max, score)
    ));
  }

  /**
   * Convert score to tier
   */
  private scoreToTier(score: number): 'A' | 'B' | 'C' | 'D' | 'E' {
    if (score >= config.tiers.A.min) return 'A';
    if (score >= config.tiers.B.min) return 'B';
    if (score >= config.tiers.C.min) return 'C';
    if (score >= config.tiers.D.min) return 'D';
    return 'E';
  }

  /**
   * Compute model confidence based on feature quality
   */
  private computeConfidence(features: AddressFeatures): number {
    let confidence = 1.0;
    
    // Reduce confidence for new addresses
    if (features.addressAge < 30) {
      confidence *= 0.7;
    }
    
    // Reduce confidence for inactive addresses
    if (features.activeDays < 7) {
      confidence *= 0.8;
    }
    
    // Reduce confidence for addresses with no transactions
    if (features.txStreak === 0) {
      confidence *= 0.6;
    }
    
    // Reduce confidence for addresses with delinquency flags
    if (features.delinquencyFlags > 0) {
      confidence *= (1 - features.delinquencyFlags * 0.2);
    }
    
    return Math.max(0.1, confidence);
  }

  /**
   * Get tier information
   */
  getTierInfo(tier: 'A' | 'B' | 'C' | 'D' | 'E') {
    const tierConfig = {
      A: { name: 'Excellent', aprRange: [8, 12], limitRange: [8000, 10000] },
      B: { name: 'Good', aprRange: [12, 18], limitRange: [5000, 8000] },
      C: { name: 'Fair', aprRange: [18, 25], limitRange: [2500, 5000] },
      D: { name: 'Poor', aprRange: [25, 35], limitRange: [1000, 2500] },
      E: { name: 'Very Poor', aprRange: [35, 50], limitRange: [500, 1000] },
    };
    
    return tierConfig[tier];
  }
} 