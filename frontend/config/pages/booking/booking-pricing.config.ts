import { ComponentConfig } from '@/lib/components/types';

export const bookingPricingConfig: ComponentConfig = {
  id: 'booking-pricing',
  variant: 'transparent',
  
  title: 'Transparent Pricing',
  subtitle: 'No hidden fees, no surprises',
  description: 'Our pricing is straightforward and competitive. You\'ll know exactly what you\'re paying before we start any work.',
  
  pricingModel: {
    type: 'diagnostic-first',
    diagnosticFee: {
      amount: 25,
      currency: 'GBP',
      waived: true,
      waivedCondition: 'repair_completed',
      description: 'Diagnostic fee is waived when repair is completed'
    },
    
    estimateAccuracy: {
      range: 90,
      unit: 'percent',
      description: 'Our instant quotes are accurate within 10% of final cost'
    },
    
    noFixNoFee: {
      enabled: true,
      description: 'If we can\'t fix your device, you don\'t pay anything'
    }
  },
  
  priceCategories: [
    {
      id: 'smartphone-pricing',
      name: 'Smartphone Repairs',
      icon: 'smartphone',
      description: 'Common smartphone repair costs',
      
      repairs: [
        {
          name: 'Screen Replacement',
          description: 'Cracked or damaged screen repair',
          priceRange: {
            min: 49,
            max: 199,
            currency: 'GBP'
          },
          factors: [
            'Device model and age',
            'Screen type (LCD/OLED)',
            'Touch functionality',
            'Original vs aftermarket parts'
          ],
          examples: [
            { device: 'iPhone 13', price: 129 },
            { device: 'Samsung Galaxy S22', price: 149 },
            { device: 'Google Pixel 6', price: 119 }
          ]
        },
        {
          name: 'Battery Replacement',
          description: 'Worn out battery replacement',
          priceRange: {
            min: 29,
            max: 79,
            currency: 'GBP'
          },
          factors: [
            'Battery capacity',
            'Device complexity',
            'Waterproofing restoration'
          ],
          examples: [
            { device: 'iPhone 12', price: 59 },
            { device: 'Samsung Galaxy S21', price: 49 },
            { device: 'OnePlus 9', price: 45 }
          ]
        },
        {
          name: 'Charging Port',
          description: 'Faulty charging port repair',
          priceRange: {
            min: 39,
            max: 89,
            currency: 'GBP'
          },
          factors: [
            'Port type (Lightning/USB-C)',
            'Internal damage extent',
            'Waterproofing restoration'
          ]
        },
        {
          name: 'Camera Repair',
          description: 'Faulty camera module replacement',
          priceRange: {
            min: 39,
            max: 129,
            currency: 'GBP'
          },
          factors: [
            'Camera resolution',
            'Multiple camera systems',
            'Optical image stabilization'
          ]
        }
      ]
    },
    
    {
      id: 'laptop-pricing',
      name: 'Laptop Repairs',
      icon: 'laptop',
      description: 'Laptop repair and upgrade costs',
      
      repairs: [
        {
          name: 'Screen Replacement',
          description: 'Cracked or dim laptop screen',
          priceRange: {
            min: 99,
            max: 399,
            currency: 'GBP'
          },
          factors: [
            'Screen size and resolution',
            'Touch screen capability',
            'Brand and model',
            'LED vs LCD technology'
          ],
          examples: [
            { device: 'MacBook Pro 13"', price: 249 },
            { device: 'Dell XPS 15', price: 199 },
            { device: 'HP Pavilion 14"', price: 129 }
          ]
        },
        {
          name: 'Keyboard Repair',
          description: 'Faulty keys or full keyboard replacement',
          priceRange: {
            min: 79,
            max: 159,
            currency: 'GBP'
          },
          factors: [
            'Individual key vs full keyboard',
            'Backlit keyboard',
            'Laptop model complexity'
          ]
        },
        {
          name: 'Hard Drive Upgrade',
          description: 'SSD upgrade or replacement',
          priceRange: {
            min: 49,
            max: 299,
            currency: 'GBP'
          },
          factors: [
            'Storage capacity',
            'SSD vs HDD',
            'Brand preference',
            'Data transfer included'
          ]
        },
        {
          name: 'RAM Upgrade',
          description: 'Memory upgrade for better performance',
          priceRange: {
            min: 49,
            max: 199,
            currency: 'GBP'
          },
          factors: [
            'Memory capacity',
            'DDR generation',
            'Laptop compatibility'
          ]
        }
      ]
    },
    
    {
      id: 'tablet-pricing',
      name: 'Tablet Repairs',
      icon: 'tablet',
      description: 'Tablet repair costs',
      
      repairs: [
        {
          name: 'Screen Replacement',
          description: 'Cracked or unresponsive screen',
          priceRange: {
            min: 79,
            max: 299,
            currency: 'GBP'
          },
          factors: [
            'Screen size',
            'Brand and model',
            'Touch digitizer damage'
          ],
          examples: [
            { device: 'iPad Air', price: 179 },
            { device: 'Samsung Galaxy Tab', price: 149 },
            { device: 'Surface Pro', price: 229 }
          ]
        },
        {
          name: 'Battery Replacement',
          description: 'Tablet battery replacement',
          priceRange: {
            min: 49,
            max: 99,
            currency: 'GBP'
          },
          factors: [
            'Battery capacity',
            'Tablet complexity',
            'Adhesive removal'
          ]
        },
        {
          name: 'Charging Port',
          description: 'Faulty charging port repair',
          priceRange: {
            min: 39,
            max: 79,
            currency: 'GBP'
          },
          factors: [
            'Port type',
            'Internal damage',
            'Tablet model'
          ]
        }
      ]
    },
    
    {
      id: 'data-recovery-pricing',
      name: 'Data Recovery',
      icon: 'hard-drive',
      description: 'Data recovery service costs',
      
      repairs: [
        {
          name: 'Standard Recovery',
          description: 'Software-based data recovery',
          priceRange: {
            min: 99,
            max: 299,
            currency: 'GBP'
          },
          factors: [
            'Data amount',
            'File types',
            'Recovery complexity'
          ],
          turnaround: '2-5 days'
        },
        {
          name: 'Advanced Recovery',
          description: 'Hardware-based recovery',
          priceRange: {
            min: 299,
            max: 799,
            currency: 'GBP'
          },
          factors: [
            'Physical damage extent',
            'Clean room required',
            'Recovery success rate'
          ],
          turnaround: '5-10 days'
        },
        {
          name: 'Emergency Recovery',
          description: 'Urgent data recovery service',
          priceRange: {
            min: 399,
            max: 1599,
            currency: 'GBP'
          },
          factors: [
            'Urgency level',
            'Weekend/holiday service',
            'Dedicated technician'
          ],
          turnaround: '24-48 hours'
        }
      ]
    }
  ],
  
  serviceModifiers: {
    title: 'Service Options & Pricing',
    description: 'Additional services and their costs',
    
    options: [
      {
        id: 'service-speed',
        name: 'Service Speed',
        type: 'radio',
        options: [
          {
            value: 'standard',
            label: 'Standard Service',
            description: '3-5 business days',
            modifier: 1.0,
            additionalCost: 0
          },
          {
            value: 'priority',
            label: 'Priority Service',
            description: '1-2 business days',
            modifier: 1.25,
            additionalCost: 25
          },
          {
            value: 'emergency',
            label: 'Emergency Service',
            description: 'Same day (subject to availability)',
            modifier: 1.5,
            additionalCost: 50
          }
        ]
      },
      
      {
        id: 'collection-method',
        name: 'Collection Method',
        type: 'radio',
        options: [
          {
            value: 'drop_off',
            label: 'Drop Off',
            description: 'Bring to our shop',
            modifier: 1.0,
            additionalCost: 0
          },
          {
            value: 'collection',
            label: 'Collection Service',
            description: 'We collect from you',
            modifier: 1.0,
            additionalCost: 15
          },
          {
            value: 'postal',
            label: 'Postal Service',
            description: 'Insured postal service',
            modifier: 1.0,
            additionalCost: 5
          }
        ]
      },
      
      {
        id: 'parts-preference',
        name: 'Parts Preference',
        type: 'radio',
        options: [
          {
            value: 'aftermarket',
            label: 'Aftermarket Parts',
            description: 'Quality aftermarket parts',
            modifier: 1.0,
            additionalCost: 0
          },
          {
            value: 'original',
            label: 'Original Parts',
            description: 'Original manufacturer parts',
            modifier: 1.3,
            additionalCost: 0
          }
        ]
      }
    ]
  },
  
  priceCalculator: {
    enabled: true,
    title: 'Instant Price Calculator',
    description: 'Get an instant estimate for your repair',
    
    fields: [
      {
        id: 'device_type',
        type: 'select',
        label: 'Device Type',
        options: [
          { value: 'smartphone', label: 'Smartphone' },
          { value: 'laptop', label: 'Laptop' },
          { value: 'tablet', label: 'Tablet' },
          { value: 'desktop', label: 'Desktop' },
          { value: 'console', label: 'Gaming Console' }
        ]
      },
      {
        id: 'repair_type',
        type: 'select',
        label: 'Repair Type',
        depends: 'device_type',
        endpoint: '/api/repairs/types'
      },
      {
        id: 'urgency',
        type: 'select',
        label: 'Service Speed',
        options: [
          { value: 'standard', label: 'Standard (3-5 days)' },
          { value: 'priority', label: 'Priority (1-2 days)' },
          { value: 'emergency', label: 'Emergency (same day)' }
        ]
      }
    ],
    
    calculation: {
      endpoint: '/api/pricing/estimate',
      method: 'POST',
      realTime: true,
      showBreakdown: true
    }
  },
  
  guarantees: {
    title: 'Our Guarantees',
    items: [
      {
        icon: 'shield-check',
        title: 'Quality Guarantee',
        description: '6-month warranty on all repairs'
      },
      {
        icon: 'pound-sterling',
        title: 'No Fix, No Fee',
        description: 'If we can\'t fix it, you don\'t pay'
      },
      {
        icon: 'clock',
        title: 'Time Guarantee',
        description: 'Repairs completed on time or discount applied'
      },
      {
        icon: 'refresh-ccw',
        title: 'Satisfaction Guarantee',
        description: '30-day satisfaction guarantee'
      }
    ]
  },
  
  layout: {
    type: 'tabbed',
    showCalculator: true,
    showExamples: true,
    showGuarantees: true,
    sticky: false
  }
};

export default bookingPricingConfig;