"use client";

import { useEffect, useState } from "react";
import { useConnect, useAccount } from "wagmi";
import { useFarcaster } from "@/context/FarcasterContext";
import { farcasterConnector } from "@/config";
import Image from "next/image";

export const ConnectButton = () => {
  const { isMiniapp, isReady, user } = useFarcaster();
  const { connect } = useConnect();
  const { isConnected } = useAccount();
  const [autoConnectAttempted, setAutoConnectAttempted] = useState(false);

  useEffect(() => {
    // Auto-connect when in Farcaster miniapp and not already connected
    if (isMiniapp && isReady && !isConnected && !autoConnectAttempted) {
      setAutoConnectAttempted(true);
      console.log('Auto-connecting Farcaster wallet...');
      
      try {
        connect({ connector: farcasterConnector });
      } catch (error) {
        console.error('Error auto-connecting Farcaster wallet:', error);
      }
    }
  }, [isMiniapp, isReady, isConnected, autoConnectAttempted, connect]);

  return (
    <div className="connect-button-container">
      {isMiniapp && user && (
        <div style={{ 
          fontSize: '12px', 
          color: '#888', 
          marginRight: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          {user.pfpUrl && (
            <Image 
              src={user.pfpUrl} 
              alt={user.username || 'User'} 
              width={20}
              height={20}
              style={{ 
                borderRadius: '50%' 
              }} 
            />
          )}
          <span>@{user.username || user.fid}</span>
        </div>
      )}
      <appkit-button />
    </div>
  );
};
