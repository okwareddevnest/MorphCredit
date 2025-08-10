const { ethers } = require("hardhat");

async function main() {
  const lendingPool = await ethers.getContractAt("LendingPool", "0x22D194Bb22f66731421C5F93163a7DFC05D2Ed5f");
  const mockStable = await ethers.getContractAt("MockStable", "0x4311bF09e2F08e9A55E9DE66EE51561C063A008E");
  
  console.log("Checking LendingPool liquidity and MockStable...");
  
  try {
    // Check pool balance
    const poolBalance = await mockStable.balanceOf("0x22D194Bb22f66731421C5F93163a7DFC05D2Ed5f");
    console.log("Pool USDC balance:", ethers.formatUnits(poolBalance, 6), "USDC");
    
    // Check total assets
    const totalAssets = await lendingPool.totalAssets();
    console.log("Total assets:", ethers.formatUnits(totalAssets, 6), "USDC");
    
    // Calculate available liquidity (assets - reserve)
    const poolState = await lendingPool.poolState();
    const availableAssets = poolState.totalAssets - poolState.reserve;
    console.log("Available assets:", ethers.formatUnits(availableAssets, 6), "USDC");
    
    // Check if we have enough for 399 USDC loan
    const requestedAmount = ethers.parseUnits("399", 6);
    if (availableAssets < requestedAmount) {
      console.log("ERROR: Insufficient liquidity for 399 USDC loan!");
    } else {
      console.log("✅ Sufficient liquidity available");
    }
    
    // Check MockStable total supply
    const totalSupply = await mockStable.totalSupply();
    console.log("MockStable total supply:", ethers.formatUnits(totalSupply, 6), "USDC");
    
  } catch (error) {
    console.error("Failed to check pool state:", error.message);
  }
}

main().catch(console.error);
