/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import { wagmiAdapter, projectId, networks } from '@/config'
import { WALLET_CONFIG, WALLET_THEME } from '@/config/wallet-config'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import React, { type ReactNode } from 'react'
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi'

// Set up queryClient with default options
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

// Get the current URL dynamically
const getCurrentUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  // Fallback for server-side rendering
  return process.env.NODE_ENV === 'production' 
    ? 'https://copwrapper.xyz' 
    : 'http://localhost:3001';
};

// Set up metadata
const metadata = {
  name: 'cCOP Wrapper',
  description: 'Cross-chain bridge for cCOP tokens - Wrap and unwrap cCOP tokens across Celo, Base, and Arbitrum networks',
  url: getCurrentUrl(),
  icons: [
    'https://avatars.githubusercontent.com/u/179229932',
    '/cCOP_token.png'
  ],
  verifyUrl: 'https://github.com/TuCopFinance/cCOP-Wrapper'
}

// Create the modal
export const modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks,
  metadata,
  themeMode: 'dark',
  features: {
    analytics: false,
    connectMethodsOrder: ["wallet"],
  },
  featuredWalletIds: WALLET_CONFIG.FEATURED_WALLETS,
  themeVariables: WALLET_THEME as any,
});

function ContextProvider({ children, cookies }: { children: ReactNode; cookies: string | null }) {
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies)

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default ContextProvider
