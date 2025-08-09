import addresses from '../../../config/addresses.json';

export interface ContractAddresses {
  scoreOracle: string;
  oracleSigner: string;
  creditRegistry?: string;
  lendingPool?: string;
  bnplFactory?: string;
  locFactory?: string;
}

export const contractAddresses: ContractAddresses = addresses as ContractAddresses;

export const getScoreOracleAddress = (): string => contractAddresses.scoreOracle;
export const getOracleSignerAddress = (): string => contractAddresses.oracleSigner; 
export const getCreditRegistryAddress = (): string | undefined => (contractAddresses as any).creditRegistry;
export const getLendingPoolAddress = (): string | undefined => (contractAddresses as any).lendingPool;
export const getBnplFactoryAddress = (): string | undefined => (contractAddresses as any).bnplFactory;
export const getLocFactoryAddress = (): string | undefined => (contractAddresses as any).locFactory;