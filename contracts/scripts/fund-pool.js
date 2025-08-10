const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Funding pool with deployer:", deployer.address);

  const lendingPool = await ethers.getContractAt("LendingPool", "0x22D194Bb22f66731421C5F93163a7DFC05D2Ed5f");
  const mockStable = await ethers.getContractAt("MockStable", "0x4311bF09e2F08e9A55E9DE66EE51561C063A008E");
  
  // Check current balances
  const deployerBalance = await mockStable.balanceOf(deployer.address);
  console.log("Deployer USDC balance:", ethers.formatUnits(deployerBalance, 6), "USDC");
  
  const poolBalance = await mockStable.balanceOf(lendingPool.target);
  console.log("Pool contract USDC balance:", ethers.formatUnits(poolBalance, 6), "USDC");
  
  const totalAssets = await lendingPool.totalAssets();
  console.log("Pool totalAssets:", ethers.formatUnits(totalAssets, 6), "USDC");
  
  // Mint more USDC to deployer if needed
  if (deployerBalance < ethers.parseUnits("1000", 6)) {
    console.log("Minting USDC to deployer...");
    const mintTx = await mockStable.mint(deployer.address, ethers.parseUnits("1000", 6));
    await mintTx.wait();
    console.log("✅ Minted 1000 USDC to deployer");
  }
  
  // Approve and deposit to pool
  const depositAmount = ethers.parseUnits("500", 6); // 500 USDC
  console.log("Approving and depositing", ethers.formatUnits(depositAmount, 6), "USDC to pool...");
  
  const approveTx = await mockStable.approve(lendingPool.target, depositAmount);
  await approveTx.wait();
  console.log("✅ Approved");
  
  const depositTx = await lendingPool.deposit(depositAmount, deployer.address);
  await depositTx.wait();
  console.log("✅ Deposited to pool");
  
  // Check new state
  const newTotalAssets = await lendingPool.totalAssets();
  console.log("New pool totalAssets:", ethers.formatUnits(newTotalAssets, 6), "USDC");
  
  const poolState = await lendingPool.poolState();
  const availableAssets = poolState.totalAssets - poolState.reserve;
  console.log("Available assets:", ethers.formatUnits(availableAssets, 6), "USDC");
}

main().catch(console.error);
