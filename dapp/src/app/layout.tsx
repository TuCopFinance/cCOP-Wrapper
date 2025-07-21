import type { Metadata } from "next";
import { Toaster } from 'react-hot-toast';

import { headers } from "next/headers"; // added
import "./globals.css";
import ContextProvider from "@/context";

export const metadata: Metadata = {
  title: "cCOP wrapper",
  description: "A simple interface to wrap and unwrap cCOP tokens",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersData = await headers();
  const cookies = headersData.get("cookie");

  return (
    <html lang="en">
      <body>
        
        <ContextProvider cookies={cookies}>{children}<Toaster/></ContextProvider>
      </body>
    </html>
  );
}
