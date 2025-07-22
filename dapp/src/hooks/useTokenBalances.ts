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

  const cCOPContractCelo = {
    address: address.mainnet.cCOP as `0x${string}`,
    abi: erc20Abi as Abi,
    chainId: chainID.mainnet.celo,
  } as const;

  const [tokenbalances, setTokenBalances] = useState({
    base: "0",
    arb: "0",
    celo: "0",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAccount, setCurrentAccount] = useState<string | null>(null);

  const refresh = useCallback(() => {
    const account = getAccount(config);
    
    if (!account.address) {
      setTokenBalances({ base: "0", arb: "0", celo: "0" });
      setCurrentAccount(null);
      return;
    }

    // Only refresh if the account has changed
    if (currentAccount === account.address) {
      return;
    }

    setCurrentAccount(account.address);
    setIsLoading(true);
    setError(null);

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
          ...cCOPContractCelo,
          functionName: "balanceOf",
          args: [account.address],
        },
      ],
    })
      .then((data) => {
        if (
          data[0].status === "success" &&
          data[1].status === "success" &&
          data[2].status === "success" &&
          typeof data[0].result === "bigint" &&
          typeof data[1].result === "bigint" &&
          typeof data[2].result === "bigint"
        ) {
          setTokenBalances({
            base: (data[0].result / BigInt(10 ** 18)).toString(),
            arb: (data[1].result / BigInt(10 ** 18)).toString(),
            celo: (data[2].result / BigInt(10 ** 18)).toString(),
          });
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
        setIsLoading(false);
      });
  }, [currentAccount]);

  // Force refresh function that bypasses account change check
  const forceRefresh = useCallback(() => {
    const account = getAccount(config);
    
    if (!account.address) {
      setTokenBalances({ base: "0", arb: "0", celo: "0" });
      return;
    }

    setIsLoading(true);
    setError(null);

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
          ...cCOPContractCelo,
          functionName: "balanceOf",
          args: [account.address],
        },
      ],
    })
      .then((data) => {
        if (
          data[0].status === "success" &&
          data[1].status === "success" &&
          data[2].status === "success" &&
          typeof data[0].result === "bigint" &&
          typeof data[1].result === "bigint" &&
          typeof data[2].result === "bigint"
        ) {
          setTokenBalances({
            base: (data[0].result / BigInt(10 ** 18)).toString(),
            arb: (data[1].result / BigInt(10 ** 18)).toString(),
            celo: (data[2].result / BigInt(10 ** 18)).toString(),
          });
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
        setIsLoading(false);
      });
  }, []);

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