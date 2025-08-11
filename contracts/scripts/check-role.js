const { ethers } = require("hardhat");
const addresses = require("../../apps/config/addresses.json");

async function main() {
  const bnplFactory = await ethers.getContractAt("BNPLFactory", addresses.bnplFactory);
  const FACTORY_ROLE = ethers.id("FACTORY_ROLE");
  const merchantAddress = addresses.oracleSigner;
  
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
