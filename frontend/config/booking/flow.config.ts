// Enhanced booking flow configuration system for RevivaTech
// Production-ready multi-step booking with advanced features

import { BookingFormConfig, BookingWizardStep, BookingFormFieldConfig } from '@/lib/forms/booking-types';

// Booking flow states and transitions
export interface BookingFlowState {
  id: string;
  name: string;
  description?: string;
  stepIndex: number;
  requiredData: string[];
  optionalData?: string[];
  validationRules?: string[];
  nextStates: string[];
  previousStates: string[];
  canSkip?: boolean;
  timeoutMinutes?: number;
}

// Flow configuration for state management
export interface BookingFlowConfig {
  id: string;
  name: string;
  version: string;
  
  // Flow definition
  initialState: string;
  finalStates: string[];
  states: BookingFlowState[];
  
  // Global flow settings
  settings: {
    allowBackNavigation: boolean;
    persistProgress: boolean;
    sessionTimeout: number; // minutes
    maxRetries: number;
    autoSave: boolean;
    autoSaveInterval: number; // seconds
  };
  
  // Integration points
  integrations: {
    deviceDatabase: {
      endpoint: string;
      cacheTimeout: number;
      fallbackMode: 'static' | 'manual';
    };
    pricingEngine: {
      endpoint: string;
      realTime: boolean;
      recalculateOnChange: string[];
    };
    availabilityService: {
      endpoint: string;
      refreshInterval: number;
      timezone: string;
    };
    notificationService: {
      endpoint: string;
      channels: string[];
      templates: Record<string, string>;
    };
  };
  
  // Business rules
  businessRules: {
    minimumBookingNotice: number; // hours
    maximumBookingAdvance: number; // days
    blackoutDates: string[];
    specialPricing: {
      urgentSurcharge: number;
      weekendSurcharge: number;
      holidaySurcharge: number;
    };
    serviceLimits: {
      maxPhotosPerBooking: number;
      maxIssuesPerDevice: number;
      maxDevicesPerBooking: number;
    };
  };
  
  // Analytics and tracking
  analytics: {
    trackingEvents: string[];
    conversionGoals: string[];
    abandonmentTracking: boolean;
    performanceMetrics: boolean;
  };
}

