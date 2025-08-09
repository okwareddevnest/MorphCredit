import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { 
  User, 
  Shield, 
  Bell, 
  CreditCard, 
  Settings, 
  Key,
  Eye,
  EyeOff,
  Save,
  Edit3,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Alerts, Alert } from '../components/Alerts';

export const Profile: React.FC = () => {
  const { address, isConnected } = useAccount();
  
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: 'user@example.com',
    phone: '+1 (555) 123-4567',
    notifications: {
      email: true,
      push: true,
      sms: false
    },
    security: {
      twoFactor: false,
      autoRepay: true,
      biometric: false
    },
    preferences: {
      currency: 'USD',
      language: 'en',
      theme: 'dark'
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

  const handleSave = () => {
    setIsEditing(false);
    addAlert({
      type: 'success',
      title: 'Profile Updated',
      message: 'Your profile settings have been saved successfully.'
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form data to original values
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
            Please connect your wallet to view your profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Alerts alerts={alerts} onDismiss={dismissAlert} />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Profile & Settings</h1>
          <p className="text-dark-400">
            Manage your account settings, security preferences, and notifications.
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-dark-700 text-white rounded-lg hover:bg-dark-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center space-x-2"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-primary-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Personal Information</h2>
                <p className="text-dark-400">Update your contact details</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 bg-dark-700/50 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 bg-dark-700/50 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Wallet Address
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={address || ''}
                    disabled
                    className="flex-1 px-4 py-3 bg-dark-700/50 border border-dark-600 rounded-lg text-white opacity-50 cursor-not-allowed"
                  />
                  <button className="px-4 py-3 bg-dark-700 text-white rounded-lg hover:bg-dark-600 transition-colors">
                    <Key className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-accent-500/20 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-accent-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Security Settings</h2>
                <p className="text-dark-400">Manage your account security</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-dark-700/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-accent-500/20 rounded-lg flex items-center justify-center">
                    <Key className="w-4 h-4 text-accent-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Two-Factor Authentication</h3>
                    <p className="text-sm text-dark-400">Add an extra layer of security</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.security.twoFactor}
                    onChange={(e) => setFormData({
                      ...formData,
                      security: {...formData.security, twoFactor: e.target.checked}
                    })}
                    disabled={!isEditing}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-dark-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-dark-700/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-primary-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Auto-Repay</h3>
                    <p className="text-sm text-dark-400">Automatically pay BNPL installments</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.security.autoRepay}
                    onChange={(e) => setFormData({
                      ...formData,
                      security: {...formData.security, autoRepay: e.target.checked}
                    })}
                    disabled={!isEditing}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-dark-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-dark-700/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-secondary-500/20 rounded-lg flex items-center justify-center">
                    <User className="w-4 h-4 text-secondary-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Biometric Authentication</h3>
                    <p className="text-sm text-dark-400">Use fingerprint or face ID</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.security.biometric}
                    onChange={(e) => setFormData({
                      ...formData,
                      security: {...formData.security, biometric: e.target.checked}
                    })}
                    disabled={!isEditing}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-dark-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Profile Card */}
          <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <User className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">John Doe</h3>
              <p className="text-dark-400 text-sm mb-4">Premium Member</p>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-dark-400">Member Since</span>
                  <span className="text-white">Jan 2024</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-400">Credit Score</span>
                  <span className="text-accent-400 font-semibold">750</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-400">Total Agreements</span>
                  <span className="text-white">12</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-secondary-500/20 rounded-lg flex items-center justify-center">
                <Bell className="w-4 h-4 text-secondary-400" />
              </div>
              <h3 className="font-semibold text-white">Notifications</h3>
            </div>
            
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.notifications.email}
                  onChange={(e) => setFormData({
                    ...formData,
                    notifications: {...formData.notifications, email: e.target.checked}
                  })}
                  disabled={!isEditing}
                  className="w-4 h-4 text-primary-500 bg-dark-700 border-dark-600 rounded focus:ring-primary-500 focus:ring-2"
                />
                <span className="text-sm text-white">Email Notifications</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.notifications.push}
                  onChange={(e) => setFormData({
                    ...formData,
                    notifications: {...formData.notifications, push: e.target.checked}
                  })}
                  disabled={!isEditing}
                  className="w-4 h-4 text-primary-500 bg-dark-700 border-dark-600 rounded focus:ring-primary-500 focus:ring-2"
                />
                <span className="text-sm text-white">Push Notifications</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.notifications.sms}
                  onChange={(e) => setFormData({
                    ...formData,
                    notifications: {...formData.notifications, sms: e.target.checked}
                  })}
                  disabled={!isEditing}
                  className="w-4 h-4 text-primary-500 bg-dark-700 border-dark-600 rounded focus:ring-primary-500 focus:ring-2"
                />
                <span className="text-sm text-white">SMS Notifications</span>
              </label>
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center">
                <Settings className="w-4 h-4 text-primary-400" />
              </div>
              <h3 className="font-semibold text-white">Preferences</h3>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Currency
                </label>
                <select
                  value={formData.preferences.currency}
                  onChange={(e) => setFormData({
                    ...formData,
                    preferences: {...formData.preferences, currency: e.target.value}
                  })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Language
                </label>
                <select
                  value={formData.preferences.language}
                  onChange={(e) => setFormData({
                    ...formData,
                    preferences: {...formData.preferences, language: e.target.value}
                  })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 