import React, { useState } from "react";
import { useTokenBalances } from "@/hooks/useTokenBalances";
import { FiRefreshCcw, FiChevronDown, FiChevronUp } from "react-icons/fi";
import styles from "./BalanceIndicators.module.css";

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
            <img src="assets/Celo.png" alt="cCOP Token" />
            <p>
              Celo:{" "}
              {parseFloat(celo).toFixed(2)} cCOP
            </p>
          </div>
          <div className={`${styles.indicator} ${styles.base}`}>
            <img src="assets/Base.png" alt="wcCOP Token" />
            <p>
              Base:{" "}
              {parseFloat(base).toFixed(2)} wcCOP
            </p>
          </div>
          <div className={`${styles.indicator} ${styles.arb}`}>
            <img src="assets/Arbitrum.png" alt="wcCOP Token"  />
            <p>
              Arbitrum:{" "}
              {parseFloat(arb).toFixed(2)} wcCOP
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
