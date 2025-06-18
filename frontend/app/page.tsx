'use client';
import Link from 'next/link';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';
import Image from 'next/image';

export default function Home() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  const handleConnect = () => {
    connect({ connector: new InjectedConnector() });
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-900 via-blue-400 to-yellow-300 flex flex-col">
      {/* Responsive Navigation */}
      <nav className="w-full bg-white/80 backdrop-blur-md shadow-md py-4 px-4 sm:px-8 flex flex-col sm:flex-row justify-between items-center fixed top-0 left-0 z-10">
        <Link href="/" className="text-xl sm:text-2xl font-extrabold text-blue-900 tracking-tight hover:underline focus:outline-none mb-4 sm:mb-0">Wrapped cCOP</Link>
        <div className="flex flex-wrap justify-center gap-3 sm:gap-6">
          <Link href="/" className="text-sm sm:text-base text-blue-700 hover:text-yellow-500 font-medium transition">Home</Link>
          <Link href="/dashboard" className="text-sm sm:text-base text-blue-700 hover:text-yellow-500 font-medium transition">Dashboard</Link>
          <Link href="/deposit" className="text-sm sm:text-base text-blue-700 hover:text-yellow-500 font-medium transition">Deposit</Link>
          <Link href="/burn" className="text-sm sm:text-base text-blue-700 hover:text-yellow-500 font-medium transition">Burn</Link>
          <Link href="/history" className="text-sm sm:text-base text-blue-700 hover:text-yellow-500 font-medium transition">History</Link>
        </div>
      </nav>

      {/* Responsive Main Content */}
      <main className="flex-1 flex items-center justify-center pt-24 sm:pt-32 pb-8 sm:pb-12 px-4">
        <div className="w-full max-w-lg bg-white/90 rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-10 flex flex-col items-center border border-blue-100">
          <h1 className="text-2xl sm:text-4xl font-bold text-blue-900 mb-2 text-center drop-shadow">Wrapped cCOP dApp</h1>
          <h2 className="text-base sm:text-lg text-blue-700 mb-6 sm:mb-8 text-center">Bridge your cCOP between Celo and Base using Chainlink CCIP</h2>
          <div className="flex flex-col items-center gap-4 w-full">
            {isConnected ? (
              <>
                <span className="text-gray-700 text-xs sm:text-sm mb-2">Connected as</span>
                <span className="font-mono text-blue-800 bg-blue-100 px-2 sm:px-3 py-1 rounded-lg mb-4 text-xs sm:text-sm break-all text-center">{address}</span>
                <button onClick={() => disconnect()} className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-gradient-to-r from-yellow-400 to-blue-500 text-white font-semibold rounded-xl shadow hover:from-yellow-500 hover:to-blue-600 transition">Disconnect</button>
              </>
            ) : (
              <button onClick={handleConnect} className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-gradient-to-r from-blue-700 to-yellow-400 text-white font-bold rounded-xl shadow-lg hover:from-blue-800 hover:to-yellow-500 transition text-base sm:text-lg">Connect Wallet</button>
            )}
          </div>
        </div>
      </main>

      {/* Responsive Footer */}
      <footer className="w-full text-center py-4 text-blue-900/80 font-medium text-xs sm:text-sm flex justify-center items-center gap-1">
        Powered by&nbsp;
        <span className="inline-flex items-center">
          <Image src="/assets/CeloColLogo.png" alt="C" width={18} height={18} className="inline-block mx-0.5" />elo&nbsp;
          <Image src="/assets/CeloColLogo.png" alt="C" width={18} height={18} className="inline-block mx-0.5" />olombia
        </span>
        &nbsp;&middot;&nbsp;Chainlink CCIP Demo
      </footer>
    </div>
  );
}
