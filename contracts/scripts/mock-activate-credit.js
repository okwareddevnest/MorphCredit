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
  const me = await signer.getAddress();
  console.log('Signer:', me);

  const abi = [
    'function states(address) view returns (uint256 limit,uint256 apr,uint256 utilization,uint256 lastUpdate,bool isActive)',
    'function setTierConfig(uint16,uint256,uint256,uint256)',
    'function DEFAULT_ADMIN_ROLE() view returns (bytes32)',
    'function hasRole(bytes32,address) view returns (bool)'
  ];
  const reg = await ethers.getContractAt(abi, regAddr, signer);
  const admin = await reg.DEFAULT_ADMIN_ROLE();
  const isAdmin = await reg.hasRole(admin, me);
  console.log('Is admin:', isAdmin);
  if (!isAdmin) {
    console.log('Not admin; cannot modify tier config');
    return;
  }
  // Make tier A more permissive: large base limit and max utilization
  const tx = await reg.setTierConfig(850, ethers.parseUnits('1000000', 6), 500, 9000);
  console.log('setTierConfig tx:', tx.hash);
  await tx.wait(1);
  const st = await reg.states(me);
  console.log('state after:', st);
}

main().catch((e) => { console.error(e); process.exit(1); });



