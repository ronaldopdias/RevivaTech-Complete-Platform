'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, DollarSign, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { StripePaymentForm } from './StripePaymentForm';
import { PayPalPaymentForm } from './PayPalPaymentForm';

export type PaymentProvider = 'stripe' | 'paypal';

export interface PaymentProviderInfo {
  id: PaymentProvider;
  name: string;
  description: string;
  icon: string;
  publicKey?: string;
  clientId?: string;
  testMode: boolean;
}

export interface UnifiedPaymentFormProps {
  bookingId: string;
  amount: number; // in pence
  currency?: 'GBP' | 'USD' | 'EUR';
  description?: string;
  customerInfo?: {
    email?: string;
    name?: string;
    phone?: string;
  };
  onPaymentSuccess: (result: any) => void;
  onPaymentError: (error: string) => void;
  className?: string;
  allowProviderSelection?: boolean;
  preferredProvider?: PaymentProvider;
}

export function UnifiedPaymentForm({
  bookingId,
  amount,
  currency = 'GBP',
  description,
  customerInfo,
  onPaymentSuccess,
  onPaymentError,
  className = '',
  allowProviderSelection = true,
  preferredProvider
}: UnifiedPaymentFormProps) {
  const [availableProviders, setAvailableProviders] = useState<PaymentProviderInfo[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<any>(null);

  // Load available payment providers
  useEffect(() => {
    loadPaymentProviders();
  }, []);

  // Auto-select provider when available providers are loaded
  useEffect(() => {
    if (availableProviders.length > 0 && !selectedProvider) {
      if (preferredProvider && availableProviders.some(p => p.id === preferredProvider)) {
        setSelectedProvider(preferredProvider);
      } else {
        setSelectedProvider(availableProviders[0].id);
      }
    }
  }, [availableProviders, preferredProvider, selectedProvider]);

  const loadPaymentProviders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/payments/create');
      const data = await response.json();
      
      if (data.success) {
        setAvailableProviders(data.providers);
      } else {
        setError(data.error || 'Failed to load payment providers');
      }
    } catch (err) {
      setError('Network error: Unable to load payment providers');
      // Payment providers loading error
    } finally {
      setLoading(false);
    }
  };

  const createPayment = async () => {
    if (!selectedProvider) {
      setError('No payment provider selected');
      return;
    }

    try {
      setPaymentLoading(true);
      setError(null);
      
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bookingId,
          amount,
          currency,
          provider: selectedProvider,
          description,
          customerInfo
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPaymentData(data);
      } else {
        setError(data.error || 'Failed to create payment');
        setPaymentLoading(false);
      }
    } catch (err) {
      setError('Network error: Unable to create payment');
      setPaymentLoading(false);
      // Payment creation error
    }
  };

  const handlePaymentSuccess = async (providerResult: any) => {
    try {
      // Confirm payment with our unified API
      const response = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paymentId: paymentData.paymentId,
          provider: selectedProvider,
          confirmationData: providerResult
        })
      });
      
      const confirmationData = await response.json();
      
      if (confirmationData.success) {
        onPaymentSuccess({
          ...confirmationData,
          originalProviderResult: providerResult
        });
      } else {
        onPaymentError(confirmationData.error || 'Payment confirmation failed');
      }
    } catch (err) {
      onPaymentError('Network error during payment confirmation');
      // Payment confirmation error
    } finally {
      setPaymentLoading(false);
    }
  };

  const handlePaymentError = (error: string) => {
    setPaymentLoading(false);
    onPaymentError(error);
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount / 100);
  };

  const getProviderIcon = (iconName: string) => {
    switch (iconName) {
      case 'credit-card':
        return <CreditCard className="h-5 w-5" />;
      case 'paypal':
        return <DollarSign className="h-5 w-5" />;
      default:
        return <CreditCard className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading payment options...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="py-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button 
            onClick={loadPaymentProviders} 
            variant="outline" 
            className="mt-4 w-full"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (availableProviders.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No payment providers are currently available. Please contact support.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Secure Payment
          </CardTitle>
          <CardDescription>
            Complete your booking payment securely
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <span className="font-medium">Total Amount:</span>
            <span className="text-lg font-bold text-primary">
              {formatAmount(amount, currency)}
            </span>
          </div>
          {description && (
            <p className="text-sm text-muted-foreground mt-2">{description}</p>
          )}
        </CardContent>
      </Card>

      {/* Provider Selection */}
      {allowProviderSelection && availableProviders.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
            <CardDescription>
              Choose your preferred payment method
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {availableProviders.map((provider) => (
                <div
                  key={provider.id}
                  className={`
                    border rounded-lg p-4 cursor-pointer transition-all
                    ${selectedProvider === provider.id 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                    }
                  `}
                  onClick={() => setSelectedProvider(provider.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getProviderIcon(provider.icon)}
                      <div>
                        <div className="font-medium">{provider.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {provider.description}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {provider.testMode && (
                        <Badge variant="secondary" className="text-xs">
                          Test Mode
                        </Badge>
                      )}
                      {selectedProvider === provider.id && (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Form */}
      {selectedProvider && !paymentData && (
        <Card>
          <CardHeader>
            <CardTitle>
              {availableProviders.find(p => p.id === selectedProvider)?.name} Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={createPayment} 
              disabled={paymentLoading}
              className="w-full"
            >
              {paymentLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Preparing Payment...
                </>
              ) : (
                <>
                  Continue to Payment
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Provider-Specific Payment Forms */}
      {paymentData && selectedProvider === 'stripe' && (
        <StripePaymentForm
          clientSecret={paymentData.clientSecret}
          publishableKey={paymentData.publishableKey}
          amount={amount}
          currency={currency}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
          loading={paymentLoading}
        />
      )}

      {paymentData && selectedProvider === 'paypal' && (
        <PayPalPaymentForm
          orderId={paymentData.paymentId}
          clientId={paymentData.clientId}
          amount={amount}
          currency={currency}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
          loading={paymentLoading}
        />
      )}
    </div>
  );
}