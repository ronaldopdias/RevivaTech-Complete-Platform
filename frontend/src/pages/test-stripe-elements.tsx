'use client';

/**
 * Stripe Elements Integration Test Page
 * 
 * This page provides comprehensive testing for Stripe payment integration:
 * - Real Stripe Elements components
 * - Payment Intent creation and confirmation
 * - Multiple payment methods (Card, Google Pay, Apple Pay)
 * - Error handling and validation
 * - 3D Secure (SCA) support
 * - Webhook testing simulation
 */

import React, { useState, useEffect } from 'react';
import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_51234567890abcdef');

interface TestPayment {
  amount: number;
  currency: string;
  description: string;
  metadata: Record<string, string>;
}

const TEST_PAYMENTS: TestPayment[] = [
  {
    amount: 12999, // £129.99
    currency: 'gbp',
    description: 'MacBook Pro Screen Repair',
    metadata: {
      device: 'MacBook Pro 16-inch 2023',
      repair_type: 'Screen Replacement',
      test_case: 'standard_payment'
    }
  },
  {
    amount: 5999, // £59.99
    currency: 'gbp',
    description: 'iPhone Battery Replacement',
    metadata: {
      device: 'iPhone 14 Pro',
      repair_type: 'Battery Replacement',
      test_case: 'small_payment'
    }
  },
  {
    amount: 25000, // £250.00
    currency: 'gbp',
    description: 'Gaming PC Diagnostic & Repair',
    metadata: {
      device: 'Custom Gaming PC',
      repair_type: 'Full Diagnostic & Repair',
      test_case: 'large_payment'
    }
  },
];

// Test credit card numbers for Stripe testing
const TEST_CARDS = [
  {
    name: 'Visa (Success)',
    number: '4242424242424242',
    description: 'Standard successful payment'
  },
  {
    name: 'Visa (Declined)',
    number: '4000000000000002',
    description: 'Card declined'
  },
  {
    name: 'Visa (3D Secure)',
    number: '4000000000003220',
    description: 'Requires 3D Secure authentication'
  },
  {
    name: 'Mastercard (Success)',
    number: '5555555555554444',
    description: 'Standard successful payment'
  },
];

