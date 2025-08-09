import React from 'react';
import { TrendingUp, RefreshCw } from 'lucide-react';

interface ScoreCardProps {
  score: number | null;
  isLoading?: boolean;
  onRequestScore?: () => void;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({
  score,
  isLoading = false,
  onRequestScore
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 750) return 'text-green-400';
    if (score >= 650) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 750) return 'Excellent';
    if (score >= 650) return 'Good';
    if (score >= 550) return 'Fair';
    return 'Poor';
  };

  const getScoreRingColor = (score: number) => {
    if (score >= 750) return 'stroke-green-400';
    if (score >= 650) return 'stroke-yellow-400';
    return 'stroke-red-400';
  };

  const getScoreRingBg = (score: number) => {
    if (score >= 750) return 'stroke-green-400/20';
    if (score >= 650) return 'stroke-yellow-400/20';
    return 'stroke-red-400/20';
  };

  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDasharray = circumference;
  const strokeDashoffset = score ? circumference - (score / 850) * circumference : circumference;

  return (
    <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50 hover:border-primary-500/30 transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Credit Score</h3>
            <p className="text-sm text-dark-400">Your current credit rating</p>
          </div>
        </div>
        
        <button
          onClick={onRequestScore}
          disabled={isLoading}
          className="p-2 text-dark-400 hover:text-white hover:bg-dark-700/50 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex items-center justify-center mb-6">
        <div className="relative">
          {/* Background ring */}
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className={`${getScoreRingBg(score || 0)}`}
            />
            {/* Progress ring */}
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className={`${getScoreRingColor(score || 0)} transition-all duration-1000 ease-out`}
            />
          </svg>
          
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {isLoading ? (
              <div className="animate-pulse">
                <div className="w-8 h-8 bg-dark-600 rounded-full mb-2"></div>
                <div className="w-12 h-4 bg-dark-600 rounded"></div>
              </div>
            ) : score ? (
              <>
                <div className={`text-2xl font-bold ${getScoreColor(score)}`}>
                  {score}
                </div>
                <div className="text-xs text-dark-400">
                  {getScoreLabel(score)}
                </div>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-dark-400">
                  --
                </div>
                <div className="text-xs text-dark-400">
                  No Score
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-dark-400">Score Range</span>
          <span className="text-sm text-white">300 - 850</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-dark-400">Last Updated</span>
          <span className="text-sm text-white">
            {score ? new Date().toLocaleDateString() : 'Never'}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-dark-400">Status</span>
          <span className={`text-sm px-2 py-1 rounded-full ${
            score ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
          }`}>
            {score ? 'Active' : 'Pending'}
          </span>
        </div>
      </div>

      {!score && (
        <button
          onClick={onRequestScore}
          disabled={isLoading}
          className="w-full mt-4 px-4 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
        >
          <TrendingUp className="w-4 h-4" />
          <span>Request Score</span>
        </button>
      )}
    </div>
  );
}; 