## MorphCredit

End-to-end, no-mocks deployment of MorphCredit on Morph Holesky Testnet (Chain ID 2810). Includes smart contracts, scoring service, Borrower PWA, Merchant Demo, and a publishable Merchant SDK.

### Architecture

```mermaid
%%{init: { 'theme': 'dark' }}%%
flowchart LR
  subgraph Frontends
    B[Borrower PWA]
    M[Merchant Demo]
  end
  subgraph SDK
    S["morphcredit-merchant-sdk"]
  end
  subgraph Backend
    SC[(Scoring Service)]
    DB[(MongoDB/Atlas)]
  end
  subgraph Chain
    SO[ScoreOracle]
    CR[CreditRegistry]
    LP[LendingPool]
    BF[BNPLFactory]
    BA[BNPLAgreement]
    MS[mUSDC]
  end

  B -- wagmi/viem --> Chain
  M -- uses --> S
  S -- ethers.js --> BF & BA
  B -- REST --> SC
  SC -- writes --> SO
  SC -- persists --> DB
  BF -- deploys --> BA
  BA -- transfers --> MS
```

### Monorepo layout

- apps/borrower-pwa: Borrower portal (Vite + React + wagmi + AppKit)
- apps/merchant-demo: Merchant storefront demo using the SDK
- packages/merchant-sdk: Publishable SDK for merchants
- contracts: Hardhat (deploys ScoreOracle, CreditRegistry(Simple), LendingPool, BNPL/LoC)
- scoring: Express scoring service (MongoDB, WebAuthn, on-chain publish)

### Testnet config (Morph Holesky)

- RPC: https://rpc-holesky.morphl2.io
- Explorer: https://explorer-holesky.morphl2.io
- Chain ID: 2810
- Addresses: apps/config/addresses.json

### Quick start (local dev)

1) Install and build

```bash
pnpm install
pnpm -w build
```

2) Start services

```bash
# Scoring service
cd scoring && PORT=8787 MORPH_RPC=https://rpc-holesky.morphl2.io pnpm dev

# Borrower PWA
cd apps/borrower-pwa && VITE_SCORING_URL=http://localhost:8787 pnpm dev

# Merchant Demo
cd apps/merchant-demo && pnpm dev
```

### Production deployment

- UI on Vercel (Merchant Demo)
  - Project root: `apps/merchant-demo`
  - Build command: `pnpm i --frozen-lockfile && pnpm -r build && pnpm build`
  - Output directory: `dist`
  - Env (optional): none required; uses on-chain RPC and repo config

- Borrower PWA on Vercel
  - Project root: `apps/borrower-pwa`
  - Build command: `pnpm i --frozen-lockfile && pnpm -r build && pnpm build`
  - Output directory: `dist`
  - Env: set `VITE_*` vars (see below)

- Scoring service on Render
  - One-click via `render.yaml` at repo root
  - Set environment variables (see below)

- SDK on npm
  - Package: `morphcredit-merchant-sdk`
  - `pnpm -w -F morphcredit-merchant-sdk build`
  - `cd packages/merchant-sdk && npm publish --access public`

### Environment variables

Scoring (`scoring/.env` or Render):
- MORPH_RPC: Morph Holesky RPC URL
- SCORE_ORACLE_ADDRESS: Deployed ScoreOracle
- ORACLE_PRIV_KEY: Oracle signer private key (funded)
- MONGODB_URI: Connection string to MongoDB/Atlas
- MONGODB_DB: Database name
- RP_ID, RP_ORIGIN: WebAuthn relying party settings
- PORT: Web port (Render provides)

Borrower PWA (`apps/borrower-pwa/.env` or Vercel):
- VITE_MORPH_CHAIN_ID=2810
- VITE_MORPH_RPC_URL=https://rpc-holesky.morphl2.io
- VITE_EXPLORER_URL=https://explorer-holesky.morphl2.io
- VITE_SCORING_URL=https://your-render-service.onrender.com
- VITE_WALLETCONNECT_PROJECT_ID=...

