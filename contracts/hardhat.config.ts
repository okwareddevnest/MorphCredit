import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      // viaIR: true, // Temporarily disabled to fix testing issues
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
      allowUnlimitedContractSize: true,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    "morph-testnet": {
      url: process.env.MORPH_RPC_URL || "https://morph-testnet.rpc",
      chainId: 17000,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    "morph-mainnet": {
      url: process.env.MORPH_MAINNET_RPC_URL || "https://morph-mainnet.rpc",
      chainId: 17001,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
  etherscan: {
    apiKey: {
      "morph-testnet": process.env.MORPHSCAN_API_KEY || "",
      "morph-mainnet": process.env.MORPHSCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "morph-testnet",
        chainId: 17000,
        urls: {
          apiURL: "https://explorer-testnet.morph.io/api",
          browserURL: "https://explorer-testnet.morph.io",
        },
      },
      {
        network: "morph-mainnet",
        chainId: 17001,
        urls: {
          apiURL: "https://explorer.morph.io/api",
          browserURL: "https://explorer.morph.io",
        },
      },
    ],
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },
  mocha: {
    timeout: 40000,
  },
};

export default config; 