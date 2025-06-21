# 💸 Batua — A Web3 Dapp on Solana

Batua is a futuristic, dark-mode decentralized application (Dapp) built with **React + Vite**, allowing users to:

- 🪂 **Airdrop SOL** on Solana Devnet
- 💰 **Send SOL** to any wallet
- ✍️ **Sign and Verify messages** using their Solana wallet (ed25519 curve)
- 🚀 **Launch their own tokens** on the Solana Devnet

Built for developers, crypto enthusiasts, and learners who want to explore core Solana functionalities in a sleek and intuitive UI.

---

## 🚀 Features

- **Solana Wallet Integration** (via `@solana/wallet-adapter-react`)
- **Airdrop SOL** directly to connected wallet (Devnet only)
- **Transfer SOL** securely by inputting wallet address and amount
- **Message Signing and Verification** using ed25519
- **Token Launchpad** to create & mint your own token on Solana
- **Beautiful dark-themed UI** built with Tailwind CSS
- **Smooth page transitions & toast notifications** using Framer Motion and React Hot Toast

---

## 🛠️ Tech Stack

- **Frontend:** React + Vite
- **Styling:** Tailwind CSS
- **Animation:** Framer Motion
- **Wallet Connection:** `@solana/wallet-adapter`
- **Notifications:** `react-hot-toast`
- **Blockchain:** Solana Devnet

---

## 📸 Screenshots

### 🔹 Home Page
![HomePage Screenshot](https://github.com/anujs101/batua/blob/main/public/Screenshot1.png)

### 🔹 Airdrop Page
![Airdrop Screenshot](https://github.com/anujs101/batua/blob/main/public/Screenshot2.png)

### 🔹 SendToken Page
![Airdrop Screenshot](https://github.com/anujs101/batua/blob/main/public/Screenshot3.png)

### 🔹 Sign/Verify Message Page
![Airdrop Screenshot](https://github.com/anujs101/batua/blob/main/public/Screenshot5.png)

### 🔹 Token Launchpad
![Launchpad Screenshot](https://github.com/anujs101/batua/blob/main/public/Screenshot4.png)

---

## 🔧 Local Setup

### Prerequisites
- Node.js ≥ 18
- Git

### 1. Clone the repository

```bash
git clone https://github.com/anujs101/batua.git
cd batua
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

Batua will be running at `http://localhost:5173` 🚀

---

## 🌐 Connect to Solana Devnet

Make sure your wallet (like Phantom or Solflare) is connected to **Solana Devnet** for full functionality.

---

## 🪙 Token Launchpad (Bonus)

Use the Token Launchpad tab to deploy your own token on Devnet. Just input:
- **Token Name**
- **Token Symbol**
- **Total Supply**

And let Batua handle the rest!

---

## 🤝 Contributing

Pull requests and issues are welcome! If you have suggestions or feature ideas, feel free to open an issue or a PR.

---

## 📄 License

MIT License

---

## 👨‍💻 Author

Made by [Anuj](https://github.com/anujs101)

---

## ✨ Inspiration

Batua means "wallet" in Hindi — built to empower users with real Web3 tools in a beautiful, beginner-friendly package.

## Environment Variables

This project uses environment variables to store sensitive information. Create a `.env` file in the root directory with the following variables:

```
# Pinata API credentials for IPFS metadata storage
VITE_PINATA_API_KEY=your_pinata_api_key_here
VITE_PINATA_API_SECRET=your_pinata_api_secret_here

# Cloudinary configuration for token logo uploads
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_cloudinary_upload_preset
```

Replace the placeholder values with your actual API keys and credentials.
