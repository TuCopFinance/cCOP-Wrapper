import { NextRequest, NextResponse } from 'next/server';

// API Keys (should be in environment variables in production)
const API_KEYS = {
  base: 'IF6KWNPTIXGFAMYY19GBUJJ3D1MNIN78MP', // Etherscan V2 API key for Base
  arbitrum: 'IF6KWNPTIXGFAMYY19GBUJJ3D1MNIN78MP', // Etherscan V2 API key for Arbitrum
  optimism: 'IF6KWNPTIXGFAMYY19GBUJJ3D1MNIN78MP', // Etherscan V2 API key for Optimism
  avalanche: 'IF6KWNPTIXGFAMYY19GBUJJ3D1MNIN78MP' // Snowtrace API key for Avalanche
};

// Helper function to decode unwrap amount from transaction input
const decodeUnwrapAmount = (input: string): number => {
  try {
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

// Helper function to decode wrap amount from transaction input
const decodeWrapAmount = (input: string): number => {
  try {
    if (input && input.length >= 138) {
      // Extract the amount parameter (third parameter), which starts at index 138
      const amountHex = input.substring(138, 138 + 64);
      const parameterValue = BigInt('0x' + amountHex);
      // Convert from wei to token units (18 decimals)
      const tokenAmount = Number(parameterValue) / Math.pow(10, 18);
      
      console.log('🔍 Decoded wrap parameters:', {
        amount: tokenAmount
      });
      return tokenAmount;
    }
  } catch (error) {
    console.error('Error decoding wrap amount:', error);
  }
  return 0;
};

// Helper function to fetch token transfers for wrap/unwrap detection
const fetchTokenTransfers = async (chain: string, address: string, contractAddress: string, apiKey: string) => {
  let chainId: string;
  switch (chain) {
    case 'base':
      chainId = '8453';
      break;
    case 'arbitrum':
      chainId = '42161';
      break;
    case 'optimism':
      chainId = '10';
      break;
    case 'avalanche':
      chainId = '43114';
      break;
    default:
      return null;
  }

  const tokenUrl = `https://api.etherscan.io/v2/api?chainid=${chainId}&module=account&action=tokentx&contractaddress=${contractAddress}&address=${address}&page=1&offset=1000&sort=desc&apikey=${apiKey}`;

  try {
    console.log(`🪙 Fetching token transfers for ${chain.toUpperCase()}:`, tokenUrl.replace(apiKey, 'HIDDEN_API_KEY'));
    const response = await fetch(tokenUrl, {
      headers: {
        'User-Agent': 'cCOP-Wrapper/1.0',
      },
    });

    if (response.ok) {
      const tokenData = await response.json();
      console.log(`🪙 ${chain.toUpperCase()} Token transfers response:`, {
        status: tokenData.status,
        message: tokenData.message,
        resultCount: tokenData.result?.length || 0,
        firstTx: tokenData.result?.[0] ? {
          hash: tokenData.result[0].hash,
          from: tokenData.result[0].from,
          to: tokenData.result[0].to,
          value: tokenData.result[0].value
        } : null
      });
      return tokenData;
    }
  } catch (error) {
    console.error(`Error fetching token transfers for ${chain}:`, error);
  }
  return null;
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const chain = searchParams.get('chain');
  const address = searchParams.get('address');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const contractaddress = searchParams.get('contractaddress');
  
  if (!chain || !address) {
    return NextResponse.json({ error: 'Missing chain or address parameter' }, { status: 400 });
  }

  try {
    let url: string;
    const wcCOPAddress = '0x5Cc112D9634a2D0cB3A0BA8dDC5dC05a010A3D22';
    
    switch (chain) {
      case 'celo':
        // For Celo, use Etherscan V2 unified API with chainid=42220 to get normal transactions
        // Get all historical transactions
        url = `https://api.etherscan.io/v2/api?chainid=42220&module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=10000&sort=desc&apikey=${API_KEYS.base}`;
        break;
      case 'base':
        // For Base, get all historical transactions
        url = `https://api.etherscan.io/v2/api?chainid=8453&module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=10000&sort=desc&apikey=${API_KEYS.base}`;
        break;
      case 'arbitrum':
        // For Arbitrum, try both regular transactions and token transfers
        // First try regular transactions, then we'll try token transfers if needed
        url = `https://api.etherscan.io/v2/api?chainid=42161&module=account&action=txlist&address=${address}&startblock=0&endblock=latest&page=1&offset=1000&sort=desc&apikey=${API_KEYS.arbitrum}`;
        break;
      case 'optimism':
        // For Optimism, get all historical transactions
        url = `https://api.etherscan.io/v2/api?chainid=10&module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=10000&sort=desc&apikey=${API_KEYS.optimism}`;
        break;
      case 'avalanche':
        // For Avalanche, get all historical transactions
        url = `https://api.etherscan.io/v2/api?chainid=43114&module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=10000&sort=desc&apikey=${API_KEYS.avalanche}`;
        break;
      default:
        return NextResponse.json({ error: 'Invalid chain parameter' }, { status: 400 });
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'cCOP-Wrapper/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    
    // Log the response for debugging
    console.log(`📡 ${chain.toUpperCase()} API response:`, {
      status: data.status,
      message: data.message,
      resultCount: data.result?.length || 0,
      firstFewTxHashes: (Array.isArray(data.result) ? data.result.slice(0, 5).map((tx: Record<string, unknown>) => ({
        hash: tx.hash,
        to: tx.to,
        methodId: tx.methodId,
        blockNumber: tx.blockNumber,
        functionName: tx.functionName,
        input: typeof tx.input === 'string' ? tx.input.substring(0, 20) + '...' : undefined
      })) : [])
    });
    
    // Log the full URL for debugging API calls
    console.log(`🌐 ${chain.toUpperCase()} API URL:`, url.replace(API_KEYS[chain as keyof typeof API_KEYS], 'HIDDEN_API_KEY'));

    // For L2 chains, ALWAYS fetch token transfers as they're more reliable than txlist
    // Etherscan V2 API returns status:'0' even when there are token transfers
    if (['arbitrum', 'optimism', 'avalanche', 'base'].includes(chain)) {
      console.log(`🔍 Fetching token transfers for ${chain.toUpperCase()} (L2 chain - always check token transfers)...`);
      const tokenData = await fetchTokenTransfers(chain, address, wcCOPAddress, API_KEYS[chain as keyof typeof API_KEYS]);
      if (tokenData && tokenData.result && Array.isArray(tokenData.result) && tokenData.result.length > 0) {
        // Convert token transfers to transaction format for processing
        const tokenTxs = tokenData.result.map((tx: Record<string, unknown>) => ({
          ...tx,
          // Mark as token transfer so we can process it correctly
          isTokenTransfer: true,
          // Preserve original addresses for proper filtering
          to: tx.to,
          from: tx.from
        }));

        // Replace or merge with regular transactions
        if (!data.result || data.result.length === 0 || data.status === '0') {
          data.result = tokenTxs;
          data.status = '1'; // Override status to indicate we found transactions
          console.log(`🪙 Using ${tokenTxs.length} token transfers for ${chain.toUpperCase()}`);
        } else {
          // Merge both types of transactions
          data.result = [...data.result, ...tokenTxs];
          console.log(`🪙 Merged ${tokenTxs.length} token transfers with ${data.result.length - tokenTxs.length} regular transactions for ${chain.toUpperCase()}`);
        }
      }
    }
    
    // Process transactions to extract correct values
    if (data.result && Array.isArray(data.result)) {
      const processedTransactions: Record<string, unknown>[] = [];
      
      for (const tx of data.result) {
        const processedTx = { ...tx };
        
        // Process based on chain and transaction type
        if (chain === 'celo') {
          // Look for wrap transactions (to treasury)
          const treasuryAddress = '0x5Cc112D9634a2D0cB3A0BA8dDC5dC05a010A3D22';
          const isToTreasury = tx.to?.toLowerCase() === treasuryAddress.toLowerCase();
          const isWrapCall = tx.input && tx.input.startsWith('0x3c7580e6');
          
          console.log('🔍 Celo transaction analysis:', {
            hash: tx.hash,
            to: tx.to,
            methodId: tx.methodId,
            functionName: tx.functionName,
            isToTreasury,
            isWrapCall,
            inputStart: tx.input?.substring(0, 10)
          });
          
          if (isToTreasury && isWrapCall) {
            const tokenAmount = decodeWrapAmount(tx.input);
            processedTx.decodedAmount = tokenAmount;
            processedTx.transactionType = 'wrap';
            console.log('✅ Processed Celo wrap transaction:', tx.hash, 'Amount:', tokenAmount);
          }
        } else {
          // Look for unwrap transactions
          const wcCOPAddress = '0x5Cc112D9634a2D0cB3A0BA8dDC5dC05a010A3D22';
          
          // Handle token transfers (for unwraps detected as ERC-20 transfers)
          if (tx.isTokenTransfer) {
            const isFromUser = tx.from?.toLowerCase() === address.toLowerCase();
            const isToUser = tx.to?.toLowerCase() === address.toLowerCase();
            const isFromZero = tx.from?.toLowerCase() === '0x0000000000000000000000000000000000000000';
            
            console.log(`🔍 ${chain} token transfer analysis:`, {
              hash: tx.hash,
              from: tx.from,
              to: tx.to,
              tokenSymbol: tx.tokenSymbol,
              value: tx.value,
              isFromUser,
              isToUser,
              isFromZero,
              functionName: tx.functionName
            });
            
            // Unwrap: user sends wcCOP tokens (burn/bridge operation)
            if (isFromUser && tx.tokenSymbol === 'wcCOP') {
              const tokenAmount = parseFloat(tx.value) / Math.pow(10, parseInt(tx.tokenDecimal || '18'));
              processedTx.decodedAmount = tokenAmount;
              processedTx.transactionType = 'unwrap';
              console.log(`✅ Processed ${chain} unwrap token transfer:`, tx.hash, 'Amount:', tokenAmount);
            }
            // Wrap/mint: user receives wcCOP tokens (but this shouldn't happen for other chains)
            else if (isToUser && isFromZero && tx.tokenSymbol === 'wcCOP') {
              console.log(`ℹ️ ${chain} mint/wrap token transfer (unusual for non-Celo chain):`, tx.hash);
            }
          } else {
            // Look for regular unwrap transactions (from wcCOP contracts)
            const isToWCCOPContract = tx.to?.toLowerCase() === wcCOPAddress.toLowerCase();
            const isUnwrapCall = tx.methodId === '0x39f47693' || 
                               tx.functionName?.includes('unwrap') ||
                               (tx.input && tx.input.startsWith('0x39f47693'));
            
            if (isToWCCOPContract && isUnwrapCall) {
              const tokenAmount = decodeUnwrapAmount(tx.input);
              processedTx.decodedAmount = tokenAmount;
              processedTx.transactionType = 'unwrap';
              console.log(`✅ Processed ${chain} unwrap transaction:`, tx.hash, 'Amount:', tokenAmount);
            }
          }
        }
        
        processedTransactions.push(processedTx);
      }
      
      data.result = processedTransactions;
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error fetching ${chain} transactions:`, error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
} 