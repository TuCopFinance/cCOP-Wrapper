/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";
import React, { useState, useEffect, useCallback } from "react";
import styles from "./UnwrapperComponent.module.css";
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
import WrappedCCOP from "@/constants/abis/WrappedCCOP.json";
import toast from "react-hot-toast";
import { waitForIsDelivered } from "../utils/hyperlane";
import type { Abi } from "viem";
import { generateReferralTag, submitDivviReferral } from "@/utils/divvi";
import { getReferralTag } from "@divvi/referral-sdk";
import { BalanceIndicators } from "./BalanceIndicators";
import { useTokenBalances } from "@/hooks/useTokenBalances";
import { useWalletClient } from "wagmi";
import { isMobile, getMobileErrorMessage, getMobileLoadingMessage } from "@/utils/mobile";

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
    case 42220: return "Celo";
    case 44787: return "Celo Testnet";
    case 8453: return "Base";
    case 84532: return "Base Testnet";
    case 42161: return "Arbitrum";
    case 421614: return "Arbitrum Testnet";
    default: return "Unknown";
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
const showTransactionToast = (isSuccess: boolean, chainId: number, txHash: string, action: string) => {
  const chainName = getChainName(chainId);
  const shortTxHash = `${txHash.slice(0, 6)}...${txHash.slice(-4)}`;
  const explorerUrl = getExplorerLink(chainId, txHash);
  
  const message = isSuccess 
    ? `cCOP tokens ${action} successfully!`
    : `Error ${action} cCOP tokens.`;
  
  const toastId = toast(
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div>{message}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '12px', opacity: 0.8 }}>
          Transaction: {chainName} ({shortTxHash})
        </span>
        <button
          onClick={() => {
            window.open(explorerUrl, '_blank');
            toast.dismiss(toastId);
          }}
          style={{
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '12px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
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
        minWidth: '300px'
      },
      duration: Infinity,
      icon: isSuccess ? "✅" : "❌"
    }
  );
};

const notifyChangeChain = (chainName: string): string =>
  toast(`Changing to ${chainName} network`, {
    duration: 2000,
    position: "bottom-right",
    style: { background: "#333", color: "#fff" },
  });

