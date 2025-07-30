import { expect } from "chai";
import { ethers } from "hardhat";

describe("CreditRegistry Simple", function () {
  it("Should deploy and initialize CreditRegistry", async function () {
    const [owner] = await ethers.getSigners();

    // Deploy ScoreOracle first (non-upgradeable)
    const ScoreOracleFactory = await ethers.getContractFactory("ScoreOracle");
    const scoreOracle = await ScoreOracleFactory.deploy(owner.address, owner.address);

    // Deploy CreditRegistry
    const CreditRegistryFactory = await ethers.getContractFactory("CreditRegistry");
    const creditRegistry = await CreditRegistryFactory.deploy();
    await creditRegistry.waitForDeployment();

    // Initialize CreditRegistry
    await creditRegistry.initialize(await scoreOracle.getAddress(), owner.address);

    // Verify initialization
    expect(await creditRegistry.scoreOracle()).to.equal(await scoreOracle.getAddress());
    expect(await creditRegistry.hasRole(await creditRegistry.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true;
  });
}); 