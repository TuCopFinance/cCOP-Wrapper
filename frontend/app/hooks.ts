'use client';
import { useCallback, useState } from 'react';
import { useWalletClient, usePublicClient } from 'wagmi';
import { parseEther } from 'viem';
import { CCIPWrapper } from './contracts/CCIPWrapper';

const VAULT_ABI = [
  'function deposit(uint64 dstChainSelector, address receiver, uint256 amount) external',
];
const W_COP_ABI = ['function approve(address spender, uint256 amount) external returns (bool)'];
const BURNER_ABI = [
  'function burnAndNotify(uint64 dstChainSelector, address receiver, uint256 amount) external',
];

export function useWrapCCOP() {
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const [status, setStatus] = useState('');

  const burnAndRedeem = useCallback(
    async (selector: string, vault: string, amount: bigint) => {
      if (!walletClient || !publicClient) {
        setStatus('Wallet not connected');
        return;
      }

      try {
        setStatus('Iniciando transacción...');
        
        const wrapper = new CCIPWrapper(
          process.env.NEXT_PUBLIC_WRAPPER_ADDRESS as `0x${string}`,
          walletClient,
          publicClient
        );

        const tx = await wrapper.burnAndRedeem(selector, vault, amount);
        setStatus('Transacción enviada: ' + tx.hash);
        
        const receipt = await tx.wait();
        setStatus('Transacción completada: ' + receipt.transactionHash);
      } catch (error) {
        console.error('Error:', error);
        setStatus('Error: ' + (error as Error).message);
      }
    },
    [walletClient, publicClient]
  );

  // Nueva función para depositar cCOP de Celo a Base
  const depositToBase = useCallback(
    async (
      ccopAddr: string,
      vaultAddr: string,
      dstSelector: bigint,
      receiver: string,
      amount: bigint
    ) => {
      if (!walletClient || !publicClient) {
        setStatus('Wallet not connected');
        return;
      }
    try {
      setStatus('Aprobando cCOP...');
        // Aprobar el vault para gastar cCOP
        const approveHash = await walletClient.writeContract({
          address: ccopAddr as `0x${string}`,
          abi: W_COP_ABI,
          functionName: 'approve',
          args: [vaultAddr, amount],
          account: walletClient.account,
          chain: undefined,
        });
        await publicClient.waitForTransactionReceipt({ hash: approveHash });

      setStatus('Enviando depósito a Celo...');
        // Llamar a deposit en el vault
        const depositHash = await walletClient.writeContract({
          address: vaultAddr as `0x${string}`,
          abi: VAULT_ABI,
          functionName: 'deposit',
          args: [dstSelector, receiver, amount],
          account: walletClient.account,
          chain: undefined,
        });
        await publicClient.waitForTransactionReceipt({ hash: depositHash });

      setStatus('✅ Depósito enviado. Espera wCOP en Base...');
    } catch (err) {
      console.error(err);
        setStatus('❌ Error en depósito: ' + (err as Error).message);
      }
    },
    [walletClient, publicClient]
  );

  return { burnAndRedeem, depositToBase, status };
}
