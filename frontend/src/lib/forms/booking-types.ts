// Enhanced booking form types and configuration system for RevivaTech
// Extends the base form schema with booking-specific field types and functionality

import { z } from 'zod';
import { FormFieldConfig, FormConfig, ValidationRule, FieldOption, ConditionalLogic } from './schema';

// Extended field types for booking system
export type BookingFieldType = 
  | 'device-search'           // Device search with autocomplete
  | 'conditional-group'       // Conditional field groups
  | 'radio-group'            // Enhanced radio groups with descriptions/icons
  | 'checkbox-group'         // Enhanced checkbox groups
  | 'multi-select'           // Multi-selection with search
  | 'quote-summary'          // Quote display and breakdown
  | 'booking-summary'        // Final booking summary
  | 'time-slot'              // Time slot selection
  | 'address'                // Address input with autocomplete
  | 'photo-upload'           // Photo upload for device damage
  | 'service-selector'       // Service selection with pricing
  | 'pricing-calculator'     // Dynamic pricing calculator
  | 'availability-calendar'  // Calendar for appointment booking
  | 'progress-indicator';    // Wizard progress display

// Enhanced field option with additional properties for booking
export interface BookingFieldOption extends FieldOption {
  icon?: string;
  color?: string;
  priceModifier?: number;
  additionalFee?: number;
  details?: Record<string, any>;
  default?: boolean;
  recommended?: boolean;
  popular?: boolean;
}

// Device search configuration
export interface DeviceSearchConfig {
  endpoint: string;
  debounceMs?: number;
  minSearchLength?: number;
  maxResults?: number;
  displayFields?: string[];
  groupBy?: string;
  sortBy?: 'popularity' | 'alphabetical' | 'newest' | 'price';
  filters?: Record<string, any>;
  template?: {
    item?: string;
    empty?: string;
    loading?: string;
  };
  showImages?: boolean;
  showSpecs?: boolean;
  allowCustomEntry?: boolean;
}

// Time slot configuration
export interface TimeSlotConfig {
  endpoint: string;
  timeSlots?: string[] | { value: string; label: string; available: boolean }[];
  maxDaysAhead?: number;
  excludeWeekends?: boolean;
  businessHours?: Record<string, { open: string; close: string } | { closed: true }>;
  slotDuration?: number; // minutes
  bufferTime?: number; // minutes between slots
}

// Quote summary configuration
export interface QuoteSummaryConfig {
  realTimeUpdate?: boolean;
  breakdown?: boolean;
  compareOptions?: boolean;
  validityPeriod?: number; // days
  showTaxes?: boolean;
  showDiscounts?: boolean;
  allowModifications?: boolean;
  currency?: string;
  formatting?: {
    decimals?: number;
    thousandsSeparator?: string;
    currencyPosition?: 'before' | 'after';
  };
}

// Address configuration
export interface AddressConfig {
  validation?: 'uk_postcode' | 'international' | 'custom';
  autocomplete?: boolean;
  components?: ('street' | 'city' | 'postcode' | 'country')[];
  defaultCountry?: string;
  restrictToCountries?: string[];
  geocoding?: boolean;
  mapPreview?: boolean;
}

// Photo upload configuration
export interface PhotoUploadConfig {
  maxFiles?: number;
  maxFileSize?: number; // bytes
  acceptedFormats?: string[];
  compression?: {
    enabled: boolean;
    quality?: number;
    maxWidth?: number;
    maxHeight?: number;
  };
  preview?: boolean;
  guidelines?: {
    show: boolean;
    instructions?: string[];
    examples?: string[];
  };
  aiAnalysis?: {
    enabled: boolean;
    endpoint?: string;
    autoDetectIssues?: boolean;
  };
}

// Conditional group configuration
export interface ConditionalGroupConfig {
  condition: ConditionalLogic;
  layout?: 'vertical' | 'horizontal' | 'grid';
  spacing?: 'compact' | 'normal' | 'relaxed';
  animation?: 'slide' | 'fade' | 'none';
  border?: boolean;
  background?: boolean;
}

