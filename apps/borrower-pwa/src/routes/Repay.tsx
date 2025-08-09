import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { CreditCard, DollarSign, Calendar, AlertCircle } from 'lucide-react';
import { RepayList } from '../components/RepayList';
import { Alerts, Alert } from '../components/Alerts';

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

export const Repay: React.FC = () => {
  const { address, isConnected } = useAccount();
  
  const [agreements, setAgreements] = useState<BNPLAgreement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);

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

  // Mock data for demonstration
  useEffect(() => {
    if (isConnected) {
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => {
        const mockAgreements: BNPLAgreement[] = [
          {
            id: 'agreement_1',
            merchant: '0x1234567890123456789012345678901234567890',
            amount: 1200,
            installments: 4,
            paidInstallments: 1,
            nextDueDate: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days from now
            nextAmount: 300000000, // 300 USDC in wei
            status: 'active',
            autoRepay: true
          },
          {
            id: 'agreement_2',
            merchant: '0x0987654321098765432109876543210987654321',
            amount: 800,
            installments: 4,
            paidInstallments: 2,
            nextDueDate: Math.floor(Date.now() / 1000) + 14 * 24 * 60 * 60, // 14 days from now
            nextAmount: 200000000, // 200 USDC in wei
            status: 'active',
            autoRepay: false
          },
          {
            id: 'agreement_3',
            merchant: '0xabcdef1234567890abcdef1234567890abcdef12',
            amount: 500,
            installments: 2,
            paidInstallments: 2,
            nextDueDate: Math.floor(Date.now() / 1000) - 24 * 60 * 60, // 1 day ago
            nextAmount: 0,
            status: 'completed',
            autoRepay: false
          }
        ];
        setAgreements(mockAgreements);
        setIsLoading(false);
      }, 1000);
    }
  }, [isConnected]);

  const handlePayNow = async (agreementId: string) => {
    try {
      // Simulate payment processing
      addAlert({
        type: 'info',
        title: 'Processing Payment',
        message: 'Your payment is being processed...',
      });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update agreement
      setAgreements(prev => prev.map(agreement => {
        if (agreement.id === agreementId) {
          return {
            ...agreement,
            paidInstallments: agreement.paidInstallments + 1,
            status: agreement.paidInstallments + 1 >= agreement.installments ? 'completed' : 'active'
          };
        }
        return agreement;
      }));

      addAlert({
        type: 'success',
        title: 'Payment Successful',
        message: 'Your payment has been processed successfully.',
      });
    } catch (error) {
      addAlert({
        type: 'error',
        title: 'Payment Failed',
        message: 'Failed to process payment. Please try again.',
      });
    }
  };

  const handleToggleAutoRepay = async (agreementId: string, enabled: boolean) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      // Update agreement
      setAgreements(prev => prev.map(agreement => {
        if (agreement.id === agreementId) {
          return { ...agreement, autoRepay: enabled };
        }
        return agreement;
      }));

      addAlert({
        type: 'success',
        title: 'Auto-Repay Updated',
        message: `Auto-repay has been ${enabled ? 'enabled' : 'disabled'} for this agreement.`,
      });
    } catch (error) {
      addAlert({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update auto-repay setting. Please try again.',
      });
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Wallet Not Connected
          </h2>
          <p className="text-gray-600">
            Please connect your wallet to view your repayment agreements.
          </p>
        </div>
      </div>
    );
  }

  const totalOwed = agreements
    .filter(agreement => agreement.status === 'active')
    .reduce((sum, agreement) => sum + (agreement.amount - (agreement.paidInstallments * agreement.amount / agreement.installments)), 0);

  const overdueAgreements = agreements.filter(agreement => 
    agreement.status === 'active' && agreement.nextDueDate < Math.floor(Date.now() / 1000)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Alerts alerts={alerts} onDismiss={dismissAlert} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Repayment Center</h1>
          <p className="text-gray-600">
            Manage your BNPL agreements and make payments.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center space-x-3">
              <DollarSign className="w-8 h-8 text-primary-600" />
              <div>
                <p className="text-sm text-gray-600">Total Owed</p>
                <p className="text-2xl font-bold text-gray-900">${totalOwed.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center space-x-3">
              <CreditCard className="w-8 h-8 text-primary-600" />
              <div>
                <p className="text-sm text-gray-600">Active Agreements</p>
                <p className="text-2xl font-bold text-gray-900">
                  {agreements.filter(a => a.status === 'active').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center space-x-3">
              <Calendar className="w-8 h-8 text-primary-600" />
              <div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600">
                  {overdueAgreements.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Agreements List */}
        <RepayList
          agreements={agreements}
          isLoading={isLoading}
          onPayNow={handlePayNow}
          onToggleAutoRepay={handleToggleAutoRepay}
        />

        {/* Auto-Repay Information */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Auto-Repay Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">How Auto-Repay Works</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Automatic payments on due dates</li>
                <li>• Uses your connected wallet balance</li>
                <li>• No late fees when enabled</li>
                <li>• Can be toggled per agreement</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Benefits</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Never miss a payment</li>
                <li>• Improve your credit score</li>
                <li>• Avoid late fees</li>
                <li>• Maintain good standing</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 