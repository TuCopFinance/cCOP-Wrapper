import { getDefaultConfig } from 'connectkit';
import { createConfig } from 'wagmi';
import { celoAlfajores, base, celo } from 'viem/chains';

const config = createConfig(
  getDefaultConfig({
    chains: [celo, base],
    walletConnectProjectId: 'your-project-id',
    appName: 'wrapped-ccop',
  })
);

export default config;
