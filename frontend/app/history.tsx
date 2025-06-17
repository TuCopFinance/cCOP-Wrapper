'use client';
import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

export default function HistoryExplorer() {
  const { address } = useAccount();
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!address) return;

    const fetchTxs = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://api.basescan.org/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${process.env.NEXT_PUBLIC_BASESCAN_API_KEY}`
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
    <div>
      <h2>Historial on-chain (Base)</h2>
      {loading && <p>Cargando...</p>}
      <ul className="space-y-2">
        {txs.map((tx, i) => (
          <li key={i}>
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
  );
}
