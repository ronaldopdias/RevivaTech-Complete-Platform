'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  CreditCard, 
  Shield, 
  Lock, 
  CheckCircle, 
  AlertCircle, 
  Loader, 
  Eye, 
  EyeOff,
  Calendar,
  User,
  MapPin,
  Mail,
  Phone
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PriceEstimate } from '../../../config/pricing/pricing.engine';

// Payment method types
export type PaymentMethod = 'card' | 'paypal' | 'bank_transfer' | 'klarna';

// Payment data interfaces
export interface PaymentData {
  method: PaymentMethod;
  amount: number;
  currency: string;
  card?: {
    number: string;
    expiry: string;
    cvc: string;
    name: string;
  };
  billing?: {
    name: string;
    email: string;
    phone: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      postal_code: string;
      country: string;
    };
  };
}

export interface PaymentResult {
  success: boolean;
  paymentIntentId?: string;
  error?: string;
  transactionId?: string;
}

export interface PaymentGatewayProps {
  amount: number;
  currency?: string;
  priceEstimate?: PriceEstimate;
  onPaymentSuccess?: (result: PaymentResult) => void;
  onPaymentError?: (error: string) => void;
  onPaymentStart?: () => void;
  className?: string;
  variant?: 'default' | 'minimal' | 'checkout';
  showBilling?: boolean;
  allowedMethods?: PaymentMethod[];
  isLoading?: boolean;
  stripePublishableKey?: string;
}

// Card number formatting utility
const formatCardNumber = (value: string): string => {
  const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
  const matches = v.match(/\d{4,16}/g);
  const match = matches && matches[0] || '';
  const parts = [];

  for (let i = 0, len = match.length; i < len; i += 4) {
    parts.push(match.substring(i, i + 4));
  }

  if (parts.length) {
    return parts.join(' ');
  } else {
    return v;
  }
};

// Expiry date formatting
const formatExpiry = (value: string): string => {
  const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
  if (v.length >= 2) {
    return v.substring(0, 2) + '/' + v.substring(2, 4);
  }
  return v;
};

// Card type detection
const getCardType = (number: string): string => {
  const cleaned = number.replace(/\s/g, '');
  if (/^4/.test(cleaned)) return 'visa';
  if (/^5[1-5]/.test(cleaned)) return 'mastercard';
  if (/^3[47]/.test(cleaned)) return 'amex';
  return 'unknown';
};

