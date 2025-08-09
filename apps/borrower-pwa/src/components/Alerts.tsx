import React from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

export interface Alert {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: number;
}

interface AlertsProps {
  alerts: Alert[];
  onDismiss?: (alertId: string) => void;
}

export const Alerts: React.FC<AlertsProps> = ({ alerts, onDismiss }) => {
  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getAlertStyles = (type: Alert['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-[1000] space-y-2 max-w-sm pointer-events-auto">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`flex items-start p-4 rounded-lg border ${getAlertStyles(alert.type)} shadow-lg`}
        >
          <div className="flex-shrink-0 mr-3 mt-0.5">
            {getAlertIcon(alert.type)}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium">{alert.title}</h4>
            <p className="text-sm mt-1">{alert.message}</p>
          </div>
          
          {onDismiss && (
            <button
              onClick={() => onDismiss(alert.id)}
              className="flex-shrink-0 ml-3 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}; 