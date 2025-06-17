# Wrapped cCOP (wCOP) Bridge

A secure cross-chain system using Chainlink CCIP to wrap cCOP from Celo to Base.

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
