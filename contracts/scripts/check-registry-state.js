const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  const addresses = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../../apps/config/addresses.json'), 'utf8')
  );
  const regAddr = addresses.creditRegistry;
  if (!regAddr) throw new Error('Missing creditRegistry');

  const [signer] = await ethers.getSigners();
  console.log('Signer:', await signer.getAddress());

  const abi = [
    'function scoreOracle() view returns (address)',
    'function lendingPool() view returns (address)',
    'function getAvailableCredit(address user) view returns (uint256)',
    'function hasRole(bytes32,address) view returns (bool)',
    'function DEFAULT_ADMIN_ROLE() view returns (bytes32)',
    'function REGISTRY_ROLE() view returns (bytes32)'
  ];
  const reg = await ethers.getContractAt(abi, regAddr, signer);
  const [oracle, pool] = await Promise.all([
    reg.scoreOracle().catch(() => ethers.ZeroAddress),
    reg.lendingPool().catch(() => ethers.ZeroAddress),
  ]);
  console.log('ScoreOracle:', oracle);
  console.log('LendingPool:', pool);

  const REGISTRY_ROLE = await reg.REGISTRY_ROLE();
  const ADMIN = await reg.DEFAULT_ADMIN_ROLE();
  const me = await signer.getAddress();
  console.log('Has REGISTRY_ROLE (me):', await reg.hasRole(REGISTRY_ROLE, me));
  console.log('Has ADMIN (me):', await reg.hasRole(ADMIN, me));
  console.log('Available credit (me):', (await reg.getAvailableCredit(me)).toString());
}

main().catch((e) => { console.error(e); process.exit(1); });


