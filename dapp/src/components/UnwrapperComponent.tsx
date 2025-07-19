/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";
import React, { useState, useEffect, useCallback } from "react";
import styles from "./UnwrapperComponent.module.css";
import { Abi, formatEther } from "viem";
import {
  getAccount,
  readContracts,
  simulateContract,
  switchChain,
  writeContract,
} from "@wagmi/core";
import { config } from "@/config";
import { address } from "@/constants/address";
import { chainID } from "@/constants/chainID";
import WrappedCCOP from "@/constants/abis/WrappedCCOP.json";
import toast from "react-hot-toast";
import { waitForIsDelivered } from "@/utils/hyperlane";
import { useWalletClient } from "wagmi";

const notifyChangeChain = (chainName: string): string =>
  toast(`Changing to ${chainName} network`, {
    duration: 2000,
    position: "bottom-right",
    style: {
      background: "#333",
      color: "#fff",
    },
  });

const notifyUnwrapAction = (deliveredPromise: Promise<unknown>) =>
  toast.promise(
    deliveredPromise,
    {
      loading: "Unwrapping cCOP tokens...",
      success: `cCOP tokens unwrapped successfully!`,
      error: `Error unwrapping cCOP tokens, please check hyperlane explorer using your transaction hash`,
    },
    {
      position: "bottom-right",
      style: { background: "#707070", color: "#fff" },
      success: { duration: 5000, icon: "✅" },
      error: { duration: 10000, icon: "❌" },
    }
  );

