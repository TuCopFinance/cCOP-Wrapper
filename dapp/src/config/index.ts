import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { celo, arbitrum, base } from "@reown/appkit/networks";
import type { AppKitNetwork } from "@reown/appkit/networks";

export const projectId = "cc288e4b98a01891965ec3259e3d60d3";

export const networks = [celo, arbitrum, base] as [
  AppKitNetwork,
  ...AppKitNetwork[]
];

//Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
  ssr: true,
  projectId: projectId,
  networks: networks,
});

export const config = wagmiAdapter.wagmiConfig;
