'use client';

import { useEffect } from 'react';
import { useFarcaster } from '@/context/FarcasterContext';

export function MiniappWrapper({ children }: { children: React.ReactNode }) {
  const { isMiniapp } = useFarcaster();

  useEffect(() => {
    if (isMiniapp) {
      console.log('🎨 Aplicando clases CSS de Farcaster miniapp');
      document.documentElement.classList.add('farcaster-miniapp');
      document.body.classList.add('farcaster-miniapp');
      console.log('✅ Clases aplicadas:', {
        html: document.documentElement.className,
        body: document.body.className,
      });

      // Verificar que los estilos se estén aplicando
      setTimeout(() => {
        const chainSelector = document.querySelector('[class*="chainSelector"]');
        if (chainSelector) {
          const styles = window.getComputedStyle(chainSelector);
          console.log('🎨 Estilos computados del chainSelector:', {
            display: styles.display,
            gridTemplateColumns: styles.gridTemplateColumns,
            gap: styles.gap,
            width: styles.width,
          });
        }
      }, 500);
    } else {
      console.log('🎨 Removiendo clases CSS de Farcaster miniapp (no está en miniapp)');
      document.documentElement.classList.remove('farcaster-miniapp');
      document.body.classList.remove('farcaster-miniapp');
    }
  }, [isMiniapp]);

  return <>{children}</>;
}

