'use client'

import React from 'react';
import { toast } from 'react-hot-toast';

// Helper functions for transaction links
const getExplorerLink = (chainId: number, txHash: string): string => {
  switch (chainId) {
    case 42220: // Celo Mainnet
      return `https://celoscan.io/tx/${txHash}`;
    case 44787: // Celo Alfajores Testnet
      return `https://alfajores.celoscan.io/tx/${txHash}`;
    case 8453: // Base Mainnet
      return `https://basescan.org/tx/${txHash}`;
    case 84532: // Base Sepolia Testnet
      return `https://sepolia.basescan.org/tx/${txHash}`;
    case 42161: // Arbitrum One
      return `https://arbiscan.io/tx/${txHash}`;
    case 421614: // Arbitrum Sepolia Testnet
      return `https://sepolia.arbiscan.io/tx/${txHash}`;
    default:
      return `https://celoscan.io/tx/${txHash}`;
  }
};

const getChainName = (chainId: number): string => {
  switch (chainId) {
    case 42220: return "Celo";
    case 44787: return "Celo Testnet";
    case 8453: return "Base";
    case 84532: return "Base Testnet";
    case 42161: return "Arbitrum";
    case 421614: return "Arbitrum Testnet";
    default: return "Unknown";
  }
};

const formatTransactionLink = (chainId: number, txHash: string): string => {
  const chainName = getChainName(chainId);
  const shortTxHash = `${txHash.slice(0, 6)}...${txHash.slice(-4)}`;
  
  return `${chainName} (${shortTxHash})`;
};

// Mock transaction hash generator
const generateMockTxHash = (): string => {
  return '0x' + Math.random().toString(16).substring(2, 66);
};

// Mock success transaction toast
const showMockSuccessToast = (chainId: number, action: string) => {
  const mockTxHash = generateMockTxHash();
  const chainName = getChainName(chainId);
  const shortTxHash = formatTransactionLink(chainId, mockTxHash);
  const explorerUrl = getExplorerLink(chainId, mockTxHash);
  
  const message = `cCOP tokens ${action} successfully!`;
  
  const toastId = toast(
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' }}>
      {/* Close button */}
      <button
        onClick={() => toast.dismiss(toastId)}
        style={{
          position: 'absolute',
          top: '-6px',
          right: '-6px',
          background: '#ff4444',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '12px',
          height: '12px',
          fontSize: '8px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          zIndex: 1000,
          lineHeight: '1'
        }}
        title="Close message"
      >
        ×
      </button>
      
      <div>{message}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '12px', opacity: 0.8 }}>
          Transaction: {chainName} ({shortTxHash})
        </span>
        <button
          onClick={() => {
            window.open(explorerUrl, '_blank');
            toast.dismiss(toastId);
          }}
          style={{
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '12px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          View
        </button>
      </div>
    </div>,
    {
      position: "bottom-right",
      style: { 
        background: "#707070", 
        color: "#fff",
        minWidth: '300px',
        position: 'relative'
      },
      duration: Infinity,
      icon: "✅"
    }
  );
};

// Mock error transaction toast
const showMockErrorToast = (chainId: number, action: string) => {
  const mockTxHash = generateMockTxHash();
  const chainName = getChainName(chainId);
  const shortTxHash = formatTransactionLink(chainId, mockTxHash);
  const explorerUrl = getExplorerLink(chainId, mockTxHash);
  
  const message = `Error ${action} cCOP tokens.`;
  
  const toastId = toast(
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' }}>
      {/* Close button */}
      <button
        onClick={() => toast.dismiss(toastId)}
        style={{
          position: 'absolute',
          top: '-6px',
          right: '-6px',
          background: '#ff4444',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '12px',
          height: '12px',
          fontSize: '8px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          zIndex: 1000,
          lineHeight: '1'
        }}
        title="Close message"
      >
        ×
      </button>
      
      <div>{message}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '12px', opacity: 0.8 }}>
          Transaction: {chainName} ({shortTxHash})
        </span>
        <button
          onClick={() => {
            window.open(explorerUrl, '_blank');
            toast.dismiss(toastId);
          }}
          style={{
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '12px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          View
        </button>
      </div>
    </div>,
    {
      position: "bottom-right",
      style: { 
        background: "#707070", 
        color: "#fff",
        minWidth: '300px',
        position: 'relative'
      },
      duration: Infinity,
      icon: "❌"
    }
  );
};

// Simple success toast
const showSimpleSuccessToast = (message: string) => {
  const toastId = toast(
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', position: 'relative' }}>
      <span>{message}</span>
      <button
        onClick={() => toast.dismiss(toastId)}
        style={{
          background: '#ff4444',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '12px',
          height: '12px',
          fontSize: '8px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          flexShrink: 0,
          lineHeight: '1'
        }}
        title="Close message"
      >
        ×
      </button>
    </div>,
    {
      position: "bottom-right",
      style: { 
        background: "#28a745", 
        color: "#fff",
        minWidth: '250px'
      },
      duration: Infinity
    }
  );
};

