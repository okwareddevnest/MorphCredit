import { ethers } from 'ethers';
import addresses from '../../../config/addresses.json';

export type HexString = `0x${string}`;

export const SCORE_ORACLE_ABI = [
  'function getScore(address user) view returns (tuple(uint16 score, uint16 pd_bps, bytes32 featuresRoot, uint64 expiry, bytes sig))'
];

export const CREDIT_REGISTRY_SIMPLE_ABI = [
  'function getState(address user) view returns (tuple(uint256 limit, uint256 apr, uint256 utilization, uint256 lastUpdate, bool isActive))'
];

export const BNPL_FACTORY_ABI = [
  'function getAgreementsByUser(address user) view returns (address[])',
  'function getAllUserAgreements(address user) view returns (address[] borrowerAgreements, address[] merchantAgreements)'
];

export const BNPL_AGREEMENT_ABI = [
  'function getAgreement() view returns (tuple(uint256 principal,address borrower,address merchant,uint256 installments,uint256 installmentAmount,uint256 apr,uint256 penaltyRate,uint256[] dueDates,uint8 status,uint256 paidInstallments,uint256 lastPaymentDate,uint256 gracePeriod,uint256 writeOffPeriod))',
  'function getAllInstallments() view returns (tuple(uint256 id,uint256 amount,uint256 dueDate,bool isPaid,uint256 paidAt,uint256 penaltyAccrued)[])',
  'function calculatePenalty(uint256 installmentId) view returns (uint256)',
  'function repay(uint256 installmentId)'
];

export const ERC20_ABI = [
  'function allowance(address owner,address spender) view returns (uint256)',
  'function approve(address spender,uint256 amount) returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

export const contractAddresses = addresses as any as {
  scoreOracle: string;
  creditRegistry?: string;
  lendingPool?: string;
  mockStable?: string;
  bnplFactory?: string;
};

export function getBrowserProvider(): ethers.BrowserProvider {
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    throw new Error('No injected provider found');
  }
  return new ethers.BrowserProvider((window as any).ethereum);
}

export async function getSigner() {
  const provider = getBrowserProvider();
  return provider.getSigner();
}

export async function readScore(user: string) {
  const provider = getBrowserProvider();
  const oracle = new ethers.Contract(contractAddresses.scoreOracle, SCORE_ORACLE_ABI, provider);
  const sr = await oracle.getScore(user);
  return {
    score: Number(sr.score),
    pd_bps: Number(sr.pd_bps),
    expiry: Number(sr.expiry)
  };
}

export async function readRegistryState(user: string) {
  if (!contractAddresses.creditRegistry) return null;
  const provider = getBrowserProvider();
  const registry = new ethers.Contract(contractAddresses.creditRegistry, CREDIT_REGISTRY_SIMPLE_ABI, provider);
  const st = await registry.getState(user);
  return {
    limit: BigInt(st.limit),
    aprBps: Number(st.apr),
    utilization: BigInt(st.utilization),
    isActive: Boolean(st.isActive)
  };
}

export async function listAgreements(user: string): Promise<string[]> {
  if (!contractAddresses.bnplFactory) return [];
  const provider = getBrowserProvider();
  const fac = new ethers.Contract(contractAddresses.bnplFactory, BNPL_FACTORY_ABI, provider);
  
  try {
    // Try the new function that gets agreements where user is borrower OR merchant
    const [borrowerAgreements, merchantAgreements] = await fac.getAllUserAgreements(user);
    // Combine both arrays and remove duplicates
    const allAgreements = [...borrowerAgreements, ...merchantAgreements];
    return [...new Set(allAgreements)]; // Remove duplicates
  } catch (error) {
    // Fallback to old function if new one doesn't exist (backward compatibility)
    console.warn('getAllUserAgreements not available, falling back to getAgreementsByUser:', error);
    const arr: string[] = await fac.getAgreementsByUser(user);
    return arr;
  }
}

export async function readAgreement(addr: string) {
  const provider = getBrowserProvider();
  const ag = new ethers.Contract(addr, BNPL_AGREEMENT_ABI, provider);
  const a = await ag.getAgreement();
  const installments = await ag.getAllInstallments();
  return { agreement: a, installments };
}

export async function repayInstallment(agreement: string, installmentId: number) {
  const provider = getBrowserProvider();
  const signer = await provider.getSigner();
  const ag = new ethers.Contract(agreement, BNPL_AGREEMENT_ABI, signer);
  // figure out amount
  const all = await ag.getAllInstallments();
  const inst = all[installmentId];
  if (!inst) throw new Error('Invalid installment');
  const penalty: bigint = await ag.calculatePenalty(installmentId);
  const total = BigInt(inst.amount) + penalty;
  // approve on mock stable
  if (!contractAddresses.mockStable) throw new Error('Stable token address missing');
  const erc20 = new ethers.Contract(contractAddresses.mockStable, ERC20_ABI, signer);
  const owner = await signer.getAddress();
  const allowance: bigint = await erc20.allowance(owner, agreement);
  if (allowance < total) {
    await (await erc20.approve(agreement, total)).wait();
  }
  const tx = await ag.repay(installmentId);
  await tx.wait();
  return tx.hash;
}


