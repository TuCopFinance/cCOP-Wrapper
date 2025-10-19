"use client";
import React, { useState, useEffect } from "react";
import { getAccount } from "@wagmi/core";
import { config } from "@/config";
import {
  getAllRealTransactions,
  RealTransaction,
} from "@/utils/transaction-service";
import { formatTokenAmount } from "@/utils/number-format";
import styles from "./TransactionHistory.module.css";
import Image from "next/image";

// Using RealTransaction interface from transaction-service

export const TransactionHistory = () => {
  const [transactions, setTransactions] = useState<RealTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    wraps: false,
    unwraps: false,
    'unwrap-Base': false,
    'unwrap-Arbitrum': false,
    'unwrap-Optimism': false,
    'unwrap-Avalanche': false
  });
  const account = getAccount(config);

  // Toggle collapse state for a section
  const toggleSection = (sectionKey: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  // Helper function to get chain logo
  const getChainLogo = (chain: string) => {
    const chainLogos = {
      'Base': '/assets/Base.png',
      'Arbitrum': '/assets/Arbitrum.png', 
      'Optimism': '/assets/Optimism.svg',
      'Avalanche': '/assets/Avalanche.svg'
    };
    return chainLogos[chain as keyof typeof chainLogos] || '';
  };

  // Calculate totals
  const calculateTotals = () => {
    // Wraps: cCOP → wcCOP (CELO to Base/Arbitrum) 
    // Amount represents the exact cCOP tokens wrapped (excluding gas fees)
    const wrapTotal = transactions
      .filter((tx) => tx.type === "wrap")
      .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

    // Unwraps: wcCOP → cCOP (Base/Arbitrum to CELO)
    // Amount represents wcCOP tokens burned, which equals cCOP tokens unlocked (1:1 ratio)
    const unwrapTotal = transactions
      .filter((tx) => tx.type === "unwrap")
      .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

    // Net position: total wrapped - total unwrapped (how many cCOP are currently wrapped as wcCOP)
    const netWrapped = wrapTotal - unwrapTotal;

    return {
      wrapTotal: formatTokenAmount(wrapTotal, 'cCOP', 0),
      unwrapTotal: formatTokenAmount(unwrapTotal, 'wcCOP', 0),
      netWrapped: formatTokenAmount(netWrapped, 'wcCOP', 0),
      wrapCount: transactions.filter((tx) => tx.type === "wrap").length,
      unwrapCount: transactions.filter((tx) => tx.type === "unwrap").length,
    };
  };

  // Fetch real transactions from blockchain APIs
  useEffect(() => {
    const fetchRealTransactions = async () => {
      console.log('🔍 Dashboard - Account info:', {
        address: account.address,
        connector: account.connector?.name,
        chainId: account.chainId,
        fullAccount: account
      });

      if (!account.address) {
        console.log('❌ No account address found');
        setTransactions([]);
        setLoading(false);
        return;
      }

      console.log('✅ Fetching transactions for address:', account.address);
      setLoading(true);
      try {
        const realTransactions = await getAllRealTransactions(account.address);
        console.log('📊 Transactions fetched:', realTransactions.length, 'transactions');
        setTransactions(realTransactions);
      } catch (error) {
        console.error("❌ Error fetching real transactions:", error);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRealTransactions();
  }, [account.address]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Cargando historial de transacciones...</p>
      </div>
    );
  }

  const totals = calculateTotals();

  return (
    <div className={styles.container}>
      <h2>Historial de Transacciones</h2>
      <p>Wallet: {account.address}</p>

      {/* Summary Section */}
      <div className={styles.summaryContainer}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryHeader}>
            <span className={styles.summaryIcon}>📦</span>
            <span className={styles.summaryTitle}>Total Envuelto</span>
          </div>
          <div className={styles.summaryContent}>
            <div className={styles.summaryAmount}>{totals.wrapTotal}</div>
            <div className={styles.summaryCount}>
              {totals.wrapCount} transacciones
            </div>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryHeader}>
            <span className={styles.summaryIcon}>📤</span>
            <span className={styles.summaryTitle}>Total Desenvuelto</span>
          </div>
          <div className={styles.summaryContent}>
            <div className={styles.summaryAmount}>
              {totals.unwrapTotal}
            </div>
            <div className={styles.summaryCount}>
              {totals.unwrapCount} transacciones
            </div>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryHeader}>
            <span className={styles.summaryIcon}>📊</span>
            <span className={styles.summaryTitle}>Neto Envuelto</span>
          </div>
          <div className={styles.summaryContent}>
            <div className={styles.summaryAmount}>{totals.netWrapped}</div>
            <div className={styles.summaryCount}>
              {totals.wrapCount + totals.unwrapCount} transacciones
            </div>
          </div>
        </div>
      </div>

      {/* Transactions by Type - Two Column Layout */}
      <div className={styles.transactionsContainer}>
        {transactions.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📋</div>
            <h3>No hay transacciones</h3>
            <p>No se encontraron transacciones</p>
          </div>
        ) : (
          <div className={styles.twoColumnLayout}>
            {/* Left Column - Wrap Transactions */}
            <div className={styles.leftColumn}>
            {transactions.filter((tx) => tx.type === "wrap").length > 0 && (
              <div className={styles.transactionGroup}>
                <h3 
                  className={styles.groupTitle} 
                  onClick={() => toggleSection('wraps')}
                  style={{ cursor: 'pointer' }}
                >
                  <Image 
                    src="/cCOP_token.png" 
                    alt="Celo" 
                    width={20} 
                    height={20}
                    className={styles.chainLogo}
                  />
                  Wrap ({totals.wrapCount} transacciones, {totals.wrapTotal})
                  <span className={`${styles.collapseArrow} ${collapsedSections.wraps ? styles.collapsed : ''}`}>
                    ▼
                  </span>
                </h3>
                {!collapsedSections.wraps && (
                  <div className={styles.transactionList}>
                    {transactions
                      .filter((tx) => tx.type === "wrap")
                      .map((tx) => (
                        <div key={tx.id} className={styles.transactionCard}>
                          <div className={styles.transactionHeader}>
                            <div className={styles.transactionType}>
                              <div
                                className={`${styles.typeBadge} ${styles[tx.type]}`}
                              >
                                📦 Wrap
                              </div>
                              <span>{tx.chain}</span>
                            </div>
                            <div className={styles.transactionStatus}>
                              <span
                                className={styles.statusBadge}
                                style={{
                                  backgroundColor:
                                    tx.status === "completed"
                                      ? "#10b981"
                                      : tx.status === "pending"
                                      ? "#f59e0b"
                                      : "#ef4444",
                                }}
                              >
                                {tx.status === "completed"
                                  ? "Completado"
                                  : tx.status === "pending"
                                  ? "Pendiente"
                                  : "Fallido"}
                              </span>
                            </div>
                          </div>

                          <div className={styles.transactionDetails}>
                            <div className={styles.amountSection}>
                              <span className={styles.amountLabel}>Cantidad:</span>
                              <span className={styles.amount}>
                                {formatTokenAmount(parseFloat(tx.amount), 'cCOP', 0)} → wcCOP
                              </span>
                            </div>

                            <div className={styles.timeSection}>
                              <span className={styles.timeLabel}>Fecha:</span>
                              <span className={styles.time}>
                                {new Date(tx.timestamp).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
            </div>
            
            {/* Right Column - Unwrap Transactions */}
            <div className={styles.rightColumn}>
            {/* Unwrap Transactions - Main Section */}
            {transactions.filter((tx) => tx.type === "unwrap").length > 0 && (
              <div className={styles.transactionGroup}>
                <h3 
                  className={styles.groupTitle} 
                  onClick={() => toggleSection('unwraps')}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={styles.chainLogosGroup}>
                    <Image src="/assets/Base.png" alt="Base" width={16} height={16} className={styles.chainLogoSmall} />
                    <Image src="/assets/Arbitrum.png" alt="Arbitrum" width={16} height={16} className={styles.chainLogoSmall} />
                    <Image src="/assets/Optimism.svg" alt="Optimism" width={16} height={16} className={styles.chainLogoSmall} />
                    <Image src="/assets/Avalanche.svg" alt="Avalanche" width={16} height={16} className={styles.chainLogoSmall} />
                  </div>
                  Unwrap ({totals.unwrapCount} transacciones, {totals.unwrapTotal})
                  <span className={`${styles.collapseArrow} ${collapsedSections.unwraps ? styles.collapsed : ''}`}>
                    ▼
                  </span>
                </h3>
                {!collapsedSections.unwraps && (
                  <div className={styles.transactionList}>
                    {/* Unwrap Transactions - Grouped by Chain */}
                    {['Base', 'Arbitrum', 'Optimism', 'Avalanche'].map((chain) => {
                      const chainUnwraps = transactions.filter((tx) => tx.type === "unwrap" && tx.chain === chain);
                      const chainTotal = chainUnwraps.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
                      
                      if (chainUnwraps.length === 0) return null;
                      
                      return (
                        <div key={chain} className={`${styles.transactionGroup} ${styles.nestedGroup} ${styles[`nestedGroup${chain}`]}`}>
                          <h4 
                            className={`${styles.groupTitle} ${styles.nestedTitle}`}
                            onClick={() => toggleSection(`unwrap-${chain}`)}
                            style={{ cursor: 'pointer' }}
                          >
                            <Image 
                              src={getChainLogo(chain)} 
                              alt={chain} 
                              width={18} 
                              height={18}
                              className={styles.chainLogo}
                            />
                            {chain} ({chainUnwraps.length} transacciones, {formatTokenAmount(chainTotal, 'wcCOP', 0)})
                            <span className={`${styles.collapseArrow} ${collapsedSections[`unwrap-${chain}`] ? styles.collapsed : ''}`}>
                              ▼
                            </span>
                          </h4>
                          {!collapsedSections[`unwrap-${chain}`] && (
                            <div className={styles.transactionList}>
                              {chainUnwraps.map((tx) => (
                                <div key={tx.id} className={styles.transactionCard}>
                                  <div className={styles.transactionHeader}>
                                    <div className={styles.transactionType}>
                                      <div
                                        className={`${styles.typeBadge} ${styles[tx.type]}`}
                                      >
                                        📤 Unwrap
                                      </div>
                                      <span>{tx.chain}</span>
                                    </div>
                                    <div className={styles.transactionStatus}>
                                      <span
                                        className={styles.statusBadge}
                                        style={{
                                          backgroundColor:
                                            tx.status === "completed"
                                              ? "#10b981"
                                              : tx.status === "pending"
                                              ? "#f59e0b"
                                              : "#ef4444",
                                        }}
                                      >
                                        {tx.status === "completed"
                                          ? "Completado"
                                          : tx.status === "pending"
                                          ? "Pendiente"
                                          : "Fallido"}
                                      </span>
                                    </div>
                                  </div>

                                  <div className={styles.transactionDetails}>
                                    <div className={styles.amountSection}>
                                      <span className={styles.amountLabel}>Cantidad:</span>
                                      <span className={styles.amount}>
                                        {formatTokenAmount(parseFloat(tx.amount), 'wcCOP', 0)} → cCOP
                                      </span>
                                    </div>

                                    <div className={styles.timeSection}>
                                      <span className={styles.timeLabel}>Fecha:</span>
                                      <span className={styles.time}>
                                        {new Date(tx.timestamp).toLocaleString()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
