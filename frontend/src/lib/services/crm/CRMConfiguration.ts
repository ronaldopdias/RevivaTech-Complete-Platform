/**
 * CRM Configuration - Default configurations for popular CRM providers
 * Production-ready configurations with RevivaTech business logic
 */

import { CRMServiceConfig, CRMProvider } from './CRMService';
import { RevivaTechCRMConfig } from './RevivaTechCRMService';

// Default CRM provider configurations
export const DEFAULT_CRM_CONFIGS: Record<CRMProvider, Partial<CRMServiceConfig>> = {
  hubspot: {
    type: 'CRM',
    options: {
      provider: 'hubspot',
      apiUrl: 'https://api.hubapi.com',
      rateLimits: {
        requestsPerSecond: 10,
        requestsPerMinute: 150,
        requestsPerHour: 40000
      },
      contactFields: {
        firstName: 'firstname',
        lastName: 'lastname',
        email: 'email',
        phone: 'phone',
        company: 'company',
        jobTitle: 'jobtitle',
        customerId: 'customer_id',
        deviceType: 'device_type',
        deviceModel: 'device_model',
        serviceType: 'service_type',
        totalSpent: 'total_spent',
        repairCount: 'repair_count',
        vipStatus: 'vip_status',
        loyaltyPoints: 'loyalty_points',
        lastBookingDate: 'last_booking_date',
        preferredContact: 'preferred_contact_method',
        marketingConsent: 'marketing_consent'
      },
      dealFields: {
        title: 'dealname',
        value: 'amount',
        stage: 'dealstage',
        contactId: 'associatedvids',
        expectedCloseDate: 'closedate',
        source: 'leadsource',
        bookingId: 'booking_id',
        deviceType: 'device_type',
        deviceModel: 'device_model',
        issueDescription: 'issue_description',
        serviceType: 'service_type',
        urgency: 'urgency',
        paymentStatus: 'payment_status',
        trackingNumber: 'tracking_number'
      },
      features: {
        contacts: true,
        deals: true,
        companies: true,
        activities: true,
        notes: true,
        tasks: true,
        webhooks: true,
        realTimeSync: true
      }
    }
  },

  salesforce: {
    type: 'CRM',
    options: {
      provider: 'salesforce',
      apiUrl: 'https://login.salesforce.com',
      rateLimits: {
        requestsPerSecond: 20,
        requestsPerMinute: 1000,
        requestsPerHour: 15000
      },
      contactFields: {
        firstName: 'FirstName',
        lastName: 'LastName',
        email: 'Email',
        phone: 'Phone',
        company: 'Account.Name',
        jobTitle: 'Title',
        customerId: 'Customer_ID__c',
        deviceType: 'Device_Type__c',
        deviceModel: 'Device_Model__c',
        serviceType: 'Service_Type__c',
        totalSpent: 'Total_Spent__c',
        repairCount: 'Repair_Count__c',
        vipStatus: 'VIP_Status__c',
        loyaltyPoints: 'Loyalty_Points__c',
        lastBookingDate: 'Last_Booking_Date__c',
        preferredContact: 'Preferred_Contact_Method__c',
        marketingConsent: 'Marketing_Consent__c'
      },
      dealFields: {
        title: 'Name',
        value: 'Amount',
        stage: 'StageName',
        contactId: 'ContactId',
        expectedCloseDate: 'CloseDate',
        source: 'LeadSource',
        bookingId: 'Booking_ID__c',
        deviceType: 'Device_Type__c',
        deviceModel: 'Device_Model__c',
        issueDescription: 'Issue_Description__c',
        serviceType: 'Service_Type__c',
        urgency: 'Urgency__c',
        paymentStatus: 'Payment_Status__c',
        trackingNumber: 'Tracking_Number__c'
      },
      features: {
        contacts: true,
        deals: true,
        companies: true,
        activities: true,
        notes: true,
        tasks: true,
        webhooks: true,
        realTimeSync: true
      }
    }
  },

  pipedrive: {
    type: 'CRM',
    options: {
      provider: 'pipedrive',
      apiUrl: 'https://api.pipedrive.com/v1',
      rateLimits: {
        requestsPerSecond: 10,
        requestsPerMinute: 600,
        requestsPerHour: 10000
      },
      contactFields: {
        firstName: 'first_name',
        lastName: 'last_name',
        email: 'email',
        phone: 'phone',
        company: 'org_name',
        jobTitle: 'job_title',
        customerId: 'customer_id',
        deviceType: 'device_type',
        deviceModel: 'device_model',
        serviceType: 'service_type',
        totalSpent: 'total_spent',
        repairCount: 'repair_count',
        vipStatus: 'vip_status',
        loyaltyPoints: 'loyalty_points',
        lastBookingDate: 'last_booking_date',
        preferredContact: 'preferred_contact_method',
        marketingConsent: 'marketing_consent'
      },
      dealFields: {
        title: 'title',
        value: 'value',
        stage: 'stage_id',
        contactId: 'person_id',
        expectedCloseDate: 'expected_close_date',
        source: 'origin',
        bookingId: 'booking_id',
        deviceType: 'device_type',
        deviceModel: 'device_model',
        issueDescription: 'issue_description',
        serviceType: 'service_type',
        urgency: 'urgency',
        paymentStatus: 'payment_status',
        trackingNumber: 'tracking_number'
      },
      features: {
        contacts: true,
        deals: true,
        companies: true,
        activities: true,
        notes: true,
        tasks: true,
        webhooks: true,
        realTimeSync: true
      }
    }
  },

  zoho: {
    type: 'CRM',
    options: {
      provider: 'zoho',
      apiUrl: 'https://www.zohoapis.com/crm/v2',
      rateLimits: {
        requestsPerSecond: 10,
        requestsPerMinute: 200,
        requestsPerHour: 10000
      },
      contactFields: {
        firstName: 'First_Name',
        lastName: 'Last_Name',
        email: 'Email',
        phone: 'Phone',
        company: 'Account_Name',
        jobTitle: 'Title',
        customerId: 'Customer_ID',
        deviceType: 'Device_Type',
        deviceModel: 'Device_Model',
        serviceType: 'Service_Type',
        totalSpent: 'Total_Spent',
        repairCount: 'Repair_Count',
        vipStatus: 'VIP_Status',
        loyaltyPoints: 'Loyalty_Points',
        lastBookingDate: 'Last_Booking_Date',
        preferredContact: 'Preferred_Contact_Method',
        marketingConsent: 'Marketing_Consent'
      },
      dealFields: {
        title: 'Deal_Name',
        value: 'Amount',
        stage: 'Stage',
        contactId: 'Contact_Name',
        expectedCloseDate: 'Closing_Date',
        source: 'Lead_Source',
        bookingId: 'Booking_ID',
        deviceType: 'Device_Type',
        deviceModel: 'Device_Model',
        issueDescription: 'Issue_Description',
        serviceType: 'Service_Type',
        urgency: 'Urgency',
        paymentStatus: 'Payment_Status',
        trackingNumber: 'Tracking_Number'
      },
      features: {
        contacts: true,
        deals: true,
        companies: true,
        activities: true,
        notes: true,
        tasks: true,
        webhooks: true,
        realTimeSync: true
      }
    }
  },

  freshsales: {
    type: 'CRM',
    options: {
      provider: 'freshsales',
      apiUrl: 'https://domain.freshsales.io/api',
      rateLimits: {
        requestsPerSecond: 5,
        requestsPerMinute: 300,
        requestsPerHour: 5000
      },
      contactFields: {
        firstName: 'first_name',
        lastName: 'last_name',
        email: 'email',
        phone: 'mobile_number',
        company: 'account_name',
        jobTitle: 'job_title',
        customerId: 'customer_id',
        deviceType: 'device_type',
        deviceModel: 'device_model',
        serviceType: 'service_type',
        totalSpent: 'total_spent',
        repairCount: 'repair_count',
        vipStatus: 'vip_status',
        loyaltyPoints: 'loyalty_points',
        lastBookingDate: 'last_booking_date',
        preferredContact: 'preferred_contact_method',
        marketingConsent: 'marketing_consent'
      },
      dealFields: {
        title: 'name',
        value: 'amount',
        stage: 'sales_stage',
        contactId: 'contact_id',
        expectedCloseDate: 'expected_close',
        source: 'lead_source',
        bookingId: 'booking_id',
        deviceType: 'device_type',
        deviceModel: 'device_model',
        issueDescription: 'issue_description',
        serviceType: 'service_type',
        urgency: 'urgency',
        paymentStatus: 'payment_status',
        trackingNumber: 'tracking_number'
      },
      features: {
        contacts: true,
        deals: true,
        companies: true,
        activities: true,
        notes: true,
        tasks: true,
        webhooks: true,
        realTimeSync: true
      }
    }
  },

  salesflare: {
    type: 'CRM',
    options: {
      provider: 'salesflare',
      apiUrl: 'https://api.salesflare.com',
      rateLimits: {
        requestsPerSecond: 10,
        requestsPerMinute: 300,
        requestsPerHour: 5000
      },
      contactFields: {
        firstName: 'firstname',
        lastName: 'lastname',
        email: 'email',
        phone: 'phone_number',
        company: 'account_name',
        jobTitle: 'position',
        customerId: 'customer_id',
        deviceType: 'device_type',
        deviceModel: 'device_model',
        serviceType: 'service_type',
        totalSpent: 'total_spent',
        repairCount: 'repair_count',
        vipStatus: 'vip_status',
        loyaltyPoints: 'loyalty_points',
        lastBookingDate: 'last_booking_date',
        preferredContact: 'preferred_contact_method',
        marketingConsent: 'marketing_consent'
      },
      dealFields: {
        title: 'name',
        value: 'value',
        stage: 'stage',
        contactId: 'contact_id',
        expectedCloseDate: 'expected_close_date',
        source: 'origin',
        bookingId: 'booking_id',
        deviceType: 'device_type',
        deviceModel: 'device_model',
        issueDescription: 'issue_description',
        serviceType: 'service_type',
        urgency: 'urgency',
        paymentStatus: 'payment_status',
        trackingNumber: 'tracking_number'
      },
      features: {
        contacts: true,
        deals: true,
        companies: true,
        activities: true,
        notes: true,
        tasks: true,
        webhooks: true,
        realTimeSync: true
      }
    }
  }
};

