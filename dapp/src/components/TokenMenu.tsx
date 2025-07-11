"use client";
import React from "react";
import styles from "./TokenMenu.module.css";
import { Spinner } from "react-spinner-toolkit";
import { WrapperComponent } from "./WrapperComponent";
import { UnwrapperComponent } from "./UnwrapperComponent";

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
      <div className={styles.actionBox}>
        {actionFlag ? <WrapperComponent /> : <UnwrapperComponent />}
      </div>
    </div>
  );
};
