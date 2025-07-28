/**
 * CRM Integration - Export all CRM-related modules
 * Comprehensive CRM integration system for RevivaTech
 */

// Core CRM service
export { CRMService } from './CRMService';
export type {
  CRMServiceConfig,
  CRMProvider,
  CRMContact,
  CRMDeal,
  CRMActivity,
  CRMContactStatus,
  CRMDealStage,
  CRMActivityType,
  CRMServiceResponse,
  CRMSyncStatus,
  CRMWebhookEvent
} from './CRMService';

// CRM Integration Manager
export { CRMIntegrationManager } from './CRMIntegrationManager';
export type {
  CRMIntegrationStatus,
  CRMIntegrationConfig,
  CRMConflict,
  CRMSyncReport,
  CRMAnalytics
} from './CRMIntegrationManager';

// RevivaTech-specific CRM service
export { RevivaTechCRMService } from './RevivaTechCRMService';
export type {
  RevivaTechBooking,
  RevivaTechCustomer,
  RevivaTechRepair,
  RevivaTechCRMConfig
} from './RevivaTechCRMService';

// CRM Configuration
export {
  default as CRMConfiguration,
  DEFAULT_CRM_CONFIGS,
  DEFAULT_REVIVATECH_CRM_CONFIG,
  ENVIRONMENT_CONFIGS,
  createCRMServiceConfig,
  validateCRMConfig,
  getRecommendedConfig
} from './CRMConfiguration';

// Re-export common types for convenience
export type {
  ServiceAbstractionConfig,
  ServiceHealthCheck,
  ServiceMetrics
} from '../serviceAbstraction';

// Utility functions
export const CRMUtils = {
  /**
   * Check if a CRM provider is supported
   */
  isSupportedProvider(provider: string): provider is CRMProvider {
    const supportedProviders = ['hubspot', 'salesforce', 'pipedrive', 'zoho', 'freshsales', 'salesflare'];
    return supportedProviders.includes(provider);
  },

  /**
   * Get provider display name
   */
  getProviderDisplayName(provider: CRMProvider): string {
    const displayNames = {
      hubspot: 'HubSpot',
      salesforce: 'Salesforce',
      pipedrive: 'Pipedrive',
      zoho: 'Zoho CRM',
      freshsales: 'Freshsales',
      salesflare: 'Salesflare'
    };
    return displayNames[provider] || provider;
  },

  /**
   * Get provider documentation URL
   */
  getProviderDocsUrl(provider: CRMProvider): string {
    const docsUrls = {
      hubspot: 'https://developers.hubspot.com/docs/api/overview',
      salesforce: 'https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/',
      pipedrive: 'https://developers.pipedrive.com/docs/api/v1',
      zoho: 'https://www.zoho.com/crm/developer/docs/api/v2/',
      freshsales: 'https://developers.freshworks.com/crm/api/',
      salesflare: 'https://api.salesflare.com/docs'
    };
    return docsUrls[provider] || '';
  },

  /**
   * Format contact name
   */
  formatContactName(contact: CRMContact): string {
    return `${contact.firstName} ${contact.lastName}`.trim();
  },

  /**
   * Format deal title
   */
  formatDealTitle(deal: CRMDeal): string {
    return deal.title || `Deal ${deal.id}`;
  },

  /**
   * Format currency amount
   */
  formatCurrency(amount: number, currency: string = 'GBP'): string {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency
    }).format(amount);
  },

  /**
   * Calculate deal probability based on stage
   */
  calculateDealProbability(stage: CRMDealStage): number {
    const stageWeights = {
      'new': 0.1,
      'contacted': 0.25,
      'qualified': 0.5,
      'proposal': 0.75,
      'negotiation': 0.9,
      'closed_won': 1.0,
      'closed_lost': 0.0
    };
    return stageWeights[stage] || 0.5;
  },

  /**
   * Get status color for UI
   */
  getStatusColor(status: CRMContactStatus | CRMDealStage): string {
    const colors = {
      // Contact statuses
      'active': 'green',
      'inactive': 'gray',
      'prospect': 'blue',
      'customer': 'green',
      'lost': 'red',
      
      // Deal stages
      'new': 'blue',
      'contacted': 'yellow',
      'qualified': 'orange',
      'proposal': 'purple',
      'negotiation': 'indigo',
      'closed_won': 'green',
      'closed_lost': 'red'
    };
    return colors[status] || 'gray';
  },

  /**
   * Validate email address
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate phone number (UK format)
   */
  validatePhone(phone: string): boolean {
    const phoneRegex = /^(?:(?:\+44\s?|0)(?:\d{2}\s?\d{4}\s?\d{4}|\d{3}\s?\d{3}\s?\d{4}|\d{4}\s?\d{6}))$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  },

  /**
   * Generate unique ID
   */
  generateId(): string {
    return `crm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Deep merge objects
   */
  deepMerge(target: any, source: any): any {
    const result = { ...target };
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  },

  /**
   * Sanitize input for CRM
   */
  sanitizeInput(input: string): string {
    if (!input) return '';
    return input.trim().replace(/[<>]/g, '');
  },

  /**
   * Calculate sync interval based on activity level
   */
  calculateOptimalSyncInterval(activityLevel: 'low' | 'medium' | 'high'): number {
    const intervals = {
      'low': 600000,    // 10 minutes
      'medium': 300000, // 5 minutes
      'high': 60000     // 1 minute
    };
    return intervals[activityLevel] || 300000;
  }
};

// Default export for convenience
export default {
  CRMService,
  CRMIntegrationManager,
  RevivaTechCRMService,
  CRMConfiguration,
  CRMUtils
};