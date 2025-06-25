"use client";
import React from "react";
import styles from "./TokenMenu.module.css";
import { Spinner } from "react-spinner-toolkit";

export const TokenMenu = () => {
  const [actionFlag, setActionFlag] = React.useState(true);
  const [differentAddressFlag, setDifferentAddressFlag] = React.useState(false);
  return (
    <div className={styles.menuBox}>
      <div className={styles.tabContainer}>
        <button
          className={
            actionFlag ? styles.tabButtonActive : styles.tabButtonInactive
          }
          onClick={() => setActionFlag(true)}
        >
          WRAP
        </button>
        <button
          className={
            !actionFlag ? styles.tabButtonActive : styles.tabButtonInactive
          }
          onClick={() => setActionFlag(false)}
        >
          UNWRAP
        </button>
      </div>
      <label className={styles.amountLabel}>Amount</label>
      <input
        className={styles.amountInput}
        placeholder={`Enter amount to ${actionFlag ? "wrap" : "unwrap"}`}
      />
      <select
        onChange={(e) =>
          setDifferentAddressFlag(e.target.value === "differentAddress")
        }
        className={styles.addressSelector}
      >
        <option value="sameAddress">
          Send ${actionFlag ? "wcCOP" : "cCOP"} tokens to the same address
        </option>
        <option value="differentAddress">
          Send ${actionFlag ? "wcCOP" : "cCOP"} tokens to a different address
        </option>
      </select>
      {differentAddressFlag && (
        <input className={styles.addressInput} placeholder="Enter address" />
      )}

      {actionFlag && (
        <div>
          <p className={styles.wrapToLabel}>
            Wrap on:{" "}
            <select className={styles.wrapToSelector}>
              <option value="base">Base</option>
            </select>
          </p>
        </div>
      )}
      <p className={styles.priceLabel}>
        Price for {actionFlag ? "wrapping" : "unwrapping"}: 0.01 ETH
      </p>
      {actionFlag ? (
        <>
          <button className={styles.actionButtonInactive}>
            Approve{" "}
            {<Spinner
              shape="fading"
              color="#ffe600"
              loading
              speed={1}
              size={20}
            />}
          </button>
          <button className={styles.actionButtonActive}>Wrap</button>
        </>
      ) : (
        <>
          <button className={styles.actionButton}>Unwrap</button>
        </>
      )}
    </div>
  );
};
