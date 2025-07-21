"use client";
import React from "react";
import styles from "./TokenMenu.module.css";
// import { Spinner } from "react-spinner-toolkit";
import { WrapperComponent } from "./WrapperComponent";
import { UnwrapperComponent } from "./UnwrapperComponent";
import { Dashboard } from "./Dashboard";

export const TokenMenu = () => {
  const [actionFlag, setActionFlag] = React.useState(1);
  return (
    <div className={styles.menuBox}>
      <div className={styles.tabContainer}>
        <button
          className={
            actionFlag === 1 ? styles.tabButtonActive : styles.tabButtonInactive
          }
          onClick={() => setActionFlag(1)}
        >
          Wrap
        </button>
        <button
          className={
            actionFlag === 2 ? styles.tabButtonActive : styles.tabButtonInactive
          }
          onClick={() => setActionFlag(2)}
        >
          Unwrap
        </button>
        <button
          className={
            actionFlag === 3 ? styles.tabButtonActive : styles.tabButtonInactive
          }
          onClick={() => setActionFlag(3)}
        >
          Dashboard
        </button>
      </div>
      <div className={styles.actionBox}>
        {actionFlag === 1 ? <WrapperComponent /> : actionFlag === 2 ? <UnwrapperComponent /> : <Dashboard />}
      </div>
    </div>
  );
};
