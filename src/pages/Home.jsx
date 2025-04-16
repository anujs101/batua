import { useEffect } from "react"
import { Link } from "react-router-dom"
import { motion, useAnimation } from "framer-motion"
import { ArrowRight, Coins, Send, FileSignature, Rocket } from "lucide-react"

export default function Home() {
  const controls = useAnimation()

  useEffect(() => {
    controls.start("visible")
  }, [controls])

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <div className="container mx-auto px-4">
      {/* Hero Section */}
      <motion.section
        className="py-20 text-center"
        initial="hidden"
        animate={controls}
        variants={fadeIn}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-cyan-500 mb-6">
          Welcome to Batua
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-10">
          The next generation Web3 wallet for the Solana ecosystem. Airdrop, send tokens, sign messages, and launch your
          own token with ease.
        </p>
        <Link
          to="/airdrop"
          className="inline-flex items-center px-8 py-3 text-lg font-medium rounded-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 transition-all duration-300 shadow-lg shadow-purple-500/20 futuristic-hover-button"
        >
          Get Started <ArrowRight className="ml-2 h-5 w-5" />
        </Link>
      </motion.section>

      {/* Features Section */}
      <motion.section
        className="py-16"
        initial="hidden"
        animate={controls}
        variants={fadeIn}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: "Airdrop",
              description: "Request SOL tokens to your wallet on the testnet",
              icon: <Coins className="h-10 w-10 text-purple-500" />,
              link: "/airdrop",
            },
            {
              title: "Send Token",
              description: "Transfer tokens to any Solana wallet address",
              icon: <Send className="h-10 w-10 text-cyan-500" />,
              link: "/send",
            },
            {
              title: "Sign Message",
              description: "Cryptographically sign and verify messages",
              icon: <FileSignature className="h-10 w-10 text-purple-500" />,
              link: "/sign",
            },
            {
              title: "Token Launchpad",
              description: "Create your own token on Solana in minutes",
              icon: <Rocket className="h-10 w-10 text-cyan-500" />,
              link: "/launchpad",
            },
          ].map((feature, index) => (
            <motion.div
              key={index}
              className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:border-purple-500/50 transition-all duration-300 futuristic-hover-card"
              whileHover={{ y: -5 }}
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-gray-400 mb-4">{feature.description}</p>
              <Link to={feature.link} className="inline-flex items-center text-purple-400 hover:text-purple-300">
                Explore <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* About Section */}
      <motion.section
        className="py-16"
        initial="hidden"
        animate={controls}
        variants={fadeIn}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">About Batua</h2>
          <p className="text-gray-300 mb-6">
            Batua is a cutting-edge Web3 wallet interface designed for the Solana blockchain. Our platform provides a
            seamless experience for managing your digital assets, interacting with decentralized applications, and
            exploring the world of Web3.
          </p>
          <p className="text-gray-300">
            Built with security, speed, and simplicity in mind, Batua empowers both newcomers and experienced users to
            make the most of their Solana journey.
          </p>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-16 py-8 text-center text-gray-400">
        <p>© {new Date().getFullYear()} Batua. All rights reserved.</p>
        <div className="flex justify-center gap-4 mt-4">
          <a href="#" className="hover:text-purple-400 transition-colors">
            Terms
          </a>
          <a href="#" className="hover:text-purple-400 transition-colors">
            Privacy
          </a>
          <a href="#" className="hover:text-purple-400 transition-colors">
            Docs
          </a>
        </div>
      </footer>
    </div>
  )
}
