import { expect } from "chai";
import { ethers } from "hardhat";

describe("Minimal UUPS Test", function () {
  it("Should deploy and initialize a simple UUPS contract", async function () {
    const [owner] = await ethers.getSigners();

    // Deploy a simple UUPS contract
    const SimpleUUPS = await ethers.getContractFactory("CreditRegistry");
    const simpleUUPS = await SimpleUUPS.deploy();
    await simpleUUPS.waitForDeployment();

    console.log("Contract deployed successfully");
    console.log("Contract address:", await simpleUUPS.getAddress());

    // Try to initialize
    try {
      await simpleUUPS.initialize(owner.address, owner.address);
      console.log("Initialization successful");
    } catch (error) {
      console.log("Initialization failed:", error);
      throw error;
    }
  });
}); 