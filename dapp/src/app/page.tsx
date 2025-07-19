import { ConnectButton } from "@/components/ConnectButton";
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
            width={40}
            height={40}
            priority
          />
          <h1>cCOP Wrapper</h1>
        </div>

        <div className="headerContainerRight">
          <ConnectButton />
        </div>
      </header>
      <div className="content">
        <TokenMenu />
      </div>
    </div>
  );
}
