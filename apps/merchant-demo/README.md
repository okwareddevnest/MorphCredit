## Merchant Demo (Vercel-ready)

Showcases MorphCredit checkout with the Merchant SDK on Morph Holesky.

### Deploy on Vercel

- Project root: `apps/merchant-demo`
- Build command: `pnpm i --frozen-lockfile && pnpm -w build && pnpm build`
- Output: `dist`

### Local dev

```bash
pnpm install
pnpm dev
```

### What it does
- Browse products, add to cart
- Checkout with MorphCredit (wallet connect → offers → on-chain tx)
- Order confirmation with explorer link

### Diagram

```mermaid
%%{init: { 'theme': 'dark' }}%%
sequenceDiagram
  participant U as User
  participant Web as Merchant Demo
  participant SDK as Merchant SDK
  participant Chain as Morph Holesky
  U->>Web: Click pay
  Web->>SDK: getOffers(amount)
  SDK->>SDK: derive from tier
  U->>Web: select offer
  Web->>SDK: createAgreement(offer)
  SDK->>Chain: BNPLFactory.createAgreement
  Chain-->>SDK: AgreementCreated(agreement)
  SDK-->>Web: txHash, agreement
  Web-->>U: success + explorer
```


