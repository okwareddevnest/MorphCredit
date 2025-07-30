import express from 'express';
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
const app = express();

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'morphcredit-scoring',
    version: '0.1.0',
    oracle: reportGenerator.getSignerAddress(),
  });
});

// Scoring endpoint
app.post('/score', async (req, res) => {
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
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Invalid request data', { errors: error.errors });
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors,
      });
    }

    logger.error('Error processing score request', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Report verification endpoint
app.post('/verify', async (req, res) => {
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

  } catch (error) {
    logger.error('Verification error', { error: error instanceof Error ? error.message : error });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Error handling middleware
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', { error: error.message, stack: error.stack });
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

// 404 handler
app.use('*', (req, res) => {
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