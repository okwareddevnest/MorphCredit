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
      url: process.env.MORPH_RPC_URL || process.env.MORPH_RPC || "https://rpc-testnet.morphl2.io",
      chainId: Number(process.env.MORPH_CHAIN_ID || 2810),
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: Number(process.env.MORPH_GAS_PRICE || 2_000_000_000),
    },
    "morph-mainnet": {
      url: process.env.MORPH_MAINNET_RPC_URL || "https://rpc-quicknode.morphl2.io",
      chainId: Number(process.env.MORPH_MAINNET_CHAIN_ID || 2818),
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
        chainId: Number(process.env.MORPH_CHAIN_ID || 2810),
        urls: {
          apiURL: process.env.MORPHSCAN_TESTNET_API || "https://explorer-holesky-api.morphl2.io/api",
          browserURL: process.env.MORPHSCAN_TESTNET_BROWSER || "https://explorer-holesky.morphl2.io",
        },
      },
      {
        network: "morph-mainnet",
        chainId: Number(process.env.MORPH_MAINNET_CHAIN_ID || 2818),
        urls: {
          apiURL: process.env.MORPHSCAN_MAINNET_API || "https://explorer-api.morphl2.io/api",
          browserURL: process.env.MORPHSCAN_MAINNET_BROWSER || "https://explorer.morphl2.io",
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