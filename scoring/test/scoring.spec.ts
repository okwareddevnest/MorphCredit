import { describe, it, expect, beforeEach } from 'vitest';
import { ethers } from 'ethers';
import { FeatureExtractor } from '../src/features';
import { ScoringModel } from '../src/model';
import { ReportGenerator, ScoreReportSchema, ScoreRequestSchema } from '../src/report';

describe('Scoring Service', () => {
  let featureExtractor: FeatureExtractor;
  let scoringModel: ScoringModel;
  let reportGenerator: ReportGenerator;
  let testWallet: ethers.Wallet;

  beforeEach(() => {
    // Create test wallet
    testWallet = ethers.Wallet.createRandom();
    
    // Initialize services
    featureExtractor = new FeatureExtractor('https://morph-testnet.rpc');
    scoringModel = new ScoringModel();
    reportGenerator = new ReportGenerator(testWallet.privateKey);
  });

  describe('Schema Validation', () => {
    it('should validate correct score request', () => {
      const validRequest = {
        address: '0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b6',
      };

      expect(() => ScoreRequestSchema.parse(validRequest)).not.toThrow();
    });

    it('should reject invalid Ethereum address', () => {
      const invalidRequest = {
        address: 'invalid-address',
      };

      expect(() => ScoreRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should validate correct score report', () => {
      const validReport = {
        score: 750,
        pd_bps: 1500,
        featuresRoot: '0x1234567890123456789012345678901234567890123456789012345678901234',
        expiry: Math.floor(Date.now() / 1000) + 86400,
        sig: '0x' + '1'.repeat(130),
      };

      expect(() => ScoreReportSchema.parse(validReport)).not.toThrow();
    });

    it('should reject score out of range', () => {
      const invalidReport = {
        score: 1000, // > 900
        pd_bps: 1500,
        featuresRoot: '0x1234567890123456789012345678901234567890123456789012345678901234',
        expiry: Math.floor(Date.now() / 1000) + 86400,
        sig: '0x' + '1'.repeat(130),
      };

      expect(() => ScoreReportSchema.parse(invalidReport)).toThrow();
    });

    it('should reject PD out of range', () => {
      const invalidReport = {
        score: 750,
        pd_bps: 15000, // > 10000
        featuresRoot: '0x1234567890123456789012345678901234567890123456789012345678901234',
        expiry: Math.floor(Date.now() / 1000) + 86400,
        sig: '0x' + '1'.repeat(130),
      };

      expect(() => ScoreReportSchema.parse(invalidReport)).toThrow();
    });
  });

  describe('Feature Extraction', () => {
    it('should extract features for valid address', async () => {
      const address = '0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b6';
      
      const result = await featureExtractor.extractFeatures(address);
      
      expect(result.features).toHaveProperty('addressAge');
      expect(result.features).toHaveProperty('activeDays');
      expect(result.features).toHaveProperty('netInflow');
      expect(result.features).toHaveProperty('stableBalance');
      expect(result.features).toHaveProperty('txStreak');
      expect(result.features).toHaveProperty('delinquencyFlags');
      
      expect(result.features.addressAge).toBeGreaterThan(0);
      expect(result.features.activeDays).toBeGreaterThanOrEqual(0);
      expect(result.features.activeDays).toBeLessThanOrEqual(90);
    });
  });

  describe('Scoring Model', () => {
    it('should generate scores in valid range', () => {
      const features = {
        addressAge: 365,
        activeDays: 45,
        netInflow: 1000000000000000000n, // 1 ETH
        stableBalance: 5000000000000000000n, // 5 ETH
        txStreak: 15,
        delinquencyFlags: 0,
      };

      const result = scoringModel.scoreAddress(features);
      
      expect(result.score).toBeGreaterThanOrEqual(300);
      expect(result.score).toBeLessThanOrEqual(900);
      expect(result.pd_bps).toBeGreaterThanOrEqual(0);
      expect(result.pd_bps).toBeLessThanOrEqual(10000);
      expect(['A', 'B', 'C', 'D', 'E']).toContain(result.tier);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should handle edge cases', () => {
      const features = {
        addressAge: 1,
        activeDays: 0,
        netInflow: 0n,
        stableBalance: 0n,
        txStreak: 0,
        delinquencyFlags: 3,
      };

      const result = scoringModel.scoreAddress(features);
      
      expect(result.score).toBeGreaterThanOrEqual(300);
      expect(result.score).toBeLessThanOrEqual(900);
      expect(result.confidence).toBeLessThan(1); // Lower confidence for poor features
    });
  });

  describe('Report Generation', () => {
    it('should generate valid signed report', async () => {
      const address = '0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b6';
      const features = {
        addressAge: 365,
        activeDays: 45,
        netInflow: 1000000000000000000n,
        stableBalance: 5000000000000000000n,
        txStreak: 15,
        delinquencyFlags: 0,
      };
      const scoringResult = scoringModel.scoreAddress(features);

      const report = await reportGenerator.generateReport(address, features, scoringResult);

      // Validate report structure
      expect(() => ScoreReportSchema.parse(report)).not.toThrow();
      
      // Check report fields
      expect(report.score).toBe(scoringResult.score);
      expect(report.pd_bps).toBe(scoringResult.pd_bps);
      expect(report.featuresRoot).toMatch(/^0x[a-fA-F0-9]{64}$/);
      expect(report.expiry).toBeGreaterThan(Math.floor(Date.now() / 1000));
      expect(report.sig).toMatch(/^0x[a-fA-F0-9]{130}$/);
    });

    it('should verify signature correctly', async () => {
      const address = '0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b6';
      const features = {
        addressAge: 365,
        activeDays: 45,
        netInflow: 1000000000000000000n,
        stableBalance: 5000000000000000000n,
        txStreak: 15,
        delinquencyFlags: 0,
      };
      const scoringResult = scoringModel.scoreAddress(features);

      const report = await reportGenerator.generateReport(address, features, scoringResult);

      // Verify signature
      const isValid = ReportGenerator.verifyReport(
        address,
        report,
        testWallet.address
      );

      expect(isValid).toBe(true);
    });

    it('should reject invalid signature', () => {
      const address = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6';
      const report = {
        score: 750,
        pd_bps: 1500,
        featuresRoot: '0x1234567890123456789012345678901234567890123456789012345678901234',
        expiry: Math.floor(Date.now() / 1000) + 86400,
        sig: '0x' + '1'.repeat(130), // Invalid signature
      };

      const isValid = ReportGenerator.verifyReport(
        address,
        report,
        testWallet.address
      );

      expect(isValid).toBe(false);
    });
  });

  describe('Deterministic Test Vectors', () => {
    it('should produce consistent results for same input', async () => {
      const address = '0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b6';
      
      // First run
      const result1 = await featureExtractor.extractFeatures(address);
      const score1 = scoringModel.scoreAddress(result1.features);
      
      // Second run
      const result2 = await featureExtractor.extractFeatures(address);
      const score2 = scoringModel.scoreAddress(result2.features);
      
      // Results should be consistent (within reasonable tolerance for simulated data)
      expect(score1.score).toBe(score2.score);
      expect(score1.pd_bps).toBe(score2.pd_bps);
      expect(score1.tier).toBe(score2.tier);
    });

    it('should handle chain-compatible curve signatures', async () => {
      const address = '0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b6';
      const features = {
        addressAge: 365,
        activeDays: 45,
        netInflow: 1000000000000000000n,
        stableBalance: 5000000000000000000n,
        txStreak: 15,
        delinquencyFlags: 0,
      };
      const scoringResult = scoringModel.scoreAddress(features);

      const report = await reportGenerator.generateReport(address, features, scoringResult);

      // Verify signature is valid ECDSA
      const message = [
        'MorphCredit Score Report',
        `Address: ${address}`,
        `Score: ${report.score}`,
        `PD: ${report.pd_bps}`,
        `Features: ${report.featuresRoot}`,
        `Expiry: ${report.expiry}`,
      ].join('\n');

      const recoveredAddress = ethers.verifyMessage(message, report.sig);
      expect(recoveredAddress.toLowerCase()).toBe(testWallet.address.toLowerCase());
    });
  });

  describe('Report Validation', () => {
    it('should detect expired reports', () => {
      const expiredReport = {
        score: 750,
        pd_bps: 1500,
        featuresRoot: '0x1234567890123456789012345678901234567890123456789012345678901234',
        expiry: Math.floor(Date.now() / 1000) - 86400, // 1 day ago
        sig: '0x' + '1'.repeat(130),
      };

      expect(ReportGenerator.isExpired(expiredReport)).toBe(true);
    });

    it('should calculate time until expiry', () => {
      const futureReport = {
        score: 750,
        pd_bps: 1500,
        featuresRoot: '0x1234567890123456789012345678901234567890123456789012345678901234',
        expiry: Math.floor(Date.now() / 1000) + 86400, // 1 day from now
        sig: '0x' + '1'.repeat(130),
      };

      const timeUntilExpiry = ReportGenerator.getTimeUntilExpiry(futureReport);
      expect(timeUntilExpiry).toBeGreaterThan(0);
      expect(timeUntilExpiry).toBeLessThanOrEqual(86400);
    });
  });
}); 