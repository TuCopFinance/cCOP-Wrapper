# wcCOP Cross-Chain Bridge dApp

Frontend application for the Wrapped cCOP (wcCOP) cross-chain bridge, built with Next.js and Reown AppKit for seamless multi-chain wallet integration.

## Overview

This dApp provides a user-friendly interface for bridging cCOP tokens between Celo, Base, and Arbitrum networks using Hyperlane's cross-chain infrastructure. Users can wrap cCOP tokens from Celo to receive wcCOP on destination chains, and unwrap wcCOP back to original cCOP tokens.

## Features

- **Multi-Chain Support**: Connect to Celo, Base, and Arbitrum networks
- **Wallet Integration**: Support for multiple wallets via Reown AppKit/WalletConnect
- **Token Wrapping**: Lock cCOP on Celo and mint wcCOP on destination chains
- **Token Unwrapping**: Burn wcCOP and unlock cCOP on Celo
- **Real-Time Updates**: Live balance tracking and transaction status
- **Responsive Design**: Modern UI that works across devices
- **Network Switching**: Automatic network detection and switching

## Tech Stack

- **Framework**: Next.js 15.3.0 with App Router
- **Language**: TypeScript
- **Wallet Integration**: Reown AppKit v1.7.10 (WalletConnect v2)
- **Blockchain Interaction**: 
  - Wagmi v2.12.31 (React hooks for Ethereum)
  - Viem v2.21.44 (TypeScript Ethereum library)
- **State Management**: TanStack Query v5.59.20
- **UI Components**: Custom React components with CSS modules
- **Notifications**: React Hot Toast
- **Additional**: Referral SDK integration

## Supported Networks

### Mainnet
- **Celo** (Chain ID: 42220) - Source chain for cCOP
- **Base** (Chain ID: 8453) - Destination chain for wcCOP
- **Arbitrum** (Chain ID: 42161) - Destination chain for wcCOP

### Testnet  
- **Celo Alfajores** (Chain ID: 44787) - Test cCOP and Treasury
- **Base Sepolia** (Chain ID: 84532) - Test wcCOP
- **Arbitrum Sepolia** (Chain ID: 421614) - Test wcCOP

## Setup and Installation

### Prerequisites

- [Node.js](https://nodejs.org/en/) (version 18 or higher)
- [pnpm](https://pnpm.io/installation) (recommended package manager)

### Installation Steps

1. **Navigate to the dApp directory**:
   ```bash
   cd dapp
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Environment Setup** (Optional):
   ```bash
   cp .env.example .env.local
   # Edit .env.local if you need custom configurations
   ```

4. **Start development server**:
   ```bash
   pnpm dev
   ```

5. **Open application**:
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout with AppKit provider
│   ├── page.tsx           # Main bridge interface
│   ├── globals.css        # Global styles
│   └── fonts/             # Custom font files
├── components/             # React UI components
│   ├── ConnectButton.tsx      # Wallet connection component
│   ├── WrapperComponent.tsx   # Token wrapping interface
│   ├── UnwrapperComponent.tsx # Token unwrapping interface
│   └── TokenMenu.tsx          # Token selection menu
├── config/                 # Configuration files
│   └── index.ts           # AppKit and wagmi configuration
├── constants/              # Application constants
│   ├── address.tsx        # Contract addresses by network
│   ├── chainID.tsx        # Supported chain configurations
│   └── abis/              # Smart contract ABIs
├── context/                # React context providers
├── hooks/                  # Custom React hooks
│   └── useClientMount.ts  # Client-side mounting hook
└── utils/                  # Utility functions
```

## Configuration

The dApp is pre-configured to work with the deployed wcCOP contracts. Key configurations include:

### Wallet Configuration
- **Project ID**: Pre-configured for wcCOP project
- **Supported Chains**: Celo, Base, Arbitrum (mainnet and testnet)
- **Wallet Providers**: Multiple wallet support via AppKit

### Contract Addresses
Contract addresses are automatically selected based on the connected network:

- **Testnet Contracts**: Used when connected to Alfajores, Base Sepolia, or Arbitrum Sepolia
- **Mainnet Contracts**: Used when connected to production networks

## Usage

### Connecting Wallet
1. Click "Connect Wallet" button
2. Select your preferred wallet provider
3. Approve connection in your wallet
4. The dApp will automatically detect your network

### Wrapping Tokens (Celo → Base/Arbitrum)
1. Connect to Celo network
2. Enter amount of cCOP to wrap
3. Select destination chain (Base or Arbitrum)
4. Approve cCOP spending (first time only)
5. Confirm wrapping transaction
6. Switch to destination network to see wcCOP tokens

### Unwrapping Tokens (Base/Arbitrum → Celo)
1. Connect to Base or Arbitrum network
2. Enter amount of wcCOP to unwrap
3. Enter your Celo address to receive cCOP
4. Confirm unwrapping transaction
5. cCOP will be released on Celo network

## Development Scripts

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linting
pnpm lint

# Type checking
pnpm type-check
```

## Key Components

### ConnectButton
Handles wallet connection and network switching with user-friendly prompts.

### WrapperComponent  
Interface for wrapping cCOP tokens, including:
- Amount input validation
- Destination chain selection
- Approval flow management
- Transaction status tracking

### UnwrapperComponent
Interface for unwrapping wcCOP tokens, including:
- Balance checking
- Destination address input
- Burn and unlock flow
- Cross-chain transaction monitoring

### TokenMenu
Token selection and balance display component with real-time updates.

## Environment Variables

The dApp uses the following environment variables (all optional with defaults):

```bash
# Reown Project ID (pre-configured)
NEXT_PUBLIC_PROJECT_ID=

# Additional configuration (if needed)
NEXT_PUBLIC_ENABLE_TESTNETS=
```

## Troubleshooting

### Common Issues

1. **Wallet Connection Issues**
   - Ensure wallet is installed and unlocked
   - Try refreshing the page
   - Clear browser cache if persistent

2. **Network Switching**
   - Some wallets require manual network addition
   - Check that the correct network is selected
   - Verify RPC endpoints are working

3. **Transaction Failures**
   - Ensure sufficient gas fees
   - Check token allowances
   - Verify contract addresses are correct

4. **Cross-Chain Delays**
   - Cross-chain transactions can take several minutes
   - Check Hyperlane explorer for message status
   - Be patient with cross-chain finalization

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes in the `dapp` directory
4. Test thoroughly: `pnpm lint && pnpm build`
5. Commit changes: `git commit -m 'Add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## Resources

- [Reown AppKit Documentation](https://docs.reown.com)
- [Next.js Documentation](https://nextjs.org/docs)
- [Wagmi Documentation](https://wagmi.sh)
- [Viem Documentation](https://viem.sh)
- [Hyperlane Documentation](https://docs.hyperlane.xyz/)

## License

This project is licensed under the MIT License - see the [license](../license) file for details.