// Enhanced device selection configuration
const deviceSelectionStep: BookingWizardStep = {
  id: 'device-selection',
  title: 'Select Your Device',
  description: 'Choose the device that needs repair',
  icon: 'smartphone',
  validation: 'required',
  estimatedTime: 90,
  
  fields: [
    {
      id: 'device_search',
      type: 'device-search',
      name: 'device',
      label: 'Find Your Device',
      placeholder: 'Search by brand, model, or type (e.g., iPhone 14 Pro)',
      required: true,
      config: {
        deviceSearch: {
          endpoint: '/api/devices/search',
          debounceMs: 300,
          minSearchLength: 2,
          maxResults: 25,
          displayFields: ['name', 'brand', 'year', 'category', 'image'],
          groupBy: 'brand',
          sortBy: 'popularity',
          filters: {
            available: true,
            supported: true,
            inStock: true
          },
          template: {
            item: 'device-search-card',
            empty: 'No devices found. Try a different search term or contact us for help.',
            loading: 'Searching our device database...'
          },
          showImages: true,
          showSpecs: true,
          allowCustomEntry: true,
        }
      },
      analytics: {
        trackInteractions: true,
        trackTime: true,
        eventName: 'device_search_interaction'
      }
    },
    
    {
      id: 'device_details',
      type: 'conditional-group',
      name: 'device_details',
      conditions: [
        {
          field: 'device',
          operator: 'exists'
        }
      ],
      config: {
        conditionalGroup: {
          condition: {
            field: 'device',
            operator: 'equals',
            value: true
          },
          layout: 'grid',
          spacing: 'normal',
          animation: 'slide',
          border: true,
          background: false
        }
      },
      fields: [
        {
          id: 'model_variant',
          type: 'select',
          name: 'variant',
          label: 'Model Variant',
          placeholder: 'Select specific variant',
          required: false,
          config: {
            depends: 'device',
            endpoint: '/api/devices/{device.id}/variants',
            searchable: true,
            groupBy: 'category'
          }
        },
        {
          id: 'storage_capacity',
          type: 'select',
          name: 'storage',
          label: 'Storage Capacity',
          placeholder: 'Select if known',
          required: false,
          options: [
            { value: '64gb', label: '64GB', description: 'Base model' },
            { value: '128gb', label: '128GB', description: 'Standard', popular: true },
            { value: '256gb', label: '256GB', description: 'Popular choice' },
            { value: '512gb', label: '512GB', description: 'High capacity' },
            { value: '1tb', label: '1TB', description: 'Maximum' },
            { value: 'unknown', label: 'Unknown/Not sure', description: 'We can help identify' }
          ]
        },
        {
          id: 'device_color',
          type: 'select',
          name: 'color',
          label: 'Device Color',
          placeholder: 'Select color',
          required: false,
          config: {
            depends: 'device',
            endpoint: '/api/devices/{device.id}/colors'
          }
        },
        {
          id: 'purchase_date',
          type: 'date',
          name: 'purchase_date',
          label: 'Approximate Purchase Date',
          placeholder: 'When did you get this device?',
          required: false,
          config: {
            maxDate: 'today',
            minDate: '2010-01-01',
            helpText: 'Helps us determine warranty status and parts availability'
          }
        }
      ]
    },
    
    {
      id: 'device_condition',
      type: 'radio-group',
      name: 'condition',
      label: 'Current Device Condition',
      description: 'This helps us prepare for your repair and provide accurate estimates',
      required: true,
      config: {
        layout: 'grid',
        showDescriptions: true
      },
      options: [
        {
          value: 'excellent',
          label: 'Excellent',
          description: 'Minor issues, device is mostly functional',
          icon: 'star',
          color: 'green',
          priceModifier: 1.0
        },
        {
          value: 'good',
          label: 'Good',
          description: 'Some issues but still usable daily',
          icon: 'thumbs-up',
          color: 'blue',
          priceModifier: 1.1
        },
        {
          value: 'fair',
          label: 'Fair',
          description: 'Multiple issues, limited functionality',
          icon: 'alert-triangle',
          color: 'yellow',
          priceModifier: 1.2
        },
        {
          value: 'poor',
          label: 'Poor',
          description: 'Severely damaged, barely functional or not working',
          icon: 'x-circle',
          color: 'red',
          priceModifier: 1.3
        }
      ]
    }
  ],
  
  navigationRules: {
    canSkip: false,
    canGoBack: false,
    autoAdvance: false,
    saveProgress: true
  },
  
  analytics: {
    trackEntry: true,
    trackExit: true,
    trackTime: true,
    trackAbandon: true
  }
};

