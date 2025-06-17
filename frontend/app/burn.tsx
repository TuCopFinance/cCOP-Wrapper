'use client';
import { useState } from 'react';
import { useAccount, useSigner } from 'wagmi';
import { useWrapCCOP } from './hooks';
import { ethers } from 'ethers';

export default function BurnPage() {
  const { data: signer } = useSigner();
  const { address } = useAccount();
  const [amount, setAmount] = useState('100');
  const { burnAndRedeem, status } = useWrapCCOP();

  const handleBurn = () => {
    if (!signer || !address) return;
    burnAndRedeem(
      process.env.NEXT_PUBLIC_CELO_SELECTOR,
      process.env.NEXT_PUBLIC_VAULT_ADDRESS,
      ethers.utils.parseUnits(amount, 18)
    );
  };

  return (
    <div>
      <h2>Redimir wCOP (Base → Celo)</h2>
      <input value={amount} onChange={(e) => setAmount(e.target.value)} />
      <button onClick={handleBurn}>Redimir</button>
      <p>{status}</p>
    </div>
  );
}
