'use client';

import React, { useState, useEffect } from 'react';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
  PaymentElement
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

// Load Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentFormProps {
  bookingId: string;
  amount: number;
  currency?: string;
  customerId?: string;
  onPaymentSuccess: (paymentIntent: any) => void;
  onPaymentError: (error: string) => void;
  savePaymentMethod?: boolean;
}

interface StripePaymentFormProps extends PaymentFormProps {
  className?: string;
}

// Main component that wraps the payment form with Stripe Elements
export function StripePaymentForm({ 
  bookingId, 
  amount, 
  currency = 'gbp',
  customerId,
  onPaymentSuccess,
  onPaymentError,
  savePaymentMethod = false,
  className = '' 
}: StripePaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Create payment intent when component mounts
  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/payments/stripe/payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bookingId,
            amount,
            currency,
            customerId,
            savePaymentMethod
          }),
        });

        const data = await response.json();

        if (response.ok) {
          setClientSecret(data.paymentIntent.client_secret);
        } else {
          onPaymentError(data.error || 'Failed to create payment intent');
        }
      } catch (error) {
        onPaymentError('Network error occurred');
      } finally {
        setLoading(false);
      }
    };

    createPaymentIntent();
  }, [bookingId, amount, currency, customerId, savePaymentMethod, onPaymentError]);

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="ml-3 text-muted-foreground">Setting up payment...</span>
        </div>
      </Card>
    );
  }

  if (!clientSecret) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center py-8">
          <Icon name="alert-circle" className="w-12 h-12 mx-auto text-red-500 mb-4" />
          <h3 className="text-lg font-medium mb-2">Payment Setup Failed</h3>
          <p className="text-muted-foreground">
            Unable to initialize payment. Please try again or contact support.
          </p>
        </div>
      </Card>
    );
  }

  const appearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#0066cc',
      colorBackground: '#ffffff',
      colorText: '#1a1a1a',
      colorDanger: '#df1b41',
      fontFamily: 'Inter, sans-serif',
      spacingUnit: '4px',
      borderRadius: '8px',
    },
  };

  const options = {
    clientSecret,
    appearance,
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentForm
        bookingId={bookingId}
        amount={amount}
        currency={currency}
        onPaymentSuccess={onPaymentSuccess}
        onPaymentError={onPaymentError}
        savePaymentMethod={savePaymentMethod}
        className={className}
      />
    </Elements>
  );
}

// Payment form component that uses Stripe hooks
function PaymentForm({
  bookingId,
  amount,
  currency,
  onPaymentSuccess,
  onPaymentError,
  savePaymentMethod,
  className
}: PaymentFormProps & { className?: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<string>('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setMessage('');

    try {
      // Confirm payment
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/booking/payment-success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        onPaymentError(error.message || 'Payment failed');
        setMessage(error.message || 'Payment failed');
      } else if (paymentIntent) {
        if (paymentIntent.status === 'succeeded') {
          onPaymentSuccess(paymentIntent);
        } else {
          setMessage(`Payment ${paymentIntent.status}`);
        }
      }
    } catch (error) {
      onPaymentError('An unexpected error occurred');
      setMessage('An unexpected error occurred');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Payment Details</h3>
        <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
          <span className="text-sm font-medium">Total Amount:</span>
          <span className="text-lg font-bold text-primary">
            £{amount.toFixed(2)} {currency.toUpperCase()}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Payment Element */}
        <div className="p-4 border rounded-lg">
          <PaymentElement
            options={{
              layout: 'tabs',
            }}
          />
        </div>

        {/* Save Payment Method */}
        {savePaymentMethod && (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="save-payment-method"
              className="rounded border-gray-300"
              defaultChecked
            />
            <label htmlFor="save-payment-method" className="text-sm">
              Save payment method for future use
            </label>
          </div>
        )}

        {/* Error/Success Message */}
        {message && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-600">{message}</p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={!stripe || processing}
          className="w-full"
          size="lg"
        >
          {processing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing Payment...
            </>
          ) : (
            <>
              <Icon name="credit-card" className="w-4 h-4 mr-2" />
              Pay £{amount.toFixed(2)}
            </>
          )}
        </Button>

        {/* Security Info */}
        <div className="text-center text-xs text-muted-foreground space-y-1">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center">
              <Icon name="shield" className="w-3 h-3 mr-1" />
              <span>SSL Secured</span>
            </div>
            <div className="flex items-center">
              <Icon name="lock" className="w-3 h-3 mr-1" />
              <span>256-bit Encryption</span>
            </div>
            <div className="flex items-center">
              <span className="font-medium">Stripe</span>
            </div>
          </div>
          <p>Your payment information is secure and encrypted</p>
        </div>
      </form>
    </Card>
  );
}

// Simplified Card Element form (alternative)
export function StripeCardForm({
  bookingId,
  amount,
  currency = 'gbp',
  customerId,
  onPaymentSuccess,
  onPaymentError,
  savePaymentMethod = false,
  className = ''
}: StripePaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string>('');

  useEffect(() => {
    // Create payment intent
    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/payments/stripe/payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId,
            amount,
            currency,
            customerId,
            savePaymentMethod
          }),
        });

        const data = await response.json();
        if (response.ok) {
          setClientSecret(data.paymentIntent.client_secret);
        }
      } catch (error) {
        onPaymentError('Failed to initialize payment');
      }
    };

    createPaymentIntent();
  }, [bookingId, amount, currency, customerId, savePaymentMethod, onPaymentError]);

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
    },
  };

  return (
    <Elements stripe={stripePromise}>
      <CardPaymentForm
        clientSecret={clientSecret}
        amount={amount}
        currency={currency}
        onPaymentSuccess={onPaymentSuccess}
        onPaymentError={onPaymentError}
        cardElementOptions={cardElementOptions}
        className={className}
      />
    </Elements>
  );
}

interface CardPaymentFormProps {
  clientSecret: string;
  amount: number;
  currency: string;
  onPaymentSuccess: (paymentIntent: any) => void;
  onPaymentError: (error: string) => void;
  cardElementOptions: any;
  className?: string;
}

function CardPaymentForm({
  clientSecret,
  amount,
  currency,
  onPaymentSuccess,
  onPaymentError,
  cardElementOptions,
  className
}: CardPaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) return;

    setProcessing(true);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      onPaymentError('Card element not found');
      setProcessing(false);
      return;
    }

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
      },
    });

    if (error) {
      onPaymentError(error.message || 'Payment failed');
    } else if (paymentIntent?.status === 'succeeded') {
      onPaymentSuccess(paymentIntent);
    }

    setProcessing(false);
  };

  return (
    <Card className={`p-6 ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-4 border rounded-lg">
          <CardElement options={cardElementOptions} />
        </div>
        
        <Button
          type="submit"
          disabled={!stripe || processing}
          className="w-full"
        >
          {processing ? 'Processing...' : `Pay £${amount.toFixed(2)}`}
        </Button>
      </form>
    </Card>
  );
}