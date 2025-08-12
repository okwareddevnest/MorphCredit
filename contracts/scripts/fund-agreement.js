const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  const addresses = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../../apps/config/addresses.json'), 'utf8')
  );
  const facAddr = addresses.bnplFactory;
  if (!facAddr) throw new Error('Missing bnplFactory');

  const [signer] = await ethers.getSigners();
  const me = await signer.getAddress();
  console.log('Signer:', me);

  const fac = await ethers.getContractAt([
    'function getAgreementsByUser(address) view returns (address[])'
  ], facAddr, signer);
  const arr = await fac.getAgreementsByUser(me);
  if (!arr.length) { console.log('No agreements'); return; }
  const agAddr = arr[arr.length - 1];
  console.log('Funding agreement:', agAddr);

  const ag = await ethers.getContractAt(['function fund()','function getAgreement() view returns (tuple(uint256 principal,address borrower,address merchant,uint256 installments,uint256 installmentAmount,uint256 apr,uint256 penaltyRate,uint256[] dueDates,uint8 status,uint256 paidInstallments,uint256 lastPaymentDate,uint256 gracePeriod,uint256 writeOffPeriod))'], agAddr, signer);
  try {
    const tx = await ag.fund({ gasLimit: 2_000_000 });
    console.log('fund tx:', tx.hash);
    const rc = await tx.wait(1);
    console.log('Funded block:', rc.blockNumber);
  } catch (e) {
    console.error('fund revert:', e?.shortMessage || e?.message || e);
  }
  const a = await ag.getAgreement();
  console.log('Status now:', Number(a.status));
}

main().catch((e) => { console.error(e); process.exit(1); });



