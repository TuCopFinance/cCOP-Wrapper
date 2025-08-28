import { address } from '@/constants/address';

// API endpoints for different chains (using internal API routes)
const API_ENDPOINTS = {
  celo: '/api/transactions?chain=celo&address=',
  base: '/api/transactions?chain=base&address=',
  arbitrum: '/api/transactions?chain=arbitrum&address=',
  optimism: '/api/transactions?chain=optimism&address=',
  avalanche: '/api/transactions?chain=avalanche&address='
};

// Interface for real transaction data
export interface RealTransaction {
  id: string;
  type: 'wrap' | 'unwrap';
  chain: string;
  amount: string;
  timestamp: number;
  txHash: string;
  status: 'completed' | 'failed' | 'pending';
  fromAddress: string;
  toAddress: string;
  blockNumber: string;
  gasUsed: string;
  gasPrice: string;
}

// Interface for token transfer data from APIs (currently unused but kept for future use)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface TokenTransfer {
  // Common fields
  hash?: string;
  from?: { hash?: string } | string;
  to?: { hash?: string } | string;
  value?: string;
  
  // Etherscan-style fields
  token_name?: string;
  tokenName?: string;
  token_symbol?: string;
  tokenSymbol?: string;
  token_contract_address_hash?: string;
  contractAddress?: string;
  token_decimals?: string;
  tokenDecimal?: string;
  timestamp?: string;
  timeStamp?: string;
  block_number?: string;
  blockNumber?: string;
  gas_used?: string;
  gasUsed?: string;
  gas_price?: string;
  gasPrice?: string;
  
  // Blockscout-style fields
  tx_hash?: string;
  transaction_hash?: string;
  total?: { value: string };
  token?: {
    name: string;
    symbol: string;
    contract_address_hash: string;
    address: string;
    decimals: string;
  };
}

// Helper function to safely get address from different formats (legacy - kept for fallback)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getAddress = (address: { hash?: string } | string | undefined): string => {
  if (typeof address === 'string') return address;
  if (address && typeof address === 'object' && address.hash) return address.hash;
  return '';
};

// Helper function to decode wrap amount from transaction input (legacy - kept for fallback)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const decodeWrapAmount = (input: string): number => {
  try {
    // Expected input format for wrap(uint32 domainID, address receiver, uint256 amount):
    // 0x + method_signature (4 bytes) + domainID (32 bytes) + receiver_address (32 bytes) + amount (32 bytes)
    // Method signature for wrap(uint32,address,uint256)
    // Total length: 2 (0x) + 8 (method_signature) + 64 (domainID) + 64 (receiver) + 64 (amount) = 202 characters
    if (input && input.length >= 202) {
      // Extract the amount parameter (third parameter), which starts at index 138
      const amountHex = input.substring(138, 138 + 64); // From index 138, take 64 characters
      const parameterValue = BigInt('0x' + amountHex);
      // Convert from wei to token units (18 decimals)
      const amount = Number(parameterValue) / Math.pow(10, 18);
      
      console.log('🔍 Decoded wrap parameters:', {
        amount: amount,
        inputLength: input.length
      });
      return amount;
    }
  } catch (error) {
    console.error('Error decoding wrap amount:', error);
  }
  return 0;
};

// Helper function to decode unwrap amount from transaction input
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const decodeUnwrapAmount = (input: string): number => {
  try {
    // Expected input format for unwrap(address receiver, uint256 amount):
    // 0x + method_signature (4 bytes) + receiver_address (32 bytes) + amount (32 bytes)
    // Method signature for unwrap(address,uint256)
    // Total length: 2 (0x) + 8 (method_signature) + 64 (receiver) + 64 (amount) = 138 characters
    if (input && input.length >= 138) {
      // Extract the amount parameter (second parameter), which starts at index 74
      const amountHex = input.substring(74, 74 + 64); // From index 74, take 64 characters
      const parameterValue = BigInt('0x' + amountHex);
      // Convert from wei to token units (18 decimals as per contract)
      const amount = Number(parameterValue) / Math.pow(10, 18);
      
      console.log('🔍 Decoded unwrap parameters:', {
        amount: amount
      });
      return amount;
    }
  } catch (error) {
    console.error('Error decoding unwrap amount:', error);
  }
  return 0;
};

/**
 * Get real transactions from Celo (wraps to Base/Arbitrum/Optimism/Avalanche)
 * Now using Etherscan V2 API for consistency
 */
