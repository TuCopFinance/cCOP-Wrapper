import { address } from '@/constants/address';

// Get the base URL for API calls
// In production, use the full domain. In development, use relative paths.
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // Client-side: use window.location.origin to get the actual app domain
    return window.location.origin;
  }
  // Server-side: use environment variable or default
  return process.env.NEXT_PUBLIC_APP_URL || 'https://copwrapper.xyz';
};

// Helper to build API URL for a specific chain
const getApiUrl = (chain: string, walletAddress: string) => {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/api/transactions?chain=${chain}&address=${walletAddress}`;
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
    console.log('💰 [CELO] Wallet recibida:', walletAddress);
    console.log('💰 [CELO] Wallet (resumida):', `${walletAddress.substring(0, 6)}...${walletAddress.substring(38)}`);

    const treasuryAddress = address.mainnet.treasury;

    // Get regular transactions using Etherscan V2 API
    const url = getApiUrl('celo', walletAddress);
    console.log('🌐 [CELO] Llamando API:', url);
    console.log('🌐 [CELO] URL completa para verificar:', url);

    const response = await fetch(url);

    if (!response.ok) {
      console.error(`❌ [CELO] Error en API: ${response.status} - ${response.statusText}`);
      throw new Error(`Celo API error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    console.log('📦 [CELO] Respuesta API:', {
      status: data.status,
      message: data.message,
      resultLength: data.result?.length,
      firstTxHash: data.result?.[0]?.hash?.substring(0, 10)
    });

    // Handle Etherscan V2-style response for normal transactions
    if (data.status === '1' && data.result && Array.isArray(data.result)) {
      console.log(`📋 [CELO] Total de transacciones recibidas: ${data.result.length}`);

      const transactions: RealTransaction[] = [];
      for (const tx of data.result) {
        console.log(`🔍 [CELO] Analizando TX ${tx.hash?.substring(0, 10)}...`, {
          from: tx.from?.substring(0, 10),
          to: tx.to?.substring(0, 10),
          methodId: tx.methodId,
          inputStart: tx.input?.substring(0, 10),
          decodedAmount: tx.decodedAmount
        });

        // Look for transactions FROM the wallet TO the treasury contract that call wrap function
        const isFromWallet = tx.from?.toLowerCase() === walletAddress.toLowerCase();
        const isToTreasury = tx.to?.toLowerCase() === treasuryAddress.toLowerCase();

        // Check if this is a wrap function call by looking at input data
        // wrap(uint32 domainID, address receiver, uint256 amount) has method signature 0x3c7580e6
        const isWrapCall = tx.input && tx.input.startsWith('0x3c7580e6');

        console.log(`🔧 [CELO] Validación:`, {
          isFromWallet,
          isToTreasury,
          isWrapCall,
          treasuryAddress: treasuryAddress.substring(0, 10)
        });

        if (isFromWallet && isToTreasury && isWrapCall) {
          // Use the decoded amount from the server API
          const tokenAmount = tx.decodedAmount || 0;

          console.log(`💰 [CELO] Procesando wrap transaction:`, {
            amount: tokenAmount,
            hash: tx.hash?.substring(0, 10)
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
            console.log(`✅ [CELO] WRAP detectado (llamada a treasury): ${tokenAmount} cCOP`);
          }
        }
      }

      console.log(`🎉 [CELO] Total transacciones procesadas: ${transactions.length}`);
      console.log(`📊 [CELO] Detalle:`, transactions.map(t => ({
        type: t.type,
        amount: t.amount,
        hash: t.txHash.substring(0, 10)
      })));
      return transactions;
    }

    // If we get here, no valid transactions found
    console.log('⚠️ [CELO] No se encontraron transacciones válidas, retornando array vacío');
    return [];

  } catch (error) {
    console.error('❌ [CELO] Error obteniendo transacciones:', error);
    console.log('🔄 [CELO] Retornando array vacío debido al error');
    return [];
  }
};

/**
 * Get real transactions from Base (unwraps from Base)
 */
