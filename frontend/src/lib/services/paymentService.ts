/**
 * Payment service for handling Stripe and PayPal integrations
 * Provides secure payment processing for repair bookings
 */

import { loadStripe, Stripe } from '@stripe/stripe-js';
import { apiService } from './apiService';

export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'bank_transfer';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
}

export interface PaymentData {
  amount: number;
  currency: string;
  description: string;
  metadata?: Record<string, string>;
  customerId?: string;
  repairId?: string;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  paymentMethod?: PaymentMethod;
  error?: string;
  requiresAction?: boolean;
  actionUrl?: string;
}

class PaymentService {
  private stripe: Stripe | null = null;
  private stripePublicKey: string;

  constructor() {
    this.stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
  }

  /**
   * Initialize Stripe
   */
  async initializeStripe(): Promise<Stripe | null> {
    if (!this.stripe && this.stripePublicKey) {
      this.stripe = await loadStripe(this.stripePublicKey);
    }
    return this.stripe;
  }

  /**
   * Create payment intent for Stripe
   */
  async createStripePaymentIntent(paymentData: PaymentData): Promise<PaymentIntent | null> {
    try {
      const response = await apiService.request('/payments/stripe/payment-intent', {
        method: 'POST',
        body: JSON.stringify(paymentData),
      });

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to create payment intent');
      }
    } catch (error) {
      console.error('Error creating Stripe payment intent:', error);
      return null;
    }
  }

  /**
   * Process Stripe payment
   */
  async processStripePayment(
    paymentIntentId: string,
    paymentMethodId: string
  ): Promise<PaymentResult> {
    try {
      const stripe = await this.initializeStripe();
      if (!stripe) {
        throw new Error('Stripe not initialized');
      }

      const { error, paymentIntent } = await stripe.confirmPayment({
        payment_method: paymentMethodId,
        confirmation_token: paymentIntentId,
        return_url: `${window.location.origin}/payment/success`,
      });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      if (paymentIntent.status === 'succeeded') {
        return {
          success: true,
          paymentId: paymentIntent.id,
        };
      } else if (paymentIntent.status === 'requires_action') {
        return {
          success: false,
          requiresAction: true,
          actionUrl: paymentIntent.next_action?.redirect_to_url?.url,
        };
      } else {
        return {
          success: false,
          error: 'Payment failed',
        };
      }
    } catch (error) {
      console.error('Error processing Stripe payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Create Stripe Elements for card input
   */
  async createStripeElements() {
    const stripe = await this.initializeStripe();
    if (!stripe) {
      throw new Error('Stripe not initialized');
    }

    const elements = stripe.elements({
      appearance: {
        theme: 'stripe',
        variables: {
          colorPrimary: '#0EA5E9',
          colorBackground: '#ffffff',
          colorText: '#1f2937',
          colorDanger: '#ef4444',
          fontFamily: 'Inter, sans-serif',
          borderRadius: '8px',
        },
      },
    });

    const cardElement = elements.create('card', {
      style: {
        base: {
          fontSize: '16px',
          color: '#1f2937',
          '::placeholder': {
            color: '#9ca3af',
          },
        },
      },
    });

    return { stripe, elements, cardElement };
  }

  /**
   * Create PayPal order
   */
  async createPayPalOrder(paymentData: PaymentData): Promise<{ orderId: string; approvalUrl: string } | null> {
    try {
      const response = await apiService.request('/payments/paypal/create-order', {
        method: 'POST',
        body: JSON.stringify(paymentData),
      });

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to create PayPal order');
      }
    } catch (error) {
      console.error('Error creating PayPal order:', error);
      return null;
    }
  }

  /**
   * Capture PayPal payment
   */
  async capturePayPalPayment(orderId: string): Promise<PaymentResult> {
    try {
      const response = await apiService.request('/payments/paypal/capture-order', {
        method: 'POST',
        body: JSON.stringify({ orderId }),
      });

      if (response.success) {
        return {
          success: true,
          paymentId: response.data.paymentId,
        };
      } else {
        return {
          success: false,
          error: response.error || 'Failed to capture PayPal payment',
        };
      }
    } catch (error) {
      console.error('Error capturing PayPal payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get saved payment methods for a customer
   */
  async getSavedPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const response = await apiService.request('/payments/methods');
      return response.success ? response.data : [];
    } catch (error) {
      console.error('Error getting saved payment methods:', error);
      return [];
    }
  }

  /**
   * Save payment method for future use
   */
  async savePaymentMethod(paymentMethodId: string): Promise<boolean> {
    try {
      const response = await apiService.request('/payments/methods', {
        method: 'POST',
        body: JSON.stringify({ paymentMethodId }),
      });
      return response.success;
    } catch (error) {
      console.error('Error saving payment method:', error);
      return false;
    }
  }

  /**
   * Delete saved payment method
   */
  async deletePaymentMethod(paymentMethodId: string): Promise<boolean> {
    try {
      const response = await apiService.request(`/payments/methods/${paymentMethodId}`, {
        method: 'DELETE',
      });
      return response.success;
    } catch (error) {
      console.error('Error deleting payment method:', error);
      return false;
    }
  }

  /**
   * Validate payment amount and currency
   */
  validatePaymentData(paymentData: PaymentData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!paymentData.amount || paymentData.amount <= 0) {
      errors.push('Amount must be greater than 0');
    }

    if (!paymentData.currency) {
      errors.push('Currency is required');
    }

    if (!paymentData.description) {
      errors.push('Description is required');
    }

    // Minimum amount validation (£1.00)
    if (paymentData.currency === 'GBP' && paymentData.amount < 100) {
      errors.push('Minimum payment amount is £1.00');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Format amount for display
   */
  formatAmount(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100); // Amount is in pence/cents
  }

  /**
   * Check if payment method is supported
   */
  isPaymentMethodSupported(method: string): boolean {
    const supportedMethods = ['card', 'paypal'];
    return supportedMethods.includes(method.toLowerCase());
  }

  /**
   * Get payment processing fees
   */
  getProcessingFees(amount: number, method: string): number {
    // Stripe fees: 1.4% + 20p for UK cards
    if (method === 'card') {
      return Math.round(amount * 0.014 + 20);
    }
    
    // PayPal fees: 1.9% + 10p
    if (method === 'paypal') {
      return Math.round(amount * 0.019 + 10);
    }

    return 0;
  }

  /**
   * Request payment confirmation via SMS/Email
   */
  async requestPaymentConfirmation(paymentId: string, method: 'sms' | 'email'): Promise<boolean> {
    try {
      const response = await apiService.request('/payments/confirm', {
        method: 'POST',
        body: JSON.stringify({ paymentId, method }),
      });
      return response.success;
    } catch (error) {
      console.error('Error requesting payment confirmation:', error);
      return false;
    }
  }
}

// React hook for payment processing
import { useState, useCallback } from 'react';

export const usePayment = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentService] = useState(() => new PaymentService());

  const processPayment = useCallback(async (
    paymentData: PaymentData,
    paymentMethod: 'stripe' | 'paypal'
  ): Promise<PaymentResult> => {
    setIsProcessing(true);
    
    try {
      let result: PaymentResult;
      
      if (paymentMethod === 'stripe') {
        const paymentIntent = await paymentService.createStripePaymentIntent(paymentData);
        if (!paymentIntent) {
          throw new Error('Failed to create payment intent');
        }
        
        // In a real implementation, you would get the payment method ID from the Stripe Elements
        result = await paymentService.processStripePayment(paymentIntent.id, 'payment_method_id');
      } else {
        const order = await paymentService.createPayPalOrder(paymentData);
        if (!order) {
          throw new Error('Failed to create PayPal order');
        }
        
        // Redirect to PayPal for approval, then capture on return
        result = await paymentService.capturePayPalPayment(order.orderId);
      }
      
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment failed',
      };
    } finally {
      setIsProcessing(false);
    }
  }, [paymentService]);

  return {
    isProcessing,
    processPayment,
    paymentService,
  };
};

// Export singleton instance
export const paymentService = new PaymentService();
export default paymentService;