// RevivaTech-specific CRM configuration
export const DEFAULT_REVIVATECH_CRM_CONFIG: RevivaTechCRMConfig = {
  contactMapping: {
    primaryFields: ['firstName', 'lastName', 'email', 'phone'],
    customFields: {
      'customerId': 'customer_id',
      'deviceType': 'device_type',
      'deviceModel': 'device_model',
      'serviceType': 'service_type',
      'totalSpent': 'total_spent',
      'repairCount': 'repair_count',
      'vipStatus': 'vip_status',
      'loyaltyPoints': 'loyalty_points',
      'lastBookingDate': 'last_booking_date',
      'preferredContact': 'preferred_contact_method',
      'marketingConsent': 'marketing_consent'
    }
  },
  dealMapping: {
    primaryFields: ['title', 'value', 'stage', 'expectedCloseDate'],
    customFields: {
      'bookingId': 'booking_id',
      'deviceType': 'device_type',
      'deviceModel': 'device_model',
      'issueDescription': 'issue_description',
      'serviceType': 'service_type',
      'urgency': 'urgency',
      'paymentStatus': 'payment_status',
      'trackingNumber': 'tracking_number',
      'repairId': 'repair_id',
      'assignedTechnician': 'assigned_technician',
      'warrantyPeriod': 'warranty_period'
    },
    stageMapping: {
      'pending': 'new',
      'confirmed': 'qualified',
      'in-progress': 'proposal',
      'completed': 'closed_won',
      'cancelled': 'closed_lost'
    }
  },
  activityMapping: {
    repairStages: {
      'pending': 'Repair booking received',
      'confirmed': 'Repair booking confirmed',
      'diagnosed': 'Device diagnosed',
      'waiting_parts': 'Waiting for parts',
      'in_progress': 'Repair in progress',
      'completed': 'Repair completed',
      'cancelled': 'Repair cancelled'
    },
    notifications: [
      'booking_created',
      'booking_confirmed',
      'repair_started',
      'repair_completed',
      'payment_received',
      'review_submitted'
    ]
  },
  automationRules: {
    createDealOnBooking: true,
    updateDealOnStatusChange: true,
    createActivityOnRepairUpdate: true,
    sendNotificationOnCompletion: true
  },
  businessRules: {
    vipCustomerThreshold: 500, // £500 total spent
    loyaltyPointsRate: 0.01, // 1 point per £1 spent
    followUpDays: 7, // 7 days after completion
    warrantyPeriod: 6 // 6 months warranty
  }
};

