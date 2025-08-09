import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("Deploying ScoreOracle...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance));

  // Deploy ScoreOracle
  const ScoreOracle = await ethers.getContractFactory("ScoreOracle");
  const oracleSignerRaw = process.env.ORACLE_SIGNER || deployer.address; // separate oracle signer recommended
  let oracleSignerAddr: string;
  try {
    oracleSignerAddr = ethers.getAddress(oracleSignerRaw);
  } catch (e) {
    console.warn("Invalid ORACLE_SIGNER provided, defaulting to deployer address");
    oracleSignerAddr = deployer.address;
  }
  const adminAddr = ethers.getAddress(deployer.address);
  const scoreOracle = await ScoreOracle.deploy(oracleSignerAddr, adminAddr);
  await scoreOracle.waitForDeployment();

  const scoreOracleAddress = await scoreOracle.getAddress();
  console.log("ScoreOracle deployed to:", scoreOracleAddress);
  console.log("ScoreOracle initialized");

  // Grant ORACLE_ROLE to oracleSigner if not admin
  const ORACLE_ROLE = await scoreOracle.ORACLE_ROLE();
  const hasRole = await scoreOracle.hasRole(ORACLE_ROLE, oracleSignerAddr);
  if (!hasRole) {
    console.log("Granting ORACLE_ROLE to:", oracleSignerAddr);
    const txGrant = await scoreOracle.grantRole(ORACLE_ROLE, oracleSignerAddr);
    await txGrant.wait();
    console.log("ORACLE_ROLE granted");
  }

  // Create .deploy directory if it doesn't exist
  const deployDir = path.join(__dirname, "..", ".deploy");
  if (!fs.existsSync(deployDir)) {
    fs.mkdirSync(deployDir, { recursive: true });
  }

  // Write oracle address to file
  fs.writeFileSync(
    path.join(deployDir, "oracle.addr"),
    scoreOracleAddress
  );

  // Create or update addresses.json
  const addressesPath = path.join(__dirname, "..", "..", "apps", "config", "addresses.json");
  let addresses: any = {};
  
  if (fs.existsSync(addressesPath)) {
    addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  }

  addresses.scoreOracle = scoreOracleAddress;
  addresses.oracleSigner = oracleSignerAddr;

  // Ensure apps/config directory exists
  const configDir = path.dirname(addressesPath);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));

  console.log("Deployment addresses saved to:");
  console.log("- .deploy/oracle.addr");
  console.log("- apps/config/addresses.json");

  // Verify deployment
  console.log("\nVerifying deployment...");
  const deployedOracleSigner = await scoreOracle.getOracleSigner();
  console.log("Oracle signer:", deployedOracleSigner);
  console.log("Admin role granted:", await scoreOracle.hasRole(await scoreOracle.DEFAULT_ADMIN_ROLE(), deployer.address));

  console.log("ScoreOracle deployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 