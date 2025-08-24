import { chainID } from './chainID';

// Chainlink Price Feed addresses for COP/USD
// Using Polygon price feeds as reference for all networks
// Source: https://docs.chain.link/data-feeds/price-feeds/addresses

export const PRICE_FEED_ADDRESSES = {
  // Mainnet addresses - Using Polygon COP/USD feed for all networks
  [chainID.mainnet.celo]: "0x8bDd8DBcBDf0C066cA5f3286d33673aA7A553C10", // Polygon COP/USD feed
  [chainID.mainnet.base]: "0x8bDd8DBcBDf0C066cA5f3286d33673aA7A553C10", // Polygon COP/USD feed
  [chainID.mainnet.arb]: "0x8bDd8DBcBDf0C066cA5f3286d33673aA7A553C10", // Polygon COP/USD feed
  [chainID.mainnet.op]: "0x8bDd8DBcBDf0C066cA5f3286d33673aA7A553C10", // Polygon COP/USD feed
  [chainID.mainnet.avax]: "0x8bDd8DBcBDf0C066cA5f3286d33673aA7A553C10", // Polygon COP/USD feed
  
  // Testnet addresses - Using Polygon Mumbai testnet feed
  [chainID.testnet.celo]: "0x0000000000000000000000000000000000000000", // No testnet feed available
  [chainID.testnet.base]: "0x0000000000000000000000000000000000000000", // No testnet feed available
  [chainID.testnet.arb]: "0x0000000000000000000000000000000000000000", // No testnet feed available
  [chainID.testnet.op]: "0x0000000000000000000000000000000000000000", // No testnet feed available
  [chainID.testnet.avax]: "0x0000000000000000000000000000000000000000", // No testnet feed available
} as const;

// Fallback prices for when Chainlink feeds are not available
export const FALLBACK_PRICES = {
  COP_USD: 0.00025, // Approximately 1 COP = $0.00025 USD
  CELO_USD: 0.5,    // Approximately 1 CELO = $0.5 USD
  ETH_USD: 3000,    // Approximately 1 ETH = $3000 USD
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
Current Setup: Using Polygon COP/USD price feeds for all networks

Polygon COP/USD Feed Address: 0x8bDd8DBcBDf0C066cA5f3286d33673aA7A553C10
Source: https://docs.chain.link/data-feeds/price-feeds/addresses

This approach:
- Uses a reliable, well-maintained price feed from Polygon
- Provides consistent pricing across all networks
- Reduces complexity by using a single source of truth

Alternative approaches:
- Use network-specific price feeds if available
- Set up custom price feeds for each network
- Use alternative price oracle services
`; 