// Pricing calculator configuration
export interface PricingCalculatorConfig {
  endpoint: string;
  realTime?: boolean;
  factors?: string[];
  modifiers?: {
    urgency?: Record<string, number>;
    serviceType?: Record<string, number>;
    complexity?: Record<string, number>;
  };
  display?: {
    breakdown?: boolean;
    comparison?: boolean;
    savings?: boolean;
    warranty?: boolean;
  };
  currency?: string;
  updateTriggers?: string[]; // field names that trigger recalculation
}

// Enhanced booking form field configuration
export interface BookingFormFieldConfig extends Omit<FormFieldConfig, 'type' | 'options'> {
  type: BookingFieldType;
  options?: BookingFieldOption[];
  
  // Booking-specific configurations
  config?: {
    deviceSearch?: DeviceSearchConfig;
    timeSlot?: TimeSlotConfig;
    quoteSummary?: QuoteSummaryConfig;
    address?: AddressConfig;
    photoUpload?: PhotoUploadConfig;
    conditionalGroup?: ConditionalGroupConfig;
    pricingCalculator?: PricingCalculatorConfig;
    
    // Generic configuration for extended functionality
    endpoint?: string;
    depends?: string | string[];
    realTimeUpdate?: boolean;
    searchable?: boolean;
    groupBy?: string;
    sortBy?: string;
    layout?: 'grid' | 'list' | 'horizontal' | 'vertical';
    maxSelections?: number;
    minSelections?: number;
    showPrices?: boolean;
    showDescriptions?: boolean;
    allowCustomInput?: boolean;
    suggestions?: {
      enabled: boolean;
      prompts?: string[];
      endpoint?: string;
    };
  };
  
  // Enhanced conditional logic
  conditions?: Array<{
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'exists' | 'greater_than' | 'less_than' | 'in' | 'not_in';
    value?: any;
    values?: any[];
  }>;
  
  // Field relationships
  dependencies?: string[];
  impacts?: string[]; // fields that are affected by changes to this field
  
  // Analytics and tracking
  analytics?: {
    trackInteractions?: boolean;
    trackAbandon?: boolean;
    trackTime?: boolean;
    eventName?: string;
  };
}

// Enhanced wizard step for booking
export interface BookingWizardStep {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  validation: 'none' | 'required' | 'optional';
  estimatedTime?: number; // seconds
  
  fields: BookingFormFieldConfig[];
  
  // Step-specific configuration
  skipConditions?: ConditionalLogic[];
  completionConditions?: ConditionalLogic[];
  navigationRules?: {
    canSkip?: boolean;
    canGoBack?: boolean;
    autoAdvance?: boolean;
    saveProgress?: boolean;
  };
  
  // Step analytics
  analytics?: {
    trackEntry?: boolean;
    trackExit?: boolean;
    trackTime?: boolean;
    trackAbandon?: boolean;
  };
}

// Enhanced wizard configuration
export interface BookingWizardConfig {
  enabled: boolean;
  persistProgress: boolean;
  allowBackNavigation: boolean;
  showProgress: boolean;
  progressType: 'steps' | 'percentage' | 'both';
  validationMode: 'step' | 'live' | 'final';
  
  steps: BookingWizardStep[];
  
  // Wizard behavior
  autoSave?: {
    enabled: boolean;
    interval?: number; // seconds
    storageKey?: string;
    expiry?: number; // milliseconds
  };
  
  // Navigation customization
  navigation?: {
    showStepNumbers?: boolean;
    showStepTitles?: boolean;
    allowJumpToStep?: boolean;
    animationType?: 'slide' | 'fade' | 'none';
    position?: 'top' | 'bottom' | 'sidebar';
  };
  
  // Integration points
  integrations?: {
    deviceDatabase?: {
      enabled: boolean;
      endpoint: string;
      searchable: boolean;
      filters: string[];
      sortBy: string;
    };
    pricing?: {
      enabled: boolean;
      endpoint: string;
      realTime: boolean;
      factors: string[];
    };
    scheduling?: {
      enabled: boolean;
      endpoint: string;
      timeSlots: boolean;
      businessHours: Record<string, { open: string; close: string } | { closed: true }>;
    };
    notifications?: {
      enabled: boolean;
      channels: string[];
      templates: Record<string, string>;
    };
  };
  
