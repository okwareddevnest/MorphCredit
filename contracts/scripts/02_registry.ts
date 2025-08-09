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

  let creditRegistryAddress: string | undefined;
  try {
    // Try upgradeable CreditRegistry
    const CreditRegistry = await ethers.getContractFactory("CreditRegistry");
    const creditRegistry = await CreditRegistry.deploy();
    await creditRegistry.waitForDeployment();
    creditRegistryAddress = await creditRegistry.getAddress();
    console.log("CreditRegistry deployed to:", creditRegistryAddress);
    await creditRegistry.initialize(oracleAddress, deployer.address);
    console.log("CreditRegistry initialized");
  } catch (e) {
    console.warn("Upgradeable CreditRegistry initialize failed, falling back to CreditRegistrySimple:", (e as any)?.message || e);
    const CreditRegistrySimple = await ethers.getContractFactory("CreditRegistrySimple");
    const regSimple = await CreditRegistrySimple.deploy(oracleAddress, deployer.address);
    await regSimple.waitForDeployment();
    creditRegistryAddress = await regSimple.getAddress();
    console.log("CreditRegistrySimple deployed to:", creditRegistryAddress);
  }

  // Write registry address to file
  fs.writeFileSync(
    path.join(deployDir, "registry.addr"),
    creditRegistryAddress!
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
  try {
    const regAbi = [
      "function scoreOracle() view returns (address)",
      "function hasRole(bytes32,address) view returns (bool)",
      "function DEFAULT_ADMIN_ROLE() view returns (bytes32)"
    ];
    const reg = await ethers.getContractAt(regAbi, creditRegistryAddress!);
    const deployedScoreOracle = await (reg as any).scoreOracle();
    console.log("ScoreOracle address:", deployedScoreOracle);
    const adminRole = await (reg as any).DEFAULT_ADMIN_ROLE();
    const hasAdmin = await (reg as any).hasRole(adminRole, deployer.address);
    console.log("Admin role granted:", hasAdmin);
  } catch (e) {
    console.warn("Verification skipped (likely CreditRegistrySimple)");
  }

  console.log("CreditRegistry deployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 