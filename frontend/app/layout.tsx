'use client';
import './globals.css';
import { WagmiConfig } from 'wagmi';
import config from './wagmi';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <WagmiConfig config={config}>{children}</WagmiConfig>
      </body>
    </html>
  );
}
