import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { 
  Settings, 
  Shield, 
  Bell, 
  Globe, 
  Database,
  Download,
  Trash2,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { Alerts, Alert } from '../components/Alerts';
import { getUserProfile, saveUserProfile } from '../lib/api';

export const SettingsPage: React.FC = () => {
  const { address, isConnected } = useAccount();
  const search = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [activeTab, setActiveTab] = useState(search.get('tab') || 'general');
  const [settings, setSettings] = useState({
    general: {
      theme: 'dark',
      language: 'en',
      currency: 'USD',
      timezone: 'UTC'
    },
    security: {
      sessionTimeout: 30,
      requirePasswordForTransactions: true,
      maxTransactionAmount: 10000,
      whitelistAddresses: [] as string[]
    },
    notifications: {
      email: {
        enabled: true,
        frequency: 'immediate',
        types: ['payments', 'agreements', 'security']
      },
      push: {
        enabled: true,
        frequency: 'immediate',
        types: ['payments', 'agreements']
      },
      sms: {
        enabled: false,
        frequency: 'daily',
        types: ['security']
      }
    },
    privacy: {
      shareAnalytics: true,
      shareMarketing: false,
      shareThirdParty: false
    }
  });

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

  const handleSaveSettings = async () => {
    if (!address) return;
    try {
      await saveUserProfile(address, {
        preferences: settings.general,
        security: settings.security as any,
        notificationsConfig: settings.notifications as any,
        privacy: settings.privacy as any,
      } as any);
      addAlert({ type: 'success', title: 'Settings Saved', message: 'Your settings have been updated successfully.' });
    } catch (e) {
      addAlert({ type: 'error', title: 'Save Failed', message: e instanceof Error ? e.message : 'Failed to save settings.' });
    }
  };

  React.useEffect(() => {
    if (!address) return;
    getUserProfile(address).then((p) => {
      setSettings((prev) => ({
        ...prev,
        general: {
          theme: p.preferences?.theme || prev.general.theme,
          language: p.preferences?.language || prev.general.language,
          currency: p.preferences?.currency || prev.general.currency,
          timezone: p.preferences?.timezone || prev.general.timezone,
        },
        security: {
          ...prev.security,
          sessionTimeout: p.security?.sessionTimeout ?? prev.security.sessionTimeout,
          requirePasswordForTransactions: p.security?.requirePasswordForTransactions ?? prev.security.requirePasswordForTransactions,
          maxTransactionAmount: p.security?.maxTransactionAmount ?? prev.security.maxTransactionAmount,
          whitelistAddresses: p.security?.whitelistAddresses ?? prev.security.whitelistAddresses,
        },
        notifications: p.notificationsConfig ? (p.notificationsConfig as any) : prev.notifications,
        privacy: p.privacy ? (p.privacy as any) : prev.privacy,
      }));
    }).catch(() => {});
  }, [address]);

  const handleExportData = () => {
    addAlert({
      type: 'info',
      title: 'Data Export',
      message: 'Your data export has been initiated. You will receive an email when it\'s ready.'
    });
  };

  const handleDeleteAccount = () => {
    addAlert({
      type: 'warning',
      title: 'Account Deletion',
      message: 'This action cannot be undone. Please confirm your decision.'
    });
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-dark-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-white mb-2">
            Wallet Not Connected
          </h2>
          <p className="text-dark-400">
            Please connect your wallet to access settings.
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Globe },
    { id: 'data', label: 'Data & Export', icon: Database }
  ];

  return (
    <div className="space-y-6">
      <Alerts alerts={alerts} onDismiss={dismissAlert} />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-dark-400">
            Configure your account preferences and security settings.
          </p>
        </div>
        
        <button
          onClick={handleSaveSettings}
          className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center space-x-2"
        >
          <CheckCircle className="w-4 h-4" />
          <span>Save All Changes</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl border border-dark-700/50 overflow-hidden">
            <nav className="p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      isActive
                        ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                        : 'text-dark-300 hover:text-white hover:bg-dark-700/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl border border-dark-700/50 p-6">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4">General Settings</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-2">
                        Theme
                      </label>
                      <select
                        value={settings.general.theme}
                        onChange={(e) => setSettings({
                          ...settings,
                          general: {...settings.general, theme: e.target.value}
                        })}
                        className="w-full px-4 py-3 bg-dark-700/50 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="dark">Dark</option>
                        <option value="light">Light</option>
                        <option value="auto">Auto</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-2">
                        Language
                      </label>
                      <select
                        value={settings.general.language}
                        onChange={(e) => setSettings({
                          ...settings,
                          general: {...settings.general, language: e.target.value}
                        })}
                        className="w-full px-4 py-3 bg-dark-700/50 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-2">
                        Currency
                      </label>
                      <select
                        value={settings.general.currency}
                        onChange={(e) => setSettings({
                          ...settings,
                          general: {...settings.general, currency: e.target.value}
                        })}
                        className="w-full px-4 py-3 bg-dark-700/50 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="JPY">JPY (¥)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-2">
                        Timezone
                      </label>
                      <select
                        value={settings.general.timezone}
                        onChange={(e) => setSettings({
                          ...settings,
                          general: {...settings.general, timezone: e.target.value}
                        })}
                        className="w-full px-4 py-3 bg-dark-700/50 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="UTC">UTC</option>
                        <option value="EST">Eastern Time</option>
                        <option value="PST">Pacific Time</option>
                        <option value="GMT">GMT</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4">Security Settings</h2>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-dark-700/30 rounded-lg">
                      <div>
                        <h3 className="font-medium text-white">Session Timeout</h3>
                        <p className="text-sm text-dark-400">Automatically log out after inactivity</p>
                      </div>
                      <select
                        value={settings.security.sessionTimeout}
                        onChange={(e) => setSettings({
                          ...settings,
                          security: {...settings.security, sessionTimeout: parseInt(e.target.value)}
                        })}
                        className="px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value={15}>15 minutes</option>
                        <option value={30}>30 minutes</option>
                        <option value={60}>1 hour</option>
                        <option value={0}>Never</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-dark-700/30 rounded-lg">
                      <div>
                        <h3 className="font-medium text-white">Require Password for Transactions</h3>
                        <p className="text-sm text-dark-400">Always prompt for password before payments</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.security.requirePasswordForTransactions}
                          onChange={(e) => setSettings({
                            ...settings,
                            security: {...settings.security, requirePasswordForTransactions: e.target.checked}
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-dark-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-dark-700/30 rounded-lg">
                      <div>
                        <h3 className="font-medium text-white">Maximum Transaction Amount</h3>
                        <p className="text-sm text-dark-400">Set daily spending limit</p>
                      </div>
                      <input
                        type="number"
                        value={settings.security.maxTransactionAmount}
                        onChange={(e) => setSettings({
                          ...settings,
                          security: {...settings.security, maxTransactionAmount: parseInt(e.target.value)}
                        })}
                        className="px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-32"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4">Notification Preferences</h2>
                  
                  <div className="space-y-6">
                    {Object.entries(settings.notifications).map(([type, config]) => (
                      <div key={type} className="p-4 bg-dark-700/30 rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-medium text-white capitalize">{type} Notifications</h3>
                            <p className="text-sm text-dark-400">Receive {type} notifications</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={config.enabled}
                              onChange={(e) => setSettings({
                                ...settings,
                                notifications: {
                                  ...settings.notifications,
                                  [type]: {...config, enabled: e.target.checked}
                                }
                              })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-dark-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                          </label>
                        </div>
                        
                        {config.enabled && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-dark-300 mb-2">
                                Frequency
                              </label>
                              <select
                                value={config.frequency}
                                onChange={(e) => setSettings({
                                  ...settings,
                                  notifications: {
                                    ...settings.notifications,
                                    [type]: {...config, frequency: e.target.value}
                                  }
                                })}
                                className="w-full px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              >
                                <option value="immediate">Immediate</option>
                                <option value="hourly">Hourly</option>
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4">Privacy Settings</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-dark-700/30 rounded-lg">
                      <div>
                        <h3 className="font-medium text-white">Share Analytics Data</h3>
                        <p className="text-sm text-dark-400">Help us improve by sharing anonymous usage data</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.privacy.shareAnalytics}
                          onChange={(e) => setSettings({
                            ...settings,
                            privacy: {...settings.privacy, shareAnalytics: e.target.checked}
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-dark-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-dark-700/30 rounded-lg">
                      <div>
                        <h3 className="font-medium text-white">Marketing Communications</h3>
                        <p className="text-sm text-dark-400">Receive promotional emails and updates</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.privacy.shareMarketing}
                          onChange={(e) => setSettings({
                            ...settings,
                            privacy: {...settings.privacy, shareMarketing: e.target.checked}
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-dark-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-dark-700/30 rounded-lg">
                      <div>
                        <h3 className="font-medium text-white">Third-Party Sharing</h3>
                        <p className="text-sm text-dark-400">Allow data sharing with trusted partners</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.privacy.shareThirdParty}
                          onChange={(e) => setSettings({
                            ...settings,
                            privacy: {...settings.privacy, shareThirdParty: e.target.checked}
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-dark-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'data' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4">Data Management</h2>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-dark-700/30 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-medium text-white">Export Your Data</h3>
                          <p className="text-sm text-dark-400">Download all your data in JSON format</p>
                        </div>
                        <button
                          onClick={handleExportData}
                          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center space-x-2"
                        >
                          <Download className="w-4 h-4" />
                          <span>Export</span>
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-medium text-red-400">Delete Account</h3>
                          <p className="text-sm text-red-300">Permanently delete your account and all data</p>
                        </div>
                        <button
                          onClick={handleDeleteAccount}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 