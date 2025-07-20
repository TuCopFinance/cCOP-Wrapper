# Wrapped cCOP (wcCOP) - Cross-Chain Bridge

A decentralized and secure system for wrapping cCOP tokens from the Celo network to Base and Arbitrum, using **Hyperlane** for cross-chain messaging, **Foundry** for smart contract development, and a **Next.js** frontend for seamless user interaction.

## Mission

To empower users with a secure, transparent, and easy-to-use platform for cross-chain cCOP token transfers, promoting interoperability and accessibility in the blockchain ecosystem.

## Problem

Transferring tokens between different blockchains is often a complex and risky process that requires users to trust centralized bridges. Existing solutions may lack transparency, security, or ease of use, making cross-chain interoperability a significant challenge.

## Solution

Our dApp provides a secure, decentralized, and intuitive way to bridge cCOP tokens between Celo, Base, and Arbitrum using **Hyperlane's** trust-minimized cross-chain infrastructure. The smart contracts, developed with Foundry, ensure that token transfers are secure and verifiable. The frontend offers a seamless user experience for connecting wallets, managing tokens, and viewing transaction history, all without relying on centralized custodians.

## Key Features

### Cross-Chain Infrastructure
- **Hyperlane Integration**: Leverages Hyperlane's permissionless interoperability protocol
- **Multi-Chain Support**: Celo (source), Base, and Arbitrum (destinations)
- **Trust-Minimized**: No centralized custodians or trusted relayers required

### Smart Contract Features
- **Lock & Mint**: Lock cCOP on Celo, mint wcCOP on destination chains
- **Burn & Unlock**: Burn wcCOP to unlock original cCOP tokens
- **Treasury Management**: Secure fund management with admin controls
- **Gas Optimization**: Efficient cross-chain message encoding

### Frontend Features
- **Multi-Wallet Support**: Connect with various wallets via AppKit/WalletConnect
- **Real-Time Updates**: Live transaction status and balance tracking
- **Responsive Design**: Modern UI compatible across devices
- **Network Switching**: Seamless switching between supported networks
- **Libraries:** 
  - OpenZeppelin Contracts (ERC20, security)
  - Hyperlane Core (cross-chain messaging)
  - Forge-Std (testing utilities)
- **Supported Networks:** 
  - **Celo** (Mainnet: 42220, Alfajores Testnet: 44787)
  - **Base** (Mainnet: 8453, Sepolia Testnet: 84532) 
  - **Arbitrum** (Mainnet: 42161, Sepolia Testnet: 421614)
- **Key Contracts:**
  - `Treasury.sol`: Manages cCOP locking/unlocking and cross-chain message initiation on Celo
  - `WrappedCCOP.sol`: ERC20 wrapper contract handling wcCOP minting/burning on destination chains
  - `CCOPMock.sol`: Test ERC20 token simulating cCOP for development/testing

### dApp (Frontend)
- **Framework:** Next.js 15.3.0 (React 19.0.0)
- **Language:** TypeScript
- **UI Components:** Custom React components with CSS modules
- **Wallet Integration:** 
  - `@reown/appkit` v1.7.10 (based on Wagmi and WalletConnect)
  - Multi-chain wallet connection and network switching
- **Blockchain Interaction:**
  - `wagmi` v2.12.31 (React hooks for Ethereum)
  - `viem` v2.21.44 (TypeScript Ethereum library)
  - `@tanstack/react-query` v5.59.20 (data fetching and caching)
- **Additional Features:**
  - `react-hot-toast` for user notifications
  - `react-spinner-toolkit` for loading states
  - `@divvi/referral-sdk` for referral system integration

## Deployed Contracts

### Mainnet Addresses
- **Celo Mainnet (42220)**
  - cCOP Token: `0x8A567e2aE79CA692Bd748aB832081C45de4041eA`
  - Treasury: `0x5Cc112D9634a2D0cB3A0BA8dDC5dC05a010A3D22`

- **Base Mainnet (8453)**
  - wcCOP Token: `0x5Cc112D9634a2D0cB3A0BA8dDC5dC05a010A3D22`

