import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Menu, 
  X, 
  Smartphone, 
  ShoppingCart, 
  Code, 
  Shield, 
  Zap, 
  Users, 
  TrendingUp, 
  CheckCircle, 
  ExternalLink,
  Github,
  Twitter,
  Cpu,
  CreditCard,
  Globe
} from 'lucide-react'

// Navigation Component
const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navItems = [
    { name: 'Features', href: '#features' },
    { name: 'Solutions', href: '#solutions' },
    { name: 'SDK', href: '#sdk' },
    { name: 'Demo', href: '#demo' },
    { name: 'Contact', href: '#contact' }
  ]

  return (
    <motion.nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass-dark shadow-lg' : ''
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.div 
            className="flex items-center space-x-2"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <img src="/morpho_credit-logo.png" alt="MorphCredit" className="h-8 w-8" />
            <span className="text-xl font-bold text-white">MorphCredit</span>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <motion.a
                key={item.name}
                href={item.href}
                className="text-gray-300 hover:text-white transition-colors duration-200"
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                {item.name}
              </motion.a>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            className="md:hidden text-white"
            onClick={() => setIsOpen(!isOpen)}
            whileTap={{ scale: 0.95 }}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </motion.button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="md:hidden glass-dark rounded-lg mt-2 p-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              {navItems.map((item, index) => (
                <motion.a
                  key={item.name}
                  href={item.href}
                  className="block py-2 text-gray-300 hover:text-white transition-colors duration-200"
                  onClick={() => setIsOpen(false)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {item.name}
                </motion.a>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  )
}

// Hero Section
const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-morph-900 via-morph-800 to-credit-900 animate-gradient"></div>
      
      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.h1 
            className="text-5xl md:text-7xl font-bold text-white mb-6 text-balance"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Revolutionary
            <span className="bg-gradient-to-r from-credit-400 to-morph-400 bg-clip-text text-transparent animate-gradient">
              {" "}BNPL{" "}
            </span>
            on Morph
          </motion.h1>
          
          <motion.p 
            className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto text-balance"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Experience the future of payments with blockchain-powered Buy Now, Pay Later solutions. 
            Credit scoring, flexible installments, and seamless merchant integration.
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <motion.a
              href="https://morphcredit-borrower.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-gradient-to-r from-credit-500 to-credit-600 hover:from-credit-600 hover:to-credit-700 text-white px-8 py-4 rounded-full font-semibold text-lg shadow-xl flex items-center space-x-2 transition-all duration-300"
              whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(16, 185, 129, 0.3)" }}
              whileTap={{ scale: 0.95 }}
            >
              <Smartphone size={20} />
              <span>Launch Borrower App</span>
              <ExternalLink size={16} className="group-hover:translate-x-1 transition-transform" />
            </motion.a>
            
            <motion.a
              href="https://morphcredit-merchant-demo.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="group glass text-white px-8 py-4 rounded-full font-semibold text-lg border border-white/20 hover:border-white/40 flex items-center space-x-2 transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ShoppingCart size={20} />
              <span>Try Merchant Demo</span>
              <ExternalLink size={16} className="group-hover:translate-x-1 transition-transform" />
            </motion.a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

