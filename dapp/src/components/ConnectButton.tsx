"use client";

import { useEffect, useState } from "react";
import { useConnect, useAccount } from "wagmi";
import { useFarcaster } from "@/context/FarcasterContext";
import { farcasterConnector } from "@/config";

export const ConnectButton = () => {
  const { isMiniapp, isReady } = useFarcaster();
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
      <appkit-button />
    </div>
  );
};
