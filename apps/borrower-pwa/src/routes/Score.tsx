import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { ScoreCard } from '../components/ScoreCard';
import { Alerts, Alert } from '../components/Alerts';
import { requestScore, publishScoreToOracle, ScoreApiData } from '../lib/api';
import { getShortAddress } from '../lib/wallet';
import { readScore } from '../lib/contracts';
import { getScoreOracleAddress } from '../lib/addresses';

interface ScoreHistory {
  score: number;
  timestamp: number;
  signature: string;
}

export const Score: React.FC = () => {
  const { address, isConnected } = useAccount();
  
  const [score, setScore] = useState<number | null>(null);
  // Reserved for future UI display
  // const [limit, setLimit] = useState<number | null>(null);
  // const [apr, setApr] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [scoreHistory, setScoreHistory] = useState<ScoreHistory[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [requestAmount, setRequestAmount] = useState(1000);

  const addAlert = (alert: Omit<Alert, 'id' | 'timestamp'>) => {
    const newAlert: Alert = {
      ...alert,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };
    setAlerts(prev => [...prev, newAlert]);
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const handleRequestScore = async () => {
    if (!address) {
      addAlert({
        type: 'error',
        title: 'Wallet Not Connected',
        message: 'Please connect your wallet to request a credit score.',
      });
      return;
    }

    if (!requestAmount || requestAmount <= 0) {
      addAlert({
        type: 'error',
        title: 'Invalid Amount',
        message: 'Please enter a valid amount for the credit assessment.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const data: ScoreApiData = await requestScore({ address });

      // Publish score to oracle
      const txHash = await publishScoreToOracle(address, data.report);

      // Re-read on-chain score as source of truth
      const onchain = await readScore(address);
      setScore(onchain.score);
      // Basic heuristics for displaying limit/APR from model tier (optional)
      // limit/APR to be derived from model tier in a later UI pass

      // Add to history (timestamp from metadata)
      setScoreHistory(prev => [{
        score: data.scoring.score,
        timestamp: Math.floor(new Date(data.metadata.generatedAt).getTime() / 1000),
        signature: data.report.sig
      }, ...prev]);

      addAlert({
        type: 'success',
        title: 'Score Updated Successfully',
        message: `On-chain score: ${onchain.score}. Tx: ${txHash.slice(0, 10)}...`,
      });
    } catch (error) {
      addAlert({
        type: 'error',
        title: 'Score Request Failed',
        message: error instanceof Error ? error.message : 'Failed to request credit score.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!address) return;
    // Load existing on-chain score
    readScore(address).then((s) => {
      setScore(s.score || null);
    }).catch(() => {
      // ignore
    });
  }, [address]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Wallet Not Connected
          </h2>
          <p className="text-gray-600">
            Please connect your wallet to access the scoring service.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Alerts alerts={alerts} onDismiss={dismissAlert} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Credit Scoring</h1>
          <p className="text-gray-600">
            Request and manage your credit score for BNPL agreements.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Score Request Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Request New Score</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assessment Amount (USD)
                  </label>
                  <input
                    type="number"
                    value={requestAmount}
                    onChange={(e) => setRequestAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter amount for credit assessment"
                    min="1"
                  />
                </div>

                <button
                  onClick={handleRequestScore}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center space-x-2 bg-primary-600 text-white py-3 px-4 rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? (
                    <Clock className="w-5 h-5 animate-spin" />
                  ) : (
                    <TrendingUp className="w-5 h-5" />
                  )}
                  <span>{isLoading ? 'Processing...' : 'Request Score'}</span>
                </button>
              </div>
            </div>

            <ScoreCard
              score={score}
              isLoading={isLoading}
              onRequestScore={handleRequestScore}
            />
          </div>

          {/* Score History Section */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Score History</h2>
            
            {scoreHistory.length === 0 ? (
              <div className="text-center py-8">
                <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No score history available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {scoreHistory.map((entry, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-lg">{entry.score}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(entry.timestamp * 1000).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 font-mono">
                      {entry.signature.slice(0, 8)}...
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Oracle Information */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Oracle Integration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Score Oracle Address</h3>
              <p className="text-sm text-gray-600 font-mono">{getScoreOracleAddress()}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Your Address</h3>
              <p className="text-sm text-gray-600 font-mono">
                {address ? getShortAddress(address) : 'Not connected'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 