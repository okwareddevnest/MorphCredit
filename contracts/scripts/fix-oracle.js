const { ethers } = require("hardhat");
const path = require("path");
const fs = require("fs");

async function main() {
  const addressesPath = path.join(__dirname, "../../apps/config/addresses.json");
  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));

  const scoreOracleAddr = addresses.scoreOracle;
  const desiredOracleSigner = addresses.oracleSigner;

  if (!scoreOracleAddr) throw new Error("Missing scoreOracle address in addresses.json");
  if (!desiredOracleSigner) throw new Error("Missing oracleSigner in addresses.json");

  const [signer] = await ethers.getSigners();
  console.log("Admin signer:", signer.address);

  const oracle = await ethers.getContractAt("ScoreOracle", scoreOracleAddr, signer);

  const ORACLE_ROLE = await oracle.ORACLE_ROLE();
  const DEFAULT_ADMIN_ROLE = await oracle.DEFAULT_ADMIN_ROLE();
  const isAdmin = await oracle.hasRole(DEFAULT_ADMIN_ROLE, signer.address);
  console.log("Is admin:", isAdmin);
  if (!isAdmin) {
    console.log("WARNING: current signer is not admin; attempts to change config will revert.");
  }

  const currentSigner = await oracle.getOracleSigner();
  console.log("Current oracleSigner:", currentSigner);

  if (currentSigner.toLowerCase() !== desiredOracleSigner.toLowerCase()) {
    console.log("Updating oracleSigner to:", desiredOracleSigner);
    const tx = await oracle.setOracleSigner(desiredOracleSigner);
    const rc = await tx.wait();
    console.log("setOracleSigner tx:", rc.hash);
  } else {
    console.log("oracleSigner already set correctly.");
  }

  const hasRole = await oracle.hasRole(ORACLE_ROLE, desiredOracleSigner);
  console.log("Has ORACLE_ROLE:", hasRole);
  if (!hasRole) {
    console.log("Granting ORACLE_ROLE to:", desiredOracleSigner);
    const tx2 = await oracle.grantRole(ORACLE_ROLE, desiredOracleSigner);
    const rc2 = await tx2.wait();
    console.log("grantRole tx:", rc2.hash);
  } else {
    console.log("ORACLE_ROLE already granted.");
  }

  // Re-read
  const finalSigner = await oracle.getOracleSigner();
  const finalHasRole = await oracle.hasRole(ORACLE_ROLE, desiredOracleSigner);
  console.log("Final oracleSigner:", finalSigner);
  console.log("Final has ORACLE_ROLE:", finalHasRole);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});


