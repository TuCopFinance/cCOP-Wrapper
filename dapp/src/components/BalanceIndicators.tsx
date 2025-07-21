import React from "react";
import { useTokenBalances } from "@/hooks/useTokenBalances";
import { FiRefreshCcw } from "react-icons/fi";
import styles from "./BalanceIndicators.module.css";

export const BalanceIndicators = () => {
  const { celo, base, arb, refresh } = useTokenBalances();
  return (
    <div className={styles.indicatorRow}>
      <div className={styles.indicator}>
        <span className={styles.label}>Celo:</span>
        <span className={styles.value}>{parseFloat(celo).toFixed(2)} cCOP</span>
      </div>
      <div className={styles.indicator}>
        <span className={styles.label}>Base:</span>
        <span className={styles.value}>{parseFloat(base).toFixed(2)} wcCOP</span>
      </div>
      <div className={styles.indicator}>
        <span className={styles.label}>Arbitrum:</span>
        <span className={styles.value}>{parseFloat(arb).toFixed(2)} wcCOP</span>
      </div>
      <button className={styles.refreshBtn} onClick={refresh} title="Refresh balances">
        <FiRefreshCcw />
      </button>
    </div>
  );
}; 