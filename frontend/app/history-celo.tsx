'use client';
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
    <div>
      <h2>Historial on-chain (Celo)</h2>
      {loading && <p>Cargando...</p>}
      <ul className="space-y-2">
        {txs.map((tx, i) => (
          <li key={i}>
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
  );
}
