import React, { useState } from "react";
import { useGlobalBalances } from "@/context/BalanceContext";
import { FiRefreshCcw, FiChevronDown, FiChevronUp, FiPlus } from "react-icons/fi";
import { useWalletClient } from "wagmi";
import { switchChain } from "@wagmi/core";
import { config } from "@/config";
import { chainID } from "@/constants/chainID";
import { address } from "@/constants/address";
import toast from "react-hot-toast";
import styles from "./BalanceIndicators.module.css";

export const BalanceIndicators = () => {
  const { balances, isLoading, error, refresh } = useGlobalBalances();
  const [showDetails, setShowDetails] = useState(false);
  const { data: walletClient } = useWalletClient();

  const total = [balances.celo, balances.base, balances.arb].reduce((acc, v) => acc + parseFloat(v), 0);

  // Log balance changes
  console.log("=== BALANCE INDICATORS RENDER ===");
  console.log("Current balances:", balances);
  console.log("Total:", total.toFixed(2));
  console.log("Is loading:", isLoading);
  console.log("Error:", error);

  const handleRefresh = () => {
    console.log("Manual refresh triggered");
    refresh();
  };

  const addTokenToWallet = async (network: 'celo' | 'base' | 'arb') => {
    if (!walletClient) {
      toast.error("No wallet client detected", {
        position: "bottom-right",
        style: { background: "#333", color: "#fff" },
      });
      return;
    }

    try {
      // Switch to the appropriate network first
      const targetChainId = chainID.mainnet[network];
      await switchChain(config, { chainId: targetChainId });

      // Token configuration based on network
      const tokenConfig = {
        celo: {
          address: address.mainnet.cCOP as `0x${string}`,
          symbol: "cCOP",
          decimals: 18,
          image: "/cCOP_token.png",
        },
        base: {
          address: address.mainnet.wrapToken.base as `0x${string}`,
          symbol: "wcCOP",
          decimals: 18,
          image: "/cCOP_token.png",
        },
        arb: {
          address: address.mainnet.wrapToken.arb as `0x${string}`,
          symbol: "wcCOP",
          decimals: 18,
          image: "/cCOP_token.png",
        },
      };

      const success = await walletClient.watchAsset({
        type: "ERC20",
        options: tokenConfig[network],
      });

      if (success) {
        toast.success(`${tokenConfig[network].symbol} added to your wallet`, {
          position: "bottom-right",
          style: { background: "#333", color: "#fff" },
        });
      } else {
        toast.error("User rejected adding the token", {
          position: "bottom-right",
          style: { background: "#333", color: "#fff" },
        });
      }
    } catch (error) {
      console.error("Error adding token to wallet:", error);
      toast.error("Failed to add token to wallet", {
        position: "bottom-right",
        style: { background: "#333", color: "#fff" },
      });
    }
  };

  return (
    <div className={styles.balanceIndicators}>
      <div className={styles.balanceMenuBox}>
        <button
          className={showDetails ? styles.refreshBtnOpen : styles.refreshBtnClose}
          onClick={handleRefresh}
          title="Refresh balances"
        >
          <FiRefreshCcw />
        </button>
        <div
          className={showDetails ? styles.totalDataBoxOpen : styles.totalDataBoxClose}
          onClick={() => setShowDetails((v) => !v)}
        >
          <div className={styles.textTotalBox}>
            <p className={styles.defaultLabel}>
              {isLoading ? "Loading..." : error ? "Error loading balances" : `Total: ${total.toFixed(2)} cCOP`}
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
              {isLoading ? "Loading..." : parseFloat(balances.celo) > 0 ? parseFloat(balances.celo).toFixed(2) : "0.00"} cCOP
            </p>
            <button
              className={styles.addTokenBtn}
              onClick={() => addTokenToWallet('celo')}
              title="Add cCOP to wallet"
            >
              <FiPlus />
            </button>
          </div>
          <div className={`${styles.indicator} ${styles.base}`}>
            <img src="assets/Base.png" alt="wcCOP Token" />
            <p>
              Base:{" "}
              {isLoading ? "Loading..." : parseFloat(balances.base) > 0 ? parseFloat(balances.base).toFixed(2) : "0.00"} wcCOP
            </p>
            <button
              className={styles.addTokenBtn}
              onClick={() => addTokenToWallet('base')}
              title="Add wcCOP to wallet"
            >
              <FiPlus />
            </button>
          </div>
          <div className={`${styles.indicator} ${styles.arb}`}>
            <img src="assets/Arbitrum.png" alt="wcCOP Token"  />
            <p>
              Arbitrum:{" "}
              {isLoading ? "Loading..." : parseFloat(balances.arb) > 0 ? parseFloat(balances.arb).toFixed(2) : "0.00"} wcCOP
            </p>
            <button
              className={styles.addTokenBtn}
              onClick={() => addTokenToWallet('arb')}
              title="Add wcCOP to wallet"
            >
              <FiPlus />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
