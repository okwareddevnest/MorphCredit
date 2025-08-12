const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  const addresses = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../../apps/config/addresses.json'), 'utf8')
  );

  const bnplFactoryAddr = addresses.bnplFactory;
  const mockStableAddr = addresses.mockStable;
  if (!bnplFactoryAddr || !mockStableAddr) throw new Error('Missing bnplFactory or mockStable address');

  const [signer] = await ethers.getSigners();
  const me = await signer.getAddress();
  console.log('Signer:', me);

  const fac = await ethers.getContractAt(
    [
      'function getAllUserAgreements(address user) view returns (address[] borrowerAgreements, address[] merchantAgreements)',
      'function getAgreementsByUser(address user) view returns (address[])'
    ],
    bnplFactoryAddr,
    signer
  );

  let agreements = [];
  try {
    const [a, b] = await fac.getAllUserAgreements(me);
    agreements = [...a, ...b];
  } catch {
    agreements = await fac.getAgreementsByUser(me);
  }
  agreements = [...new Set(agreements.map((x) => x.toLowerCase()))];
  console.log('Found agreements:', agreements.length);
  if (agreements.length === 0) return;

  const agAbi = 
    [
      'function getAgreement() view returns (tuple(uint256 principal,address borrower,address merchant,uint256 installments,uint256 installmentAmount,uint256 apr,uint256 penaltyRate,uint256[] dueDates,uint8 status,uint256 paidInstallments,uint256 lastPaymentDate,uint256 gracePeriod,uint256 writeOffPeriod))',
      'function getInstallment(uint256 id) view returns (tuple(uint256 id,uint256 amount,uint256 dueDate,bool isPaid,uint256 paidAt,uint256 penaltyAccrued))',
      'function fund()','function repay(uint256 id)'
    ];

  let agAddr = agreements[agreements.length - 1];
  let ag = await ethers.getContractAt(agAbi, agAddr, signer);

  const ms = await ethers.getContractAt([
    'function approve(address,uint256) returns (bool)',
    'function balanceOf(address) view returns (uint256)',
    'function mint(address,uint256)'
  ], mockStableAddr, signer);

  const a = await ag.getAgreement();
  const status = Number(a.status);
  console.log('Agreement status:', status, '(0=Pending,1=Active,2=Completed,3=Defaulted,4=WrittenOff)');

  if (status === 0) {
    console.log('Attempting to fund agreement...');
    try {
      const tx = await ag.fund({ gasLimit: 2_000_000 });
      console.log('fund tx:', tx.hash);
      const rc = await tx.wait(1);
      console.log('funded in block:', rc.blockNumber);
    } catch (e) {
      console.error('fund() revert:', e?.shortMessage || e?.message || e);
    }
  }

  // If not Active, try to find another that is Active
  let a2 = await ag.getAgreement();
  let status2 = Number(a2.status);
  if (status2 !== 1) {
    for (const addr of agreements) {
      const candidate = await ethers.getContractAt(agAbi, addr, signer);
      const ainfo = await candidate.getAgreement();
      if (Number(ainfo.status) === 1) {
        agAddr = addr;
        ag = candidate;
        a2 = ainfo;
        status2 = 1;
        console.log('Switching to active agreement:', agAddr);
        break;
      }
    }
  }
  if (status2 !== 1) {
    console.log('No Active agreements found; cannot repay.');
    return;
  }

  // find next unpaid installment
  let nextId = 0;
  for (let i = 0; i < Number(a2.installments); i++) {
    const inst = await ag.getInstallment(i);
    if (!inst.isPaid) { nextId = i; break; }
  }
  const inst = await ag.getInstallment(nextId);
  const amount = inst.amount;
  console.log('Next installment id:', nextId, 'amount:', amount.toString());

  const bal = await ms.balanceOf(me);
  if (bal < amount) {
    console.log('Minting tokens to cover installment...');
    const txm = await ms.mint(me, amount - bal);
    await txm.wait(1);
  }

  const txa = await ms.approve(agAddr, amount);
  await txa.wait(1);
  console.log('Approved. Repaying...');
  const txr = await ag.repay(nextId, { gasLimit: 1_000_000 });
  const rcr = await txr.wait(1);
  console.log('Repaid. tx:', txr.hash, 'block:', rcr.blockNumber);
}

main().catch((e) => { console.error(e); process.exit(1); });


