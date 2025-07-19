"use client";
import React, { useState, useEffect } from "react";
import styles from "./UnwrapperComponent.module.css";
import { formatEther } from "viem";
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

const notifyChangeChain = (chainName: string): string =>
  toast(`Changing to ${chainName} network`, {
    duration: 2000,
    position: "bottom-right",
    style: {
      background: "#333",
      color: "#fff",
    },
  });

const notifyUnwrapAction = (deliveredPromise: Promise<any>) =>
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
    abi: WrappedCCOP.abi as any,
    chainId: chainID.mainnet.base,
  } as const;

  const wrappedCCOPContractArb = {
    address: address.mainnet.wrapToken.arb as `0x${string}`,
    abi: WrappedCCOP.abi as any,
    chainId: chainID.mainnet.arb,
  } as const;

  // State
  const [differentAddressFlag, setDifferentAddressFlag] = useState(false);
  const [amount, setAmount] = useState("");
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [tokenAllowanceIsLoading, setTokenAllowanceIsLoading] = useState(false);
  const [hasSufficientAmount, setHasSufficientAmount] =
    useState<boolean>(false);
  const [quote, setQuote] = useState<bigint | null>(null);
  const [chainToUnwrap, setChainToUnwrap] = useState("base");

  // Auto-update on input change
  useEffect(() => {
    if (!amount) return;
    if (timeoutId) clearTimeout(timeoutId);
    const newTimeoutId = setTimeout(() => {
      verifyTokenAllowanceAndPriceForSend();
    }, 500); // más responsivo
    setTimeoutId(newTimeoutId);
    return () => clearTimeout(newTimeoutId);
  }, [amount, differentAddressFlag]);

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

  //Check allowance and get quote
  function verifyTokenAllowanceAndPriceForSend() {
    if (tokenAllowanceIsLoading) return;
    setTokenAllowanceIsLoading(true);
    const account = getAccount(config);
    let amountFixed: bigint;
    try {
      amountFixed = BigInt(Math.floor(parseFloat(amount) * 10 ** 18));
    } catch (e) {
      setTokenAllowanceIsLoading(false);
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
        }
      })
      .catch(() => {})
      .finally(() => {
        setTokenAllowanceIsLoading(false);

        const account = getAccount(config);
        checkChainAndChange();
      });
  }

  function unwrap() {
    if (quote === null) return;
    if (tokenAllowanceIsLoading) return;
    setTokenAllowanceIsLoading(true);
    const account = getAccount(config);
    let amountFixed: bigint;
    try {
      amountFixed = BigInt(Math.floor(parseFloat(amount) * 10 ** 18));
    } catch (e) {
      setTokenAllowanceIsLoading(false);
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
    }).then((data) => {
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
        })
        .finally(() => setTokenAllowanceIsLoading(false));
    });
  }

  // Render
  return (
    <>
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
