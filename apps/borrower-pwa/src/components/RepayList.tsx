import React from 'react';
import { Calendar, DollarSign, CreditCard, ToggleLeft, ToggleRight } from 'lucide-react';

interface BNPLAgreement {
  id: string;
  merchant: string;
  amount: number;
  installments: number;
  paidInstallments: number;
  nextDueDate: number;
  nextAmount: number;
  status: 'active' | 'completed' | 'overdue';
  autoRepay: boolean;
}

interface RepayListProps {
  agreements: BNPLAgreement[];
  isLoading?: boolean;
  onPayNow?: (agreementId: string) => void;
  onToggleAutoRepay?: (agreementId: string, enabled: boolean) => void;
}

export const RepayList: React.FC<RepayListProps> = ({
  agreements,
  isLoading = false,
  onPayNow,
  onToggleAutoRepay
}) => {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  // const getStatusColor = (status: string) => {
  //   switch (status) {
  //     case 'active': return 'text-green-600';
  //     case 'completed': return 'text-blue-600';
  //     case 'overdue': return 'text-red-600';
  //     default: return 'text-gray-600';
  //   }
  // };

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      overdue: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status as keyof typeof colors]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Repayment Agreements</h3>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (agreements.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Repayment Agreements</h3>
        <div className="text-center py-8">
          <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No active agreements</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Repayment Agreements</h3>
      
      <div className="space-y-4">
        {agreements.map((agreement) => (
          <div key={agreement.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900">
                  {agreement.merchant.slice(0, 6)}...{agreement.merchant.slice(-4)}
                </span>
                {getStatusBadge(agreement.status)}
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Auto-repay</span>
                <button
                  onClick={() => onToggleAutoRepay?.(agreement.id, !agreement.autoRepay)}
                  className="flex items-center"
                >
                  {agreement.autoRepay ? (
                    <ToggleRight className="w-5 h-5 text-green-600" />
                  ) : (
                    <ToggleLeft className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <div className="flex items-center space-x-1 text-sm text-gray-600">
                  <DollarSign className="w-4 h-4" />
                  <span>Total Amount</span>
                </div>
                <div className="font-medium">${agreement.amount.toLocaleString()}</div>
              </div>
              <div>
                <div className="flex items-center space-x-1 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Next Due</span>
                </div>
                <div className="font-medium">{formatDate(agreement.nextDueDate)}</div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {agreement.paidInstallments}/{agreement.installments} installments paid
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Next Payment</div>
                <div className="font-medium">${(agreement.nextAmount / 1e6).toFixed(2)}</div>
              </div>
            </div>

            {agreement.status === 'active' && onPayNow && (
              <button
                onClick={() => onPayNow(agreement.id)}
                className="w-full mt-3 bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 transition-colors"
              >
                Pay Now
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}; 