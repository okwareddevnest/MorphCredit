import { createAppKit } from '@reown/appkit';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';

// Morph Holesky chain from env
const MORPH_CHAIN_ID = Number(import.meta.env.VITE_MORPH_CHAIN_ID || 2810);
const MORPH_RPC_URL = import.meta.env.VITE_MORPH_RPC_URL || 'https://rpc-holesky.morphl2.io';
const MORPH_EXPLORER = import.meta.env.VITE_EXPLORER_URL || 'https://explorer-holesky.morphl2.io';
const PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '467852179c0864c56b3ea993ba72b05b';

// Wagmi/viem-style chain object
export const networks = [
  {
    id: MORPH_CHAIN_ID,
    name: 'Morph Holesky',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: [MORPH_RPC_URL] } },
    blockExplorers: { default: { name: 'Morph Explorer', url: MORPH_EXPLORER } },
    testnet: true,
  },
] as any;

// Create Wagmi adapter and config (wagmi v2)
export const wagmiAdapter = new WagmiAdapter({ projectId: PROJECT_ID, networks });

export const config = wagmiAdapter.wagmiConfig;

// Wallet modal setup (AppKit / WalletConnect Modal)
export const appKit = createAppKit({
  adapters: [wagmiAdapter],
  projectId: PROJECT_ID,
  networks,
  metadata: {
    name: 'MorphCredit',
    description: 'Borrower Portal',
    url: typeof window !== 'undefined' ? window.location.origin : 'http://localhost',
    icons: ['https://raw.githubusercontent.com/okwareddevnest/MorphCredit/main/apps/morpho_credit-logo.png']
  },
  features: {
    email: false
  },
  themeMode: 'dark'
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