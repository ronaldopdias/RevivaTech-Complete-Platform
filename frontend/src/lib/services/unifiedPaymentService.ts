/**
 * Unified Payment Service
 * Provides a single interface for multiple payment providers (Stripe, PayPal)
 */

export type PaymentProvider = 'stripe' | 'paypal';
export type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled';
export type Currency = 'GBP' | 'USD' | 'EUR';

export interface PaymentRequest {
  bookingId: string;
  amount: number; // in pence/cents
  currency: Currency;
  description?: string;
  metadata?: Record<string, any>;
  customerInfo?: {
    email?: string;
    name?: string;
    phone?: string;
  };
}

export interface PaymentResponse {
  success: boolean;
  paymentId: string;
  provider: PaymentProvider;
  status: PaymentStatus;
  clientSecret?: string; // For Stripe
  approvalUrl?: string; // For PayPal
  redirectUrl?: string;
  error?: string;
  metadata?: Record<string, any>;
}

export interface PaymentConfirmation {
  success: boolean;
  paymentId: string;
  provider: PaymentProvider;
  status: PaymentStatus;
  transactionId?: string;
  amount: number;
  currency: Currency;
  paidAt?: Date;
  error?: string;
  metadata?: Record<string, any>;
}

export interface PaymentProviderConfig {
  stripe: {
    enabled: boolean;
    publicKey?: string;
    testMode: boolean;
  };
  paypal: {
    enabled: boolean;
    clientId?: string;
    testMode: boolean;
  };
}

class UnifiedPaymentService {
  private config: PaymentProviderConfig;
  
  constructor() {
    this.config = {
      stripe: {
        enabled: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        publicKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        testMode: process.env.NODE_ENV !== 'production'
      },
      paypal: {
        enabled: !!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
        clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
        testMode: process.env.NODE_ENV !== 'production'
      }
    };
  }

  /**
   * Get available payment providers
   */
  getAvailableProviders(): PaymentProvider[] {
    const providers: PaymentProvider[] = [];
    
    if (this.config.stripe.enabled) {
      providers.push('stripe');
    }
    
    if (this.config.paypal.enabled) {
      providers.push('paypal');
    }
    
    return providers;
  }

  /**
   * Get payment provider configuration
   */
  getProviderConfig(): PaymentProviderConfig {
    return { ...this.config };
  }

  /**
   * Check if a payment provider is available
   */
  isProviderAvailable(provider: PaymentProvider): boolean {
    return this.getAvailableProviders().includes(provider);
  }