export const PaymentGateway: React.FC<PaymentGatewayProps> = ({
  amount,
  currency = 'GBP',
  priceEstimate,
  onPaymentSuccess,
  onPaymentError,
  onPaymentStart,
  className,
  variant = 'default',
  showBilling = true,
  allowedMethods = ['card', 'paypal'],
  isLoading = false,
  stripePublishableKey,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCvc, setShowCvc] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: '',
  });
  const [billingData, setBillingData] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      postal_code: '',
      country: 'GB',
    },
  });

  const cardNumberRef = useRef<HTMLInputElement>(null);
  const expiryRef = useRef<HTMLInputElement>(null);
  const cvcRef = useRef<HTMLInputElement>(null);

  // Focus management for card inputs
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setCardData(prev => ({ ...prev, number: formatted }));
    
    // Auto-focus to expiry when card number is complete
    if (formatted.length >= 19) {
      expiryRef.current?.focus();
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiry(e.target.value);
    setCardData(prev => ({ ...prev, expiry: formatted }));
    
    // Auto-focus to CVC when expiry is complete
    if (formatted.length >= 5) {
      cvcRef.current?.focus();
    }
  };

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
    setCardData(prev => ({ ...prev, cvc: value }));
  };

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (selectedMethod === 'card') {
      const cleanNumber = cardData.number.replace(/\s/g, '');
      if (!cleanNumber || cleanNumber.length < 13) {
        newErrors.cardNumber = 'Please enter a valid card number';
      }

      if (!cardData.expiry || cardData.expiry.length < 5) {
        newErrors.expiry = 'Please enter a valid expiry date';
      } else {
        const [month, year] = cardData.expiry.split('/');
        const now = new Date();
        const expiry = new Date(2000 + parseInt(year), parseInt(month) - 1);
        if (expiry < now) {
          newErrors.expiry = 'Card has expired';
        }
      }

      if (!cardData.cvc || cardData.cvc.length < 3) {
        newErrors.cvc = 'Please enter a valid CVC';
      }

      if (!cardData.name.trim()) {
        newErrors.cardName = 'Please enter the cardholder name';
      }
    }

    if (showBilling) {
      if (!billingData.name.trim()) {
        newErrors.billingName = 'Please enter your name';
      }
      if (!billingData.email.trim() || !/\S+@\S+\.\S+/.test(billingData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
      if (!billingData.address.line1.trim()) {
        newErrors.address = 'Please enter your address';
      }
      if (!billingData.address.city.trim()) {
        newErrors.city = 'Please enter your city';
      }
      if (!billingData.address.postal_code.trim()) {
        newErrors.postalCode = 'Please enter your postal code';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle payment submission
  const handlePayment = async () => {
    if (!validateForm()) {
      return;
    }

    setIsProcessing(true);
    onPaymentStart?.();

    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // In a real implementation, you would integrate with Stripe here
      const paymentData: PaymentData = {
        method: selectedMethod,
        amount,
        currency,
        ...(selectedMethod === 'card' && { card: cardData }),
        ...(showBilling && { billing: billingData }),
      };

      // Mock successful payment
      const result: PaymentResult = {
        success: true,
        paymentIntentId: `pi_${Date.now()}`,
        transactionId: `txn_${Date.now()}`,
      };

      onPaymentSuccess?.(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment failed';
      onPaymentError?.(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const cardType = getCardType(cardData.number);

  if (variant === 'minimal') {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="text-center">
          <div className="text-2xl font-bold">£{amount.toFixed(2)}</div>
          <div className="text-sm text-neutral-600">Total Amount</div>
        </div>
        
        <button
          onClick={handlePayment}
          disabled={isProcessing || isLoading}
          className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center space-x-2"
        >
          {isProcessing ? (
            <Loader className="h-4 w-4 animate-spin" />
          ) : (
            <CreditCard className="h-4 w-4" />
          )}
          <span>Pay Now</span>
        </button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-primary-100 rounded-lg">
            <Shield className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-neutral-900">Secure Payment</h3>
            <p className="text-neutral-600">Your payment information is encrypted and secure</p>
          </div>
        </div>
      </div>

      {/* Payment Amount Summary */}
      {priceEstimate && (
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <span className="font-medium">Order Summary</span>
            <span className="text-xl font-bold text-primary-600">£{amount.toFixed(2)}</span>
          </div>
          <div className="space-y-1 text-sm text-neutral-600">
            <div className="flex justify-between">
              <span>Base Price</span>
              <span>£{priceEstimate.basePrice}</span>
            </div>
            {priceEstimate.options.map((option, index) => (
              <div key={index} className="flex justify-between">
                <span>{option.name}</span>
                <span>+£{option.cost}</span>
              </div>
            ))}
            <div className="flex justify-between">
              <span>Service Fee</span>
              <span>£{priceEstimate.serviceFee}</span>
            </div>
          </div>
        </div>
      )}

      {/* Payment Method Selection */}
      <div className="space-y-3">
        <h4 className="font-semibold text-neutral-900">Payment Method</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {allowedMethods.map((method) => (
            <button
              key={method}
              onClick={() => setSelectedMethod(method)}
              className={cn(
                "p-4 border-2 rounded-lg text-left transition-colors",
                selectedMethod === method
                  ? "border-primary-500 bg-primary-50"
                  : "border-neutral-200 hover:border-neutral-300"
              )}
            >
              <div className="flex items-center space-x-3">
                {method === 'card' && <CreditCard className="h-5 w-5" />}
                {method === 'paypal' && <div className="h-5 w-5 bg-blue-600 rounded" />}
                {method === 'bank_transfer' && <div className="h-5 w-5 bg-green-600 rounded" />}
                {method === 'klarna' && <div className="h-5 w-5 bg-pink-600 rounded" />}
                <span className="font-medium capitalize">
                  {method === 'bank_transfer' ? 'Bank Transfer' : method}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Card Payment Form */}
      {selectedMethod === 'card' && (
        <div className="space-y-4">
          <h4 className="font-semibold text-neutral-900">Card Information</h4>
          
          {/* Card Number */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-700">Card Number</label>
            <div className="relative">
              <input
                ref={cardNumberRef}
                type="text"
                placeholder="1234 5678 9012 3456"
                value={cardData.number}
                onChange={handleCardNumberChange}
                maxLength={19}
                className={cn(
                  "w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500",
                  errors.cardNumber ? "border-red-300" : "border-neutral-300"
                )}
              />
              <CreditCard className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
              {cardType !== 'unknown' && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className={cn(
                    "text-xs px-2 py-1 rounded",
                    cardType === 'visa' ? "bg-blue-100 text-blue-700" :
                    cardType === 'mastercard' ? "bg-red-100 text-red-700" :
                    cardType === 'amex' ? "bg-green-100 text-green-700" :
                    "bg-neutral-100 text-neutral-700"
                  )}>
                    {cardType.toUpperCase()}
                  </div>
                </div>
              )}
            </div>
            {errors.cardNumber && (
              <p className="text-sm text-red-600">{errors.cardNumber}</p>
            )}
          </div>

          {/* Expiry and CVC */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-700">Expiry Date</label>
              <div className="relative">
                <input
                  ref={expiryRef}
                  type="text"
                  placeholder="MM/YY"
                  value={cardData.expiry}
                  onChange={handleExpiryChange}
                  maxLength={5}
                  className={cn(
                    "w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500",
                    errors.expiry ? "border-red-300" : "border-neutral-300"
                  )}
                />
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              </div>
              {errors.expiry && (
                <p className="text-sm text-red-600">{errors.expiry}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-700">CVC</label>
              <div className="relative">
                <input
                  ref={cvcRef}
                  type={showCvc ? "text" : "password"}
                  placeholder="123"
                  value={cardData.cvc}
                  onChange={handleCvcChange}
                  maxLength={4}
                  className={cn(
                    "w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500",
                    errors.cvc ? "border-red-300" : "border-neutral-300"
                  )}
                />
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <button
                  type="button"
                  onClick={() => setShowCvc(!showCvc)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showCvc ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.cvc && (
                <p className="text-sm text-red-600">{errors.cvc}</p>
              )}
            </div>
          </div>

          {/* Cardholder Name */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-700">Cardholder Name</label>
            <div className="relative">
              <input
                type="text"
                placeholder="John Doe"
                value={cardData.name}
                onChange={(e) => setCardData(prev => ({ ...prev, name: e.target.value }))}
                className={cn(
                  "w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500",
                  errors.cardName ? "border-red-300" : "border-neutral-300"
                )}
              />
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            </div>
            {errors.cardName && (
              <p className="text-sm text-red-600">{errors.cardName}</p>
            )}
          </div>
        </div>
      )}

      {/* Billing Information */}
      {showBilling && (
        <div className="space-y-4">
          <h4 className="font-semibold text-neutral-900">Billing Information</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-700">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="John Doe"
                  value={billingData.name}
                  onChange={(e) => setBillingData(prev => ({ ...prev, name: e.target.value }))}
                  className={cn(
                    "w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500",
                    errors.billingName ? "border-red-300" : "border-neutral-300"
                  )}
                />
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              </div>
              {errors.billingName && (
                <p className="text-sm text-red-600">{errors.billingName}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-700">Email</label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={billingData.email}
                  onChange={(e) => setBillingData(prev => ({ ...prev, email: e.target.value }))}
                  className={cn(
                    "w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500",
                    errors.email ? "border-red-300" : "border-neutral-300"
                  )}
                />
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              </div>
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email}</p>
              )}
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-700">Phone Number</label>
            <div className="relative">
              <input
                type="tel"
                placeholder="+44 20 1234 5678"
                value={billingData.phone}
                onChange={(e) => setBillingData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-700">Address Line 1</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="123 Main Street"
                  value={billingData.address.line1}
                  onChange={(e) => setBillingData(prev => ({ 
                    ...prev, 
                    address: { ...prev.address, line1: e.target.value }
                  }))}
                  className={cn(
                    "w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500",
                    errors.address ? "border-red-300" : "border-neutral-300"
                  )}
                />
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              </div>
              {errors.address && (
                <p className="text-sm text-red-600">{errors.address}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-700">Address Line 2 (Optional)</label>
              <input
                type="text"
                placeholder="Apartment, suite, etc."
                value={billingData.address.line2}
                onChange={(e) => setBillingData(prev => ({ 
                  ...prev, 
                  address: { ...prev.address, line2: e.target.value }
                }))}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">City</label>
                <input
                  type="text"
                  placeholder="London"
                  value={billingData.address.city}
                  onChange={(e) => setBillingData(prev => ({ 
                    ...prev, 
                    address: { ...prev.address, city: e.target.value }
                  }))}
                  className={cn(
                    "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500",
                    errors.city ? "border-red-300" : "border-neutral-300"
                  )}
                />
                {errors.city && (
                  <p className="text-sm text-red-600">{errors.city}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">Postal Code</label>
                <input
                  type="text"
                  placeholder="SW1A 1AA"
                  value={billingData.address.postal_code}
                  onChange={(e) => setBillingData(prev => ({ 
                    ...prev, 
                    address: { ...prev.address, postal_code: e.target.value }
                  }))}
                  className={cn(
                    "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500",
                    errors.postalCode ? "border-red-300" : "border-neutral-300"
                  )}
                />
                {errors.postalCode && (
                  <p className="text-sm text-red-600">{errors.postalCode}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">Country</label>
                <select
                  value={billingData.address.country}
                  onChange={(e) => setBillingData(prev => ({ 
                    ...prev, 
                    address: { ...prev.address, country: e.target.value }
                  }))}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="GB">United Kingdom</option>
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="DE">Germany</option>
                  <option value="FR">France</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Notice */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Shield className="h-5 w-5 text-green-600 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-green-800">Your payment is secure</p>
            <p className="text-green-700">
              We use industry-standard encryption to protect your payment information.
              Your data is never stored on our servers.
            </p>
          </div>
        </div>
      </div>

      {/* Payment Button */}
      <button
        onClick={handlePayment}
        disabled={isProcessing || isLoading}
        className={cn(
          "w-full py-4 px-6 rounded-lg font-semibold text-white transition-colors",
          "bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed",
          "flex items-center justify-center space-x-3"
        )}
      >
        {isProcessing ? (
          <>
            <Loader className="h-5 w-5 animate-spin" />
            <span>Processing Payment...</span>
          </>
        ) : (
          <>
            <Lock className="h-5 w-5" />
            <span>Pay £{amount.toFixed(2)} Securely</span>
          </>
        )}
      </button>
    </div>
  );
};

export default PaymentGateway;