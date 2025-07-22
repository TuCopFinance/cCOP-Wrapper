import { config } from '@/config';
import { readContract } from '@wagmi/core';
import { PRICE_FEED_ADDRESSES, FALLBACK_PRICES } from '@/constants/price-feeds';

// Polygon chain ID for price feed reading
const POLYGON_CHAIN_ID = 137;

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

/**
 * Get the latest COP/USD price from Chainlink price feeds
 * @param chainId - The chain ID to get the price for
 * @returns The COP/USD price as a number
 */
export const getCOPUSDPrice = async (chainId: number): Promise<number> => {
  try {
    // Check cache first
    if (priceCache && Date.now() - priceCache.timestamp < CACHE_DURATION) {
      console.log('Using cached COP/USD price:', priceCache.price);
      return priceCache.price;
    }

    const priceFeedAddress = PRICE_FEED_ADDRESSES[chainId as keyof typeof PRICE_FEED_ADDRESSES];
    
    // If no price feed address is configured, use fallback
    if (!priceFeedAddress || priceFeedAddress === "0x0000000000000000000000000000000000000000") {
      console.log('No Chainlink price feed configured for chain', chainId, 'using fallback price');
      return FALLBACK_PRICES.COP_USD;
    }

    // Always read from Polygon chain since we're using Polygon price feeds
    console.log('Reading COP/USD price from Polygon price feed:', priceFeedAddress);
    const result = await readContract(config, {
      address: priceFeedAddress as `0x${string}`,
      abi: CHAINLINK_PRICE_FEED_ABI,
      functionName: 'latestRoundData',
      chainId: POLYGON_CHAIN_ID, // Always use Polygon chain ID
    });

    // Chainlink prices are typically returned with 8 decimals
    // result is a tuple: [roundId, answer, startedAt, updatedAt, answeredInRound]
    const price = Number(result[1]) / 100000000;
    
    console.log('Chainlink COP/USD price for chain', chainId, ':', price);
    
    // Cache the price
    priceCache = {
      price,
      timestamp: Date.now()
    };
    
    return price;
  } catch (error) {
    console.error('Error fetching COP/USD price from Chainlink:', error);
    console.log('Using fallback COP/USD price:', FALLBACK_PRICES.COP_USD);
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
  return `${amount.toFixed(decimals)} ${tokenSymbol}`;
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
 * Format USD value consistently across the application
 * @param value - The numeric USD value
 * @param includeApproximate - Whether to include the ~ symbol (default: true)
 * @returns Formatted USD string
 */
export const formatUSDValue = (value: number, includeApproximate: boolean = true): string => {
  const prefix = includeApproximate ? '~' : '';
  return `${prefix}$${value.toFixed(2)} USD`;
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
    // For now, using fallback price since we don't have CELO/USD feed configured
    // TODO: Add actual CELO/USD price feed address
    console.log('Using fallback CELO/USD price:', FALLBACK_PRICES.CELO_USD);
    return FALLBACK_PRICES.CELO_USD;
  } catch (error) {
    console.error('Error fetching CELO/USD price:', error);
    return FALLBACK_PRICES.CELO_USD;
  }
};

/**
 * Get the latest ETH/USD price from Chainlink price feeds
 * @returns The ETH/USD price as a number
 */
export const getETHUSDPrice = async (): Promise<number> => {
  try {
    // For now, using fallback price since we don't have ETH/USD feed configured
    // TODO: Add actual ETH/USD price feed address
    console.log('Using fallback ETH/USD price:', FALLBACK_PRICES.ETH_USD);
    return FALLBACK_PRICES.ETH_USD;
  } catch (error) {
    console.error('Error fetching ETH/USD price:', error);
    return FALLBACK_PRICES.ETH_USD;
  }
};

/**
 * Format Hyperlane price in USD with original token amount in parentheses
 * @param quote - The quote amount in wei
 * @param isWrapping - Whether this is for wrapping (CELO) or unwrapping (ETH)
 * @returns Formatted price string like "$X.XX USD (Y.YYYY CELO/ETH)"
 */
export const formatHyperlanePrice = async (quote: bigint, isWrapping: boolean): Promise<string> => {
  try {
    const quoteInEther = Number(quote) / 1e18;
    
    let usdPrice: number;
    let tokenName: string;
    
    if (isWrapping) {
      // Wrapping uses CELO
      usdPrice = await getCELOUSDPrice();
      tokenName = 'CELO';
    } else {
      // Unwrapping uses ETH
      usdPrice = await getETHUSDPrice();
      tokenName = 'ETH';
    }
    
    const usdValue = quoteInEther * usdPrice;
    
    return `${formatUSDValue(usdValue, false)} (${quoteInEther.toFixed(4)} ${tokenName})`;
  } catch (error) {
    console.error('Error formatting Hyperlane price:', error);
    // Fallback to original format
    const quoteInEther = Number(quote) / 1e18;
    const tokenName = isWrapping ? 'CELO' : 'ETH';
    return `${quoteInEther.toFixed(4)} ${tokenName}`;
  }
}; 