export const getBaseTransactions = async (walletAddress: string): Promise<RealTransaction[]> => {
  try {
    console.log('💰 [BASE] Wallet recibida:', walletAddress);
    console.log('💰 [BASE] Wallet (resumida):', `${walletAddress.substring(0, 6)}...${walletAddress.substring(38)}`);

    const wcCOPAddress = '0x5Cc112D9634a2D0cB3A0BA8dDC5dC05a010A3D22'; // wcCOP token address on Base

    const url = getApiUrl('base', walletAddress);
    console.log('🌐 [BASE] Llamando API:', url);
    console.log('🌐 [BASE] URL completa para verificar:', url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Base API error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    console.log('📦 [BASE] Respuesta API completa:', JSON.stringify(data, null, 2));

    // Handle Etherscan V2 API response structure (action=txlist)
    if (data.result && Array.isArray(data.result)) {
      console.log(`📋 [BASE] Total de transacciones recibidas: ${data.result.length}`);

      const transactions: RealTransaction[] = [];
      const processedHashes = new Set<string>(); // Para evitar duplicados

      for (const tx of data.result) {
        // Verificar si ya procesamos esta transacción (por hash)
        if (processedHashes.has(tx.hash)) {
          console.log(`⚠️ [BASE] TX duplicada detectada, omitiendo: ${tx.hash?.substring(0, 10)}`);
          continue;
        }

        console.log(`🔍 [BASE] Analizando TX ${tx.hash?.substring(0, 10)}...`, {
          from: tx.from?.substring(0, 10),
          to: tx.to?.substring(0, 10),
          contractAddress: tx.contractAddress?.substring(0, 10),
          isTokenTransfer: tx.isTokenTransfer,
          functionName: tx.functionName,
          methodId: tx.methodId,
          value: tx.value,
          tokenSymbol: tx.tokenSymbol,
          decodedAmount: tx.decodedAmount,
          transactionType: tx.transactionType
        });

        // Procesar token transfer (solo unwrap = enviar wcCOP para quemar)
        // Los wraps se cuentan en Celo, NO contamos minteos de wcCOP aquí
        if (tx.isTokenTransfer && tx.tokenSymbol === 'wcCOP') {
          const isSending = tx.from?.toLowerCase() === walletAddress.toLowerCase();
          const amount = parseFloat(tx.value) / Math.pow(10, parseInt(tx.tokenDecimal || '18'));

          console.log(`💸 [BASE] Token transfer detectado:`, {
            isSending,
            amount,
            from: tx.from,
            to: tx.to
          });

          if (isSending) {
            // Enviar wcCOP = unwrap de vuelta a Celo
            transactions.push({
              id: tx.hash,
              type: 'unwrap',
              chain: 'Base',
              amount: amount.toFixed(2),
              timestamp: parseInt(tx.timeStamp) * 1000,
              txHash: tx.hash,
              status: 'completed',
              fromAddress: tx.from,
              toAddress: tx.to,
              blockNumber: tx.blockNumber,
              gasUsed: tx.gasUsed || '0',
              gasPrice: tx.gasPrice || '0'
            });
            processedHashes.add(tx.hash);
            console.log(`✅ [BASE] UNWRAP detectado (envío): ${amount} wcCOP`);
          }
        }
        // Procesar transacciones regulares (solo si NO es token transfer para evitar duplicados)
        else if (!tx.isTokenTransfer) {
          const isFromWallet = tx.from?.toLowerCase() === walletAddress.toLowerCase();
          const isToWCCOPContract = tx.to?.toLowerCase() === wcCOPAddress.toLowerCase();
          const isUnwrapCall = tx.methodId === '0x39f47693' ||
                             tx.functionName?.includes('unwrap') ||
                             (tx.input && tx.input.startsWith('0x39f47693'));

          console.log(`🔧 [BASE] Revisando llamada a función:`, {
            isFromWallet,
            isToWCCOPContract,
            isUnwrapCall,
            decodedAmount: tx.decodedAmount
          });

          if (isFromWallet && isToWCCOPContract && isUnwrapCall) {
            const tokenAmount = tx.decodedAmount || 0;

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
              processedHashes.add(tx.hash);
              console.log(`✅ [BASE] UNWRAP detectado (función directa): ${tokenAmount} wcCOP`);
            }
          }
        } else {
          console.log(`⏭️ [BASE] Transacción omitida (no relevante)`);
        }
      }

      console.log(`🎉 [BASE] Total transacciones procesadas: ${transactions.length}`);
      console.log(`📊 [BASE] Detalle:`, transactions.map(t => ({
        type: t.type,
        amount: t.amount,
        hash: t.txHash.substring(0, 10)
      })));
      return transactions;
    }

    // If we get here, no valid transactions found
    console.log('⚠️ [BASE] No se encontraron transacciones válidas, retornando array vacío');
    return [];

  } catch (error) {
    console.error('❌ [BASE] Error obteniendo transacciones:', error);
    console.log('🔄 [BASE] Retornando array vacío debido al error');
    return [];
  }
};

