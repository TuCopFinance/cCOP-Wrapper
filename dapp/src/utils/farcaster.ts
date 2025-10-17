/**
 * Farcaster Miniapp Utilities
 * Helper functions for detecting and interacting with Farcaster environment
 */

import { sdk } from '@farcaster/miniapp-sdk';

/**
 * Check if the app is running inside a Farcaster miniapp context
 */
export function isFarcasterMiniapp(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    // Check if SDK is available and context is valid
    return sdk.context !== null && sdk.context !== undefined;
  } catch {
    return false;
  }
}

/**
 * Get the current Farcaster context
 */
export function getFarcasterContext() {
  if (!isFarcasterMiniapp()) return null;
  
  try {
    return sdk.context;
  } catch {
    return null;
  }
}

/**
 * Initialize the Farcaster SDK and signal app is ready
 */
export async function initializeFarcasterSDK(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  
  try {
    // Signal that the miniapp is ready to be displayed
    await sdk.actions.ready();
    console.log('Farcaster SDK initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing Farcaster SDK:', error);
    return false;
  }
}

/**
 * Get the connected Farcaster user information
 */
export async function getFarcasterUser() {
  const context = getFarcasterContext();
  if (!context) return null;
  
  try {
    // Await the context if it's a promise
    const resolvedContext = await Promise.resolve(context);
    return {
      fid: resolvedContext.user?.fid,
      username: resolvedContext.user?.username,
      displayName: resolvedContext.user?.displayName,
      pfpUrl: resolvedContext.user?.pfpUrl,
    };
  } catch {
    return null;
  }
}

/**
 * Check if running in development mode
 */
export function isFarcasterDevMode(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
}

