"use client";
import React from "react";
import styles from "./Dashboard.module.css";
import { useWalletClient } from "wagmi";
import toast from "react-hot-toast";
import { address } from "@/constants/address";
import WrappedCCOP from "@/constants/abis/WrappedCCOP.json";
import { chainID } from "@/constants/chainID";
import { Abi, erc20Abi } from "viem";
import { FiRefreshCcw } from "react-icons/fi";
import {
  getAccount,
  readContracts,
  switchChain,
} from "@wagmi/core";
import { config } from "@/config";

export const Dashboard = () => {
  const { data: walletClient } = useWalletClient(); // Mover el hook aquí

  const wrappedCCOPContractBase = {
    address: address.mainnet.wrapToken.base as `0x${string}`,
    abi: WrappedCCOP.abi as Abi,
    chainId: chainID.mainnet.base,
  } as const;

  const wrappedCCOPContractArb = {
    address: address.mainnet.wrapToken.arb as `0x${string}`,
    abi: WrappedCCOP.abi as Abi,
    chainId: chainID.mainnet.arb,
  } as const;

  const cCOPContractCelo = {
    address: address.mainnet.cCOP as `0x${string}`,
    abi: erc20Abi as Abi,
    chainId: chainID.mainnet.celo,
  } as const;

  const [tokenbalances, setTokenBalances] = React.useState({
    base: "0",
    arb: "0",
    celo: "0",
  });

  const readAmount = () => {
    const account = getAccount(config);
    readContracts(config, {
      contracts: [
        {
          ...wrappedCCOPContractBase,
          functionName: "balanceOf",
          args: [account.address],
        },
        {
          ...wrappedCCOPContractArb,
          functionName: "balanceOf",
          args: [account.address],
        },
        {
          ...cCOPContractCelo,
          functionName: "balanceOf",
          args: [account.address],
        },
      ],
    }).then((data) => {
      if (
        data[0].status === "success" &&
        data[1].status === "success" &&
        data[2].status === "success" &&
        typeof data[0].result === "bigint" &&
        typeof data[1].result === "bigint" &&
        typeof data[2].result === "bigint"
      ) {
        setTokenBalances({
          base: (data[0].result / BigInt(10 ** 18)).toString(),
          arb: (data[1].result / BigInt(10 ** 18)).toString(),
          celo: (data[2].result / BigInt(10 ** 18)).toString(),
        });
      }
    });
  };

  const addTokenToWallet = async (network: "base" | "arb") => {
    if (walletClient) {
      const account = getAccount(config);
      const targetChainId =
        network === "base" ? chainID.mainnet.base : chainID.mainnet.arb;

      if (account.chainId !== targetChainId) {
        switchChain(config, { chainId: targetChainId }).then(async () => {
          toast(
            `Changing to ${network === "base" ? "base" : "arbitrum"} network`,
            {
              duration: 2000,
              position: "bottom-right",
              style: {
                background: "#333",
                color: "#fff",
              },
            }
          );
          try {
            const success = await walletClient.watchAsset({
              type: "ERC20",
              options: {
                address: "0x5Cc112D9634a2D0cB3A0BA8dDC5dC05a010A3D22",
                symbol: "wcCOP",
                decimals: 18,
                image: "/cCOP_token.png",
              },
            });
            if (success) {
              toast.success("Token wcCOP added to your wallet", {
                position: "bottom-right",
                style: {
                  background: "#333",
                  color: "#fff",
                },
              });
            } else {
              toast.error("User rejected adding the token", {
                position: "bottom-right",
                style: {
                  background: "#333",
                  color: "#fff",
                },
              });
            }
          } catch (error) {
            toast.error("Failed to add token to wallet", {
              position: "bottom-right",
              style: {
                background: "#333",
                color: "#fff",
              },
            });
          }
        });
      }
    } else {
      toast.error("No wallet client detected", {
        position: "bottom-right",
        style: {
          background: "#333",
          color: "#fff",
        },
      });
    }
  };

  React.useEffect(() => {
    readAmount();
  }, []);

  return (
    <>
      <div className={styles.refreshContainer}>
        <button className={styles.refreshButton} onClick={readAmount}>
        <FiRefreshCcw className={styles.refreshIcon} />
      </button>
      </div>
      
      <div className={styles.dashboardContainer}>
        <h1 className={styles.title}>cCOP Dashboard</h1>
        <div className={styles.tokenBalancesContainer}>
          <div className={styles.tokenBalanceCard}>
            <h2>Celo cCOP Balance</h2>
            <p className={styles.balanceValue}>
              {tokenbalances.celo
                ? parseFloat(tokenbalances.celo).toFixed(2)
                : "0.00"}{" "}
              cCOP
            </p>
          </div>
          <div className={styles.tokenBalanceCard}>
            <h2>Base wcCOP Balance</h2>
            <p className={styles.balanceValue}>
              {tokenbalances.base
                ? parseFloat(tokenbalances.base).toFixed(2)
                : "0.00"}{" "}
              wcCOP
            </p>
            <button
              className={styles.actionButton}
              onClick={() => addTokenToWallet("base")}
            >
              Add wcCOP to wallet
            </button>
          </div>
          <div className={styles.tokenBalanceCard}>
            <h2>Arbitrum wcCOP Balance</h2>
            <p className={styles.balanceValue}>
              {tokenbalances.arb
                ? parseFloat(tokenbalances.arb).toFixed(2)
                : "0.00"}{" "}
              wcCOP
            </p>
            <button
              className={styles.actionButton}
              onClick={() => addTokenToWallet("arb")}
            >
              Add wcCOP to wallet
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
