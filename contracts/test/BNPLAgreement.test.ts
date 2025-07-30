import { expect } from "chai";
import { ethers } from "hardhat";
import { BNPLAgreement, MockStable, ScoreOracle, CreditRegistry, LendingPool } from "../typechain-types";

describe("BNPLAgreement", function () {
  let bnplAgreement: BNPLAgreement;
  let mockStable: MockStable;
  let scoreOracle: ScoreOracle;
  let creditRegistry: CreditRegistry;
  let lendingPool: LendingPool;
  let owner: any, borrower: any, merchant: any, other: any;

  beforeEach(async function () {
    [owner, borrower, merchant, other] = await ethers.getSigners();

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

    // Deploy BNPLAgreement
    const BNPLAgreementFactory = await ethers.getContractFactory("BNPLAgreement");
    bnplAgreement = await BNPLAgreementFactory.deploy();
    await bnplAgreement.initialize(
      await mockStable.getAddress(),
      await lendingPool.getAddress(),
      borrower.address,
      merchant.address,
      ethers.parseEther("1000"),
      6, // 6 installments
      1500, // 15% APR
      owner.address
    );

    // Mint some tokens to pool for funding
    await mockStable.mint(await lendingPool.getAddress(), ethers.parseEther("10000"));
  });

  describe("Initialization", function () {
    it("Should initialize with correct parameters", async function () {
      const agreement = await bnplAgreement.agreement();
      expect(agreement.principal).to.equal(ethers.parseEther("1000"));
      expect(agreement.borrower).to.equal(borrower.address);
      expect(agreement.merchant).to.equal(merchant.address);
      expect(agreement.installments).to.equal(6);
      expect(agreement.apr).to.equal(1500);
      expect(agreement.status).to.equal(0); // Pending
    });

    it("Should initialize installments correctly", async function () {
      const installment0 = await bnplAgreement.installments(0);
      expect(installment0.amount).to.equal(ethers.parseEther("166.666666666666666666")); // 1000/6
      expect(installment0.isPaid).to.be.false;
    });

    it("Should reject invalid parameters", async function () {
      const BNPLAgreementFactory = await ethers.getContractFactory("BNPLAgreement");
      const newAgreement = await BNPLAgreementFactory.deploy();
      
      await expect(
        newAgreement.initialize(
          await mockStable.getAddress(),
          await lendingPool.getAddress(),
          borrower.address,
          merchant.address,
          0, // Invalid principal
          6,
          1500,
          owner.address
        )
      ).to.be.revertedWithCustomError(bnplAgreement, "BNPLAgreement_InvalidAmount");
    });
  });

  describe("Funding", function () {
    it("Should allow funding the agreement", async function () {
      await expect(bnplAgreement.fund())
        .to.emit(bnplAgreement, "AgreementFunded")
        .withArgs(borrower.address, merchant.address, ethers.parseEther("1000"));

      const agreement = await bnplAgreement.agreement();
      expect(agreement.status).to.equal(1); // Active
    });

    it("Should pay merchant on funding", async function () {
      const initialBalance = await mockStable.balanceOf(merchant.address);
      
      await bnplAgreement.fund();
      
      const finalBalance = await mockStable.balanceOf(merchant.address);
      expect(finalBalance).to.equal(initialBalance + ethers.parseEther("1000"));
    });

    it("Should reject funding twice", async function () {
      await bnplAgreement.fund();
      
      await expect(
        bnplAgreement.fund()
      ).to.be.revertedWithCustomError(bnplAgreement, "BNPLAgreement_AlreadyFunded");
    });

    it("Should reject funding from non-factory", async function () {
      await expect(
        bnplAgreement.connect(other).fund()
      ).to.be.reverted;
    });
  });

  describe("Installment Payments", function () {
    beforeEach(async function () {
      await bnplAgreement.fund();
      await mockStable.mint(borrower.address, ethers.parseEther("1000"));
      await mockStable.connect(borrower).approve(await bnplAgreement.getAddress(), ethers.parseEther("1000"));
    });

    it("Should allow paying installments", async function () {
      await expect(bnplAgreement.connect(borrower).payInstallment(0))
        .to.emit(bnplAgreement, "InstallmentPaid")
        .withArgs(borrower.address, 0, ethers.parseEther("166.666666666666666666"));

      const installment = await bnplAgreement.installments(0);
      expect(installment.isPaid).to.be.true;
    });

    it("Should reject paying already paid installment", async function () {
      await bnplAgreement.connect(borrower).payInstallment(0);
      
      await expect(
        bnplAgreement.connect(borrower).payInstallment(0)
      ).to.be.revertedWithCustomError(bnplAgreement, "BNPLAgreement_InstallmentAlreadyPaid");
    });

    it("Should reject paying invalid installment", async function () {
      await expect(
        bnplAgreement.connect(borrower).payInstallment(10)
      ).to.be.revertedWithCustomError(bnplAgreement, "BNPLAgreement_InvalidInstallment");
    });

    it("Should complete agreement when all installments paid", async function () {
      for (let i = 0; i < 6; i++) {
        await bnplAgreement.connect(borrower).payInstallment(i);
      }

      const agreement = await bnplAgreement.agreement();
      expect(agreement.status).to.equal(2); // Completed
    });
  });

  describe("Penalty Calculation", function () {
    beforeEach(async function () {
      await bnplAgreement.fund();
    });

    it("Should calculate penalty for overdue installment", async function () {
      // Fast forward past due date
      await ethers.provider.send("evm_increaseTime", [15 * 24 * 60 * 60]); // 15 days
      await ethers.provider.send("evm_mine", []);

      const penalty = await bnplAgreement.calculatePenalty(0);
      expect(penalty).to.be.gt(0);
    });

    it("Should return zero penalty for non-overdue installment", async function () {
      const penalty = await bnplAgreement.calculatePenalty(0);
      expect(penalty).to.equal(0);
    });
  });

  describe("Agreement Status", function () {
    beforeEach(async function () {
      await bnplAgreement.fund();
    });

    it("Should mark as defaulted after write-off period", async function () {
      // Fast forward past write-off period
      await ethers.provider.send("evm_increaseTime", [70 * 24 * 60 * 60]); // 70 days
      await ethers.provider.send("evm_mine", []);

      await bnplAgreement.checkDefault();
      
      const agreement = await bnplAgreement.agreement();
      expect(agreement.status).to.equal(3); // Defaulted
    });

    it("Should allow write-off by admin", async function () {
      await expect(bnplAgreement.writeOff())
        .to.emit(bnplAgreement, "AgreementWrittenOff")
        .withArgs(borrower.address);

      const agreement = await bnplAgreement.agreement();
      expect(agreement.status).to.equal(4); // WrittenOff
    });

    it("Should reject write-off from non-admin", async function () {
      await expect(
        bnplAgreement.connect(other).writeOff()
      ).to.be.reverted;
    });
  });

  describe("View functions", function () {
    beforeEach(async function () {
      await bnplAgreement.fund();
    });

    it("Should return agreement details", async function () {
      const agreement = await bnplAgreement.getAgreement();
      expect(agreement.principal).to.equal(ethers.parseEther("1000"));
      expect(agreement.status).to.equal(1); // Active
    });

    it("Should return installment details", async function () {
      const installment = await bnplAgreement.getInstallment(0);
      expect(installment.amount).to.equal(ethers.parseEther("166.666666666666666666"));
      expect(installment.isPaid).to.be.false;
    });

    it("Should return payment status", async function () {
      const status = await bnplAgreement.getPaymentStatus();
      expect(status.totalInstallments).to.equal(6);
      expect(status.paidInstallments).to.equal(0);
      expect(status.remainingAmount).to.equal(ethers.parseEther("1000"));
    });
  });
}); 