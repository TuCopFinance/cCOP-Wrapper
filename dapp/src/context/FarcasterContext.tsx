/**
 * Farcaster Context Provider
 * Manages Farcaster miniapp state and provides SDK access throughout the app
 */

'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  isFarcasterMiniapp, 
  getFarcasterContext, 
  getFarcasterUser,
  initializeFarcasterSDK,
  ensureReadyCalled
} from '@/utils/farcaster';

interface FarcasterUser {
  fid?: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
}

interface FarcasterContextType {
  isMiniapp: boolean;
  isReady: boolean;
  user: FarcasterUser | null;
  context: unknown;
}

const FarcasterContext = createContext<FarcasterContextType>({
  isMiniapp: false,
  isReady: false,
  user: null,
  context: null,
});

export function useFarcaster() {
  const context = useContext(FarcasterContext);
  if (!context) {
    throw new Error('useFarcaster must be used within FarcasterProvider');
  }
  return context;
}

interface FarcasterProviderProps {
  children: ReactNode;
}

export function FarcasterProvider({ children }: FarcasterProviderProps) {
  const [isMiniapp, setIsMiniapp] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState<FarcasterUser | null>(null);
  const [context, setContext] = useState<unknown>(null);

  useEffect(() => {
    // Check if running in Farcaster miniapp
    const checkMiniapp = isFarcasterMiniapp();
    setIsMiniapp(checkMiniapp);

    // Always call the safety mechanism to prevent infinite loading
    const safetyTimer = setTimeout(() => {
      ensureReadyCalled();
    }, 500);

    if (checkMiniapp) {
      // Wait for the next tick to ensure the app has rendered
      const timer = setTimeout(async () => {
        try {
          // Initialize SDK
          const success = await initializeFarcasterSDK();
          
          if (success) {
            setIsReady(true);
            
            // Get context and user info
            const farcasterContext = getFarcasterContext();
            setContext(farcasterContext);
            
            const farcasterUser = await getFarcasterUser();
            setUser(farcasterUser);
            
            console.log('✅ Farcaster miniapp detected and initialized:', {
              user: farcasterUser,
              context: farcasterContext,
            });
          } else {
            console.warn('⚠️ Farcaster SDK initialization failed');
            setIsReady(true); // Mark as ready anyway to avoid infinite loading
          }
        } catch (error) {
          console.error('❌ Failed to initialize Farcaster SDK:', error);
          setIsReady(true); // Mark as ready anyway to avoid infinite loading
        }
      }, 100); // Small delay to ensure DOM is ready

      return () => {
        clearTimeout(timer);
        clearTimeout(safetyTimer);
      };
    } else {
      // Not in miniapp, but still call ready() as safety measure
      ensureReadyCalled();
      setIsReady(true);
      
      return () => clearTimeout(safetyTimer);
    }
  }, []);

  const value: FarcasterContextType = {
    isMiniapp,
    isReady,
    user,
    context,
  };

  return (
    <FarcasterContext.Provider value={value}>
      {children}
    </FarcasterContext.Provider>
  );
}

