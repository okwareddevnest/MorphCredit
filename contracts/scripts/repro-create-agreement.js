const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  const addresses = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../../apps/config/addresses.json'), 'utf8')
  );

  const facAddr = addresses.bnplFactory;
  if (!facAddr) throw new Error('bnplFactory missing');

  const [signer] = await ethers.getSigners();
  const me = await signer.getAddress();
  console.log('Signer:', me);

  const abi = [
    'function createAgreement(address,address,uint256,uint256,uint256) returns (address)',
    'function hasRole(bytes32,address) view returns (bool)',
    'function FACTORY_ROLE() view returns (bytes32)',
    'function getImplementation() view returns (address)',
    'function asset() view returns (address)',
    'function lendingPool() view returns (address)'
  ];

  const fac = await ethers.getContractAt(abi, facAddr, signer);
  const role = await fac.FACTORY_ROLE();
  const [impl, has] = await Promise.all([
    fac.getImplementation(),
    fac.hasRole(role, me),
  ]);
  console.log('Implementation:', impl);
  console.log('Caller has FACTORY_ROLE:', has);

  const amt = process.env.AMOUNT || '400';
  const principal = ethers.parseUnits(String(amt), 6);
  const installments = 4;
  const aprBps = 1000;

  console.log('Calling createAgreement(...)');
  try {
    const addr = await fac.callStatic.createAgreement(me, me, principal, installments, aprBps);
    console.log('Static call would succeed, new address:', addr);
  } catch (e) {
    console.error('Static call revert:', e);
  }

  try {
    const tx = await fac.createAgreement(me, me, principal, installments, aprBps, { gasLimit: 2_500_000 });
    console.log('Sent tx:', tx.hash);
    const rc = await tx.wait(1);
    console.log('Mined in block:', rc.blockNumber);
    try {
      const iface = new ethers.Interface([
        'event AgreementCreated(address indexed borrower, address indexed merchant, address agreement, uint256 principal)'
      ]);
      const logs = (rc.logs || []).filter((l) => (l.address || '').toLowerCase() === facAddr.toLowerCase());
      for (const log of logs) {
        try {
          const parsed = iface.parseLog({ topics: log.topics, data: log.data });
          if (parsed?.name === 'AgreementCreated') {
            const agreement = parsed.args.agreement || parsed.args[2];
            console.log('Agreement:', agreement);
            break;
          }
        } catch {}
      }
    } catch {}
  } catch (e) {
    console.error('Send tx revert:', e);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });


