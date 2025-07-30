import { expect } from "chai";
import { ethers } from "hardhat";
import { LendingPool, MockStable, ScoreOracle, CreditRegistry } from "../typechain-types";

describe("LendingPool", function () {
  let lendingPool: LendingPool;
  let mockStable: MockStable;
  let scoreOracle: ScoreOracle;
  let creditRegistry: CreditRegistry;
  let owner: any, user1: any, user2: any, user3: any;

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();

    // Deploy MockStable token
    const MockStableFactory = await ethers.getContractFactory("MockStable");
    mockStable = await MockStableFactory.deploy();

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
      await mockStable.getAddress(),
      await creditRegistry.getAddress(),
      owner.address
    );

    // Set up credit registry
    await creditRegistry.setLendingPool(await lendingPool.getAddress());

    // Mint some tokens to users for testing
    await mockStable.mint(user1.address, ethers.parseEther("10000"));
    await mockStable.mint(user2.address, ethers.parseEther("10000"));
    await mockStable.mint(user3.address, ethers.parseEther("10000"));
  });

  describe("Initialization", function () {
    it("Should initialize with correct parameters", async function () {
      expect(await lendingPool.asset()).to.equal(await mockStable.getAddress());
      expect(await lendingPool.creditRegistry()).to.equal(await creditRegistry.getAddress());
      expect(await lendingPool.hasRole(await lendingPool.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true;
    });

    it("Should initialize with default configuration", async function () {
      const config = await lendingPool.config();
      expect(config.seniorRatio).to.equal(7000); // 70%
      expect(config.reserveRatio).to.equal(2500); // 25%
      expect(config.maxUtilization).to.equal(8500); // 85%
    });
  });

  describe("Deposit", function () {
    beforeEach(async function () {
      await mockStable.connect(user1).approve(await lendingPool.getAddress(), ethers.parseEther("1000"));
    });

    it("Should deposit assets and mint shares", async function () {
      const depositAmount = ethers.parseEther("100");
      
      await expect(lendingPool.connect(user1).deposit(depositAmount, user1.address))
        .to.emit(lendingPool, "Deposit")
        .withArgs(user1.address, depositAmount, await lendingPool.convertToShares(depositAmount));

      expect(await lendingPool.shares(user1.address)).to.be.gt(0);
      expect(await lendingPool.totalAssets()).to.equal(depositAmount);
    });

    it("Should reject zero deposit", async function () {
      await expect(
        lendingPool.connect(user1).deposit(0, user1.address)
      ).to.be.revertedWithCustomError(lendingPool, "LendingPool_InvalidAmount");
    });

    it("Should reject zero receiver", async function () {
      await expect(
        lendingPool.connect(user1).deposit(ethers.parseEther("100"), ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(lendingPool, "LendingPool_InvalidAmount");
    });
  });

  describe("Withdraw", function () {
    beforeEach(async function () {
      await mockStable.connect(user1).approve(await lendingPool.getAddress(), ethers.parseEther("1000"));
      await lendingPool.connect(user1).deposit(ethers.parseEther("100"), user1.address);
    });

    it("Should withdraw assets and burn shares", async function () {
      const shares = await lendingPool.shares(user1.address);
      const assets = await lendingPool.convertToAssets(shares);
      
      await expect(lendingPool.connect(user1).withdraw(shares, user1.address))
        .to.emit(lendingPool, "Withdraw")
        .withArgs(user1.address, assets, shares);

      expect(await lendingPool.shares(user1.address)).to.equal(0);
    });

    it("Should reject insufficient shares", async function () {
      const shares = await lendingPool.shares(user1.address);
      await expect(
        lendingPool.connect(user1).withdraw(shares + 1n, user1.address)
      ).to.be.revertedWithCustomError(lendingPool, "LendingPool_InsufficientLiquidity");
    });
  });

  describe("Borrow", function () {
    beforeEach(async function () {
      // Set up credit state for user
      await scoreOracle.setScore(user1.address, {
        score: 750,
        pd_bps: 1500,
        featuresRoot: ethers.keccak256(ethers.toUtf8Bytes("features")),
        expiry: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        sig: "0x"
      });
      await creditRegistry.updateCreditState(user1.address);

      // Add liquidity to pool
      await mockStable.connect(user2).approve(await lendingPool.getAddress(), ethers.parseEther("1000"));
      await lendingPool.connect(user2).deposit(ethers.parseEther("1000"), user2.address);
    });

    it("Should allow borrowing within limit", async function () {
      const borrowAmount = ethers.parseEther("100");
      
      await expect(lendingPool.connect(user1).borrow(borrowAmount))
        .to.emit(lendingPool, "Borrow")
        .withArgs(user1.address, borrowAmount);

      expect(await lendingPool.borrowed(user1.address)).to.equal(borrowAmount);
    });

    it("Should reject borrowing beyond limit", async function () {
      const state = await creditRegistry.getState(user1.address);
      const exceedAmount = state.limit + ethers.parseEther("1");
      
      await expect(
        lendingPool.connect(user1).borrow(exceedAmount)
      ).to.be.reverted;
    });
  });

  describe("Repay", function () {
    beforeEach(async function () {
      // Set up credit state and borrow
      await scoreOracle.setScore(user1.address, {
        score: 750,
        pd_bps: 1500,
        featuresRoot: ethers.keccak256(ethers.toUtf8Bytes("features")),
        expiry: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        sig: "0x"
      });
      await creditRegistry.updateCreditState(user1.address);

      await mockStable.connect(user2).approve(await lendingPool.getAddress(), ethers.parseEther("1000"));
      await lendingPool.connect(user2).deposit(ethers.parseEther("1000"), user2.address);
      
      await lendingPool.connect(user1).borrow(ethers.parseEther("100"));
      await mockStable.connect(user1).approve(await lendingPool.getAddress(), ethers.parseEther("100"));
    });

    it("Should allow repaying borrowed amount", async function () {
      const repayAmount = ethers.parseEther("50");
      
      await expect(lendingPool.connect(user1).repay(repayAmount))
        .to.emit(lendingPool, "Repay")
        .withArgs(user1.address, repayAmount);

      expect(await lendingPool.borrowed(user1.address)).to.equal(ethers.parseEther("50"));
    });
  });

  describe("Configuration", function () {
    it("Should allow admin to set configuration", async function () {
      await lendingPool.setConfig(6500, 2000, 8000); // 65% senior, 20% reserve, 80% max util
      
      const config = await lendingPool.config();
      expect(config.seniorRatio).to.equal(6500);
      expect(config.reserveRatio).to.equal(2000);
      expect(config.maxUtilization).to.equal(8000);
    });

    it("Should reject invalid senior ratio", async function () {
      await expect(
        lendingPool.setConfig(5000, 2000, 8000) // Below minimum
      ).to.be.revertedWithCustomError(lendingPool, "LendingPool_InvalidTrancheRatio");
    });

    it("Should reject non-admin", async function () {
      await expect(
        lendingPool.connect(user1).setConfig(6500, 2000, 8000)
      ).to.be.reverted;
    });
  });

  describe("Conversion functions", function () {
    beforeEach(async function () {
      await mockStable.connect(user1).approve(await lendingPool.getAddress(), ethers.parseEther("1000"));
      await lendingPool.connect(user1).deposit(ethers.parseEther("100"), user1.address);
    });

    it("Should convert assets to shares correctly", async function () {
      const assets = ethers.parseEther("50");
      const shares = await lendingPool.convertToShares(assets);
      expect(shares).to.be.gt(0);
    });

    it("Should convert shares to assets correctly", async function () {
      const userShares = await lendingPool.shares(user1.address);
      const assets = await lendingPool.convertToAssets(userShares);
      expect(assets).to.be.gt(0);
    });
  });

  describe("Pool state", function () {
    it("Should return correct pool state", async function () {
      const state = await lendingPool.getPoolState();
      expect(state.totalAssets).to.equal(0);
      expect(state.totalShares).to.equal(0);
      expect(state.lastAccrual).to.be.gt(0);
    });
  });
}); 