/**
 * Get real transactions from Arbitrum (unwraps from Arbitrum)
 */
export const getArbitrumTransactions = async (walletAddress: string): Promise<RealTransaction[]> => {
  try {
    console.log('💰 [ARBITRUM] Wallet recibida:', walletAddress);
    console.log('💰 [ARBITRUM] Wallet (resumida):', `${walletAddress.substring(0, 6)}...${walletAddress.substring(38)}`);

    const wcCOPAddress = '0x5Cc112D9634a2D0cB3A0BA8dDC5dC05a010A3D22'; // wcCOP token address on Arbitrum

    const url = getApiUrl('arbitrum', walletAddress);
    console.log('🌐 [ARBITRUM] Llamando API:', url);
    console.log('🌐 [ARBITRUM] URL completa para verificar:', url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Arbitrum API error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    console.log('📦 [ARBITRUM] Respuesta API completa:', JSON.stringify(data, null, 2));

    // Handle Etherscan V2 API response structure (action=txlist)
    if (data.result && Array.isArray(data.result)) {
      console.log(`📋 [ARBITRUM] Total de transacciones recibidas: ${data.result.length}`);

      const transactions: RealTransaction[] = [];
      const processedHashes = new Set<string>(); // Para evitar duplicados

      for (const tx of data.result) {
        // Verificar si ya procesamos esta transacción (por hash)
        if (processedHashes.has(tx.hash)) {
          console.log(`⚠️ [ARBITRUM] TX duplicada detectada, omitiendo: ${tx.hash?.substring(0, 10)}`);
          continue;
        }

        console.log(`🔍 [ARBITRUM] Analizando TX ${tx.hash?.substring(0, 10)}...`, {
          from: tx.from?.substring(0, 10),
          to: tx.to?.substring(0, 10),
          contractAddress: tx.contractAddress?.substring(0, 10),
          isTokenTransfer: tx.isTokenTransfer,
          functionName: tx.functionName,
          methodId: tx.methodId,
          value: tx.value,
          tokenSymbol: tx.tokenSymbol,
          decodedAmount: tx.decodedAmount,
          transactionType: tx.transactionType
        });

        // Procesar token transfer (solo unwrap = enviar wcCOP para quemar)
        // Los wraps se cuentan en Celo, NO contamos minteos de wcCOP aquí
        if (tx.isTokenTransfer && tx.tokenSymbol === 'wcCOP') {
          const isSending = tx.from?.toLowerCase() === walletAddress.toLowerCase();
          const amount = parseFloat(tx.value) / Math.pow(10, parseInt(tx.tokenDecimal || '18'));

          console.log(`💸 [ARBITRUM] Token transfer detectado:`, {
            isSending,
            amount,
            from: tx.from,
            to: tx.to
          });

          if (isSending) {
            // Enviar wcCOP = unwrap de vuelta a Celo
            transactions.push({
              id: tx.hash,
              type: 'unwrap',
              chain: 'Arbitrum',
              amount: amount.toFixed(2),
              timestamp: parseInt(tx.timeStamp) * 1000,
              txHash: tx.hash,
              status: 'completed',
              fromAddress: tx.from,
              toAddress: tx.to,
              blockNumber: tx.blockNumber,
              gasUsed: tx.gasUsed || '0',
              gasPrice: tx.gasPrice || '0'
            });
            processedHashes.add(tx.hash);
            console.log(`✅ [ARBITRUM] UNWRAP detectado (envío): ${amount} wcCOP`);
          }
        }
        // Procesar transacciones regulares (solo si NO es token transfer para evitar duplicados)
        else if (!tx.isTokenTransfer) {
          const isToWCCOPContract = tx.to?.toLowerCase() === wcCOPAddress.toLowerCase();
          const isUnwrapCall = tx.functionName === 'unwrap' ||
                             (tx.input && tx.input.startsWith('0x39f47693'));

          console.log(`🔧 [ARBITRUM] Revisando llamada a función:`, {
            isToWCCOPContract,
            isUnwrapCall,
            decodedAmount: tx.decodedAmount
          });

          if (isToWCCOPContract && isUnwrapCall) {
            const tokenAmount = tx.decodedAmount || 0;

            if (tokenAmount > 0) {
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
              processedHashes.add(tx.hash);
              console.log(`✅ [ARBITRUM] UNWRAP detectado (función directa): ${tokenAmount} wcCOP`);
            }
          }
        } else {
          console.log(`⏭️ [ARBITRUM] Transacción omitida (no relevante)`);
        }
      }

      console.log(`🎉 [ARBITRUM] Total transacciones procesadas: ${transactions.length}`);
      console.log(`📊 [ARBITRUM] Detalle:`, transactions.map(t => ({
        type: t.type,
        amount: t.amount,
        hash: t.txHash.substring(0, 10)
      })));
      return transactions;
    }

    // If we get here, no valid transactions found
    console.log('⚠️ [ARBITRUM] No se encontraron transacciones válidas, retornando array vacío');
    return [];

  } catch (error) {
    console.error('❌ [ARBITRUM] Error obteniendo transacciones:', error);
    console.log('🔄 [ARBITRUM] Retornando array vacío debido al error');
    return [];
  }
};

/**
 * Get real transactions from Optimism (unwraps from Optimism)
 */
export const getOptimismTransactions = async (walletAddress: string): Promise<RealTransaction[]> => {
  try {
    console.log('💰 [OPTIMISM] Wallet recibida:', walletAddress);
    console.log('💰 [OPTIMISM] Wallet (resumida):', `${walletAddress.substring(0, 6)}...${walletAddress.substring(38)}`);

    const wcCOPAddress = '0x5Cc112D9634a2D0cB3A0BA8dDC5dC05a010A3D22'; // wcCOP token address on Optimism

    const url = getApiUrl('optimism', walletAddress);
    console.log('🌐 [OPTIMISM] Llamando API:', url);
    console.log('🌐 [OPTIMISM] URL completa para verificar:', url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Optimism API error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    console.log('📦 [OPTIMISM] Respuesta API completa:', JSON.stringify(data, null, 2));

    // Handle Etherscan V2 API response structure (action=txlist)
    if (data.result && Array.isArray(data.result)) {
      console.log(`📋 [OPTIMISM] Total de transacciones recibidas: ${data.result.length}`);

      const transactions: RealTransaction[] = [];
      const processedHashes = new Set<string>(); // Para evitar duplicados

      for (const tx of data.result) {
        // Verificar si ya procesamos esta transacción (por hash)
        if (processedHashes.has(tx.hash)) {
          console.log(`⚠️ [OPTIMISM] TX duplicada detectada, omitiendo: ${tx.hash?.substring(0, 10)}`);
          continue;
        }

        console.log(`🔍 [OPTIMISM] Analizando TX ${tx.hash?.substring(0, 10)}...`, {
          from: tx.from?.substring(0, 10),
          to: tx.to?.substring(0, 10),
          contractAddress: tx.contractAddress?.substring(0, 10),
          isTokenTransfer: tx.isTokenTransfer,
          functionName: tx.functionName,
          methodId: tx.methodId,
          value: tx.value,
          tokenSymbol: tx.tokenSymbol,
          decodedAmount: tx.decodedAmount,
          transactionType: tx.transactionType
        });

        // Procesar token transfer (solo unwrap = enviar wcCOP para quemar)
        // Los wraps se cuentan en Celo, NO contamos minteos de wcCOP aquí
        if (tx.isTokenTransfer && tx.tokenSymbol === 'wcCOP') {
          const isSending = tx.from?.toLowerCase() === walletAddress.toLowerCase();
          const amount = parseFloat(tx.value) / Math.pow(10, parseInt(tx.tokenDecimal || '18'));

          console.log(`💸 [OPTIMISM] Token transfer detectado:`, {
            isSending,
            amount,
            from: tx.from,
            to: tx.to
          });

          if (isSending) {
            // Enviar wcCOP = unwrap de vuelta a Celo
            transactions.push({
              id: tx.hash,
              type: 'unwrap',
              chain: 'Optimism',
              amount: amount.toFixed(2),
              timestamp: parseInt(tx.timeStamp) * 1000,
              txHash: tx.hash,
              status: 'completed',
              fromAddress: tx.from,
              toAddress: tx.to,
              blockNumber: tx.blockNumber,
              gasUsed: tx.gasUsed || '0',
              gasPrice: tx.gasPrice || '0'
            });
            processedHashes.add(tx.hash);
            console.log(`✅ [OPTIMISM] UNWRAP detectado (envío): ${amount} wcCOP`);
          }
        }
        // Procesar transacciones regulares (solo si NO es token transfer para evitar duplicados)
        else if (!tx.isTokenTransfer) {
          const isToWCCOPContract = tx.to?.toLowerCase() === wcCOPAddress.toLowerCase();
          const isUnwrapCall = tx.functionName === 'unwrap' ||
                             (tx.input && tx.input.startsWith('0x39f47693'));

          console.log(`🔧 [OPTIMISM] Revisando llamada a función:`, {
            isToWCCOPContract,
            isUnwrapCall,
            decodedAmount: tx.decodedAmount
          });

          if (isToWCCOPContract && isUnwrapCall) {
            const tokenAmount = tx.decodedAmount || 0;

            if (tokenAmount > 0) {
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
              processedHashes.add(tx.hash);
              console.log(`✅ [OPTIMISM] UNWRAP detectado (función directa): ${tokenAmount} wcCOP`);
            }
          }
        } else {
          console.log(`⏭️ [OPTIMISM] Transacción omitida (no relevante)`);
        }
      }

      console.log(`🎉 [OPTIMISM] Total transacciones procesadas: ${transactions.length}`);
      console.log(`📊 [OPTIMISM] Detalle:`, transactions.map(t => ({
        type: t.type,
        amount: t.amount,
        hash: t.txHash.substring(0, 10)
      })));
      return transactions;
    }

    // If we get here, no valid transactions found
    console.log('⚠️ [OPTIMISM] No se encontraron transacciones válidas, retornando array vacío');
    return [];

  } catch (error) {
    console.error('❌ [OPTIMISM] Error obteniendo transacciones:', error);
    console.log('🔄 [OPTIMISM] Retornando array vacío debido al error');
    return [];
  }
};

/**
 * Get real transactions from Avalanche (unwraps from Avalanche)
 */
export const getAvalancheTransactions = async (walletAddress: string): Promise<RealTransaction[]> => {
  try {
    console.log('💰 [AVALANCHE] Wallet recibida:', walletAddress);
    console.log('💰 [AVALANCHE] Wallet (resumida):', `${walletAddress.substring(0, 6)}...${walletAddress.substring(38)}`);

    const wcCOPAddress = '0x5Cc112D9634a2D0cB3A0BA8dDC5dC05a010A3D22'; // wcCOP token address on Avalanche

    const url = getApiUrl('avalanche', walletAddress);
    console.log('🌐 [AVALANCHE] Llamando API:', url);
    console.log('🌐 [AVALANCHE] URL completa para verificar:', url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Avalanche API error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    console.log('📦 [AVALANCHE] Respuesta API completa:', JSON.stringify(data, null, 2));

    // Handle Etherscan V2 API response structure (action=txlist)
    if (data.result && Array.isArray(data.result)) {
      console.log(`📋 [AVALANCHE] Total de transacciones recibidas: ${data.result.length}`);

      const transactions: RealTransaction[] = [];
      const processedHashes = new Set<string>(); // Para evitar duplicados

      for (const tx of data.result) {
        // Verificar si ya procesamos esta transacción (por hash)
        if (processedHashes.has(tx.hash)) {
          console.log(`⚠️ [AVALANCHE] TX duplicada detectada, omitiendo: ${tx.hash?.substring(0, 10)}`);
          continue;
        }

        console.log(`🔍 [AVALANCHE] Analizando TX ${tx.hash?.substring(0, 10)}...`, {
          from: tx.from?.substring(0, 10),
          to: tx.to?.substring(0, 10),
          contractAddress: tx.contractAddress?.substring(0, 10),
          isTokenTransfer: tx.isTokenTransfer,
          functionName: tx.functionName,
          methodId: tx.methodId,
          value: tx.value,
          tokenSymbol: tx.tokenSymbol,
          decodedAmount: tx.decodedAmount,
          transactionType: tx.transactionType
        });

        // Procesar token transfer (solo unwrap = enviar wcCOP para quemar)
        // Los wraps se cuentan en Celo, NO contamos minteos de wcCOP aquí
        if (tx.isTokenTransfer && tx.tokenSymbol === 'wcCOP') {
          const isSending = tx.from?.toLowerCase() === walletAddress.toLowerCase();
          const amount = parseFloat(tx.value) / Math.pow(10, parseInt(tx.tokenDecimal || '18'));

          console.log(`💸 [AVALANCHE] Token transfer detectado:`, {
            isSending,
            amount,
            from: tx.from,
            to: tx.to
          });

          if (isSending) {
            // Enviar wcCOP = unwrap de vuelta a Celo
            transactions.push({
              id: tx.hash,
              type: 'unwrap',
              chain: 'Avalanche',
              amount: amount.toFixed(2),
              timestamp: parseInt(tx.timeStamp) * 1000,
              txHash: tx.hash,
              status: 'completed',
              fromAddress: tx.from,
              toAddress: tx.to,
              blockNumber: tx.blockNumber,
              gasUsed: tx.gasUsed || '0',
              gasPrice: tx.gasPrice || '0'
            });
            processedHashes.add(tx.hash);
            console.log(`✅ [AVALANCHE] UNWRAP detectado (envío): ${amount} wcCOP`);
          }
        }
        // Procesar transacciones regulares (solo si NO es token transfer para evitar duplicados)
        else if (!tx.isTokenTransfer) {
          const isToWCCOPContract = tx.to?.toLowerCase() === wcCOPAddress.toLowerCase();
          const isUnwrapCall = tx.functionName === 'unwrap' ||
                             (tx.input && tx.input.startsWith('0x39f47693'));

          console.log(`🔧 [AVALANCHE] Revisando llamada a función:`, {
            isToWCCOPContract,
            isUnwrapCall,
            decodedAmount: tx.decodedAmount
          });

          if (isToWCCOPContract && isUnwrapCall) {
            const tokenAmount = tx.decodedAmount || 0;

            if (tokenAmount > 0) {
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
              processedHashes.add(tx.hash);
              console.log(`✅ [AVALANCHE] UNWRAP detectado (función directa): ${tokenAmount} wcCOP`);
            }
          }
        } else {
          console.log(`⏭️ [AVALANCHE] Transacción omitida (no relevante)`);
        }
      }

      console.log(`🎉 [AVALANCHE] Total transacciones procesadas: ${transactions.length}`);
      console.log(`📊 [AVALANCHE] Detalle:`, transactions.map(t => ({
        type: t.type,
        amount: t.amount,
        hash: t.txHash.substring(0, 10)
      })));
      return transactions;
    }

    // If we get here, no valid transactions found
    console.log('⚠️ [AVALANCHE] No se encontraron transacciones válidas, retornando array vacío');
    return [];

  } catch (error) {
    console.error('❌ [AVALANCHE] Error obteniendo transacciones:', error);
    console.log('🔄 [AVALANCHE] Retornando array vacío debido al error');
    return [];
  }
};


/**
 * Get all real transactions from all chains
 */
export const getAllRealTransactions = async (walletAddress: string): Promise<RealTransaction[]> => {
  try {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🚀 [INICIO] Obteniendo transacciones de todas las cadenas');
    console.log('📍 Wallet Address:', walletAddress);
    console.log('📍 Wallet (resumida):', `${walletAddress.substring(0, 6)}...${walletAddress.substring(38)}`);
    console.log('═══════════════════════════════════════════════════════════');

    // Fetch transactions from all chains sequentially with delays to avoid rate limiting
    console.log('\n🔄 [CELO] Iniciando búsqueda...');
    const celoTxs = await getCeloTransactions(walletAddress);
    console.log(`✓ [CELO] Completado: ${celoTxs.length} transacciones`);

    // Wait 1 second between API calls to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('\n🔄 [BASE] Iniciando búsqueda...');
    const baseTxs = await getBaseTransactions(walletAddress);
    console.log(`✓ [BASE] Completado: ${baseTxs.length} transacciones`);

    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('\n🔄 [ARBITRUM] Iniciando búsqueda...');
    const arbitrumTxs = await getArbitrumTransactions(walletAddress);
    console.log(`✓ [ARBITRUM] Completado: ${arbitrumTxs.length} transacciones`);

    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('\n🔄 [OPTIMISM] Iniciando búsqueda...');
    const optimismTxs = await getOptimismTransactions(walletAddress);
    console.log(`✓ [OPTIMISM] Completado: ${optimismTxs.length} transacciones`);

    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('\n🔄 [AVALANCHE] Iniciando búsqueda...');
    const avalancheTxs = await getAvalancheTransactions(walletAddress);
    console.log(`✓ [AVALANCHE] Completado: ${avalancheTxs.length} transacciones`);

    // Combine all transactions and sort by timestamp (newest first)
    const allTransactions = [...celoTxs, ...baseTxs, ...arbitrumTxs, ...optimismTxs, ...avalancheTxs]
      .sort((a, b) => b.timestamp - a.timestamp);

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🎉 [RESUMEN] Total de transacciones encontradas:', allTransactions.length);
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`   📊 Celo:     ${celoTxs.length} txs ${celoTxs.length > 0 ? '✅' : '❌'}`);
    console.log(`   📊 Base:     ${baseTxs.length} txs ${baseTxs.length > 0 ? '✅' : '❌'}`);
    console.log(`   📊 Arbitrum: ${arbitrumTxs.length} txs ${arbitrumTxs.length > 0 ? '✅' : '❌'}`);
    console.log(`   📊 Optimism: ${optimismTxs.length} txs ${optimismTxs.length > 0 ? '✅' : '❌'}`);
    console.log(`   📊 Avalanche: ${avalancheTxs.length} txs ${avalancheTxs.length > 0 ? '✅' : '❌'}`);
    console.log('═══════════════════════════════════════════════════════════');

    if (allTransactions.length > 0) {
      console.log('\n📋 [DETALLE] Transacciones por tipo:');
      const wraps = allTransactions.filter(t => t.type === 'wrap');
      const unwraps = allTransactions.filter(t => t.type === 'unwrap');
      console.log(`   🔄 Wraps: ${wraps.length}`);
      console.log(`   🔙 Unwraps: ${unwraps.length}`);
      console.log('\n📋 [LISTADO] Todas las transacciones:');
      allTransactions.forEach((tx, index) => {
        console.log(`   ${index + 1}. [${tx.chain}] ${tx.type.toUpperCase()} - ${tx.amount} cCOP - ${tx.txHash.substring(0, 10)}...`);
      });
    }
    console.log('═══════════════════════════════════════════════════════════\n');

    return allTransactions;
  } catch (error) {
    console.error('❌ [ERROR GLOBAL] Error obteniendo todas las transacciones:', error);
    return [];
  }
}; 