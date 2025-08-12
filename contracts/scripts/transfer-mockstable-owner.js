const { ethers } = require("hardhat");
const path = require("path");
const fs = require("fs");

async function main() {
  const addressesPath = path.join(__dirname, "../../apps/config/addresses.json");
  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));

  const mockStableAddr = addresses.mockStable;
  const desiredNewOwner = addresses.oracleSigner;

  if (!mockStableAddr) throw new Error("Missing mockStable address in addresses.json");
  if (!desiredNewOwner) throw new Error("Missing oracleSigner (new owner) in addresses.json");

  const [signer] = await ethers.getSigners();
  console.log("Current signer:", signer.address);

  const abi = [
    "function owner() view returns (address)",
    "function transferOwnership(address newOwner) public"
  ];
  const mock = await ethers.getContractAt(abi, mockStableAddr, signer);

  const currentOwner = await mock.owner();
  console.log("MockStable current owner:", currentOwner);

  if (currentOwner.toLowerCase() === desiredNewOwner.toLowerCase()) {
    console.log("Ownership already set to desired owner. Nothing to do.");
    return;
  }

  if (currentOwner.toLowerCase() !== signer.address.toLowerCase()) {
    throw new Error("This signer is not the current owner. Re-run with the OLD owner key.");
  }

  console.log("Transferring ownership to:", desiredNewOwner);
  const tx = await mock.transferOwnership(desiredNewOwner);
  const receipt = await tx.wait();
  console.log("Ownership transfer tx:", receipt.hash);

  const updatedOwner = await mock.owner();
  console.log("New owner:", updatedOwner);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});