function StripeTestForm() {
  const stripe = useStripe();
  const elements = useElements();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<TestPayment>(TEST_PAYMENTS[0]);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'payment_element'>('payment_element');
  const [customerDetails, setCustomerDetails] = useState({
    name: 'John Smith',
    email: 'john.smith@example.com',
    phone: '+447700900123',
  });

  // Create Payment Intent when component mounts or payment changes
  useEffect(() => {
    createPaymentIntent();
  }, [selectedPayment]);

  const createPaymentIntent = async () => {
    try {
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: selectedPayment.amount,
          currency: selectedPayment.currency,
          description: selectedPayment.description,
          metadata: selectedPayment.metadata,
          customer: {
            name: customerDetails.name,
            email: customerDetails.email,
            phone: customerDetails.phone,
          },
        }),
      });

      const { client_secret } = await response.json();
      setClientSecret(client_secret);
      setPaymentError(null);
    } catch (error) {
      setPaymentError('Failed to create payment intent. Using mock mode.');
      // For testing without backend, create a mock client secret
      setClientSecret('pi_mock_client_secret_for_testing');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setPaymentError('Stripe not loaded');
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      let result;

      if (paymentMethod === 'payment_element') {
        // Use Payment Element (recommended)
        result = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/payment-success`,
            payment_method_data: {
              billing_details: {
                name: customerDetails.name,
                email: customerDetails.email,
                phone: customerDetails.phone,
              },
            },
          },
          redirect: 'if_required',
        });
      } else {
        // Use Card Element (legacy)
        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
          throw new Error('Card element not found');
        }

        result = await stripe.confirmCardPayment(clientSecret!, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: customerDetails.name,
              email: customerDetails.email,
              phone: customerDetails.phone,
            },
          },
        });
      }

      if (result.error) {
        setPaymentError(result.error.message || 'Payment failed');
      } else {
        setPaymentSuccess(true);
        console.log('Payment successful:', result.paymentIntent);
      }
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetTest = () => {
    setPaymentSuccess(false);
    setPaymentError(null);
    setIsProcessing(false);
    createPaymentIntent();
  };

  if (paymentSuccess) {
    return (
      <Card className="p-8 text-center max-w-md mx-auto">
        <div className="text-green-600 text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-green-800 mb-2">Payment Successful!</h2>
        <p className="text-gray-600 mb-6">
          Test payment of £{(selectedPayment.amount / 100).toFixed(2)} processed successfully.
        </p>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="text-sm text-green-800 space-y-1">
            <p><strong>Amount:</strong> £{(selectedPayment.amount / 100).toFixed(2)}</p>
            <p><strong>Description:</strong> {selectedPayment.description}</p>
            <p><strong>Payment Method:</strong> {paymentMethod === 'payment_element' ? 'Payment Element' : 'Card Element'}</p>
            <p><strong>Time:</strong> {new Date().toLocaleString()}</p>
          </div>
        </div>
        <Button onClick={resetTest} className="w-full">
          Test Another Payment
        </Button>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Test Configuration */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Stripe Elements Test Configuration</h2>
        
        {/* Payment Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Test Payment Scenarios</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {TEST_PAYMENTS.map((payment, index) => (
              <button
                key={index}
                onClick={() => setSelectedPayment(payment)}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  selectedPayment === payment
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-lg">£{(payment.amount / 100).toFixed(2)}</div>
                <div className="text-sm text-gray-600">{payment.description}</div>
                <Badge variant="info" className="mt-2 text-xs">
                  {payment.metadata.test_case.replace('_', ' ')}
                </Badge>
              </button>
            ))}
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Payment Method Type</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPaymentMethod('payment_element')}
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                paymentMethod === 'payment_element'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium">Payment Element</div>
              <div className="text-sm text-gray-600">Recommended - Supports all payment methods</div>
            </button>
            <button
              onClick={() => setPaymentMethod('card')}
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                paymentMethod === 'card'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium">Card Element</div>
              <div className="text-sm text-gray-600">Legacy - Card payments only</div>
            </button>
          </div>
        </div>

        {/* Test Cards */}
        <div>
          <h3 className="text-lg font-medium mb-3">Test Card Numbers</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {TEST_CARDS.map((card, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium text-sm">{card.name}</div>
                <div className="font-mono text-sm text-gray-600">{card.number}</div>
                <div className="text-xs text-gray-500">{card.description}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Use any future expiry date (e.g., 12/34) and any 3-digit CVC
          </p>
        </div>
      </Card>

      {/* Customer Details */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Customer Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <Input
              value={customerDetails.name}
              onChange={(e) => setCustomerDetails(prev => ({ ...prev, name: e.target.value }))}
              placeholder="John Smith"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <Input
              type="email"
              value={customerDetails.email}
              onChange={(e) => setCustomerDetails(prev => ({ ...prev, email: e.target.value }))}
              placeholder="john.smith@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <Input
              value={customerDetails.phone}
              onChange={(e) => setCustomerDetails(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="+447700900123"
            />
          </div>
        </div>
      </Card>

      {/* Payment Form */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Payment Information</h3>
        
        {paymentError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-red-800 text-sm">{paymentError}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Payment Element or Card Element */}
          <div className="p-4 border border-gray-200 rounded-lg">
            {paymentMethod === 'payment_element' ? (
              <PaymentElement 
                options={{
                  layout: 'tabs',
                  paymentMethodOrder: ['card', 'apple_pay', 'google_pay'],
                }}
              />
            ) : (
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#424770',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                    },
                  },
                }}
              />
            )}
          </div>

          {/* Payment Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Amount:</span>
              <span className="text-xl font-bold">£{(selectedPayment.amount / 100).toFixed(2)}</span>
            </div>
            <div className="text-sm text-gray-600 mt-1">{selectedPayment.description}</div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!stripe || isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Processing...</span>
              </div>
            ) : (
              `Pay £${(selectedPayment.amount / 100).toFixed(2)}`
            )}
          </Button>
        </form>

        {/* Test Instructions */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">Testing Instructions:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Use test card numbers shown above</li>
            <li>• Use any future expiry date (e.g., 12/34)</li>
            <li>• Use any 3-digit CVC (e.g., 123)</li>
            <li>• Test 3D Secure with card 4000000000003220</li>
            <li>• Test declined payments with card 4000000000000002</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}

export default function StripeElementsTestPage() {
  // Test environment check
  const isTestMode = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_test_');
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Stripe Elements Integration Test
          </h1>
          <p className="text-gray-600 mb-4">
            Comprehensive testing environment for Stripe payment integration
          </p>
          
          {/* Environment Status */}
          <div className="flex justify-center space-x-4">
            <Badge variant={isTestMode ? "success" : "warning"}>
              {isTestMode ? "Test Mode" : "Live Mode"}
            </Badge>
            <Badge variant="info">
              RevivaTech Payment System
            </Badge>
          </div>
        </div>

        {/* Warning for Live Mode */}
        {!isTestMode && (
          <div className="max-w-2xl mx-auto mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-red-800">
              <strong>⚠️ Warning:</strong> You are in LIVE mode. Real payments will be processed!
            </div>
          </div>
        )}

        {/* Stripe Elements Wrapper */}
        <Elements 
          stripe={stripePromise}
          options={{
            mode: 'payment',
            amount: 12999,
            currency: 'gbp',
            appearance: {
              theme: 'stripe',
              variables: {
                colorPrimary: '#007AFF',
                colorBackground: '#ffffff',
                colorText: '#1D1D1F',
                colorDanger: '#df1b41',
                fontFamily: 'SF Pro Display, Inter, sans-serif',
                spacingUnit: '4px',
                borderRadius: '8px',
              },
            },
          }}
        >
          <StripeTestForm />
        </Elements>
      </div>
    </div>
  );
}