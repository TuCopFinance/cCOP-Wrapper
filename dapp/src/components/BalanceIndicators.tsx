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
    <>
      <div className={styles.balanceMenuBox}>
        <button
          className={styles.refreshBtn}
          onClick={refresh}
          title="Refresh balances"
        >
          <FiRefreshCcw />
        </button>
        <div
          className={styles.totalDataBox}
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
            <span className={styles.logoCircle}>
              <Image src="/assets/Celo.png" alt="Celo" width={20} height={20} style={{ objectFit: 'contain' }} />
            </span>
            <span className={styles.label}>Celo:</span>
            <span className={styles.value}>
              {parseFloat(celo).toFixed(2)} cCOP
            </span>
          </div>
          <div className={`${styles.indicator} ${styles.base}`}>
            <span className={styles.logoCircle}>
              <Image src="/assets/Base.jpeg" alt="Base" width={20} height={20} style={{ objectFit: 'contain' }} />
            </span>
            <span className={styles.label}>Base:</span>
            <span className={styles.value}>
              {parseFloat(base).toFixed(2)} wcCOP
            </span>
          </div>
          <div className={`${styles.indicator} ${styles.arb}`}>
            <span className={styles.logoCircle}>
              <Image src="/assets/Arbitrum.png" alt="Arbitrum" width={20} height={20} style={{ objectFit: 'contain' }} />
            </span>
            <span className={styles.label}>Arbitrum:</span>
            <span className={styles.value}>
              {parseFloat(arb).toFixed(2)} wcCOP
            </span>
          </div>
        </div>
      )}
    </>
  );
};
