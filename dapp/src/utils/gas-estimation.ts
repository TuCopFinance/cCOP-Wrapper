import { config } from '@/config';
import { simulateContract } from '@wagmi/core';
import { address } from '@/constants/address';
import { chainID } from '@/constants/chainID';
import Treasury from '@/constants/abis/Treasury.json';
import WrappedCCOP from '@/constants/abis/WrappedCCOP.json';
import { formatEther, parseEther } from 'viem';

// Gas estimation constants
const GAS_ESTIMATES = {
  CELO: {
    BASE_GAS: 300000, // Base gas for Celo transactions
    GAS_PER_TOKEN: 1000, // Additional gas per token amount
    GAS_PRICE: 0.000000001, // CELO per gas unit (approximate)
  },
  BASE: {
    BASE_GAS: 150000, // Base gas for Base transactions
    GAS_PER_TOKEN: 500, // Additional gas per token amount
    GAS_PRICE: 0.000000001, // ETH per gas unit (approximate)
  },
  ARBITRUM: {
    BASE_GAS: 200000, // Base gas for Arbitrum transactions
    GAS_PER_TOKEN: 800, // Additional gas per token amount
    GAS_PRICE: 0.000000001, // ETH per gas unit (approximate)
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
export const calculateApproximateGas = (amount: string, chainId: number): string => {
  const numAmount = parseFloat(amount) || 0;
  const gasConfig = getGasConfig(chainId);
  
  // Calculate gas units
  const gasUnits = gasConfig.BASE_GAS + (numAmount * gasConfig.GAS_PER_TOKEN);
  
  // Calculate gas cost in native token
  const gasCost = gasUnits * gasConfig.GAS_PRICE;
  
  const tokenName = getGasTokenName(chainId);
  return `${gasCost.toFixed(6)} ${tokenName}`;
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
    default:
      return GAS_ESTIMATES.CELO;
  }
};

// Estimate gas for wrap transaction using simulation
export const estimateWrapGas = async (
  amount: string, 
  targetAddress: string,
  domainID: number
): Promise<string> => {
  try {
    const amountFixed = parseEther(amount);
    
    const simulation = await simulateContract(config, {
      chainId: chainID.mainnet.celo,
      abi: Treasury.abi,
      address: address.mainnet.treasury as `0x${string}`,
      functionName: "wrap",
      args: [domainID, targetAddress as `0x${string}`, amountFixed],
      value: BigInt(0), // We'll add the actual quote later
    });

    // Get gas estimate from simulation
    const gasEstimate = simulation.request.gas || BigInt(300000);
    const gasCost = formatEther(gasEstimate * BigInt(1000000000)); // Approximate gas price
    
    return `${parseFloat(gasCost).toFixed(6)} CELO`;
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
  chainToUnwrap: string
): Promise<string> => {
  try {
    const amountFixed = parseEther(amount);
    const targetChainId = chainToUnwrap === "base" ? chainID.mainnet.base : chainID.mainnet.arb;
    const targetChainContractAddress = chainToUnwrap === "base" 
      ? address.mainnet.wrapToken.base 
      : address.mainnet.wrapToken.arb;

    const simulation = await simulateContract(config, {
      chainId: targetChainId,
      abi: WrappedCCOP.abi,
      address: targetChainContractAddress as `0x${string}`,
      functionName: "unwrap",
      args: [targetAddress as `0x${string}`, amountFixed],
      value: BigInt(0), // We'll add the actual quote later
    });

    // Get gas estimate from simulation
    const gasEstimate = simulation.request.gas || BigInt(200000);
    const gasCost = formatEther(gasEstimate * BigInt(1000000000)); // Approximate gas price
    
    const tokenName = getGasTokenName(targetChainId);
    return `${parseFloat(gasCost).toFixed(6)} ${tokenName}`;
  } catch (error) {
    console.error('Error estimating unwrap gas:', error);
    // Fallback to approximate calculation
    const targetChainId = chainToUnwrap === "base" ? chainID.mainnet.base : chainID.mainnet.arb;
    return calculateApproximateGas(amount, targetChainId);
  }
};

// Get real-time gas price for a chain (placeholder for future implementation)
export const getRealTimeGasPrice = async (chainId: number): Promise<bigint> => {
  // This would integrate with a gas price API like Etherscan, Gas Station, etc.
  // For now, return a default value
  return BigInt(1000000000); // 1 gwei
}; 