  // Analytics configuration
  analytics?: {
    trackSteps: boolean;
    trackAbandon: boolean;
    trackConversion: boolean;
    events: string[];
    provider?: 'google' | 'custom';
  };
}

// Complete booking form configuration
export interface BookingFormConfig extends Omit<FormConfig, 'steps' | 'fields'> {
  id: string;
  name: string;
  version: string;
  
  wizard: BookingWizardConfig;
  
  // Enhanced validation
  validation: {
    mode: 'onChange' | 'onBlur' | 'onSubmit';
    debounceMs?: number;
    showErrors: 'inline' | 'summary' | 'both';
    scrollToError?: boolean;
    highlightErrors?: boolean;
    realTimeValidation?: boolean;
  };
  
  // Enhanced submission
  submission: {
    endpoint: string;
    method: 'POST' | 'PUT' | 'PATCH';
    successRedirect?: string;
    errorHandling: {
      retryAttempts: number;
      retryDelay: number;
      showErrors: boolean;
      fallbackMode?: 'offline' | 'email' | 'phone';
    };
    dataTransformation?: {
      beforeSubmit?: string; // function name
      afterSubmit?: string; // function name
    };
  };
  
  // Enhanced persistence
  persistence: {
    enabled: boolean;
    storage: 'localStorage' | 'sessionStorage' | 'indexedDB';
    key: string;
    expiry?: number; // milliseconds
    encryptSensitiveData?: boolean;
    clearOnSubmit?: boolean;
  };
  
  // Booking-specific features
  features?: {
    realTimePricing?: boolean;
    deviceDetection?: boolean;
    photoAnalysis?: boolean;
    smartSuggestions?: boolean;
    autofill?: boolean;
    progressPersistence?: boolean;
  };
  
  // Security and compliance
  security?: {
    csrfProtection?: boolean;
    dataEncryption?: boolean;
    gdprCompliant?: boolean;
    retentionPolicy?: {
      sensitiveData?: number; // days
      generalData?: number; // days
      anonymizeAfter?: number; // days
    };
  };
}

// Validation schemas for booking fields
export const BookingFieldSchemas = {
  deviceSearch: z.object({
    device: z.object({
      id: z.string(),
      name: z.string(),
      brand: z.string(),
      category: z.string(),
      year: z.number().optional(),
    }).optional(),
    variant: z.string().optional(),
    storage: z.string().optional(),
    color: z.string().optional(),
  }),
  
  issueDescription: z.object({
    issues: z.array(z.string()).min(1, 'Please select at least one issue'),
    description: z.string().min(20, 'Please provide a detailed description (minimum 20 characters)'),
    urgency: z.enum(['standard', 'priority', 'emergency']),
    backup_status: z.enum(['backed_up', 'partial_backup', 'no_backup', 'not_important']),
  }),
  
  servicePreferences: z.object({
    service_type: z.enum(['drop_off', 'collection', 'postal']),
    contact_methods: z.array(z.enum(['email', 'sms', 'phone', 'whatsapp'])).min(1),
  }),
  
  customerDetails: z.object({
    full_name: z.string().min(2, 'Please enter your full name'),
    email: z.string().email('Please enter a valid email address'),
    phone: z.string().regex(/^[+]?[1-9]?[0-9]{7,15}$/, 'Please enter a valid phone number'),
    customer_type: z.enum(['individual', 'business']),
    company_name: z.string().optional(),
    vat_number: z.string().optional(),
  }),
  
  agreements: z.object({
    agreements: z.array(z.string()).min(4, 'Please accept all required agreements'),
    marketing_consent: z.boolean().optional(),
  }),
};

