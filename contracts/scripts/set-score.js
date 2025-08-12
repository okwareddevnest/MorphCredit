const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  const addresses = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../../apps/config/addresses.json'), 'utf8')
  );
  const oracleAddr = addresses.scoreOracle;
  if (!oracleAddr) throw new Error('Missing scoreOracle');

  const [signer] = await ethers.getSigners();
  const me = await signer.getAddress();
  console.log('Oracle signer:', me);

  const abi = [
    'function setScore(address user, (uint16 score,uint16 pd_bps,bytes32 featuresRoot,uint64 expiry,bytes sig) sr) external',
    'function getOracleSigner() view returns (address)'
  ];
  const oracle = await ethers.getContractAt(abi, oracleAddr, signer);

  // Prepare a valid report for current signer as borrower
  const user = me; // set score for self
  const score = 780; // arbitrary valid score
  const pd_bps = 1200; // 12% PD
  const featuresRoot = ethers.keccak256(ethers.toUtf8Bytes('features'));
  const expiry = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30 days

  const messageHash = ethers.keccak256(
    ethers.solidityPacked(
      ['string','address','uint16','uint16','bytes32','uint64'],
      ['MorphCredit Score Report', user, score, pd_bps, featuresRoot, expiry]
    )
  );
  const sig = await signer.signMessage(ethers.getBytes(messageHash));

  const tx = await oracle.setScore(user, { score, pd_bps, featuresRoot, expiry, sig });
  console.log('setScore tx:', tx.hash);
  const rc = await tx.wait(1);
  console.log('Score set in block:', rc.blockNumber);
}

main().catch((e) => { console.error(e); process.exit(1); });