// Features Section
const FeaturesSection = () => {
  const features = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Secure Credit Scoring",
      description: "Advanced on-chain credit assessment using transaction history, DeFi activities, and behavioral patterns.",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Instant Approvals",
      description: "Get approved for credit lines in seconds with our real-time scoring algorithm and smart contracts.",
      gradient: "from-yellow-500 to-orange-500"
    },
    {
      icon: <CreditCard className="w-8 h-8" />,
      title: "Flexible Payments",
      description: "Choose from multiple installment plans with competitive rates and transparent fee structures.",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Global Access",
      description: "Access BNPL services worldwide with decentralized infrastructure and cross-border compatibility.",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: <Cpu className="w-8 h-8" />,
      title: "Smart Contracts",
      description: "Automated loan management with transparent terms, automatic payments, and dispute resolution.",
      gradient: "from-indigo-500 to-blue-500"
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Credit Building",
      description: "Build your on-chain credit history with every successful payment and improve your score over time.",
      gradient: "from-red-500 to-pink-500"
    }
  ]

  return (
    <section id="features" className="py-20 bg-gray-800">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Powerful Features for Modern
            <span className="bg-gradient-to-r from-credit-400 to-morph-400 bg-clip-text text-transparent"> Finance</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Experience the next generation of BNPL with blockchain-powered features designed for users and merchants alike.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="group glass-dark rounded-2xl p-8 hover:shadow-2xl transition-all duration-300"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
            >
              <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${feature.gradient} mb-6 group-hover:scale-110 transition-transform`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
              <p className="text-gray-300 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Solutions Section
const SolutionsSection = () => {
  const solutions = [
    {
      title: "For Borrowers",
      description: "Access instant credit with competitive rates",
      features: [
        "Instant credit scoring",
        "Flexible payment plans", 
        "Build credit history",
        "No hidden fees",
        "Mobile-first experience"
      ],
      icon: <Users className="w-12 h-12" />,
      color: "credit"
    },
    {
      title: "For Merchants", 
      description: "Increase sales with seamless BNPL integration",
      features: [
        "Easy SDK integration",
        "Instant settlements", 
        "Reduced cart abandonment",
        "Risk management",
        "Analytics dashboard"
      ],
      icon: <ShoppingCart className="w-12 h-12" />,
      color: "morph"
    }
  ]

  return (
    <section id="solutions" className="py-20 bg-gray-900">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Solutions for
            <span className="bg-gradient-to-r from-credit-400 to-morph-400 bg-clip-text text-transparent"> Everyone</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Whether you're shopping online or running an e-commerce business, MorphCredit has the perfect solution for you.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {solutions.map((solution, index) => (
            <motion.div
              key={index}
              className="glass-dark rounded-3xl p-8 lg:p-12"
              initial={{ opacity: 0, x: index === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-r from-${solution.color}-500 to-${solution.color}-600 mb-6`}>
                {solution.icon}
              </div>
              <h3 className="text-3xl font-bold mb-4">{solution.title}</h3>
              <p className="text-xl text-gray-300 mb-8">{solution.description}</p>
              <ul className="space-y-4">
                {solution.features.map((feature, featureIndex) => (
                  <motion.li
                    key={featureIndex}
                    className="flex items-center space-x-3"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 + featureIndex * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <CheckCircle className="w-5 h-5 text-credit-500 flex-shrink-0" />
                    <span className="text-gray-300">{feature}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// SDK Section
const SDKSection = () => {
  return (
    <section id="sdk" className="py-20 bg-gray-800">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex p-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 mb-6">
              <Code className="w-8 h-8" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Developer-Friendly
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"> SDK</span>
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Integrate MorphCredit BNPL into your application with just a few lines of code. 
              Our TypeScript SDK provides everything you need for seamless integration.
            </p>
            
            <div className="space-y-4 mb-8">
              {[
                "React components for instant integration",
                "TypeScript support with full type safety", 
                "Comprehensive documentation and examples",
                "Real-time transaction monitoring",
                "Customizable UI components"
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  className="flex items-center space-x-3"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <CheckCircle className="w-5 h-5 text-purple-500" />
                  <span className="text-gray-300">{feature}</span>
                </motion.div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <motion.a
                href="https://www.npmjs.com/package/morphcredit-merchant-sdk"
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-full font-semibold flex items-center space-x-2 transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span>Get SDK</span>
                <ExternalLink size={16} className="group-hover:translate-x-1 transition-transform" />
              </motion.a>
              
              <motion.a
                href="https://github.com/okwareddevnest/MorphCredit"
                target="_blank"
                rel="noopener noreferrer"
                className="group glass text-white px-6 py-3 rounded-full font-semibold border border-white/20 hover:border-white/40 flex items-center space-x-2 transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Github size={16} />
                <span>View on GitHub</span>
                <ExternalLink size={16} className="group-hover:translate-x-1 transition-transform" />
              </motion.a>
            </div>
          </motion.div>

          <motion.div
            className="glass-dark rounded-2xl p-6 lg:p-8"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm overflow-x-auto">
              <div className="text-gray-500 mb-2">// Install the SDK</div>
              <div className="text-credit-400">npm install</div>
              <div className="text-white ml-4">morphcredit-merchant-sdk</div>
              
              <div className="text-gray-500 mt-4 mb-2">// Quick integration</div>
              <div className="text-purple-400">import</div>
              <div className="text-white"> {"{ MorphCreditButton }"}</div>
              <div className="text-purple-400"> from</div>
              <div className="text-yellow-400"> 'morphcredit-merchant-sdk'</div>
              
              <div className="text-gray-500 mt-4 mb-2">// Add to your React app</div>
              <div className="text-blue-400">{"<MorphCreditButton"}</div>
              <div className="text-white ml-2">amount={"{399.99}"}</div>
              <div className="text-white ml-2">onSuccess={"{handleSuccess}"}</div>
              <div className="text-blue-400">{"/>"}</div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// Demo Section
const DemoSection = () => {
  return (
    <section id="demo" className="py-20 bg-gray-900">
      <div className="container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Try It
            <span className="bg-gradient-to-r from-credit-400 to-morph-400 bg-clip-text text-transparent"> Now</span>
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
            Experience MorphCredit in action with our live demos. No setup required - just click and explore!
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <motion.div
            className="glass-dark rounded-3xl p-8 lg:p-12"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="mb-8">
              <div className="inline-flex p-4 rounded-2xl bg-gradient-to-r from-credit-500 to-credit-600 mb-6">
                <Smartphone className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Borrower PWA</h3>
              <p className="text-gray-300 mb-6">
                Mobile-first progressive web app for borrowers. Connect your wallet, 
                get credit scored, and manage your agreements.
              </p>
              <ul className="text-left space-y-2 mb-8">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-credit-500" />
                  <span className="text-gray-300">Instant credit scoring</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-credit-500" />
                  <span className="text-gray-300">Payment management</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-credit-500" />
                  <span className="text-gray-300">Credit history tracking</span>
                </li>
              </ul>
            </div>
            <motion.a
              href="https://morphcredit-borrower.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="group w-full bg-gradient-to-r from-credit-500 to-credit-600 hover:from-credit-600 hover:to-credit-700 text-white px-8 py-4 rounded-full font-semibold text-lg flex items-center justify-center space-x-2 transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>Launch Borrower App</span>
              <ExternalLink size={16} className="group-hover:translate-x-1 transition-transform" />
            </motion.a>
          </motion.div>

          <motion.div
            className="glass-dark rounded-3xl p-8 lg:p-12"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <div className="mb-8">
              <div className="inline-flex p-4 rounded-2xl bg-gradient-to-r from-morph-500 to-morph-600 mb-6">
                <ShoppingCart className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Merchant Demo</h3>
              <p className="text-gray-300 mb-6">
                Full e-commerce experience showcasing BNPL integration. 
                Shop for products and pay with flexible installments.
              </p>
              <ul className="text-left space-y-2 mb-8">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-morph-500" />
                  <span className="text-gray-300">Live product catalog</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-morph-500" />
                  <span className="text-gray-300">Real BNPL checkout</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-morph-500" />
                  <span className="text-gray-300">Order management</span>
                </li>
              </ul>
            </div>
            <motion.a
              href="https://morphcredit-merchant-demo.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="group w-full bg-gradient-to-r from-morph-500 to-morph-600 hover:from-morph-600 hover:to-morph-700 text-white px-8 py-4 rounded-full font-semibold text-lg flex items-center justify-center space-x-2 transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>Try Merchant Demo</span>
              <ExternalLink size={16} className="group-hover:translate-x-1 transition-transform" />
            </motion.a>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// Footer
const Footer = () => {
  return (
    <footer className="bg-gray-900 border-t border-gray-800 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <img src="/morpho_credit-logo.png" alt="MorphCredit" className="h-8 w-8" />
              <span className="text-xl font-bold">MorphCredit</span>
            </div>
            <p className="text-gray-400 mb-6 max-w-md">
              Revolutionary Buy Now, Pay Later solutions powered by blockchain technology. 
              Building the future of decentralized finance.
            </p>
            <div className="flex space-x-4">
              <motion.a
                href="https://github.com/okwareddevnest/MorphCredit"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Github size={24} />
              </motion.a>
              <motion.a
                href="https://twitter.com/morphcredit"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Twitter size={24} />
              </motion.a>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#solutions" className="hover:text-white transition-colors">Solutions</a></li>
              <li><a href="#sdk" className="hover:text-white transition-colors">SDK</a></li>
              <li><a href="#demo" className="hover:text-white transition-colors">Demo</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-white mb-4">Links</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <a href="https://morphcredit-borrower.vercel.app" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  Borrower App
                </a>
              </li>
              <li>
                <a href="https://morphcredit-merchant-demo.vercel.app" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  Merchant Demo
                </a>
              </li>
              <li>
                <a href="https://www.npmjs.com/package/morphcredit-merchant-sdk" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  NPM Package
                </a>
              </li>
              <li>
                <a href="https://github.com/okwareddevnest/MorphCredit" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2025 MorphCredit. Built on Morph Blockchain. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default function App() {
  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <Navigation />
      <HeroSection />
      <FeaturesSection />
      <SolutionsSection />
      <SDKSection />
      <DemoSection />
      <Footer />
    </div>
  )
}
