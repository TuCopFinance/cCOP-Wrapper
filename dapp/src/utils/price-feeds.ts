import { config } from '@/config';
import { readContract } from '@wagmi/core';
import { PRICE_FEED_ADDRESSES, FALLBACK_PRICES, TOKEN_PRICE_FEEDS } from '@/constants/price-feeds';
import { formatNumber, formatUSDAmount } from '@/utils/number-format';
// Remove toast import as we'll use inline indicators instead

// Polygon chain ID for price feed reading (currently unused)
// const POLYGON_CHAIN_ID = 137;

// Chainlink Price Feed ABI (simplified for latestRoundData)
const CHAINLINK_PRICE_FEED_ABI = [
  {
    inputs: [],
    name: "latestRoundData",
    outputs: [
      { internalType: "uint80", name: "roundId", type: "uint80" },
      { internalType: "int256", name: "answer", type: "int256" },
      { internalType: "uint256", name: "startedAt", type: "uint256" },
      { internalType: "uint256", name: "updatedAt", type: "uint256" },
      { internalType: "uint80", name: "answeredInRound", type: "uint80" }
    ],
    stateMutability: "view",
    type: "function"
  }
] as const;

// Cache for price data
let priceCache: {
  price: number;
  timestamp: number;
} | null = null;

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Track which price feeds are using fallback prices
// null = not called yet, false = working, true = using fallback
export const fallbackPriceStatus = {
  copUsd: null as boolean | null,
  celoUsd: null as boolean | null,
  ethUsd: null as boolean | null,
  avaxUsd: null as boolean | null,
};

// Force reset on every module load to ensure clean state
fallbackPriceStatus.copUsd = null;
fallbackPriceStatus.celoUsd = null;
fallbackPriceStatus.ethUsd = null;
fallbackPriceStatus.avaxUsd = null;

// Debug: let's see the initial state
console.log('🚀 Initial fallbackPriceStatus (force reset):', fallbackPriceStatus);

/**
 * Reset fallback status (useful for testing)
 */
export const resetFallbackStatus = (): void => {
  fallbackPriceStatus.copUsd = null;
  fallbackPriceStatus.celoUsd = null;
  fallbackPriceStatus.ethUsd = null;
  fallbackPriceStatus.avaxUsd = null;
};

/**
 * Get the latest COP/USD price from Chainlink price feeds
 * @param chainId - The chain ID to get the price for
 * @returns The COP/USD price as a number
 */
export const getCOPUSDPrice = async (chainId: number): Promise<number> => { // eslint-disable-line @typescript-eslint/no-unused-vars
  try {
    // Check cache first
    if (priceCache && Date.now() - priceCache.timestamp < CACHE_DURATION) {
      console.log('Using cached COP/USD price:', priceCache.price);
      return priceCache.price;
    }

    console.log('Reading COP/USD price from Celo Chainlink feed:', TOKEN_PRICE_FEEDS.COP_USD);
    
    // Read from Celo mainnet COP/USD price feed
    const result = await readContract(config, {
      address: TOKEN_PRICE_FEEDS.COP_USD as `0x${string}`,
      abi: CHAINLINK_PRICE_FEED_ABI,
      functionName: 'latestRoundData',
      chainId: 42220, // Celo Mainnet
    });

    // Chainlink COP/USD prices are typically returned with 8 decimals
    const price = Number(result[1]) / 100000000;
    
    console.log('Chainlink COP/USD price:', price);
    
    // Cache the price and reset fallback status
    priceCache = {
      price,
      timestamp: Date.now()
    };
    
    fallbackPriceStatus.copUsd = false;
    return price;
  } catch (error) {
    console.error('Error fetching COP/USD price from Chainlink:', error);
    console.log('Using fallback COP/USD price:', FALLBACK_PRICES.COP_USD);
    fallbackPriceStatus.copUsd = true;
    return FALLBACK_PRICES.COP_USD;
  }
};

/**
 * Format token amount consistently across the application
 * @param amount - The numeric amount
 * @param tokenSymbol - The token symbol (e.g., 'cCOP', 'wcCOP')
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted token string
 */
export const formatTokenAmount = (amount: number, tokenSymbol: string, decimals: number = 2): string => {
  return `${formatNumber(amount, decimals)} ${tokenSymbol}`;
};

/**
 * Format gas and token prices with 4 decimal places for precision
 * @param amount - The numeric amount
 * @param tokenSymbol - The token symbol (e.g., 'CELO', 'ETH')
 * @returns Formatted token string with 4 decimals
 */
export const formatGasAndTokenPrice = (amount: number, tokenSymbol: string): string => {
  console.log(`formatGasAndTokenPrice - Input amount: ${amount}, tokenSymbol: ${tokenSymbol}`);
  const result = formatTokenAmount(amount, tokenSymbol, 4);
  console.log(`formatGasAndTokenPrice - Output result: ${result}`);
  return result;
};

/**
 * Format gas and token prices with USD value first, then token amount
 * @param usdValue - The USD value
 * @param tokenAmount - The token amount
 * @param tokenSymbol - The token symbol (e.g., 'CELO', 'ETH')
 * @returns Formatted string: "$0.35 USD (0.7060 CELO)"
 */
