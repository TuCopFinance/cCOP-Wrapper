import React, { useState } from "react";
import { useTokenBalances } from "@/hooks/useTokenBalances";
import { FiRefreshCcw, FiChevronDown, FiChevronUp } from "react-icons/fi";
<<<<<<< Updated upstream
import styles from "./BalanceIndicators.module.css";
=======
import styles from "./BalanceIndicatorsStyles.module.css";
import Image from "next/image";
>>>>>>> Stashed changes

export const BalanceIndicators = () => {
  const { celo, base, arb, refresh } = useTokenBalances();
  const [showDetails, setShowDetails] = useState(false);

  const total = [celo, base, arb].reduce((acc, v) => acc + parseFloat(v), 0);

  return (
    <div className={styles.balanceIndicators}>
      <div className={styles.balanceMenuBox}>
        <button
          className={showDetails ? styles.refreshBtnOpen : styles.refreshBtnClose}
          onClick={refresh}
          title="Refresh balances"
        >
          <FiRefreshCcw />
        </button>
        <div
          className={showDetails ? styles.totalDataBoxOpen : styles.totalDataBoxClose}
          onClick={() => setShowDetails((v) => !v)}
          style={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <div className={styles.textTotalBox}>
            <p className={styles.defaultLabel}>
              Total: {total.toFixed(2)} cCOP
            </p>{" "}
          </div>

          {showDetails ? <FiChevronUp /> : <FiChevronDown />}
        </div>
      </div>

      {showDetails && (
        <div className={styles.listOfAssets}>
          <div className={`${styles.indicator} ${styles.celo}`}>
            <span className={styles.label}>Celo:</span>
            <span className={styles.value}>
              {parseFloat(celo).toFixed(2)} cCOP
            </p>
          </div>
          <div className={`${styles.indicator} ${styles.base}`}>
            <span className={styles.label}>Base:</span>
            <span className={styles.value}>
              {parseFloat(base).toFixed(2)} wcCOP
            </p>
          </div>
          <div className={`${styles.indicator} ${styles.arb}`}>
            <span className={styles.label}>Arbitrum:</span>
            <span className={styles.value}>
              {parseFloat(arb).toFixed(2)} wcCOP
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
