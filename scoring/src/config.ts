import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Environment schema validation
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('8787'),
  MORPH_RPC: z.string().url('MORPH_RPC must be a valid URL'),
  ORACLE_PRIV_KEY: z.string().min(64, 'ORACLE_PRIV_KEY must be at least 64 characters'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  CORS_ORIGIN: z.string().default('*'),
  SCORE_ORACLE_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  MONGODB_URI: z.string().optional(),
  MONGODB_DB: z.string().default('morphcredit'),
  RP_ID: z.string().optional(),
  RP_ORIGIN: z.string().optional(),
  BNPL_FACTORY_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  BNPL_ADMIN_PRIV_KEY: z.string().min(64).optional(),
});

// Validate environment variables
const env = envSchema.parse(process.env);

export const config = {
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  morphRpc: env.MORPH_RPC,
  oraclePrivKey: env.ORACLE_PRIV_KEY,
  logLevel: env.LOG_LEVEL,
  corsOrigin: env.CORS_ORIGIN,
  scoreOracleAddress: env.SCORE_ORACLE_ADDRESS,
  mongodbUri: env.MONGODB_URI,
  mongodbDb: env.MONGODB_DB,
  rpId: env.RP_ID,
  rpOrigin: env.RP_ORIGIN,
  bnplFactoryAddress: env.BNPL_FACTORY_ADDRESS,
  bnplAdminPrivKey: env.BNPL_ADMIN_PRIV_KEY,
  
  // Scoring parameters
  scoring: {
    scoreRange: { min: 300, max: 900 },
    pdRange: { min: 0, max: 10000 }, // basis points
    expiryDays: 30,
    gracePeriodDays: 5,
    writeOffDays: 60,
  },
  
  // Feature weights for scoring
  featureWeights: {
    addressAge: 0.15,
    activeDays: 0.20,
    netInflow: 0.25,
    stableBalance: 0.20,
    txStreak: 0.15,
    delinquencyFlags: -0.05, // negative weight
  },
  
  // Tier thresholds
  tiers: {
    A: { min: 800, max: 900 },
    B: { min: 700, max: 799 },
    C: { min: 600, max: 699 },
    D: { min: 500, max: 599 },
    E: { min: 300, max: 499 },
  },
} as const;

export type Config = typeof config; 