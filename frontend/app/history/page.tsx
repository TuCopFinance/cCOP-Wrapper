'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

export default function History() {
  const { address } = useAccount();
  const [tab, setTab] = useState<'base' | 'celo'>('base');
  const [baseTxs, setBaseTxs] = useState([]);
  const [celoTxs, setCeloTxs] = useState([]);
  const [loadingBase, setLoadingBase] = useState(false);
  const [loadingCelo, setLoadingCelo] = useState(false);

  useEffect(() => {
    if (!address) return;
    // Base
    setLoadingBase(true);
    fetch(`https://api.basescan.org/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${process.env.NEXT_PUBLIC_BASESCAN_API_KEY}`)
      .then(res => res.json())
      .then(data => setBaseTxs(data.result ? data.result.slice(0, 15) : []))
      .catch(() => setBaseTxs([]))
      .finally(() => setLoadingBase(false));
    // Celo
    setLoadingCelo(true);
    fetch(`https://explorer.celo.org/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc`)
      .then(res => res.json())
      .then(data => setCeloTxs(data.result ? data.result.slice(0, 15) : []))
      .catch(() => setCeloTxs([]))
      .finally(() => setLoadingCelo(false));
  }, [address]);

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
          <h1 className="text-3xl font-bold text-blue-900 mb-6 text-center drop-shadow">Historial de transacciones</h1>
          {/* Tabs */}
          <div className="flex mb-6 w-full justify-center gap-4">
            <button
              onClick={() => setTab('base')}
              className={`px-6 py-2 rounded-lg font-semibold text-base transition border-b-4 border-transparent focus:outline-none
                ${tab === 'base'
                  ? 'bg-blue-100 text-blue-900 border-blue-700 font-bold'
                  : 'bg-white text-blue-700 hover:bg-blue-50'}`}
            >
              Base
            </button>
            <button
              onClick={() => setTab('celo')}
              className={`px-6 py-2 rounded-lg font-semibold text-base transition border-b-4 border-transparent focus:outline-none
                ${tab === 'celo'
                  ? 'bg-yellow-100 text-blue-900 border-yellow-400 font-bold'
                  : 'bg-white text-yellow-700 hover:bg-yellow-50'}`}
            >
              Celo
            </button>
          </div>
          {/* Tab content */}
          {tab === 'base' ? (
            <div className="w-full">
              {loadingBase && <p className="text-blue-700">Cargando...</p>}
              <ul className="space-y-2 w-full bg-blue-50/80 rounded-xl p-4">
                {baseTxs.length === 0 && !loadingBase && <li className="text-gray-500">No hay transacciones recientes.</li>}
                {baseTxs.map((tx, i) => (
                  <li key={i} className="text-blue-900 text-sm bg-white/80 rounded p-2 flex justify-between items-center border border-blue-200">
                    <a
                      href={`https://basescan.org/tx/${tx.hash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 underline"
                    >
                      {tx.hash.slice(0, 12)}... — {parseFloat(tx.value) / 1e18} ETH
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="w-full">
              {loadingCelo && <p className="text-green-700">Cargando...</p>}
              <ul className="space-y-2 w-full bg-yellow-50/80 rounded-xl p-4">
                {celoTxs.length === 0 && !loadingCelo && <li className="text-gray-500">No hay transacciones recientes.</li>}
                {celoTxs.map((tx, i) => (
                  <li key={i} className="text-green-900 text-sm bg-white/80 rounded p-2 flex justify-between items-center border border-yellow-200">
                    <a
                      href={`https://explorer.celo.org/tx/${tx.hash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-green-600 underline"
                    >
                      {tx.hash.slice(0, 12)}... — {parseFloat(tx.value) / 1e18} CELO
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>
      <footer className="w-full text-center py-4 text-blue-900/80 font-medium text-sm">
        Powered by Celo Colombia &middot; Chainlink CCIP Demo
      </footer>
    </div>
  );
}
