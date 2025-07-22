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
import { BalanceIndicators } from "./BalanceIndicators";
import { useTokenBalances } from "@/hooks/useTokenBalances";

// --- Helper function for blockchain explorer links ---
const getExplorerLink = (chainId: number, txHash: string): string => {
  switch (chainId) {
    case 42220: // Celo Mainnet
      return `https://explorer.celo.org/tx/${txHash}`;
    case 44787: // Celo Alfajores Testnet
      return `https://alfajores-blockscout.celo-testnet.org/tx/${txHash}`;
    case 8453: // Base Mainnet
      return `https://basescan.org/tx/${txHash}`;
    case 84532: // Base Sepolia Testnet
      return `https://sepolia.basescan.org/tx/${txHash}`;
    case 42161: // Arbitrum One
      return `https://arbiscan.io/tx/${txHash}`;
    case 421614: // Arbitrum Sepolia Testnet
      return `https://sepolia.arbiscan.io/tx/${txHash}`;
    default:
      return `https://explorer.celo.org/tx/${txHash}`;
  }
};

// --- Notification helpers ---
const notifyChangeChain = () =>
  toast("Changing to Celo network", {
    duration: 2000,
    position: "bottom-right",
    style: { background: "#333", color: "#fff" },
  });

const notifyWrapAction = (deliveredPromise: Promise<any>, txHash?: string) => {
  const successMessage = txHash 
    ? `cCOP tokens wrapped successfully! <a href="${getExplorerLink(42220, txHash)}" target="_blank" style="color: #007bff; text-decoration: underline;">View Transaction</a>`
    : `cCOP tokens wrapped successfully!`;
    
  const errorMessage = txHash
    ? `Error wrapping cCOP tokens. <a href="${getExplorerLink(42220, txHash)}" target="_blank" style="color: #ff4444; text-decoration: underline;">View Transaction</a>`
    : `Error wrapping cCOP tokens, please check hyperlane explorer using your transaction hash`;

  return toast.promise(
    deliveredPromise,
    {
      loading: "Wrapping cCOP tokens...",
      success: successMessage,
      error: errorMessage,
    },
    {
      position: "bottom-right",
      style: { background: "#707070", color: "#fff" },
      success: { duration: 8000, icon: "✅" },
      error: { duration: 12000, icon: "❌" },
    }
  );
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
    type: 'success' | 'error' | 'warning' | 'info';
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

  const account = getAccount(config);
  const connectedAddress = account.address || "";
  const [customAddress, setCustomAddress] = useState("");
  
  // Get token balances
  const { celo: celoBalance, refresh: refreshBalances } = useTokenBalances();

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

  // Revalidate amount when balance changes
  useEffect(() => {
    if (amount) {
      validateAndPredictAmount(amount);
    }
  }, [celoBalance]);

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
    const balance = parseFloat(celoBalance);

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

    if (numValue > balance) {
      setAmountValidation({
        isValid: false,
        message: `Saldo insuficiente. Disponible: ${balance.toFixed(2)} cCOP`,
        type: 'error'
      });
    } else if (numValue === balance) {
      setAmountValidation({
        isValid: true,
        message: "Usando todo el saldo disponible",
        type: 'success'
      });
    } else if (numValue > balance * 0.9) {
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
    const percentageOfBalance = (numValue / balance) * 100;
    setAmountPrediction({
      percentageOfBalance: percentageOfBalance,
      usdValue: `~$${(numValue * 0.1).toFixed(2)}`, // Approximate USD value (you can integrate real price API)
      gasEstimate: `${(numValue * 0.001).toFixed(4)} CELO` // Approximate gas estimate
    });
  }

  function setMaxAmount() {
    const balance = parseFloat(celoBalance);
    if (balance > 0) {
      setAmount(balance.toString());
      validateAndPredictAmount(balance.toString());
      toast.success(`Monto establecido al máximo: ${balance.toFixed(2)} cCOP`, {
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
            
            notifyWrapAction(waitForIsDelivered(msgIdentifier, 5000, 20), txHash);
          })
          .catch(() => {})
          .finally(() => {});
      })
      .catch(() => {});
  }

  // --- Render ---
  return (
    <>
      <BalanceIndicators />
      
      <div className={styles.amountContainer}>
        <label className={styles.amountLabel}>Amount</label>
        <div className={styles.amountInputContainer}>
          <input
            className={`${styles.amountInput} ${amountValidation?.type === 'error' ? styles.amountInputError : ''}`}
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
              const balance = parseFloat(celoBalance);
              const amount25 = (balance * 0.25).toFixed(2);
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
              const balance = parseFloat(celoBalance);
              const amount50 = (balance * 0.5).toFixed(2);
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
              const balance = parseFloat(celoBalance);
              const amount75 = (balance * 0.75).toFixed(2);
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
              const balance = parseFloat(celoBalance);
              setAmount(balance.toString());
              validateAndPredictAmount(balance.toString());
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
            className={`${styles.chainOption} ${domainID === '8453' ? styles.chainOptionActive : ''}`}
            onClick={() => setDomainID('8453')}
          >
            <img src="assets/Base.png" alt="Base" />
            <span>Base</span>
          </button>
          <button
            className={`${styles.chainOption} ${domainID === '42161' ? styles.chainOptionActive : ''}`}
            onClick={() => setDomainID('42161')}
          >
            <img src="assets/Arbitrum.png" alt="Arbitrum" />
            <span>Arbitrum</span>
          </button>
        </div>
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
