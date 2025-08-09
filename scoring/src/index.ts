import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import winston from 'winston';
import { z } from 'zod';
import { ethers } from 'ethers';

import { config } from './config';
import { FeatureExtractor } from './features';
import { ScoringModel } from './model';
import { ReportGenerator, ScoreRequestSchema, ScoreReportSchema } from './report';
import { getUser, updateUser, UserProfile } from './users';
import ScoreOracleAbi from './abis/ScoreOracle.json';

// Initialize logger
const logger = winston.createLogger({
  level: config.logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'morphcredit-scoring' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

// Initialize services
const featureExtractor = new FeatureExtractor(config.morphRpc);
const scoringModel = new ScoringModel();
const reportGenerator = new ReportGenerator(config.oraclePrivKey);

// Create Express app
const app: express.Express = express();

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });
  next();
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'morphcredit-scoring',
    version: '0.1.0',
    oracle: reportGenerator.getSignerAddress(),
  });
});

// Scoring endpoint
app.post('/score', async (req: Request, res: Response) => {
  try {
    const validatedRequest = ScoreRequestSchema.parse(req.body);
    let { address } = validatedRequest;

    // Normalize address (accept both checksummed and non-checksummed)
    try {
      address = ethers.getAddress(address);
    } catch (e) {
      logger.warn('Invalid Ethereum address', { address });
      return res.status(400).json({
        success: false,
        error: 'Invalid Ethereum address (bad checksum or format)',
      });
    }

    logger.info(`Processing score request for address: ${address}`);

    // Extract features
    const featureResult = await featureExtractor.extractFeatures(address);
    
    // Calculate score
    const scoringResult = scoringModel.scoreAddress(featureResult.features);
    
    // Generate signed report
    const report = await reportGenerator.generateReport(
      address,
      featureResult.features,
      scoringResult
    );

    // Validate report
    const isValid = ReportGenerator.verifyReport(
      address,
      report,
      reportGenerator.getSignerAddress()
    );

    if (!isValid) {
      logger.error('Generated report failed validation', { address });
      return res.status(500).json({
        success: false,
        error: 'Failed to generate valid report',
      });
    }

    logger.info(`Score generated successfully`, {
      address,
      score: scoringResult.score,
      tier: scoringResult.tier,
      pd_bps: scoringResult.pd_bps,
    });

    res.json({
      success: true,
      data: {
        report,
        scoring: {
          ...scoringResult,
          features: featureResult.features,
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          oracle: reportGenerator.getSignerAddress(),
          expiresAt: new Date(report.expiry * 1000).toISOString(),
        },
      },
    });
    return;
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      logger.warn('Invalid request data', { errors: error.errors });
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors,
      });
    }

    const message = error instanceof Error ? error.message : String(error);
    logger.error('Error processing score request', { error: message });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
    return;
  }
});

// Profile endpoints
app.get('/user/:address', (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const profile = getUser(address);
    res.json({ success: true, data: profile });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to fetch user' });
  }
});

app.post('/user/:address', (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const partial = req.body as Partial<UserProfile>;
    const saved = updateUser(address, partial);
    res.json({ success: true, data: saved });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to update user' });
  }
});

// Minimal WebAuthn-like endpoints (challenge storage only; actual verification would require RP config)
app.post('/webauthn/challenge/:address', (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const challenge = ethers.hexlify(ethers.randomBytes(32));
    const profile = updateUser(address, { challenge });
    res.json({ success: true, data: { challenge: profile.challenge } });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to create challenge' });
  }
});

app.post('/webauthn/register/:address', (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const { credentialID, publicKey } = req.body as { credentialID: string; publicKey: string };
    const saved = updateUser(address, { webauthn: { credentialID, publicKey, counter: 0 }, security: { biometric: true } });
    res.json({ success: true, data: saved });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to save credential' });
  }
});

// Publish endpoint (writes to ScoreOracle on Morph testnet)
app.post('/publish', async (req: Request, res: Response) => {
  try {
    const { address, score } = req.body as { address: string, score: any };
    if (!address || !score) {
      return res.status(400).json({ success: false, error: 'Missing address or score' });
    }

    if (!config.scoreOracleAddress) {
      return res.status(500).json({ success: false, error: 'SCORE_ORACLE_ADDRESS is not configured' });
    }

    // Validate shape
    const isValid = ScoreReportSchema.safeParse({
      score: score.score,
      pd_bps: score.pd_bps ?? score.pdBps ?? 0,
      featuresRoot: score.featuresRoot,
      expiry: score.expiresAt ?? score.expiry ?? 0,
      sig: score.signature ?? score.sig,
    });
    if (!isValid.success) {
      return res.status(400).json({ success: false, error: 'Invalid score payload', details: isValid.error.errors });
    }

    // Normalize report fields to match contract
    const report = isValid.data;

    const provider = new ethers.JsonRpcProvider(config.morphRpc);
    const wallet = new ethers.Wallet(config.oraclePrivKey, provider);
    const oracle = new ethers.Contract(config.scoreOracleAddress, ScoreOracleAbi, wallet) as ethers.Contract & {
      setScore: (user: string, sr: { score: number; pd_bps: number; featuresRoot: `0x${string}`; expiry: bigint; sig: `0x${string}` }) => Promise<ethers.TransactionResponse>;
    };

    const tx = await oracle["setScore"](address, {
      score: report.score,
      pd_bps: report.pd_bps,
      featuresRoot: report.featuresRoot as `0x${string}`,
      expiry: BigInt(report.expiry),
      sig: report.sig as `0x${string}`,
    });
    const receipt = await tx.wait(1);

    return res.json({ success: true, txHash: tx.hash, blockNumber: receipt?.blockNumber });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Publish error', { error: message });
    return res.status(500).json({ success: false, error: 'Failed to publish score' });
  }
});

// Report verification endpoint
app.post('/verify', async (req: Request, res: Response) => {
  try {
    const { address, report } = req.body;

    if (!address || !report) {
      return res.status(400).json({
        success: false,
        error: 'Missing address or report',
      });
    }

    // Validate report structure
    if (!ReportGenerator.validateReport(report)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid report format',
      });
    }

    // Check if report is expired
    if (ReportGenerator.isExpired(report)) {
      return res.status(400).json({
        success: false,
        error: 'Report has expired',
        expiresAt: new Date(report.expiry * 1000).toISOString(),
      });
    }

    // Verify signature
    const isValid = ReportGenerator.verifyReport(
      address,
      report,
      reportGenerator.getSignerAddress()
    );

    res.json({
      success: true,
      data: {
        isValid,
        report,
        metadata: {
          verifiedAt: new Date().toISOString(),
          oracle: reportGenerator.getSignerAddress(),
          expiresAt: new Date(report.expiry * 1000).toISOString(),
          timeUntilExpiry: ReportGenerator.getTimeUntilExpiry(report),
        },
      },
    });
    return;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Verification error', { error: message });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
    return;
  }
});

// Error handling middleware
app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error', { error: error.message, stack: error.stack });
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

// 404 handler
app.use('*', (_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    availableEndpoints: ['GET /health', 'POST /score', 'POST /verify'],
  });
});

// Start server
const server = app.listen(config.port, () => {
  logger.info(`MorphCredit Scoring Service started`, {
    port: config.port,
    nodeEnv: config.nodeEnv,
    oracle: reportGenerator.getSignerAddress(),
    endpoints: {
      health: `http://localhost:${config.port}/health`,
      score: `http://localhost:${config.port}/score`,
      verify: `http://localhost:${config.port}/verify`,
    },
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export default app; 