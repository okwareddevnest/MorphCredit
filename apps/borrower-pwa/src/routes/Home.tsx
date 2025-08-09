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
import { ScoreCard } from '../components/ScoreCard';
import { LimitAPR } from '../components/LimitAPR';
import { Alerts, Alert } from '../components/Alerts';
import { formatAddress, formatBalance } from '../lib/wallet';

export const Home: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [creditScore, setCreditScore] = useState<number | null>(null);
  const [creditLimit, setCreditLimit] = useState<number>(0);
  const [apr, setApr] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

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
      setTimeout(() => {
        setCreditScore(750);
        setCreditLimit(5000);
        setApr(0.18);
        setIsLoading(false);
        
        addAlert({
          type: 'success',
          title: 'Welcome back!',
          message: 'Your credit score has been updated.'
        });
      }, 1000);
    }
  }, [isConnected]);

  const stats = [
    {
      title: 'Total Agreements',
      value: '12',
      change: '+2',
      changeType: 'positive' as const,
      icon: CreditCard,
      color: 'text-primary-400'
    },
    {
      title: 'Active Payments',
      value: '4',
      change: '-1',
      changeType: 'negative' as const,
      icon: Activity,
      color: 'text-accent-400'
    },
    {
      title: 'Payment History',
      value: '98%',
      change: '+2%',
      changeType: 'positive' as const,
      icon: TrendingUp,
      color: 'text-secondary-400'
    },
    {
      title: 'Security Score',
      value: 'A+',
      change: '0',
      changeType: 'neutral' as const,
      icon: Shield,
      color: 'text-green-400'
    }
  ];

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
    <div className="space-y-6">
      <Alerts alerts={alerts} onDismiss={dismissAlert} />
      
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-500/10 to-secondary-500/10 rounded-xl p-6 border border-primary-500/20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Welcome back, {address ? formatAddress(address) : 'User'}!
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
            onRequestScore={() => {
              addAlert({
                type: 'info',
                title: 'Score Request',
                message: 'Redirecting to score request page...'
              });
            }}
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
          <button className="flex items-center space-x-3 p-4 bg-primary-500/10 hover:bg-primary-500/20 border border-primary-500/30 rounded-lg transition-all duration-200 group">
            <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5 text-primary-400" />
            </div>
            <div className="text-left">
              <p className="font-medium text-white">Request Score</p>
              <p className="text-sm text-dark-400">Get your latest credit score</p>
            </div>
          </button>
          
          <button className="flex items-center space-x-3 p-4 bg-accent-500/10 hover:bg-accent-500/20 border border-accent-500/30 rounded-lg transition-all duration-200 group">
            <div className="w-10 h-10 bg-accent-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <DollarSign className="w-5 h-5 text-accent-400" />
            </div>
            <div className="text-left">
              <p className="font-medium text-white">Make Payment</p>
              <p className="text-sm text-dark-400">Pay your BNPL installments</p>
            </div>
          </button>
          
          <button className="flex items-center space-x-3 p-4 bg-secondary-500/10 hover:bg-secondary-500/20 border border-secondary-500/30 rounded-lg transition-all duration-200 group">
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
          {[
            { type: 'payment', amount: 250, merchant: 'TechStore Pro', date: '2 hours ago', status: 'completed' },
            { type: 'agreement', amount: 1200, merchant: 'GadgetHub', date: '1 day ago', status: 'active' },
            { type: 'score', amount: null, merchant: 'Credit Update', date: '3 days ago', status: 'completed' }
          ].map((activity, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-dark-700/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  activity.type === 'payment' ? 'bg-green-500/20' :
                  activity.type === 'agreement' ? 'bg-primary-500/20' :
                  'bg-secondary-500/20'
                }`}>
                  {activity.type === 'payment' && <DollarSign className="w-4 h-4 text-green-400" />}
                  {activity.type === 'agreement' && <CreditCard className="w-4 h-4 text-primary-400" />}
                  {activity.type === 'score' && <TrendingUp className="w-4 h-4 text-secondary-400" />}
                </div>
                <div>
                  <p className="font-medium text-white">
                    {activity.type === 'payment' && `Payment to ${activity.merchant}`}
                    {activity.type === 'agreement' && `New agreement with ${activity.merchant}`}
                    {activity.type === 'score' && `Credit score updated`}
                  </p>
                  <p className="text-sm text-dark-400">{activity.date}</p>
                </div>
              </div>
              
              <div className="text-right">
                {activity.amount && (
                  <p className="font-semibold text-white">${activity.amount}</p>
                )}
                <span className={`text-xs px-2 py-1 rounded-full ${
                  activity.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                  activity.status === 'active' ? 'bg-primary-500/20 text-primary-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {activity.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 