// Environment-specific configurations
export const ENVIRONMENT_CONFIGS = {
  development: {
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
    circuitBreakerThreshold: 5,
    healthCheckInterval: 60000,
    syncInterval: 300000, // 5 minutes
    enableWebhooks: false,
    features: {
      realTimeSync: false
    }
  },
  staging: {
    timeout: 20000,
    retryAttempts: 5,
    retryDelay: 2000,
    circuitBreakerThreshold: 3,
    healthCheckInterval: 30000,
    syncInterval: 180000, // 3 minutes
    enableWebhooks: true,
    features: {
      realTimeSync: true
    }
  },
  production: {
    timeout: 10000,
    retryAttempts: 5,
    retryDelay: 1000,
    circuitBreakerThreshold: 3,
    healthCheckInterval: 30000,
    syncInterval: 60000, // 1 minute
    enableWebhooks: true,
    features: {
      realTimeSync: true
    }
  }
};

/**
 * Create CRM service configuration for a specific provider
 */
export function createCRMServiceConfig(
  provider: CRMProvider,
  credentials: {
    apiKey?: string;
    clientId?: string;
    clientSecret?: string;
    accessToken?: string;
    refreshToken?: string;
    domain?: string;
  },
  environment: 'development' | 'staging' | 'production' = 'development'
): CRMServiceConfig {
  const baseConfig = DEFAULT_CRM_CONFIGS[provider];
  const envConfig = ENVIRONMENT_CONFIGS[environment];
  
  return {
    id: `${provider}-${environment}`,
    type: 'CRM',
    name: `${provider.toUpperCase()} CRM (${environment})`,
    description: `${provider.toUpperCase()} CRM integration for RevivaTech`,
    enabled: true,
    priority: 1,
    environment,
    version: '1.0.0',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...envConfig,
    options: {
      ...baseConfig.options,
      ...credentials,
      syncInterval: envConfig.syncInterval,
      features: {
        ...baseConfig.options?.features,
        ...envConfig.features
      }
    }
  } as CRMServiceConfig;
}

