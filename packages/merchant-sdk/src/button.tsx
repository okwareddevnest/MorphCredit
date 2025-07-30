import React, { useState, useEffect, useCallback } from 'react';
import type {
  MorphCreditButtonProps,
  Offer,
  TxResult,
  MorphCreditError
} from './types';
import { MorphCreditSDK } from './index';

const MorphCreditButton: React.FC<MorphCreditButtonProps> = ({
  amount,
  userAddress,
  onSuccess,
  onError,
  onOffersLoaded,
  onWalletConnect,
  disabled = false,
  className = '',
  style,
  children = 'Pay with MorphCredit',
  variant = 'primary',
  size = 'md',
  loading = false,
  showOffers = false
}) => {
  const [sdk] = useState(() => new MorphCreditSDK({}, { enableLogging: true }));
  const [isConnecting, setIsConnecting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [, setSelectedOffer] = useState<Offer | null>(null);
  const [showOfferSelector, setShowOfferSelector] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(userAddress || null);

  // Initialize SDK event listeners
  useEffect(() => {
    sdk.onOffersLoaded((loadedOffers: Offer[]) => {
      setOffers(loadedOffers);
      onOffersLoaded?.(loadedOffers);
    });

    sdk.onAgreementCreated((result: TxResult) => {
      setIsProcessing(false);
      onSuccess?.(result);
    });

    sdk.setErrorHandler((error: MorphCreditError) => {
      setIsConnecting(false);
      setIsProcessing(false);
      onError?.(error);
    });

    return () => {
      sdk.disconnectWallet();
    };
  }, [sdk, onOffersLoaded, onSuccess, onError]);

  // Update wallet address when userAddress prop changes
  useEffect(() => {
    setWalletAddress(userAddress || null);
  }, [userAddress]);

  const connectWallet = useCallback(async () => {
    try {
      setIsConnecting(true);
      const address = await sdk.connectWallet();
      setWalletAddress(address);
      onWalletConnect?.(address);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      onError?.(error as MorphCreditError);
    } finally {
      setIsConnecting(false);
    }
  }, [sdk, onWalletConnect, onError]);

  const handleClick = useCallback(async () => {
    if (disabled || loading || isConnecting || isProcessing) {
      return;
    }

    try {
      // If no wallet connected, connect first
      if (!walletAddress) {
        await connectWallet();
        return;
      }

      // Get offers for the user
      const userOffers = await sdk.getOffers({
        address: walletAddress,
        amount,
        includeFeatures: true
      });

      if (userOffers.length === 0) {
        throw new Error('No offers available for this amount');
      }

      if (showOffers && userOffers.length > 1) {
        setOffers(userOffers);
        setShowOfferSelector(true);
      } else {
        // Auto-select first offer
        const firstOffer = userOffers[0];
        await createAgreement(firstOffer.id);
      }
    } catch (error) {
      console.error('Error in button click:', error);
      onError?.(error as MorphCreditError);
    }
  }, [
    disabled,
    loading,
    isConnecting,
    isProcessing,
    walletAddress,
    amount,
    showOffers,
    sdk,
    connectWallet,
    onError
  ]);

  const createAgreement = useCallback(async (offerId: string) => {
    try {
      setIsProcessing(true);
      setShowOfferSelector(false);
      await sdk.createAgreement(offerId);
    } catch (error) {
      console.error('Failed to create agreement:', error);
      onError?.(error as MorphCreditError);
    }
  }, [sdk, onError]);

  const handleOfferSelect = useCallback((offer: Offer) => {
    setSelectedOffer(offer);
    createAgreement(offer.id);
  }, [createAgreement]);

  // Generate CSS classes
  const getButtonClasses = () => {
    const baseClasses = 'morphcredit-button';
    const variantClasses = {
      primary: 'morphcredit-button--primary',
      secondary: 'morphcredit-button--secondary',
      outline: 'morphcredit-button--outline'
    };
    const sizeClasses = {
      sm: 'morphcredit-button--sm',
      md: 'morphcredit-button--md',
      lg: 'morphcredit-button--lg'
    };
    const stateClasses = {
      disabled: disabled || loading || isConnecting || isProcessing ? 'morphcredit-button--disabled' : '',
      loading: loading || isConnecting || isProcessing ? 'morphcredit-button--loading' : ''
    };

    return [
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      stateClasses.disabled,
      stateClasses.loading,
      className
    ].filter(Boolean).join(' ');
  };

  // Generate button content
  const getButtonContent = () => {
    if (loading || isConnecting) {
      return (
        <>
          <span className="morphcredit-button__spinner"></span>
          {isConnecting ? 'Connecting...' : 'Loading...'}
        </>
      );
    }
    if (isProcessing) {
      return (
        <>
          <span className="morphcredit-button__spinner"></span>
          Processing...
        </>
      );
    }
    return children;
  };

  return (
    <>
      <button
        className={getButtonClasses()}
        style={style}
        onClick={handleClick}
        disabled={disabled || loading || isConnecting || isProcessing}
        type="button"
      >
        {getButtonContent()}
      </button>

      {/* Offer Selector Modal */}
      {showOfferSelector && offers.length > 0 && (
        <div className="morphcredit-offer-selector">
          <div className="morphcredit-offer-selector__overlay" onClick={() => setShowOfferSelector(false)} />
          <div className="morphcredit-offer-selector__modal">
            <div className="morphcredit-offer-selector__header">
              <h3>Choose Your Payment Plan</h3>
              <button
                className="morphcredit-offer-selector__close"
                onClick={() => setShowOfferSelector(false)}
              >
                ×
              </button>
            </div>
            <div className="morphcredit-offer-selector__content">
              {offers.map((offer) => (
                <div
                  key={offer.id}
                  className="morphcredit-offer-option"
                  onClick={() => handleOfferSelect(offer)}
                >
                  <div className="morphcredit-offer-option__header">
                    <h4>Tier {offer.tier} Plan</h4>
                    <span className="morphcredit-offer-option__apr">
                      {(offer.apr * 100).toFixed(1)}% APR
                    </span>
                  </div>
                  <div className="morphcredit-offer-option__details">
                    <p>
                      {offer.installments} payments of $
                      {(Number(offer.installmentAmount) / 1e6).toFixed(2)}
                    </p>
                    <p className="morphcredit-offer-option__total">
                      Total: ${(Number(offer.totalCost) / 1e6).toFixed(2)}
                    </p>
                  </div>
                  {offer.features && (
                    <div className="morphcredit-offer-option__features">
                      {offer.features.noLateFees && (
                        <span className="morphcredit-offer-option__feature">No Late Fees</span>
                      )}
                      {offer.features.earlyPayoff && (
                        <span className="morphcredit-offer-option__feature">Early Payoff</span>
                      )}
                      {offer.features.autoRepay && (
                        <span className="morphcredit-offer-option__feature">Auto Repay</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Default Styles */}
      <style>{`
        .morphcredit-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: none;
          border-radius: 8px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          position: relative;
          overflow: hidden;
        }

        .morphcredit-button:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .morphcredit-button--primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .morphcredit-button--primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
        }

        .morphcredit-button--secondary {
          background: #f8f9fa;
          color: #495057;
          border: 2px solid #dee2e6;
        }

        .morphcredit-button--secondary:hover:not(:disabled) {
          background: #e9ecef;
          border-color: #adb5bd;
        }

        .morphcredit-button--outline {
          background: transparent;
          color: #667eea;
          border: 2px solid #667eea;
        }

        .morphcredit-button--outline:hover:not(:disabled) {
          background: #667eea;
          color: white;
        }

        .morphcredit-button--sm {
          padding: 8px 16px;
          font-size: 14px;
          min-height: 36px;
        }

        .morphcredit-button--md {
          padding: 12px 24px;
          font-size: 16px;
          min-height: 44px;
        }

        .morphcredit-button--lg {
          padding: 16px 32px;
          font-size: 18px;
          min-height: 52px;
        }

        .morphcredit-button__spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .morphcredit-offer-selector {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .morphcredit-offer-selector__overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
        }

        .morphcredit-offer-selector__modal {
          position: relative;
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          max-width: 500px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
        }

        .morphcredit-offer-selector__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px;
          border-bottom: 1px solid #e9ecef;
        }

        .morphcredit-offer-selector__header h3 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          color: #212529;
        }

        .morphcredit-offer-selector__close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #6c757d;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background-color 0.2s;
        }

        .morphcredit-offer-selector__close:hover {
          background: #f8f9fa;
        }

        .morphcredit-offer-selector__content {
          padding: 24px;
        }

        .morphcredit-offer-option {
          border: 2px solid #e9ecef;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .morphcredit-offer-option:hover {
          border-color: #667eea;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
        }

        .morphcredit-offer-option__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .morphcredit-offer-option__header h4 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #212529;
        }

        .morphcredit-offer-option__apr {
          background: #e3f2fd;
          color: #1976d2;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }

        .morphcredit-offer-option__details {
          margin-bottom: 12px;
        }

        .morphcredit-offer-option__details p {
          margin: 4px 0;
          color: #495057;
        }

        .morphcredit-offer-option__total {
          font-weight: 600;
          color: #212529 !important;
        }

        .morphcredit-offer-option__features {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .morphcredit-offer-option__feature {
          background: #f8f9fa;
          color: #6c757d;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }
      `}</style>
    </>
  );
};

export default MorphCreditButton; 