export const formatGasAndTokenPriceWithUSD = (usdValue: number, tokenAmount: number, tokenSymbol: string): string => {
  return `${formatUSDAmount(usdValue, 2)} (${formatNumber(tokenAmount, 4)} ${tokenSymbol})`;
};

/**
 * Format USD value consistently across the application
 * @param value - The numeric USD value
 * @param includeApproximate - Whether to include the ~ symbol (default: true)
 * @returns Formatted USD string
 */
export const formatUSDValue = (value: number, includeApproximate: boolean = true): string => {
  const prefix = includeApproximate ? '~' : '';
  return `${prefix}${formatUSDAmount(value, 2)}`;
};

/**
 * Calculate USD value for a given amount of cCOP tokens
 * @param amount - The amount of cCOP tokens
 * @param chainId - The chain ID to get the price for
 * @returns The USD value as a formatted string
 */
export const calculateUSDValue = async (amount: string, chainId: number): Promise<string> => {
  try {
    const numAmount = parseFloat(amount) || 0;
    const copUsdPrice = await getCOPUSDPrice(chainId);
    const usdValue = numAmount * copUsdPrice;
    
    return formatUSDValue(usdValue, true);
  } catch (error) {
    console.error('Error calculating USD value:', error);
    // Fallback calculation
    const numAmount = parseFloat(amount) || 0;
    const fallbackValue = numAmount * FALLBACK_PRICES.COP_USD;
    return formatUSDValue(fallbackValue, true);
  }
};

/**
 * Get price feed status for debugging
 * @param chainId - The chain ID to check
 * @returns Status information about the price feed
 */
export const getPriceFeedStatus = (chainId: number): {
  hasPriceFeed: boolean;
  address: string;
  fallbackPrice: number;
} => {
  const priceFeedAddress = PRICE_FEED_ADDRESSES[chainId as keyof typeof PRICE_FEED_ADDRESSES];
  
  return {
    hasPriceFeed: priceFeedAddress && priceFeedAddress !== "0x0000000000000000000000000000000000000000",
    address: priceFeedAddress || "Not configured",
    fallbackPrice: FALLBACK_PRICES.COP_USD
  };
};

/**
 * Clear the price cache (useful for testing or forcing refresh)
 */
export const clearPriceCache = (): void => {
  priceCache = null;
  console.log('Price cache cleared');
};

/**
 * Get fallback indicator text for UI labels
 * @param tokenType - The token type ('celo', 'eth', 'avax', 'cop')
 * @returns Red warning text if fallback is being used, empty string otherwise
 */
export const getFallbackIndicator = (tokenType: 'celo' | 'eth' | 'avax' | 'cop'): string => {
  const statusMap = {
    celo: fallbackPriceStatus.celoUsd,
    eth: fallbackPriceStatus.ethUsd,
    avax: fallbackPriceStatus.avaxUsd,
    cop: fallbackPriceStatus.copUsd,
  };
  
  const result = statusMap[tokenType] === true ? ' (precio estimado)' : '';
  
  console.log(`🔍 getFallbackIndicator(${tokenType}):`, {
    status: statusMap[tokenType],
    statusType: typeof statusMap[tokenType],
    strictComparison: statusMap[tokenType] === true,
    fullStatus: fallbackPriceStatus,
    result: result,
    resultLength: result.length
  });
  
  // Only show warning if explicitly set to true (fallback is being used)
  // null = not called yet, false = working, true = using fallback
  return result;
};

/**
 * Debug function to test price feed functionality
 */
export const debugPriceFeed = async (chainId: number, amount: string): Promise<void> => {
  console.log('=== PRICE FEED DEBUG ===');
  console.log('Chain ID:', chainId);
  console.log('Amount:', amount);
  
  const priceFeedAddress = PRICE_FEED_ADDRESSES[chainId as keyof typeof PRICE_FEED_ADDRESSES];
  console.log('Price Feed Address:', priceFeedAddress);
  
  try {
    const copUsdPrice = await getCOPUSDPrice(chainId);
    console.log('COP/USD Price:', copUsdPrice);
    
    const usdValue = await calculateUSDValue(amount, chainId);
    console.log('USD Value:', usdValue);
    
    const numAmount = parseFloat(amount) || 0;
    const calculatedValue = numAmount * copUsdPrice;
    console.log('Calculated Value:', calculatedValue);
    console.log('Expected for 1000 COP:', 1000 * copUsdPrice);
  } catch (error) {
    console.error('Error in debug:', error);
  }
  console.log('=== END DEBUG ===');
}; 

/**
 * Get the latest CELO/USD price from Chainlink price feeds
 * @returns The CELO/USD price as a number
 */
