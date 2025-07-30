import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.MORPH_RPC = 'https://eth-sepolia.g.alchemy.com/v2/demo';
process.env.ORACLE_PRIV_KEY = '0x1234567890123456789012345678901234567890123456789012345678901234'; 