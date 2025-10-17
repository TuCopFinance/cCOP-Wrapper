# Frontend/dApp Documentation

Frontend application for the Wrapped cCOP (wcCOP) cross-chain bridge. For general project information, see the [main README](../README.md).

## Quick Start

```bash
cd dapp
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Tech Stack

- **Framework**: Next.js 15.3.0 with App Router
- **Language**: TypeScript  
- **Wallet**: Reown AppKit v1.7.10
- **Blockchain**: Wagmi v2.12.31, Viem v2.21.44
- **Farcaster**: @farcaster/miniapp-sdk ([setup guide](farcaster.md))

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Main bridge interface
│   └── api/webhook/       # Farcaster webhook endpoint
├── components/             # UI components
│   ├── ConnectButton.tsx  
│   ├── WrapperComponent.tsx
│   ├── UnwrapperComponent.tsx
│   └── TokenMenu.tsx
├── config/                 # AppKit & wagmi config
├── constants/              # Contract addresses & ABIs
├── context/                # React contexts
│   ├── BalanceContext.tsx
│   └── FarcasterContext.tsx
├── hooks/                  # Custom hooks
└── utils/                  # Utilities
    └── farcaster.ts       # Farcaster integration
```

## Scripts

```bash
pnpm dev      # Start dev server
pnpm build    # Production build
pnpm start    # Start production server
pnpm lint     # ESLint
```

## Key Components

### ConnectButton
Wallet connection with Farcaster auto-connect support when running as miniapp.

### WrapperComponent
Token wrapping interface with:
- Amount validation
- Chain selection (Base, Arbitrum, Optimism, Avalanche)
- Allowance approval flow
- Gas estimation

### UnwrapperComponent
Token unwrapping with:
- Balance checking
- Destination address input
- Cross-chain transaction monitoring

### TokenMenu
Toggle between wrap/unwrap modes with live balance updates.

## Configuration

### Environment Variables (Optional)

```bash
# .env.local
NEXT_PUBLIC_PROJECT_ID=     # Reown project ID (pre-configured)
NEXT_PUBLIC_ENABLE_TESTNETS=
```

### Contract Addresses

Located in `src/constants/address.tsx`. Automatically selected based on connected network.

## Integrations

- **Farcaster Miniapp**: See [farcaster.md](farcaster.md) for setup
- **Divvi Referral**: See [divvi-integration.md](divvi-integration.md) for details

## Development Notes

- Uses CSS Modules for styling
- All providers wrapped in `layout.tsx`
- Balance context shared across components
- Responsive design for mobile/desktop
- Toast notifications for user feedback

## Troubleshooting

**Build Errors**: Ensure Node.js ≥18  
**Wallet Issues**: Clear cache, refresh page  
**Network Issues**: Check RPC endpoints  
**Farcaster**: See [farcaster.md](farcaster.md) troubleshooting

For general issues, see main [README](../README.md#troubleshooting).
