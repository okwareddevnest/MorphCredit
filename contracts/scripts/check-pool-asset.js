const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  const addresses = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../../apps/config/addresses.json'), 'utf8')
  );
  const pool = addresses.lendingPool;
  const ms = addresses.mockStable;
  if (!pool || !ms) throw new Error('Missing pool or mockStable address');

  const lp = await ethers.getContractAt(['function asset() view returns (address)'], pool);
  const asset = await lp.asset();
  console.log('LendingPool.asset:', asset);
  console.log('Expected MockStable:', ms);
  console.log('Matches:', asset.toLowerCase() === ms.toLowerCase());
}

main().catch((e) => { console.error(e); process.exit(1); });