// Helper functions for booking form validation
export class BookingFormValidator {
  static validateStep(stepId: string, data: any): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};
    let isValid = true;
    
    try {
      switch (stepId) {
        case 'device-selection':
          BookingFieldSchemas.deviceSearch.parse(data);
          break;
        case 'issue-description':
          BookingFieldSchemas.issueDescription.parse(data);
          break;
        case 'service-preferences':
          BookingFieldSchemas.servicePreferences.parse(data);
          break;
        case 'customer-details':
          BookingFieldSchemas.customerDetails.parse(data);
          break;
        case 'confirmation':
          BookingFieldSchemas.agreements.parse(data);
          break;
        default:
          // No validation for other steps
          break;
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        isValid = false;
        error.errors.forEach(err => {
          const field = err.path.join('.');
          errors[field] = err.message;
        });
      }
    }
    
    return { isValid, errors };
  }
  
  static validateConditionalLogic(conditions: ConditionalLogic[], formData: any): boolean {
    return conditions.every(condition => {
      const fieldValue = formData[condition.field];
      
      switch (condition.operator) {
        case 'equals':
          return fieldValue === condition.value;
        case 'not_equals':
          return fieldValue !== condition.value;
        case 'contains':
          return Array.isArray(fieldValue) && fieldValue.includes(condition.value);
        case 'not_contains':
          return !Array.isArray(fieldValue) || !fieldValue.includes(condition.value);
        case 'greater_than':
          return Number(fieldValue) > Number(condition.value);
        case 'less_than':
          return Number(fieldValue) < Number(condition.value);
        default:
          return true;
      }
    });
  }
  
  static checkFieldDependencies(field: BookingFormFieldConfig, formData: any): boolean {
    if (!field.dependencies) return true;
    
    return field.dependencies.every(dep => {
      const value = formData[dep];
      return value !== undefined && value !== null && value !== '';
    });
  }
}

// Default booking form configuration factory
export class BookingFormConfigFactory {
  static createDefaultConfig(): BookingFormConfig {
    return {
      id: 'repair-booking-wizard',
      name: 'Repair Booking Wizard',
      version: '3.0',
      title: 'Book Your Repair',
      description: 'Professional device repair booking system',
      
      wizard: {
        enabled: true,
        persistProgress: true,
        allowBackNavigation: true,
        showProgress: true,
        progressType: 'steps',
        validationMode: 'step',
        steps: [], // To be populated with actual steps
        
        autoSave: {
          enabled: true,
          interval: 30,
          storageKey: 'revivatech_booking_progress',
          expiry: 24 * 60 * 60 * 1000, // 24 hours
        },
        
        navigation: {
          showStepNumbers: true,
          showStepTitles: true,
          allowJumpToStep: false,
          animationType: 'slide',
          position: 'top',
        },
        
        analytics: {
          trackSteps: true,
          trackAbandon: true,
          trackConversion: true,
          events: [
            'booking_started',
            'device_selected',
            'issues_selected',
            'quote_generated',
            'customer_details_entered',
            'booking_completed'
          ],
          provider: 'google',
        },
      },
      
      validation: {
        mode: 'onChange',
        debounceMs: 300,
        showErrors: 'inline',
        scrollToError: true,
        highlightErrors: true,
        realTimeValidation: true,
      },
      
      submission: {
        endpoint: '/api/bookings',
        method: 'POST',
        successRedirect: '/booking/success',
        errorHandling: {
          retryAttempts: 3,
          retryDelay: 1000,
          showErrors: true,
          fallbackMode: 'email',
        },
      },
      
      persistence: {
        enabled: true,
        storage: 'localStorage',
        key: 'revivatech_booking_progress',
        expiry: 24 * 60 * 60 * 1000, // 24 hours
        encryptSensitiveData: true,
        clearOnSubmit: true,
      },
      
      features: {
        realTimePricing: true,
        deviceDetection: true,
        photoAnalysis: true,
        smartSuggestions: true,
        autofill: true,
        progressPersistence: true,
      },
      
      security: {
        csrfProtection: true,
        dataEncryption: true,
        gdprCompliant: true,
        retentionPolicy: {
          sensitiveData: 30,
          generalData: 365,
          anonymizeAfter: 1095, // 3 years
        },
      },
    };
  }
}

export default BookingFormConfig;