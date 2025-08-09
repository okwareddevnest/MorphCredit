import React from 'react';
import { useAccount, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { Loader2, Plug, Unplug, Copy, CheckCircle2, AlertTriangle } from 'lucide-react';
import { appKit } from '../lib/wallet';

interface ConnectWalletProps {
  compact?: boolean;
}

export const ConnectWallet: React.FC<ConnectWalletProps> = ({ compact = false }) => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const [copied, setCopied] = React.useState(false);
  const supportedChainId = Number(import.meta.env.VITE_MORPH_CHAIN_ID || 2810);

  const short = (addr: string) => `${addr.slice(0, 6)}…${addr.slice(-4)}`;

  const copyAddress = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (isConnected) {
    const wrongNetwork = chainId !== supportedChainId;

    return (
      <div className={`flex items-center gap-2 ${compact ? '' : 'bg-dark-800/50 border border-dark-700/50 rounded-lg px-3 py-2'}`}>
        {wrongNetwork && (
          <button
            onClick={() => switchChain?.({ chainId: supportedChainId })}
            className="flex items-center gap-2 px-3 py-2 rounded-md bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 transition-colors"
            title="Switch to Morph Holesky"
          >
            {isSwitching ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
            <span>Switch Network</span>
          </button>
        )}

        <div className="flex items-center gap-2 text-sm text-dark-200">
          <span className="hidden sm:inline">{short(address!)}</span>
          <button
            onClick={copyAddress}
            className="p-1.5 rounded-md hover:bg-dark-700/50 transition-colors"
            title="Copy address"
          >
            {copied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        <button
          onClick={() => disconnect()}
          className="flex items-center gap-2 px-3 py-2 rounded-md bg-dark-700/70 hover:bg-dark-600/70 text-dark-100 transition-colors"
        >
          <Unplug className="w-4 h-4" />
          <span className="hidden sm:inline">Disconnect</span>
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => appKit.open()}
      className={`flex items-center gap-2 px-3 py-2 rounded-md bg-primary-600 hover:bg-primary-500 transition-colors ${compact ? '' : 'shadow-lg'}`}
    >
      <Plug className="w-4 h-4" />
      <span className="text-white text-sm">Connect Wallet</span>
    </button>
  );
};

export default ConnectWallet;


