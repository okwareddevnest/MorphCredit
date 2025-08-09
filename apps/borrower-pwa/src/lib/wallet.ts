import { createConfig, configureChains } from 'wagmi';
import { Chain } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';
import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet';

// Morph testnet chain from env
const MORPH_CHAIN_ID = Number(import.meta.env.VITE_MORPH_CHAIN_ID || 17000);
const MORPH_RPC_URL = import.meta.env.VITE_MORPH_RPC_URL || 'https://rpc-testnet.morphl2.io';
const MORPH_EXPLORER = import.meta.env.VITE_EXPLORER_URL || 'https://explorer-testnet.morphl2.io';

const morphTestnet: Chain = {
  id: MORPH_CHAIN_ID,
  name: 'Morph Testnet',
  network: 'morph-testnet',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: [MORPH_RPC_URL] },
    public: { http: [MORPH_RPC_URL] },
  },
  blockExplorers: {
    default: { name: 'Morph Explorer', url: MORPH_EXPLORER },
  },
};

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [morphTestnet],
  [publicProvider()]
);

export const config = createConfig({
  autoConnect: true,
  connectors: [
    new MetaMaskConnector({ chains }),
    new WalletConnectConnector({
      chains,
      options: {
        projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
      },
    }),
    new CoinbaseWalletConnector({
      chains,
      options: {
        appName: 'MorphCredit',
      },
    }),
  ],
  publicClient,
  webSocketPublicClient,
});

export const getShortAddress = (address: string): string => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatAddress = (address: string): string => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatBalance = (balance: { formatted: string; symbol: string }): string => {
  const num = parseFloat(balance.formatted);
  if (num === 0) return `0 ${balance.symbol}`;
  if (num < 0.01) return `< 0.01 ${balance.symbol}`;
  return `${num.toFixed(2)} ${balance.symbol}`;
}; 