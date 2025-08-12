const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  const addresses = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../../apps/config/addresses.json'), 'utf8')
  );
  const pool = addresses.lendingPool;
  const token = addresses.mockStable;
  if (!pool || !token) throw new Error('Missing lendingPool or mockStable');

  const [signer] = await ethers.getSigners();
  const me = await signer.getAddress();
  console.log('Signer:', me);

  const ms = await ethers.getContractAt([
    'function mint(address,uint256)',
    'function approve(address,uint256) returns (bool)',
    'function balanceOf(address) view returns (uint256)'
  ], token, signer);
  const lp = await ethers.getContractAt([
    'function deposit(uint256 assets, address receiver) returns (uint256 shares)',
    'function totalAssets() view returns (uint256)'
  ], pool, signer);

  const mintAmt = ethers.parseUnits('1000', 6);
  const bal = await ms.balanceOf(me);
  console.log('My balance before:', bal.toString());
  if (bal < mintAmt) {
    const txm = await ms.mint(me, mintAmt - bal);
    console.log('mint tx:', txm.hash);
    await txm.wait(1);
  }
  const txa = await ms.approve(pool, mintAmt);
  await txa.wait(1);
  console.log('Approved. Depositing...');
  const tx = await lp.deposit(mintAmt, me);
  console.log('deposit tx:', tx.hash);
  const rc = await tx.wait(1);
  console.log('Deposited in block:', rc.blockNumber);
  const ta = await lp.totalAssets();
  console.log('Pool totalAssets:', ta.toString());
}

main().catch((e) => { console.error(e); process.exit(1); });


