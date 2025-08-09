import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("Deploying LendingPool...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance));

  // Read previous addresses
  const deployDir = path.join(__dirname, "..", ".deploy");
  const registryAddress = fs.readFileSync(path.join(deployDir, "registry.addr"), "utf8").trim();
  console.log("Using CreditRegistry address:", registryAddress);

  // Deploy MockStable token first
  console.log("Deploying MockStable token...");
  const MockStable = await ethers.getContractFactory("MockStable");
  const mockStable = await MockStable.deploy(deployer.address);
  await mockStable.waitForDeployment();

  const mockStableAddress = await mockStable.getAddress();
  console.log("MockStable deployed to:", mockStableAddress);

  // Deploy LendingPool
  const LendingPool = await ethers.getContractFactory("LendingPool");
  const lendingPool = await LendingPool.deploy();
  await lendingPool.waitForDeployment();

  const lendingPoolAddress = await lendingPool.getAddress();
  console.log("LendingPool deployed to:", lendingPoolAddress);

  // Initialize LendingPool with explicit gas settings per Morph docs
  const gasPrice = process.env.MORPH_GAS_PRICE ? BigInt(process.env.MORPH_GAS_PRICE) : undefined;
  await lendingPool.initialize(
    mockStableAddress,
    registryAddress,
    deployer.address,
    { gasLimit: 3_000_000, ...(gasPrice ? { gasPrice } : {}) }
  );
  console.log("LendingPool initialized");

  // Write addresses to files
  fs.writeFileSync(path.join(deployDir, "pool.addr"), lendingPoolAddress);
  fs.writeFileSync(path.join(deployDir, "token.addr"), mockStableAddress);

  // Update addresses.json
  const addressesPath = path.join(__dirname, "..", "..", "apps", "config", "addresses.json");
  let addresses: any = {};
  
  if (fs.existsSync(addressesPath)) {
    addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  }

  addresses.lendingPool = lendingPoolAddress;
  addresses.mockStable = mockStableAddress;

  fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));

  console.log("Deployment addresses saved to:");
  console.log("- .deploy/pool.addr");
  console.log("- .deploy/token.addr");
  console.log("- apps/config/addresses.json");

  // Verify deployment
  console.log("\nVerifying deployment...");
  const deployedAsset = await lendingPool.asset();
  const deployedRegistry = await lendingPool.creditRegistry();
  console.log("Asset address:", deployedAsset);
  console.log("CreditRegistry address:", deployedRegistry);
  console.log("Admin role granted:", await lendingPool.hasRole(await lendingPool.DEFAULT_ADMIN_ROLE(), deployer.address));

  // Mint some tokens to the pool for testing
  const mintAmount = ethers.parseUnits("1000000", 6); // 1M USDC
  await mockStable.mint(lendingPoolAddress, mintAmount);
  console.log("Minted", ethers.formatUnits(mintAmount, 6), "tokens to pool");

  console.log("LendingPool deployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 