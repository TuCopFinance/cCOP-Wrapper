
import React from "react";
import { ConnectButton } from "@/components/ConnectButton";
import Image from "next/image";
import { TokenMenu } from "@/components/TokenMenu";
import { Footer } from "@/components/Footer";


export default function Home() {

  return (
    <div className={"pages"}>
      <header className="header">
        <div className="headerContainerLeft">
          <Image
            src="/cCOP_token.png"
            alt="cCOP Token"
            width={40}
            height={40}
            priority
          />
          <h1>cCOP Wrapper</h1>
        </div>

        <div className="headerContainerRight">
          <a href="/dashboard" className="dashboardLink">
            <span className="dashboardIcon">📊</span>
            <span className="dashboardText">Dashboard</span>
          </a>
          <ConnectButton />
        </div>
      </header>
      <div className="content">
          <TokenMenu />
      </div>
      <Footer />
    </div>
  );
}