export const UnwrapperComponent = () => {
  // Contract configs

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

  // State
  const [differentAddressFlag, setDifferentAddressFlag] = useState(false);
  const [amount, setAmount] = useState("");
  const [hasSufficientAmount, setHasSufficientAmount] =
    useState<boolean>(false);
  const [quote, setQuote] = useState<bigint | null>(null);
  const [chainToUnwrap, setChainToUnwrap] = useState("base");

  const { data: walletClient } = useWalletClient();

  //Check allowance and get quote
  const verifyTokenAllowanceAndPriceForSend = useCallback(() => {
    const account = getAccount(config);
    let amountFixed: bigint;
    try {
      amountFixed = BigInt(Math.floor(parseFloat(amount) * 10 ** 18));
    } catch {
      setHasSufficientAmount(false);
      setQuote(null);
      return;
    }

    const targetChainContract =
      chainToUnwrap === "base"
        ? wrappedCCOPContractBase
        : wrappedCCOPContractArb;

    const differentAddressInput = document.getElementById(
      "unwrapperAddressInput"
    ) as HTMLInputElement | null;
    readContracts(config, {
      contracts: [
        {
          ...targetChainContract,
          functionName: "balanceOf",
          args: [account.address as `0x${string}`],
        },
        {
          ...targetChainContract,
          functionName: "getQuote",
          args: [
            differentAddressFlag
              ? differentAddressInput?.value || account.address || ""
              : (account.address as `0x${string}`),
            amountFixed,
          ],
        },
      ],
    })
      .then((data) => {
        if (
          data[0].status === "success" &&
          data[1].status === "success" &&
          typeof data[0].result === "bigint" &&
          typeof data[1].result === "bigint"
        ) {
          setQuote(data[1].result);
          setHasSufficientAmount(data[0].result >= amountFixed);
        } else {
          setQuote(null);
          setHasSufficientAmount(false);
        }
      })
      .catch(() => {
        setQuote(null);
        setHasSufficientAmount(false);
      })
      .finally(() => {
        checkChainAndChange();
      });
  }, [amount, differentAddressFlag, chainToUnwrap]);

  // Auto-update on input change
  useEffect(() => {
    if (!amount) {
      setHasSufficientAmount(false);
      setQuote(null);
      return;
    }
    const timeout = setTimeout(() => {
      verifyTokenAllowanceAndPriceForSend();
    }, 500);
    return () => clearTimeout(timeout);
  }, [
    amount,
    differentAddressFlag,
    chainToUnwrap,
    verifyTokenAllowanceAndPriceForSend,
  ]);

  // Handler: Amount input change
  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAmount(e.target.value);
  }

  function checkChainAndChange() {
    const account = getAccount(config);
    const targetChainId =
      chainToUnwrap === "base" ? chainID.mainnet.base : chainID.mainnet.arb;

    if (account.chainId !== targetChainId) {
      //change to selected chain
      switchChain(config, {
        chainId: targetChainId,
      }).then(() => {
        notifyChangeChain(chainToUnwrap);
      });
    }
  }

  function unwrap() {
    if (quote === null) return;

    const account = getAccount(config);
    let amountFixed: bigint;
    try {
      amountFixed = BigInt(Math.floor(parseFloat(amount) * 10 ** 18));
    } catch {
      return;
    }
    const differentAddressInput = document.getElementById(
      "unwrapperAddressInput"
    ) as HTMLInputElement | null;

    const targetChainContractAddress =
      chainToUnwrap === "base"
        ? address.mainnet.wrapToken.base
        : address.mainnet.wrapToken.arb;

    const targetChainIdContract =
      chainToUnwrap === "base" ? chainID.mainnet.base : chainID.mainnet.arb;

    simulateContract(config, {
      chainId: targetChainIdContract,
      abi: WrappedCCOP.abi,
      address: targetChainContractAddress as `0x${string}`,
      functionName: "unwrap",
      args: [
        differentAddressFlag
          ? differentAddressInput?.value || account.address || ""
          : (account.address as `0x${string}`),
        amountFixed,
      ],
      value: quote + BigInt(1),
    })
      .then((data) => {
        const msgIdentifier = data.result;

        writeContract(config, {
          chainId: targetChainIdContract,
          abi: WrappedCCOP.abi,
          address: targetChainContractAddress as `0x${string}`,
          functionName: "unwrap",
          args: [
            differentAddressFlag
              ? differentAddressInput?.value || account.address || ""
              : (account.address as `0x${string}`),
            amountFixed,
          ],
          value: quote + BigInt(1), // Ensure value is set to quote if available
        })
          .then(() => {
            notifyUnwrapAction(waitForIsDelivered(msgIdentifier, 5000, 20));
          })
          .catch((error) => {
            console.error("Error unwrapping cCOP tokens:", error);
          });
      })
      .catch(() => {
        toast.error(
          "Error during unwrap check your wcCOP balance or ETH balance",
          {
            position: "bottom-right",
            style: {
              background: "#333",
              color: "#fff",
            },
          }
        );
      });
  }

  // Render
  return (
    <>
      <button
        className={styles.actionButtonActive}
        style={{ marginBottom: "1rem" }}
        onClick={async () => {
          if (walletClient) {
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
          } else {
            toast.error("No wallet client detected", {
              position: "bottom-right",
              style: {
                background: "#333",
                color: "#fff",
              },
            });
          }
        }}
      >
        Add wcCOP to wallet
      </button>
      <p className={styles.unwrapToLabel}>
        Chain to unwrap:{" "}
        <select
          className={styles.unwrapToSelector}
          value={chainToUnwrap}
          onChange={(e) => setChainToUnwrap(e.target.value)}
        >
          <option value="base">Base</option>
          <option value="arbitrum">Arbitrum</option>
        </select>
      </p>
      <label className={styles.amountLabel}>Amount</label>
      <input
        className={styles.amountInput}
        placeholder="Enter amount of cCOP tokens to wrap"
        value={amount}
        onChange={handleAmountChange}
      />
      <div className={styles.addressSelector}>
        Sent the cCOP tokens to{" "}
        <select
          onChange={(e) =>
            setDifferentAddressFlag(e.target.value === "differentAddress")
          }
        >
          <option value="sameAddress">same address</option>
          <option value="differentAddress">a different address</option>
        </select>
      </div>
      {differentAddressFlag && (
        <input
          className={styles.addressInput}
          placeholder="Enter address"
          id="unwrapperAddressInput"
        />
      )}

      {quote && (
        <p className={styles.priceLabel}>
          Price for unwrapping: {formatEther(quote)} ETH
        </p>
      )}

      <button
        className={
          hasSufficientAmount
            ? styles.actionButtonActive
            : styles.actionButtonInactive
        }
        onClick={hasSufficientAmount ? unwrap : undefined}
      >
        Unwrap
      </button>
    </>
  );
};