/**
 * Validate CRM configuration
 */
export function validateCRMConfig(config: CRMServiceConfig): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields validation
  if (!config.id) errors.push('Service ID is required');
  if (!config.name) errors.push('Service name is required');
  if (!config.options.provider) errors.push('CRM provider is required');

  // Provider-specific validation
  switch (config.options.provider) {
    case 'hubspot':
      if (!config.options.apiKey) errors.push('HubSpot API key is required');
      break;
    case 'salesforce':
      if (!config.options.clientId) errors.push('Salesforce client ID is required');
      if (!config.options.clientSecret) errors.push('Salesforce client secret is required');
      break;
    case 'pipedrive':
      if (!config.options.apiKey) errors.push('Pipedrive API key is required');
      if (!config.options.domain) errors.push('Pipedrive domain is required');
      break;
    case 'zoho':
      if (!config.options.accessToken) errors.push('Zoho access token is required');
      break;
    case 'freshsales':
      if (!config.options.apiKey) errors.push('Freshsales API key is required');
      if (!config.options.domain) errors.push('Freshsales domain is required');
      break;
    case 'salesflare':
      if (!config.options.apiKey) errors.push('Salesflare API key is required');
      break;
  }

  // Performance warnings
  if (config.timeout && config.timeout > 30000) {
    warnings.push('Timeout is set to more than 30 seconds, this may cause performance issues');
  }

  if (config.retryAttempts && config.retryAttempts > 5) {
    warnings.push('Retry attempts set to more than 5, this may cause delays');
  }

  if (config.options.rateLimits?.requestsPerSecond && config.options.rateLimits.requestsPerSecond > 100) {
    warnings.push('Rate limit is set very high, ensure your CRM provider supports this');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Get recommended configuration for a provider
 */
export function getRecommendedConfig(provider: CRMProvider, environment: 'development' | 'staging' | 'production'): Partial<CRMServiceConfig> {
  const baseConfig = DEFAULT_CRM_CONFIGS[provider];
  const envConfig = ENVIRONMENT_CONFIGS[environment];
  
  return {
    ...baseConfig,
    ...envConfig,
    options: {
      ...baseConfig.options,
      syncInterval: envConfig.syncInterval,
      features: {
        ...baseConfig.options?.features,
        ...envConfig.features
      }
    }
  };
}

export default {
  DEFAULT_CRM_CONFIGS,
  DEFAULT_REVIVATECH_CRM_CONFIG,
  ENVIRONMENT_CONFIGS,
  createCRMServiceConfig,
  validateCRMConfig,
  getRecommendedConfig
};