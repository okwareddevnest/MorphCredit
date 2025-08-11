const { ethers } = require("hardhat");
const addresses = require("../../apps/config/addresses.json");

async function main() {
  console.log("Granting FACTORY_ROLE to merchant address...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  
  const bnplFactory = await ethers.getContractAt("BNPLFactory", addresses.bnplFactory);
  const FACTORY_ROLE = ethers.id("FACTORY_ROLE");
  const merchantAddress = addresses.oracleSigner; // Use oracle signer as merchant
  
  try {
    // Check current role status
    const hasRoleBefore = await bnplFactory.hasRole(FACTORY_ROLE, merchantAddress);
    console.log("Merchant has FACTORY_ROLE before:", hasRoleBefore);
    
    if (!hasRoleBefore) {
      // Grant the role
      console.log("Granting FACTORY_ROLE to:", merchantAddress);
      const tx = await bnplFactory.grantRole(FACTORY_ROLE, merchantAddress);
      console.log("Transaction sent:", tx.hash);
      
      const receipt = await tx.wait();
      console.log("Transaction confirmed in block:", receipt.blockNumber);
      
      // Verify the role was granted
      const hasRoleAfter = await bnplFactory.hasRole(FACTORY_ROLE, merchantAddress);
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