// Enhanced issue description step
const issueDescriptionStep: BookingWizardStep = {
  id: 'issue-description',
  title: 'Describe the Issues',
  description: 'Tell us what problems you\'re experiencing with your device',
  icon: 'tool',
  validation: 'required',
  estimatedTime: 180,
  
  fields: [
    {
      id: 'primary_issues',
      type: 'multi-select',
      name: 'issues',
      label: 'What issues are you experiencing?',
      description: 'Select all that apply. Our technicians will verify during diagnostic.',
      required: true,
      config: {
        depends: 'device',
        endpoint: '/api/devices/{device.id}/common-issues',
        searchable: true,
        maxSelections: 5,
        minSelections: 1,
        groupBy: 'category',
        showPrices: true,
        showDescriptions: true,
        layout: 'grid'
      },
      analytics: {
        trackInteractions: true,
        eventName: 'issue_selection'
      }
    },
    
    {
      id: 'photo_upload',
      type: 'photo-upload',
      name: 'damage_photos',
      label: 'Photos of the Damage (Optional)',
      description: 'Upload photos to help our technicians prepare for your repair',
      required: false,
      config: {
        photoUpload: {
          maxFiles: 5,
          maxFileSize: 10 * 1024 * 1024, // 10MB
          acceptedFormats: ['image/jpeg', 'image/png', 'image/webp'],
          compression: {
            enabled: true,
            quality: 0.8,
            maxWidth: 1920,
            maxHeight: 1080
          },
          preview: true,
          guidelines: {
            show: true,
            instructions: [
              'Take clear, well-lit photos of the damage',
              'Include close-ups of specific problem areas',
              'Show the overall condition of the device',
              'Multiple angles help our technicians prepare'
            ],
            examples: [
              'Cracked screen from multiple angles',
              'Water damage indicators',
              'Physical damage to ports or buttons',
              'Display issues or discoloration'
            ]
          },
          aiAnalysis: {
            enabled: true,
            endpoint: '/api/ai/analyze-damage',
            autoDetectIssues: true
          }
        }
      }
    },
    
    {
      id: 'issue_details',
      type: 'textarea',
      name: 'description',
      label: 'Detailed Description',
      description: 'Please provide specific details about when and how the issues occur',
      placeholder: 'e.g., Screen started flickering after being dropped. The touch response is intermittent, especially on the right side. Device still charges normally but gets warm during use...',
      required: true,
      config: {
        minLength: 25,
        maxLength: 1500,
        showCharacterCount: true,
        suggestions: {
          enabled: true,
          prompts: [
            'When did the problem first start?',
            'What were you doing when it happened?',
            'Are there any error messages?',
            'Does it happen consistently or intermittently?',
            'Have you tried any troubleshooting steps?'
          ]
        }
      },
      validation: [
        {
          type: 'required',
          message: 'Please provide a detailed description of the issues'
        },
        {
          type: 'min',
          value: 25,
          message: 'Please provide more detail (minimum 25 characters)'
        }
      ]
    },
    
    {
      id: 'urgency_level',
      type: 'radio-group',
      name: 'urgency',
      label: 'Repair Urgency',
      description: 'Choose the service level that best fits your needs',
      required: true,
      config: {
        layout: 'list',
        showPrices: true
      },
      options: [
        {
          value: 'standard',
          label: 'Standard Service',
          description: '3-5 business days • Standard pricing • Most economical',
          priceModifier: 1.0,
          icon: 'clock',
          color: 'blue',
          recommended: true,
          details: {
            timeline: '3-5 business days',
            guarantee: '6-month warranty',
            support: 'Standard support hours'
          }
        },
        {
          value: 'priority',
          label: 'Priority Service',
          description: '1-2 business days • +25% fee • Faster turnaround',
          priceModifier: 1.25,
          icon: 'zap',
          color: 'yellow',
          popular: true,
          details: {
            timeline: '1-2 business days',
            guarantee: '6-month warranty',
            support: 'Priority support'
          }
        },
        {
          value: 'emergency',
          label: 'Emergency Service',
          description: 'Same day (if possible) • +50% fee • Subject to availability',
          priceModifier: 1.5,
          icon: 'alert-circle',
          color: 'red',
          details: {
            timeline: 'Same day (subject to availability)',
            guarantee: '6-month warranty',
            support: '24/7 support'
          }
        }
      ]
    },
    
    {
      id: 'data_backup',
      type: 'radio-group',
      name: 'backup_status',
      label: 'Data Backup Status',
      description: '🔴 Important: We cannot guarantee data safety during repair. Please back up important data.',
      required: true,
      config: {
        layout: 'list',
        showDescriptions: true
      },
      options: [
        {
          value: 'backed_up',
          label: 'I have a recent backup',
          description: 'All important data is safely backed up elsewhere',
          icon: 'shield-check',
          color: 'green'
        },
        {
          value: 'partial_backup',
          label: 'Partial backup',
          description: 'Some data is backed up, some is not',
          icon: 'shield',
          color: 'yellow'
        },
        {
          value: 'no_backup',
          label: 'No backup available',
          description: 'Please help with data recovery if possible (+£30-50)',
          icon: 'shield-x',
          color: 'orange',
          additionalFee: 40
        },
        {
          value: 'not_important',
          label: 'Data is not important',
          description: 'Device can be wiped/reset if necessary for repair',
          icon: 'trash',
          color: 'gray'
        }
      ]
    }
  ],
  
  navigationRules: {
    canSkip: false,
    canGoBack: true,
    autoAdvance: false,
    saveProgress: true
  }
};

