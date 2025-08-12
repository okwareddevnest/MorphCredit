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
    'function updateCreditState(address user)',
    'function getAvailableCredit(address user) view returns (uint256)',
    'function REGISTRY_ROLE() view returns (bytes32)',
    'function hasRole(bytes32,address) view returns (bool)'
  ];
  const reg = await ethers.getContractAt(abi, regAddr, signer);

  const role = await reg.REGISTRY_ROLE();
  const has = await reg.hasRole(role, me);
  console.log('Caller has REGISTRY_ROLE:', has);
  if (!has) {
    console.log('Caller lacks REGISTRY_ROLE; attempting to proceed may revert.');
  }

  try {
    const tx = await reg.updateCreditState(me, { gasLimit: 500000 });
    console.log('updateCreditState tx:', tx.hash);
    await tx.wait(1);
  } catch (e) {
    console.error('updateCreditState revert:', e?.shortMessage || e?.message || e);
  }

  console.log('Available credit:', (await reg.getAvailableCredit(me)).toString());
}

main().catch((e) => { console.error(e); process.exit(1); });



