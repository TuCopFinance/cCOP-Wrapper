'use client';
import { useState, useEffect } from 'react';
import { useAccount, useSigner } from 'wagmi';
import { ethers } from 'ethers';

const W_COP_ABI = ['function balanceOf(address owner) view returns (uint256)', 'function decimals() view returns (uint8)'];

export default function Dashboard() {
  const { address } = useAccount();
  const { data: signer } = useSigner();
  const [balance, setBalance] = useState('0');
  const [decimals, setDecimals] = useState(18);
  const [history, setHistory] = useState([]);

  const wcopAddress = process.env.NEXT_PUBLIC_WCOP_ADDRESS;

  useEffect(() => {
    if (!signer || !address) return;

    const load = async () => {
      const token = new ethers.Contract(wcopAddress, W_COP_ABI, signer);
      const bal = await token.balanceOf(address);
      const dec = await token.decimals();
      setBalance(ethers.utils.formatUnits(bal, dec));
      setDecimals(dec);

      const txs = JSON.parse(localStorage.getItem('txHistory') || '[]');
      setHistory(txs.reverse().slice(0, 10));
    };
    load();
  }, [signer, address]);

  const addToMetaMask = async () => {
    try {
      const wasAdded = await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: wcopAddress,
            symbol: 'wCOP',
            decimals,
          },
        },
      });
      console.log('Token added:', wasAdded);
    } catch (error) {
      console.error('Error adding token', error);
    }
  };

  return (
    <div>
      <h2>Tu saldo actual</h2>
      <p><strong>{balance}</strong> wCOP</p>
      <button onClick={addToMetaMask}>➕ Agregar wCOP a MetaMask</button>

      <h3>🧾 Historial reciente</h3>
      <ul>
        {history.length === 0 && <li>No hay transacciones recientes.</li>}
        {history.map((tx, i) => (
          <li key={i}>
            {tx.action} {tx.amount} → <a href={tx.explorer} target="_blank" rel="noreferrer">ver tx</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
