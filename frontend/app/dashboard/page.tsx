'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { ethers } from 'ethers';
import { useWrapCCOP } from '../hooks';

declare global {
  interface Window {
    ethereum?: any;
  }
}

const W_COP_ABI = ['function balanceOf(address owner) view returns (uint256)', 'function decimals() view returns (uint8)'];

export default function Dashboard() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [balance, setBalance] = useState('0');
  const [decimals, setDecimals] = useState(18);
  const [history, setHistory] = useState([]);

  const wcopAddress = process.env.NEXT_PUBLIC_WCOP_ADDRESS;

  useEffect(() => {
    const fetchBalance = async () => {
      if (!walletClient || !address || !window.ethereum) return;
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(process.env.NEXT_PUBLIC_WCOP_ADDRESS, W_COP_ABI, provider);
      const bal = await contract.balanceOf(address);
      const dec = await contract.decimals();
      setBalance(ethers.utils.formatUnits(bal, dec));
      setDecimals(dec);
      const txs = JSON.parse(localStorage.getItem('txHistory') || '[]');
      setHistory(txs.reverse().slice(0, 10));
    };
    fetchBalance();
  }, [walletClient, address]);

  const addToMetaMask = async () => {
    if (!window.ethereum) return;
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
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-900 via-blue-400 to-yellow-300 flex flex-col">
      <nav className="w-full bg-white/80 backdrop-blur-md shadow-md py-4 px-8 flex justify-between items-center fixed top-0 left-0 z-10">
        <Link href="/" className="text-2xl font-extrabold text-blue-900 tracking-tight hover:underline focus:outline-none">Wrapped cCOP</Link>
        <div className="flex gap-6">
          <Link href="/dashboard" className="text-blue-700 hover:text-yellow-500 font-medium transition">Dashboard</Link>
          <Link href="/deposit" className="text-blue-700 hover:text-yellow-500 font-medium transition">Deposit</Link>
          <Link href="/burn" className="text-blue-700 hover:text-yellow-500 font-medium transition">Burn</Link>
          <Link href="/history" className="text-blue-700 hover:text-yellow-500 font-medium transition">History</Link>
        </div>
      </nav>
      <main className="flex-1 flex items-center justify-center pt-32 pb-12">
        <div className="w-full max-w-lg bg-white/90 rounded-3xl shadow-2xl p-10 flex flex-col items-center border border-blue-100">
          <h1 className="text-3xl font-bold text-blue-900 mb-4 text-center drop-shadow">Dashboard</h1>
          <p className="mb-2 text-blue-800 text-lg">Tu saldo actual</p>
          <p className="mb-4 text-2xl font-mono text-blue-900">{balance} wCOP</p>
          <button onClick={addToMetaMask} className="mb-6 px-4 py-2 bg-gradient-to-r from-yellow-400 to-blue-500 text-white rounded-xl shadow hover:from-yellow-500 hover:to-blue-600 transition">➕ Agregar wCOP a MetaMask</button>
          <h2 className="text-lg text-blue-700 mb-2">🧾 Historial reciente</h2>
          <ul className="space-y-2 w-full">
            {history.length === 0 && <li className="text-gray-500">No hay transacciones recientes.</li>}
            {history.map((tx, i) => (
              <li key={i} className="text-blue-900 text-sm bg-blue-50 rounded p-2 flex justify-between items-center">
                <span>{tx.action} {tx.amount}</span>
                <a href={tx.explorer} target="_blank" rel="noreferrer" className="text-blue-600 underline">ver tx</a>
              </li>
            ))}
          </ul>
        </div>
      </main>
      <footer className="w-full text-center py-4 text-blue-900/80 font-medium text-sm">
        Powered by Celo Colombia &middot; Chainlink CCIP Demo
      </footer>
    </div>
  );
}
