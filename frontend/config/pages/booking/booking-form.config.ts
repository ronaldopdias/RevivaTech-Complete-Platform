import { FormConfig } from '@/lib/forms/types';

export const bookingFormConfig: FormConfig = {
  id: 'repair-booking-wizard',
  name: 'Repair Booking Wizard',
  version: '2.0',
  
  wizard: {
    enabled: true,
    persistProgress: true,
    allowBackNavigation: true,
    showProgress: true,
    progressType: 'steps',
    validationMode: 'step',
    
    steps: [
      {
        id: 'device-selection',
        title: 'Select Your Device',
        description: 'Choose the device that needs repair',
        icon: 'smartphone',
        validation: 'required',
        estimatedTime: 60,
        
        fields: [
          {
            id: 'device_search',
            type: 'device-search',
            name: 'device',
            label: 'Search for your device',
            placeholder: 'e.g., iPhone 14 Pro, MacBook Pro 2021, Samsung Galaxy S23',
            required: true,
            config: {
              endpoint: '/api/devices/search',
              debounceMs: 300,
              minSearchLength: 2,
              maxResults: 20,
              displayFields: ['name', 'brand', 'year', 'category'],
              groupBy: 'brand',
              sortBy: 'popularity',
              filters: {
                available: true,
                supported: true
              },
              template: {
                item: 'device-search-item',
                empty: 'No devices found matching your search',
                loading: 'Searching devices...'
              }
            }
          },
          
          {
            id: 'device_details',
            type: 'conditional-group',
            name: 'device_details',
            condition: {
              field: 'device',
              operator: 'exists'
            },
            fields: [
              {
                id: 'model_variant',
                type: 'select',
                name: 'variant',
                label: 'Model Variant',
                placeholder: 'Select variant if applicable',
                required: false,
                config: {
                  depends: 'device',
                  endpoint: '/api/devices/{device.id}/variants',
                  emptyMessage: 'No variants available'
                }
              },
              {
                id: 'storage_capacity',
                type: 'select',
                name: 'storage',
                label: 'Storage Capacity',
                placeholder: 'Select storage if known',
                required: false,
                options: [
                  { value: '64gb', label: '64GB' },
                  { value: '128gb', label: '128GB' },
                  { value: '256gb', label: '256GB' },
                  { value: '512gb', label: '512GB' },
                  { value: '1tb', label: '1TB' },
                  { value: '2tb', label: '2TB' },
                  { value: 'unknown', label: 'Unknown/Not sure' }
                ]
              },
              {
                id: 'device_color',
                type: 'select',
                name: 'color',
                label: 'Device Color',
                placeholder: 'Select color if important',
                required: false,
                config: {
                  depends: 'device',
                  endpoint: '/api/devices/{device.id}/colors',
                  emptyMessage: 'Color not applicable'
                }
              }
            ]
          },
          
          {
            id: 'device_condition',
            type: 'radio-group',
            name: 'condition',
            label: 'Current Device Condition',
            required: true,
            layout: 'grid',
            options: [
              {
                value: 'excellent',
                label: 'Excellent',
                description: 'Minor issues, mostly functional',
                icon: 'star'
              },
              {
                value: 'good',
                label: 'Good',
                description: 'Some issues but still usable',
                icon: 'thumbs-up'
              },
              {
                value: 'fair',
                label: 'Fair',
                description: 'Multiple issues, limited functionality',
                icon: 'alert-triangle'
              },
              {
                value: 'poor',
                label: 'Poor',
                description: 'Severely damaged, barely functional',
                icon: 'x-circle'
              }
            ]
          }
        ]
      },
      
      {
        id: 'issue-description',
        title: 'Describe the Issues',
        description: 'Tell us what problems you\'re experiencing',
        icon: 'tool',
        validation: 'required',
        estimatedTime: 120,
        
        fields: [
          {
            id: 'primary_issues',
            type: 'multi-select',
            name: 'issues',
            label: 'What issues are you experiencing?',
            description: 'Select all that apply. This helps us prepare the right tools and parts.',
            required: true,
            config: {
              depends: 'device',
              endpoint: '/api/devices/{device.id}/common-issues',
              searchable: true,
              maxSelections: 5,
              groupBy: 'category',
              displayTemplate: 'issue-card',
              priceIndicator: true
            }
          },
          
          {
            id: 'issue_details',
            type: 'textarea',
            name: 'description',
            label: 'Detailed Description',
            description: 'Provide specific details about when and how the issues occur',
            placeholder: 'e.g., Screen started flickering after dropping the device. Only happens when opening certain apps...',
            required: true,
            config: {
              minLength: 20,
              maxLength: 1000,
              showCharacterCount: true,
              suggestions: {
                enabled: true,
                prompts: [
                  'When did the problem start?',
                  'What were you doing when it happened?',
                  'Any error messages displayed?',
                  'Does it happen consistently?'
                ]
              }
            }
          },
          
          {
            id: 'urgency_level',
            type: 'radio-group',
            name: 'urgency',
            label: 'Repair Urgency',
            required: true,
            layout: 'list',
            options: [
              {
                value: 'standard',
                label: 'Standard Service',
                description: '3-5 business days • Standard pricing',
                priceModifier: 1.0,
                icon: 'clock'
              },
              {
                value: 'priority',
                label: 'Priority Service',
                description: '1-2 business days • +25% fee',
                priceModifier: 1.25,
                icon: 'zap'
              },
              {
                value: 'emergency',
                label: 'Emergency Service',
                description: 'Same day (subject to availability) • +50% fee',
                priceModifier: 1.5,
                icon: 'alert-circle'
              }
            ]
          },
          
          {
            id: 'data_backup',
            type: 'radio-group',
            name: 'backup_status',
            label: 'Data Backup Status',
            description: 'Important: We cannot guarantee data safety during repair',
            required: true,
            layout: 'list',
            options: [
              {
                value: 'backed_up',
                label: 'I have a recent backup',
                description: 'All important data is safely backed up',
                icon: 'shield-check'
              },
              {
                value: 'partial_backup',
                label: 'Partial backup',
                description: 'Some data is backed up, some is not',
                icon: 'shield'
              },
              {
                value: 'no_backup',
                label: 'No backup available',
                description: 'Please help with data recovery if possible',
                icon: 'shield-x'
              },
              {
                value: 'not_important',
                label: 'Data is not important',
                description: 'Device can be wiped if necessary',
                icon: 'trash'
              }
            ]
          }
        ]
      },
      
      {
        id: 'service-preferences',
        title: 'Service Preferences',
        description: 'Choose how you\'d like your repair handled',
        icon: 'settings',
        validation: 'required',
        estimatedTime: 90,
        
        fields: [
          {
            id: 'service_type',
            type: 'radio-group',
            name: 'service_type',
            label: 'Service Type',
            required: true,
            layout: 'grid',
            options: [
              {
                value: 'drop_off',
                label: 'Drop Off',
                description: 'Bring device to our location',
                icon: 'map-pin',
                priceModifier: 1.0,
                details: {
                  address: '123 Tech Street, London SW1A 1AA',
                  hours: 'Mon-Fri: 9AM-6PM, Sat: 10AM-4PM',
                  parking: 'Free parking available'
                }
              },
              {
                value: 'collection',
                label: 'Collection Service',
                description: 'We collect from your location',
                icon: 'truck',
                priceModifier: 1.1,
                additionalFee: 15,
                details: {
                  coverage: 'London and surrounding areas',
                  timeSlots: 'Morning (9AM-1PM) or Afternoon (1PM-6PM)',
                  requirements: 'Someone must be present for collection'
                }
              },
              {
                value: 'postal',
                label: 'Postal Service',
                description: 'Send via insured post',
                icon: 'mail',
                priceModifier: 1.0,
                additionalFee: 5,
                details: {
                  insurance: 'Fully insured up to £2,000',
                  packaging: 'Free shipping materials provided',
                  tracking: 'Full tracking provided'
                }
              }
            ]
          },
          
          {
            id: 'collection_details',
            type: 'conditional-group',
            name: 'collection_details',
            condition: {
              field: 'service_type',
              operator: 'equals',
              value: 'collection'
            },
            fields: [
              {
                id: 'collection_address',
                type: 'address',
                name: 'address',
                label: 'Collection Address',
                required: true,
                config: {
                  validation: 'uk_postcode',
                  autocomplete: true,
                  components: ['street', 'city', 'postcode']
                }
              },
              {
                id: 'collection_time',
                type: 'time-slot',
                name: 'preferred_time',
                label: 'Preferred Collection Time',
                required: true,
                config: {
                  endpoint: '/api/availability/collection',
                  timeSlots: ['morning', 'afternoon'],
                  maxDaysAhead: 14,
                  excludeWeekends: false
                }
              },
              {
                id: 'collection_notes',
                type: 'textarea',
                name: 'collection_notes',
                label: 'Collection Instructions',
                placeholder: 'e.g., Ring doorbell, ask for John, device is in reception...',
                required: false,
                config: {
                  maxLength: 500,
                  rows: 3
                }
              }
            ]
          },
          
          {
            id: 'contact_preferences',
            type: 'checkbox-group',
            name: 'contact_methods',
            label: 'How would you like to receive updates?',
            required: true,
            options: [
              {
                value: 'email',
                label: 'Email updates',
                description: 'Repair progress and completion notifications',
                default: true
              },
              {
                value: 'sms',
                label: 'SMS/Text updates',
                description: 'Quick status updates via text message',
                default: false
              },
              {
                value: 'phone',
                label: 'Phone calls',
                description: 'Important updates via phone call',
                default: false
              },
              {
                value: 'whatsapp',
                label: 'WhatsApp',
                description: 'Updates via WhatsApp messenger',
                default: false
              }
            ]
          }
        ]
      },
      
      {
        id: 'quote-review',
        title: 'Review Your Quote',
        description: 'Confirm pricing and service details',
        icon: 'calculator',
        validation: 'none',
        estimatedTime: 60,
        
        fields: [
          {
            id: 'quote_display',
            type: 'quote-summary',
            name: 'quote',
            config: {
              realTimeUpdate: true,
              breakdown: true,
              compareOptions: true,
              validityPeriod: 7
            }
          },
          
          {
            id: 'quote_acceptance',
            type: 'checkbox',
            name: 'accept_quote',
            label: 'I accept this quote and understand the terms',
            required: true,
            config: {
              linkedTerms: '/terms/repair-service',
              validityNotice: true
            }
          }
        ]
      },
      
      {
        id: 'customer-details',
        title: 'Your Details',
        description: 'Contact information for booking confirmation',
        icon: 'user',
        validation: 'required',
        estimatedTime: 90,
        
        fields: [
          {
            id: 'customer_name',
            type: 'text',
            name: 'full_name',
            label: 'Full Name',
            required: true,
            config: {
              validation: 'name',
              autocomplete: 'name'
            }
          },
          
          {
            id: 'customer_email',
            type: 'email',
            name: 'email',
            label: 'Email Address',
            description: 'We\'ll send booking confirmation and updates here',
            required: true,
            config: {
              validation: 'email',
              autocomplete: 'email',
              verification: {
                enabled: true,
                method: 'link'
              }
            }
          },
          
          {
            id: 'customer_phone',
            type: 'tel',
            name: 'phone',
            label: 'Phone Number',
            description: 'For urgent updates about your repair',
            required: true,
            config: {
              validation: 'uk_phone',
              autocomplete: 'tel',
              format: 'international'
            }
          },
          
          {
            id: 'customer_type',
            type: 'radio-group',
            name: 'customer_type',
            label: 'Customer Type',
            required: true,
            layout: 'horizontal',
            options: [
              {
                value: 'individual',
                label: 'Personal',
                description: 'Individual customer',
                icon: 'user'
              },
              {
                value: 'business',
                label: 'Business',
                description: 'Business/corporate customer',
                icon: 'briefcase'
              }
            ]
          },
          
          {
            id: 'company_details',
            type: 'conditional-group',
            name: 'company_details',
            condition: {
              field: 'customer_type',
              operator: 'equals',
              value: 'business'
            },
            fields: [
              {
                id: 'company_name',
                type: 'text',
                name: 'company_name',
                label: 'Company Name',
                required: true
              },
              {
                id: 'vat_number',
                type: 'text',
                name: 'vat_number',
                label: 'VAT Number (Optional)',
                required: false,
                config: {
                  validation: 'vat_number'
                }
              }
            ]
          }
        ]
      },
      
      {
        id: 'confirmation',
        title: 'Booking Confirmation',
        description: 'Review and confirm your booking',
        icon: 'check-circle',
        validation: 'required',
        estimatedTime: 60,
        
        fields: [
          {
            id: 'booking_summary',
            type: 'booking-summary',
            name: 'summary',
            config: {
              showAllDetails: true,
              editableFields: ['urgency', 'service_type', 'contact_methods']
            }
          },
          
          {
            id: 'terms_acceptance',
            type: 'checkbox-group',
            name: 'agreements',
            label: 'Required Agreements',
            required: true,
            options: [
              {
                value: 'terms_service',
                label: 'I agree to the Terms of Service',
                required: true,
                link: '/terms/service'
              },
              {
                value: 'privacy_policy',
                label: 'I agree to the Privacy Policy',
                required: true,
                link: '/privacy'
              },
              {
                value: 'repair_terms',
                label: 'I understand the repair terms and conditions',
                required: true,
                link: '/terms/repair'
              },
              {
                value: 'data_risk',
                label: 'I understand the data loss risks and have backed up important data',
                required: true
              }
            ]
          },
          
          {
            id: 'marketing_consent',
            type: 'checkbox',
            name: 'marketing_consent',
            label: 'Send me helpful tips and special offers (optional)',
            required: false,
            config: {
              gdprCompliant: true,
              unsubscribeInfo: true
            }
          }
        ]
      }
    ]
  },
  
  validation: {
    mode: 'onChange',
    debounceMs: 300,
    showErrors: 'onBlur',
    scrollToError: true,
    highlightErrors: true
  },
  
  submission: {
    endpoint: '/api/bookings',
    method: 'POST',
    successRedirect: '/booking/success',
    errorHandling: {
      retryAttempts: 3,
      retryDelay: 1000,
      showErrors: true
    }
  },
  
  persistence: {
    enabled: true,
    storage: 'localStorage',
    key: 'revivatech_booking_progress',
    expiry: 24 * 60 * 60 * 1000 // 24 hours
  }
};

export default bookingFormConfig;