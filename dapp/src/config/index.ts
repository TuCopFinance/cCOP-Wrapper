import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { mainnet, polygon, celo, arbitrum, base, optimism, avalanche } from "@reown/appkit/networks";
import type { AppKitNetwork } from "@reown/appkit/networks";
import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";

export const projectId = "35df4a7708f828a4182e8382ac81c981";

export const networks = [mainnet, polygon, celo, arbitrum, base, optimism, avalanche] as [
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

// Farcaster miniapp connector
export const farcasterConnector = farcasterMiniApp();
