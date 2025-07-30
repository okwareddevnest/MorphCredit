import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("Deploying CreditRegistry...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance));

  // Read oracle address
  const deployDir = path.join(__dirname, "..", ".deploy");
  const oracleAddress = fs.readFileSync(path.join(deployDir, "oracle.addr"), "utf8").trim();
  console.log("Using ScoreOracle address:", oracleAddress);

  // Deploy CreditRegistry
  const CreditRegistry = await ethers.getContractFactory("CreditRegistry");
  const creditRegistry = await CreditRegistry.deploy();
  await creditRegistry.waitForDeployment();

  const creditRegistryAddress = await creditRegistry.getAddress();
  console.log("CreditRegistry deployed to:", creditRegistryAddress);

  // Initialize CreditRegistry
  await creditRegistry.initialize(oracleAddress, deployer.address);
  console.log("CreditRegistry initialized");

  // Write registry address to file
  fs.writeFileSync(
    path.join(deployDir, "registry.addr"),
    creditRegistryAddress
  );

  // Update addresses.json
  const addressesPath = path.join(__dirname, "..", "..", "apps", "config", "addresses.json");
  let addresses: any = {};
  
  if (fs.existsSync(addressesPath)) {
    addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  }

  addresses.creditRegistry = creditRegistryAddress;

  fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));

  console.log("Deployment addresses saved to:");
  console.log("- .deploy/registry.addr");
  console.log("- apps/config/addresses.json");

  // Verify deployment
  console.log("\nVerifying deployment...");
  const deployedScoreOracle = await creditRegistry.scoreOracle();
  console.log("ScoreOracle address:", deployedScoreOracle);
  console.log("Admin role granted:", await creditRegistry.hasRole(await creditRegistry.DEFAULT_ADMIN_ROLE(), deployer.address));

  console.log("CreditRegistry deployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 