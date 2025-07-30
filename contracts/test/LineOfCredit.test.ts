import { expect } from "chai";
import { ethers } from "hardhat";
import { LineOfCredit, MockStable, ScoreOracle, CreditRegistry, LendingPool } from "../typechain-types";

describe("LineOfCredit", function () {
  let lineOfCredit: LineOfCredit;
  let mockStable: MockStable;
  let scoreOracle: ScoreOracle;
  let creditRegistry: CreditRegistry;
  let lendingPool: LendingPool;
  let owner: any, borrower: any, other: any;

  beforeEach(async function () {
    [owner, borrower, other] = await ethers.getSigners();

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

    // Deploy LineOfCredit
    const LineOfCreditFactory = await ethers.getContractFactory("LineOfCredit");
    lineOfCredit = await LineOfCreditFactory.deploy();
    await lineOfCredit.initialize(
      await mockStable.getAddress(),
      await lendingPool.getAddress(),
      borrower.address,
      ethers.parseEther("1000"),
      1500, // 15% APR
      owner.address
    );

    // Mint some tokens to pool for funding
    await mockStable.mint(await lendingPool.getAddress(), ethers.parseEther("10000"));
  });

  describe("Initialization", function () {
    it("Should initialize with correct parameters", async function () {
      const creditLine = await lineOfCredit.creditLine();
      expect(creditLine.limit).to.equal(ethers.parseEther("1000"));
      expect(creditLine.borrower).to.equal(borrower.address);
      expect(creditLine.apr).to.equal(1500);
      expect(creditLine.status).to.equal(0); // Pending
    });
  });

  describe("Credit Line Management", function () {
    beforeEach(async function () {
      // Set up credit state for user
      await scoreOracle.setScore(borrower.address, {
        score: 750,
        pd_bps: 1500,
        featuresRoot: ethers.keccak256(ethers.toUtf8Bytes("features")),
        expiry: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        sig: "0x"
      });
      await creditRegistry.updateCreditState(borrower.address);
    });

    it("Should create credit line with correct parameters", async function () {
      const state = await creditRegistry.getState(borrower.address);
      
      await lineOfCredit.createCreditLine(borrower.address, state.limit, state.apr);
      
      const creditLine = await lineOfCredit.creditLines(borrower.address);
      expect(creditLine.limit).to.equal(state.limit);
      expect(creditLine.apr).to.equal(state.apr);
      expect(creditLine.isActive).to.be.true;
    });

    it("Should reject non-registry from creating credit line", async function () {
      const state = await creditRegistry.getState(borrower.address);
      
      await expect(
        lineOfCredit.connect(borrower).createCreditLine(borrower.address, state.limit, state.apr)
      ).to.be.reverted;
    });

    it("Should reject credit line below minimum", async function () {
      await expect(
        lineOfCredit.createCreditLine(borrower.address, ethers.parseEther("50"), 1000)
      ).to.be.revertedWithCustomError(lineOfCredit, "LineOfCredit_InvalidLimit");
    });

    it("Should reject credit line above maximum", async function () {
      await expect(
        lineOfCredit.createCreditLine(borrower.address, ethers.parseEther("20000"), 1000)
      ).to.be.revertedWithCustomError(lineOfCredit, "LineOfCredit_InvalidLimit");
    });
  });

  describe("Draw", function () {
    beforeEach(async function () {
      // Set up credit state and create credit line
      await scoreOracle.setScore(borrower.address, {
        score: 750,
        pd_bps: 1500,
        featuresRoot: ethers.keccak256(ethers.toUtf8Bytes("features")),
        expiry: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        sig: "0x"
      });
      await creditRegistry.updateCreditState(borrower.address);
      
      const state = await creditRegistry.getState(borrower.address);
      await lineOfCredit.createCreditLine(borrower.address, state.limit, state.apr);
    });

    it("Should allow drawing within limit", async function () {
      const drawAmount = ethers.parseEther("100");
      
      await expect(lineOfCredit.connect(borrower).draw(drawAmount))
        .to.emit(lineOfCredit, "Drawn")
        .withArgs(borrower.address, drawAmount);

      const creditLine = await lineOfCredit.creditLines(borrower.address);
      expect(creditLine.drawn).to.equal(drawAmount);
    });

    it("Should reject drawing beyond limit", async function () {
      const creditLine = await lineOfCredit.creditLines(borrower.address);
      const exceedAmount = creditLine.limit + ethers.parseEther("1");
      
      await expect(
        lineOfCredit.connect(borrower).draw(exceedAmount)
      ).to.be.revertedWithCustomError(lineOfCredit, "LineOfCredit_ExceedsLimit");
    });

    it("Should reject drawing from inactive credit line", async function () {
      await lineOfCredit.deactivateCreditLine(borrower.address);
      
      await expect(
        lineOfCredit.connect(borrower).draw(ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(lineOfCredit, "LineOfCredit_Inactive");
    });
  });

  describe("Repay", function () {
    beforeEach(async function () {
      // Set up credit state, create credit line, and draw
      await scoreOracle.setScore(borrower.address, {
        score: 750,
        pd_bps: 1500,
        featuresRoot: ethers.keccak256(ethers.toUtf8Bytes("features")),
        expiry: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        sig: "0x"
      });
      await creditRegistry.updateCreditState(borrower.address);
      
      const state = await creditRegistry.getState(borrower.address);
      await lineOfCredit.createCreditLine(borrower.address, state.limit, state.apr);
      
      await lineOfCredit.connect(borrower).draw(ethers.parseEther("100"));
      await mockStable.connect(borrower).approve(await lineOfCredit.getAddress(), ethers.parseEther("100"));
    });

    it("Should allow repaying drawn amount", async function () {
      const repayAmount = ethers.parseEther("50");
      
      await expect(lineOfCredit.connect(borrower).repay(repayAmount))
        .to.emit(lineOfCredit, "Repaid")
        .withArgs(borrower.address, repayAmount);

      const creditLine = await lineOfCredit.creditLines(borrower.address);
      expect(creditLine.drawn).to.equal(ethers.parseEther("50"));
    });

    it("Should not allow over-repayment", async function () {
      const creditLine = await lineOfCredit.creditLines(borrower.address);
      const overRepayAmount = creditLine.drawn + ethers.parseEther("1");
      
      await expect(
        lineOfCredit.connect(borrower).repay(overRepayAmount)
      ).to.be.revertedWithCustomError(lineOfCredit, "LineOfCredit_InvalidAmount");
    });
  });

  describe("Interest Accrual", function () {
    beforeEach(async function () {
      // Set up credit state, create credit line, and draw
      await scoreOracle.setScore(borrower.address, {
        score: 750,
        pd_bps: 1500,
        featuresRoot: ethers.keccak256(ethers.toUtf8Bytes("features")),
        expiry: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        sig: "0x"
      });
      await creditRegistry.updateCreditState(borrower.address);
      
      const state = await creditRegistry.getState(borrower.address);
      await lineOfCredit.createCreditLine(borrower.address, state.limit, state.apr);
      
      await lineOfCredit.connect(borrower).draw(ethers.parseEther("100"));
    });

    it("Should calculate interest correctly", async function () {
      const interest = await lineOfCredit.calculateInterest(borrower.address);
      expect(interest).to.be.gt(0);
    });

    it("Should accrue interest over time", async function () {
      const initialInterest = await lineOfCredit.calculateInterest(borrower.address);
      
      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [86400]); // 1 day
      await ethers.provider.send("evm_mine", []);
      
      const newInterest = await lineOfCredit.calculateInterest(borrower.address);
      expect(newInterest).to.be.gt(initialInterest);
    });
  });

  describe("Credit Line Management", function () {
    beforeEach(async function () {
      // Set up credit state and create credit line
      await scoreOracle.setScore(borrower.address, {
        score: 750,
        pd_bps: 1500,
        featuresRoot: ethers.keccak256(ethers.toUtf8Bytes("features")),
        expiry: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        sig: "0x"
      });
      await creditRegistry.updateCreditState(borrower.address);
      
      const state = await creditRegistry.getState(borrower.address);
      await lineOfCredit.createCreditLine(borrower.address, state.limit, state.apr);
    });

    it("Should allow admin to deactivate credit line", async function () {
      await lineOfCredit.deactivateCreditLine(borrower.address);
      
      const creditLine = await lineOfCredit.creditLines(borrower.address);
      expect(creditLine.isActive).to.be.false;
    });

    it("Should allow admin to reactivate credit line", async function () {
      await lineOfCredit.deactivateCreditLine(borrower.address);
      await lineOfCredit.activateCreditLine(borrower.address);
      
      const creditLine = await lineOfCredit.creditLines(borrower.address);
      expect(creditLine.isActive).to.be.true;
    });

    it("Should reject non-admin from deactivating", async function () {
      await expect(
        lineOfCredit.connect(borrower).deactivateCreditLine(borrower.address)
      ).to.be.reverted;
    });
  });

  describe("View functions", function () {
    beforeEach(async function () {
      // Set up credit state and create credit line
      await scoreOracle.setScore(borrower.address, {
        score: 750,
        pd_bps: 1500,
        featuresRoot: ethers.keccak256(ethers.toUtf8Bytes("features")),
        expiry: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        sig: "0x"
      });
      await creditRegistry.updateCreditState(borrower.address);
      
      const state = await creditRegistry.getState(borrower.address);
      await lineOfCredit.createCreditLine(borrower.address, state.limit, state.apr);
    });

    it("Should return credit line info", async function () {
      const creditLine = await lineOfCredit.getCreditLine(borrower.address);
      expect(creditLine.limit).to.be.gt(0);
      expect(creditLine.isActive).to.be.true;
    });

    it("Should return available credit", async function () {
      const available = await lineOfCredit.getAvailableCredit(borrower.address);
      expect(available).to.be.gt(0);
      
      await lineOfCredit.connect(borrower).draw(ethers.parseEther("50"));
      const newAvailable = await lineOfCredit.getAvailableCredit(borrower.address);
      expect(newAvailable).to.be.lt(available);
    });
  });
}); 