export const getCeloTransactions = async (walletAddress: string): Promise<RealTransaction[]> => {
  try {
    const treasuryAddress = address.mainnet.treasury;
    
    // Get regular transactions using Etherscan V2 API
    const url = `${API_ENDPOINTS.celo}${walletAddress}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Celo API error: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Handle Etherscan V2-style response for normal transactions
    if (data.status === '1' && data.result && Array.isArray(data.result)) {
      console.log(`📋 Found ${data.result.length} total transactions on Celo`);
      
      const transactions: RealTransaction[] = [];
      for (const tx of data.result) {
        // Look for transactions FROM the wallet TO the treasury contract that call wrap function
        const isFromWallet = tx.from?.toLowerCase() === walletAddress.toLowerCase();
        const isToTreasury = tx.to?.toLowerCase() === treasuryAddress.toLowerCase();
        
        // Check if this is a wrap function call by looking at input data
        // wrap(uint32 domainID, address receiver, uint256 amount) has method signature 0x3c7580e6
        const isWrapCall = tx.input && tx.input.startsWith('0x3c7580e6');
        
        if (isFromWallet && isToTreasury && isWrapCall) {
          // Extract amount from function call input using ABI decoding
          let tokenAmount = 0;
          
          // Use the decoded amount from the server API
          tokenAmount = tx.decodedAmount || 0;
          
          console.log('🔍 Processing Celo wrap transaction:', {
            amount: tokenAmount,
            hash: tx.hash
          });
          
          const txHash = tx.hash || '';
          
          // Only include if we successfully extracted the amount
          if (tokenAmount > 0 && txHash) {
            transactions.push({
              id: txHash,
              type: 'wrap',
              chain: 'Celo',
              amount: tokenAmount.toFixed(2),
              timestamp: parseInt(tx.timeStamp || '0') * 1000,
              txHash: txHash,
              status: tx.txreceipt_status === '1' ? 'completed' : 'failed',
              fromAddress: tx.from || '',
              toAddress: tx.to || '',
              blockNumber: tx.blockNumber || '0',
              gasUsed: tx.gasUsed || '0',
              gasPrice: tx.gasPrice || '0'
            });
          }
        }
      }
      
      console.log(`🎉 Found ${transactions.length} wrap function calls to treasury on Celo`);
      return transactions;
    }
    
    // If we get here, no valid transactions found
    console.log('⚠️ No valid Celo transactions found, returning empty array');
    return [];
    
  } catch (error) {
    console.error('❌ Error fetching Celo transactions:', error);
    console.log('🔄 Returning empty array for Celo due to error');
    return [];
  }
};

/**
 * Get real transactions from Base (unwraps from Base)
 */
export const getBaseTransactions = async (walletAddress: string): Promise<RealTransaction[]> => {
  try {
    const wcCOPAddress = '0x5Cc112D9634a2D0cB3A0BA8dDC5dC05a010A3D22'; // wcCOP token address on Base
    
    const url = `${API_ENDPOINTS.base}${walletAddress}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Base API error: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Handle Etherscan V2 API response structure (action=txlist)
    if (data.result && Array.isArray(data.result)) {
      console.log(`📋 Found ${data.result.length} total transactions on Base`);
      
      const transactions: RealTransaction[] = [];
      for (const tx of data.result) {
        // Filter for transactions FROM the wallet TO the wcCOP contract with unwrap method
        const isFromWallet = tx.from?.toLowerCase() === walletAddress.toLowerCase();
        const isToWCCOPContract = tx.to?.toLowerCase() === wcCOPAddress.toLowerCase();
        
        // Check for unwrap function calls - look for methodId 0x39f47693 or functionName 'unwrap'
        const isUnwrapCall = tx.methodId === '0x39f47693' || 
                           tx.functionName?.includes('unwrap') ||
                           (tx.input && tx.input.startsWith('0x39f47693'));
        
        console.log(`🔍 Checking Base tx ${tx.hash}: from=${tx.from?.slice(0,8)}, to=${tx.to?.slice(0,8)}, methodId=${tx.methodId}, isFromWallet=${isFromWallet}, isToWCCOP=${isToWCCOPContract}, isUnwrap=${isUnwrapCall}`);
        
        if (isFromWallet && isToWCCOPContract && isUnwrapCall) {
          // Use the decoded amount from the server API
          console.log('✅ Processing valid unwrap transaction:', tx.hash);
          const tokenAmount = tx.decodedAmount || 0;
          console.log('💰 Server decoded amount:', tokenAmount, 'cCOP');
          
          if (tokenAmount > 0) {
            transactions.push({
              id: tx.hash,
              type: 'unwrap',
              chain: 'Base',
              amount: tokenAmount.toFixed(2),
              timestamp: parseInt(tx.timeStamp) * 1000,
              txHash: tx.hash,
              status: tx.isError === '1' ? 'failed' : 'completed',
              fromAddress: tx.from,
              toAddress: tx.to,
              blockNumber: tx.blockNumber,
              gasUsed: tx.gasUsed,
              gasPrice: tx.gasPrice
            });
            console.log('✅ Added unwrap transaction with amount:', tokenAmount);
          }
        }
      }
      
      console.log(`🎉 Found ${transactions.length} wcCOP unwrap transactions on Base`);
      return transactions;
    }
    
    // If we get here, no valid transactions found
    console.log('⚠️ No valid Base token transfers found, returning empty array');
    return [];
    
  } catch (error) {
    console.error('❌ Error fetching Base transactions:', error);
    console.log('🔄 Returning empty array for Base due to error');
    return [];
  }
};

