import React from 'react';
import { X, CheckCircle, Copy, Download, ExternalLink } from 'lucide-react';

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  txHash: string;
  agreementId: string;
  status: 'confirmed' | 'pending' | 'failed';
  timestamp: number;
}

interface OrderConfirmationProps {
  order: Order;
  onClose: () => void;
}

export const OrderConfirmation: React.FC<OrderConfirmationProps> = ({ order, onClose }) => {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
    console.log(`${label} copied to clipboard`);
  };

  const downloadReceipt = () => {
    const receipt = `
MorphCredit Receipt
===================

Order ID: ${order.id}
Date: ${new Date(order.timestamp).toLocaleString()}
Status: ${order.status}

Items:
${order.items.map(item => `- ${item.name} x${item.quantity} - $${item.price.toLocaleString()}`).join('\n')}

Total: $${order.total.toLocaleString()}

Transaction Hash: ${order.txHash}
Agreement ID: ${order.agreementId}

Thank you for your purchase!
    `;

    const blob = new Blob([receipt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${order.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-900/95 backdrop-blur-md rounded-xl border border-dark-700/50 max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-700/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Order Confirmed!</h2>
              <p className="text-sm text-dark-400">Your payment was successful</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-dark-400 hover:text-white hover:bg-dark-800/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Order Details */}
        <div className="p-6 space-y-6">
          {/* Order Summary */}
          <div className="bg-dark-800/50 rounded-lg p-4 border border-dark-700/50">
            <h3 className="font-semibold text-white mb-3">Order Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-dark-400">Order ID:</span>
                <span className="text-white font-mono">{order.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-400">Date:</span>
                <span className="text-white">{new Date(order.timestamp).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-400">Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  order.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                  order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Items */}
          <div>
            <h3 className="font-semibold text-white mb-3">Items Purchased</h3>
            <div className="space-y-2">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-dark-800/50 rounded-lg border border-dark-700/50">
                  <div>
                    <p className="text-white font-medium">{item.name}</p>
                    <p className="text-sm text-dark-400">Quantity: {item.quantity}</p>
                  </div>
                  <p className="text-white font-semibold">${(item.price * item.quantity).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="border-t border-dark-700/50 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-white">Total Amount:</span>
              <span className="text-2xl font-bold text-primary-400">${order.total.toLocaleString()}</span>
            </div>
          </div>

          {/* Transaction Details */}
          <div className="bg-dark-800/50 rounded-lg p-4 border border-dark-700/50">
            <h3 className="font-semibold text-white mb-3">Transaction Details</h3>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-dark-400">Transaction Hash:</span>
                  <button
                    onClick={() => copyToClipboard(order.txHash, 'Transaction hash')}
                    className="p-1 text-dark-400 hover:text-white hover:bg-dark-700/50 rounded transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-xs text-white font-mono bg-dark-700/50 p-2 rounded break-all">
                  {order.txHash}
                </p>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-dark-400">Agreement ID:</span>
                  <button
                    onClick={() => copyToClipboard(order.agreementId, 'Agreement ID')}
                    className="p-1 text-dark-400 hover:text-white hover:bg-dark-700/50 rounded transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-xs text-white font-mono bg-dark-700/50 p-2 rounded break-all">
                  {order.agreementId}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={downloadReceipt}
              className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download Receipt</span>
            </button>
            
            <button
              onClick={() => window.open(`https://explorer-holesky.morphl2.io/tx/${order.txHash}`, '_blank')}
              className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 bg-dark-700 text-white rounded-lg hover:bg-dark-600 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>View on Explorer</span>
            </button>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full py-3 px-4 bg-dark-800 text-white rounded-lg hover:bg-dark-700 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}; 