  /**
   * Create payment intent/order with specified provider
   */
  async createPayment(
    provider: PaymentProvider, 
    request: PaymentRequest
  ): Promise<PaymentResponse> {
    try {
      if (!this.isProviderAvailable(provider)) {
        return {
          success: false,
          paymentId: '',
          provider,
          status: 'failed',
          error: `Payment provider ${provider} is not available or configured`
        };
      }

      switch (provider) {
        case 'stripe':
          return await this.createStripePayment(request);
        case 'paypal':
          return await this.createPayPalPayment(request);
        default:
          return {
            success: false,
            paymentId: '',
            provider,
            status: 'failed',
            error: `Unsupported payment provider: ${provider}`
          };
      }
    } catch (error) {
      console.error(`Payment creation failed for ${provider}:`, error);
      return {
        success: false,
        paymentId: '',
        provider,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Confirm/capture payment
   */
  async confirmPayment(
    provider: PaymentProvider,
    paymentId: string,
    confirmationData?: any
  ): Promise<PaymentConfirmation> {
    try {
      switch (provider) {
        case 'stripe':
          return await this.confirmStripePayment(paymentId, confirmationData);
        case 'paypal':
          return await this.confirmPayPalPayment(paymentId, confirmationData);
        default:
          return {
            success: false,
            paymentId,
            provider,
            status: 'failed',
            amount: 0,
            currency: 'GBP',
            error: `Unsupported payment provider: ${provider}`
          };
      }
    } catch (error) {
      console.error(`Payment confirmation failed for ${provider}:`, error);
      return {
        success: false,
        paymentId,
        provider,
        status: 'failed',
        amount: 0,
        currency: 'GBP',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(
    provider: PaymentProvider,
    paymentId: string
  ): Promise<{ status: PaymentStatus; error?: string }> {
    try {
      switch (provider) {
        case 'stripe':
          return await this.getStripePaymentStatus(paymentId);
        case 'paypal':
          return await this.getPayPalPaymentStatus(paymentId);
        default:
          return {
            status: 'failed',
            error: `Unsupported payment provider: ${provider}`
          };
      }
    } catch (error) {
      console.error(`Payment status check failed for ${provider}:`, error);
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Cancel payment
   */
  async cancelPayment(
    provider: PaymentProvider,
    paymentId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      switch (provider) {
        case 'stripe':
          return await this.cancelStripePayment(paymentId);
        case 'paypal':
          return await this.cancelPayPalPayment(paymentId);
        default:
          return {
            success: false,
            error: `Unsupported payment provider: ${provider}`
          };
      }
    } catch (error) {
      console.error(`Payment cancellation failed for ${provider}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get recommended payment provider based on various factors
   */
  getRecommendedProvider(
    amount: number,
    currency: Currency,
    customerCountry?: string
  ): PaymentProvider | null {
    const available = this.getAvailableProviders();
    
    if (available.length === 0) {
      return null;
    }

    // Simple logic - can be enhanced with more sophisticated rules
    if (available.includes('stripe')) {
      return 'stripe'; // Prefer Stripe for better UX and lower fees for card payments
    }
    
    if (available.includes('paypal')) {
      return 'paypal';
    }
    
    return available[0];
  }

  /**
   * Format amount for display
   */
  formatAmount(amount: number, currency: Currency): string {
    const formatter = new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    });
    
    return formatter.format(amount / 100); // Convert from pence to pounds
  }

  // Private methods for each provider

  private async createStripePayment(request: PaymentRequest): Promise<PaymentResponse> {
    const response = await fetch('/api/payments/stripe/payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId: request.bookingId,
        amount: request.amount,
        currency: request.currency.toLowerCase(),
        metadata: {
          ...request.metadata,
          description: request.description,
          customerEmail: request.customerInfo?.email,
          customerName: request.customerInfo?.name
        }
      })
    });

    const data = await response.json();

    if (data.success) {
      return {
        success: true,
        paymentId: data.paymentIntent.id,
        provider: 'stripe',
        status: 'pending',
        clientSecret: data.paymentIntent.client_secret,
        metadata: data.paymentIntent.metadata
      };
    } else {
      return {
        success: false,
        paymentId: '',
        provider: 'stripe',
        status: 'failed',
        error: data.error
      };
    }
  }

  private async createPayPalPayment(request: PaymentRequest): Promise<PaymentResponse> {
    const response = await fetch('/api/payments/paypal/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId: request.bookingId,
        amount: request.amount,
        currency: request.currency,
        returnUrl: `${window.location.origin}/payment/success`,
        cancelUrl: `${window.location.origin}/payment/cancel`
      })
    });

    const data = await response.json();

    if (data.success) {
      return {
        success: true,
        paymentId: data.orderId,
        provider: 'paypal',
        status: 'pending',
        approvalUrl: data.approvalUrl,
        redirectUrl: data.approvalUrl
      };
    } else {
      return {
        success: false,
        paymentId: '',
        provider: 'paypal',
        status: 'failed',
        error: data.error
      };
    }
  }

  private async confirmStripePayment(
    paymentId: string, 
    confirmationData?: any
  ): Promise<PaymentConfirmation> {
    const response = await fetch('/api/payments/stripe/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentIntentId: paymentId,
        ...confirmationData
      })
    });

    const data = await response.json();

    if (data.success) {
      return {
        success: true,
        paymentId: data.paymentIntent.id,
        provider: 'stripe',
        status: data.paymentIntent.status === 'succeeded' ? 'succeeded' : 'processing',
        transactionId: data.paymentIntent.charges?.data[0]?.id,
        amount: data.paymentIntent.amount,
        currency: data.paymentIntent.currency.toUpperCase() as Currency,
        paidAt: data.paymentIntent.charges?.data[0]?.created 
          ? new Date(data.paymentIntent.charges.data[0].created * 1000) 
          : undefined
      };
    } else {
      return {
        success: false,
        paymentId,
        provider: 'stripe',
        status: 'failed',
        amount: 0,
        currency: 'GBP',
        error: data.error
      };
    }
  }

  private async confirmPayPalPayment(
    paymentId: string, 
    confirmationData?: any
  ): Promise<PaymentConfirmation> {
    const response = await fetch('/api/payments/paypal/capture-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: paymentId,
        ...confirmationData
      })
    });

    const data = await response.json();

    if (data.success) {
      return {
        success: true,
        paymentId: data.order.id,
        provider: 'paypal',
        status: data.order.status === 'COMPLETED' ? 'succeeded' : 'processing',
        transactionId: data.order.purchase_units?.[0]?.payments?.captures?.[0]?.id,
        amount: Math.round(parseFloat(data.order.purchase_units?.[0]?.amount?.value || '0') * 100),
        currency: data.order.purchase_units?.[0]?.amount?.currency_code as Currency,
        paidAt: new Date()
      };
    } else {
      return {
        success: false,
        paymentId,
        provider: 'paypal',
        status: 'failed',
        amount: 0,
        currency: 'GBP',
        error: data.error
      };
    }
  }

  private async getStripePaymentStatus(paymentId: string): Promise<{ status: PaymentStatus; error?: string }> {
    // Implementation for Stripe payment status check
    return { status: 'pending' }; // Placeholder
  }

  private async getPayPalPaymentStatus(paymentId: string): Promise<{ status: PaymentStatus; error?: string }> {
    // Implementation for PayPal payment status check
    return { status: 'pending' }; // Placeholder
  }

  private async cancelStripePayment(paymentId: string): Promise<{ success: boolean; error?: string }> {
    // Implementation for Stripe payment cancellation
    return { success: false, error: 'Not implemented' };
  }

  private async cancelPayPalPayment(paymentId: string): Promise<{ success: boolean; error?: string }> {
    // Implementation for PayPal payment cancellation
    return { success: false, error: 'Not implemented' };
  }
}

// Export singleton instance
export const unifiedPaymentService = new UnifiedPaymentService();
export default unifiedPaymentService;