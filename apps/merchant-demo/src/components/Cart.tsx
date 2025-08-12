import React from 'react';
import { X, Minus, Plus, Trash2 } from 'lucide-react';
import { ethers } from 'ethers';
import { MorphCreditSDK } from 'morphcredit-merchant-sdk';
import type { TxResult } from 'morphcredit-merchant-sdk';

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
  const [isPaying, setIsPaying] = React.useState(false);
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

  const handleQuickPay = async () => {
    try {
      if (isPaying) return;
      setIsPaying(true);
      const sdk = new MorphCreditSDK({
        contracts: {
          scoreOracle: '0xd9Dc385246308FfBEBdEAc210F4c6B2E26Eb096d',
          creditRegistry: '0x62179b92bD09Bfc6699646F3394A6595c1E12BB2',
          lendingPool: '0x22D194Bb22f66731421C5F93163a7DFC05D2Ed5f',
          bnplFactory: '0x50e43053510E8f25280d335F5c7F30b15CF13965',
        }
      }, { enableLogging: true });
      const address = await sdk.connectWallet();
      // Ensure correct chain and active account (helps Brave/MetaMask surface the prompt)
      const eth = (window as any).ethereum;
      if (eth?.request) {
        try {
          await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0xAFA' }] });
        } catch (e: any) {
          // Add chain if missing
          if (e?.code === 4902) {
            await eth.request({
              method: 'wallet_addEthereumChain',
              params: [{ chainId: '0xAFA', chainName: 'Morph Holesky', rpcUrls: ['https://rpc-holesky.morphl2.io'] }]
            });
          }
        }
        await eth.request({ method: 'eth_requestAccounts' });
      }
      const offers = await sdk.getOffers({ address, amount: totalPrice });
      if (!offers.length) throw new Error('No offers available');
      // Pre-check factory readiness and role to avoid opaque RPC errors
      try {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const facAddr = '0x50e43053510E8f25280d335F5c7F30b15CF13965';
        const reader = new ethers.Contract(
          facAddr,
          [
            'function FACTORY_ROLE() view returns (bytes32)',
            'function hasRole(bytes32,address) view returns (bool)',
            'function getImplementation() view returns (address)'
          ],
          provider
        );
        const role = await reader.FACTORY_ROLE();
        const [impl, hasRole] = await Promise.all([
          reader.getImplementation().catch(() => ethers.ZeroAddress),
          reader.hasRole(role, address).catch(() => false),
        ]);
        if (impl === ethers.ZeroAddress) {
          alert('BNPLFactory proxy is not initialized (implementation not set).');
          setIsPaying(false);
          return;
        }
        if (!hasRole) {
          const confirm = window.confirm('This wallet is not authorized (FACTORY_ROLE missing). Grant role now?');
          if (!confirm) {
            setIsPaying(false);
            return;
          }
          const base = (window as any).__MORPHCREDIT_SCORING_URL__ || 'https://morphcredit.onrender.com';
          const resp = await fetch(`${base.replace(/\/$/, '')}/admin/grant-factory-role`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address }),
          });
          const json = await resp.json().catch(() => ({} as any));
          if (!resp.ok || !json?.success) {
            alert(json?.error || 'Failed to grant merchant role.');
            setIsPaying(false);
            return;
          }
          // brief delay then re-check
          await new Promise((r) => setTimeout(r, 1500));
          const updated = await reader.hasRole(role, address).catch(() => false);
          if (!updated) {
            alert('Role grant did not confirm yet. Please try again in a few seconds.');
            setIsPaying(false);
            return;
          }
        }
      } catch {}
      sdk.updateConfig({
        contracts: {
          scoreOracle: '0xd9Dc385246308FfBEBdEAc210F4c6B2E26Eb096d',
          creditRegistry: '0x62179b92bD09Bfc6699646F3394A6595c1E12BB2',
          lendingPool: '0x22D194Bb22f66731421C5F93163a7DFC05D2Ed5f',
          bnplFactory: '0x50e43053510E8f25280d335F5c7F30b15CF13965',
        },
        gasLimit: 2_500_000,
      });
      sdk.updateOptions?.({ skipRoleCheck: true, enableLogging: true } as any);

      // Demo Mode: short-circuit to simulated agreement
      if ((window as any).VITE_MORPHCREDIT_DEMO_MODE || (import.meta as any).env?.VITE_MORPHCREDIT_DEMO_MODE) {
        // fake tx/agreement ids
        const randHex = (n: number) => '0x' + Array.from(crypto.getRandomValues(new Uint8Array(n))).map(b => b.toString(16).padStart(2,'0')).join('');
        const txHash = randHex(32);
        const agreementId = randHex(20);
        // persist a realistic agreement snapshot for borrower UI
        const now = Math.floor(Date.now()/1000);
        const installments = 4;
        const per = Math.floor((totalPrice * 1e6) / installments);
        const demo = {
          id: agreementId,
          agreement: {
            principal: BigInt(totalPrice * 1e6),
            borrower: address,
            merchant: address,
            installments,
            installmentAmount: BigInt(per),
            apr: 1000,
            penaltyRate: 1000,
            dueDates: Array.from({ length: installments }, (_, i) => now + (i+1) * 14 * 24 * 3600),
            status: 1,
            paidInstallments: 0,
            lastPaymentDate: now,
            gracePeriod: 5 * 24 * 3600,
            writeOffPeriod: 60 * 24 * 3600,
          },
          installments: Array.from({ length: installments }, (_, i) => ({
            id: i,
            amount: BigInt(per),
            dueDate: now + (i+1) * 14 * 24 * 3600,
            isPaid: false,
            paidAt: 0,
            penaltyAccrued: 0,
          }))
        };
        const key = `mc_demo_agreements_${address.toLowerCase()}`;
        const list = JSON.parse(localStorage.getItem(key) || '[]');
        list.push(demo);
        const replacer = (_k: string, v: any) => typeof v === 'bigint' ? v.toString() : v;
        localStorage.setItem(key, JSON.stringify(list, replacer));
        await new Promise((r) => setTimeout(r, 1400));
        handleSuccess({ txHash, agreementId, success: true, blockNumber: 0, gasUsed: 0n as any, gasPrice: 0n as any } as unknown as TxResult);
        return;
      }

      // Live path: no preflight simulation/estimation
      let result: TxResult;
      try {
        result = await sdk.createAgreement(offers[0].id);
      } catch (err: any) {
        if (err?.code === -32002) {
          alert('Please open your wallet (extension) to approve the transaction, then try again.');
        }
        throw err;
      }
      handleSuccess(result);
    } catch (e) {
      console.error('Payment failed:', e);
      alert((e as any)?.message || 'Payment failed');
    } finally {
      setIsPaying(false);
    }
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
              <button
                onClick={handleQuickPay}
                disabled={isPaying}
                className="w-full py-3 px-4 rounded-lg bg-primary-600 hover:bg-primary-500 text-white disabled:opacity-60"
              >
                {isPaying ? 'Processing…' : `Pay $${totalPrice.toLocaleString()} with MorphCredit`}
              </button>
              
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