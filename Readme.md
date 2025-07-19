# Wrapped cCOP (wCOP) Bridge
A secure cross-chain system using Chainlink CCIP to wrap cCOP from Celo to Base & Arbitrum.

## Description
This project is a decentralized application (dApp) that enables users to seamlessly bridge cCOP tokens between the Celo <> Base & Arbitrum blockchains. It leverages Hyperlane Interoperability for secure and reliable cross-chain token transfers. The platform features a user-friendly interface for depositing, burning, and tracking cCOP tokens across both networks.

## Mission
Empower users with a safe, transparent, and easy-to-use platform for cross-chain cCOP token transfers, advancing blockchain interoperability and accessibility through decentralized technology and robust security.

## Problem
Transferring tokens between different blockchains is often complex, risky, and requires users to trust centralized bridges or intermediaries. Existing solutions may lack transparency, security, or ease of use, making cross-chain interoperability a significant challenge for both users and developers.

## Solution 
Our dApp provides a secure, decentralized, and intuitive way to bridge cCOP tokens between Celo and Base. By integrating Hyperlane, we ensure that token transfers are trust-minimized and protected by industry-leading security standards. The frontend offers a seamless user experience for connecting wallets, managing tokens, and viewing transaction history, all without relying on centralized custodians.

## Structure
- `contracts/`: Solidity smart contracts
- `deploy/`: Deployment scripts
- `.env.example`: Config template
- `hardhat.config.ts`: Configured for Celo and Base mainnet

## Deployment

### 1. Install dependencies

```bash
npm install
```

### 2. Set up `.env`

```bash
cp .env.example .env
```

Fill in with your private key and router/token addresses.

### 3. Compile

```bash
npx hardhat compile
```

### 4. Deploy to Celo

```bash
npx hardhat run deploy/deployCeloVault.ts --network celo
```

### 5. Deploy to Base

```bash
npx hardhat run deploy/deployBaseWrapped.ts --network base
```

## Testing

Use the sample test script in `test/wcop.test.ts` or write your own using Hardhat and Chai.

## License

MIT
