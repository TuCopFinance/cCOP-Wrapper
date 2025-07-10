"use client";
import React, { useState } from "react";
import styles from "./WrapperComponent.module.css";
import { Spinner } from "react-spinner-toolkit";
import { erc20Abi } from "viem";
import { getAccount, readContract, readContracts } from "@wagmi/core";
import { config } from "@/config";
import { address } from "../../constants/address";
import treasury from "../../constants/abis/Treasury.json";

export const WrapperComponent = () => {
  const treasuryContract = {
    address: address.testnet.treasury as `0x${string}`,
    abi: treasury.abi as any,
  } as const;

  const cCopContract = {
    address: address.testnet.cCOP as `0x${string}`,
    abi: erc20Abi,
  } as const;

  const [domainID, setDomainID] = useState("84532"); // Default to Base domain ID
  const [differentAddressFlag, setDifferentAddressFlag] = React.useState(false);
  const [amount, setAmount] = useState("");
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [tokenAllowanceIsLoading, setTokenAllowanceIsLoading] = useState(false);

  // ver si tiene permission to transfer cCOP tokens
  function verifyTokenAllowanceAndPriceForSend() {
    if (tokenAllowanceIsLoading) {
      console.log("Token allowance check already in progress.");
      return;
    }

    setTokenAllowanceIsLoading(true);
    console.log("Starting token allowance check...");

    const account = getAccount(config);

    //como amount se pone en float y tiene 15 decimals, se multiplica por 10^15
    let amountFixed: bigint;
    try {
      // Parse as float, multiply, then convert to BigInt
      amountFixed = BigInt(Math.floor(parseFloat(amount) * 10 ** 15));
    } catch (e) {
      console.error("Invalid amount input for BigInt conversion:", amount);
      setTokenAllowanceIsLoading(false);
      return;
    }

    console.log("Amount fixed:", amountFixed.toString());

    const differentAddressInput = document.getElementById(
      "wrapperAddressInput"
    ) as HTMLInputElement | null;

    readContracts(config, {
      contracts: [
        {
          ...cCopContract,
          functionName: "allowance",
          args: [
            account.address as `0x${string}`,
            address.testnet.cCOP as `0x${string}`,
          ],
        },
        {
          ...treasuryContract,
          functionName: "getQuote",
          args: [
            domainID,
            differentAddressFlag
              ? differentAddressInput?.value || account.address || ""
              : (account.address as `0x${string}`),
            amountFixed,
          ],
        },
      ],
    })
      .then((data: any) => {
        console.log(data);
      })
      .catch((error: any) => {
        console.error("Error checking token allowance:", error);
      })
      .finally(() => {
        console.log("Token allowance check completed.");
        setTokenAllowanceIsLoading(false);
      });
  }

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
        <input
          className={styles.addressInput}
          placeholder="Enter address"
          id="wrapperAddressInput"
        />
      )}
      <div>
        <p className={styles.wrapToLabel}>
          Wrap on:{" "}
          <select
            className={styles.wrapToSelector}
            value={domainID}
            onChange={(e) => setDomainID(e.target.value)}
          >
            <option value="84532">Base</option>
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
