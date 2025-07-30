import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("Deploying Factory Contracts...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance));

  // Read previous addresses
  const deployDir = path.join(__dirname, "..", ".deploy");
  const poolAddress = fs.readFileSync(path.join(deployDir, "pool.addr"), "utf8").trim();
  const registryAddress = fs.readFileSync(path.join(deployDir, "registry.addr"), "utf8").trim();
  const tokenAddress = fs.readFileSync(path.join(deployDir, "token.addr"), "utf8").trim();
  
  console.log("Using LendingPool address:", poolAddress);
  console.log("Using CreditRegistry address:", registryAddress);
  console.log("Using MockStable address:", tokenAddress);

  // Deploy BNPLFactory
  console.log("Deploying BNPLFactory...");
  const BNPLFactory = await ethers.getContractFactory("BNPLFactory");
  const bnplFactory = await BNPLFactory.deploy();
  await bnplFactory.waitForDeployment();

  const bnplFactoryAddress = await bnplFactory.getAddress();
  console.log("BNPLFactory deployed to:", bnplFactoryAddress);

  // Deploy LoCFactory
  console.log("Deploying LoCFactory...");
  const LoCFactory = await ethers.getContractFactory("LoCFactory");
  const locFactory = await LoCFactory.deploy();
  await locFactory.waitForDeployment();

  const locFactoryAddress = await locFactory.getAddress();
  console.log("LoCFactory deployed to:", locFactoryAddress);

  // Initialize factories
  await bnplFactory.initialize(tokenAddress, poolAddress, deployer.address);
  await locFactory.initialize(tokenAddress, registryAddress, deployer.address);
  console.log("Factories initialized");

  // Link CreditRegistry to LendingPool
  console.log("Linking CreditRegistry to LendingPool...");
  const creditRegistry = await ethers.getContractAt("CreditRegistry", registryAddress);
  await creditRegistry.setLendingPool(poolAddress);
  console.log("CreditRegistry linked to LendingPool");

  // Write factory addresses to files
  fs.writeFileSync(path.join(deployDir, "bnpl-factory.addr"), bnplFactoryAddress);
  fs.writeFileSync(path.join(deployDir, "loc-factory.addr"), locFactoryAddress);

  // Update addresses.json
  const addressesPath = path.join(__dirname, "..", "..", "apps", "config", "addresses.json");
  let addresses: any = {};
  
  if (fs.existsSync(addressesPath)) {
    addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  }

  addresses.bnplFactory = bnplFactoryAddress;
  addresses.locFactory = locFactoryAddress;

  fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));

  console.log("Deployment addresses saved to:");
  console.log("- .deploy/bnpl-factory.addr");
  console.log("- .deploy/loc-factory.addr");
  console.log("- apps/config/addresses.json");

  // Verify deployment
  console.log("\nVerifying deployment...");
  const bnplAsset = await bnplFactory.asset();
  const bnplPool = await bnplFactory.lendingPool();
  const locAsset = await locFactory.asset();
  const locRegistry = await locFactory.creditRegistry();
  
  console.log("BNPLFactory asset:", bnplAsset);
  console.log("BNPLFactory pool:", bnplPool);
  console.log("LoCFactory asset:", locAsset);
  console.log("LoCFactory registry:", locRegistry);
  
  console.log("Admin roles granted:", 
    await bnplFactory.hasRole(await bnplFactory.DEFAULT_ADMIN_ROLE(), deployer.address),
    await locFactory.hasRole(await locFactory.DEFAULT_ADMIN_ROLE(), deployer.address)
  );

  console.log("Factory deployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 