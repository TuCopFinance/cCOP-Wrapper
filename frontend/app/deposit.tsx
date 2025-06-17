'use client';
import { useState, useEffect } from 'react';
import { useAccount, useSigner } from 'wagmi';
import { useWrapCCOP } from './hooks';

export default function DepositPage() {
  const { data: signer } = useSigner();
  const { address } = useAccount();
  const [amount, setAmount] = useState('100');
  const { depositToBase, status } = useWrapCCOP();

  const handleDeposit = () => {
    if (!signer || !address) return;
    depositToBase(
      process.env.NEXT_PUBLIC_CCOP_ADDRESS,
      process.env.NEXT_PUBLIC_VAULT_ADDRESS,
      8453, // Base Mainnet Chain Selector
      process.env.NEXT_PUBLIC_RECEIVER_BASE,
      ethers.utils.parseUnits(amount, 18)
    );
  };

  return (
    <div>
      <h2>Enviar cCOP desde Celo a Base</h2>
      <input value={amount} onChange={(e) => setAmount(e.target.value)} />
      <button onClick={handleDeposit}>Depositar</button>
      <p>{status}</p>
    </div>
  );
}
