import { FormConfig, FormFields, ValidationRules } from '@/lib/forms/schema';

export const BookingFormConfig: FormConfig = {
  id: 'repair-booking',
  title: 'Book Your Repair',
  description: 'Tell us about your device and we\'ll get it fixed quickly and professionally.',
  
  multiStep: true,
  validation: 'onChange',
  persistProgress: true,
  showProgress: true,
  
  layout: 'vertical',
  spacing: 'normal',
  showRequiredIndicator: true,
  
  submitUrl: '/api/bookings',
  submitMethod: 'POST',
  
  steps: [
    {
      id: 'device-info',
      title: 'Device Information',
      description: 'Let us know what device needs repair',
      fields: [
        FormFields.select('deviceType', 'Device Type', [
          { value: 'macbook', label: 'MacBook', group: 'Apple' },
          { value: 'imac', label: 'iMac', group: 'Apple' },
          { value: 'mac-mini', label: 'Mac Mini', group: 'Apple' },
          { value: 'iphone', label: 'iPhone', group: 'Apple' },
          { value: 'ipad', label: 'iPad', group: 'Apple' },
          { value: 'laptop', label: 'Windows Laptop', group: 'PC' },
          { value: 'desktop', label: 'Desktop PC', group: 'PC' },
          { value: 'all-in-one', label: 'All-in-One PC', group: 'PC' },
          { value: 'android', label: 'Android Phone', group: 'Mobile' },
          { value: 'tablet', label: 'Android Tablet', group: 'Mobile' },
          { value: 'other', label: 'Other Device' },
        ], {
          required: true,
          validation: [ValidationRules.required('Please select your device type')],
          placeholder: 'Choose your device type...',
          searchable: true,
        }),

        FormFields.text('deviceModel', 'Device Model', {
          placeholder: 'e.g., MacBook Pro 16-inch 2021, Dell XPS 13, iPhone 14 Pro',
          description: 'Help us identify your specific device model',
          validation: [ValidationRules.required(), ValidationRules.minLength(3)],
        }),

        FormFields.text('serialNumber', 'Serial Number (Optional)', {
          placeholder: 'Found in Settings > About or on device label',
          description: 'Helps us prepare the right parts and diagnostic tools',
        }),

        FormFields.select('deviceAge', 'Device Age', [
          { value: 'under-1', label: 'Under 1 year' },
          { value: '1-2', label: '1-2 years' },
          { value: '2-3', label: '2-3 years' },
          { value: '3-5', label: '3-5 years' },
          { value: 'over-5', label: 'Over 5 years' },
          { value: 'unknown', label: 'Not sure' },
        ], {
          placeholder: 'Select device age...',
        }),

        {
          id: 'warrantyStatus',
          name: 'warrantyStatus',
          type: 'checkbox',
          label: 'Device is still under manufacturer warranty',
          description: 'We can help you determine if warranty repair is the better option',
        },
      ],
    },

    {
      id: 'problem-description',
      title: 'Problem Description',
      description: 'Describe the issues you\'re experiencing',
      fields: [
        {
          id: 'problemType',
          name: 'problemType',
          type: 'multi-select',
          label: 'What problems are you experiencing?',
          required: true,
          validation: [ValidationRules.required('Please select at least one problem')],
          options: [
            { value: 'screen-damage', label: 'Cracked/damaged screen', group: 'Display' },
            { value: 'screen-flickering', label: 'Screen flickering', group: 'Display' },
            { value: 'no-display', label: 'No display/black screen', group: 'Display' },
            { value: 'battery-drain', label: 'Battery drains quickly', group: 'Power' },
            { value: 'not-charging', label: 'Won\'t charge', group: 'Power' },
            { value: 'overheating', label: 'Overheating', group: 'Performance' },
            { value: 'slow-performance', label: 'Slow performance', group: 'Performance' },
            { value: 'random-shutdown', label: 'Random shutdowns/restarts', group: 'Performance' },
            { value: 'keyboard-issues', label: 'Keyboard not working', group: 'Input' },
            { value: 'trackpad-issues', label: 'Trackpad/mouse issues', group: 'Input' },
            { value: 'audio-issues', label: 'No sound/audio problems', group: 'Audio' },
            { value: 'wifi-issues', label: 'WiFi/connectivity issues', group: 'Connectivity' },
            { value: 'virus-malware', label: 'Virus/malware infection', group: 'Software' },
            { value: 'wont-boot', label: 'Won\'t turn on/boot', group: 'Software' },
            { value: 'data-loss', label: 'Data loss/recovery needed', group: 'Data' },
            { value: 'liquid-damage', label: 'Liquid damage', group: 'Physical' },
            { value: 'physical-damage', label: 'Physical damage/drop', group: 'Physical' },
            { value: 'other', label: 'Other issues' },
          ],
          props: {
            searchable: true,
            maxSelections: 5,
          },
        },

        FormFields.textarea('problemDescription', 'Detailed Description', {
          required: true,
          validation: [
            ValidationRules.required('Please describe the problem'),
            ValidationRules.minLength(20, 'Please provide more details (at least 20 characters)')
          ],
          placeholder: 'Please describe the problem in detail. When did it start? What were you doing when it happened? Any error messages?',
          props: {
            rows: 4,
            showCharacterCount: true,
            maxLength: 1000,
          },
        }),

        FormFields.select('urgency', 'Repair Urgency', [
          { value: 'standard', label: 'Standard (3-5 business days)', description: 'Normal repair timeline' },
          { value: 'priority', label: 'Priority (1-2 business days)', description: '+£25 fee' },
          { value: 'emergency', label: 'Emergency (Same day)', description: '+£50 fee, subject to availability' },
        ], {
          required: true,
          validation: [ValidationRules.required('Please select repair urgency')],
          defaultValue: 'standard',
        }),

        {
          id: 'dataBackup',
          name: 'dataBackup',
          type: 'select',
          label: 'Data Backup Status',
          required: true,
          validation: [ValidationRules.required('Please indicate your backup status')],
          options: [
            { value: 'backed-up', label: 'I have a recent backup' },
            { value: 'partial-backup', label: 'I have some data backed up' },
            { value: 'no-backup', label: 'No backup - please help recover data' },
            { value: 'not-important', label: 'Data is not important' },
          ],
          placeholder: 'Select backup status...',
        },
      ],
    },

    {
      id: 'customer-details',
      title: 'Your Information',
      description: 'We need these details to process your booking',
      fields: [
        FormFields.text('firstName', 'First Name', {
          required: true,
          validation: [ValidationRules.required(), ValidationRules.minLength(2)],
          colSpan: 1,
        }),

        FormFields.text('lastName', 'Last Name', {
          required: true,
          validation: [ValidationRules.required(), ValidationRules.minLength(2)],
          colSpan: 1,
        }),

        FormFields.email('email', 'Email Address', {
          required: true,
          description: 'We\'ll send booking confirmation and updates to this email',
        }),

        FormFields.phone('phone', 'Phone Number', {
          required: true,
          description: 'For important updates about your repair',
        }),

        FormFields.text('company', 'Company Name (Optional)', {
          placeholder: 'If this is a business device',
        }),

        FormFields.select('contactPreference', 'Preferred Contact Method', [
          { value: 'email', label: 'Email' },
          { value: 'phone', label: 'Phone call' },
          { value: 'sms', label: 'Text message' },
          { value: 'whatsapp', label: 'WhatsApp' },
        ], {
          defaultValue: 'email',
        }),
      ],
    },

    {
      id: 'service-details',
      title: 'Service Preferences',
      description: 'Choose how you\'d like us to handle your repair',
      fields: [
        FormFields.select('serviceType', 'Service Type', [
          { 
            value: 'drop-off', 
            label: 'Drop-off at our shop', 
            description: 'Bring your device to our London location' 
          },
          { 
            value: 'pickup-delivery', 
            label: 'Pickup & Delivery', 
            description: 'We collect and return your device (+£15 fee)' 
          },
          { 
            value: 'on-site', 
            label: 'On-site repair', 
            description: 'We come to you (business customers, +£45 fee)' 
          },
        ], {
          required: true,
          validation: [ValidationRules.required('Please select service type')],
          defaultValue: 'drop-off',
        }),

        // Conditional address fields for pickup/delivery
        FormFields.text('address', 'Address', {
          required: false,
          conditionalLogic: [{
            field: 'serviceType',
            operator: 'equals',
            value: 'pickup-delivery',
            action: 'show'
          }, {
            field: 'serviceType',
            operator: 'equals',
            value: 'pickup-delivery',
            action: 'require'
          }],
          validation: [ValidationRules.required('Address is required for pickup/delivery')],
        }),

        FormFields.text('postcode', 'Postcode', {
          required: false,
          conditionalLogic: [{
            field: 'serviceType',
            operator: 'equals',
            value: 'pickup-delivery',
            action: 'show'
          }, {
            field: 'serviceType',
            operator: 'equals',
            value: 'pickup-delivery',
            action: 'require'
          }],
          validation: [ValidationRules.required('Postcode is required for pickup/delivery')],
        }),

        FormFields.select('preferredTime', 'Preferred Time', [
          { value: 'morning', label: 'Morning (9AM - 12PM)' },
          { value: 'afternoon', label: 'Afternoon (12PM - 5PM)' },
          { value: 'evening', label: 'Evening (5PM - 7PM)' },
          { value: 'anytime', label: 'Anytime during business hours' },
        ], {
          defaultValue: 'anytime',
        }),

        FormFields.textarea('specialInstructions', 'Special Instructions (Optional)', {
          placeholder: 'Any special handling requirements, access instructions, or other notes',
          props: {
            rows: 3,
            maxLength: 500,
            showCharacterCount: true,
          },
        }),

        FormFields.select('marketingConsent', 'Marketing Preferences', [
          { value: 'yes', label: 'Yes, send me tips and offers' },
          { value: 'no', label: 'No marketing emails please' },
        ], {
          defaultValue: 'no',
          description: 'We\'ll only send repair-related updates regardless of this choice',
        }),
      ],
    },

    {
      id: 'confirmation',
      title: 'Booking Confirmation',
      description: 'Review your booking details',
      fields: [
        {
          id: 'terms',
          name: 'terms',
          type: 'checkbox',
          label: 'I agree to the Terms of Service and Privacy Policy',
          required: true,
          validation: [ValidationRules.required('You must agree to the terms to proceed')],
        },

        {
          id: 'diagnosticFee',
          name: 'diagnosticFee',
          type: 'checkbox',
          label: 'I understand the £25 diagnostic fee (waived if repair is completed)',
          required: true,
          validation: [ValidationRules.required('Please acknowledge the diagnostic fee')],
        },

        {
          id: 'dataRisk',
          name: 'dataRisk',
          type: 'checkbox',
          label: 'I understand that data loss is possible during repair and I have backed up important data',
          required: true,
          validation: [ValidationRules.required('Please acknowledge data backup responsibility')],
        },
      ],
    },
  ],
};

export default BookingFormConfig;