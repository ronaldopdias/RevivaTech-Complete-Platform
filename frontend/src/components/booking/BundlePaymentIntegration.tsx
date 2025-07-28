'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  CreditCard, 
  Package, 
  CheckCircle, 
  AlertCircle, 
  Percent, 
  Clock,
  Shield,
  Star,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { BundleSuggestion, calculateBundleSavings } from '@/lib/data/service-bundling';
import { getServiceInfo } from '@/lib/data/service-bundling';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface PaymentData {
  selectedServices: string[];
  bundleSuggestions: BundleSuggestion[];
  appliedBundles: string[];
  totalPrice: number;
  originalPrice: number;
  discounts: {
    student: boolean;
    blueLightCard: boolean;
  };
}

interface BundlePaymentIntegrationProps {
  paymentData: PaymentData;
  onPaymentSuccess: (paymentId: string, bundleData: any) => void;
  onPaymentError: (error: string) => void;
  className?: string;
}

const PaymentForm: React.FC<{
  paymentData: PaymentData;
  onPaymentSuccess: (paymentId: string, bundleData: any) => void;
  onPaymentError: (error: string) => void;
}> = ({ paymentData, onPaymentSuccess, onPaymentError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  const handlePayment = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      onPaymentError('Stripe has not loaded yet.');
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('processing');

    try {
      // Create payment intent with bundle data
      const response = await fetch('/api/payments/create-bundle-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(paymentData.totalPrice * 100), // Convert to cents
          currency: 'gbp',
          services: paymentData.selectedServices,
          bundles: paymentData.appliedBundles,
          originalAmount: Math.round(paymentData.originalPrice * 100),
          bundleSavings: Math.round((paymentData.originalPrice - paymentData.totalPrice) * 100),
          discounts: paymentData.discounts,
          metadata: {
            serviceCount: paymentData.selectedServices.length.toString(),
            bundleCount: paymentData.appliedBundles.length.toString(),
            totalSavings: (paymentData.originalPrice - paymentData.totalPrice).toFixed(2),
          }
        })
      });

      const { clientSecret, error } = await response.json();

      if (error) {
        throw new Error(error);
      }

      // Confirm payment
      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/booking/payment-success`,
        },
        redirect: 'if_required'
      });

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        setPaymentStatus('success');
        onPaymentSuccess(paymentIntent.id, {
          services: paymentData.selectedServices,
          bundles: paymentData.appliedBundles,
          totalPaid: paymentData.totalPrice,
          savings: paymentData.originalPrice - paymentData.totalPrice
        });
      }
    } catch (error) {
      setPaymentStatus('error');
      onPaymentError(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handlePayment} className="space-y-6">
      <div className="p-4 bg-gray-50 rounded-lg border">
        <PaymentElement 
          options={{
            layout: 'tabs',
            paymentMethodOrder: ['card', 'apple_pay', 'google_pay']
          }}
        />
      </div>

      <button
        type="submit"
        disabled={!stripe || isProcessing || paymentStatus === 'success'}
        className={cn(
          "w-full flex items-center justify-center space-x-2 py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-300",
          paymentStatus === 'success' 
            ? "bg-green-500 text-white cursor-not-allowed"
            : isProcessing
            ? "bg-gray-400 text-white cursor-not-allowed"
            : "bg-gradient-to-r from-trust-500 to-professional-500 text-white hover:from-trust-600 hover:to-professional-600 shadow-lg hover:shadow-xl"
        )}
      >
        {paymentStatus === 'success' ? (
          <>
            <CheckCircle className="w-5 h-5" />
            <span>Payment Successful!</span>
          </>
        ) : isProcessing ? (
          <>
            <Clock className="w-5 h-5 animate-spin" />
            <span>Processing Payment...</span>
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            <span>Pay £{paymentData.totalPrice.toFixed(2)}</span>
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>

      {paymentStatus === 'success' && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="font-medium text-green-800">
              Payment processed successfully with bundle savings applied!
            </span>
          </div>
        </div>
      )}
    </form>
  );
};

const BundlePaymentIntegration: React.FC<BundlePaymentIntegrationProps> = ({
  paymentData,
  onPaymentSuccess,
  onPaymentError,
  className
}) => {
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  // Calculate savings breakdown
  const savingsBreakdown = useMemo(() => {
    const bundleSavings = paymentData.appliedBundles.reduce((total, bundleId) => {
      const suggestion = paymentData.bundleSuggestions.find(s => s.bundle.id === bundleId);
      if (suggestion) {
        return total + calculateBundleSavings(suggestion.bundle.services);
      }
      return total;
    }, 0);

    const discountSavings = paymentData.discounts.student || paymentData.discounts.blueLightCard
      ? paymentData.originalPrice * 0.15
      : 0;

    return {
      bundleSavings,
      discountSavings,
      totalSavings: paymentData.originalPrice - paymentData.totalPrice
    };
  }, [paymentData]);

  // Get applied bundle details
  const appliedBundleDetails = useMemo(() => {
    return paymentData.appliedBundles.map(bundleId => {
      const suggestion = paymentData.bundleSuggestions.find(s => s.bundle.id === bundleId);
      return suggestion?.bundle;
    }).filter(Boolean);
  }, [paymentData.appliedBundles, paymentData.bundleSuggestions]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Payment Summary Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2">
          <Package className="w-6 h-6 text-professional-600" />
          <h3 className="text-2xl font-bold text-gray-900">
            Payment Summary
          </h3>
        </div>
        <p className="text-gray-600">
          Review your service bundle and complete payment
        </p>
      </div>

      {/* Bundle Savings Highlight */}
      {savingsBreakdown.totalSavings > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-700 mb-2">
              £{savingsBreakdown.totalSavings.toFixed(2)} Saved
            </div>
            <div className="text-green-600 font-medium mb-4">
              {((savingsBreakdown.totalSavings / paymentData.originalPrice) * 100).toFixed(0)}% off original price
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              {savingsBreakdown.bundleSavings > 0 && (
                <div className="bg-white rounded-lg p-3">
                  <div className="font-medium text-gray-900">Bundle Savings</div>
                  <div className="text-green-600">£{savingsBreakdown.bundleSavings.toFixed(2)}</div>
                </div>
              )}
              {savingsBreakdown.discountSavings > 0 && (
                <div className="bg-white rounded-lg p-3">
                  <div className="font-medium text-gray-900">Student/Blue Light</div>
                  <div className="text-green-600">£{savingsBreakdown.discountSavings.toFixed(2)}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Applied Bundles */}
      {appliedBundleDetails.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Star className="w-5 h-5 text-professional-600" />
            <span>Applied Service Bundles ({appliedBundleDetails.length})</span>
          </h4>
          
          <div className="space-y-3">
            {appliedBundleDetails.map((bundle, index) => {
              if (!bundle) return null;
              
              return (
                <div key={index} className="p-4 bg-professional-50 border border-professional-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-professional-800">{bundle.name}</div>
                    <div className="text-professional-600 text-sm">
                      {bundle.services.length} services
                    </div>
                  </div>
                  <div className="text-sm text-professional-700 mb-2">{bundle.description}</div>
                  <div className="text-xs text-professional-600">{bundle.commonUseCase}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Service Breakdown */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Service Breakdown</h4>
        
        <div className="space-y-3">
          {paymentData.selectedServices.map((serviceId) => {
            const service = getServiceInfo(serviceId);
            if (!service) return null;
            
            return (
              <div key={serviceId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{service.name}</div>
                  <div className="text-sm text-gray-600">Band {service.band} • {service.difficulty} difficulty</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">£{service.basePrice}</div>
                  <div className="text-xs text-gray-600">Fixed fee</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pricing Summary */}
      <div className="bg-gradient-to-r from-gray-50 to-professional-50 border border-gray-200 rounded-xl p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Pricing Summary</h4>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Original Price ({paymentData.selectedServices.length} services)</span>
            <span className="font-medium">£{paymentData.originalPrice.toFixed(2)}</span>
          </div>
          
          {savingsBreakdown.bundleSavings > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Bundle Savings</span>
              <span>-£{savingsBreakdown.bundleSavings.toFixed(2)}</span>
            </div>
          )}
          
          {savingsBreakdown.discountSavings > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount (15%)</span>
              <span>-£{savingsBreakdown.discountSavings.toFixed(2)}</span>
            </div>
          )}
          
          <div className="border-t pt-3">
            <div className="flex justify-between text-xl font-bold">
              <span>Total to Pay</span>
              <span className="text-professional-600">£{paymentData.totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <Shield className="w-8 h-8 text-green-600" />
          <div>
            <div className="font-medium text-green-800">Secure Payment</div>
            <div className="text-sm text-green-600">256-bit SSL encryption</div>
          </div>
        </div>
        <div className="flex items-center space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <CheckCircle className="w-8 h-8 text-blue-600" />
          <div>
            <div className="font-medium text-blue-800">No Hidden Fees</div>
            <div className="text-sm text-blue-600">Fixed pricing guarantee</div>
          </div>
        </div>
        <div className="flex items-center space-x-3 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <Star className="w-8 h-8 text-purple-600" />
          <div>
            <div className="font-medium text-purple-800">1 Year Guarantee</div>
            <div className="text-sm text-purple-600">Full warranty included</div>
          </div>
        </div>
      </div>

      {/* Payment Form */}
      {!showPaymentForm ? (
        <button
          onClick={() => setShowPaymentForm(true)}
          className="w-full bg-gradient-to-r from-trust-500 to-professional-500 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-trust-600 hover:to-professional-600 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
        >
          <CreditCard className="w-5 h-5" />
          <span>Proceed to Payment</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-professional-600" />
            <span>Payment Details</span>
          </h4>
          
          <Elements stripe={stripePromise}>
            <PaymentForm
              paymentData={paymentData}
              onPaymentSuccess={onPaymentSuccess}
              onPaymentError={onPaymentError}
            />
          </Elements>
        </div>
      )}
    </div>
  );
};

export default BundlePaymentIntegration;