"use client";
import React from "react";
import styles from "./WrapperComponent.module.css";
import { Spinner } from "react-spinner-toolkit";

export const WrapperComponent = () => {
  const [differentAddressFlag, setDifferentAddressFlag] = React.useState(false);
  return (
    <>
      <label className={styles.amountLabel}>Amount</label>
      <input
        className={styles.amountInput}
        placeholder={`Enter amount of cCOP tokens to wrap`}
      />
      <div className={styles.addressSelector}>
        Sent the cCOP tokens to {" "}
      <select
        onChange={(e) =>
          setDifferentAddressFlag(e.target.value === "differentAddress")
        }
        
      >
        <option value="sameAddress">
          same address
        </option>
        <option value="differentAddress">
          a different address
        </option>
      </select>
      </div>
      {differentAddressFlag && (
        <input className={styles.addressInput} placeholder="Enter address" />
      )}
      <div>
        <p className={styles.wrapToLabel}>
          Wrap on:{" "}
          <select className={styles.wrapToSelector}>
            <option value="base">Base</option>
          </select>
        </p>
      </div>
      <p className={styles.priceLabel}>Price for wrapping: 0.01 ETH</p>

      <button className={styles.actionButtonInactive}>
      
        {<Spinner shape="fading" color="#ffe600" loading speed={1} size={20} />}
      </button>
      <button className={styles.actionButtonActive}>Wrap</button>
    </>
  );
};
