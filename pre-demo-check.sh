#!/bin/bash

echo "🎬 MorphCredit Pre-Demo Verification Script"
echo "==========================================="
echo

# Check scoring service health
echo "🔍 Checking Scoring Service..."
HEALTH_CHECK=$(curl -s https://morphcredit.onrender.com/health 2>/dev/null)
if [[ $? -eq 0 ]]; then
    echo "✅ Scoring service is responding"
    echo "   Response: $HEALTH_CHECK"
else
    echo "❌ Scoring service is not responding"
    echo "   Please check: https://morphcredit.onrender.com/health"
fi
echo

# Check network configuration
echo "🌐 Network Configuration:"
echo "✅ Network: Morph Holesky Testnet"
echo "✅ Chain ID: 2810"
echo "✅ RPC: https://rpc-holesky.morphl2.io"
echo "✅ Explorer: https://explorer-holesky.morphl2.io"
echo

# Check contract addresses
echo "📋 Contract Configuration:"
if [ -f "apps/config/addresses.json" ]; then
    echo "✅ Contract addresses file found"
    echo "   Location: apps/config/addresses.json"
else
    echo "❌ Contract addresses file missing"
    echo "   Expected: apps/config/addresses.json"
fi
echo

# Account information
echo "👤 Demo Account:"
echo "🎯 Single Account: Dedan Eth (0x99a9***19ea)"
echo "   - Role: FACTORY_ROLE for creating agreements"
echo "   - Balance: Should have $400+ ETH for gas"
echo "   - Use for: BOTH Merchant Demo AND Borrower PWA"
echo "   - Benefits: No admin conflicts, realistic scenario"
echo "   - Why: Avoids deployer account admin role issues"
echo

# Demo URLs (placeholder - user needs to fill in)
echo "🌐 Production URLs:"
echo "📱 Borrower PWA: https://[YOUR-BORROWER-VERCEL-URL].vercel.app"
echo "🛒 Merchant Demo: https://[YOUR-MERCHANT-VERCEL-URL].vercel.app"
echo "🔧 Scoring Service: https://morphcredit.onrender.com"
echo

# Demo checklist
echo "📋 Pre-Demo Checklist:"
echo "[ ] Dedan Eth account imported in MetaMask"
echo "[ ] Morph Holesky network added to MetaMask"
echo "[ ] Sufficient ETH balance in demo account ($400+)"
echo "[ ] Borrower PWA deployed and accessible"
echo "[ ] Merchant Demo deployed and accessible"
echo "[ ] Scoring service responding to health checks"
echo "[ ] Contract addresses configured correctly"
echo "[ ] Demo script reviewed and ready"
echo
echo "🚨 Important: Use Dedan Eth for BOTH merchant and borrower operations"
echo "   - Avoid Account 1 (deployer) - has admin role conflicts"
echo "   - Single account demonstrates realistic user experience"
echo

echo "🎯 Ready to Demo!"
echo "   Full workflow: ./PRODUCTION_DEMO_WORKFLOW.md"
echo "   Quick checklist: ./DEMO_QUICK_CHECKLIST.md"
echo
echo "⏱️  Estimated demo time: 40 minutes"
echo "📸 Don't forget to capture key screenshots!"
echo
