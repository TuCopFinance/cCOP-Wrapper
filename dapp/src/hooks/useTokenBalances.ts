/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useEffect, useState } from "react";
import { getAccount, readContracts, watchAccount } from "@wagmi/core";
import { address } from "@/constants/address";
import WrappedCCOP from "@/constants/abis/WrappedCCOP.json";
import { chainID } from "@/constants/chainID";
import { Abi, erc20Abi } from "viem";
import { config } from "@/config";

export function useTokenBalances() {
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

  const wrappedCCOPContractOp = {
    address: address.mainnet.wrapToken.op as `0x${string}`,
    abi: WrappedCCOP.abi as Abi,
    chainId: chainID.mainnet.op,
  } as const;

  const wrappedCCOPContractAvax = {
    address: address.mainnet.wrapToken.avax as `0x${string}`,
    abi: WrappedCCOP.abi as Abi,
    chainId: chainID.mainnet.avax,
  } as const;

  const cCOPContractCelo = {
    address: address.mainnet.cCOP as `0x${string}`,
    abi: erc20Abi as Abi,
    chainId: chainID.mainnet.celo,
  } as const;

  const [tokenbalances, setTokenBalances] = useState({
    base: "0",
    arb: "0",
  op: "0",
  avax: "0",
    celo: "0",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAccount, setCurrentAccount] = useState<string | null>(null);

  const refresh = useCallback(() => {
    console.log("=== REFRESH FUNCTION CALLED ===");
    const account = getAccount(config);
    console.log("Account:", account);
    
    if (!account.address) {
      console.log("No account address, setting balances to 0");
  setTokenBalances({ base: "0", arb: "0", op: "0", avax: "0", celo: "0" });
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
  { ...wrappedCCOPContractOp, functionName: "balanceOf", args: [account.address] },
  { ...wrappedCCOPContractAvax, functionName: "balanceOf", args: [account.address] },
  { ...cCOPContractCelo, functionName: "balanceOf", args: [account.address] },
      ],
    })
      .then((data) => {
        console.log("=== CONTRACTS READ SUCCESS ===");
        console.log("Contract data:", data);
        
      if (
        data[0].status === "success" &&
        data[1].status === "success" &&
        data[2].status === "success" &&
        data[3].status === "success" &&
        data[4].status === "success" &&
        typeof data[0].result === "bigint" &&
        typeof data[1].result === "bigint" &&
        typeof data[2].result === "bigint" &&
        typeof data[3].result === "bigint" &&
        typeof data[4].result === "bigint"
      ) {
          const newBalances = {
          base: (data[0].result / BigInt(10 ** 18)).toString(),
          arb: (data[1].result / BigInt(10 ** 18)).toString(),
          op: (data[2].result / BigInt(10 ** 18)).toString(),
          avax: (data[3].result / BigInt(10 ** 18)).toString(),
          celo: (data[4].result / BigInt(10 ** 18)).toString(),
          };
          console.log("Setting new balances:", newBalances);
          console.log("🎉 BALANCES UPDATED SUCCESSFULLY! 🎉");
          console.log("📊 New Total:", (parseFloat(newBalances.base) + parseFloat(newBalances.arb) + parseFloat(newBalances.op) + parseFloat(newBalances.avax) + parseFloat(newBalances.celo)).toFixed(2), "cCOP");
          setTokenBalances(newBalances);
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
        console.log("=== REFRESH COMPLETED ===");
        setIsLoading(false);
    });
  }, []);

  // Force refresh function that bypasses account change check
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

  return { ...tokenbalances, refresh, forceRefresh, isLoading, error };
}