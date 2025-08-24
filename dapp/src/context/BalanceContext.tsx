"use client";
import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";
import { formatTokenAmount } from "@/utils/price-feeds";
import { getAccount, readContracts, watchAccount } from "@wagmi/core";
import { address } from "@/constants/address";
import WrappedCCOP from "@/constants/abis/WrappedCCOP.json";
import { chainID } from "@/constants/chainID";
import { Abi, erc20Abi } from "viem";
import { config } from "@/config";

interface TokenBalances {
  base: string;
  arb: string;
  celo: string;
  op?: string;
}

interface BalanceContextType {
  balances: TokenBalances;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
  forceRefresh: () => void;
}

const BalanceContext = createContext<BalanceContextType | undefined>(undefined);

export const BalanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [balances, setBalances] = useState<TokenBalances>({
    base: "0",
    arb: "0",
    celo: "0",
  op: "0",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAccount, setCurrentAccount] = useState<string | null>(null);

  const wrappedCCOPContractBase = useMemo(() => ({
    address: address.mainnet.wrapToken.base as `0x${string}`,
    abi: WrappedCCOP.abi as Abi,
    chainId: chainID.mainnet.base,
  } as const), []);

  const wrappedCCOPContractArb = useMemo(() => ({
    address: address.mainnet.wrapToken.arb as `0x${string}`,
    abi: WrappedCCOP.abi as Abi,
    chainId: chainID.mainnet.arb,
  } as const), []);

  const wrappedCCOPContractOp = useMemo(() => ({
    address: address.mainnet.wrapToken.op as `0x${string}`,
    abi: WrappedCCOP.abi as Abi,
    chainId: chainID.mainnet.op,
  } as const), []);

  const cCOPContractCelo = useMemo(() => ({
    address: address.mainnet.cCOP as `0x${string}`,
    abi: erc20Abi as Abi,
    chainId: chainID.mainnet.celo,
  } as const), []);

  const refresh = useCallback(() => {
    console.log("=== GLOBAL REFRESH FUNCTION CALLED ===");
    const account = getAccount(config);
    console.log("Account:", account);
    
    if (!account.address) {
      console.log("No account address, setting balances to 0");
      setBalances({ base: "0", arb: "0", celo: "0" });
      setCurrentAccount(null);
      return;
    }

    // Update current account and refresh balances
    console.log("Setting current account and starting refresh...");
    setCurrentAccount(account.address);
    setIsLoading(true);
    setError(null);

    console.log("Reading contracts for balances...");
    readContracts(config, {
      contracts: [
        {
          ...wrappedCCOPContractBase,
          functionName: "balanceOf",
          args: [account.address],
        },
        {
          ...wrappedCCOPContractArb,
          functionName: "balanceOf",
          args: [account.address],
        },
        {
          ...wrappedCCOPContractOp,
          functionName: "balanceOf",
          args: [account.address],
        },
        {
          ...cCOPContractCelo,
          functionName: "balanceOf",
          args: [account.address],
        },
      ],
    })
      .then((data) => {
        console.log("=== GLOBAL CONTRACTS READ SUCCESS ===");
        console.log("Contract data:", data);
        
        if (
          data[0].status === "success" &&
          data[1].status === "success" &&
          data[2].status === "success" &&
          data[3].status === "success" &&
          typeof data[0].result === "bigint" &&
          typeof data[1].result === "bigint" &&
          typeof data[2].result === "bigint" &&
          typeof data[3].result === "bigint"
        ) {
          const newBalances = {
            base: (data[0].result / BigInt(10 ** 18)).toString(),
            arb: (data[1].result / BigInt(10 ** 18)).toString(),
            op: (data[2].result / BigInt(10 ** 18)).toString(),
            celo: (data[3].result / BigInt(10 ** 18)).toString(),
          };
          console.log("Setting new global balances:", newBalances);
          console.log("🎉 GLOBAL BALANCES UPDATED SUCCESSFULLY! 🎉");
          console.log("📊 New Global Total:", formatTokenAmount(parseFloat(newBalances.base) + parseFloat(newBalances.arb) + parseFloat(newBalances.celo), "cCOP"));
          setBalances(newBalances);
        } else {
          console.error("Failed to fetch balances:", data);
          setError("Failed to fetch balances");
        }
      })
      .catch((err) => {
        console.error("Error fetching balances:", err);
        setError("Error fetching balances");
      })
      .finally(() => {
        console.log("=== GLOBAL REFRESH COMPLETED ===");
        setIsLoading(false);
      });
  }, [wrappedCCOPContractBase, wrappedCCOPContractArb, cCOPContractCelo]);

  const forceRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  // Watch for account changes
  useEffect(() => {
    const unwatch = watchAccount(config, {
      onChange(account) {
        if (account.address !== currentAccount) {
          refresh();
        }
      },
    });

    return () => unwatch();
  }, [currentAccount, refresh]);

  // Initial load
  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <BalanceContext.Provider value={{ balances, isLoading, error, refresh, forceRefresh }}>
      {children}
    </BalanceContext.Provider>
  );
};

export const useGlobalBalances = () => {
  const context = useContext(BalanceContext);
  if (context === undefined) {
    throw new Error("useGlobalBalances must be used within a BalanceProvider");
  }
  return context;
};

// Export default for better compatibility
const BalanceContextExports = { BalanceProvider, useGlobalBalances };
export default BalanceContextExports; 