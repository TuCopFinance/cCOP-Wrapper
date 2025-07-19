import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { celo, arbitrum, base } from '@reown/appkit/networks'
import type { AppKitNetwork } from '@reown/appkit/networks'


export const projectId = "d251071937c99e48e054a6b9b269d315"

if (!projectId) {
  throw new Error('Project ID is not defined')
}

export const networks = [celo, arbitrum, base] as [AppKitNetwork, ...AppKitNetwork[]]

//Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
  ssr: true,
  projectId,
  networks
})

export const config = wagmiAdapter.wagmiConfig