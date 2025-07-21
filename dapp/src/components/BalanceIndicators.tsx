import React, { useState } from "react";
import { useTokenBalances } from "@/hooks/useTokenBalances";
import { FiRefreshCcw, FiChevronDown, FiChevronUp } from "react-icons/fi";
import styles from "./BalanceIndicatorsStyles.module.css";

export const BalanceIndicators = () => {
  const { celo, base, arb, refresh } = useTokenBalances();
  const [showDetails, setShowDetails] = useState(false);

  // Sumar los saldos (asumiendo que todos son cCOP, para el consolidado)
  const total = [celo, base, arb].reduce((acc, v) => acc + parseFloat(v), 0);

  return (
    <div className={styles.indicatorRow}>
      <div
        className={styles.consolidated}
        onClick={() => setShowDetails((v) => !v)}
        style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
        title="Ver detalle de saldos"
      >
        <span className={styles.label}>Total:</span>
        <span className={styles.value}>{total.toFixed(2)} cCOP</span>
        {showDetails ? <FiChevronUp /> : <FiChevronDown />}
      </div>
      {showDetails && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, width: "100%" }}>
          <div className={`${styles.indicator} ${styles.celo}`}>
            <span className={styles.label}>Celo:</span>
            <span className={styles.value}>{parseFloat(celo).toFixed(2)} cCOP</span>
          </div>
          <div className={`${styles.indicator} ${styles.base}`}>
            <span className={styles.label}>Base:</span>
            <span className={styles.value}>{parseFloat(base).toFixed(2)} wcCOP</span>
          </div>
          <div className={`${styles.indicator} ${styles.arb}`}>
            <span className={styles.label}>Arbitrum:</span>
            <span className={styles.value}>{parseFloat(arb).toFixed(2)} wcCOP</span>
          </div>
        </div>
      )}
      <button className={styles.refreshBtn} onClick={refresh} title="Refresh balances">
        <FiRefreshCcw />
      </button>
    </div>
  );
}; 