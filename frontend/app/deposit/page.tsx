'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { useWrapCCOP } from '../hooks';
import { parseUnits } from 'viem';
import Image from 'next/image';

export default function DepositPage() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { depositToBase, status } = useWrapCCOP();
  const [amount, setAmount] = useState('');

  const handleDeposit = () => {
    if (!walletClient || !address) return;
    depositToBase(
      process.env.NEXT_PUBLIC_CCOP_ADDRESS!,
      process.env.NEXT_PUBLIC_VAULT_ADDRESS!,
      BigInt(process.env.NEXT_PUBLIC_BASE_SELECTOR!),
      address,
      parseUnits(amount, 18)
    );
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-900 via-blue-400 to-yellow-300 flex flex-col">
      <nav className="w-full bg-white/80 backdrop-blur-md shadow-md py-4 px-4 sm:px-8 flex flex-col sm:flex-row justify-between items-center fixed top-0 left-0 z-10">
        <Link href="/" className="text-xl sm:text-2xl font-extrabold text-blue-900 tracking-tight hover:underline focus:outline-none mb-4 sm:mb-0">Wrapped cCOP</Link>
        <div className="flex flex-wrap justify-center gap-3 sm:gap-6">
          <Link href="/" className="text-sm sm:text-base text-blue-700 hover:text-yellow-500 font-medium transition">Home</Link>
          <Link href="/dashboard" className="text-blue-700 hover:text-yellow-500 font-medium transition">Dashboard</Link>
          <Link href="/deposit" className="text-blue-700 hover:text-yellow-500 font-medium transition">Deposit</Link>
          <Link href="/burn" className="text-blue-700 hover:text-yellow-500 font-medium transition">Burn</Link>
          <Link href="/history" className="text-blue-700 hover:text-yellow-500 font-medium transition">History</Link>
        </div>
      </nav>
      <main className="flex-1 flex items-center justify-center pt-32 pb-12">
        <div className="w-full max-w-lg bg-white/90 rounded-3xl shadow-2xl p-10 flex flex-col items-center border border-blue-100">
          <h1 className="text-3xl font-bold text-blue-900 mb-4 text-center drop-shadow">Depositar cCOP (Celo → Base)</h1>
          <label className="mb-2 text-blue-800 font-medium w-full text-left">Cantidad a depositar</label>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} className="mb-4 w-full px-4 py-2 rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="0.0" />
          <button onClick={handleDeposit} className="mb-4 px-8 py-3 bg-gradient-to-r from-blue-700 to-yellow-400 text-white font-bold rounded-xl shadow-lg hover:from-blue-800 hover:to-yellow-500 transition text-lg">Depositar</button>
          <p className="text-blue-700 text-sm min-h-[24px]">{status}</p>
        </div>
      </main>
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
