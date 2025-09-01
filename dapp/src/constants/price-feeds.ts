import { chainID } from './chainID';

// NOTE: PRICE_FEED_ADDRESSES is deprecated - COP/USD is now read from TOKEN_PRICE_FEEDS.COP_USD
// This constant is kept for backwards compatibility but is not used in the current implementation
export const PRICE_FEED_ADDRESSES = {
  // Deprecated - use TOKEN_PRICE_FEEDS.COP_USD instead
  [chainID.mainnet.celo]: "0x0000000000000000000000000000000000000000",
  [chainID.mainnet.base]: "0x0000000000000000000000000000000000000000",
  [chainID.mainnet.arb]: "0x0000000000000000000000000000000000000000",
  [chainID.mainnet.op]: "0x0000000000000000000000000000000000000000",
  [chainID.mainnet.avax]: "0x0000000000000000000000000000000000000000",
  
  [chainID.testnet.celo]: "0x0000000000000000000000000000000000000000",
  [chainID.testnet.base]: "0x0000000000000000000000000000000000000000",
  [chainID.testnet.arb]: "0x0000000000000000000000000000000000000000",
  [chainID.testnet.op]: "0x0000000000000000000000000000000000000000",
  [chainID.testnet.avax]: "0x0000000000000000000000000000000000000000",
} as const;

// Individual price feed addresses for specific tokens
export const TOKEN_PRICE_FEEDS = {
  ETH_USD: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419", // Ethereum Mainnet ETH/USD
  AVAX_USD: "0x0A77230d17318075983913bC2145DB16C7366156", // Avalanche Mainnet AVAX/USD
  CELO_USD: "0x0568fD19986748cEfF3301e55c0eb1E729E0Ab7e", // Celo Mainnet CELO/USD
  COP_USD: "0x97b770B0200CCe161907a9cbe0C6B177679f8F7C", // Celo Mainnet COP/USD
} as const;

// Fallback prices for when Chainlink feeds are not available
export const FALLBACK_PRICES = {
  COP_USD: 0.00025, // Approximately 1 COP = $0.00025 USD
  CELO_USD: 0.5,    // Approximately 1 CELO = $0.5 USD
  ETH_USD: 3000,    // Approximately 1 ETH = $3000 USD
  AVAX_USD: 35,     // Approximately 1 AVAX = $35 USD
} as const;

// Price feed status for each network
export const getPriceFeedStatus = () => {
  return {
    celo: {
      mainnet: PRICE_FEED_ADDRESSES[chainID.mainnet.celo] !== "0x0000000000000000000000000000000000000000",
      testnet: PRICE_FEED_ADDRESSES[chainID.testnet.celo] !== "0x0000000000000000000000000000000000000000",
    },
    base: {
      mainnet: PRICE_FEED_ADDRESSES[chainID.mainnet.base] !== "0x0000000000000000000000000000000000000000",
      testnet: PRICE_FEED_ADDRESSES[chainID.testnet.base] !== "0x0000000000000000000000000000000000000000",
    },
    arbitrum: {
      mainnet: PRICE_FEED_ADDRESSES[chainID.mainnet.arb] !== "0x0000000000000000000000000000000000000000",
      testnet: PRICE_FEED_ADDRESSES[chainID.testnet.arb] !== "0x0000000000000000000000000000000000000000",
    },
    optimism: {
      mainnet: PRICE_FEED_ADDRESSES[chainID.mainnet.op] !== "0x0000000000000000000000000000000000000000",
      testnet: PRICE_FEED_ADDRESSES[chainID.testnet.op] !== "0x0000000000000000000000000000000000000000",
    },
    avalanche: {
      mainnet: PRICE_FEED_ADDRESSES[chainID.mainnet.avax] !== "0x0000000000000000000000000000000000000000",
      testnet: PRICE_FEED_ADDRESSES[chainID.testnet.avax] !== "0x0000000000000000000000000000000000000000",
    },
  };
};

// Instructions for setting up price feeds
export const PRICE_FEED_SETUP_INSTRUCTIONS = `
Current Setup:
- COP/USD: Using Polygon price feed for all networks (0x8bDd...3C10)
- ETH/USD: Using Ethereum Mainnet feed (0x5f4e...8419)
- AVAX/USD: Using Avalanche Mainnet feed (0x0A77...6156)
- CELO/USD: Using Celo Mainnet feed (0x0568...b7e)

All feeds source data from official Chainlink price oracles:
Source: https://docs.chain.link/data-feeds/price-feeds/addresses

Benefits:
- Real-time price data directly from Chainlink oracles
- Decentralized and reliable price sources
- Network-specific feeds for better accuracy
- Automatic fallback to static prices if feeds fail

Gas fee calculations now use:
- CELO price for Celo network gas estimates
- ETH price for Ethereum, Base, Arbitrum, Optimism
- AVAX price for Avalanche network gas estimates
`; 