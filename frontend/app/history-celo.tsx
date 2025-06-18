'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

export default function CeloHistory() {
  const { address } = useAccount();
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!address) return;

    const fetchTxs = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://explorer.celo.org/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc`
        );
        const data = await res.json();
        if (data.result) setTxs(data.result.slice(0, 15));
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };

    fetchTxs();
  }, [address]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-900 via-blue-400 to-yellow-300 flex flex-col">
      <nav className="w-full bg-white/80 backdrop-blur-md shadow-md py-4 px-8 flex justify-between items-center fixed top-0 left-0 z-10">
        <span className="text-2xl font-extrabold text-blue-900 tracking-tight">Wrapped cCOP</span>
        <div className="flex gap-6">
          <Link href="/dashboard" className="text-blue-700 hover:text-yellow-500 font-medium transition">Dashboard</Link>
          <Link href="/deposit" className="text-blue-700 hover:text-yellow-500 font-medium transition">Deposit</Link>
          <Link href="/burn" className="text-blue-700 hover:text-yellow-500 font-medium transition">Burn</Link>
          <Link href="/history" className="text-blue-700 hover:text-yellow-500 font-medium transition">History</Link>
        </div>
      </nav>
      <main className="flex-1 flex items-center justify-center pt-32 pb-12">
        <div className="w-full max-w-lg bg-white/90 rounded-3xl shadow-2xl p-10 flex flex-col items-center border border-blue-100">
          <h1 className="text-3xl font-bold text-blue-900 mb-4 text-center drop-shadow">Historial on-chain (Celo)</h1>
          {loading && <p className="text-green-700">Cargando...</p>}
          <ul className="space-y-2 w-full">
            {txs.length === 0 && !loading && <li className="text-gray-500">No hay transacciones recientes.</li>}
            {txs.map((tx, i) => (
              <li key={i} className="text-green-900 text-sm bg-green-50 rounded p-2 flex justify-between items-center">
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
      </main>
      <footer className="w-full text-center py-4 text-blue-900/80 font-medium text-sm">
        Powered by Celo Colombia &middot; Chainlink CCIP Demo
      </footer>
    </div>
  );
}
