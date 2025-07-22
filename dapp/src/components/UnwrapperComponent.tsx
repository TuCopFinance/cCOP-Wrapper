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
import { generateReferralTag, submitDivviReferral } from "@/utils/divvi";
import { BalanceIndicators } from "./BalanceIndicators";

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

  const account = getAccount(config);
  const connectedAddress = account.address || "";
  const [customAddress, setCustomAddress] = useState("");

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
    if (!account.address) return;
    
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

    const targetAddress = differentAddressFlag
      ? differentAddressInput?.value || account.address || ""
      : (account.address as `0x${string}`);

    // Generate Divvi referral tag
    const referralTag = generateReferralTag(account.address);

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
        const msgIdentifier = data.result;

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
            // Submit Divvi referral
            submitDivviReferral(txHash, targetChainIdContract);
            
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
      <BalanceIndicators />
      <div className={styles.chainSelectorContainer}>
        <p className={styles.unwrapToLabel}>Chain to unwrap:</p>
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
      <label className={styles.amountLabel}>Amount</label>
      <input
        className={styles.amountInput}
        placeholder="Enter amount of cCOP tokens to wrap"
        value={amount}
        onChange={handleAmountChange}
      />

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
        <label style={{ fontWeight: 600, marginBottom: 8, display: 'block', color: '#fff' }}>Dirección de destino</label>
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
        <label style={{ display: 'flex', alignItems: 'center', marginTop: 12, fontSize: 14, color: '#fff' }}>
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
