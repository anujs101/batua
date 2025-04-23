import { Routes, Route } from "react-router-dom"
import { Toaster } from "react-hot-toast"
import Navbar from "./components/Navbar"
import Home from "./pages/Home"
import Airdrop from "./pages/Airdrop"
import Send from "./pages/Send"
import Sign from "./pages/Sign"
import Launchpad from "./pages/Launchpad"
import { WalletProvider } from "./components/WalletProvider"
import "./index.css"
import { ConnectionProvider } from "@solana/wallet-adapter-react"

function App() {
  const endpoint = 'https://morning-burned-sponge.solana-devnet.quiknode.pro/21a6f4bee8aaf94a6d1a6f0e71f2c6493834fcca/';
  return (
    <WalletProvider endpoint={endpoint}>
      <div className="bg-black text-white min-h-screen">
        <Navbar />
        <main className="pt-24 pb-16">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/airdrop" element={<Airdrop />} />
            <Route path="/send" element={<Send />} />
            <Route path="/sign" element={<Sign />} />
            <Route path="/launchpad" element={<Launchpad />} />
          </Routes>
        </main>
        <Toaster position="bottom-right" />
      </div>
    </WalletProvider>
  )
}

export default App
