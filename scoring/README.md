# MorphCredit Scoring Service

A Node.js/TypeScript Express service for generating and verifying credit scores on the Morph blockchain.

## Quick Start

```bash
# Install dependencies
pnpm install

# Copy environment file
cp env.example .env

# Update .env with your configuration
# MORPH_RPC=https://rpc.morphl2.io (mainnet)
# MORPH_RPC=https://rpc-holesky.morphl2.io (testnet)

# Start development server
pnpm dev

# Run tests
pnpm test
```

## Features

- **Feature Extraction**: Blockchain data analysis for credit scoring
- **Credit Scoring**: Logistic regression model (300-900 range)
- **Tier Classification**: A/B/C/D/E credit tiers
- **ECDSA Signing**: Oracle signature generation and verification
- **Report Validation**: Secure score report validation
- **Address Normalization**: Handles checksummed/non-checksummed addresses

## API Endpoints

### Health Check
```bash
GET /health
```

### Generate Credit Score
```bash
POST /score
Content-Type: application/json

{
  "address": "0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b6"
}
```

### Verify Score Report
```bash
POST /verify
Content-Type: application/json

{
  "address": "0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b6",
  "report": {
    "score": 841,
    "pd_bps": 990,
    "featuresRoot": "0xc194031f52f464a27cc518d89e5790d319525830a1b4164c71ad474d8cb65a0f",
    "expiry": 1756459905,
    "sig": "0x36db97ea49229e59cb297184d45e2ee2222f375714c8167ab08cb029e492a35242b1142f140dcac866c1e16dd84ae34ece63c4b0428dc5967f76d2cc89d784071c"
  }
}
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development`, `production`, `test` |
| `PORT` | Server port | `8787` |
| `MORPH_RPC` | Morph RPC endpoint | `https://rpc.morphl2.io` |
| `ORACLE_PRIV_KEY` | Oracle private key | `0x1234...` |
| `LOG_LEVEL` | Logging level | `info`, `debug`, `warn`, `error` |
| `CORS_ORIGIN` | CORS origin | `*` or `https://yourdomain.com` |

## Morph Network Configuration

### Mainnet (Production)
- **Chain ID**: `2818`
- **RPC URL**: `https://rpc.morphl2.io`
- **Alternative RPC**: `https://rpc-quicknode.morphl2.io`
- **Block Explorer**: `https://explorer.morphl2.io/`
- **Bridge**: `https://bridge.morphl2.io/`

### Holesky Testnet (Development)
- **Chain ID**: `2810`
- **RPC URL**: `https://rpc-holesky.morphl2.io`
- **Alternative RPC**: `https://rpc-quicknode-holesky.morphl2.io`
- **Block Explorer**: `https://explorer-holesky.morphl2.io/`
- **Bridge**: `https://bridge-holesky.morphl2.io/`

## Explorer API Endpoints

The Morph block explorers provide API endpoints that mirror Etherscan's schema:

### Mainnet Explorer API
- **Base URL**: `https://explorer-api.morphl2.io/api`
- **Rate Limit**: Not currently rate-limited (subject to change)

### Testnet Explorer API
- **Base URL**: `https://explorer-holesky-api.morphl2.io/api`
- **Rate Limit**: Not currently rate-limited (subject to change)

### Common API Endpoints
```bash
# Get contract ABI
GET /api?module=contract&action=getabi&address=0x...

# Get transaction status
GET /api?module=transaction&action=getstatus&txhash=0x...

# Get account balance
GET /api?module=account&action=balance&address=0x...

# Get transaction list
GET /api?module=account&action=txlist&address=0x...
```

**Note**: These API endpoints are not officially documented by Morph but are available through the explorer UI. Use with caution as they may change.

## Rate Limits

- **Public RPC**: 600 requests/minute per IP
- **Private RPC**: Contact Morph team for higher throughput
- **Explorer API**: Currently unlimited (subject to change)

## Development Commands

```bash
# Development
pnpm dev          # Start development server with hot reload
pnpm build        # Build for production
pnpm start        # Start production server

# Testing
pnpm test         # Run tests
pnpm test:watch   # Run tests in watch mode
pnpm test:coverage # Run tests with coverage

# Code Quality
pnpm lint         # Run ESLint
pnpm lint:fix     # Fix ESLint issues
pnpm format       # Format code with Prettier
```

## Security Considerations

1. **Private Key Management**: Use secure key management (HSM/KMS) in production
2. **Rate Limiting**: Implement rate limiting to prevent abuse
3. **Input Validation**: All inputs are validated with Zod schemas
4. **Error Handling**: No sensitive data in error messages
5. **CORS**: Configure CORS for your specific domains
6. **HTTPS**: Use TLS 1.3 in production

## License

MIT 