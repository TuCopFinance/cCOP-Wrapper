"use client";
import React, { useState, useEffect } from "react";
import { getAccount } from "@wagmi/core";
import { config } from "@/config";
import {
  getAllRealTransactions,
  RealTransaction,
} from "@/utils/transaction-service";
import styles from "./TransactionHistory.module.css";

// Using RealTransaction interface from transaction-service

export const TransactionHistory = () => {
  const [transactions, setTransactions] = useState<RealTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const account = getAccount(config);

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
      wrapTotal: wrapTotal.toFixed(2),
      unwrapTotal: unwrapTotal.toFixed(2),
      netWrapped: netWrapped.toFixed(2),
      wrapCount: transactions.filter((tx) => tx.type === "wrap").length,
      unwrapCount: transactions.filter((tx) => tx.type === "unwrap").length,
    };
  };

  // Fetch real transactions from blockchain APIs
  useEffect(() => {
    const fetchRealTransactions = async () => {
      if (!account.address) {
        setTransactions([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const realTransactions = await getAllRealTransactions(account.address);
        setTransactions(realTransactions);
      } catch (error) {
        console.error("Error fetching real transactions:", error);
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
            <div className={styles.summaryAmount}>{totals.wrapTotal} cCOP</div>
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
              {totals.unwrapTotal} cCOP
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
            <div className={styles.summaryAmount}>{totals.netWrapped} cCOP</div>
            <div className={styles.summaryCount}>
              {totals.wrapCount + totals.unwrapCount} transacciones
            </div>
          </div>
        </div>
      </div>

      {/* Transactions by Type */}
      <div className={styles.transactionsContainer}>
        {transactions.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📋</div>
            <h3>No hay transacciones</h3>
            <p>No se encontraron transacciones</p>
          </div>
        ) : (
          <>
            {/* Wrap Transactions */}
            {transactions.filter((tx) => tx.type === "wrap").length > 0 && (
              <div className={styles.transactionGroup}>
                <h3 className={styles.groupTitle}>
                  <span className={styles.groupIcon}>📦</span>
                  Wraps - CELO → Base/Arbitrum/Optimism/Avalanche ({totals.wrapCount})
                </h3>
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
                            {tx.amount} cCOP → wcCOP
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

            {/* Unwrap Transactions - Grouped by Chain */}
            {['Base', 'Arbitrum', 'Optimism', 'Avalanche'].map((chain) => {
              const chainUnwraps = transactions.filter((tx) => tx.type === "unwrap" && tx.chain === chain);
              const chainTotal = chainUnwraps.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
              
              if (chainUnwraps.length === 0) return null;
              
              return (
                <div key={chain} className={styles.transactionGroup}>
                  <h3 className={styles.groupTitle}>
                    <span className={styles.groupIcon}>📤</span>
                    Unwraps - {chain} → CELO ({chainUnwraps.length} transacciones, {chainTotal.toFixed(2)} cCOP)
                  </h3>
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
                            {tx.amount} wcCOP → cCOP
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
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};