/**
 * Get real transactions from Arbitrum (unwraps from Arbitrum)
 */
export const getArbitrumTransactions = async (walletAddress: string): Promise<RealTransaction[]> => {
  try {
    const wcCOPAddress = '0x5Cc112D9634a2D0cB3A0BA8dDC5dC05a010A3D22'; // wcCOP token address on Arbitrum
    
    const url = `${API_ENDPOINTS.arbitrum}${walletAddress}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Arbitrum API error: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Handle Etherscan V2 API response structure (action=txlist)
    if (data.result && Array.isArray(data.result)) {
      console.log(`📋 Found ${data.result.length} total transactions on Arbitrum`);
      
      const transactions: RealTransaction[] = [];
      for (const tx of data.result) {
        // Filter for transactions that call the unwrap method on wcCOP contract
        const isToWCCOPContract = tx.to?.toLowerCase() === wcCOPAddress.toLowerCase();
        
        // Check for unwrap function calls (unwrap method calls on wcCOP contract)
        const isUnwrapCall = tx.functionName === 'unwrap' || 
                           (tx.input && tx.input.length >= 138); // unwrap(address,uint256) has this length
        
        if (isToWCCOPContract && isUnwrapCall) {
          // Use the decoded amount from the server API
          const tokenAmount = tx.decodedAmount || 0;
          
          transactions.push({
            id: tx.hash,
            type: 'unwrap',
            chain: 'Arbitrum',
            amount: tokenAmount.toFixed(2),
            timestamp: parseInt(tx.timeStamp) * 1000,
            txHash: tx.hash,
            status: tx.isError === '1' ? 'failed' : 'completed',
            fromAddress: tx.from,
            toAddress: tx.to,
            blockNumber: tx.blockNumber,
            gasUsed: tx.gasUsed,
            gasPrice: tx.gasPrice
          });
        }
      }
      
      console.log(`🎉 Found ${transactions.length} wcCOP unwrap transactions on Arbitrum`);
      return transactions;
    }
    
    // If we get here, no valid transactions found
    console.log('⚠️ No valid Arbitrum token transfers found, returning empty array');
    return [];
    
  } catch (error) {
    console.error('❌ Error fetching Arbitrum transactions:', error);
    console.log('🔄 Returning empty array for Arbitrum due to error');
    return [];
  }
};

/**
 * Get real transactions from Optimism (unwraps from Optimism)
 */
export const getOptimismTransactions = async (walletAddress: string): Promise<RealTransaction[]> => {
  try {
    const wcCOPAddress = '0x5Cc112D9634a2D0cB3A0BA8dDC5dC05a010A3D22'; // wcCOP token address on Optimism
    
    const url = `${API_ENDPOINTS.optimism}${walletAddress}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Optimism API error: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Handle Etherscan V2 API response structure (action=txlist)
    if (data.result && Array.isArray(data.result)) {
      console.log(`📋 Found ${data.result.length} total transactions on Optimism`);
      
      const transactions: RealTransaction[] = [];
      for (const tx of data.result) {
        // Filter for transactions that call the unwrap method on wcCOP contract
        const isToWCCOPContract = tx.to?.toLowerCase() === wcCOPAddress.toLowerCase();
        
        // Check for unwrap function calls (unwrap method calls on wcCOP contract)
        const isUnwrapCall = tx.functionName === 'unwrap' || 
                           (tx.input && tx.input.length >= 138); // unwrap(address,uint256) has this length
        
        if (isToWCCOPContract && isUnwrapCall) {
          // Use the decoded amount from the server API
          const tokenAmount = tx.decodedAmount || 0;
          
          transactions.push({
            id: tx.hash,
            type: 'unwrap',
            chain: 'Optimism',
            amount: tokenAmount.toFixed(2),
            timestamp: parseInt(tx.timeStamp) * 1000,
            txHash: tx.hash,
            status: tx.isError === '1' ? 'failed' : 'completed',
            fromAddress: tx.from,
            toAddress: tx.to,
            blockNumber: tx.blockNumber,
            gasUsed: tx.gasUsed,
            gasPrice: tx.gasPrice
          });
        }
      }
      
      console.log(`🎉 Found ${transactions.length} wcCOP unwrap transactions on Optimism`);
      return transactions;
    }
    
    // If we get here, no valid transactions found
    console.log('⚠️ No valid Optimism transactions found, returning empty array');
    return [];
    
  } catch (error) {
    console.error('❌ Error fetching Optimism transactions:', error);
    console.log('🔄 Returning empty array for Optimism due to error');
    return [];
  }
};

