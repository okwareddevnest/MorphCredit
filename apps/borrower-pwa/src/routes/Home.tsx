import React, { useState, useEffect } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { 
  TrendingUp, 
  DollarSign, 
  CreditCard, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Shield,
  Zap
} from 'lucide-react';
import { ConnectWallet } from '../components/ConnectWallet';
import { useNavigate } from 'react-router-dom';
import { ScoreCard } from '../components/ScoreCard';
import { LimitAPR } from '../components/LimitAPR';
import { Alerts, Alert } from '../components/Alerts';
import { formatAddress, formatBalance } from '../lib/wallet';
import { readScore, readRegistryState, listAgreements, readAgreement } from '../lib/contracts';
import { getUserProfile } from '../lib/api';

export const Home: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  const navigate = useNavigate();
  
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [creditScore, setCreditScore] = useState<number | null>(null);
  const [creditLimit, setCreditLimit] = useState<number>(0);
  const [apr, setApr] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState<string>('');
  const [stats, setStats] = useState<Array<{
    title: string;
    value: string;
    icon: any;
    color: string;
    change?: string;
    changeType?: 'positive' | 'negative' | 'neutral';
  }>>([]);
  const [activities, setActivities] = useState<Array<{
    type: 'payment';
    amount: number;
    merchant: string;
    timestamp: number;
    status: 'completed';
  }>>([]);

  // Alerts reserved for future; currently not used on this page

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  useEffect(() => {
    (async () => {
      if (!isConnected || !address) return;
      setIsLoading(true);
      try {
        // Load display name
        let profileSecurity: { twoFactor?: boolean; biometric?: boolean } = {};
        try {
          const p = await getUserProfile(address);
          setUsername(p.username || '');
          profileSecurity = p.security || {};
        } catch {}
        try {
          const s = await readScore(address);
          setCreditScore(s.score);
        } catch {}
        const st = await readRegistryState(address);
        if (st) {
          setCreditLimit(Number(st.limit / BigInt(1_000_000)));
          setApr(st.aprBps / 10000);
        }

        // Agreements aggregates - show both borrower and merchant agreements
        try {
          const addrs = await listAgreements(address);
          let totalAgreements = addrs.length;
          let activeAgreements = 0;
          let totalInstallments = 0;
          let paidInstallments = 0;
          const payments: Array<{ type: 'payment'; amount: number; merchant: string; timestamp: number; status: 'completed' }> = [];
          for (const a of addrs) {
            try {
              const { agreement, installments } = await readAgreement(a);
              totalInstallments += Number(agreement.installments);
              paidInstallments += Number(agreement.paidInstallments);
              const statusNum = Number(agreement.status);
              if (statusNum !== 2) activeAgreements += 1; // 2 = Completed
              // Collect paid installments for recent activity
              for (const inst of installments as any[]) {
                if (inst.isPaid && Number(inst.paidAt) > 0) {
                  payments.push({
                    type: 'payment',
                    amount: Number(inst.amount) / 1_000_000,
                    merchant: agreement.merchant,
                    timestamp: Number(inst.paidAt),
                    status: 'completed',
                  });
                }
              }
            } catch {}
          }
          const paymentPct = totalInstallments > 0 ? Math.round((paidInstallments / totalInstallments) * 100) : 0;
          const secScore = profileSecurity.biometric && profileSecurity.twoFactor
            ? 'A+'
            : (profileSecurity.biometric || profileSecurity.twoFactor) ? 'A' : 'B';

          setStats([
            { title: 'Total Agreements', value: String(totalAgreements), icon: CreditCard, color: 'text-primary-400' },
            { title: 'Active Payments', value: String(activeAgreements), icon: Activity, color: 'text-accent-400' },
            { title: 'Payment History', value: `${paymentPct}%`, icon: TrendingUp, color: 'text-secondary-400' },
            { title: 'Security Score', value: secScore, icon: Shield, color: 'text-green-400' },
          ]);
          payments.sort((a, b) => b.timestamp - a.timestamp);
          setActivities(payments.slice(0, 5));
        } catch {}
      } finally {
        setIsLoading(false);
      }
    })();
  }, [isConnected, address]);

  // Stats are computed from-chain and from profile security settings

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center space-y-6">
          <AlertCircle className="w-16 h-16 text-dark-400 mx-auto" />
          <div>
            <h2 className="text-2xl font-semibold text-white mb-2">Wallet Not Connected</h2>
            <p className="text-dark-400 mb-4">Connect to Morph Holesky to access your dashboard.</p>
            <div className="flex items-center justify-center"><ConnectWallet /></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      <Alerts alerts={alerts} onDismiss={dismissAlert} />
      
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-500/10 to-secondary-500/10 rounded-xl p-6 border border-primary-500/20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Welcome back, {username || (address ? formatAddress(address) : 'User')}!
            </h1>
            <p className="text-dark-300">
              Here's your credit overview and recent activity.
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-dark-400">Wallet Balance</p>
            <p className="text-lg font-semibold text-white">
              {balance ? formatBalance(balance) : 'Loading...'}
            </p>
          </div>
        </div>
      </div>

      {/* Credit Score and Limit Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="animate-slide-up">
          <ScoreCard 
            score={creditScore} 
            isLoading={isLoading}
            onRequestScore={() => navigate('/score')}
          />
        </div>
        
        <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <LimitAPR 
            limit={creditLimit} 
            apr={apr} 
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div 
              key={stat.title}
              className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50 hover:border-primary-500/30 transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${0.2 + index * 0.1}s` }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 ${stat.color.replace('text-', 'bg-')}/20 rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div className={`flex items-center space-x-1 text-sm ${
                  stat.changeType === 'positive' ? 'text-green-400' : 
                  stat.changeType === 'negative' ? 'text-red-400' : 'text-dark-400'
                }`}>
                  {stat.changeType === 'positive' && <ArrowUpRight className="w-3 h-3" />}
                  {stat.changeType === 'negative' && <ArrowDownRight className="w-3 h-3" />}
                  <span>{stat.change}</span>
                </div>
              </div>
              
              <div>
                <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
                <p className="text-sm text-dark-400">{stat.title}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50">
        <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button onClick={() => navigate('/score')} className="flex items-center space-x-3 p-4 bg-primary-500/10 hover:bg-primary-500/20 border border-primary-500/30 rounded-lg transition-all duration-200 group">
            <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5 text-primary-400" />
            </div>
            <div className="text-left">
              <p className="font-medium text-white">Request Score</p>
              <p className="text-sm text-dark-400">Get your latest credit score</p>
            </div>
          </button>
          
          <button onClick={() => navigate('/repay')} className="flex items-center space-x-3 p-4 bg-accent-500/10 hover:bg-accent-500/20 border border-accent-500/30 rounded-lg transition-all duration-200 group">
            <div className="w-10 h-10 bg-accent-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <DollarSign className="w-5 h-5 text-accent-400" />
            </div>
            <div className="text-left">
              <p className="font-medium text-white">Make Payment</p>
              <p className="text-sm text-dark-400">Pay your BNPL installments</p>
            </div>
          </button>
          
          <button onClick={() => navigate('/settings?tab=security')} className="flex items-center space-x-3 p-4 bg-secondary-500/10 hover:bg-secondary-500/20 border border-secondary-500/30 rounded-lg transition-all duration-200 group">
            <div className="w-10 h-10 bg-secondary-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <Zap className="w-5 h-5 text-secondary-400" />
            </div>
            <div className="text-left">
              <p className="font-medium text-white">Auto-Repay</p>
              <p className="text-sm text-dark-400">Manage automatic payments</p>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50">
        <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
        
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="p-4 bg-dark-700/30 rounded-lg text-dark-300">No recent activity</div>
          ) : (
            activities.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-dark-700/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-green-500/20">
                    <DollarSign className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Payment to {activity.merchant}</p>
                    <p className="text-sm text-dark-400">{new Date(activity.timestamp * 1000).toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-white">${activity.amount}</p>
                  <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">{activity.status}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}; 