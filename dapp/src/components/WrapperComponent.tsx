/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";
import React, { useState, useEffect, useCallback } from "react";
import styles from "./WrapperComponent.module.css";
import { erc20Abi, formatEther } from "viem";
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
import treasury from "@/constants/abis/Treasury.json";
import toast from "react-hot-toast";
import { waitForIsDelivered } from "../utils/hyperlane";
import type { Abi } from "viem";
import { generateReferralTag, submitDivviReferral } from "@/utils/divvi";
import { getReferralTag } from "@divvi/referral-sdk";

// --- Notification helpers ---
const notifyChangeChain = () =>
  toast("Changing to Celo network", {
    duration: 2000,
    position: "bottom-right",
    style: { background: "#333", color: "#fff" },
  });

const notifyWrapAction = (deliveredPromise: Promise<any>) =>
  toast.promise(
    deliveredPromise,
    {
      loading: "Wrapping cCOP tokens...",
      success: `cCOP tokens wrapped successfully!`,
      error: `Error wrapping cCOP tokens, please check hyperlane explorer using your transaction hash`,
    },
    {
      position: "bottom-right",
      style: { background: "#707070", color: "#fff" },
      success: { duration: 5000, icon: "✅" },
      error: { duration: 10000, icon: "❌" },
    }
  );

export const WrapperComponent = () => {
  // --- Contract configs ---
  const treasuryContract = {
    address: address.mainnet.treasury as `0x${string}`,
    abi: treasury.abi as Abi,
    chainId: chainID.mainnet.celo,
  } as const;
  const cCopContract = {
    address: address.mainnet.cCOP as `0x${string}`,
    abi: erc20Abi as Abi,
    chainId: chainID.mainnet.celo,
  } as const;

  // --- State ---
  const [domainID, setDomainID] = useState("8453");
  const [differentAddressFlag, setDifferentAddressFlag] = useState(false);
  const [amount, setAmount] = useState("");
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const [allowanceIsMoreThanAmount, setAllowanceIsMoreThanAmount] = useState<
    boolean | null
  >(null);
  const [quote, setQuote] = useState<bigint | null>(null);

  // --- Handlers ---
  const verifyTokenAllowanceAndPriceForSend = useCallback(() => {
    const account = getAccount(config);
    let amountFixed: bigint;
    try {
      amountFixed = BigInt(Math.floor(parseFloat(amount) * 10 ** 18));
    } catch {
      setAllowanceIsMoreThanAmount(null);
      setQuote(null);
      return;
    }
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
            address.mainnet.treasury as `0x${string}`,
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
      .then((data) => {
        if (
          data[0].status === "success" &&
          data[1].status === "success" &&
          typeof data[0].result === "bigint" &&
          typeof data[1].result === "bigint"
        ) {
          setQuote(data[1].result);
          setAllowanceIsMoreThanAmount(amountFixed <= data[0].result);
        } else {
          setQuote(null);
          setAllowanceIsMoreThanAmount(null);
        }
      })
      .catch(() => {
        setQuote(null);
        setAllowanceIsMoreThanAmount(null);
      })
      .finally(() => {
        checkChainAndChange();
      });
  }, [amount, domainID, differentAddressFlag]);

  useEffect(() => {
    if (!amount) {
      setAllowanceIsMoreThanAmount(null);
      setQuote(null);
      return;
    }
    const timeout = setTimeout(() => {
      verifyTokenAllowanceAndPriceForSend();
    }, 500);
    return () => clearTimeout(timeout);
  }, [amount, domainID, differentAddressFlag, verifyTokenAllowanceAndPriceForSend]);

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAmount(e.target.value);
  }

  function checkChainAndChange() {
    const account = getAccount(config);
    if (account.chainId !== chainID.mainnet.celo) {
      switchChain(config, { chainId: chainID.mainnet.celo }).then(
        notifyChangeChain
      );
    }
  }

  function setAllowance() {
    checkChainAndChange();
    let amountFixed: bigint;
    try {
      amountFixed = BigInt(Math.floor(parseFloat(amount) * 10 ** 18));
    } catch {
      return;
    }
    
    const account = getAccount(config);
    if (!account.address) return;

    // Generate Divvi referral tag
    const referralTag = generateReferralTag(account.address);

    writeContract(config, {
      chainId: chainID.mainnet.celo,
      abi: erc20Abi,
      address: address.mainnet.cCOP as `0x${string}`,
      functionName: "approve",
      args: [address.mainnet.treasury as `0x${string}`, amountFixed],
      dataSuffix: `0x${referralTag}` as `0x${string}`,
    })
      .then((txHash) => {
        // Submit Divvi referral
        submitDivviReferral(txHash, chainID.mainnet.celo);
        
        setTimeout(() => {
          verifyTokenAllowanceAndPriceForSend();
        }, 2500);
      })
      .catch(() => {
        setAllowanceIsMoreThanAmount(false);
      });
  }

  function wrap() {
    if (quote === null) return;
    const account = getAccount(config);
    if (!account.address) return;
    
    let amountFixed: bigint;
    try {
      amountFixed = BigInt(Math.floor(parseFloat(amount) * 10 ** 18));
    } catch {
      return;
    }
    const differentAddressInput = document.getElementById(
      "wrapperAddressInput"
    ) as HTMLInputElement | null;
    
    const targetAddress = differentAddressFlag
      ? differentAddressInput?.value || account.address || ""
      : (account.address as `0x${string}`);

    // Generate Divvi referral tag
    const referralTag = generateReferralTag(account.address);

    simulateContract(config, {
      chainId: chainID.mainnet.celo,
      abi: treasury.abi,
      address: address.mainnet.treasury as `0x${string}`,
      functionName: "wrap",
      args: [
        domainID,
        targetAddress,
        amountFixed,
      ],
      value: quote + BigInt(1),
      dataSuffix: `0x${referralTag}` as `0x${string}`,
    })
      .then((data) => {
        const msgIdentifier = data.result;
        writeContract(config, {
          chainId: chainID.mainnet.celo,
          abi: treasury.abi,
          address: address.mainnet.treasury as `0x${string}`,
          functionName: "wrap",
          args: [
            domainID,
            targetAddress,
            amountFixed,
          ],
          value: quote + BigInt(1),
          dataSuffix: `0x${referralTag}` as `0x${string}`,
        })
          .then((txHash) => {
            // Submit Divvi referral
            submitDivviReferral(txHash, chainID.mainnet.celo);
            
            notifyWrapAction(waitForIsDelivered(msgIdentifier, 5000, 20));
          })
          .catch(() => {})
          .finally(() => {});
      })
      .catch(() => {});
  }

  // --- Render ---
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
            <option value="8453">Base</option>
            <option value="42161">Arbitrum</option>
          </select>
        </p>
      </div>
      {quote && (
        <p className={styles.priceLabel}>
          Price for wrapping: {formatEther(quote)} CELO
        </p>
      )}

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
  );
};
