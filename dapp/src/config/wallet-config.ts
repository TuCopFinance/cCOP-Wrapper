// Wallet configuration constants
export const WALLET_CONFIG = {
  // Featured wallet IDs
  FEATURED_WALLETS: [
    "dcc6ce1fc698ea19c114e7afe1bc469f" // TuCop wallet
  ],
  
  // Supported wallet types
  SUPPORTED_WALLETS: [
    "metamask",
    "coinbase",
    "walletconnect",
    "rainbow",
    "trust",
    "imtoken",
    "tokenpocket",
    "1inch",
    "okx",
    "zerion",
    "phantom",
    "safe"
  ],
  
  // Connection timeout (in milliseconds)
  CONNECTION_TIMEOUT: 30000,
  
  // Retry configuration
  RETRY_CONFIG: {
    maxRetries: 3,
    retryDelay: 1000,
    maxRetryDelay: 30000
  }
};

// Theme configuration for wallets
export const WALLET_THEME = {
  '--w3m-accent': '#0f1225ff',
  '--w3m-color-bg-1': '#232323',
  '--w3m-color-fg-1': '#fff',
  '--w3m-color-fg-2': '#b0b0b0',
  '--w3m-border-radius': '8px',
} as const; 