export const getCELOUSDPrice = async (): Promise<number> => {
  try {
    console.log('Reading CELO/USD price from Chainlink feed:', TOKEN_PRICE_FEEDS.CELO_USD);
    
    // Read from Celo mainnet CELO/USD price feed
    const result = await readContract(config, {
      address: TOKEN_PRICE_FEEDS.CELO_USD as `0x${string}`,
      abi: CHAINLINK_PRICE_FEED_ABI,
      functionName: 'latestRoundData',
      chainId: 42220, // Celo Mainnet
    });

    // Chainlink CELO/USD prices are typically returned with 8 decimals
    const price = Number(result[1]) / 100000000;
    
    console.log('Chainlink CELO/USD price:', price);
    fallbackPriceStatus.celoUsd = false;
    return price;
  } catch (error) {
    console.error('Error fetching CELO/USD price from Chainlink:', error);
    console.log('Using fallback CELO/USD price:', FALLBACK_PRICES.CELO_USD);
    fallbackPriceStatus.celoUsd = true;
    return FALLBACK_PRICES.CELO_USD;
  }
};

/**
 * Get the latest ETH/USD price from Chainlink price feeds
 * @returns The ETH/USD price as a number
 */
export const getETHUSDPrice = async (): Promise<number> => {
  try {
    console.log('Reading ETH/USD price from Chainlink feed:', TOKEN_PRICE_FEEDS.ETH_USD);
    
    // Read from Ethereum mainnet ETH/USD price feed
    const result = await readContract(config, {
      address: TOKEN_PRICE_FEEDS.ETH_USD as `0x${string}`,
      abi: CHAINLINK_PRICE_FEED_ABI,
      functionName: 'latestRoundData',
      chainId: 1, // Ethereum Mainnet
    });

    // Chainlink ETH/USD prices are typically returned with 8 decimals
    const price = Number(result[1]) / 100000000;
    
    console.log('Chainlink ETH/USD price:', price);
    fallbackPriceStatus.ethUsd = false;
    return price;
  } catch (error) {
    console.error('Error fetching ETH/USD price from Chainlink:', error);
    console.log('Using fallback ETH/USD price:', FALLBACK_PRICES.ETH_USD);
    fallbackPriceStatus.ethUsd = true;
    return FALLBACK_PRICES.ETH_USD;
  }
};

/**
 * Get the latest AVAX/USD price from Chainlink price feeds
 * @returns The AVAX/USD price as a number
 */
export const getAVAXUSDPrice = async (): Promise<number> => {
  try {
    console.log('Reading AVAX/USD price from Chainlink feed:', TOKEN_PRICE_FEEDS.AVAX_USD);
    
    // Read from Avalanche mainnet AVAX/USD price feed
    const result = await readContract(config, {
      address: TOKEN_PRICE_FEEDS.AVAX_USD as `0x${string}`,
      abi: CHAINLINK_PRICE_FEED_ABI,
      functionName: 'latestRoundData',
      chainId: 43114, // Avalanche Mainnet
    });

    // Chainlink AVAX/USD prices are typically returned with 8 decimals
    const price = Number(result[1]) / 100000000;
    
    console.log('Chainlink AVAX/USD price:', price);
    fallbackPriceStatus.avaxUsd = false;
    return price;
  } catch (error) {
    console.error('Error fetching AVAX/USD price from Chainlink:', error);
    console.log('Using fallback AVAX/USD price:', FALLBACK_PRICES.AVAX_USD);
    fallbackPriceStatus.avaxUsd = true;
    return FALLBACK_PRICES.AVAX_USD;
  }
};

/**
 * Format Hyperlane price in USD with original token amount in parentheses
 * @param quote - The quote amount in wei
 * @param isWrapping - Whether this is for wrapping (CELO) or unwrapping (ETH/AVAX)
 * @param chainId - Optional chain ID to determine if AVAX should be used (only for unwrapping)
 * @returns Formatted price string like "$X.XX USD (Y.YYYY CELO/ETH/AVAX)"
 */
export const formatHyperlanePrice = async (quote: bigint, isWrapping: boolean, chainId?: number): Promise<string> => {
  try {
    const quoteInEther = Number(quote) / 1e18;
    
    let usdPrice: number;
    let tokenName: string;
    
    if (isWrapping) {
      // Wrapping always uses CELO
      usdPrice = await getCELOUSDPrice();
      tokenName = 'CELO';
    } else {
      // Unwrapping: check if it's Avalanche
      if (chainId === 43114) { // Avalanche chain ID
        usdPrice = await getAVAXUSDPrice();
        tokenName = 'AVAX';
      } else {
        // Default to ETH for other chains
        usdPrice = await getETHUSDPrice();
        tokenName = 'ETH';
      }
    }
    
    const usdValue = quoteInEther * usdPrice;
    
    return `${formatUSDValue(usdValue, false)} (${formatNumber(quoteInEther, 4)} ${tokenName})`;
  } catch (error) {
    console.error('Error formatting Hyperlane price:', error);
    // Fallback to original format
    const quoteInEther = Number(quote) / 1e18;
    let tokenName: string;
    if (isWrapping) {
      tokenName = 'CELO';
    } else if (chainId === 43114) {
      tokenName = 'AVAX';
    } else {
      tokenName = 'ETH';
    }
    return `${formatNumber(quoteInEther, 4)} ${tokenName}`;
  }
}; 