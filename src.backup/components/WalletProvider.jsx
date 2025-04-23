"use client"

import { useMemo } from "react"
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base"
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from "@solana/wallet-adapter-react"
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui"
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets"
import { clusterApiUrl } from "@solana/web3.js"

// Import wallet adapter CSS
import "@solana/wallet-adapter-react-ui/styles.css"

export function WalletProvider({ children, endpoint }) {
  // Set up network and endpoint
  const network = WalletAdapterNetwork.Devnet
  //const endpoint = useMemo(() => clusterApiUrl(network), [network])

  // Set up supported wallets - IMPORTANT: Only include wallets that are compatible with React 18
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      // DO NOT add other wallet adapters without testing compatibility
      // Specifically avoid @solana/wallet-adapter-keystone which depends on outdated React dependencies
    ],
    [],
  )

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  )
}
