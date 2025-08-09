import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Admin:", deployer.address);

  const addressesPath = path.join(__dirname, "..", "..", "apps", "config", "addresses.json");
  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));

  const implFactoryAddr: string = addresses.bnplFactory; // existing BNPLFactory implementation address
  const tokenAddr: string = addresses.mockStable;
  const poolAddr: string = addresses.lendingPool;
  const merchantAddr: string = process.env.MERCHANT_ADDR || addresses.oracleSigner || deployer.address;

  if (!implFactoryAddr || !tokenAddr || !poolAddr) {
    throw new Error("Missing addresses in apps/config/addresses.json (bnplFactory/mockStable/lendingPool)");
  }

  console.log("Impl (BNPLFactory):", implFactoryAddr);
  console.log("MockStable:", tokenAddr);
  console.log("LendingPool:", poolAddr);

  // Encode initializer
  const Fac = await ethers.getContractFactory("BNPLFactory");
  const initCalldata = Fac.interface.encodeFunctionData("initialize", [tokenAddr, poolAddr, deployer.address]);

  // Deploy ERC1967Proxy pointing to BNPLFactory impl
  const Proxy = await ethers.getContractFactory("ERC1967ProxyWrapper");
  const proxy = await Proxy.deploy(implFactoryAddr, initCalldata);
  await proxy.waitForDeployment();
  const proxyAddr = await proxy.getAddress();
  console.log("BNPLFactory proxy:", proxyAddr);

  const fac = await ethers.getContractAt("BNPLFactory", proxyAddr);

  // Deploy BNPLAgreement implementation to be cloned by factory
  const AgImpl = await ethers.getContractFactory("BNPLAgreement");
  const agImplCtr = await AgImpl.deploy();
  await agImplCtr.waitForDeployment();
  const agImplAddr = await agImplCtr.getAddress();
  console.log("BNPLAgreement implementation:", agImplAddr);

  // Set agreement implementation (admin only)
  await (await fac.setImplementation(agImplAddr, { gasLimit: 1_000_000 })).wait();
  console.log("setImplementation() OK");

  // Grant FACTORY_ROLE to merchant
  const role = await fac.FACTORY_ROLE();
  const has = await fac.hasRole(role, merchantAddr);
  if (!has) {
    await (await fac.grantRole(role, merchantAddr, { gasLimit: 500_000 })).wait();
    console.log("Granted FACTORY_ROLE to:", merchantAddr);
  } else {
    console.log("Merchant already has FACTORY_ROLE");
  }

  // Persist proxy address for frontends/SDK
  addresses.bnplFactory = proxyAddr;
  addresses.bnplAgreementImpl = agImplAddr;
  fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
  console.log("Updated apps/config/addresses.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