// Complete booking flow configuration
export const bookingFlowConfig: BookingFlowConfig = {
  id: 'revivatech-booking-flow-v3',
  name: 'RevivaTech Repair Booking Flow',
  version: '3.0.0',
  
  initialState: 'device-selection',
  finalStates: ['completed', 'cancelled'],
  
  states: [
    {
      id: 'device-selection',
      name: 'Device Selection',
      description: 'Customer selects their device and provides basic information',
      stepIndex: 0,
      requiredData: ['device', 'condition'],
      optionalData: ['variant', 'storage', 'color', 'purchase_date'],
      nextStates: ['issue-description'],
      previousStates: [],
      timeoutMinutes: 10
    },
    {
      id: 'issue-description',
      name: 'Issue Description',
      description: 'Customer describes problems and upload photos',
      stepIndex: 1,
      requiredData: ['issues', 'description', 'urgency', 'backup_status'],
      optionalData: ['damage_photos'],
      nextStates: ['service-preferences'],
      previousStates: ['device-selection'],
      timeoutMinutes: 15
    },
    {
      id: 'service-preferences',
      name: 'Service Preferences',
      description: 'Customer chooses service type and preferences',
      stepIndex: 2,
      requiredData: ['service_type', 'contact_methods'],
      optionalData: ['collection_details', 'special_instructions'],
      nextStates: ['quote-review'],
      previousStates: ['issue-description'],
      timeoutMinutes: 8
    },
    {
      id: 'quote-review',
      name: 'Quote Review',
      description: 'Customer reviews pricing and accepts quote',
      stepIndex: 3,
      requiredData: ['accept_quote'],
      optionalData: [],
      nextStates: ['customer-details'],
      previousStates: ['service-preferences'],
      timeoutMinutes: 10
    },
    {
      id: 'customer-details',
      name: 'Customer Details',
      description: 'Customer provides contact and billing information',
      stepIndex: 4,
      requiredData: ['full_name', 'email', 'phone', 'customer_type'],
      optionalData: ['company_name', 'vat_number'],
      nextStates: ['confirmation'],
      previousStates: ['quote-review'],
      timeoutMinutes: 8
    },
    {
      id: 'confirmation',
      name: 'Booking Confirmation',
      description: 'Final review and booking submission',
      stepIndex: 5,
      requiredData: ['agreements'],
      optionalData: ['marketing_consent'],
      nextStates: ['completed'],
      previousStates: ['customer-details'],
      timeoutMinutes: 5
    },
    {
      id: 'completed',
      name: 'Booking Completed',
      description: 'Booking successfully submitted',
      stepIndex: 6,
      requiredData: [],
      nextStates: [],
      previousStates: ['confirmation']
    },
    {
      id: 'cancelled',
      name: 'Booking Cancelled',
      description: 'Booking was cancelled by user',
      stepIndex: -1,
      requiredData: [],
      nextStates: [],
      previousStates: ['device-selection', 'issue-description', 'service-preferences', 'quote-review', 'customer-details']
    }
  ],
  
  settings: {
    allowBackNavigation: true,
    persistProgress: true,
    sessionTimeout: 30, // 30 minutes
    maxRetries: 3,
    autoSave: true,
    autoSaveInterval: 45 // 45 seconds
  },
  
  integrations: {
    deviceDatabase: {
      endpoint: '/api/devices',
      cacheTimeout: 3600, // 1 hour
      fallbackMode: 'static'
    },
    pricingEngine: {
      endpoint: '/api/pricing/calculate',
      realTime: true,
      recalculateOnChange: ['device', 'issues', 'urgency', 'service_type', 'condition']
    },
    availabilityService: {
      endpoint: '/api/availability',
      refreshInterval: 300, // 5 minutes
      timezone: 'Europe/London'
    },
    notificationService: {
      endpoint: '/api/notifications',
      channels: ['email', 'sms', 'push'],
      templates: {
        started: 'booking-started',
        abandoned: 'booking-abandoned',
        completed: 'booking-completed',
        confirmed: 'booking-confirmed'
      }
    }
  },
  
  businessRules: {
    minimumBookingNotice: 2, // 2 hours
    maximumBookingAdvance: 30, // 30 days
    blackoutDates: ['2024-12-25', '2024-12-26', '2024-01-01'],
    specialPricing: {
      urgentSurcharge: 0.5, // 50% for emergency
      weekendSurcharge: 0.15, // 15% for weekends
      holidaySurcharge: 0.25 // 25% for holidays
    },
    serviceLimits: {
      maxPhotosPerBooking: 10,
      maxIssuesPerDevice: 5,
      maxDevicesPerBooking: 3
    }
  },
  
  analytics: {
    trackingEvents: [
      'flow_started',
      'step_completed',
      'step_abandoned',
      'back_navigation',
      'form_error',
      'validation_failed',
      'quote_generated',
      'booking_completed',
      'booking_cancelled'
    ],
    conversionGoals: ['booking_completed'],
    abandonmentTracking: true,
    performanceMetrics: true
  }
};