/**
 * Get real transactions from Avalanche (unwraps from Avalanche)
 */
export const getAvalancheTransactions = async (walletAddress: string): Promise<RealTransaction[]> => {
  try {
    const wcCOPAddress = '0x5Cc112D9634a2D0cB3A0BA8dDC5dC05a010A3D22'; // wcCOP token address on Avalanche
    
    const url = `${API_ENDPOINTS.avalanche}${walletAddress}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Avalanche API error: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Handle Etherscan V2 API response structure (action=txlist)
    if (data.result && Array.isArray(data.result)) {
      console.log(`📋 Found ${data.result.length} total transactions on Avalanche`);
      
      const transactions: RealTransaction[] = [];
      for (const tx of data.result) {
        // Filter for transactions that call the unwrap method on wcCOP contract
        const isToWCCOPContract = tx.to?.toLowerCase() === wcCOPAddress.toLowerCase();
        
        // Check for unwrap function calls (unwrap method calls on wcCOP contract)
        const isUnwrapCall = tx.functionName === 'unwrap' || 
                           (tx.input && tx.input.length >= 138); // unwrap(address,uint256) has this length
        
        if (isToWCCOPContract && isUnwrapCall) {
          // Use the decoded amount from the server API
          const tokenAmount = tx.decodedAmount || 0;
          
          transactions.push({
            id: tx.hash,
            type: 'unwrap',
            chain: 'Avalanche',
            amount: tokenAmount.toFixed(2),
            timestamp: parseInt(tx.timeStamp) * 1000,
            txHash: tx.hash,
            status: tx.isError === '1' ? 'failed' : 'completed',
            fromAddress: tx.from,
            toAddress: tx.to,
            blockNumber: tx.blockNumber,
            gasUsed: tx.gasUsed,
            gasPrice: tx.gasPrice
          });
        }
      }
      
      console.log(`🎉 Found ${transactions.length} wcCOP unwrap transactions on Avalanche`);
      return transactions;
    }
    
    // If we get here, no valid transactions found
    console.log('⚠️ No valid Avalanche transactions found, returning empty array');
    return [];
    
  } catch (error) {
    console.error('❌ Error fetching Avalanche transactions:', error);
    console.log('🔄 Returning empty array for Avalanche due to error');
    return [];
  }
};

/**
 * Generate realistic mock transactions for Base/Arbitrum/Optimism/Avalanche (when API key is invalid)
 */
const generateRealisticMockTransactions = (walletAddress: string, chain: string): RealTransaction[] => {
  const mockTxs: RealTransaction[] = [];
  
  // Generate 2-3 realistic unwrap transactions
  const numTxs = Math.floor(Math.random() * 2) + 2;
  
  for (let i = 0; i < numTxs; i++) {
    const amount = (Math.random() * 500 + 100).toFixed(2); // Realistic amounts between 100-600
    const timestamp = Date.now() - (i * 2 * 24 * 60 * 60 * 1000); // Each transaction 2 days apart
    
    mockTxs.push({
      id: `mock-${chain}-${i}`,
      type: 'unwrap',
      chain: chain,
      amount: amount,
      timestamp: timestamp,
      txHash: `0x${Math.random().toString(16).substring(2, 66)}`,
      status: 'completed',
      fromAddress: '0x5Cc112D9634a2D0cB3A0BA8dDC5dC05a010A3D22', // Treasury address
      toAddress: '0x0000000000000000000000000000000000000000', // Burn address
      blockNumber: (Math.floor(Math.random() * 1000000) + 1000000).toString(),
      gasUsed: (Math.floor(Math.random() * 100000) + 50000).toString(),
      gasPrice: (Math.floor(Math.random() * 20) + 1).toString()
    });
  }
  
  return mockTxs;
};

/**
 * Generate mock transactions for fallback
 */
const generateMockTransactions = (walletAddress: string, chain: string): RealTransaction[] => {
  const mockTxs: RealTransaction[] = [];
  
  // Generate 3-5 mock transactions
  const numTxs = Math.floor(Math.random() * 3) + 3;
  
  for (let i = 0; i < numTxs; i++) {
    const isWrap = chain === 'Celo';
    const amount = (Math.random() * 1000 + 100).toFixed(2);
    const timestamp = Date.now() - (i * 24 * 60 * 60 * 1000); // Each transaction 1 day apart
    
    mockTxs.push({
      id: `mock-${chain}-${i}`,
      type: isWrap ? 'wrap' : 'unwrap',
      chain: chain,
      amount: amount,
      timestamp: timestamp,
      txHash: `0x${Math.random().toString(16).substring(2, 66)}`,
      status: 'completed',
      fromAddress: walletAddress,
      toAddress: isWrap ? address.mainnet.treasury : '0x0000000000000000000000000000000000000000',
      blockNumber: (Math.floor(Math.random() * 1000000) + 1000000).toString(),
      gasUsed: (Math.floor(Math.random() * 100000) + 50000).toString(),
      gasPrice: (Math.floor(Math.random() * 1000000000) + 1000000000).toString()
    });
  }
  
  return mockTxs;
};

/**
 * Get all real transactions from all chains
 */
export const getAllRealTransactions = async (walletAddress: string): Promise<RealTransaction[]> => {
  try {
    console.log('🚀 Fetching transactions from all chains for wallet:', walletAddress);
    
    // Fetch transactions from all chains sequentially with delays to avoid rate limiting
    console.log('🔄 Fetching Celo transactions...');
    const celoTxs = await getCeloTransactions(walletAddress);
    
    // Wait 1 second between API calls to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('🔄 Fetching Base transactions...');
    const baseTxs = await getBaseTransactions(walletAddress);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('🔄 Fetching Arbitrum transactions...');
    const arbitrumTxs = await getArbitrumTransactions(walletAddress);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('🔄 Fetching Optimism transactions...');
    const optimismTxs = await getOptimismTransactions(walletAddress);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('🔄 Fetching Avalanche transactions...');
    const avalancheTxs = await getAvalancheTransactions(walletAddress);
    
    // Combine all transactions and sort by timestamp (newest first)
    const allTransactions = [...celoTxs, ...baseTxs, ...arbitrumTxs, ...optimismTxs, ...avalancheTxs]
      .sort((a, b) => b.timestamp - a.timestamp);
    
    console.log(`🎉 Total transactions found: ${allTransactions.length}`);
    console.log(`   - Celo: ${celoTxs.length} ${celoTxs.length > 0 ? '✅' : '❌'}`);
    console.log(`   - Base: ${baseTxs.length} ${baseTxs.length > 0 ? '✅' : '❌'}`); 
    console.log(`   - Arbitrum: ${arbitrumTxs.length} ${arbitrumTxs.length > 0 ? '✅' : '❌'}`);
    console.log(`   - Optimism: ${optimismTxs.length} ${optimismTxs.length > 0 ? '✅' : '❌'}`);
    console.log(`   - Avalanche: ${avalancheTxs.length} ${avalancheTxs.length > 0 ? '✅' : '❌'}`);
    
    return allTransactions;
  } catch (error) {
    console.error('❌ Error fetching all transactions:', error);
    return [];
  }
}; 