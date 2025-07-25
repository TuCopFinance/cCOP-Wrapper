/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";
import React, { useState, useEffect, useCallback } from "react";
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
import { BalanceIndicators } from "./BalanceIndicators";
import { useTokenBalances } from "@/hooks/useTokenBalances";
import {
  isMobile,
  getMobileErrorMessage,
  getMobileLoadingMessage,
} from "@/utils/mobile";
import { useGlobalBalances } from "../context/BalanceContext";
import {
  estimateWrapGas,
  calculateApproximateGas,
} from "@/utils/gas-estimation";
import {
  calculateUSDValue,
  debugPriceFeed,
  formatHyperlanePrice,
  formatUSDValue,
  formatTokenAmount,
} from "@/utils/price-feeds";
import Image from "next/image";
import styles from "./WrapperComponent.module.css";
import { SelfGasFeeSponsorshipComponent } from "./SelfGasFeeSponsorshipComponent";

// --- Helper function for blockchain explorer links ---
const getExplorerLink = (chainId: number, txHash: string): string => {
  switch (chainId) {
    case 42220: // Celo Mainnet
      return `https://celoscan.io/tx/${txHash}`;
    case 44787: // Celo Alfajores Testnet
      return `https://alfajores.celoscan.io/tx/${txHash}`;
    case 8453: // Base Mainnet
      return `https://basescan.org/tx/${txHash}`;
    case 84532: // Base Sepolia Testnet
      return `https://sepolia.basescan.org/tx/${txHash}`;
    case 42161: // Arbitrum One
      return `https://arbiscan.io/tx/${txHash}`;
    case 421614: // Arbitrum Sepolia Testnet
      return `https://sepolia.arbiscan.io/tx/${txHash}`;
    default:
      return `https://celoscan.io/tx/${txHash}`;
  }
};

// --- Helper function to get chain name ---
const getChainName = (chainId: number): string => {
  switch (chainId) {
    case 42220:
      return "Celo";
    case 44787:
      return "Celo Testnet";
    case 8453:
      return "Base";
    case 84532:
      return "Base Testnet";
    case 42161:
      return "Arbitrum";
    case 421614:
      return "Arbitrum Testnet";
    default:
      return "Unknown";
  }
};

// --- Helper function to format transaction link ---
const formatTransactionLink = (chainId: number, txHash: string): string => {
  const chainName = getChainName(chainId);
  const shortTxHash = `${txHash.slice(0, 6)}...${txHash.slice(-4)}`;

  return `${chainName} (${shortTxHash})`;
};

// --- Helper function to get explorer URL ---
const getExplorerUrl = (chainId: number, txHash: string): string => {
  return getExplorerLink(chainId, txHash);
};

// --- Helper function to show transaction toast with clickable link ---
const showTransactionToast = (
  isSuccess: boolean,
  chainId: number,
  txHash: string,
  action: string
) => {
  const chainName = getChainName(chainId);
  const shortTxHash = `${txHash.slice(0, 6)}...${txHash.slice(-4)}`;
  const explorerUrl = getExplorerLink(chainId, txHash);

  const message = isSuccess
    ? `cCOP tokens ${action} successfully!`
    : `Error ${action} cCOP tokens.`;

  const toastId = toast(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        position: "relative",
      }}
      className={styles.toastContainer}
    >
      {/* Close button */}
      <button
        onClick={() => toast.dismiss(toastId)}
        className={styles.toastCloseButton}
        title="Close message"
      >
        ×
      </button>

      <div className={styles.toastMessage}>{message}</div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "12px", opacity: 0.8 }}>
          Transaction: {chainName} ({shortTxHash})
        </span>
        <button
          onClick={() => {
            window.open(explorerUrl, "_blank");
            toast.dismiss(toastId);
          }}
          className={styles.toastButton}
        >
          View
        </button>
      </div>
    </div>,
    {
      position: "bottom-right",
      style: {
        background: "#707070",
        color: "#fff",
        minWidth: "300px",
        position: "relative",
      },
      duration: Infinity,
      icon: isSuccess ? "✅" : "❌",
    }
  );
};

