import { ethers } from 'ethers';
import { z } from 'zod';
import { config } from './config';
import { AddressFeatures } from './features';
import { ScoringResult } from './model';

// ScoreReport schema matching the smart contract
export const ScoreReportSchema = z.object({
  score: z.number().min(300).max(900),
  pd_bps: z.number().min(0).max(10000),
  featuresRoot: z.string().length(66), // 0x + 32 bytes hex
  expiry: z.number().positive(),
  sig: z.string().min(130), // 0x + 65 bytes hex
});

export type ScoreReport = z.infer<typeof ScoreReportSchema>;

// Request schema for scoring endpoint
export const ScoreRequestSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
});

export type ScoreRequest = z.infer<typeof ScoreRequestSchema>;

/**
 * Generate signed credit score reports
 */
export class ReportGenerator {
  private signer: ethers.Wallet;

  constructor(privateKey: string) {
    this.signer = new ethers.Wallet(privateKey);
  }

  /**
   * Generate a complete signed score report
   */
  async generateReport(
    address: string,
    features: AddressFeatures,
    scoringResult: ScoringResult
  ): Promise<ScoreReport> {
    // Create features root (simplified Merkle root)
    const featuresRoot = this.createFeaturesRoot(features);
    
    // Set expiry (30 days from now)
    const expiry = Math.floor(Date.now() / 1000) + (config.scoring.expiryDays * 24 * 60 * 60);
    
    // Create the report data
    const reportData = {
      score: scoringResult.score,
      pd_bps: scoringResult.pd_bps,
      featuresRoot,
      expiry,
    };
    
    // Sign the report
    const sig = await this.signReport(address, reportData);
    
    return {
      ...reportData,
      sig,
    };
  }

  /**
   * Create a features root hash
   */
  private createFeaturesRoot(features: AddressFeatures): string {
    // In a real implementation, you'd create a proper Merkle tree
    // For now, we'll create a hash of the features
    const featuresForHash = {
      addressAge: features.addressAge,
      activeDays: features.activeDays,
      netInflow: features.netInflow.toString(), // Convert BigInt to string
      stableBalance: features.stableBalance.toString(), // Convert BigInt to string
      txStreak: features.txStreak,
      delinquencyFlags: features.delinquencyFlags,
    };
    const featuresString = JSON.stringify(featuresForHash);
    const hash = ethers.keccak256(ethers.toUtf8Bytes(featuresString));
    return hash;
  }

  /**
   * Sign a score report
   */
  private async signReport(
    address: string,
    reportData: Omit<ScoreReport, 'sig'>
  ): Promise<string> {
    // Create the message to sign
    const message = this.createSignMessage(address, reportData);
    
    // Sign the message
    const signature = await this.signer.signMessage(message);
    
    return signature;
  }

  /**
   * Create the message to sign (matches smart contract verification)
   */
  private createSignMessage(
    address: string,
    reportData: Omit<ScoreReport, 'sig'>
  ): string {
    // Format: "MorphCredit Score Report\nAddress: {address}\nScore: {score}\nPD: {pd_bps}\nFeatures: {featuresRoot}\nExpiry: {expiry}"
    const message = [
      'MorphCredit Score Report',
      `Address: ${address}`,
      `Score: ${reportData.score}`,
      `PD: ${reportData.pd_bps}`,
      `Features: ${reportData.featuresRoot}`,
      `Expiry: ${reportData.expiry}`,
    ].join('\n');
    
    return message;
  }

  /**
   * Verify a score report signature
   */
  static verifyReport(
    address: string,
    report: ScoreReport,
    expectedSigner: string
  ): boolean {
    try {
      // Recreate the message
      const message = [
        'MorphCredit Score Report',
        `Address: ${address}`,
        `Score: ${report.score}`,
        `PD: ${report.pd_bps}`,
        `Features: ${report.featuresRoot}`,
        `Expiry: ${report.expiry}`,
      ].join('\n');
      
      // Recover the signer
      const recoveredAddress = ethers.verifyMessage(message, report.sig);
      
      return recoveredAddress.toLowerCase() === expectedSigner.toLowerCase();
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }

  /**
   * Get the oracle signer address
   */
  getSignerAddress(): string {
    return this.signer.address;
  }

  /**
   * Validate a score report
   */
  static validateReport(report: unknown): report is ScoreReport {
    try {
      ScoreReportSchema.parse(report);
      return true;
    } catch (error) {
      console.error('Report validation failed:', error);
      return false;
    }
  }

  /**
   * Check if a report is expired
   */
  static isExpired(report: ScoreReport): boolean {
    const now = Math.floor(Date.now() / 1000);
    return now > report.expiry;
  }

  /**
   * Get time until expiry
   */
  static getTimeUntilExpiry(report: ScoreReport): number {
    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, report.expiry - now);
  }
} 