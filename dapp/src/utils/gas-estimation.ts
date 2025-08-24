import { config } from '@/config';
import { simulateContract } from '@wagmi/core';
import { address } from '@/constants/address';
import { chainID } from '@/constants/chainID';
import Treasury from '@/constants/abis/Treasury.json';
import WrappedCCOP from '@/constants/abis/WrappedCCOP.json';
import { formatEther, parseEther } from 'viem';
import { formatGasAndTokenPriceWithUSD, getCELOUSDPrice, getETHUSDPrice } from '@/utils/price-feeds';

// Gas estimation constants
const GAS_ESTIMATES = {
  CELO: {
    BASE_GAS: 300000, // Base gas for Celo transactions
    GAS_PER_TOKEN: 0, // No additional gas per token (gas is constant)
    GAS_PRICE: 0.000000001, // CELO per gas unit (1 gwei = 0.000000001 CELO)
  },
  BASE: {
    BASE_GAS: 150000, // Base gas for Base transactions
    GAS_PER_TOKEN: 0, // No additional gas per token (gas is constant)
    GAS_PRICE: 0.000000001, // ETH per gas unit (1 gwei = 0.000000001 ETH)
  },
  ARBITRUM: {
    BASE_GAS: 200000, // Base gas for Arbitrum transactions
    GAS_PER_TOKEN: 0, // No additional gas per token (gas is constant)
    GAS_PRICE: 0.000000001, // ETH per gas unit (1 gwei = 0.000000001 ETH)
  }
};

// Get gas token name for a chain
export const getGasTokenName = (chainId: number): string => {
  switch (chainId) {
    case chainID.mainnet.celo:
      return 'CELO';
    case chainID.mainnet.base:
    case chainID.mainnet.arb:
      return 'ETH';
    default:
      return 'ETH';
  }
};

// Calculate approximate gas estimate based on amount
export const calculateApproximateGas = async (amount: string, chainId: number): Promise<string> => {
  console.log(`🚀 calculateApproximateGas CALLED - Amount: ${amount}, ChainId: ${chainId}`);
  const numAmount = parseFloat(amount) || 0;
  const gasConfig = getGasConfig(chainId);
  
  // Calculate gas units
  const gasUnits = gasConfig.BASE_GAS + (numAmount * gasConfig.GAS_PER_TOKEN);
  
  // Calculate gas cost in native token
  const gasCost = gasUnits * gasConfig.GAS_PRICE;
  
  console.log(`calculateApproximateGas - Gas units: ${gasUnits}, Gas price: ${gasConfig.GAS_PRICE}, Gas cost: ${gasCost}`);
  
  // Round to 4 decimal places before formatting
  const roundedGasCost = Math.round(gasCost * 10000) / 10000;
  
  console.log(`calculateApproximateGas - Rounded gas cost: ${roundedGasCost}`);
  
  const tokenName = getGasTokenName(chainId);
  
  // Get USD price for the token
  let usdPrice: number;
  try {
    if (chainId === chainID.mainnet.celo) {
      usdPrice = await getCELOUSDPrice();
    } else {
      usdPrice = await getETHUSDPrice();
    }
  } catch (error) {
    console.error('Error getting USD price for gas estimation:', error);
    usdPrice = chainId === chainID.mainnet.celo ? 0.5 : 3000; // Fallback prices
  }
  
  // Calculate USD value
  const usdValue = roundedGasCost * usdPrice;
  
  // Format the result with USD value first
  const result = formatGasAndTokenPriceWithUSD(usdValue, roundedGasCost, tokenName);
  
  console.log(`calculateApproximateGas - Final result: ${result}`);
  
  return result;
};

// Get gas configuration for a chain
const getGasConfig = (chainId: number) => {
  switch (chainId) {
    case chainID.mainnet.celo:
      return GAS_ESTIMATES.CELO;
    case chainID.mainnet.base:
      return GAS_ESTIMATES.BASE;
    case chainID.mainnet.arb:
      return GAS_ESTIMATES.ARBITRUM;
    case chainID.mainnet.op:
      return GAS_ESTIMATES.ARBITRUM;
    default:
      return GAS_ESTIMATES.CELO;
  }
};

