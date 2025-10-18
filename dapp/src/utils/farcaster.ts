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
    // Primary detection: Check user agent or referrer FIRST
    // This is the most reliable method
    const isFarcasterUserAgent = navigator.userAgent.includes('Farcaster');
    const isFarcasterReferrer = document.referrer.includes('farcaster') ||
                                document.referrer.includes('warpcast');

    if (isFarcasterUserAgent || isFarcasterReferrer) {
      console.log('🎯 Farcaster miniapp detected via user agent/referrer');
      return true;
    }

    // Secondary: Check for Farcaster-specific window properties
    const windowWithFarcaster = window as Window & { farcaster?: unknown; fc?: unknown };
    if (windowWithFarcaster.farcaster || windowWithFarcaster.fc) {
      console.log('🎯 Farcaster miniapp detected via window object');
      return true;
    }

    // Last resort: Check SDK context only if other methods failed
    // SDK context alone is not reliable as it may exist outside Farcaster
    if (sdk.context && typeof sdk.context === 'object' && 'user' in sdk.context) {
      console.log('🎯 Farcaster miniapp detected via SDK context');
      return true;
    }

    console.log('ℹ️ Not running in Farcaster miniapp');
    return false;
  } catch (error) {
    console.warn('⚠️ Error detecting Farcaster miniapp:', error);
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
    console.log('✅ Farcaster SDK initialized - ready() called successfully');
    return true;
  } catch (error) {
    console.error('❌ Error calling sdk.actions.ready():', error);
    return false;
  }
}

/**
 * Call ready() with a timeout to prevent infinite loading
 * This is a safety mechanism that should be called regardless of detection
 */
export async function ensureReadyCalled(): Promise<void> {
  if (typeof window === 'undefined') return;
  
  try {
    // Always try to call ready() if SDK is available
    if (sdk && sdk.actions && sdk.actions.ready) {
      await sdk.actions.ready();
      console.log('✅ Safety: sdk.actions.ready() called');
    }
  } catch (error) {
    // Silently fail - this is just a safety mechanism
    console.debug('Safety mechanism: Could not call ready():', error);
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

