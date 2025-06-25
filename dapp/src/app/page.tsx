// import { cookieStorage, createStorage, http } from '@wagmi/core'
import { ConnectButton } from "@/components/ConnectButton";
import { InfoList } from "@/components/InfoList";
import { ActionButtonList } from "@/components/ActionButtonList";
import Image from "next/image";
import { TokenMenu } from "@/components/TokenMenu";

export default function Home() {
  return (
    <div className={"pages"}>
      <header className="header">
        <div className="headerContainerLeft">
          <Image
            src="/cCOP_token.png"
            alt="cCOP Token"
            width={50}
            height={50}
            priority
          />
          <h1>cCOP Wrapper</h1>
        </div>

        <div className="headerContainerRight">
          <ConnectButton />
        </div>
      </header>
      {/*<Image src="/reown.svg" alt="Reown" width={150} height={150} priority />
      <h1>AppKit Wagmi Next.js App Router Example</h1>

      
      <ActionButtonList />
      <div className="advice">
        <p>
          This projectId only works on localhost. <br/>Go to <a href="https://cloud.reown.com" target="_blank" className="link-button" rel="Reown Cloud">Reown Cloud</a> to get your own.
        </p>
      </div>*/}
      <TokenMenu />

      {/*<InfoList />*/}
    </div>
  );
}