### Merchant SDK usage

```ts
import { MorphCreditSDK } from 'morphcredit-merchant-sdk';

const sdk = new MorphCreditSDK();
await sdk.connectWallet();
const offers = await sdk.getOffers({ address: await sdk.getWalletAddress()!, amount: 499.99 });
const { txHash, agreementId } = await sdk.createAgreement(offers[0].id);
console.log({ txHash, agreementId });
```

### Licenses

MIT License. See `LICENSE`.

### Diagrams (flows)

```mermaid
%%{init: { 'theme': 'dark' }}%%
sequenceDiagram
  autonumber
  participant U as User (Merchant)
  participant D as Merchant Demo
  participant SDK as Merchant SDK
  participant SC as Scoring Service
  participant BF as BNPLFactory
  participant BA as BNPLAgreement

  U->>D: Click "Pay with MorphCredit"
  D->>SDK: connectWallet()
  SDK->>SC: POST /score { address }
  SC-->>SDK: { tier, score }
  SDK->>SDK: build offers (APR bands)
  U->>D: Select offer
  D->>SDK: createAgreement(offerId)
  SDK->>BF: createAgreement(...)
  BF->>BA: deploy clone
  BF-->>SDK: AgreementCreated(..., agreement)
  SDK-->>D: { txHash, agreementId }
  D-->>U: Confirmation + Explorer link
```

### End‑to‑end demo flow (fresh wallet)

- Pre‑reqs
  - Switch wallet to Morph Holesky (chainId 2810).
  - Have a little test ETH for gas (Holesky → Morph bridge).
  - URLs: 

    *-* Borrower PWA: [morphcredit-borrower.vercel.app](https://morphcredit-borrower.vercel.app/)
   
    *-* Merchant Demo: [morphcredit-merchant-demo.vercel.app](https://morphcredit-merchant-demo.vercel.app/)

### 1) Borrower: set up and get a score
1. Open the Borrower app: [morphcredit-borrower.vercel.app](https://morphcredit-borrower.vercel.app/) and connect wallet.
2. Profile: set username (optional), upload avatar.
3. Credit Score page:
   - Click “Request Score”. The app:
     - Computes your score off‑chain.
     - Immediately publishes the signed score to the on‑chain ScoreOracle (no extra button).
     - Shows a success toast with a tx link.
4. Home updates with your live score and tier.

### 2) Merchant: create a BNPL agreement
1. Open the Merchant Demo: [morphcredit-merchant-demo.vercel.app](https://morphcredit-merchant-demo.vercel.app/) and connect wallet.
2. Add any item(s) to cart → click “Pay with MorphCredit”.
3. Offers appear (APR/schedule based on your tier). Pick a plan.
4. Sign the on‑chain tx. You’ll see an order confirmation with a Morph explorer link.
   - This deploys a BNPLAgreement to your address and funds the merchant.

### 3) Borrower: view agreement and repay
1. Back in the Borrower app:
   - Agreements tab: your new agreement is listed.
   - Repayments tab: shows “Pay next” when an installment is due.
2. Click “Pay next”:
   - First time only, you’ll approve mUSDC to the agreement (one tx).
   - Then you’ll sign the repay tx.
   - You’ll get a success toast with an explorer link; counts update (Paid/Remaining).
   - If you see “insufficient balance,” acquire test mUSDC, then retry (I can wire a tiny faucet if you want).

### 4) Optional PWA install (mobile/desktop)
- Click “Install App” (top‑right). On iOS Safari, use Share → “Add to Home Screen”.

Notes
- “Publish to Oracle” is automatic inside “Request Score”; if you prefer a separate button, say “split score buttons” and I’ll add it.
- Deep link/refresh issues: hard‑refresh once after deploy (service worker updated).
- Use the health endpoint to confirm the API is live before demos: https://morphcredit.onrender.com/health

Links referenced: [Borrower PWA](https://morphcredit-borrower.vercel.app/), [Merchant Demo](https://morphcredit-merchant-demo.vercel.app/).
