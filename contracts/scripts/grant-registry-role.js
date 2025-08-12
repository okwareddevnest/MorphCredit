const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const addresses = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../../apps/config/addresses.json"), "utf8")
  );
  const regAddr = addresses.creditRegistry;
  const poolAddr = addresses.lendingPool;
  if (!regAddr || !poolAddr) throw new Error("Missing creditRegistry or lendingPool in addresses.json");

  const [signer] = await ethers.getSigners();
  console.log("Admin signer:", await signer.getAddress());

  const abi = [
    "function REGISTRY_ROLE() view returns (bytes32)",
    "function hasRole(bytes32,address) view returns (bool)",
    "function grantRole(bytes32,address)",
  ];
  const reg = await ethers.getContractAt(abi, regAddr, signer);
  const role = await reg.REGISTRY_ROLE();
  const has = await reg.hasRole(role, poolAddr);
  console.log("LendingPool has REGISTRY_ROLE:", has);
  if (!has) {
    console.log("Granting REGISTRY_ROLE to LendingPool:", poolAddr);
    const tx = await reg.grantRole(role, poolAddr);
    console.log("tx:", tx.hash);
    await tx.wait(1);
    console.log("Granted.");
  } else {
    console.log("Already granted.");
  }
}

main().catch((e) => { console.error(e); process.exit(1); });


