import { expect } from "chai";
import { ethers } from "hardhat";
import { LoCFactory, MockStable, ScoreOracle, CreditRegistry, LendingPool } from "../typechain-types";

describe("LoCFactory", function () {
  let loCFactory: LoCFactory;
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

    // Deploy LoCFactory
    const LoCFactoryFactory = await ethers.getContractFactory("LoCFactory");
    loCFactory = await LoCFactoryFactory.deploy();
    await loCFactory.initialize(
      await mockStable.getAddress(),
      await lendingPool.getAddress(),
      owner.address
    );

    // Mint some tokens to pool for funding
    await mockStable.mint(await lendingPool.getAddress(), ethers.parseEther("10000"));
  });

  describe("Initialization", function () {
    it("Should initialize with correct parameters", async function () {
      expect(await loCFactory.asset()).to.equal(await mockStable.getAddress());
      expect(await loCFactory.lendingPool()).to.equal(await lendingPool.getAddress());
      expect(await loCFactory.hasRole(await loCFactory.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true;
    });
  });

  describe("Create Line of Credit", function () {
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

    it("Should create line of credit", async function () {
      const state = await creditRegistry.getState(borrower.address);
      
      await expect(loCFactory.createLineOfCredit(borrower.address, state.limit, state.apr))
        .to.emit(loCFactory, "LineOfCreditCreated");

      const lines = await loCFactory.getLinesOfCredit();
      expect(lines.length).to.equal(1);
    });

    it("Should reject non-factory role", async function () {
      const state = await creditRegistry.getState(borrower.address);
      
      await expect(
        loCFactory.connect(other).createLineOfCredit(borrower.address, state.limit, state.apr)
      ).to.be.reverted;
    });

    it("Should track lines of credit correctly", async function () {
      const state = await creditRegistry.getState(borrower.address);
      
      await loCFactory.createLineOfCredit(borrower.address, state.limit, state.apr);
      await loCFactory.createLineOfCredit(other.address, ethers.parseEther("500"), 1200);

      const lines = await loCFactory.getLinesOfCredit();
      expect(lines.length).to.equal(2);
    });
  });

  describe("Line of Credit Management", function () {
    let lineAddress: string;

    beforeEach(async function () {
      // Set up credit state and create line of credit
      await scoreOracle.setScore(borrower.address, {
        score: 750,
        pd_bps: 1500,
        featuresRoot: ethers.keccak256(ethers.toUtf8Bytes("features")),
        expiry: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        sig: "0x"
      });
      await creditRegistry.updateCreditState(borrower.address);
      
      const state = await creditRegistry.getState(borrower.address);
      await loCFactory.createLineOfCredit(borrower.address, state.limit, state.apr);
      
      const lines = await loCFactory.getLinesOfCredit();
      lineAddress = lines[0];
    });

    it("Should return line of credit by index", async function () {
      const line = await loCFactory.getLineOfCredit(0);
      expect(line).to.equal(lineAddress);
    });

    it("Should return lines by user", async function () {
      const userLines = await loCFactory.getLinesByUser(borrower.address);
      expect(userLines.length).to.equal(1);
      expect(userLines[0]).to.equal(lineAddress);
    });

    it("Should return total lines count", async function () {
      expect(await loCFactory.getLineCount()).to.equal(1);
    });
  });

  describe("Configuration", function () {
    it("Should allow admin to set credit registry", async function () {
      await loCFactory.setCreditRegistry(other.address);
      expect(await loCFactory.creditRegistry()).to.equal(other.address);
    });

    it("Should reject non-admin from setting credit registry", async function () {
      await expect(
        loCFactory.connect(other).setCreditRegistry(other.address)
      ).to.be.reverted;
    });

    it("Should reject zero address for credit registry", async function () {
      await expect(
        loCFactory.setCreditRegistry(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(loCFactory, "LoCFactory_InvalidAddress");
    });
  });

  describe("Integration with LineOfCredit", function () {
    let lineAddress: string;
    let lineOfCredit: any; // Changed from LineOfCredit to any as it's not directly imported

    beforeEach(async function () {
      // Set up credit state and create line of credit
      await scoreOracle.setScore(borrower.address, {
        score: 750,
        pd_bps: 1500,
        featuresRoot: ethers.keccak256(ethers.toUtf8Bytes("features")),
        expiry: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        sig: "0x"
      });
      await creditRegistry.updateCreditState(borrower.address);
      
      const state = await creditRegistry.getState(borrower.address);
      await loCFactory.createLineOfCredit(borrower.address, state.limit, state.apr);
      
      const lines = await loCFactory.getLinesOfCredit();
      lineAddress = lines[0];
      
      const LineOfCreditFactory = await ethers.getContractFactory("LineOfCredit");
      lineOfCredit = LineOfCreditFactory.attach(lineAddress);
    });

    it("Should create line of credit with correct parameters", async function () {
      const creditLine = await lineOfCredit.creditLines(borrower.address);
      expect(creditLine.limit).to.be.gt(0);
      expect(creditLine.isActive).to.be.true;
    });

    it("Should allow drawing from created line of credit", async function () {
      const drawAmount = ethers.parseEther("100");
      
      await expect(lineOfCredit.connect(borrower).draw(drawAmount))
        .to.emit(lineOfCredit, "Drawn");

      const creditLine = await lineOfCredit.creditLines(borrower.address);
      expect(creditLine.drawn).to.equal(drawAmount);
    });
  });
}); 