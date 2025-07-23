"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAccount } from '@wagmi/core';
import { config } from '@/config';
import { TransactionHistory } from '@/components/TransactionHistory';
import { ConnectButton } from '@/components/ConnectButton';
import styles from '@/components/Dashboard.module.css';

export default function DashboardPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState<{ address?: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkConnection = () => {
      const currentAccount = getAccount(config);
      setIsConnected(!!currentAccount.address);
      setAccount(currentAccount);
    };

    checkConnection();
    
    // Check connection periodically
    const interval = setInterval(checkConnection, 1000);
    
    return () => clearInterval(interval);
  }, []);

  if (!isConnected) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>Conecta tu wallet para ver tu historial de transacciones</p>
        </div>
        <div className={styles.connectSection}>
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>
            Historial de wraps y unwraps para {account?.address?.slice(0, 6)}...{account?.address?.slice(-4)}
          </p>
        </div>
        <button 
          className={styles.backButton}
          onClick={() => router.push('/')}
        >
          ← Volver al Wrapper
        </button>
      </div>
      
      <TransactionHistory />
    </div>
  );
} 