// Simple error toast
const showSimpleErrorToast = (message: string) => {
  const toastId = toast(
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', position: 'relative' }}>
      <span>{message}</span>
      <button
        onClick={() => toast.dismiss(toastId)}
        style={{
          background: '#ff4444',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '12px',
          height: '12px',
          fontSize: '8px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          flexShrink: 0,
          lineHeight: '1'
        }}
        title="Close message"
      >
        ×
      </button>
    </div>,
    {
      position: "bottom-right",
      style: { 
        background: "#dc3545", 
        color: "#fff",
        minWidth: '250px'
      },
      duration: Infinity
    }
  );
};

export const TestButtons = () => {
  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: 'rgba(0,0,0,0.8)',
      padding: '15px',
      borderRadius: '8px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      minWidth: '200px'
    }}>
      <h4 style={{ color: 'white', margin: '0 0 10px 0', fontSize: '14px' }}>🧪 Test Toasts</h4>
      
      {/* Wrap Success Tests */}
      <div style={{ borderBottom: '1px solid #333', paddingBottom: '8px', marginBottom: '8px' }}>
        <h5 style={{ color: '#28a745', margin: '0 0 5px 0', fontSize: '12px' }}>Wrap Success:</h5>
        <button
          onClick={() => showMockSuccessToast(42220, 'wrapped')}
          style={{
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '11px',
            cursor: 'pointer',
            margin: '2px'
          }}
        >
          Celo Wrap ✅
        </button>
        <button
          onClick={() => showMockSuccessToast(8453, 'wrapped')}
          style={{
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '11px',
            cursor: 'pointer',
            margin: '2px'
          }}
        >
          Base Wrap ✅
        </button>
        <button
          onClick={() => showMockSuccessToast(42161, 'wrapped')}
          style={{
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '11px',
            cursor: 'pointer',
            margin: '2px'
          }}
        >
          Arbitrum Wrap ✅
        </button>
      </div>

      {/* Unwrap Success Tests */}
      <div style={{ borderBottom: '1px solid #333', paddingBottom: '8px', marginBottom: '8px' }}>
        <h5 style={{ color: '#28a745', margin: '0 0 5px 0', fontSize: '12px' }}>Unwrap Success:</h5>
        <button
          onClick={() => showMockSuccessToast(8453, 'unwrapped')}
          style={{
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '11px',
            cursor: 'pointer',
            margin: '2px'
          }}
        >
          Base Unwrap ✅
        </button>
        <button
          onClick={() => showMockSuccessToast(42161, 'unwrapped')}
          style={{
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '11px',
            cursor: 'pointer',
            margin: '2px'
          }}
        >
          Arbitrum Unwrap ✅
        </button>
      </div>

      {/* Error Tests */}
      <div style={{ borderBottom: '1px solid #333', paddingBottom: '8px', marginBottom: '8px' }}>
        <h5 style={{ color: '#dc3545', margin: '0 0 5px 0', fontSize: '12px' }}>Errors:</h5>
        <button
          onClick={() => showMockErrorToast(42220, 'wrapping')}
          style={{
            background: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '11px',
            cursor: 'pointer',
            margin: '2px'
          }}
        >
          Wrap Error ❌
        </button>
        <button
          onClick={() => showMockErrorToast(8453, 'unwrapping')}
          style={{
            background: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '11px',
            cursor: 'pointer',
            margin: '2px'
          }}
        >
          Unwrap Error ❌
        </button>
      </div>

      {/* Simple Toasts */}
      <div style={{ borderBottom: '1px solid #333', paddingBottom: '8px', marginBottom: '8px' }}>
        <h5 style={{ color: '#007bff', margin: '0 0 5px 0', fontSize: '12px' }}>Simple:</h5>
        <button
          onClick={() => showSimpleSuccessToast('Operation completed successfully!')}
          style={{
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '11px',
            cursor: 'pointer',
            margin: '2px'
          }}
        >
          Simple Success ✅
        </button>
        <button
          onClick={() => showSimpleErrorToast('Something went wrong!')}
          style={{
            background: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '11px',
            cursor: 'pointer',
            margin: '2px'
          }}
        >
          Simple Error ❌
        </button>
      </div>

      {/* Clear All */}
      <button
        onClick={() => toast.dismiss()}
        style={{
          background: '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          padding: '6px 12px',
          fontSize: '12px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        Clear All Toasts
      </button>
    </div>
  );
}; 