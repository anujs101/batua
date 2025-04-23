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

// Import environment variables
const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const PINATA_API_SECRET = import.meta.env.VITE_PINATA_API_SECRET;
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export default function LaunchpadPage() {
  const { publicKey } = useWallet()
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef(null)
  const [previewImage, setPreviewImage] = useState(null)
  const controls = useAnimation()
  const API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;  
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
  
  const uploadToPinata = async (metadata) => {
    // Check if required environment variables are set
    if (!PINATA_API_KEY || !PINATA_API_SECRET) {
      console.error("Missing Pinata environment variables");
      toast.error("Server configuration error: Missing Pinata API credentials");
      throw new Error("Missing Pinata API credentials");
    }
    
    try {
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
        const errorText = await res.text();
        console.error('Failed to upload to Pinata:', errorText);
        throw new Error(`Upload to Pinata failed: ${res.status} ${errorText}`);
      }
      
      const data = await res.json();
      console.log("Successfully uploaded metadata to Pinata");
      return `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`;
    } catch (error) {
      console.error('Pinata upload error:', error);
      throw new Error(`Failed to upload metadata to Pinata: ${error.message}`);
    }
  };
  
  const handleCreateToken = async () => {
    if (!publicKey) {
      toast.error("Please connect your wallet first")
      return
    }

    if (!isFormValid) {
      toast.error("Please fill in all required fields")
      return
    }
    
    // Check if all required environment variables are set
    if (!PINATA_API_KEY || !PINATA_API_SECRET || !CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      toast.error("Missing API credentials in environment configuration")
      console.error("Missing environment variables:", {
        pinataKey: !PINATA_API_KEY ? "missing" : "set",
        pinataSecret: !PINATA_API_SECRET ? "missing" : "set",
        cloudinaryName: !CLOUDINARY_CLOUD_NAME ? "missing" : "set",
        cloudinaryPreset: !CLOUDINARY_UPLOAD_PRESET ? "missing" : "set"
      });
      return
    }

    setIsLoading(true)

    try {
      // Upload logo to Cloudinary if a file exists
      if (tokenLogo && !cloudinaryUrl) {
        await uploadToCloudinary(tokenLogo)
      }
      
      // Generate a new keypair for the mint
      const mintKeypair = Keypair.generate();
      console.log(`Mint pubkey: ${mintKeypair.publicKey.toString()}`);
      
      // Create metadata JSON
      const metadataJSON = {
        mint: mintKeypair.publicKey.toString(),
        name: tokenName,
        description: tokenDescription,
        symbol: tokenSymbol,
        image: cloudinaryUrl || "",
      };
      
      // Upload metadata to Pinata
      const uri = await uploadToPinata(metadataJSON);
      console.log(`Metadata URI: ${uri}`);
      
      // Calculate mint account size - just for the mint with MetadataPointer extension
      const mintSpace = getMintLen([ExtensionType.MetadataPointer]);
      const mintLamports = await connection.getMinimumBalanceForRentExemption(mintSpace);
      
      // Step 1: Create a transaction to create the mint account
      const transaction1 = new Transaction();
      
      // Create mint account
      transaction1.add(
        SystemProgram.createAccount({
          fromPubkey: wallet.publicKey,
          newAccountPubkey: mintKeypair.publicKey,
          space: mintSpace,
          lamports: mintLamports,
          programId: TOKEN_2022_PROGRAM_ID,
        })
      );
      
      // Initialize the metadata pointer extension
      transaction1.add(
        createInitializeMetadataPointerInstruction(
          mintKeypair.publicKey,
          wallet.publicKey,
          mintKeypair.publicKey,
          TOKEN_2022_PROGRAM_ID
        )
      );
      
      // Initialize the mint
      transaction1.add(
        createInitializeMintInstruction(
          mintKeypair.publicKey,
          Number(tokenDecimals),
          wallet.publicKey,
          null,
          TOKEN_2022_PROGRAM_ID
        )
      );
      
      // Add transaction details
      transaction1.feePayer = wallet.publicKey;
      transaction1.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      transaction1.partialSign(mintKeypair);
      
      // Try simulation to catch errors
      try {
        console.log("Simulating transaction 1...");
        const simulation = await connection.simulateTransaction(transaction1);
        console.log("Simulation result:", simulation.value.logs);
        if (simulation.value.err) {
          console.error("Transaction would fail:", simulation.value.err);
          console.error("Full simulation result:", JSON.stringify(simulation.value, null, 2));
          throw new Error(`Simulation failed: ${JSON.stringify(simulation.value.err)}`);
        }
      } catch (simError) {
        console.error("Simulation error:", simError);
        toast.error(`Transaction simulation failed: ${simError.message}`);
        setIsLoading(false);
        return;
      }
      
      // Send transaction 1
      console.log("Sending transaction 1 to create mint account...");
      const signature1 = await wallet.sendTransaction(transaction1, connection);
      console.log(`Transaction 1 signature: ${signature1}`);
      console.log(`Mint account created at ${mintKeypair.publicKey.toString()}`);
      
      try {
        console.log("Waiting for transaction 1 confirmation...");
        await connection.confirmTransaction(signature1, "confirmed");
        console.log("Transaction 1 confirmed");
      } catch (error) {
        console.error("Error confirming transaction 1:", error);
        toast.error("Error creating mint account. Please try again.");
        setIsLoading(false);
        return;
      }
      
      // Step 2: Create a transaction to initialize the metadata
      try {
        console.log("Creating metadata for token...");
        
        // Calculate metadata account size and rent
        const metadataLen = 2 + 
          32 + // update authority
          4 + tokenName.length + 
          4 + tokenSymbol.padEnd(6).slice(0, 6).length + 
          4 + uri.length + 
          200; // Extra buffer for safety
        
        console.log(`Estimated metadata size: ${metadataLen} bytes`);
        const metadataLamports = await connection.getMinimumBalanceForRentExemption(metadataLen);
        console.log(`Required lamports for metadata: ${metadataLamports}`);
        
        // Create a transaction to add lamports to mint account for metadata
        const transaction2 = new Transaction();
        
        // Add extra lamports to the mint account (add a 50% buffer for safety)
        const extraBuffer = 1.5;
        transaction2.add(
          SystemProgram.transfer({
            fromPubkey: wallet.publicKey,
            toPubkey: mintKeypair.publicKey,
            lamports: Math.ceil(metadataLamports * extraBuffer),
          })
        );
        
        // Initialize metadata
        transaction2.add(
          createInitializeInstruction({
            programId: TOKEN_2022_PROGRAM_ID,
            metadata: mintKeypair.publicKey,
            updateAuthority: wallet.publicKey,
            mint: mintKeypair.publicKey,
            mintAuthority: wallet.publicKey,
            name: tokenName,
            symbol: tokenSymbol.padEnd(6).slice(0, 6), // Must be 6 chars
            uri: uri,
          })
        );
        
        // Add transaction details
        transaction2.feePayer = wallet.publicKey;
        const { blockhash } = await connection.getLatestBlockhash();
        transaction2.recentBlockhash = blockhash;
        
        // Try simulation first
        console.log("Simulating transaction 2...");
        const simulation = await connection.simulateTransaction(transaction2);
        console.log("Simulation result for metadata:", simulation.value.logs);
        
        if (simulation.value.err) {
          console.error("Metadata transaction would fail:", simulation.value.err);
          console.error("Full simulation result:", JSON.stringify(simulation.value, null, 2));
          
          // Try with even more lamports if the simulation failed
          console.log("Retrying with additional funds for metadata...");
          
          // Create a new transaction with more funds
          const retryTransaction = new Transaction();
          retryTransaction.add(
            SystemProgram.transfer({
              fromPubkey: wallet.publicKey,
              toPubkey: mintKeypair.publicKey,
              lamports: metadataLamports * 3, // Try with 3x the estimated amount
            })
          );
          
          retryTransaction.add(
            createInitializeInstruction({
              programId: TOKEN_2022_PROGRAM_ID,
              metadata: mintKeypair.publicKey,
              updateAuthority: wallet.publicKey,
              mint: mintKeypair.publicKey,
              mintAuthority: wallet.publicKey,
              name: tokenName,
              symbol: tokenSymbol.padEnd(6).slice(0, 6),
              uri: uri,
            })
          );
          
          retryTransaction.feePayer = wallet.publicKey;
          retryTransaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
          
          // Send the retry transaction
          console.log("Sending retry transaction for metadata...");
          const retrySignature = await wallet.sendTransaction(retryTransaction, connection);
          console.log(`Retry transaction signature: ${retrySignature}`);
          
          console.log("Waiting for retry transaction confirmation...");
          await connection.confirmTransaction(retrySignature, "confirmed");
          console.log("Retry transaction confirmed - Metadata initialized successfully");
        } else {
          // Send the transaction if simulation succeeded
          console.log("Sending transaction 2 to initialize metadata...");
          const signature2 = await wallet.sendTransaction(transaction2, connection);
          console.log(`Transaction 2 signature: ${signature2}`);
          
          console.log("Waiting for transaction 2 confirmation...");
          await connection.confirmTransaction(signature2, "confirmed");
          console.log("Transaction 2 confirmed - Metadata initialized successfully");
        }
      } catch (error) {
        console.error("Error initializing metadata:", error);
        toast.error("Failed to initialize metadata. Token creation will be aborted.");
        setIsLoading(false);
        return; // Stop the token creation process if metadata fails
      }
      
      // Step 3: Create the associated token account
      try {
        console.log("Creating associated token account...");
        const associatedToken = getAssociatedTokenAddressSync(
          mintKeypair.publicKey,
          wallet.publicKey,
          false,
          TOKEN_2022_PROGRAM_ID
        );
        console.log(`Associated token account: ${associatedToken.toString()}`);
        
        const transaction3 = new Transaction();
        transaction3.add(
          createAssociatedTokenAccountInstruction(
            wallet.publicKey,
            associatedToken,
            wallet.publicKey,
            mintKeypair.publicKey,
            TOKEN_2022_PROGRAM_ID
          )
        );
        
        // Add transaction details
        transaction3.feePayer = wallet.publicKey;
        transaction3.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        
        // Send transaction 3
        console.log("Sending transaction 3 to create associated token account...");
        const signature3 = await wallet.sendTransaction(transaction3, connection);
        console.log(`Transaction 3 signature: ${signature3}`);
        
        try {
          console.log("Waiting for transaction 3 confirmation...");
          await connection.confirmTransaction(signature3, "confirmed");
          console.log("Transaction 3 confirmed");
        } catch (error) {
          console.error("Error confirming transaction 3:", error);
          toast.error("Error creating token account. Token was created but you may need to create a token account manually.");
          setIsLoading(false);
          return;
        }
        
        // Step 4: Mint tokens to the associated token account
        console.log("Creating transaction to mint tokens...");
        const mintAmount = BigInt(tokenSupply) * BigInt(10 ** Number(tokenDecimals));
        
        const transaction4 = new Transaction();
        transaction4.add(
          createMintToInstruction(
            mintKeypair.publicKey,
            associatedToken,
            wallet.publicKey,
            mintAmount,
            [],
            TOKEN_2022_PROGRAM_ID
          )
        );
        
        // Add transaction details
        transaction4.feePayer = wallet.publicKey;
        transaction4.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        
        // Send transaction 4
        console.log("Sending transaction 4 to mint tokens...");
        const signature4 = await wallet.sendTransaction(transaction4, connection);
        console.log(`Transaction 4 signature: ${signature4}`);
        
        try {
          console.log("Waiting for transaction 4 confirmation...");
          await connection.confirmTransaction(signature4, "confirmed");
          console.log("Transaction 4 confirmed");
          console.log(`Successfully minted ${tokenSupply} tokens`);
        } catch (error) {
          console.error("Error confirming transaction 4:", error);
          toast.error("Error minting tokens. Token and token account were created, but minting failed.");
          setIsLoading(false);
          return;
        }
        
        // Display explorer links
        console.log("Token creation complete! View on explorers:");
        console.log(`Solana Explorer: https://explorer.solana.com/address/${mintKeypair.publicKey.toString()}?cluster=devnet`);
        console.log(`Solana FM: https://solana.fm/address/${mintKeypair.publicKey.toString()}?cluster=devnet-solana`);
        
        toast.success(`Successfully created ${tokenName} (${tokenSymbol}) token!`, {
          icon: <Check className="text-green-500" />,
          style: {
            borderRadius: "10px",
            background: "#333",
            color: "#fff",
          },
        });
        
        // Reset form
        setTokenName("");
        setTokenSymbol("");
        setTokenDecimals("9");
        setTokenSupply("1000000");
        setTokenDescription("");
        setTokenLogo(null);
        setPreviewImage(null);
        setCloudinaryUrl(null);
        setUploadSuccess(false);
      } catch (error) {
        console.error("Error in token creation process:", error);
        toast.error("Error completing token creation process.");
      } finally {
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Token creation failed:", error);
      toast.error("Token creation failed. Please try again.");
      setIsLoading(false);
    }
  };

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

    // Check if required environment variables are set
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      console.error("Missing Cloudinary environment variables");
      toast.error("Server configuration error: Missing Cloudinary credentials");
      setUploadError("Server configuration error: Missing Cloudinary credentials");
      setIsUploading(false);
      return;
    }

    setIsUploading(true)
    setUploadSuccess(false)
    setUploadError(null)

    try {
      // Log Cloudinary configuration for debugging
      console.log("Attempting Cloudinary upload with configured environment variables");
      
      // Create form data for upload
      const formData = new FormData()
      formData.append("file", file)
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET)
      formData.append("folder", "batua_tokens")

      // Upload to Cloudinary
      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
      })
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Cloudinary response error:', response.status, errorText);
        throw new Error(`Upload failed: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message || "Upload failed")
      }
      
      console.log('Cloudinary upload successful:', data);
      // Set the secure URL from Cloudinary
      setCloudinaryUrl(data.secure_url)
      setPreviewImage(data.secure_url)
      setUploadSuccess(true)
      toast.success("Logo uploaded successfully!")
    } catch (error) {
      console.error("Upload error:", error)
      setUploadError("Failed to upload image. Please try again.")
      toast.error(`Failed to upload image: ${error.message}`)
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
