import { expect } from "chai";
import { ethers } from "hardhat";

describe("CreditRegistrySimple", function () {
  it("Should deploy and initialize CreditRegistrySimple", async function () {
    const [owner] = await ethers.getSigners();

    // Deploy ScoreOracle first (non-upgradeable)
    const ScoreOracleFactory = await ethers.getContractFactory("ScoreOracle");
    const scoreOracle = await ScoreOracleFactory.deploy(owner.address, owner.address);

    // Deploy CreditRegistrySimple
    const CreditRegistrySimpleFactory = await ethers.getContractFactory("CreditRegistrySimple");
    const creditRegistry = await CreditRegistrySimpleFactory.deploy(
      await scoreOracle.getAddress(),
      owner.address
    );

    // Verify initialization
    expect(await creditRegistry.scoreOracle()).to.equal(await scoreOracle.getAddress());
    expect(await creditRegistry.hasRole(await creditRegistry.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true;
    expect(await creditRegistry.hasRole(await creditRegistry.REGISTRY_ROLE(), owner.address)).to.be.true;
  });

  it("Should compute credit limits correctly", async function () {
    const [owner] = await ethers.getSigners();

    // Deploy ScoreOracle
    const ScoreOracleFactory = await ethers.getContractFactory("ScoreOracle");
    const scoreOracle = await ScoreOracleFactory.deploy(owner.address, owner.address);

    // Deploy CreditRegistrySimple
    const CreditRegistrySimpleFactory = await ethers.getContractFactory("CreditRegistrySimple");
    const creditRegistry = await CreditRegistrySimpleFactory.deploy(
      await scoreOracle.getAddress(),
      owner.address
    );

    // Test limit computation
    const limit = await creditRegistry.computeLimit(750, 1500); // 750 score, 15% PD
    expect(limit).to.be.gt(0);
  });

  it("Should compute APR correctly", async function () {
    const [owner] = await ethers.getSigners();

    // Deploy ScoreOracle
    const ScoreOracleFactory = await ethers.getContractFactory("ScoreOracle");
    const scoreOracle = await ScoreOracleFactory.deploy(owner.address, owner.address);

    // Deploy CreditRegistrySimple
    const CreditRegistrySimpleFactory = await ethers.getContractFactory("CreditRegistrySimple");
    const creditRegistry = await CreditRegistrySimpleFactory.deploy(
      await scoreOracle.getAddress(),
      owner.address
    );

    // Test APR computation
    const apr = await creditRegistry.computeAPR(1500, 5000); // 15% PD, 50% utilization
    expect(apr).to.be.gt(0);
    expect(apr).to.be.lte(5000); // Max 50% APR
  });
}); 