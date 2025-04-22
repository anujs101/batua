"use client"

import { useState, useEffect } from "react"
import { motion, useAnimation } from "framer-motion"
import { useWallet } from "@solana/wallet-adapter-react"
import toast from "react-hot-toast"
import { FileSignature, Copy, CheckCircle } from "lucide-react"
import { Button } from "../components/ui/Button"
import { Textarea } from "../components/ui/Textarea"
import { Input } from "../components/ui/Input"
import bs58 from "bs58";
import { ed25519 } from "@noble/curves/ed25519";
export default function SignPage() {
  const { publicKey, signMessage } = useWallet()
  const controls = useAnimation()

  useEffect(() => {
    controls.start({ opacity: 1, y: 0 })
  }, [controls])

  // Sign section
  const [message, setMessage] = useState("")
  const [signature, setSignature] = useState("")
  const [isSigning, setIsSigning] = useState(false)
  const [copied, setCopied] = useState(false)

  // Verify section
  const [verifyMessage, setVerifyMessage] = useState("")
  const [verifySignature, setVerifySignature] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)

  const handleSignMessage = async () => {
    if (!publicKey || !signMessage) {
      toast.error("Wallet connection does not support message signing")
      return
    }

    if (!message) {
      toast.error("Please enter a message to sign")
      return
    }

    setIsSigning(true)

    try {
      // In a real app, this would use the actual signMessage function
      const messageBytes = new TextEncoder().encode(message)
      const signatureBytes = await signMessage(messageBytes)
      const signatureBase58 = bs58.encode(signatureBytes)

      // Simulate signing
      //await new Promise((resolve) => setTimeout(resolve, 1000))
      //const mockSignature = "5KTCaYnY9D1zRpNQVRKkvsJzZVVjYxLnLGF2z9uKSPBZpxvH2W7EqMxiKD7CaY9RsF8yAKQ9zJZwc1L7PYLj9Xtz"

      setSignature(signatureBase58)
      toast.success("Message signed successfully")
    } catch (error) {
      toast.error("Failed to sign message")
      console.error(error)
    } finally {
      setIsSigning(false)
    }
  }

  const handleCopySignature = () => {
    navigator.clipboard.writeText(signature)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success("Signature copied to clipboard")
  }

  const handleVerifyMessage = async () => {
    if (!verifyMessage || !verifySignature) {
      toast.error("Please provide both message and signature")
      return
    }

    setIsVerifying(true)

    try {
      
      const encodedMessage = new TextEncoder().encode(verifyMessage);
      const signatureBytes = bs58.decode(verifySignature);
      const isValid = await ed25519.verify(
        signatureBytes,
        encodedMessage,
        bs58.decode(publicKey.toBase58()) // convert publicKey to Uint8Array
      );
      console.log(verifyMessage)

console.log(isValid)
      if(isValid){toast.success(" Message Verified Successfully")}
      else{toast.error(" Message Verified Failed")}
    } catch (error) {
      toast.error("Invalid signature")
      console.error(error)
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="container mx-auto px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={controls} transition={{ duration: 0.5 }}>
        <div className="text-center mb-8">
          <FileSignature className="h-12 w-12 text-purple-500 mx-auto mb-4 futuristic-hover-icon" />
          <h1 className="text-3xl font-bold mb-2">Sign & Verify Messages</h1>
          <p className="text-gray-400">Cryptographically sign and verify messages with your wallet</p>
        </div>

        {publicKey ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Sign Message Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-xl p-6 futuristic-hover-card"
            >
              <h2 className="text-xl font-bold mb-4">Sign Message</h2>

              <div className="mb-4">
                <label htmlFor="message" className="block text-sm font-medium text-gray-400 mb-2">
                  Message
                </label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter a message to sign"
                  className="bg-gray-800 border-gray-700 min-h-[120px] futuristic-hover-input"
                />
              </div>

              <Button
                onClick={handleSignMessage}
                disabled={isSigning || !message}
                className="w-full mb-6 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 futuristic-hover-button"
              >
                {isSigning ? "Signing..." : "Sign Message"}
              </Button>

              {signature && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-400 mb-2">Signature</label>
                  <div className="bg-gray-800 rounded-lg p-3 text-xs break-all mb-2">{signature}</div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopySignature}
                    className="flex items-center text-gray-300 border-gray-700 hover:bg-gray-800 futuristic-hover-button"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" /> Copy to Clipboard
                      </>
                    )}
                  </Button>
                </div>
              )}
            </motion.div>

            {/* Verify Message Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-xl p-6 futuristic-hover-card"
            >
              <h2 className="text-xl font-bold mb-4">Verify Message</h2>

              <div className="mb-4">
                <label htmlFor="verifyMessage" className="block text-sm font-medium text-gray-400 mb-2">
                  Message
                </label>
                <Input
                  id="verifyMessage"
                  value={verifyMessage}
                  onChange={(e) => setVerifyMessage(e.target.value)}
                  placeholder="Enter the original message"
                  className="bg-gray-800 border-gray-700 futuristic-hover-input"
                />
              </div>

              <div className="mb-6">
                <label htmlFor="verifySignature" className="block text-sm font-medium text-gray-400 mb-2">
                  Signature
                </label>
                <Textarea
                  id="verifySignature"
                  value={verifySignature}
                  onChange={(e) => setVerifySignature(e.target.value)}
                  placeholder="Enter the signature to verify"
                  className="bg-gray-800 border-gray-700 min-h-[120px] futuristic-hover-input"
                />
              </div>

              <Button
                onClick={handleVerifyMessage}
                disabled={isVerifying || !verifyMessage || !verifySignature}
                className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 futuristic-hover-button"
              >
                {isVerifying ? "Verifying..." : "Verify Message"}
              </Button>
            </motion.div>
          </div>
        ) : (
          <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-xl p-8 text-center max-w-md mx-auto">
            <p className="text-gray-400 mb-4">Connect your wallet to sign and verify messages</p>
            <Button disabled className="bg-gradient-to-r from-purple-600 to-cyan-600 opacity-50">
              Connect Wallet First
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  )
}
