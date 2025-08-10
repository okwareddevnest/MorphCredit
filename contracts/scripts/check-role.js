const { ethers } = require("hardhat");

async function main() {
  const bnplFactory = await ethers.getContractAt("BNPLFactory", "0x50e43053510E8f25280d335F5c7F30b15CF13965");
  const FACTORY_ROLE = ethers.id("FACTORY_ROLE");
  const merchantAddress = "0xcB5478384f9E1179d2dA16B5aF092b886b96188D";
  
  const hasRole = await bnplFactory.hasRole(FACTORY_ROLE, merchantAddress);
  console.log("Merchant has FACTORY_ROLE:", hasRole);
  
  // Check who has the DEFAULT_ADMIN_ROLE
  const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
  const adminRole = await bnplFactory.hasRole(DEFAULT_ADMIN_ROLE, merchantAddress);
  console.log("Merchant has DEFAULT_ADMIN_ROLE:", adminRole);
  
  // Check the deployer address
  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  const deployerHasRole = await bnplFactory.hasRole(FACTORY_ROLE, deployer.address);
  console.log("Deployer has FACTORY_ROLE:", deployerHasRole);
}

main().catch(console.error);
