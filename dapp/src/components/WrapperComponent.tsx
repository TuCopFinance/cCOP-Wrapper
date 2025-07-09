"use client";
import React, { useState } from "react";
import styles from "./WrapperComponent.module.css";
import { Spinner } from "react-spinner-toolkit";
import { erc20Abi } from "viem";
import { getAccount, readContract } from "@wagmi/core";
import { config } from "@/config";

import { address } from "../../constants/address";

export const WrapperComponent = () => {
  // ver si tiene permission to transfer cCOP tokens
  function verifyTokenAllowanceAndPriceForSend() {
    if (tokenAllowanceIsLoading) {
      console.log("Token allowance check already in progress.");
      return;
    }

    setTokenAllowanceIsLoading(true);
    console.log("Starting token allowance check...");

    const account = getAccount(config);
    readContract(config, {
      address: address.testnet.treasury as `0x${string}`, // Replace with your contract address
      abi: erc20Abi,
      functionName: "allowance",
      args: [
        account.address as `0x${string}`,
        address.testnet.treasury as `0x${string}`,
      ], // Replace with the spender address
    })
      .then((data: any) => {
        console.log("Token allowance data:", data);
      })
      .catch((error: any) => {
        console.error("Error checking token allowance:", error);
      })
      .finally(() => {
        console.log("Token allowance check completed.");
      });
  }

  const [differentAddressFlag, setDifferentAddressFlag] = React.useState(false);
  const [amount, setAmount] = useState("");
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [tokenAllowanceIsLoading, setTokenAllowanceIsLoading] = useState(false);

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newAmount = e.target.value;
    setAmount(newAmount);

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    const newTimeoutId = setTimeout(() => {
      verifyTokenAllowanceAndPriceForSend();
    }, 2000);

    setTimeoutId(newTimeoutId);
  }

  return (
    <>
      <label className={styles.amountLabel}>Amount</label>
      <input
        className={styles.amountInput}
        placeholder={`Enter amount of cCOP tokens to wrap`}
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
        <input className={styles.addressInput} placeholder="Enter address" />
      )}
      <div>
        <p className={styles.wrapToLabel}>
          Wrap on:{" "}
          <select className={styles.wrapToSelector}>
            <option value="base">Base</option>
          </select>
        </p>
      </div>
      <p className={styles.priceLabel}>Price for wrapping: 0.01 ETH</p>

      <button className={styles.actionButtonActive}>
        Set Allowance
        {
          //<Spinner shape="fading" color="#ffe600" loading speed={1} size={20} />
        }
      </button>
      <button className={styles.actionButtonActive}>Wrap</button>
    </>
  );
};
