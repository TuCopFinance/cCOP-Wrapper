import React from "react";
import styles from "./Footer.module.css";

export const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.footerText}>
          <span>Developed by </span>
          <a 
            href="https://github.com/TuCopFinance" 
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.link}
          >
            TuCOP Finance
          </a>
          <span> and </span>
          <a 
            href="https://github.com/jistro" 
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.link}
          >
            Jistro
          </a>
        </div>
      </div>
    </footer>
  );
}; 