import React, { useState } from "react";
import { useGlobalBalances } from "../context/BalanceContext";
import { formatTokenAmount } from "@/utils/number-format";
import {
  FiRefreshCcw,
  FiChevronDown,
  FiChevronUp,
  FiPlus,
} from "react-icons/fi";
import { useWalletClient } from "wagmi";
import Image from "next/image";
import { switchChain } from "@wagmi/core";
import { config } from "@/config";
import { chainID } from "@/constants/chainID";
import { address } from "@/constants/address";
import toast from "react-hot-toast";
import styles from "./BalanceIndicators.module.css";

export const BalanceIndicatorsWrap = () => {
  const { balances, isLoading, error, refresh } = useGlobalBalances();
  const [showDetails, setShowDetails] = useState(false);
  const { data: walletClient } = useWalletClient();

  const celoBalance = parseFloat(balances.celo);

  console.log("=== BALANCE INDICATORS WRAP RENDER ===");
  console.log("Celo balance:", balances.celo);
  console.log("Formatted balance:", formatTokenAmount(celoBalance, "cCOP"));

  const handleRefresh = () => {
    console.log("Manual refresh triggered");
    refresh();
  };

  const addTokenToWallet = async () => {
    if (!walletClient) {
      toast.error("No wallet client detected", {
        position: "bottom-right",
        style: { background: "#333", color: "#fff" },
      });
      return;
    }

    try {
      await switchChain(config, { chainId: chainID.mainnet.celo });

      const tokenConfig = {
        address: address.mainnet.cCOP as `0x${string}`,
        symbol: "cCOP",
        decimals: 18,
        image: "/cCOP_token.png",
      };

      const success = await walletClient.watchAsset({
        type: "ERC20",
        options: tokenConfig,
      });

      if (success) {
        toast.success("cCOP added to your wallet", {
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
          className={
            showDetails ? styles.refreshBtnOpen : styles.refreshBtnClose
          }
          onClick={handleRefresh}
          title="Refresh balances"
        >
          <FiRefreshCcw />
        </button>
        <div
          className={
            showDetails ? styles.totalDataBoxOpen : styles.totalDataBoxClose
          }
          onClick={() => setShowDetails((v) => !v)}
        >
          <div className={styles.textTotalBox}>
            <p className={styles.defaultLabel}>
              {isLoading
                ? "Loading..."
                : error
                ? "Error loading balances"
                : `Total: ${formatTokenAmount(celoBalance, "cCOP")}`}
            </p>
          </div>
          {showDetails ? <FiChevronUp /> : <FiChevronDown />}
        </div>
      </div>

      {showDetails && (
        <div className={styles.listOfAssets}>
          <div className={`${styles.indicator} ${styles.celo}`}>
            <Image
              src="/assets/Celo.png"
              alt="cCOP Token"
              width={24}
              height={24}
            />
            <p>
              Celo:{" "}
              {isLoading
                ? "Loading..."
                : celoBalance > 0
                ? formatTokenAmount(celoBalance, "cCOP")
                : "0,00 cCOP"}
            </p>
            <button
              className={styles.addTokenBtn}
              onClick={addTokenToWallet}
              title="Add cCOP to wallet"
            >
              <FiPlus />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};