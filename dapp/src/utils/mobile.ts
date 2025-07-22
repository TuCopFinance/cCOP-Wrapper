// Mobile detection utility
export const isMobile = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Check if MetaMask is available
export const isMetaMaskAvailable = (): boolean => {
  return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
};

// Check if we're in MetaMask mobile browser
export const isMetaMaskMobile = (): boolean => {
  return isMobile() && isMetaMaskAvailable() && Boolean(window.ethereum?.isMetaMask);
};

// Get mobile-specific error message
export const getMobileErrorMessage = (action: string): string => {
  if (isMetaMaskMobile()) {
    return `${action} failed. Please check MetaMask and try again.`;
  }
  return `Error ${action.toLowerCase()}`;
};

// Get mobile-specific loading message
export const getMobileLoadingMessage = (action: string): string => {
  if (isMetaMaskMobile()) {
    return `Preparing ${action.toLowerCase()} transaction for mobile MetaMask...`;
  }
  return `Preparing ${action.toLowerCase()} transaction...`;
}; 