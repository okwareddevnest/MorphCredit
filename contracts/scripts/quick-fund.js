const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Quick funding with deployer:", deployer.address);

  const lendingPool = await ethers.getContractAt("LendingPool", "0x22D194Bb22f66731421C5F93163a7DFC05D2Ed5f");
  const mockStable = await ethers.getContractAt("MockStable", "0x4311bF09e2F08e9A55E9DE66EE51561C063A008E");
  
  // Mint directly to deployer (faster)
  console.log("Minting 500 USDC to deployer...");
  const mintTx = await mockStable.mint(deployer.address, ethers.parseUnits("500", 6), { gasLimit: 200000 });
  await mintTx.wait();
  
  // Quick approve and deposit
  console.log("Approving...");
  const approveTx = await mockStable.approve(lendingPool.target, ethers.parseUnits("500", 6), { gasLimit: 200000 });
  await approveTx.wait();
  
  console.log("Depositing...");
  const depositTx = await lendingPool.deposit(ethers.parseUnits("500", 6), deployer.address, { gasLimit: 500000 });
  await depositTx.wait();
  
  console.log("✅ Pool funded successfully!");
  
  // Quick check
  const totalAssets = await lendingPool.totalAssets();
  console.log("Pool totalAssets:", ethers.formatUnits(totalAssets, 6), "USDC");
}

main().catch(console.error);
