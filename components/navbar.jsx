"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, useScroll, useMotionValueEvent } from "framer-motion"
import { useWallet } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { Home, Coins, Send, FileSignature, Rocket } from "lucide-react"
import { cn } from "@/lib/utils"
import { useMobile } from "@/hooks/use-mobile"

export default function Navbar() {
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  const isMobile = useMobile()
  const { connected, disconnect } = useWallet()

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 10)
  })

  const navItems = [
    { name: "Home", href: "/", icon: <Home className="h-4 w-4 mr-2" /> },
    { name: "Airdrop", href: "/airdrop", icon: <Coins className="h-4 w-4 mr-2" /> },
    { name: "Send", href: "/send", icon: <Send className="h-4 w-4 mr-2" /> },
    { name: "Sign", href: "/sign", icon: <FileSignature className="h-4 w-4 mr-2" /> },
    { name: "Launchpad", href: "/launchpad", icon: <Rocket className="h-4 w-4 mr-2" /> },
  ]

  return (
    <motion.header
      className={cn("fixed top-0 left-0 right-0 z-50 transition-all duration-300", scrolled ? "py-2" : "py-4")}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div
        className={cn(
          "container mx-auto px-4 flex items-center justify-between",
          "bg-gray-900/60 backdrop-blur-md rounded-full border border-gray-800",
          scrolled && "shadow-lg shadow-purple-900/10",
        )}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center futuristic-hover">
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-cyan-500">
            Batua
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="px-3 py-2 text-sm rounded-full text-gray-300 futuristic-hover-nav"
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Mobile Navigation */}
        <nav className="md:hidden flex items-center space-x-1">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="p-2 text-sm rounded-full text-gray-300 futuristic-hover-nav"
            >
              {item.icon}
              <span className="sr-only">{item.name}</span>
            </Link>
          ))}
        </nav>

        {/* Wallet Buttons */}
        <div className="flex items-center">
          <div className="wallet-adapter-button-wrapper">
            <WalletMultiButton className="wallet-adapter-button" />
          </div>

          {connected && (
            <button
              onClick={() => disconnect()}
              className="ml-2 px-3 py-2 text-sm rounded-full text-gray-300 futuristic-hover-nav"
            >
              Disconnect
            </button>
          )}
        </div>
      </div>
    </motion.header>
  )
}
