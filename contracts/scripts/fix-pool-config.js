const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  const addresses = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../../apps/config/addresses.json'), 'utf8')
  );
  const pool = addresses.lendingPool;
  const registry = addresses.creditRegistry;
  const ms = addresses.mockStable;
  if (!pool || !registry || !ms) throw new Error('Missing addresses');

  const [signer] = await ethers.getSigners();
  console.log('Admin signer:', await signer.getAddress());

  const poolAbi = [
    'function asset() view returns (address)',
    'function setConfig(uint256,uint256,uint256)'
  ];
  const regAbi = [
    'function setLendingPool(address)'
  ];
  const lp = await ethers.getContractAt(poolAbi, pool, signer);
  const reg = await ethers.getContractAt(regAbi, registry, signer);

  // Ensure registry points to pool (idempotent)
  try {
    const tx1 = await reg.setLendingPool(pool);
    console.log('setLendingPool tx:', tx1.hash);
    await tx1.wait(1);
  } catch (e) {
    console.log('setLendingPool likely already set:', e?.shortMessage || e?.message || '');
  }

  // Relax pool utilization to allow borrowing in demo
  try {
    const tx2 = await lp.setConfig(7000, 1000, 9500);
    console.log('setConfig tx:', tx2.hash);
    await tx2.wait(1);
  } catch (e) {
    console.log('setConfig failed (need admin role?):', e?.shortMessage || e?.message || '');
  }

  console.log('Pool asset:', await lp.asset());
}

main().catch((e) => { console.error(e); process.exit(1); });


