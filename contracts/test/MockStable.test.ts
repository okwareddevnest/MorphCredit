import { expect } from "chai";
import { ethers } from "hardhat";
import { MockStable, MockStable__factory } from "../typechain-types";

describe("MockStable", function () {
  let mockStable: MockStable;
  let owner: any;
  let user: any;
  let other: any;

  beforeEach(async function () {
    [owner, user, other] = await ethers.getSigners();

    const MockStableFactory = await ethers.getContractFactory("MockStable");
    mockStable = await MockStableFactory.deploy(owner.address);
  });

  describe("Initialization", function () {
    it("Should initialize with correct parameters", async function () {
      expect(await mockStable.name()).to.equal("Mock USDC");
      expect(await mockStable.symbol()).to.equal("mUSDC");
      expect(await mockStable.decimals()).to.equal(6);
      expect(await mockStable.totalSupply()).to.equal(0);
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint tokens", async function () {
      const amount = ethers.parseEther("1000");
      
      await expect(mockStable.mint(user.address, amount))
        .to.emit(mockStable, "Transfer")
        .withArgs(ethers.ZeroAddress, user.address, amount);

      expect(await mockStable.balanceOf(user.address)).to.equal(amount);
      expect(await mockStable.totalSupply()).to.equal(amount);
    });

    it("Should reject non-owner from minting", async function () {
      await expect(
        mockStable.connect(user).mint(user.address, ethers.parseEther("1000"))
      ).to.be.reverted;
    });

    it("Should reject minting to zero address", async function () {
      await expect(
        mockStable.mint(ethers.ZeroAddress, ethers.parseEther("1000"))
      ).to.be.reverted;
    });
  });

  describe("Burning", function () {
    beforeEach(async function () {
      await mockStable.mint(user.address, ethers.parseEther("1000"));
    });

    it("Should allow owner to burn tokens", async function () {
      const amount = ethers.parseEther("500");
      
      await expect(mockStable.burn(user.address, amount))
        .to.emit(mockStable, "Transfer")
        .withArgs(user.address, ethers.ZeroAddress, amount);

      expect(await mockStable.balanceOf(user.address)).to.equal(ethers.parseEther("500"));
      expect(await mockStable.totalSupply()).to.equal(ethers.parseEther("500"));
    });

    it("Should reject non-owner from burning", async function () {
      await expect(
        mockStable.connect(user).burn(user.address, ethers.parseEther("500"))
      ).to.be.reverted;
    });

    it("Should reject burning more than balance", async function () {
      await expect(
        mockStable.burn(user.address, ethers.parseEther("1500"))
      ).to.be.reverted;
    });
  });

  describe("Transfer", function () {
    beforeEach(async function () {
      await mockStable.mint(user.address, ethers.parseEther("1000"));
    });

    it("Should allow transfer between users", async function () {
      const amount = ethers.parseEther("500");
      
      await expect(mockStable.connect(user).transfer(other.address, amount))
        .to.emit(mockStable, "Transfer")
        .withArgs(user.address, other.address, amount);

      expect(await mockStable.balanceOf(user.address)).to.equal(ethers.parseEther("500"));
      expect(await mockStable.balanceOf(other.address)).to.equal(amount);
    });

    it("Should reject transfer with insufficient balance", async function () {
      await expect(
        mockStable.connect(user).transfer(other.address, ethers.parseEther("1500"))
      ).to.be.reverted;
    });
  });

  describe("Approve and TransferFrom", function () {
    beforeEach(async function () {
      await mockStable.mint(user.address, ethers.parseEther("1000"));
    });

    it("Should allow approve and transferFrom", async function () {
      const amount = ethers.parseEther("500");
      
      await mockStable.connect(user).approve(other.address, amount);
      expect(await mockStable.allowance(user.address, other.address)).to.equal(amount);
      
      await expect(mockStable.connect(other).transferFrom(user.address, other.address, amount))
        .to.emit(mockStable, "Transfer")
        .withArgs(user.address, other.address, amount);

      expect(await mockStable.balanceOf(user.address)).to.equal(ethers.parseEther("500"));
      expect(await mockStable.balanceOf(other.address)).to.equal(amount);
    });

    it("Should reject transferFrom with insufficient allowance", async function () {
      await mockStable.connect(user).approve(other.address, ethers.parseEther("100"));
      
      await expect(
        mockStable.connect(other).transferFrom(user.address, other.address, ethers.parseEther("500"))
      ).to.be.reverted;
    });
  });

  describe("View functions", function () {
    it("Should return correct token info", async function () {
      expect(await mockStable.name()).to.equal("Mock USDC");
      expect(await mockStable.symbol()).to.equal("mUSDC");
      expect(await mockStable.decimals()).to.equal(6);
    });

    it("Should return correct balances", async function () {
      await mockStable.mint(user.address, ethers.parseEther("1000"));
      expect(await mockStable.balanceOf(user.address)).to.equal(ethers.parseEther("1000"));
    });
  });
}); 