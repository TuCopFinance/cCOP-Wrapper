'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { ethers } from 'ethers';
import { useWrapCCOP } from '../hooks';
import Image from 'next/image';

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
      {/* Responsive Navigation */}
      <nav className="w-full bg-white/80 backdrop-blur-md shadow-md py-4 px-4 sm:px-8 flex flex-col sm:flex-row justify-between items-center fixed top-0 left-0 z-10">
        <Link href="/" className="text-xl sm:text-2xl font-extrabold text-blue-900 tracking-tight hover:underline focus:outline-none mb-4 sm:mb-0">Wrapped cCOP</Link>
        <div className="flex flex-wrap justify-center gap-3 sm:gap-6">
          <Link href="/" className="text-sm sm:text-base text-blue-700 hover:text-yellow-500 font-medium transition">Home</Link>
          <Link href="/dashboard" className="text-sm sm:text-base text-blue-700 hover:text-yellow-500 font-medium transition">Dashboard</Link>
          <Link href="/deposit" className="text-sm sm:text-base text-blue-700 hover:text-yellow-500 font-medium transition">Deposit</Link>
          <Link href="/burn" className="text-sm sm:text-base text-blue-700 hover:text-yellow-500 font-medium transition">Burn</Link>
          <Link href="/history" className="text-sm sm:text-base text-blue-700 hover:text-yellow-500 font-medium transition">History</Link>
        </div>
      </nav>

      {/* Responsive Main Content */}
      <main className="flex-1 flex items-center justify-center pt-24 sm:pt-32 pb-8 sm:pb-12 px-4">
        <div className="w-full max-w-lg bg-white/90 rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-10 flex flex-col items-center border border-blue-100">
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-900 mb-4 text-center drop-shadow">Dashboard</h1>
          <p className="mb-2 text-blue-800 text-base sm:text-lg">Tu saldo actual</p>
          <p className="mb-4 text-xl sm:text-2xl font-mono text-blue-900">{balance} wCOP</p>
          <button onClick={addToMetaMask} className="w-full sm:w-auto mb-6 px-4 py-2 bg-gradient-to-r from-yellow-400 to-blue-500 text-white rounded-xl shadow hover:from-yellow-500 hover:to-blue-600 transition text-sm sm:text-base">➕ Agregar wCOP a MetaMask</button>
          <h2 className="text-base sm:text-lg text-blue-700 mb-2">🧾 Historial reciente</h2>
          <ul className="space-y-2 w-full">
            {history.length === 0 && <li className="text-gray-500 text-sm sm:text-base">No hay transacciones recientes.</li>}
            {history.map((tx, i) => (
              <li key={i} className="text-blue-900 text-xs sm:text-sm bg-blue-50 rounded p-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-0">
                <span className="break-all">{tx.action} {tx.amount}</span>
                <a href={tx.explorer} target="_blank" rel="noreferrer" className="text-blue-600 underline text-xs sm:text-sm">ver tx</a>
              </li>
            ))}
          </ul>
        </div>
      </main>

      {/* Responsive Footer */}
      <footer className="w-full text-center py-4 text-blue-900/80 font-medium text-xs sm:text-sm flex justify-center items-center gap-1">
        Powered by&nbsp;
        <span className="inline-flex items-center">
          <Image src="/assets/CeloColLogo.png" alt="C" width={18} height={18} className="inline-block mx-0.5" />elo&nbsp;
          <Image src="/assets/CeloColLogo.png" alt="C" width={18} height={18} className="inline-block mx-0.5" />olombia
        </span>
        &nbsp;&middot;&nbsp;Chainlink CCIP Demo
      </footer>
    </div>
  );
}
