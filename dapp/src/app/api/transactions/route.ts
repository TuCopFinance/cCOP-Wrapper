import { NextRequest, NextResponse } from 'next/server';

// API Keys (should be in environment variables in production)
const API_KEYS = {
  base: 'IF6KWNPTIXGFAMYY19GBUJJ3D1MNIN78MP', // Etherscan V2 API key for Base
  arbitrum: 'IF6KWNPTIXGFAMYY19GBUJJ3D1MNIN78MP' // Etherscan V2 API key for Arbitrum
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const chain = searchParams.get('chain');
  const address = searchParams.get('address');
  const contractaddress = searchParams.get('contractaddress');
  
  if (!chain || !address) {
    return NextResponse.json({ error: 'Missing chain or address parameter' }, { status: 400 });
  }

  try {
    let url: string;
    
    switch (chain) {
      case 'celo':
        // For Celo, get token transfers if contractaddress is provided, otherwise general transactions
        if (contractaddress) {
          // Use Blockscout token transfers API
          url = `https://explorer.celo.org/api/v2/addresses/${address}/token-transfers?contract_address=${contractaddress}`;
        } else {
          // Fallback to general transactions
          url = `https://explorer.celo.org/api/v2/addresses/${address}/transactions`;
        }
        break;
      case 'base':
        // For Base, use Etherscan V2 unified API with chainid=8453 to get normal transactions
        url = `https://api.etherscan.io/v2/api?chainid=8453&module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${API_KEYS.base}`;
        break;
      case 'arbitrum':
        // For Arbitrum, use Etherscan V2 unified API with chainid=42161 to get normal transactions
        url = `https://api.etherscan.io/v2/api?chainid=42161&module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${API_KEYS.arbitrum}`;
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
    console.log(`📡 ${chain.toUpperCase()} API response:`, data);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error fetching ${chain} transactions:`, error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
} 