// --- Helper function to create toast with close button ---
const createToastWithClose = (
  message: string,
  type: "success" | "error" | "info",
  duration: number = Infinity
) => {
  const toastId = toast(
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "8px",
        position: "relative",
      }}
    >
      <span>{message}</span>
      <button
        onClick={() => toast.dismiss(toastId)}
        className={styles.toastCloseButton}
        title="Close message"
      >
        ×
      </button>
    </div>,
    {
      position: "bottom-right",
      style: {
        background:
          type === "success"
            ? "#28a745"
            : type === "error"
            ? "#dc3545"
            : "#707070",
        color: "#fff",
        minWidth: "250px",
      },
      duration: duration,
      icon: type === "success" ? "✅" : type === "error" ? "❌" : "ℹ️",
    }
  );
};

// --- Notification helpers ---
const notifyChangeChain = () =>
  toast("Changing to Celo network", {
    duration: 2000,
    position: "bottom-right",
    style: { background: "#333", color: "#fff" },
  });

const notifyWrapAction = (
  deliveredPromise: Promise<any>,
  txHash?: string,
  onRefresh?: () => void
) => {
  // Show loading toast
  const loadingToast = toast.loading("Wrapping cCOP tokens...", {
    position: "bottom-right",
    style: { background: "#707070", color: "#fff" },
  });

  deliveredPromise
    .then(() => {
      // Dismiss loading toast
      toast.dismiss(loadingToast);

      // Refresh balances after successful delivery
      console.log("=== TRANSACTION DELIVERED - REFRESHING BALANCES ===");
      setTimeout(() => {
        console.log("=== EXECUTING BALANCE REFRESH AFTER DELIVERY ===");
        console.log("Executing refresh after transaction delivery...");
        if (onRefresh) {
          onRefresh();
          console.log("=== BALANCE REFRESH EXECUTED AFTER DELIVERY ===");
        } else {
          console.log("=== NO REFRESH FUNCTION PROVIDED ===");
        }
      }, 2000); // Wait 2 seconds for delivery to be processed

      // Show success toast
      if (txHash) {
        showTransactionToast(true, 42220, txHash, "wrapped");
      } else {
        createToastWithClose("cCOP tokens wrapped successfully!", "success");
      }
    })
    .catch((error) => {
      // Dismiss loading toast
      toast.dismiss(loadingToast);

      // Show error toast
      if (txHash) {
        showTransactionToast(false, 42220, txHash, "wrapping");
      } else {
        createToastWithClose(
          "Error wrapping cCOP tokens, please check hyperlane explorer using your transaction hash",
          "error"
        );
      }
    });
};

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
  const [amountValidation, setAmountValidation] = useState<{
    isValid: boolean;
    message: string;
    type: "success" | "error" | "warning" | "info";
  } | null>(null);
  const [amountPrediction, setAmountPrediction] = useState<{
    usdValue?: string;
    percentageOfBalance?: number;
    gasEstimate?: string;
  } | null>(null);

  const [allowanceIsMoreThanAmount, setAllowanceIsMoreThanAmount] = useState<
    boolean | null
  >(null);
  const [quote, setQuote] = useState<bigint | null>(null);
  const [formattedPrice, setFormattedPrice] = useState<string>("");

  const account = getAccount(config);
  const connectedAddress = account.address || "";
  const [customAddress, setCustomAddress] = useState("");

  // Get token balances
  const { balances, refresh: refreshBalances } = useGlobalBalances();
  const celoBalance = balances.celo;

  // Refresh balances when component mounts and when domainID changes
  useEffect(() => {
    refreshBalances();
  }, [domainID, refreshBalances]);

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

          // Format the price in USD
          formatHyperlanePrice(data[1].result, true).then(setFormattedPrice);
        } else {
          setQuote(null);
          setAllowanceIsMoreThanAmount(null);
          setFormattedPrice("");
        }
      })
      .catch(() => {
        setQuote(null);
        setAllowanceIsMoreThanAmount(null);
        setFormattedPrice("");
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
  }, [
    amount,
    domainID,
    differentAddressFlag,
    verifyTokenAllowanceAndPriceForSend,
  ]);

  // Revalidate amount when balance changes
  useEffect(() => {
    if (amount) {
      validateAndPredictAmount(amount).catch(console.error);
    }
  }, [celoBalance]);

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setAmount(value);

    // Validate and predict amount
    validateAndPredictAmount(value).catch(console.error);
  }

  async function validateAndPredictAmount(value: string) {
    if (!value || value === "") {
      setAmountValidation(null);
      setAmountPrediction(null);
      return;
    }

    const numValue = parseFloat(value);
    const balance = parseFloat(celoBalance);

    // Basic validation
    if (isNaN(numValue)) {
      setAmountValidation({
        isValid: false,
        message: "Por favor ingresa un número válido",
        type: "error",
      });
      setAmountPrediction(null);
      return;
    }

    if (numValue <= 0) {
      setAmountValidation({
        isValid: false,
        message: "El monto debe ser mayor a 0",
        type: "error",
      });
      setAmountPrediction(null);
      return;
    }

    if (numValue > balance) {
      setAmountValidation({
        isValid: false,
        message: `Saldo insuficiente. Disponible: ${formatTokenAmount(
          balance,
          "cCOP"
        )}`,
        type: "error",
      });
    } else if (numValue === balance) {
      setAmountValidation({
        isValid: true,
        message: "Usando todo el saldo disponible",
        type: "success",
      });
    } else if (numValue > balance * 0.9) {
      setAmountValidation({
        isValid: true,
        message: "Usando más del 90% del saldo",
        type: "warning",
      });
    } else {
      setAmountValidation({
        isValid: true,
        message: "Monto válido",
        type: "success",
      });
    }

    // Calculate predictions
    const percentageOfBalance = (numValue / balance) * 100;

    // Get account for gas estimation
    const account = getAccount(config);
    const targetAddress = account.address || "";

    // Estimate gas using improved calculation
    const gasEstimate = await calculateApproximateGas(
      value,
      chainID.mainnet.celo
    );

    // Calculate USD value using price feed
    const usdValue = await calculateUSDValue(value, chainID.mainnet.celo);

    // Debug price feed
    await debugPriceFeed(chainID.mainnet.celo, value);

    setAmountPrediction({
      percentageOfBalance: percentageOfBalance,
      usdValue: usdValue,
      gasEstimate: gasEstimate,
    });

    // Update gas estimate with real simulation if user has been idle for 2 seconds
    setTimeout(async () => {
      if (value === amount && account.address) {
        try {
          const realGasEstimate = await estimateWrapGas(
            value,
            account.address,
            parseInt(domainID),
            quote || undefined
          );
          setAmountPrediction((prev) =>
            prev
              ? {
                  ...prev,
                  gasEstimate: realGasEstimate,
                }
              : null
          );
        } catch (error) {
          console.log("Could not get real gas estimate, using approximation");
        }
      }
    }, 2000);
  }

  function setMaxAmount() {
    const balance = parseFloat(celoBalance);
    if (balance > 0) {
      setAmount(balance.toString());
      validateAndPredictAmount(balance.toString()).catch(console.error);
      toast.success(
        `Monto establecido al máximo: ${formatTokenAmount(balance, "cCOP")}`,
        {
          position: "bottom-right",
          style: { background: "#333", color: "#fff" },
        }
      );
    } else {
      toast.error("No hay saldo disponible", {
        position: "bottom-right",
        style: { background: "#333", color: "#fff" },
      });
    }
  }

  function checkChainAndChange() {
    const account = getAccount(config);
    if (account.chainId !== chainID.mainnet.celo) {
      switchChain(config, { chainId: chainID.mainnet.celo })
        .then(notifyChangeChain)
        .catch((error) => {
          console.log("Could not switch chain automatically:", error);
          // Don't show error to user, just log it
          // The user can manually switch chains if needed
        });
    }
  }

  function setAllowance() {
    checkChainAndChange();

    // Check if we're on mobile
    const mobileDevice = isMobile();

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

    // Show loading toast for mobile
    if (mobileDevice) {
      toast.loading(getMobileLoadingMessage("allowance"), {
        position: "bottom-right",
        style: { background: "#333", color: "#fff" },
      });
    }

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

        // Dismiss loading toast if mobile
        if (mobileDevice) {
          toast.dismiss();
        }

        setTimeout(() => {
          verifyTokenAllowanceAndPriceForSend();
        }, 2500);
      })
      .catch((error) => {
        console.error("Error setting allowance:", error);
        setAllowanceIsMoreThanAmount(false);
        toast.error(
          mobileDevice
            ? getMobileErrorMessage("Allowance")
            : "Error setting allowance",
          {
            position: "bottom-right",
            style: { background: "#333", color: "#fff" },
          }
        );
      });
  }

  function wrap() {
    if (quote === null) return;
    const account = getAccount(config);
    if (!account.address) return;

    // Check if we're on mobile
    const mobileDevice = isMobile();

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

    // Show loading toast for mobile
    if (mobileDevice) {
      toast.loading(getMobileLoadingMessage("wrap"), {
        position: "bottom-right",
        style: { background: "#333", color: "#fff" },
      });
    }

    simulateContract(config, {
      chainId: chainID.mainnet.celo,
      abi: treasury.abi,
      address: address.mainnet.treasury as `0x${string}`,
      functionName: "wrap",
      args: [domainID, targetAddress, amountFixed],
      value: quote + BigInt(1),
      dataSuffix: `0x${referralTag}` as `0x${string}`,
    })
      .then((data) => {
        const msgIdentifier = data.result;

        // Dismiss loading toast if mobile
        if (mobileDevice) {
          toast.dismiss();
        }

        writeContract(config, {
          chainId: chainID.mainnet.celo,
          abi: treasury.abi,
          address: address.mainnet.treasury as `0x${string}`,
          functionName: "wrap",
          args: [domainID, targetAddress, amountFixed],
          value: quote + BigInt(1),
          dataSuffix: `0x${referralTag}` as `0x${string}`,
        })
          .then((txHash) => {
            // Submit Divvi referral
            submitDivviReferral(txHash, chainID.mainnet.celo);

            notifyWrapAction(
              waitForIsDelivered(msgIdentifier, 5000, 20),
              txHash,
              refreshBalances
            );
          })
          .catch((error) => {
            console.error("Error in wrap transaction:", error);
            toast.error(
              mobileDevice
                ? getMobileErrorMessage("Wrap")
                : "Error wrapping cCOP tokens",
              {
                position: "bottom-right",
                style: { background: "#333", color: "#fff" },
              }
            );
          })
          .finally(() => {});
      })
      .catch((error) => {
        console.error("Error simulating wrap transaction:", error);
        toast.error(
          mobileDevice
            ? getMobileErrorMessage("Transaction preparation")
            : "Error preparing wrap transaction",
          {
            position: "bottom-right",
            style: { background: "#333", color: "#fff" },
          }
        );
      });
  }

  // --- Render ---
  return (
    <>
      <BalanceIndicators />

      <div className={styles.amountContainer}>
        <label className={styles.amountLabel}>Amount</label>
        <div className={styles.amountInputContainer}>
          <input
            className={`${styles.amountInput} ${
              amountValidation?.type === "error" ? styles.amountInputError : ""
            }`}
            placeholder="Enter amount of cCOP tokens to wrap"
            value={amount}
            onChange={handleAmountChange}
            type="number"
            step="0.01"
            min="0"
          />
          <button
            className={styles.maxButton}
            onClick={setMaxAmount}
            type="button"
            title="Set maximum amount"
          >
            MAX
          </button>
        </div>

        {/* Validation Message */}
        {amountValidation && (
          <div
            className={`${styles.validationMessage} ${
              styles[
                `validation${
                  amountValidation.type.charAt(0).toUpperCase() +
                  amountValidation.type.slice(1)
                }`
              ]
            }`}
          >
            {amountValidation.message}
          </div>
        )}

        {/* Predictions */}
        {amountPrediction && amountValidation?.isValid && (
          <div className={styles.predictionContainer}>
            <div className={styles.predictionItem}>
              <span className={styles.predictionLabel}>
                Porcentaje del saldo:
              </span>
              <span className={styles.predictionValue}>
                {amountPrediction.percentageOfBalance?.toFixed(1)}%
              </span>
            </div>
            <div className={styles.predictionItem}>
              <span className={styles.predictionLabel}>Valor aproximado:</span>
              <span className={styles.predictionValue}>
                {amountPrediction.usdValue}
              </span>
            </div>
          </div>
        )}

        {/* Percentage Buttons */}
        <div className={styles.percentageButtons}>
          <button
            className={styles.percentageButton}
            onClick={() => {
              const balance = parseFloat(celoBalance);
              const amount25 = (balance * 0.25).toFixed(2);
              setAmount(amount25);
              validateAndPredictAmount(amount25).catch(console.error);
            }}
            type="button"
          >
            25%
          </button>
          <button
            className={styles.percentageButton}
            onClick={() => {
              const balance = parseFloat(celoBalance);
              const amount50 = (balance * 0.5).toFixed(2);
              setAmount(amount50);
              validateAndPredictAmount(amount50).catch(console.error);
            }}
            type="button"
          >
            50%
          </button>
          <button
            className={styles.percentageButton}
            onClick={() => {
              const balance = parseFloat(celoBalance);
              const amount75 = (balance * 0.75).toFixed(2);
              setAmount(amount75);
              validateAndPredictAmount(amount75).catch(console.error);
            }}
            type="button"
          >
            75%
          </button>
          <button
            className={styles.percentageButton}
            onClick={() => {
              const balance = parseFloat(celoBalance);
              setAmount(balance.toString());
              validateAndPredictAmount(balance.toString()).catch(console.error);
            }}
            type="button"
          >
            100%
          </button>
        </div>
      </div>
      <div className={styles.chainSelectorContainer}>
        <div className={styles.chainSelectorHeader}>
          <label className={styles.chainSelectorLabel}>Wrap on:</label>
        </div>
        <div className={styles.chainSelector}>
          <button
            className={`${styles.chainOption} ${
              domainID === "8453" ? styles.chainOptionActive : ""
            }`}
            onClick={() => setDomainID("8453")}
          >
            <Image src="/assets/Base.png" alt="Base" width={24} height={24} />
            <span>Base</span>
          </button>
          <button
            className={`${styles.chainOption} ${
              domainID === "42161" ? styles.chainOptionActive : ""
            }`}
            onClick={() => setDomainID("42161")}
          >
            <Image
              src="/assets/Arbitrum.png"
              alt="Arbitrum"
              width={24}
              height={24}
            />
            <span>Arbitrum</span>
          </button>
        </div>
      </div>
      {/* Transaction Costs Section */}
      {(formattedPrice || (amountPrediction && amountValidation?.isValid)) && (
        <div className={styles.transactionCostsContainer}>
          <label className={styles.sectionLabel}>Costos de Transacción</label>

          {formattedPrice && (
            <div className={styles.costItem}>
              <span className={styles.costLabel}>Precio de wrapping:</span>
              <span className={styles.costValue}>{formattedPrice}</span>
            </div>
          )}

          {amountPrediction &&
            amountValidation?.isValid &&
            amountPrediction.gasEstimate && (
              <>
                <div className={styles.costItem}>
                  <span className={styles.costLabel}>Gas estimado:</span>
                  <span className={styles.costValue}>
                    {amountPrediction.gasEstimate}
                  </span>
                </div>
                {quote && (
                  <SelfGasFeeSponsorshipComponent quote={quote} />
                )}
              </>
            )}
        </div>
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

      <div className={styles.addressSelector} style={{ marginTop: 20 }}>
        <label className={styles.sectionLabel}>Dirección de destino</label>
        <input
          className={`${styles.addressInput} ${
            differentAddressFlag
              ? styles.addressInputEditable
              : styles.addressInputReadOnly
          }`}
          value={differentAddressFlag ? customAddress : connectedAddress}
          onChange={(e) => setCustomAddress(e.target.value)}
          readOnly={!differentAddressFlag}
          placeholder={
            differentAddressFlag ? "Ingresa la dirección de destino" : ""
          }
        />
        {!differentAddressFlag && (
          <span
            style={{
              fontSize: 13,
              color: "#aaa",
              marginTop: 4,
              display: "block",
              fontStyle: "italic",
            }}
          >
            Los tokens se enviarán a la misma dirección que actualmente está
            conectada
          </span>
        )}
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={differentAddressFlag}
            onChange={(e) => {
              if (e.target.checked) {
                toast(
                  (t) => (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                        minWidth: "300px",
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: "16px" }}>
                        Confirmar dirección diferente
                      </div>
                      <div style={{ fontSize: "14px", lineHeight: "1.4" }}>
                        ¿Estás seguro de que quieres enviar los tokens a una
                        dirección diferente? Verifica cuidadosamente la
                        dirección de destino.
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          justifyContent: "flex-end",
                        }}
                      >
                        <button
                          onClick={() => {
                            toast.dismiss(t.id);
                          }}
                          className={styles.toastButton}
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => {
                            setDifferentAddressFlag(true);
                            toast.dismiss(t.id);
                          }}
                          className={styles.toastButton}
                        >
                          Confirmar
                        </button>
                      </div>
                    </div>
                  ),
                  {
                    duration: 0,
                    position: "bottom-center",
                    style: {
                      background: "#232323",
                      color: "#fff",
                      border: "1px solid #444",
                      borderRadius: "8px",
                      padding: "16px",
                      bottom: "50%",
                      transform: "translateY(50%)",
                      marginBottom: "0",
                    },
                  }
                );
                return;
              }
              setDifferentAddressFlag(e.target.checked);
            }}
            className={styles.checkboxInput}
          />
          Enviar a otra dirección
        </label>
      </div>
    </>
  );
};
