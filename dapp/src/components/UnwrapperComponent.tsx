"use client";
import React, { useState, useEffect } from "react";
import styles from "./UnwrapperComponent.module.css";
import { Spinner } from "react-spinner-toolkit";
import { formatEther } from "viem";
import {
  getAccount,
  readContracts,
  switchChain,
  writeContract,
} from "@wagmi/core";
import { config } from "@/config";
import { address } from "../../constants/address";
import { chainID } from "../../constants/chainID";
import WrappedCCOP from "../../constants/abis/WrappedCCOP.json";
import toast from "react-hot-toast";

const notifyChangeChain = () =>
  toast("Changing to Celo network", {
    duration: 2000,
    position: "bottom-right",
    style: {
      background: "#333",
      color: "#fff",
    },
  });

export const UnwrapperComponent = () => {
  // Contract configs

  const wrappedCCOPContractBase = {
    address: address.testnet.wrapToken.base as `0x${string}`,
    abi: WrappedCCOP.abi as any,
    chainId: chainID.testnet.base,
  } as const;

  // State
  const [differentAddressFlag, setDifferentAddressFlag] = useState(false);
  const [amount, setAmount] = useState("");
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [tokenAllowanceIsLoading, setTokenAllowanceIsLoading] = useState(false);
  const [hasSufficientAmount, setHasSufficientAmount] =
    useState<boolean>(false);
  const [quote, setQuote] = useState<bigint | null>(null);

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
    if (account.chainId !== chainID.testnet.base) {
      //change to base chain
      switchChain(config, {
        chainId: chainID.testnet.base,
      }).then(() => {
        notifyChangeChain();
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
      amountFixed = BigInt(Math.floor(parseFloat(amount) * 10 ** 15));
    } catch (e) {
      setTokenAllowanceIsLoading(false);
      return;
    }

    console.log(
      "Checking allowance and getting quote for amount:",
      amountFixed
    );
    const differentAddressInput = document.getElementById(
      "unwrapperAddressInput"
    ) as HTMLInputElement | null;
    readContracts(config, {
      contracts: [
        {
          ...wrappedCCOPContractBase,
          functionName: "balanceOf",
          args: [account.address as `0x${string}`],
        },
        {
          ...wrappedCCOPContractBase,
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
      .then((data: any) => {
        console.log("Allowance and quote data:", data);
        setQuote(data[1].result as bigint);
        setHasSufficientAmount(data[0].result >= amountFixed);
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
      amountFixed = BigInt(Math.floor(parseFloat(amount) * 10 ** 15));
    } catch (e) {
      setTokenAllowanceIsLoading(false);
      return;
    }
    const differentAddressInput = document.getElementById(
      "unwrapperAddressInput"
    ) as HTMLInputElement | null;
    console.log("Wrapping cCOP tokens for amount:", amountFixed);
    writeContract(config, {
      chainId: chainID.testnet.base,
      abi: WrappedCCOP.abi,
      address: address.testnet.wrapToken.base as `0x${string}`,
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
        console.log("cCOP tokens unwrapped successfully");
        // Optionally, you can reset the form or show a success message here
      })
      .catch((error) => {
        console.error("Error unwrapping cCOP tokens:", error);
      })
      .finally(() => setTokenAllowanceIsLoading(false));
  }

  // Render
  return (
    <>
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
          Price for wrapping: {formatEther(quote)} ETH
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
        Wrap
      </button>
    </>
  );
};
