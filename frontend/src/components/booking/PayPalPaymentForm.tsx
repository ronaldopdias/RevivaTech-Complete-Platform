'use client';

import React, { useState, useEffect } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

interface PayPalPaymentFormProps {
  bookingId: string;
  amount: number;
  currency?: string;
  onPaymentSuccess: (details: any) => void;
  onPaymentError: (error: string) => void;
  className?: string;
}

export function PayPalPaymentForm({
  bookingId,
  amount,
  currency = 'GBP',
  onPaymentSuccess,
  onPaymentError,
  className = ''
}: PayPalPaymentFormProps) {
  const [loading, setLoading] = useState(false);
  const [paypalLoaded, setPaypalLoaded] = useState(false);

  const initialOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
    currency: currency,
    intent: 'capture',
    components: 'buttons',
    'disable-funding': 'credit,card',
    'buyer-country': 'GB',
  };

  const createOrder = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/payments/paypal/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          amount,
          currency,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create PayPal order');
      }

      return data.orderId;
    } catch (error) {
      console.error('Error creating PayPal order:', error);
      onPaymentError(error instanceof Error ? error.message : 'Failed to create PayPal order');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const onApprove = async (data: any) => {
    try {
      setLoading(true);

      const response = await fetch('/api/payments/paypal/capture-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: data.orderID,
        }),
      });

      const captureData = await response.json();

      if (!response.ok) {
        throw new Error(captureData.error || 'Failed to capture PayPal payment');
      }

      onPaymentSuccess(captureData);
    } catch (error) {
      console.error('Error capturing PayPal payment:', error);
      onPaymentError(error instanceof Error ? error.message : 'Failed to process PayPal payment');
    } finally {
      setLoading(false);
    }
  };

  const onError = (error: any) => {
    console.error('PayPal error:', error);
    onPaymentError('PayPal payment failed. Please try again.');
  };

  const onCancel = () => {
    console.log('PayPal payment cancelled');
    // Could trigger a callback here if needed
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">PayPal Payment</h3>
        <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
          <span className="text-sm font-medium">Total Amount:</span>
          <span className="text-lg font-bold text-primary">
            £{amount.toFixed(2)} {currency}
          </span>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8 mb-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="ml-3 text-muted-foreground">Processing payment...</span>
        </div>
      )}

      <PayPalScriptProvider options={initialOptions}>
        <div className={loading ? 'pointer-events-none opacity-50' : ''}>
          <PayPalButtons
            style={{
              layout: 'vertical',
              color: 'blue',
              shape: 'rect',
              label: 'paypal',
              height: 45,
            }}
            createOrder={createOrder}
            onApprove={onApprove}
            onError={onError}
            onCancel={onCancel}
            disabled={loading}
          />
        </div>
      </PayPalScriptProvider>

      {/* Security Info */}
      <div className="mt-6 text-center text-xs text-muted-foreground space-y-1">
        <div className="flex items-center justify-center space-x-4">
          <div className="flex items-center">
            <Icon name="shield" className="w-3 h-3 mr-1" />
            <span>Buyer Protection</span>
          </div>
          <div className="flex items-center">
            <Icon name="lock" className="w-3 h-3 mr-1" />
            <span>Secure Checkout</span>
          </div>
          <div className="flex items-center">
            <span className="font-medium text-blue-600">PayPal</span>
          </div>
        </div>
        <p>Your payment is protected by PayPal's Buyer Protection policy</p>
      </div>
    </Card>
  );
}

// Alternative Express Checkout Button (simpler version)
export function PayPalExpressButton({
  bookingId,
  amount,
  currency = 'GBP',
  onPaymentSuccess,
  onPaymentError,
  className = ''
}: PayPalPaymentFormProps) {
  const [processing, setProcessing] = useState(false);

  const handlePayPalPayment = async () => {
    try {
      setProcessing(true);

      // Create order
      const createResponse = await fetch('/api/payments/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, amount, currency }),
      });

      const createData = await createResponse.json();

      if (!createResponse.ok) {
        throw new Error(createData.error);
      }

      // Get approval URL
      const approvalUrl = createData.links?.find((link: any) => link.rel === 'approve')?.href;

      if (approvalUrl) {
        // Redirect to PayPal for approval
        window.location.href = approvalUrl;
      } else {
        throw new Error('No PayPal approval URL found');
      }

    } catch (error) {
      onPaymentError(error instanceof Error ? error.message : 'PayPal payment failed');
      setProcessing(false);
    }
  };

  return (
    <div className={className}>
      <Button
        onClick={handlePayPalPayment}
        disabled={processing}
        className="w-full bg-blue-600 hover:bg-blue-700"
        size="lg"
      >
        {processing ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Redirecting to PayPal...
          </>
        ) : (
          <>
            <span className="font-bold text-white mr-2">Pay</span>
            <span className="bg-white text-blue-600 px-2 py-1 rounded text-sm font-bold">Pal</span>
            <span className="ml-2">£{amount.toFixed(2)}</span>
          </>
        )}
      </Button>
    </div>
  );
}

// PayPal Smart Payment Buttons with multiple funding sources
export function PayPalSmartButtons({
  bookingId,
  amount,
  currency = 'GBP',
  onPaymentSuccess,
  onPaymentError,
  className = ''
}: PayPalPaymentFormProps) {
  const initialOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
    currency: currency,
    intent: 'capture',
    components: 'buttons,funding-eligibility',
    'enable-funding': 'venmo,paylater',
    'buyer-country': 'GB',
  };

  const createOrder = async () => {
    const response = await fetch('/api/payments/paypal/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId, amount, currency }),
    });
    const data = await response.json();
    return data.orderId;
  };

  const onApprove = async (data: any) => {
    const response = await fetch('/api/payments/paypal/capture-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: data.orderID }),
    });
    const captureData = await response.json();
    onPaymentSuccess(captureData);
  };

  return (
    <Card className={`p-6 ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Choose Payment Method</h3>
      
      <PayPalScriptProvider options={initialOptions}>
        <PayPalButtons
          fundingSource="paypal"
          style={{ layout: 'vertical', height: 45 }}
          createOrder={createOrder}
          onApprove={onApprove}
          onError={onPaymentError}
        />
        
        <div className="mt-4">
          <PayPalButtons
            fundingSource="card"
            style={{ layout: 'vertical', height: 45 }}
            createOrder={createOrder}
            onApprove={onApprove}
            onError={onPaymentError}
          />
        </div>
      </PayPalScriptProvider>
    </Card>
  );
}