"use client"
import { Keypair, SystemProgram, Transaction } from "@solana/web3.js";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { MINT_SIZE, TOKEN_2022_PROGRAM_ID, createMintToInstruction, createAssociatedTokenAccountInstruction, getMintLen, createInitializeMetadataPointerInstruction, createInitializeMintInstruction, TYPE_SIZE, LENGTH_SIZE, ExtensionType, mintTo, getOrCreateAssociatedTokenAccount, getAssociatedTokenAddressSync } from "@solana/spl-token"
import { createInitializeInstruction, pack } from '@solana/spl-token-metadata';
import { useState, useRef, useEffect } from "react"
import { motion, useAnimation } from "framer-motion"
import toast from "react-hot-toast"
import { Rocket, Info, ImageIcon, HelpCircle, Check, Loader2, AlertCircle } from "lucide-react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Textarea } from "../components/ui/textarea"
import { Tooltip } from "../components/ui/tooltip"

const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const PINATA_API_SECRET = import.meta.env.VITE_PINATA_API_SECRET;
export default function LaunchpadPage() {
  const { publicKey } = useWallet()
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef(null)
  const [previewImage, setPreviewImage] = useState(null)
  const controls = useAnimation()
  const CLOUD_NAME = 'dfbvndxhf'; // cloud name
  const UPLOAD_PRESET = 'batua_logo'; 
  const API_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;  
  const {connection} = useConnection();
  const wallet = useWallet();
  useEffect(() => {
    controls.start({ opacity: 1, y: 0 })
  }, [controls])

  // Token form state
  const [tokenName, setTokenName] = useState("")
  const [tokenSymbol, setTokenSymbol] = useState("")
  const [tokenDecimals, setTokenDecimals] = useState("9")
  const [tokenSupply, setTokenSupply] = useState("1000000")
  const [tokenDescription, setTokenDescription] = useState("")
  const [tokenLogo, setTokenLogo] = useState(null)

  // Upload state
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [cloudinaryUrl, setCloudinaryUrl] = useState(null)

  // Form validation
  const isFormValid = tokenName && tokenSymbol && tokenDecimals && tokenSupply
  const handleCreateToken = async () => {
    if (!publicKey) {
      toast.error("Please connect your wallet first")
      return
    }

    if (!isFormValid) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsLoading(true)

    try {
      // Upload logo to Cloudinary if a file exists
      if (tokenLogo && !cloudinaryUrl) {
        await uploadToCloudinary(tokenLogo)
      }
      
      // In a real app, this would create a token on Solana
       const mintKeypair = Keypair.generate()
      const metadataJSON = {
        mint : mintKeypair.publicKey,
        name: tokenName,
        description: tokenDescription ,
        symbol: tokenSymbol,
        image :cloudinaryUrl,
        additionalMetadata: [],
    }

    async function uploadToPinata(metadata){
      const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_API_SECRET,
        },
        body: JSON.stringify(metadata),
      });
      if (!res.ok) {
        console.error('Failed to upload to Pinata:', await res.text());
        throw new Error('Upload to Pinata failed');
      }
    
      const data = await res.json();
      return `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`;
    }




    const uri = await uploadToPinata(metadataJSON);
    const metadata = {
      mint: mintKeypair.publicKey,
      name: tokenName,
      symbol: tokenSymbol.padEnd(6).slice(0, 6), // symbol must be 6 characters
      uri,
      additionalMetadata: [],
    };
    const mintLen= getMintLen([ExtensionType.MetadataPointer]);
    const metadataLen = TYPE_SIZE+LENGTH_SIZE+pack(metadata).length;
    const lamports = await connection.getMinimumBalanceForRentExemption(mintLen+metadataLen);

    const transaction = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: mintKeypair.publicKey,
        lamports,
        space: mintLen+metadataLen,
        programId: TOKEN_2022_PROGRAM_ID,
      }),createInitializeMetadataPointerInstruction(
        mintKeypair.publicKey,
        wallet.publicKey,
        mintKeypair.publicKey,
        TOKEN_2022_PROGRAM_ID
      ), createInitializeMintInstruction(
        mintKeypair.publicKey,
        tokenDecimals,
        wallet.publicKey,
        TOKEN_2022_PROGRAM_ID
      ), createInitializeInstruction({
        programId: TOKEN_2022_PROGRAM_ID,
        mint : mintKeypair.publicKey,
        metadata: mintKeypair.publicKey,
        name : metadataJSON.name,
        symbol: metadataJSON.symbol,
        image:metadataJSON.image,
        uri : uri,
        mintAuthority: wallet.publicKey,
        updateAuthority: wallet.publicKey,
      }),

    );
    transaction.feePayer= wallet.publicKey;
    transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    transaction.partialSign(mintKeypair);
    //testing code 
    // Before sending the transaction
