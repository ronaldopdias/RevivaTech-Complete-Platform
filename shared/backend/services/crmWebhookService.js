const axios = require('axios');

// CRM Webhook Service for sending data to external CRM system
class CRMWebhookService {
  constructor() {
    this.crmBaseUrl = process.env.CRM_WEBHOOK_URL || 'http://localhost:5001/webhooks';
    this.apiKey = process.env.CRM_API_KEY || 'your-webhook-api-key';
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
  }

  // Helper method to send webhook with retry logic
  async sendWebhook(endpoint, data, retries = 0) {
    try {
      const response = await axios.post(
        `${this.crmBaseUrl}${endpoint}`,
        data,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'X-Source': 'revivatech'
          },
          timeout: 10000 // 10 second timeout
        }
      );

      console.log(`CRM webhook sent successfully to ${endpoint}:`, response.data);
      return response.data;
    } catch (error) {
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
  async notifyCustomerRegistration(customerData) {
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
        ip: customerData.lastLoginIp || '',
        userAgent: customerData.userAgent || '',
        registrationSource: 'website',
        timestamp: new Date().toISOString()
      }
    };

    return this.sendWebhook('/customer-registration', payload);
  }

  // Send repair booking notification to CRM
  async notifyBookingCreated(bookingData, customerData) {
    const payload = {
      repair: {
        ticketNumber: bookingData.bookingNumber || `REV-${Date.now()}`,
        websiteRepairId: bookingData.id,
        customerEmail: customerData.email,
        customerName: `${customerData.firstName} ${customerData.lastName}`,
        deviceType: bookingData.deviceType,
        deviceModel: bookingData.deviceModel || '',
        issueDescription: bookingData.issueDescription,
        serviceType: bookingData.serviceType || 'repair',
        priority: bookingData.urgency || 'normal',
        language: bookingData.language || 'en',
        address: bookingData.serviceLocation || '',
        notes: bookingData.additionalNotes || '',
        createdAt: bookingData.createdAt || new Date().toISOString(),
        estimatedCost: bookingData.estimatedPrice || 0,
        photos: bookingData.photos || []
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
  async notifyPaymentStatus(paymentData, bookingData, customerData) {
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

  // Send customer profile update notification to CRM
  async notifyCustomerUpdate(customerData, changedFields) {
    const payload = {
      customer: {
        websiteUserId: customerData.id,
        email: customerData.email,
        updatedFields: changedFields,
        currentData: {
          firstName: customerData.firstName,
          lastName: customerData.lastName,
          phone: customerData.phone,
          address: customerData.address,
          language: customerData.language,
          preferences: customerData.preferences
        }
      },
      metadata: {
        source: 'revivatech',
        updatedAt: new Date().toISOString(),
        updateReason: 'profile_update'
      }
    };

    // Note: CRM doesn't have a customer update webhook endpoint yet
    // This is for future implementation
    console.log('Customer update notification prepared (CRM endpoint not available):', payload);
    return { success: true, message: 'Customer update logged' };
  }

  // Log failed webhooks for manual processing
  async logFailedWebhook(endpoint, data, error) {
    const failedWebhook = {
      endpoint,
      data,
      error: {
        message: error.message,
        code: error.code,
        response: error.response?.data
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
  async checkHealth() {
    try {
      const response = await axios.get(
        `${this.crmBaseUrl}/health`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          },
          timeout: 5000
        }
      );
      return {
        healthy: true,
        status: response.data
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }
}

// Create singleton instance
const crmWebhookService = new CRMWebhookService();

module.exports = crmWebhookService;