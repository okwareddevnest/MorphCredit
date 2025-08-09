import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Using admin:", deployer.address);

  const addressesPath = path.join(__dirname, "..", "..", "apps", "config", "addresses.json");
  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));

  const bnplFactoryAddr: string = addresses.bnplFactory;
  const poolAddr: string = addresses.lendingPool;
  const tokenAddr: string = addresses.mockStable;
  const merchantAddr: string = process.env.MERCHANT_ADDR || addresses.oracleSigner || deployer.address;

  console.log("BNPLFactory:", bnplFactoryAddr);
  console.log("LendingPool:", poolAddr);
  console.log("MockStable:", tokenAddr);
  console.log("Granting FACTORY_ROLE to:", merchantAddr);

  const fac = await ethers.getContractAt("BNPLFactory", bnplFactoryAddr);

  // Try initialize (idempotent if not initialized yet)
  try {
    console.log("Initializing factory...");
    const txi = await fac.initialize(tokenAddr, poolAddr, deployer.address, { gasLimit: 2_000_000 });
    await txi.wait();
    console.log("initialize() OK");
  } catch (e: any) {
    console.log("initialize() skipped:", e?.message || e);
  }

  // Ensure BNPLAgreement implementation is set
  let impl = await fac.getImplementation().catch(() => ethers.ZeroAddress);
  if (!impl || impl === ethers.ZeroAddress) {
    console.log("Deploying BNPLAgreement implementation...");
    const Impl = await ethers.getContractFactory("BNPLAgreement");
    const implCtr = await Impl.deploy();
    await implCtr.waitForDeployment();
    impl = await implCtr.getAddress();
    console.log("BNPLAgreement impl:", impl);
    const txs = await fac.setImplementation(impl, { gasLimit: 1_000_000 });
    await txs.wait();
    console.log("setImplementation() OK");
  } else {
    console.log("Implementation already set:", impl);
  }

  // Grant FACTORY_ROLE to merchant
  const role = await fac.FACTORY_ROLE();
  const has = await fac.hasRole(role, merchantAddr);
  if (!has) {
    const txg = await fac.grantRole(role, merchantAddr, { gasLimit: 500_000 });
    await txg.wait();
    console.log("grantRole(FACTORY_ROLE) ->", merchantAddr);
  } else {
    console.log("Merchant already has FACTORY_ROLE");
  }

  console.log("BNPL factory ready.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