// console.log("Blockhash:", transaction.recentBlockhash);
// console.log("Fee payer:", transaction.feePayer.toBase58());
// console.log("Signers:", transaction._signers.map(s => s.publicKey.toBase58()));
// console.log("Number of instructions:", transaction.instructions.length);

// Try simulation first to catch errors
try {
  const simulation = await connection.simulateTransaction(transaction);
  console.log("Simulation result:", simulation);
  if (simulation.value.err) {
    console.error("Transaction would fail:", simulation.value.err);
    throw new Error(`Simulation failed: ${JSON.stringify(simulation.value.err)}`);
  }
} catch (simError) {
  console.error("Simulation error:", simError);
  toast.error(`Transaction simulation failed: ${simError.message}`);
  return;
}
//testing ends
    await wallet.sendTransaction(transaction,connection);
    console.log(`Token mint created at ${mintKeypair.publicKey.toBase58()}`);
    
    const associatedToken = getAssociatedTokenAddressSync(
      mintKeypair.publicKey,
      wallet.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID,
    );
    console.log(`associatedToken :${associatedToken.toBase58()}`);
    const transaction2 = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        associatedToken,
        wallet.publicKey,
        mintKeypair.publicKey,
        TOKEN_2022_PROGRAM_ID,
      ),
    );
    await wallet.sendTransaction(transaction2,connection);
    const transaction3= new Transaction().add(
      createMintToInstruction(
        mintKeypair.publicKey,
        associatedToken,
        wallet.publicKey,
        BigInt(tokenSupply) * BigInt(10 ** Number(tokenDecimals)),
        [],
        TOKEN_2022_PROGRAM_ID
      )
    )
    await wallet.sendTransaction(transaction3, connection);
    

      // Simulate network delay
      //await new Promise((resolve) => setTimeout(resolve, 2000))

      toast.success(`Successfully created ${tokenName} (${tokenSymbol}) token!`, {
        icon: <Check className="text-green-500" />,
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        },
      })

      // Reset form
      setTokenName("")
      setTokenSymbol("")
      setTokenDecimals("9")
      setTokenSupply("1000000")
      setTokenDescription("")
      setTokenLogo(null)
      setPreviewImage(null)
      setCloudinaryUrl(null)
      setUploadSuccess(false)
    } catch (error) {
      toast.error("Token creation failed. Please try again.")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const validateFile = (file) => {
    // Check file type
    const validTypes = ["image/jpeg", "image/png"]
    if (!validTypes.includes(file.type)) {
      setUploadError("Invalid file type. Only JPEG and PNG are accepted.")
      return false
    }

    // Check file size (2MB max)
    const maxSize = 2 * 1024 * 1024 // 2MB in bytes
    if (file.size > maxSize) {
      setUploadError("File is too large. Maximum size is 2MB.")
      return false
    }

    setUploadError(null)
    return true
  }

  const uploadToCloudinary = async (file) => {
    if (!validateFile(file)) {
      toast.error(uploadError)
      return
    }

    setIsUploading(true)
    setUploadSuccess(false)
    setUploadError(null)

    try {
      // Create form data for upload
      const formData = new FormData()
      formData.append("file", file)
      formData.append("upload_preset", UPLOAD_PRESET) // Replace with your unsigned upload preset
      formData.append("folder", "batua_tokens")

      // Upload to Cloudinary
      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
      })
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message || "Upload failed")
      }
      

      // Set the secure URL from Cloudinary
      setCloudinaryUrl(data.secure_url)
      setPreviewImage(data.secure_url)
      setUploadSuccess(true)
      toast.success("Logo uploaded successfully!")
    } catch (error) {
      console.error("Upload error:", error)
      setUploadError("Failed to upload image. Please try again.")
      toast.error("Failed to upload image. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (!validateFile(file)) {
        toast.error(uploadError)
        return
      }
      
      setTokenLogo(file)

      // Create preview URL for immediate display
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewImage(e.target.result)
      }
      reader.readAsDataURL(file)
      
      // Clear previous upload status
      setUploadSuccess(false)
      setUploadError(null)
      setCloudinaryUrl(null)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      if (!validateFile(file)) {
        toast.error(uploadError)
        return
      }
      
      setTokenLogo(file)

      // Create preview URL for immediate display
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewImage(e.target.result)
      }
      reader.readAsDataURL(file)
      
      // Clear previous upload status
      setUploadSuccess(false)
      setUploadError(null)
      setCloudinaryUrl(null)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  // Format number with commas
  const formatNumber = (num) => {
    return Number.parseFloat(num).toLocaleString("en-US")
  }

  // Calculate market cap (just for display purposes)
  const calculateMarketCap = () => {
    const supply = Number.parseFloat(tokenSupply) || 0
    // Assume $0.10 initial price for demo
    return (supply * 0.1).toLocaleString("en-US", { style: "currency", currency: "USD" })
  }

  return (
    <div className="container mx-auto px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={controls} transition={{ duration: 0.5 }}>
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100 }}
          >
            <Rocket className="h-12 w-12 text-cyan-500 mx-auto mb-4 futuristic-hover-icon" />
          </motion.div>
          <h1 className="text-3xl font-bold mb-2">Token Launchpad</h1>
          <p className="text-gray-400">Create your own token on Solana in minutes</p>
        </div>

        {publicKey ? (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Token Creation Form - Takes 3/5 of the space on desktop */}
            <motion.div
              className="lg:col-span-3 bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-xl p-6"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <div className="flex items-center mb-2">
                    <label htmlFor="tokenName" className="block text-sm font-medium text-gray-400">
                      Token Name <span className="text-red-500">*</span>
                    </label>
                    <Tooltip content="The full name of your token (e.g., 'Bitcoin')">
                      <HelpCircle className="h-4 w-4 ml-1 text-gray-500 cursor-help futuristic-hover-icon" />
                    </Tooltip>
                  </div>
                  <Input
                    id="tokenName"
                    value={tokenName}
                    onChange={(e) => setTokenName(e.target.value)}
                    placeholder="e.g. My Awesome Token"
                    className="bg-gray-800 border-gray-700 futuristic-hover-input"
                  />
                </div>

                <div>
                  <div className="flex items-center mb-2">
                    <label htmlFor="tokenSymbol" className="block text-sm font-medium text-gray-400">
                      Token Symbol <span className="text-red-500">*</span>
                    </label>
                    <Tooltip content="A short ticker symbol for your token (e.g., 'BTC')">
                      <HelpCircle className="h-4 w-4 ml-1 text-gray-500 cursor-help futuristic-hover-icon" />
                    </Tooltip>
                  </div>
                  <Input
                    id="tokenSymbol"
                    value={tokenSymbol}
                    onChange={(e) => setTokenSymbol(e.target.value.toUpperCase())}
                    placeholder="e.g. MAT"
                    maxLength={5}
                    className="bg-gray-800 border-gray-700 futuristic-hover-input uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <div className="flex items-center mb-2">
                    <label htmlFor="tokenDecimals" className="block text-sm font-medium text-gray-400">
                      Decimals <span className="text-red-500">*</span>
                    </label>
                    <Tooltip content="Determines how divisible your token is. Standard is 9 decimals (like SOL). More decimals = more divisibility.">
                      <HelpCircle className="h-4 w-4 ml-1 text-gray-500 cursor-help futuristic-hover-icon" />
                    </Tooltip>
                  </div>
                  <Input
                    id="tokenDecimals"
                    type="number"
                    value={tokenDecimals}
                    onChange={(e) => setTokenDecimals(e.target.value)}
                    min="0"
                    max="9"
                    className="bg-gray-800 border-gray-700 futuristic-hover-input"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    <Info className="inline h-3 w-3 mr-1 futuristic-hover-icon" />
                    Standard is 9 decimals (like SOL)
                  </p>
                </div>

                <div>
                  <div className="flex items-center mb-2">
                    <label htmlFor="tokenSupply" className="block text-sm font-medium text-gray-400">
                      Initial Supply <span className="text-red-500">*</span>
                    </label>
                    <Tooltip content="The total number of tokens that will be created initially">
                      <HelpCircle className="h-4 w-4 ml-1 text-gray-500 cursor-help futuristic-hover-icon" />
                    </Tooltip>
                  </div>
                  <Input
                    id="tokenSupply"
                    type="number"
                    value={tokenSupply}
                    onChange={(e) => setTokenSupply(e.target.value)}
                    min="1"
                    className="bg-gray-800 border-gray-700 futuristic-hover-input"
                  />
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center mb-2">
                  <label htmlFor="tokenDescription" className="block text-sm font-medium text-gray-400">
                    Description
                  </label>
                  <Tooltip content="A brief description of your token's purpose and utility">
                    <HelpCircle className="h-4 w-4 ml-1 text-gray-500 cursor-help futuristic-hover-icon" />
                  </Tooltip>
                </div>
                <Textarea
                  id="tokenDescription"
                  value={tokenDescription}
                  onChange={(e) => setTokenDescription(e.target.value)}
                  placeholder="Describe your token's purpose and utility"
                  className="bg-gray-800 border-gray-700 futuristic-hover-input"
                />
              </div>

              <div className="mb-6">
                <div className="flex items-center mb-2">
                  <label className="block text-sm font-medium text-gray-400">Token Logo</label>
                  <Tooltip content="An image that represents your token (recommended: 512x512px)">
                    <HelpCircle className="h-4 w-4 ml-1 text-gray-500 cursor-help futuristic-hover-icon" />
                  </Tooltip>
                </div>
                <div
                  className={`flex items-center justify-center border-2 border-dashed ${
                    uploadSuccess ? "border-green-500" : uploadError ? "border-red-500" : "border-gray-700"
                  } rounded-lg p-6 cursor-pointer hover:border-cyan-500/50 transition-colors animated-border`}
                  onClick={() => fileInputRef.current.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  <div className="text-center">
                    {isUploading ? (
                      <div className="flex flex-col items-center">
                        <Loader2 className="h-10 w-10 text-cyan-500 animate-spin mb-2" />
                        <p className="text-sm text-gray-400">Uploading to Cloudinary...</p>
                      </div>
                    ) : previewImage ? (
                      <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="flex flex-col items-center"
                      >
                        <div className="relative">
                          <img
                            src={previewImage || "/placeholder.svg"}
                            alt="Token logo preview"
                            className="h-16 w-16 object-cover rounded-full mb-2"
                          />
                          {uploadSuccess && (
                            <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-400">Click or drag to replace</p>
                        {uploadSuccess && (
                          <p className="text-xs text-green-500 mt-1">Successfully uploaded to Cloudinary</p>
                        )}
                      </motion.div>
                    ) : (
                      <>
                        <ImageIcon className="h-10 w-10 text-gray-500 mx-auto mb-2 futuristic-hover-icon" />
                        <p className="text-sm text-gray-400">Drag and drop or click to upload</p>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG (max. 2MB)</p>
                      </>
                    )}

                    {uploadError && (
                      <div className="mt-2 text-xs text-red-500 flex items-center justify-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {uploadError}
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/png, image/jpeg"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-medium text-gray-300 mb-2 flex items-center">
                  <Info className="h-4 w-4 mr-2 text-cyan-500 futuristic-hover-icon" />
                  Important Information
                </h3>
                <p className="text-xs text-gray-400">
                  Creating a token requires a small amount of SOL for the transaction fee and to create the token
                  account. Make sure you have enough SOL in your wallet before proceeding.
                </p>
              </div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={handleCreateToken}
                  disabled={isLoading || !isFormValid}
                  className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 transition-all duration-300 shadow-lg shadow-purple-900/20 futuristic-hover-button"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Token...
                    </>
                  ) : (
                    "Create Token"
                  )}
                </Button>
              </motion.div>
            </motion.div>

            {/* Live Token Preview - Takes 2/5 of the space on desktop */}
            <motion.div
              className="lg:col-span-2"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <div className="sticky top-24">
                <h3 className="text-xl font-bold mb-4 text-center lg:text-left">Token Preview</h3>

                <motion.div
                  className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-xl p-6 overflow-hidden futuristic-hover-card"
                  animate={{
                    boxShadow: isFormValid
                      ? [
                          "0 0 0 rgba(139, 92, 246, 0)",
                          "0 0 20px rgba(139, 92, 246, 0.3)",
                          "0 0 0 rgba(139, 92, 246, 0)",
                        ]
                      : "0 0 0 rgba(139, 92, 246, 0)",
                  }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                >
                  <div className="flex items-center mb-6">
                    <div className="relative mr-4">
                      {previewImage ? (
                        <img
                          src={previewImage || "/placeholder.svg"}
                          alt="Token logo"
                          className="h-16 w-16 rounded-full object-cover border-2 border-gray-700"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-600/30 to-cyan-600/30 flex items-center justify-center border-2 border-gray-700">
                          {tokenSymbol ? (
                            <span className="text-xl font-bold text-white">{tokenSymbol.substring(0, 2)}</span>
                          ) : (
                            <ImageIcon className="h-8 w-8 text-gray-500" />
                          )}
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 bg-green-500 h-4 w-4 rounded-full border-2 border-gray-900 pulse-glow"></div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">
                        {tokenName || "Token Name"}
                        <span className="ml-2 text-sm text-gray-400">{tokenSymbol || "SYM"}</span>
                      </h3>
                      <div className="text-xs text-gray-400 mt-1">Solana SPL Token</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Total Supply</div>
                      <div className="text-2xl font-bold">
                        {tokenSupply ? formatNumber(tokenSupply) : "0"}
                        <span className="text-sm text-gray-400 ml-1">{tokenSymbol || "SYM"}</span>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-400 mb-1">Decimals</div>
                      <div className="font-mono">{tokenDecimals || "9"}</div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-400 mb-1">Est. Market Cap</div>
                      <div className="font-bold text-cyan-500">{calculateMarketCap()}</div>
                    </div>

                    {tokenDescription && (
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Description</div>
                        <div className="text-sm">{tokenDescription}</div>
                      </div>
                    )}

                    <div className="pt-4 border-t border-gray-800">
                      <div className="flex justify-between items-center">
                        <div className="text-xs text-gray-500">Created just now</div>
                        <div className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full">
                          Ready to deploy
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <div className="mt-6 bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-xl p-4 futuristic-hover-card">
                  <h4 className="text-sm font-medium mb-2">After Creation</h4>
                  <ul className="text-xs text-gray-400 space-y-2">
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-green-500 mr-2 shrink-0 mt-0.5 futuristic-hover-icon" />
                      <span>Your token will be deployed to the Solana blockchain</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-green-500 mr-2 shrink-0 mt-0.5 futuristic-hover-icon" />
                      <span>You'll receive the full supply in your connected wallet</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-green-500 mr-2 shrink-0 mt-0.5 futuristic-hover-icon" />
                      <span>You can transfer tokens to other wallets immediately</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        ) : (
          <motion.div
            className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-xl p-8 text-center max-w-md mx-auto"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-gray-400 mb-4">Connect your wallet to create a token</p>
            <Button
              disabled
              className="bg-gradient-to-r from-purple-600 to-cyan-600 opacity-50 futuristic-hover-button"
            >
              Connect Wallet First
            </Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
