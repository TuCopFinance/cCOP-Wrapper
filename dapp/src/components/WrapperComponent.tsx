"use client";
import React, { useState, useEffect } from "react";
import styles from "./WrapperComponent.module.css";
import { Spinner } from "react-spinner-toolkit";
import { erc20Abi, formatEther } from "viem";
import {
  getAccount,
  readContracts,
  simulateContract,
  switchChain,
  writeContract,
} from "@wagmi/core";
import { config } from "@/config";
import { address } from "../../constants/address";
import { chainID } from "../../constants/chainID";
import treasury from "../../constants/abis/Treasury.json";
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

export const WrapperComponent = () => {
  // Contract configs
  const treasuryContract = {
    address: address.testnet.treasury as `0x${string}`,
    abi: treasury.abi as any,
    chainId: chainID.testnet.celo,
  } as const;
  const cCopContract = {
    address: address.testnet.cCOP as `0x${string}`,
    abi: erc20Abi,
    chainId: chainID.testnet.celo,
  } as const;

  // State
  const [domainID, setDomainID] = useState("84532");
  const [differentAddressFlag, setDifferentAddressFlag] = useState(false);
  const [amount, setAmount] = useState("");
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [tokenAllowanceIsLoading, setTokenAllowanceIsLoading] = useState(false);
  const [allowanceIsMoreThanAmount, setAllowanceIsMoreThanAmount] = useState<
    boolean | null
  >(null);
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
  }, [amount, domainID, differentAddressFlag]);

  // Handler: Amount input change
  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAmount(e.target.value);
  }

  function checkChainAndChange() {
    const account = getAccount(config);
    if (account.chainId !== chainID.testnet.celo) {
      //change to celo chain
      switchChain(config, {
        chainId: chainID.testnet.celo,
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
      "wrapperAddressInput"
    ) as HTMLInputElement | null;
    readContracts(config, {
      contracts: [
        {
          ...cCopContract,
          functionName: "allowance",
          args: [
            account.address as `0x${string}`,
            address.testnet.treasury as `0x${string}`,
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
        console.log("Allowance and quote data:", data);
        setQuote(data[1].result as bigint);
        setAllowanceIsMoreThanAmount(amountFixed <= data[0].result);
      })
      .catch(() => {})
      .finally(() => {
        setTokenAllowanceIsLoading(false);

        const account = getAccount(config);
        checkChainAndChange();
      });
  }

  function setAllowance() {
    if (tokenAllowanceIsLoading) return;
    setTokenAllowanceIsLoading(true);
    const account = getAccount(config);
    checkChainAndChange();

    let amountFixed: bigint;
    try {
      amountFixed = BigInt(Math.floor(parseFloat(amount) * 10 ** 15));
    } catch (e) {
      setTokenAllowanceIsLoading(false);
      return;
    }

    console.log("Setting allowance for amount:", amountFixed);

    writeContract(config, {
      chainId: chainID.testnet.celo,
      abi: erc20Abi,
      address: address.testnet.cCOP as `0x${string}`,
      functionName: "approve",
      args: [address.testnet.treasury as `0x${string}`, amountFixed],
    })
      .then(() => {
        console.log("Allowance set successfully");
        verifyTokenAllowanceAndPriceForSend();
      })
      .catch((error) => {
        console.error("Error setting allowance:", error);
      })
      .finally(() => setTokenAllowanceIsLoading(false));
  }

  function wrap() {
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
      "wrapperAddressInput"
    ) as HTMLInputElement | null;
    console.log("Wrapping cCOP tokens for amount:", amountFixed);

    simulateContract(config, {
      chainId: chainID.testnet.celo,
      abi: treasury.abi,
      address: address.testnet.treasury as `0x${string}`,
      functionName: "wrap",
      args: [
        domainID,
        differentAddressFlag
          ? differentAddressInput?.value || account.address || ""
          : (account.address as `0x${string}`),
        amountFixed,
      ],
      value: quote + BigInt(1), // Ensure value is set to quote if available
    })
      .then((data: any) => {
        console.log("Simulation successful:", data);
      })
      .catch((error) => {
        console.error("Error simulating wrap:", error);
      });

    writeContract(config, {
      chainId: chainID.testnet.celo,
      abi: treasury.abi,
      address: address.testnet.treasury as `0x${string}`,
      functionName: "wrap",
      args: [
        domainID,
        differentAddressFlag
          ? differentAddressInput?.value || account.address || ""
          : (account.address as `0x${string}`),
        amountFixed,
      ],
      value: quote + BigInt(1), // Ensure value is set to quote if available
    })
      .then((data: any) => {
        console.log("cCOP tokens wrapped successfully");
        console.log(data.result);
        // Optionally, you can reset the form or show a success message here
      })
      .catch((error) => {
        console.error("Error wrapping cCOP tokens:", error);
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
      {quote && (
        <p className={styles.priceLabel}>
          Price for wrapping: {formatEther(quote)} CELO
        </p>
      )}
      {allowanceIsMoreThanAmount !== null && (
        <>
          <button
            className={
              !allowanceIsMoreThanAmount
                ? styles.actionButtonActive
                : styles.actionButtonInactive
            }
            onClick={!allowanceIsMoreThanAmount ? setAllowance : undefined}
          >
            Set Allowance
          </button>
          <button
            className={
              allowanceIsMoreThanAmount
                ? styles.actionButtonActive
                : styles.actionButtonInactive
            }
            onClick={allowanceIsMoreThanAmount ? wrap : undefined}
          >
            Wrap
          </button>
        </>
      )}
    </>
  );
};
