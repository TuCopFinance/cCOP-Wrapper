'use client';
import { useState } from 'react';
import { ethers } from 'ethers';

const VAULT_ABI = [
  'function deposit(uint64 dstChainSelector, address receiver, uint256 amount) external',
];
const W_COP_ABI = ['function approve(address spender, uint256 amount) external returns (bool)'];
const BURNER_ABI = [
  'function burnAndNotify(uint64 dstChainSelector, address receiver, uint256 amount) external',
];

export function useWrapCCOP(provider, signer) {
  const [status, setStatus] = useState('');

  const depositToBase = async (ccopAddr, vaultAddr, dstSelector, receiver, amount) => {
    try {
      setStatus('Aprobando cCOP...');
      const ccop = new ethers.Contract(ccopAddr, W_COP_ABI, signer);
      await ccop.approve(vaultAddr, amount);

      setStatus('Enviando depósito a Celo...');
      const vault = new ethers.Contract(vaultAddr, VAULT_ABI, signer);
      const tx = await vault.deposit(dstSelector, receiver, amount);
      await tx.wait();

      setStatus('✅ Depósito enviado. Espera wCOP en Base...');
    } catch (err) {
      console.error(err);
      setStatus('❌ Error en depósito: ' + err.message);
    }
  };

  const burnAndRedeem = async (burnerAddr, dstSelector, receiver, amount) => {
    try {
      setStatus('Ejecutando burn...');
      const burner = new ethers.Contract(burnerAddr, BURNER_ABI, signer);
      const tx = await burner.burnAndNotify(dstSelector, receiver, amount);
      await tx.wait();

      setStatus('✅ wCOP quemado. Recibirás cCOP en Celo pronto.');
    } catch (err) {
      console.error(err);
      setStatus('❌ Error en burn: ' + err.message);
    }
  };

  return { depositToBase, burnAndRedeem, status };
}
