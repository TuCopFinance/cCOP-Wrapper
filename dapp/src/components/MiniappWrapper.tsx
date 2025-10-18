'use client';

import { useEffect } from 'react';
import { useFarcaster } from '@/context/FarcasterContext';

export function MiniappWrapper({ children }: { children: React.ReactNode }) {
  const { isMiniapp } = useFarcaster();

  useEffect(() => {
    if (isMiniapp) {
      document.documentElement.classList.add('farcaster-miniapp');
      document.body.classList.add('farcaster-miniapp');
    } else {
      document.documentElement.classList.remove('farcaster-miniapp');
      document.body.classList.remove('farcaster-miniapp');
    }
  }, [isMiniapp]);

  return <>{children}</>;
}

