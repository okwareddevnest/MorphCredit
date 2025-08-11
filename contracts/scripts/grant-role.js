const { ethers } = require("hardhat");

async function main() {
  console.log("Granting FACTORY_ROLE to new merchant address...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  
  const bnplFactory = await ethers.getContractAt("BNPLFactory", "0x50e43053510E8f25280d335F5c7F30b15CF13965");
  const FACTORY_ROLE = ethers.id("FACTORY_ROLE");
  const newMerchantAddress = "0x99a9542034F9db0e250E6EBf88206d65f60e19ea";
  
  try {
    // Check current role status
    const hasRoleBefore = await bnplFactory.hasRole(FACTORY_ROLE, newMerchantAddress);
    console.log("Merchant has FACTORY_ROLE before:", hasRoleBefore);
    
    if (!hasRoleBefore) {
      // Grant the role
      console.log("Granting FACTORY_ROLE to:", newMerchantAddress);
      const tx = await bnplFactory.grantRole(FACTORY_ROLE, newMerchantAddress);
      console.log("Transaction sent:", tx.hash);
      
      const receipt = await tx.wait();
      console.log("Transaction confirmed in block:", receipt.blockNumber);
      
      // Verify the role was granted
      const hasRoleAfter = await bnplFactory.hasRole(FACTORY_ROLE, newMerchantAddress);
      console.log("Merchant has FACTORY_ROLE after:", hasRoleAfter);
      
      if (hasRoleAfter) {
        console.log("✅ FACTORY_ROLE granted successfully!");
      } else {
        console.log("❌ Failed to grant FACTORY_ROLE");
      }
    } else {
      console.log("✅ Merchant already has FACTORY_ROLE");
    }
    
  } catch (error) {
    console.error("Error granting role:", error.message);
    if (error.reason) {
      console.error("Reason:", error.reason);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
