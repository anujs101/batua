"use client"

import { useState, useEffect } from "react"
import { motion, useAnimation } from "framer-motion"
import { useWallet,useConnection } from "@solana/wallet-adapter-react"
import toast from "react-hot-toast"
import { Send } from "lucide-react"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Transaction,LAMPORTS_PER_SOL, SystemProgram } from "@solana/web3.js"

export default function SendPage() {
  const { publicKey } = useWallet()
  const [recipient, setRecipient] = useState("")
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const controls = useAnimation()
  const wallet = useWallet();
  const {connection} = useConnection();
  useEffect(() => {
    controls.start({ opacity: 1, y: 0 })
  }, [controls])

  const handleSendToken = async () => {
    if (!publicKey) {
      toast.error("Please connect your wallet first")
      return
    }

    if (!recipient) {
      toast.error("Please enter a recipient address")
      return
    }

    if (!amount || Number.parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    setIsLoading(true)

    try {
      // create and send a transaction
      const transaction = new Transaction()
      transaction.add(
        SystemProgram.transfer({
          fromPubkey:wallet.publicKey,
          toPubkey: recipient,
          lamports: Number(amount)*LAMPORTS_PER_SOL
        })
      )
      const signature = await wallet.sendTransaction(transaction,connection)
      console.log(signature)
      toast.success(`Successfully sent ${amount} SOL to ${recipient.slice(0, 6)}...${recipient.slice(-4)}`)
      setRecipient("")
      setAmount("")
    } catch (error) {
      toast.error("Transaction failed. Please try again.")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={controls}
        transition={{ duration: 0.5 }}
        className="max-w-md mx-auto"
      >
        <div className="text-center mb-8">
          <Send className="h-12 w-12 text-cyan-500 mx-auto mb-4 futuristic-hover-icon" />
          <h1 className="text-3xl font-bold mb-2">Send Token</h1>
          <p className="text-gray-400">Transfer SOL or tokens to any Solana wallet</p>
        </div>

        <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-xl p-6 futuristic-hover-card">
          {publicKey ? (
            <>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">From</label>
                <div className="bg-gray-800 rounded-lg px-4 py-3 text-sm break-all">{publicKey.toString()}</div>
              </div>

              <div className="mb-6">
                <label htmlFor="recipient" className="block text-sm font-medium text-gray-400 mb-2">
                  To
                </label>
                <Input
                  id="recipient"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="Recipient wallet address"
                  className="bg-gray-800 border-gray-700 futuristic-hover-input"
                />
              </div>

              <div className="mb-6">
                <label htmlFor="amount" className="block text-sm font-medium text-gray-400 mb-2">
                  Amount (SOL)
                </label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0.000001"
                  step="0.000001"
                  placeholder="0.0"
                  className="bg-gray-800 border-gray-700 futuristic-hover-input"
                />
              </div>

              <Button
                onClick={handleSendToken}
                disabled={isLoading || !recipient || !amount}
                className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 futuristic-hover-button"
              >
                {isLoading ? "Processing..." : "Send Token"}
              </Button>
            </>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-400 mb-4">Connect your wallet to send tokens</p>
              <Button disabled className="bg-gradient-to-r from-purple-600 to-cyan-600 opacity-50">
                Connect Wallet First
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
