# Frontend dApp for wrapped cCOP

This is a minimal dApp interface built with **Next.js**, **wagmi**, and **ethers.js** to interact with:

- WrappedCOP on Base
- Vault on Celo
- Chainlink CCIP bridging

## Commands

```bash
npm install
npm run dev
```

## Requirements

Create a `.env.local` file with:

```
NEXT_PUBLIC_VAULT_ADDRESS=0x...
NEXT_PUBLIC_WCOP_ADDRESS=0x...
NEXT_PUBLIC_CELO_RPC=https://forno.celo.org
NEXT_PUBLIC_BASE_RPC=https://mainnet.base.org
```
