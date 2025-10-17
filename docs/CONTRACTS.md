# cCOP Wrapper Contracts

Smart contracts for the Wrapped Celo Colombian Peso (wcCOP) project, enabling secure cross-chain transfers of the Celo Colombian Peso (cCOP) token using Hyperlane infrastructure.

## Overview

This project contains the smart contracts for wrapping and managing cCOP tokens across multiple blockchain networks:

### Contracts

- **WrappedCCOP.sol**: Main ERC20 wrapper contract for cCOP with cross-chain functionality
- **Treasury.sol**: Treasury management contract for handling wrapped tokens
- **CCOPMock.sol**: Mock cCOP token for testing purposes

### Supported Networks

- **Celo** (Mainnet & Alfajores Testnet) - Source chain for cCOP
- **Base** (Mainnet & Sepolia Testnet) - Target chain for wcCOP
- **Arbitrum** (Mainnet & Sepolia Testnet) - Target chain for wcCOP

## Development Setup

This project uses **Foundry** for development and testing.

### Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- Node.js (for Hyperlane dependencies)

### Installation

```shell
# Install Foundry dependencies
forge install

# Install Node.js dependencies
npm install
```

### Environment Setup

Create a `.env` file with the required environment variables:

```shell
# RPC URLs
RPC_URL_CELO_MAINNET=
RPC_URL_CELO_ALFAJORES=
RPC_URL_BASE_MAINNET=
RPC_URL_BASE_SEPOLIA=
RPC_URL_ARB_MAINNET=
RPC_URL_ARB_TESTNET=

# API Keys
ETHERSCAN_API=
```

## Usage

### Build

```shell
forge build
```

### Test

```shell
# Run all tests
forge test

# Run unit tests for specific contract
make unitTest contract=<ContractName> type=<correct|revert>

# Run fuzz tests
make fuzzTest contract=<ContractName>
```

### Format

```shell
forge fmt
```

### Gas Snapshots

```shell
forge snapshot
```

## Deployment

Use the provided Makefile for deployment to different networks:

### Testnet Deployments

```shell
# Deploy CCOPMock to Celo Alfajores
make deployCCOPMock

# Deploy Treasury to Celo Alfajores
make deployTreasury_TEST

# Deploy WrappedCCOP to Base Sepolia
make deployWrappedCCOP_BaseTest

# Deploy WrappedCCOP to Arbitrum Sepolia
make deployWrappedCCOP_ArbTest
```

### Mainnet Deployments

```shell
# Deploy Treasury to Celo Mainnet
make deployTreasury

# Deploy WrappedCCOP to Base Mainnet
make deployWrappedCCOP_Base

# Deploy WrappedCCOP to Arbitrum Mainnet
make deployWrappedCCOP_Arb
```

## Architecture

The project leverages **Hyperlane** for secure cross-chain communication, allowing users to:

1. Lock cCOP tokens in the Treasury contract on Celo
2. Mint equivalent wcCOP tokens on target chains (Base, Arbitrum)
3. Burn wcCOP tokens to unlock original cCOP tokens

## Testing

The test suite includes:

- **Unit tests**: Located in `test/unit/` with separate folders for correct and revert scenarios
- **Fuzz tests**: Located in `test/fuzz/` for property-based testing
- **Integration tests**: Testing cross-chain functionality

## License

This project is licensed under the MIT License.