const notifyUnwrapAction = (deliveredPromise: Promise<unknown>, txHash?: string, chainId?: number) => {
  const targetChainId = chainId || 8453; // Default to Base
  
  // Show loading toast
  const loadingToast = toast.loading("Unwrapping cCOP tokens...", {
    position: "bottom-right",
    style: { background: "#707070", color: "#fff" },
  });
  
  deliveredPromise
    .then(() => {
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      // Show success toast
      if (txHash) {
        showTransactionToast(true, targetChainId, txHash, "unwrapped");
      } else {
        toast.success("cCOP tokens unwrapped successfully!", {
          position: "bottom-right",
          style: { background: "#707070", color: "#fff" },
          duration: Infinity,
          icon: "✅"
        });
      }
    })
    .catch((error) => {
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      // Show error toast
      if (txHash) {
        showTransactionToast(false, targetChainId, txHash, "unwrapping");
      } else {
        toast.error("Error unwrapping cCOP tokens, please check hyperlane explorer using your transaction hash", {
          position: "bottom-right",
          style: { background: "#707070", color: "#fff" },
          duration: Infinity,
          icon: "❌"
        });
      }
    });
};

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
  const [amountValidation, setAmountValidation] = useState<{
    isValid: boolean;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  } | null>(null);
  const [amountPrediction, setAmountPrediction] = useState<{
    usdValue?: string;
    percentageOfBalance?: number;
    gasEstimate?: string;
  } | null>(null);
  const [hasSufficientAmount, setHasSufficientAmount] =
    useState<boolean>(false);
  const [quote, setQuote] = useState<bigint | null>(null);
  const [chainToUnwrap, setChainToUnwrap] = useState("base");

  const { data: walletClient } = useWalletClient();

  const account = getAccount(config);
  const connectedAddress = account.address || "";
  const [customAddress, setCustomAddress] = useState("");
  
  // Get token balances
  const { base: baseBalance, arb: arbBalance, refresh: refreshBalances, forceRefresh: forceRefreshBalances } = useTokenBalances();

  // Refresh balances when chain changes
  useEffect(() => {
    refreshBalances();
  }, [chainToUnwrap, refreshBalances]);

  //Check allowance and get quote
  const verifyTokenAllowanceAndPriceForSend = useCallback(() => {
    console.log("=== VERIFY TOKEN ALLOWANCE AND PRICE DEBUG ===");
    const account = getAccount(config);
    console.log("Account in verify:", account);
    
    let amountFixed: bigint;
    try {
      amountFixed = BigInt(Math.floor(parseFloat(amount) * 10 ** 18));
      console.log("Amount fixed in verify:", amountFixed.toString());
    } catch (error) {
      console.error("Error converting amount in verify:", error);
      setHasSufficientAmount(false);
      setQuote(null);
      return;
    }

    const targetChainContract =
      chainToUnwrap === "base"
        ? wrappedCCOPContractBase
        : wrappedCCOPContractArb;

    console.log("Target chain contract:", targetChainContract);
    console.log("Chain to unwrap:", chainToUnwrap);

    const differentAddressInput = document.getElementById(
      "unwrapperAddressInput"
    ) as HTMLInputElement | null;
    
    const targetAddress = differentAddressFlag
      ? differentAddressInput?.value || account.address || ""
      : (account.address as `0x${string}`);
      
    console.log("Target address in verify:", targetAddress);
    console.log("Different address flag:", differentAddressFlag);

    console.log("=== READING CONTRACTS ===");
    console.log("Contracts to read:", [
      {
        ...targetChainContract,
        functionName: "balanceOf",
        args: [account.address as `0x${string}`],
      },
      {
        ...targetChainContract,
        functionName: "getQuote",
        args: [targetAddress, amountFixed],
      },
    ]);

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
          args: [targetAddress, amountFixed],
        },
      ],
    })
      .then((data) => {
        console.log("=== READ CONTRACTS SUCCESS ===");
        console.log("Read contracts data:", data);
        console.log("Data[0] status:", data[0].status);
        console.log("Data[1] status:", data[1].status);
        console.log("Data[0] result:", data[0].result);
        console.log("Data[1] result:", data[1].result);
        
        if (
          data[0].status === "success" &&
          data[1].status === "success" &&
          typeof data[0].result === "bigint" &&
          typeof data[1].result === "bigint"
        ) {
          console.log("Setting quote to:", data[1].result.toString());
          console.log("Setting has sufficient amount to:", data[0].result >= amountFixed);
          setQuote(data[1].result);
          setHasSufficientAmount(data[0].result >= amountFixed);
        } else {
          console.error("Failed to get valid data from contracts");
          console.error("Data[0] type:", typeof data[0].result);
          console.error("Data[1] type:", typeof data[1].result);
          setQuote(null);
          setHasSufficientAmount(false);
        }
      })
      .catch((error) => {
        console.error("=== READ CONTRACTS ERROR ===");
        console.error("Error reading contracts:", error);
        setQuote(null);
        setHasSufficientAmount(false);
      })
      .finally(() => {
        console.log("=== CHECKING CHAIN AND CHANGE ===");
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

  // Revalidate amount when chain changes
  useEffect(() => {
    if (amount) {
      validateAndPredictAmount(amount);
    }
  }, [chainToUnwrap, baseBalance, arbBalance]);

  // Handler: Amount input change
  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setAmount(value);
    
    // Validate and predict amount
    validateAndPredictAmount(value);
  }

  function validateAndPredictAmount(value: string) {
    if (!value || value === "") {
      setAmountValidation(null);
      setAmountPrediction(null);
      return;
    }

    const numValue = parseFloat(value);
    const currentBalance = chainToUnwrap === "base" ? parseFloat(baseBalance) : parseFloat(arbBalance);
    console.log(`validateAndPredictAmount - Chain: ${chainToUnwrap}, Value: ${value}, CurrentBalance: ${currentBalance}, BaseBalance: ${baseBalance}, ArbBalance: ${arbBalance}`);

    // Basic validation
    if (isNaN(numValue)) {
      setAmountValidation({
        isValid: false,
        message: "Por favor ingresa un número válido",
        type: 'error'
      });
      setAmountPrediction(null);
      return;
    }

    if (numValue <= 0) {
      setAmountValidation({
        isValid: false,
        message: "El monto debe ser mayor a 0",
        type: 'error'
      });
      setAmountPrediction(null);
      return;
    }

    if (numValue > currentBalance) {
      setAmountValidation({
        isValid: false,
        message: `Saldo insuficiente. Disponible: ${currentBalance.toFixed(2)} wcCOP`,
        type: 'error'
      });
    } else if (numValue === currentBalance) {
      setAmountValidation({
        isValid: true,
        message: "Usando todo el saldo disponible",
        type: 'success'
      });
    } else if (numValue > currentBalance * 0.9) {
      setAmountValidation({
        isValid: true,
        message: "Usando más del 90% del saldo",
        type: 'warning'
      });
    } else {
      setAmountValidation({
        isValid: true,
        message: "Monto válido",
        type: 'success'
      });
    }

    // Calculate predictions
    const percentageOfBalance = (numValue / currentBalance) * 100;
    setAmountPrediction({
      percentageOfBalance: percentageOfBalance,
      usdValue: `~$${(numValue * 0.1).toFixed(2)}`, // Approximate USD value
      gasEstimate: `${(numValue * 0.001).toFixed(4)} ${chainToUnwrap === "base" ? "ETH" : "ETH"}` // Approximate gas estimate
    });
  }

  function setMaxAmount() {
    const currentBalance = chainToUnwrap === "base" ? parseFloat(baseBalance) : parseFloat(arbBalance);
    console.log(`MAX Button - Chain: ${chainToUnwrap}, Balance: ${currentBalance}`);
    if (currentBalance > 0) {
      setAmount(currentBalance.toString());
      validateAndPredictAmount(currentBalance.toString());
      toast.success(`Monto establecido al máximo: ${currentBalance.toFixed(2)} wcCOP`, {
        position: "bottom-right",
        style: { background: "#333", color: "#fff" },
      });
    } else {
      toast.error("No hay saldo disponible", {
        position: "bottom-right",
        style: { background: "#333", color: "#fff" },
      });
    }
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
    console.log("=== UNWRAP DEBUG START ===");
    console.log("Quote:", quote);
    console.log("Amount:", amount);
    console.log("Chain to unwrap:", chainToUnwrap);
    console.log("Has sufficient amount:", hasSufficientAmount);
    
    if (quote === null) {
      console.error("Quote is null, cannot proceed with unwrap");
      return;
    }

    const account = getAccount(config);
    console.log("Account:", account);
    
    if (!account.address) {
      console.error("No account address found");
      return;
    }
    
    // Check if we're on mobile
    const mobileDevice = isMobile();
    console.log("Mobile device:", mobileDevice);
    
    let amountFixed: bigint;
    try {
      amountFixed = BigInt(Math.floor(parseFloat(amount) * 10 ** 18));
      console.log("Amount fixed:", amountFixed.toString());
    } catch (error) {
      console.error("Error converting amount to BigInt:", error);
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

    console.log("Target chain contract address:", targetChainContractAddress);
    console.log("Target chain ID:", targetChainIdContract);

    const targetAddress = differentAddressFlag
      ? differentAddressInput?.value || account.address || ""
      : (account.address as `0x${string}`);

    console.log("Target address:", targetAddress);
    console.log("Different address flag:", differentAddressFlag);

    // Generate Divvi referral tag
    const referralTag = generateReferralTag(account.address);
    console.log("Referral tag:", referralTag);

    // Show loading toast for mobile
    if (mobileDevice) {
      toast.loading(getMobileLoadingMessage("unwrap"), {
        position: "bottom-right",
        style: { background: "#333", color: "#fff" },
      });
    }

    console.log("=== SIMULATING CONTRACT ===");
    console.log("Contract config:", {
      chainId: targetChainIdContract,
      address: targetChainContractAddress,
      functionName: "unwrap",
      args: [targetAddress, amountFixed],
      value: quote + BigInt(1),
      dataSuffix: `0x${referralTag}`
    });

    simulateContract(config, {
      chainId: targetChainIdContract,
      abi: WrappedCCOP.abi,
      address: targetChainContractAddress as `0x${string}`,
      functionName: "unwrap",
      args: [
        targetAddress,
        amountFixed,
      ],
      value: quote + BigInt(1),
      dataSuffix: `0x${referralTag}` as `0x${string}`,
    })
      .then((data) => {
        console.log("=== SIMULATION SUCCESS ===");
        console.log("Simulation result:", data);
        const msgIdentifier = data.result;
        console.log("Message identifier:", msgIdentifier);
        
        // Dismiss loading toast if mobile
        if (mobileDevice) {
          toast.dismiss();
        }

        console.log("=== WRITING CONTRACT ===");
        writeContract(config, {
          chainId: targetChainIdContract,
          abi: WrappedCCOP.abi,
          address: targetChainContractAddress as `0x${string}`,
          functionName: "unwrap",
          args: [
            targetAddress,
            amountFixed,
          ],
          value: quote + BigInt(1), // Ensure value is set to quote if available
          dataSuffix: `0x${referralTag}` as `0x${string}`,
        })
          .then((txHash) => {
            console.log("=== WRITE SUCCESS ===");
            console.log("Transaction hash:", txHash);
            
            // Submit Divvi referral
            submitDivviReferral(txHash, targetChainIdContract);
            
            // Refresh balances after successful transaction
            setTimeout(() => {
              forceRefreshBalances();
              verifyTokenAllowanceAndPriceForSend();
            }, 3000); // Wait 3 seconds for transaction to be processed
            
            notifyUnwrapAction(waitForIsDelivered(msgIdentifier, 5000, 20), txHash, targetChainIdContract);
          })
          .catch((error) => {
            console.error("=== WRITE ERROR ===");
            console.error("Error unwrapping cCOP tokens:", error);
            console.error("Error details:", {
              message: error.message,
              code: error.code,
              data: error.data,
              stack: error.stack
            });
            toast.error(
              mobileDevice 
                ? getMobileErrorMessage("Unwrap") 
                : "Error unwrapping cCOP tokens",
              {
                position: "bottom-right",
                style: { background: "#333", color: "#fff" },
              }
            );
          });
      })
      .catch((error) => {
        console.error("=== SIMULATION ERROR ===");
        console.error("Error simulating unwrap transaction:", error);
        console.error("Error details:", {
          message: error.message,
          code: error.code,
          data: error.data,
          stack: error.stack
        });
        toast.error(
          mobileDevice 
            ? getMobileErrorMessage("Transaction preparation") 
            : "Error during unwrap check your wcCOP balance or ETH balance",
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
      <BalanceIndicators />
      
      <div className={styles.amountContainer}>
        <label className={styles.amountLabel}>Amount</label>
        <div className={styles.amountInputContainer}>
          <input
            className={`${styles.amountInput} ${amountValidation?.type === 'error' ? styles.amountInputError : ''}`}
            placeholder="Enter amount of wcCOP tokens to unwrap"
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
          <div className={`${styles.validationMessage} ${styles[`validation${amountValidation.type.charAt(0).toUpperCase() + amountValidation.type.slice(1)}`]}`}>
            {amountValidation.message}
          </div>
        )}
        
        {/* Predictions */}
        {amountPrediction && amountValidation?.isValid && (
          <div className={styles.predictionContainer}>
            <div className={styles.predictionItem}>
              <span className={styles.predictionLabel}>Porcentaje del saldo:</span>
              <span className={styles.predictionValue}>{amountPrediction.percentageOfBalance?.toFixed(1)}%</span>
            </div>
            <div className={styles.predictionItem}>
              <span className={styles.predictionLabel}>Valor aproximado:</span>
              <span className={styles.predictionValue}>{amountPrediction.usdValue}</span>
            </div>
            <div className={styles.predictionItem}>
              <span className={styles.predictionLabel}>Gas estimado:</span>
              <span className={styles.predictionValue}>{amountPrediction.gasEstimate}</span>
            </div>
          </div>
        )}
        
        {/* Percentage Buttons */}
        <div className={styles.percentageButtons}>
          <button
            className={styles.percentageButton}
            onClick={() => {
              const currentBalance = chainToUnwrap === "base" ? parseFloat(baseBalance) : parseFloat(arbBalance);
              const amount25 = (currentBalance * 0.25).toFixed(2);
              console.log(`25% Button - Chain: ${chainToUnwrap}, Balance: ${currentBalance}, Amount: ${amount25}`);
              setAmount(amount25);
              validateAndPredictAmount(amount25);
            }}
            type="button"
          >
            25%
          </button>
          <button
            className={styles.percentageButton}
            onClick={() => {
              const currentBalance = chainToUnwrap === "base" ? parseFloat(baseBalance) : parseFloat(arbBalance);
              const amount50 = (currentBalance * 0.5).toFixed(2);
              console.log(`50% Button - Chain: ${chainToUnwrap}, Balance: ${currentBalance}, Amount: ${amount50}`);
              setAmount(amount50);
              validateAndPredictAmount(amount50);
            }}
            type="button"
          >
            50%
          </button>
          <button
            className={styles.percentageButton}
            onClick={() => {
              const currentBalance = chainToUnwrap === "base" ? parseFloat(baseBalance) : parseFloat(arbBalance);
              const amount75 = (currentBalance * 0.75).toFixed(2);
              console.log(`75% Button - Chain: ${chainToUnwrap}, Balance: ${currentBalance}, Amount: ${amount75}`);
              setAmount(amount75);
              validateAndPredictAmount(amount75);
            }}
            type="button"
          >
            75%
          </button>
          <button
            className={styles.percentageButton}
            onClick={() => {
              const currentBalance = chainToUnwrap === "base" ? parseFloat(baseBalance) : parseFloat(arbBalance);
              console.log(`100% Button - Chain: ${chainToUnwrap}, Balance: ${currentBalance}`);
              setAmount(currentBalance.toString());
              validateAndPredictAmount(currentBalance.toString());
            }}
            type="button"
          >
            100%
          </button>
        </div>
      </div>

      <div className={styles.chainSelectorContainer}>
        <div className={styles.chainSelectorHeader}>
          <label className={styles.chainSelectorLabel}>Chain to unwrap:</label>
        </div>
        <div className={styles.chainSelector}>
          <button
            className={`${styles.chainOption} ${chainToUnwrap === 'base' ? styles.chainOptionActive : ''}`}
            onClick={() => setChainToUnwrap('base')}
          >
            <img src="assets/Base.png" alt="Base" />
            <span>Base</span>
          </button>
          <button
            className={`${styles.chainOption} ${chainToUnwrap === 'arbitrum' ? styles.chainOptionActive : ''}`}
            onClick={() => setChainToUnwrap('arbitrum')}
          >
            <img src="assets/Arbitrum.png" alt="Arbitrum" />
            <span>Arbitrum</span>
          </button>
        </div>
      </div>

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

      <div className={styles.addressSelector} style={{ marginTop: 20 }}>
        <label className={styles.sectionLabel}>Dirección de destino</label>
        <input
          className={styles.addressInput}
          value={differentAddressFlag ? customAddress : connectedAddress}
          onChange={e => setCustomAddress(e.target.value)}
          readOnly={!differentAddressFlag}
          style={{ 
            background: differentAddressFlag ? '#444444' : '#333', 
            color: '#fff', 
            width: '100%',
            border: '1px solid #555',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '14px'
          }}
          placeholder={differentAddressFlag ? "Ingresa la dirección de destino" : ""}
        />
        {!differentAddressFlag && (
          <span style={{ fontSize: 13, color: '#aaa', marginTop: 4, display: 'block', fontStyle: 'italic' }}>
            Los tokens se enviarán a la misma dirección que actualmente está conectada
          </span>
        )}
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={differentAddressFlag}
            onChange={e => {
              if (e.target.checked) {
                toast((t) => (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '300px' }}>
                    <div style={{ fontWeight: 600, fontSize: '16px' }}>Confirmar dirección diferente</div>
                    <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
                      ¿Estás seguro de que quieres enviar los tokens a una dirección diferente? Verifica cuidadosamente la dirección de destino.
                    </div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => {
                          toast.dismiss(t.id);
                        }}
                        style={{
                          padding: '6px 12px',
                          background: '#555',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => {
                          setDifferentAddressFlag(true);
                          toast.dismiss(t.id);
                        }}
                        style={{
                          padding: '6px 12px',
                          background: 'var(--primary)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Confirmar
                      </button>
                    </div>
                  </div>
                ), {
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
                    marginBottom: "0"
                  },
                });
                return;
              }
              setDifferentAddressFlag(e.target.checked);
            }}
            style={{ marginRight: 10, transform: 'scale(1.2)' }}
          />
          Enviar a otra dirección
        </label>
      </div>
    </>
  );
};
