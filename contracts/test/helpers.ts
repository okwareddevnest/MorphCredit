import { ethers } from "hardhat";
import { ContractFactory, Contract } from "ethers";

/**
 * Deploy a UUPS upgradeable contract for testing
 * Note: This creates a fresh implementation for each test
 * @param contractName The name of the contract to deploy
 * @param args Arguments for the initialize function
 * @returns The deployed contract
 */
export async function deployUUPSContractForTest(
  contractName: string,
  args: any[] = []
): Promise<Contract> {
  // Deploy a fresh implementation contract for each test
  const Implementation = await ethers.getContractFactory(contractName);
  const implementation = await Implementation.deploy();
  await implementation.waitForDeployment();

  // Initialize if args are provided
  if (args.length > 0) {
    await implementation.initialize(...args);
  }

  return implementation;
}

/**
 * Deploy ScoreOracle (non-upgradeable)
 * @param oracleSigner The oracle signer address
 * @param admin The admin address
 * @returns The deployed ScoreOracle contract
 */
export async function deployScoreOracle(
  oracleSigner: string,
  admin: string
): Promise<Contract> {
  const ScoreOracleFactory = await ethers.getContractFactory("ScoreOracle");
  const scoreOracle = await ScoreOracleFactory.deploy(oracleSigner, admin);
  await scoreOracle.waitForDeployment();
  return scoreOracle;
}

/**
 * Deploy MockStable token
 * @returns The deployed MockStable contract
 */
export async function deployMockStable(): Promise<Contract> {
  const MockStableFactory = await ethers.getContractFactory("MockStable");
  const mockStable = await MockStableFactory.deploy();
  await mockStable.waitForDeployment();
  return mockStable;
} 