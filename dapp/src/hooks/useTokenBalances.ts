import { useCallback, useEffect, useState } from "react";
import { getAccount, readContracts } from "@wagmi/core";
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

  const refresh = useCallback(() => {
    const account = getAccount(config);
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
    }).then((data) => {
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
      }
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...tokenbalances, refresh };
} 