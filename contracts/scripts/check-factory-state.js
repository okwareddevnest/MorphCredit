const { ethers } = require("hardhat");

async function main() {
  const bnplFactory = await ethers.getContractAt("BNPLFactory", "0x50e43053510E8f25280d335F5c7F30b15CF13965");
  
  console.log("BNPLFactory state:");
  
  try {
    const implementation = await bnplFactory.implementation();
    console.log("Implementation address:", implementation);
    
    const asset = await bnplFactory.asset();
    console.log("Asset address:", asset);
    
    const lendingPool = await bnplFactory.lendingPool();
    console.log("LendingPool address:", lendingPool);
    
    // Check if implementation is set
    if (implementation === ethers.ZeroAddress) {
      console.log("ERROR: Implementation not set!");
    }
    
    // Check if asset is set
    if (asset === ethers.ZeroAddress) {
      console.log("ERROR: Asset not set!");
    }
    
    // Check if lending pool is set
    if (lendingPool === ethers.ZeroAddress) {
      console.log("ERROR: LendingPool not set!");
    }
    
  } catch (error) {
    console.error("Failed to check factory state:", error.message);
  }
}

main().catch(console.error);