- **Arbitrum Mainnet (42161)**
  - wcCOP Token: `0x5Cc112D9634a2D0cB3A0BA8dDC5dC05a010A3D22`

### Testnet Addresses  
- **Celo Alfajores (44787)**
  - cCOP Mock: `0xeF760Ba3281205ec8baB0E63Be0c74a734D11825`
  - Treasury: `0xAF4387cC9105C9B716B9B84F673996dCa7ac5150`

- **Base Sepolia (84532)**
  - wcCOP Token: `0x7B9AeD47626Fb43a4EFbFa11c21143158F5C3094`

- **Arbitrum Sepolia (421614)**
  - wcCOP Token: *To be deployed*

## Project Structure

```
/
├── contracts/          # Smart contracts and Foundry workspace
│   ├── src/           # Contract source code
│   │   ├── Treasury.sol       # Main treasury contract (Celo)
│   │   ├── WrappedCCOP.sol   # Wrapped token contract (Base/Arbitrum)
│   │   └── CCOPMock.sol      # Mock cCOP for testing
│   ├── script/        # Deployment and interaction scripts
│   │   ├── Treasury.s.sol         # Treasury deployment script
│   │   ├── WrappedCCOP_BASE.s.sol # Base deployment script  
│   │   ├── WrappedCCOP_ARB.s.sol  # Arbitrum deployment script
│   │   └── CCOPMock.s.sol         # Mock token deployment
│   ├── test/          # Comprehensive test suite
│   │   ├── unit/      # Unit tests (correct/revert scenarios)
│   │   └── fuzz/      # Fuzz testing for property validation
│   ├── lib/           # External dependencies (OpenZeppelin, Hyperlane)
│   ├── foundry.toml   # Foundry configuration
│   ├── makefile       # Deployment automation scripts
│   └── package.json   # Node.js dependencies (Hyperlane)
│
├── dapp/              # Next.js web application
│   ├── src/
│   │   ├── app/       # Next.js app router pages
│   │   ├── components/ # React UI components
│   │   │   ├── ConnectButton.tsx      # Wallet connection
│   │   │   ├── WrapperComponent.tsx   # Token wrapping interface
│   │   │   ├── UnwrapperComponent.tsx # Token unwrapping interface
│   │   │   └── TokenMenu.tsx          # Token selection menu
│   │   ├── config/    # AppKit and network configuration
│   │   ├── constants/ # Contract addresses and chain IDs
│   │   │   ├── address.tsx   # Deployed contract addresses
│   │   │   ├── chainID.tsx   # Supported chain configurations
│   │   │   └── abis/         # Contract ABI definitions
│   │   ├── context/   # React context providers
│   │   ├── hooks/     # Custom React hooks
│   │   └── utils/     # Utility functions
│   ├── public/        # Static assets (logos, icons)
│   ├── package.json   # Frontend dependencies
│   └── next.config.ts # Next.js configuration
│
└── README.md          # This file
```

## Local Development

Follow these steps to set up the development environment on your local machine.

