const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  const addresses = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../../apps/config/addresses.json'), 'utf8')
  );
  const regAddr = addresses.creditRegistry;
  if (!regAddr) throw new Error('Missing creditRegistry');

  const target = process.env.TARGET || (await (await ethers.getSigners())[0].getAddress());
  console.log('Update credit state for:', target);

  const [signer] = await ethers.getSigners();
  const abi = [
    'function updateCreditState(address user)',
    'function getAvailableCredit(address user) view returns (uint256)'
  ];
  const reg = await ethers.getContractAt(abi, regAddr, signer);

  const tx = await reg.updateCreditState(target);
  console.log('updateCreditState tx:', tx.hash);
  await tx.wait(1);
  console.log('Available credit now:', (await reg.getAvailableCredit(target)).toString());
}

main().catch((e) => { console.error(e); process.exit(1); });


