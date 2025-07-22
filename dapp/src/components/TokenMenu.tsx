"use client";
import React from "react";
import styles from "./TokenMenu.module.css";
// import { Spinner } from "react-spinner-toolkit";
import { WrapperComponent } from "./WrapperComponent";
import { UnwrapperComponent } from "./UnwrapperComponent";

export const TokenMenu = () => {
  const [actionFlag, setActionFlag] = React.useState(1);
  return (
    <div className={styles.menuBox}>
      <div className={styles.toggleContainer}>
        <div className={styles.toggleSwitch}>
          <span className={styles.slider}>
            <span
              className={styles.sliderBg}
              style={{
                transform: actionFlag === 1 ? 'translateX(0%)' : 'translateX(100%)',
                background: actionFlag === 1 ? 'var(--primary)' : 'var(--secondary)'
              }}
            />
            <span
              className={actionFlag === 1 ? styles.toggleLabelLeft : styles.toggleLabelLeft + ' ' + styles.toggleLabelInactive}
              onClick={() => setActionFlag(1)}
              style={{ zIndex: 2 }}
            >
              Wrap
            </span>
            <span
              className={actionFlag === 2 ? styles.toggleLabelRight : styles.toggleLabelRight + ' ' + styles.toggleLabelInactive}
              onClick={() => setActionFlag(2)}
              style={{ zIndex: 2 }}
            >
              Unwrap
            </span>
          </span>
        </div>
      </div>
      <div className={styles.actionBox}>
        {actionFlag === 1 ? <WrapperComponent /> : <UnwrapperComponent />}
      </div>
    </div>
  );
};
