import React from 'react';
import { DollarSign, Percent, CreditCard } from 'lucide-react';

interface LimitAPRProps {
  limit: number;
  apr: number;
  usedAmount?: number;
  isLoading?: boolean;
}

export const LimitAPR: React.FC<LimitAPRProps> = ({
  limit,
  apr,
  usedAmount = 0,
  isLoading = false
}) => {
  const availableAmount = limit - usedAmount;
  const usagePercentage = limit > 0 ? (usedAmount / limit) * 100 : 0;

  const getUsageColor = (percentage: number) => {
    if (percentage >= 80) return 'text-red-400';
    if (percentage >= 60) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getUsageBarColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-red-400';
    if (percentage >= 60) return 'bg-yellow-400';
    return 'bg-green-400';
  };

  return (
    <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50 hover:border-primary-500/30 transition-all duration-300">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-accent-500/20 rounded-lg flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-accent-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Credit Limit & APR</h3>
          <p className="text-sm text-dark-400">Your borrowing capacity</p>
        </div>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-dark-700/50 rounded"></div>
          <div className="h-4 bg-dark-700/50 rounded w-3/4"></div>
          <div className="h-4 bg-dark-700/50 rounded w-1/2"></div>
        </div>
      ) : (
        <>
          {/* Credit Limit */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-dark-400">Credit Limit</span>
              <span className="text-lg font-bold text-white">
                ${limit.toLocaleString()}
              </span>
            </div>
            
            {/* Usage Bar */}
            <div className="w-full bg-dark-700/50 rounded-full h-2 mb-2">
              <div
                className={`h-2 rounded-full transition-all duration-1000 ease-out ${getUsageBarColor(usagePercentage)}`}
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              ></div>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-dark-400">Used: ${usedAmount.toLocaleString()}</span>
              <span className={`font-medium ${getUsageColor(usagePercentage)}`}>
                {usagePercentage.toFixed(1)}% used
              </span>
            </div>
          </div>

          {/* Available Amount */}
          <div className="mb-6 p-4 bg-dark-700/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-green-400" />
                <span className="text-sm text-dark-400">Available</span>
              </div>
              <span className="text-lg font-bold text-green-400">
                ${availableAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* APR */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-dark-400">Annual Percentage Rate</span>
              <span className="text-lg font-bold text-white">
                {(apr * 100).toFixed(1)}%
              </span>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-dark-400">
              <Percent className="w-3 h-3" />
              <span>Interest rate for BNPL agreements</span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-dark-700/30 rounded-lg">
              <div className="text-2xl font-bold text-white mb-1">
                {limit > 0 ? Math.floor(availableAmount / 100) * 100 : 0}
              </div>
              <div className="text-xs text-dark-400">Min. Available</div>
            </div>
            
            <div className="text-center p-3 bg-dark-700/30 rounded-lg">
              <div className="text-2xl font-bold text-white mb-1">
                {usagePercentage.toFixed(0)}%
              </div>
              <div className="text-xs text-dark-400">Utilization</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}; 