### Prerequisites
- [Foundry](https://getfoundry.sh/) - Ethereum development toolkit
- [Node.js](https://nodejs.org/en/) (version 18 or higher)
- [pnpm](https://pnpm.io/installation) (recommended package manager)

### 1. Setting up the Contracts

1. Navigate to the contracts directory:
   ```bash
   cd contracts
   ```

2. Install Solidity dependencies:
   ```bash
   forge install
   ```

3. Install Node.js dependencies (for Hyperlane):
   ```bash
   npm install
   ```

4. Create environment file:
   ```bash
   cp .env.example .env
   # Edit .env with your private keys and RPC URLs
   ```

5. Compile the contracts:
   ```bash
   forge build
   ```

6. Run the test suite:
   ```bash
   forge test
   
   # Run specific test types
   make unitTest contract=Treasury type=correct
   make fuzzTest contract=WrappedCCOP
   ```

### 2. Setting up the dApp

1. Navigate to the dApp directory:
   ```bash
   cd dapp
   ```

2. Install frontend dependencies:
   ```bash
   pnpm install
   ```

3. Start the development server:
   ```bash
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

### Environment Setup

Create a `.env` file in the `contracts` directory with:

```bash
# Private Keys (use test keys for testnet)
PRIVATE_KEY=your_private_key_here

# RPC URLs
RPC_URL_CELO_MAINNET=https://forno.celo.org
RPC_URL_CELO_ALFAJORES=https://alfajores-forno.celo-testnet.org
RPC_URL_BASE_MAINNET=https://mainnet.base.org
RPC_URL_BASE_SEPOLIA=https://sepolia.base.org
RPC_URL_ARB_MAINNET=https://arb1.arbitrum.io/rpc
RPC_URL_ARB_TESTNET=https://sepolia-rollup.arbitrum.io/rpc

# API Keys for verification
ETHERSCAN_API=your_etherscan_api_key
```

### Deployment Commands

Use the provided Makefile for streamlined deployment:

#### Testnet Deployment
```bash
# Deploy mock cCOP token (Celo Alfajores)
make deployCCOPMock

# Deploy Treasury contract (Celo Alfajores) 
make deployTreasury_TEST

# Deploy wcCOP on Base Sepolia
make deployWrappedCCOP_BaseTest

# Deploy wcCOP on Arbitrum Sepolia
make deployWrappedCCOP_ArbTest
```

#### Mainnet Deployment
```bash
# Deploy Treasury (Celo Mainnet)
make deployTreasury

# Deploy wcCOP on Base Mainnet
make deployWrappedCCOP_Base

# Deploy wcCOP on Arbitrum Mainnet  
make deployWrappedCCOP_Arb
```

### Manual Deployment
For custom deployment parameters:

```bash
# Example: Deploy to Base Mainnet
forge script script/WrappedCCOP_BASE.s.sol:WrappedCCOP_Base_Script \
    --rpc-url $RPC_URL_BASE_MAINNET \
    --account defaultKey \
    --broadcast \
    --verify \
    --etherscan-api-key $ETHERSCAN_API
```

## How It Works

### Cross-Chain Flow

1. **Wrapping Process (Celo → Base/Arbitrum)**:
   - User approves cCOP spending on Treasury contract
   - User calls `wrapTo()` on Treasury with destination chain and amount
   - Treasury locks cCOP tokens and sends cross-chain message via Hyperlane
   - Destination chain receives message and mints equivalent wcCOP to user

2. **Unwrapping Process (Base/Arbitrum → Celo)**:
   - User calls `unwrapTo()` on wcCOP contract with Celo address and amount
   - wcCOP contract burns user's tokens and sends cross-chain message
   - Treasury receives message and releases locked cCOP to specified address

### Security Features

- **Multi-signature Admin**: Treasury and wcCOP contracts have admin controls for emergency situations
- **Chain Validation**: Only authorized chains can send/receive cross-chain messages
- **Amount Validation**: Prevents zero-amount and overflow attacks
- **Hyperlane Security**: Leverages Hyperlane's validator network for message verification

## Testing

The project includes comprehensive testing:

### Contract Tests
```bash
# Run all tests
forge test

# Unit tests with specific scenarios
make unitTest contract=Treasury type=correct
make unitTest contract=Treasury type=revert

# Fuzz testing for edge cases
make fuzzTest contract=WrappedCCOP
make fuzzTest contract=Treasury

# Gas analysis
forge snapshot
```

### Frontend Testing
```bash
cd dapp
pnpm lint      # ESLint checks
pnpm build     # Production build test
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Run tests: `forge test` and `pnpm lint`
4. Commit changes: `git commit -m 'Add amazing feature'`
5. Push to branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

## Security Considerations

- All contracts are upgradeable through admin functions for emergency situations
- Cross-chain messages are validated through Hyperlane's security model
- Treasury contract implements secure token locking mechanisms
- Regular security audits recommended before mainnet deployment

## License

This project is licensed under the MIT License. See the [license](license) file for more details.

## Links

- [Hyperlane Documentation](https://docs.hyperlane.xyz/)
- [Foundry Documentation](https://book.getfoundry.sh/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Celo Documentation](https://docs.celo.org/)
