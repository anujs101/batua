import { useState, useEffect } from "react"
import { motion, useAnimation } from "framer-motion"
import toast from "react-hot-toast"
import { Coins } from "lucide-react"
import Button from "../components/ui-fixed/button"
import Input from "../components/ui-fixed/input"
import { useConnection, useWallet} from "@solana/wallet-adapter-react"
import { LAMPORTS_PER_SOL } from "@solana/web3.js"
export default function Airdrop() {
  const { publicKey } = useWallet()
  const [amount, setAmount] = useState("1")
  const [isLoading, setIsLoading] = useState(false)
  const controls = useAnimation()
  const {connection} = useConnection();

  useEffect(() => {
    controls.start({ opacity: 1, y: 0 })
  }, [controls])

  const handleAirdrop = async () => {
    if (!publicKey) {
      toast.error("Please connect your wallet first")
      return
    }

    setIsLoading(true)

    // Simulate airdrop request
    try {
      // In a real app, this would be a call to the Solana connection
      // const connection = new Connection(clusterApiUrl("devnet"))
      // const signature = await connection.requestAirdrop(publicKey, LAMPORTS_PER_SOL * Number(amount))
      // await connection.confirmTransaction(signature)
       const txsignature = await connection.requestAirdrop(publicKey,Number(amount)*LAMPORTS_PER_SOL);
       await connection.confirmTransaction(txsignature)
       // Simulate network delay
      //await new Promise((resolve) => setTimeout(resolve, 1500))
      
       console.log(txsignature);
      toast.success(`Successfully airdropped ${amount} SOL to your wallet`)
    } catch (error) {
      toast.error("Airdrop failed. Please try again.")
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
          <Coins className="h-12 w-12 text-purple-500 mx-auto mb-4 futuristic-hover-icon" />
          <h1 className="text-3xl font-bold mb-2">Airdrop SOL</h1>
          <p className="text-gray-400">Request SOL tokens to your wallet on the testnet</p>
        </div>

        <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-xl p-6 futuristic-hover-card">
          {publicKey ? (
            <>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">Your Wallet</label>
                <div className="bg-gray-800 rounded-lg px-4 py-3 text-sm break-all">{publicKey.toString()}</div>
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
                  min="0.1"
                  max="5"
                  step="0.1"
                  className="bg-gray-800 border-gray-700 futuristic-hover-input"
                />
                <p className="mt-2 text-xs text-gray-500">Maximum 5 SOL per request on devnet</p>
              </div>

              <Button
                onClick={handleAirdrop}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 futuristic-hover-button"
              >
                {isLoading ? "Processing..." : "Request Airdrop"}
              </Button>
            </>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-400 mb-4">Connect your wallet to request an airdrop</p>
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