// Estimate gas for wrap transaction using simulation
export const estimateWrapGas = async (
  amount: string, 
  targetAddress: string,
  domainID: number,
  _quote?: bigint // eslint-disable-line @typescript-eslint/no-unused-vars
): Promise<string> => {
  try {
    const amountFixed = parseEther(amount);
    
    // For gas estimation, we don't need to include the quote value
    // The quote is the cost of the cross-chain message, not the gas cost
    const simulation = await simulateContract(config, {
      chainId: chainID.mainnet.celo,
      abi: Treasury.abi,
      address: address.mainnet.treasury as `0x${string}`,
      functionName: "wrap",
      args: [domainID, targetAddress as `0x${string}`, amountFixed],
      value: BigInt(0), // Don't include quote for gas estimation
    });

    // Get gas estimate from simulation
    const gasEstimate = simulation.request.gas || BigInt(300000);
    // Use a realistic gas price (1 gwei = 0.000000001 ETH)
    const gasCost = formatEther(gasEstimate * BigInt(1000000000)); // 1 gwei gas price
    
    console.log(`estimateWrapGas - Gas estimate: ${gasEstimate}, Gas cost: ${gasCost}, Parsed: ${parseFloat(gasCost)}`);
    
    // Round to 4 decimal places before formatting
    const roundedGasCost = Math.round(parseFloat(gasCost) * 10000) / 10000;
    
    console.log(`estimateWrapGas - Rounded gas cost: ${roundedGasCost}`);
    
    // Get CELO USD price
    let celoUsdPrice: number;
    try {
      celoUsdPrice = await getCELOUSDPrice();
    } catch (error) {
      console.error('Error getting CELO USD price:', error);
      celoUsdPrice = 0.5; // Fallback price
    }
    
    // Calculate USD value
    const usdValue = roundedGasCost * celoUsdPrice;
    
    // Format the result with USD value first
    const result = formatGasAndTokenPriceWithUSD(usdValue, roundedGasCost, 'CELO');
    
    console.log(`estimateWrapGas - Final result: ${result}`);
    
    return result;
  } catch (error) {
    console.error('Error estimating wrap gas:', error);
    // Fallback to approximate calculation
    return calculateApproximateGas(amount, chainID.mainnet.celo);
  }
};

// Estimate gas for unwrap transaction using simulation
export const estimateUnwrapGas = async (
  amount: string,
  targetAddress: string,
  chainToUnwrap: string,
  _quote?: bigint // eslint-disable-line @typescript-eslint/no-unused-vars
): Promise<string> => {
  console.log(`🚀 estimateUnwrapGas CALLED - Amount: ${amount}, ChainToUnwrap: ${chainToUnwrap}`);
  try {
    const amountFixed = parseEther(amount);
    const targetChainId =
      chainToUnwrap === "base"
        ? chainID.mainnet.base
        : chainToUnwrap === "arbitrum"
        ? chainID.mainnet.arb
        : chainID.mainnet.op;
    const targetChainContractAddress =
      chainToUnwrap === "base"
        ? address.mainnet.wrapToken.base
        : chainToUnwrap === "arbitrum"
        ? address.mainnet.wrapToken.arb
        : address.mainnet.wrapToken.op;

    // For gas estimation, we don't need to include the quote value
    // The quote is the cost of the cross-chain message, not the gas cost
    const simulation = await simulateContract(config, {
      chainId: targetChainId,
      abi: WrappedCCOP.abi,
      address: targetChainContractAddress as `0x${string}`,
      functionName: "unwrap",
      args: [targetAddress as `0x${string}`, amountFixed],
      value: BigInt(0), // Don't include quote for gas estimation
    });

    // Get gas estimate from simulation
    const gasEstimate = simulation.request.gas || BigInt(200000);
    // Use a realistic gas price (1 gwei = 0.000000001 ETH)
    const gasCost = formatEther(gasEstimate * BigInt(1000000000)); // 1 gwei gas price
    
    console.log(`estimateUnwrapGas - Gas estimate: ${gasEstimate}, Gas cost: ${gasCost}, Parsed: ${parseFloat(gasCost)}`);
    
    // Round to 4 decimal places before formatting
    const roundedGasCost = Math.round(parseFloat(gasCost) * 10000) / 10000;
    
    console.log(`estimateUnwrapGas - Rounded gas cost: ${roundedGasCost}`);
    
    const tokenName = getGasTokenName(targetChainId);
    
    // Get ETH USD price
    let ethUsdPrice: number;
    try {
      ethUsdPrice = await getETHUSDPrice();
    } catch (error) {
      console.error('Error getting ETH USD price:', error);
      ethUsdPrice = 3000; // Fallback price
    }
    
    // Calculate USD value
    const usdValue = roundedGasCost * ethUsdPrice;
    
    // Format the result with USD value first
    const result = formatGasAndTokenPriceWithUSD(usdValue, roundedGasCost, tokenName);
    
    console.log(`estimateUnwrapGas - Final result: ${result}`);
    
    return result;
  } catch (error) {
    console.error('Error estimating unwrap gas:', error);
    // Fallback to approximate calculation
    const targetChainId =
      chainToUnwrap === "base"
        ? chainID.mainnet.base
        : chainToUnwrap === "arbitrum"
        ? chainID.mainnet.arb
        : chainID.mainnet.op;
    return calculateApproximateGas(amount, targetChainId);
  }
};

// Get real-time gas price for a chain (placeholder for future implementation)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getRealTimeGasPrice = async (_chainId: number): Promise<bigint> => {
  // This would integrate with a gas price API like Etherscan, Gas Station, etc.
  // For now, return a default value
  return BigInt(1000000000); // 1 gwei
}; 