import { expect } from "chai";
import { ethers } from "hardhat";
import { ScoreOracle, ScoreOracle__factory } from "../typechain-types";

describe("ScoreOracle", function () {
  let scoreOracle: ScoreOracle;
  let owner: any;
  let oracleSigner: any;
  let user: any;
  let other: any;

  beforeEach(async function () {
    [owner, oracleSigner, user, other] = await ethers.getSigners();

    const ScoreOracleFactory = await ethers.getContractFactory("ScoreOracle");
    scoreOracle = await ScoreOracleFactory.deploy(oracleSigner.address, owner.address);
  });

  describe("Initialization", function () {
    it("Should initialize with correct oracle signer", async function () {
      expect(await scoreOracle.getOracleSigner()).to.equal(oracleSigner.address);
    });

    it("Should grant correct roles", async function () {
      expect(await scoreOracle.hasRole(await scoreOracle.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true;
      expect(await scoreOracle.hasRole(await scoreOracle.ORACLE_ROLE(), owner.address)).to.be.true;
    });
  });

  describe("Basic functionality", function () {
    it("Should allow admin to set oracle signer", async function () {
      await scoreOracle.setOracleSigner(other.address);
      expect(await scoreOracle.getOracleSigner()).to.equal(other.address);
    });

    it("Should reject non-admin from setting oracle signer", async function () {
      await expect(
        scoreOracle.connect(user).setOracleSigner(other.address)
      ).to.be.reverted;
    });
  });
}); 