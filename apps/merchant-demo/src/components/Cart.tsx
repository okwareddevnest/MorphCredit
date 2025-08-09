import React from 'react';
import { X, Minus, Plus, Trash2 } from 'lucide-react';
import { MorphCreditButton } from '@morphcredit/merchant-sdk';
import type { TxResult } from '@morphcredit/merchant-sdk';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  rating: number;
  reviews: number;
  category: string;
  inStock: boolean;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onRemoveItem: (productId: number) => void;
  onClose: () => void;
  onCheckout: (orderData: any) => void;
  totalPrice: number;
}

export const Cart: React.FC<CartProps> = ({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClose,
  onCheckout,
  totalPrice
}) => {
  const handleSuccess = (result: TxResult) => {
    const orderData = {
      id: `order-${Date.now()}`,
      items: items.map(item => ({
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity
      })),
      total: totalPrice,
      txHash: result.txHash,
      agreementId: result.agreementId,
      status: 'confirmed' as const,
      timestamp: Date.now()
    };
    onCheckout(orderData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-900/95 backdrop-blur-md rounded-xl border border-dark-700/50 max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-700/50">
          <h2 className="text-xl font-semibold text-white">Shopping Cart</h2>
          <button
            onClick={onClose}
            className="p-2 text-dark-400 hover:text-white hover:bg-dark-800/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-dark-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-dark-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Your cart is empty</h3>
              <p className="text-dark-400">Add some products to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.product.id} className="flex items-center space-x-4 p-4 bg-dark-800/50 rounded-lg border border-dark-700/50">
                  {/* Product Image */}
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  
                  {/* Product Info */}
                  <div className="flex-1">
                    <h3 className="font-medium text-white">{item.product.name}</h3>
                    <p className="text-sm text-dark-400">${item.product.price.toLocaleString()}</p>
                  </div>
                  
                  {/* Quantity Controls */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                      className="p-1 text-dark-400 hover:text-white hover:bg-dark-700/50 rounded transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center text-white font-medium">{item.quantity}</span>
                    <button
                      onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                      className="p-1 text-dark-400 hover:text-white hover:bg-dark-700/50 rounded transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Price */}
                  <div className="text-right">
                    <p className="font-semibold text-white">
                      ${(item.product.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                  
                  {/* Remove Button */}
                  <button
                    onClick={() => onRemoveItem(item.product.id)}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-6 border-t border-dark-700/50 bg-dark-800/30">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-semibold text-white">Total:</span>
              <span className="text-2xl font-bold text-primary-400">
                ${totalPrice.toLocaleString()}
              </span>
            </div>
            
            <div className="space-y-3">
              {/* MorphCredit Button */}
              <MorphCreditButton
                amount={totalPrice}
                onSuccess={handleSuccess}
                onError={(error) => {
                  console.error('Payment failed:', error);
                }}
                onOffersLoaded={(offers) => {
                  console.log('Offers loaded:', offers);
                }}
                onWalletConnect={(address) => {
                  console.log('Wallet connected:', address);
                }}
                className="w-full"
                variant="primary"
                size="lg"
                showOffers={true}
              >
                {`Pay $${totalPrice.toLocaleString()} with MorphCredit`}
              </MorphCreditButton>
              
              <button
                onClick={onClose}
                className="w-full py-3 px-4 bg-dark-700 text-white rounded-lg hover:bg-dark-600 transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 