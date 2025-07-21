"use client";
import React from "react";
import { ConnectButton } from "@/components/ConnectButton";
import Image from "next/image";
import { TokenMenu } from "@/components/TokenMenu";
import { Dashboard } from "@/components/Dashboard";
import { ViewSelector } from "@/components/ViewSelector";


export default function Home() {
  const [currentView, setCurrentView] = React.useState<"tokenmenu" | "dashboard">("tokenmenu");

  const handleViewChange = (view: "tokenmenu" | "dashboard") => {
    setCurrentView(view);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case "dashboard":
        return <Dashboard />;
      case "tokenmenu":
      default:
        return <TokenMenu />;
    }
  };

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
            <ConnectButton />
            <ViewSelector 
              currentView={currentView} 
              onViewChange={handleViewChange}
            />
        </div>
      </header>
      <div className="content">
        <div className="menuBox">
          {renderCurrentView()}
        </div>
      </div>
    </div>
  );
}
