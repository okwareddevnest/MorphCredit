const { ethers } = require("hardhat");

async function main() {
  const bnplFactory = await ethers.getContractAt("BNPLFactory", "0x50e43053510E8f25280d335F5c7F30b15CF13965");
  
  // Decode the transaction data from the error
  const txData = "0x9aebccc8000000000000000000000000cb5478384f9e1179d2da16b5af092b886b96188d000000000000000000000000cb5478384f9e1179d2da16b5af092b886b96188d0000000000000000000000000000000000000000000000000000000017c841c0000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000003e8";
  
  try {
    const decoded = bnplFactory.interface.decodeFunctionData("createAgreement", txData);
    console.log("Decoded parameters:");
    console.log("borrower:", decoded[0]);
    console.log("merchant:", decoded[1]);  
    console.log("principal:", decoded[2].toString(), "wei");
    console.log("principal in USDC:", ethers.formatUnits(decoded[2], 6));
    console.log("installments:", decoded[3].toString());
    console.log("apr (bps):", decoded[4].toString());
    console.log("apr (%):", Number(decoded[4]) / 100);
    
    // Check if the apr is too high
    if (Number(decoded[4]) > 5000) {
      console.log("ERROR: APR exceeds maximum of 50%!");
    }
    
    // Check if principal is valid
    if (decoded[2] === 0n) {
      console.log("ERROR: Principal is zero!");
    }
    
    // Check installments
    if (Number(decoded[3]) === 0 || Number(decoded[3]) > 12) {
      console.log("ERROR: Invalid installments count!");
    }
    
  } catch (error) {
    console.error("Failed to decode:", error.message);
  }
}

main().catch(console.error);
