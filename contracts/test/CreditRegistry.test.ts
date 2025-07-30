import { expect } from "chai";
import { ethers } from "hardhat";
import { CreditRegistry, ScoreOracle, LendingPool } from "../typechain-types";

describe("CreditRegistry", function () {
  let creditRegistry: CreditRegistry;
  let scoreOracle: ScoreOracle;
  let lendingPool: LendingPool;
  let owner: any, user1: any, user2: any, user3: any;

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();

    // Deploy ScoreOracle
    const ScoreOracleFactory = await ethers.getContractFactory("ScoreOracle");
    scoreOracle = await ScoreOracleFactory.deploy(owner.address, owner.address);

    // Deploy CreditRegistry
    const CreditRegistryFactory = await ethers.getContractFactory("CreditRegistry");
    creditRegistry = await CreditRegistryFactory.deploy();
    await creditRegistry.initialize(await scoreOracle.getAddress(), owner.address);

    // Deploy LendingPool
    const LendingPoolFactory = await ethers.getContractFactory("LendingPool");
    lendingPool = await LendingPoolFactory.deploy();
    await lendingPool.initialize(
      ethers.ZeroAddress, // Mock asset address
      await creditRegistry.getAddress(),
      owner.address
    );

    // Set up credit registry
    await creditRegistry.setLendingPool(await lendingPool.getAddress());
  });

  describe("Initialization", function () {
    it("Should initialize with correct parameters", async function () {
      expect(await creditRegistry.scoreOracle()).to.equal(await scoreOracle.getAddress());
      expect(await creditRegistry.hasRole(await creditRegistry.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true;
    });

    it("Should initialize tier configurations", async function () {
      const tier800 = await creditRegistry.tierConfigs(800);
      expect(tier800.baseLimit).to.equal(ethers.parseEther("10000"));
      expect(tier800.baseAPR).to.equal(800);

      const tier400 = await creditRegistry.tierConfigs(400);
      expect(tier400.baseLimit).to.equal(ethers.parseEther("500"));
      expect(tier400.baseAPR).to.equal(3500);
    });
  });

  describe("computeLimit", function () {
    it("Should compute correct limit for high score", async function () {
      const limit = await creditRegistry.computeLimit(850, 500); // High score, low PD
      expect(limit).to.be.gt(0);
    });

    it("Should compute lower limit for high PD", async function () {
      const limitHighPD = await creditRegistry.computeLimit(850, 2000);
      const limitLowPD = await creditRegistry.computeLimit(850, 500);
      expect(limitHighPD).to.be.lt(limitLowPD);
    });

    it("Should reject invalid score", async function () {
      await expect(creditRegistry.computeLimit(1000, 500)).to.be.revertedWithCustomError(
        creditRegistry, "CreditRegistry_InvalidScore"
      );
    });
  });

  describe("computeAPR", function () {
    it("Should compute APR correctly", async function () {
      const apr = await creditRegistry.computeAPR(1000, 5000); // 10% PD, 50% utilization
      expect(apr).to.be.gt(0);
    });

    it("Should cap APR at maximum", async function () {
      const apr = await creditRegistry.computeAPR(10000, 10000); // 100% PD, 100% utilization
      expect(apr).to.equal(5000); // MAX_APR
    });

    it("Should reject invalid PD", async function () {
      await expect(creditRegistry.computeAPR(15000, 5000)).to.be.revertedWithCustomError(
        creditRegistry, "CreditRegistry_InvalidAPR"
      );
    });
  });

  describe("updateCreditState", function () {
    it("Should update credit state with valid score", async function () {
      // First set a score in the oracle
      await scoreOracle.setScore(user1.address, {
        score: 750,
        pd_bps: 1500,
        featuresRoot: ethers.keccak256(ethers.toUtf8Bytes("features")),
        expiry: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        sig: "0x"
      });

      await creditRegistry.updateCreditState(user1.address);
      
      const state = await creditRegistry.getState(user1.address);
      expect(state.isActive).to.be.true;
      expect(state.limit).to.be.gt(0);
      expect(state.apr).to.be.gt(0);
    });

    it("Should reject unauthorized caller", async function () {
      await expect(
        creditRegistry.connect(user1).updateCreditState(user1.address)
      ).to.be.reverted;
    });
  });

  describe("updateUtilization", function () {
    beforeEach(async function () {
      // Set up a credit state first
      await scoreOracle.setScore(user1.address, {
        score: 750,
        pd_bps: 1500,
        featuresRoot: ethers.keccak256(ethers.toUtf8Bytes("features")),
        expiry: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        sig: "0x"
      });
      await creditRegistry.updateCreditState(user1.address);
    });

    it("Should increase utilization on borrow", async function () {
      const amount = ethers.parseEther("100");
      await creditRegistry.updateUtilization(user1.address, amount, true);
      
      const state = await creditRegistry.getState(user1.address);
      expect(state.utilization).to.equal(amount);
    });

    it("Should decrease utilization on repay", async function () {
      const borrowAmount = ethers.parseEther("200");
      const repayAmount = ethers.parseEther("100");
      
      await creditRegistry.updateUtilization(user1.address, borrowAmount, true);
      await creditRegistry.updateUtilization(user1.address, repayAmount, false);
      
      const state = await creditRegistry.getState(user1.address);
      expect(state.utilization).to.equal(borrowAmount - repayAmount);
    });

    it("Should not allow utilization to exceed limit", async function () {
      const state = await creditRegistry.getState(user1.address);
      const exceedAmount = state.limit + ethers.parseEther("1");
      
      await expect(
        creditRegistry.updateUtilization(user1.address, exceedAmount, true)
      ).to.be.revertedWithCustomError(creditRegistry, "CreditRegistry_InvalidUtilization");
    });
  });

  describe("setTierConfig", function () {
    it("Should set tier configuration", async function () {
      const baseLimit = ethers.parseEther("5000");
      const baseAPR = 1500;
      const maxUtilization = 7000;
      
      await creditRegistry.setTierConfig(750, baseLimit, baseAPR, maxUtilization);
      
      const config = await creditRegistry.tierConfigs(750);
      expect(config.baseLimit).to.equal(baseLimit);
      expect(config.baseAPR).to.equal(baseAPR);
      expect(config.maxUtilization).to.equal(maxUtilization);
    });

    it("Should reject non-admin", async function () {
      await expect(
        creditRegistry.connect(user1).setTierConfig(750, ethers.parseEther("1000"), 1000, 7000)
      ).to.be.reverted;
    });
  });

  describe("setLendingPool", function () {
    it("Should set lending pool address", async function () {
      await creditRegistry.setLendingPool(user2.address);
      expect(await creditRegistry.lendingPool()).to.equal(user2.address);
    });

    it("Should reject zero address", async function () {
      await expect(
        creditRegistry.setLendingPool(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(creditRegistry, "CreditRegistry_Unauthorized");
    });
  });
}); 