// Enhanced booking form configuration using the new flow
export const enhancedBookingFormConfig: BookingFormConfig = {
  id: 'repair-booking-wizard-v3',
  name: 'RevivaTech Repair Booking Wizard',
  version: '3.0.0',
  title: 'Book Your Device Repair',
  description: 'Professional repair booking with instant quotes and expert service',
  
  wizard: {
    enabled: true,
    persistProgress: true,
    allowBackNavigation: true,
    showProgress: true,
    progressType: 'steps',
    validationMode: 'step',
    
    steps: [
      deviceSelectionStep,
      issueDescriptionStep,
      // Additional steps would be defined here
    ],
    
    autoSave: {
      enabled: true,
      interval: 45,
      storageKey: 'revivatech_booking_v3',
      expiry: 24 * 60 * 60 * 1000 // 24 hours
    },
    
    navigation: {
      showStepNumbers: true,
      showStepTitles: true,
      allowJumpToStep: false,
      animationType: 'slide',
      position: 'top'
    },
    
    integrations: {
      deviceDatabase: {
        enabled: true,
        endpoint: '/api/devices',
        searchable: true,
        filters: ['brand', 'category', 'year', 'availability'],
        sortBy: 'popularity'
      },
      pricing: {
        enabled: true,
        endpoint: '/api/pricing/calculate',
        realTime: true,
        factors: ['device_type', 'issues', 'urgency', 'service_type', 'condition']
      },
      scheduling: {
        enabled: true,
        endpoint: '/api/availability',
        timeSlots: true,
        businessHours: {
          monday: { open: '09:00', close: '18:00' },
          tuesday: { open: '09:00', close: '18:00' },
          wednesday: { open: '09:00', close: '18:00' },
          thursday: { open: '09:00', close: '18:00' },
          friday: { open: '09:00', close: '18:00' },
          saturday: { open: '10:00', close: '16:00' },
          sunday: { closed: true }
        }
      },
      notifications: {
        enabled: true,
        channels: ['email', 'sms', 'push'],
        templates: {
          confirmation: 'booking-confirmation-v3',
          updates: 'booking-updates-v3',
          completion: 'booking-completion-v3'
        }
      }
    },
    
    analytics: {
      trackSteps: true,
      trackAbandon: true,
      trackConversion: true,
      events: [
        'booking_started',
        'device_selected',
        'issues_described',
        'photos_uploaded',
        'service_selected',
        'quote_accepted',
        'details_entered',
        'booking_submitted'
      ],
      provider: 'google'
    }
  },
  
  validation: {
    mode: 'onChange',
    debounceMs: 300,
    showErrors: 'inline',
    scrollToError: true,
    highlightErrors: true,
    realTimeValidation: true
  },
  
  submission: {
    endpoint: '/api/bookings/v3',
    method: 'POST',
    successRedirect: '/booking/success',
    errorHandling: {
      retryAttempts: 3,
      retryDelay: 1000,
      showErrors: true,
      fallbackMode: 'email'
    },
    dataTransformation: {
      beforeSubmit: 'processBookingData',
      afterSubmit: 'handleBookingResponse'
    }
  },
  
  persistence: {
    enabled: true,
    storage: 'localStorage',
    key: 'revivatech_booking_v3_progress',
    expiry: 24 * 60 * 60 * 1000,
    encryptSensitiveData: true,
    clearOnSubmit: true
  },
  
  features: {
    realTimePricing: true,
    deviceDetection: true,
    photoAnalysis: true,
    smartSuggestions: true,
    autofill: true,
    progressPersistence: true
  },
  
  security: {
    csrfProtection: true,
    dataEncryption: true,
    gdprCompliant: true,
    retentionPolicy: {
      sensitiveData: 30,
      generalData: 365,
      anonymizeAfter: 1095
    }
  }
};

export default {
  bookingFlowConfig,
  enhancedBookingFormConfig,
  deviceSelectionStep,
  issueDescriptionStep
};