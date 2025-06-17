# Frontend Deployment with Vercel

To build and deploy a simple dApp interface for wrapped cCOP:

## Prerequisites

- Node.js 18+
- GitHub account
- Vercel CLI (`npm install -g vercel`)

## Setup

1. Create a folder `frontend/`
2. Use Next.js, React, or plain HTML + ethers.js
3. Connect to both Celo and Base using wagmi or viem
4. Integrate `WrappedCOP`, `Vault`, and CCIP calls

## Example Vercel Commands

```bash
vercel login
vercel link
vercel deploy --prod
```

Make sure to include `.env` variables for RPCs and contract addresses.

## RPCs for .env

```
NEXT_PUBLIC_BASE_RPC=https://mainnet.base.org
NEXT_PUBLIC_CELO_RPC=https://forno.celo.org
NEXT_PUBLIC_VAULT_ADDRESS=0x...
NEXT_PUBLIC_WCOP_ADDRESS=0x...
```

## Optional Libraries

- wagmi
- viem
- useDapp or web3modal for wallet connections
