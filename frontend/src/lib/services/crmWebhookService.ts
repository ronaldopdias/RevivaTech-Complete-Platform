// CRM Webhook Service for Next.js API routes
// This service sends notifications to the external CRM system

interface CustomerData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  createdAt?: string;
  language?: string;
  preferences?: any;
}

interface BookingData {
  id: string;
  bookingNumber: string;
  deviceType: string;
  deviceModel: string;
  issueDescription: string;
  serviceType: string;
  urgency: string;
  language: string;
  serviceLocation: string;
  additionalNotes?: string;
  estimatedPrice: number;
  photos: string[];
  createdAt: string;
}

class CRMWebhookService {
  private crmBaseUrl: string;
  private apiKey: string;
  private maxRetries: number = 3;
  private retryDelay: number = 1000; // 1 second

  constructor() {
    this.crmBaseUrl = process.env.CRM_WEBHOOK_URL || 'http://localhost:5001/webhooks';
    this.apiKey = process.env.CRM_API_KEY || 'your-webhook-api-key';
  }

  // Helper method to send webhook with retry logic
  private async sendWebhook(endpoint: string, data: any, retries: number = 0): Promise<any> {
    try {
      const response = await fetch(`${this.crmBaseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'X-Source': 'revivatech'
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`CRM webhook sent successfully to ${endpoint}:`, result);
      return result;
    } catch (error: any) {
      console.error(`CRM webhook error (attempt ${retries + 1}):`, error.message);

      // Retry logic
      if (retries < this.maxRetries) {
        console.log(`Retrying webhook in ${this.retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * (retries + 1)));
        return this.sendWebhook(endpoint, data, retries + 1);
      }

      // Log failed webhook for manual processing
      await this.logFailedWebhook(endpoint, data, error);
      throw error;
    }
  }

  // Send customer registration notification to CRM
  async notifyCustomerRegistration(customerData: CustomerData): Promise<any> {
    const payload = {
      customer: {
        firstName: customerData.firstName,
        lastName: customerData.lastName,
        email: customerData.email,
        phone: customerData.phone || '',
        websiteUserId: customerData.id,
        registrationDate: customerData.createdAt || new Date().toISOString(),
        source: 'revivatech',
        language: customerData.language || 'en',
        status: 'pending_approval',
        preferences: customerData.preferences || {}
      },
      metadata: {
        registrationSource: 'website',
        timestamp: new Date().toISOString()
      }
    };

    return this.sendWebhook('/customer-registration', payload);
  }

  // Send repair booking notification to CRM
  async notifyBookingCreated(bookingData: BookingData, customerData: CustomerData): Promise<any> {
    const payload = {
      repair: {
        ticketNumber: bookingData.bookingNumber,
        websiteRepairId: bookingData.id,
        customerEmail: customerData.email,
        customerName: `${customerData.firstName} ${customerData.lastName}`,
        deviceType: bookingData.deviceType,
        deviceModel: bookingData.deviceModel,
        issueDescription: bookingData.issueDescription,
        serviceType: bookingData.serviceType,
        priority: bookingData.urgency === 'URGENT' ? 'urgent' : 'normal',
        language: bookingData.language,
        address: bookingData.serviceLocation,
        notes: bookingData.additionalNotes || '',
        createdAt: bookingData.createdAt,
        estimatedCost: bookingData.estimatedPrice,
        photos: bookingData.photos
      },
      customer: {
        firstName: customerData.firstName,
        lastName: customerData.lastName,
        email: customerData.email,
        phone: customerData.phone || '',
        websiteUserId: customerData.id
      },
      metadata: {
        source: 'revivatech',
        bookingChannel: 'website',
        timestamp: new Date().toISOString()
      }
    };

    return this.sendWebhook('/repair-request', payload);
  }

  // Send payment status notification to CRM
  async notifyPaymentStatus(paymentData: any, bookingData: BookingData, customerData: CustomerData): Promise<any> {
    const payload = {
      payment: {
        paymentId: paymentData.id,
        bookingId: bookingData.id,
        ticketNumber: bookingData.bookingNumber,
        amount: paymentData.amount,
        currency: paymentData.currency || 'GBP',
        status: paymentData.status,
        method: paymentData.method,
        transactionId: paymentData.transactionId || '',
        processedAt: paymentData.processedAt || new Date().toISOString()
      },
      customer: {
        email: customerData.email,
        websiteUserId: customerData.id
      },
      metadata: {
        source: 'revivatech',
        timestamp: new Date().toISOString()
      }
    };

    // Note: CRM doesn't have a payment webhook endpoint yet
    // This is for future implementation
    console.log('Payment notification prepared (CRM endpoint not available):', payload);
    return { success: true, message: 'Payment notification logged' };
  }

  // Log failed webhooks for manual processing
  private async logFailedWebhook(endpoint: string, data: any, error: any): Promise<void> {
    const failedWebhook = {
      endpoint,
      data,
      error: {
        message: error.message,
        code: error.code,
      },
      timestamp: new Date().toISOString(),
      retryCount: this.maxRetries
    };

    // In production, this should be saved to database or queue
    console.error('Failed webhook logged:', JSON.stringify(failedWebhook, null, 2));
    
    // You could implement a failed webhook queue here
    // Example: await saveToFailedWebhookQueue(failedWebhook);
  }

  // Health check for CRM webhook endpoint
  async checkHealth(): Promise<{ healthy: boolean; status?: any; error?: string }> {
    try {
      const response = await fetch(`${this.crmBaseUrl}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
      });

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }

      const status = await response.json();
      return {
        healthy: true,
        status
      };
    } catch (error: any) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }
}

// Create singleton instance
const crmWebhookService = new CRMWebhookService();

export default crmWebhookService;