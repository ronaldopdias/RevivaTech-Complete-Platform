'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils';
import { StripePaymentForm } from './StripePaymentForm';
import { PayPalPaymentForm } from './PayPalPaymentForm';

interface PaymentGatewayProps {
  bookingId: string;
  amount: number;
  currency?: string;
  customerId?: string;
  onPaymentSuccess: (details: any, method: 'stripe' | 'paypal') => void;
  onPaymentError: (error: string, method: 'stripe' | 'paypal') => void;
  allowedMethods?: ('stripe' | 'paypal')[];
  className?: string;
  useRealPayments?: boolean;
}

type PaymentMethod = 'stripe' | 'paypal';

export function PaymentGateway({
  bookingId,
  amount,
  currency = 'GBP',
  customerId,
  onPaymentSuccess,
  onPaymentError,
  allowedMethods = ['stripe', 'paypal'],
  className = '',
  useRealPayments = process.env.ENABLE_REAL_PAYMENTS === 'true'
}: PaymentGatewayProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(allowedMethods[0]);
  const [processing, setProcessing] = useState(false);

  const handlePaymentSuccess = (details: any) => {
    setProcessing(false);
    onPaymentSuccess(details, selectedMethod);
  };

  const handlePaymentError = (error: string) => {
    setProcessing(false);
    onPaymentError(error, selectedMethod);
  };

  const paymentMethods = [
    {
      id: 'stripe' as const,
      name: 'Credit/Debit Card',
      description: 'Visa, Mastercard, American Express',
      icon: '💳',
      color: 'bg-blue-500',
      features: ['Instant processing', 'Save card for future', '3D Secure']
    },
    {
      id: 'paypal' as const,
      name: 'PayPal',
      description: 'Pay with your PayPal account',
      icon: '🟦',
      color: 'bg-blue-600',
      features: ['Buyer protection', 'No card details needed', 'Express checkout']
    }
  ].filter(method => allowedMethods.includes(method.id));

  const handleMockPayment = async () => {
    setProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      const mockDetails = {
        transactionId: `mock_${Date.now()}`,
        paymentMethodType: selectedMethod,
        amount,
        currency,
        status: 'completed'
      };
      
      handlePaymentSuccess(mockDetails);
    }, 2000);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <Card className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Payment Details</h3>
          <div className="text-2xl font-bold text-primary">
            {formatPrice(amount, currency)}
          </div>
          <p className="text-muted-foreground">
            Booking ID: {bookingId}
          </p>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium">Select Payment Method</h4>
          
          <div className="grid gap-3">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                type="button"
                className={`p-4 border rounded-lg text-left transition-colors ${
                  selectedMethod === method.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedMethod(method.id)}
              >
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">{method.icon}</div>
                  <div className="flex-1">
                    <div className="font-medium">{method.name}</div>
                    <div className="text-sm text-muted-foreground mb-2">
                      {method.description}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {method.features.map((feature, index) => (
                        <span
                          key={index}
                          className="text-xs bg-muted px-2 py-1 rounded"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="w-4 h-4 border rounded-full flex items-center justify-center">
                    {selectedMethod === method.id && (
                      <div className="w-2 h-2 bg-primary rounded-full" />
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-6 border-t">
          {!useRealPayments && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-amber-600">⚠️</span>
                <div className="text-sm text-amber-700">
                  <strong>Demo Mode:</strong> This is a mock payment gateway for testing. 
                  No real payment will be processed.
                </div>
              </div>
            </div>
          )}

          {useRealPayments ? (
            <div className="space-y-4">
              {selectedMethod === 'stripe' && (
                <StripePaymentForm
                  bookingId={bookingId}
                  amount={amount * 100} // Convert to pence for Stripe
                  currency={currency.toLowerCase()}
                  customerId={customerId}
                  onPaymentSuccess={handlePaymentSuccess}
                  onPaymentError={handlePaymentError}
                />
              )}
              {selectedMethod === 'paypal' && (
                <PayPalPaymentForm
                  bookingId={bookingId}
                  amount={amount}
                  currency={currency}
                  onPaymentSuccess={handlePaymentSuccess}
                  onPaymentError={handlePaymentError}
                />
              )}
            </div>
          ) : (
            <Button
              onClick={handleMockPayment}
              disabled={processing}
              size="lg"
              className="w-full"
            >
              {processing ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing Payment...</span>
                </div>
              ) : (
                `Pay ${formatPrice(amount, currency)}`
              )}
            </Button>
          )}

          <p className="text-xs text-muted-foreground text-center mt-2">
            Secure payment processing • SSL encrypted
          </p>
        </div>
      </Card>
    </div>
  );
}

// Quick payment options component for demo/testing
export function QuickPaymentOptions({ onPaymentSelect, amount, currency = 'GBP' }: {
  onPaymentSelect: (method: 'stripe' | 'paypal') => void;
  amount: number;
  currency?: string;
}) {
  return (
    <div className="space-y-2">
      <h4 className="font-medium">Quick Payment</h4>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPaymentSelect('stripe')}
        >
          💳 Card ({formatPrice(amount, currency)})
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPaymentSelect('paypal')}
        >
          🟦 PayPal ({formatPrice(amount, currency)})
        </Button>
      </div>
    </div>
  );
}

export default PaymentGateway;