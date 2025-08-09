import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { 
  CreditCard, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink
} from 'lucide-react';
import { Alerts, Alert } from '../components/Alerts';
import { listAgreements, readAgreement } from '../lib/contracts';

interface BNPLAgreement {
  id: string;
  merchant: string;
  merchantName: string;
  amount: number;
  installments: number;
  paidInstallments: number;
  nextDueDate: number;
  nextAmount: number;
  status: 'active' | 'completed' | 'overdue' | 'pending';
  autoRepay: boolean;
  apr: number;
  totalCost: number;
  createdAt: number;
}

export const Agreements: React.FC = () => {
  const { address, isConnected } = useAccount();
  
  const [agreements, setAgreements] = useState<BNPLAgreement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'overdue'>('all');

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

  useEffect(() => {
    (async () => {
      if (!isConnected || !address) return;
      setIsLoading(true);
      try {
        const addrs = await listAgreements(address);
        const rows: BNPLAgreement[] = [];
        for (const a of addrs) {
          try {
            const { agreement, installments } = await readAgreement(a);
            const due = installments.find((i: any) => !i.isPaid);
            rows.push({
              id: a,
              merchant: agreement.merchant,
              merchantName: agreement.merchant,
              amount: Number(agreement.principal) / 1_000_000,
              installments: Number(agreement.installments),
              paidInstallments: Number(agreement.paidInstallments),
              nextDueDate: due ? Number(due.dueDate) : 0,
              nextAmount: due ? Number(due.amount) / 1_000_000 : 0,
              status: Number(agreement.status) === 2 ? 'completed' : 'active',
              autoRepay: false,
              apr: Number(agreement.apr) / 10000,
              totalCost: Number(agreement.installmentAmount) / 1_000_000 * Number(agreement.installments),
              createdAt: Number(agreement.lastPaymentDate) || 0
            });
          } catch {}
        }
        setAgreements(rows);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [isConnected, address]);

  const filteredAgreements = agreements.filter(agreement => {
    if (filter === 'all') return true;
    return agreement.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-accent-400';
      case 'completed': return 'text-primary-400';
      case 'overdue': return 'text-red-400';
      case 'pending': return 'text-yellow-400';
      default: return 'text-dark-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Clock className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'overdue': return <AlertCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      default: return <CreditCard className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-accent-500/20 text-accent-400 border-accent-500/30',
      completed: 'bg-primary-500/20 text-primary-400 border-primary-500/30',
      overdue: 'bg-red-500/20 text-red-400 border-red-500/30',
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    };
    
    return (
      <span className={`px-3 py-1 text-xs font-medium rounded-full border ${colors[status as keyof typeof colors]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-dark-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-white mb-2">
            Wallet Not Connected
          </h2>
          <p className="text-dark-400">
            Please connect your wallet to view your agreements.
          </p>
        </div>
      </div>
    );
  }

  const totalAgreements = agreements.length;
  const activeAgreements = agreements.filter(a => a.status === 'active').length;
  const completedAgreements = agreements.filter(a => a.status === 'completed').length;
  const overdueAgreements = agreements.filter(a => a.status === 'overdue').length;

  return (
    <div className="space-y-6">
      <Alerts alerts={alerts} onDismiss={dismissAlert} />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">BNPL Agreements</h1>
          <p className="text-dark-400">
            Manage your Buy Now, Pay Later agreements and payment schedules.
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all' 
                ? 'bg-primary-500 text-white' 
                : 'bg-dark-800 text-dark-300 hover:text-white'
            }`}
          >
            All ({totalAgreements})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'active' 
                ? 'bg-accent-500 text-white' 
                : 'bg-dark-800 text-dark-300 hover:text-white'
            }`}
          >
            Active ({activeAgreements})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'completed' 
                ? 'bg-primary-500 text-white' 
                : 'bg-dark-800 text-dark-300 hover:text-white'
            }`}
          >
            Completed ({completedAgreements})
          </button>
          <button
            onClick={() => setFilter('overdue')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'overdue' 
                ? 'bg-red-500 text-white' 
                : 'bg-dark-800 text-dark-300 hover:text-white'
            }`}
          >
            Overdue ({overdueAgreements})
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-400 text-sm">Total Agreements</p>
              <p className="text-2xl font-bold text-white">{totalAgreements}</p>
            </div>
            <CreditCard className="w-8 h-8 text-primary-400" />
          </div>
        </div>
        
        <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-400 text-sm">Active</p>
              <p className="text-2xl font-bold text-accent-400">{activeAgreements}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-accent-400" />
          </div>
        </div>
        
        <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-400 text-sm">Completed</p>
              <p className="text-2xl font-bold text-primary-400">{completedAgreements}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-primary-400" />
          </div>
        </div>
        
        <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-400 text-sm">Overdue</p>
              <p className="text-2xl font-bold text-red-400">{overdueAgreements}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* Agreements List */}
      <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl border border-dark-700/50 overflow-hidden">
        {isLoading ? (
          <div className="p-8">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-dark-700/50 rounded-lg"></div>
              ))}
            </div>
          </div>
        ) : filteredAgreements.length === 0 ? (
          <div className="p-8 text-center">
            <CreditCard className="w-16 h-16 text-dark-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Agreements Found</h3>
            <p className="text-dark-400">
              {filter === 'all' 
                ? "You don't have any BNPL agreements yet." 
                : `No ${filter} agreements found.`
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-dark-700/50">
            {filteredAgreements.map((agreement) => (
              <div key={agreement.id} className="p-6 hover:bg-dark-700/30 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-primary-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{agreement.merchantName}</h3>
                      <p className="text-sm text-dark-400">ID: {agreement.id}</p>
                    </div>
                  </div>
                  {getStatusBadge(agreement.status)}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-dark-400">Amount</p>
                    <p className="font-semibold text-white">${agreement.amount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-dark-400">APR</p>
                    <p className="font-semibold text-white">{(agreement.apr * 100).toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-dark-400">Progress</p>
                    <p className="font-semibold text-white">
                      {agreement.paidInstallments}/{agreement.installments} payments
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-dark-400">Next Due</p>
                    <p className="font-semibold text-white">
                      {new Date(agreement.nextDueDate * 1000).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className={`flex items-center space-x-1 text-sm ${getStatusColor(agreement.status)}`}>
                      {getStatusIcon(agreement.status)}
                      <span>{agreement.status.charAt(0).toUpperCase() + agreement.status.slice(1)}</span>
                    </span>
                    <span className="text-sm text-dark-400">
                      Auto-repay: {agreement.autoRepay ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm">
                      View Details
                    </button>
                    <button className="p-2 text-dark-400 hover:text-white hover:bg-dark-700/50 rounded-lg transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 