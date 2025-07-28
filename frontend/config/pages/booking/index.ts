import { PageConfig } from '@/lib/pages/types';
import { bookingFormConfig } from './booking-form.config';
import { bookingServicesConfig } from './booking-services.config';
import { bookingPricingConfig } from './booking-pricing.config';

export const bookingPageConfig: PageConfig = {
  id: 'booking',
  name: 'Repair Booking',
  path: '/book-repair',
  type: 'booking',
  
  metadata: {
    title: 'Book Your Repair | RevivaTech',
    description: 'Book professional device repair services with real-time quotes, device diagnostics, and expert technicians.',
    keywords: ['device repair', 'book repair', 'phone repair', 'laptop repair', 'tablet repair', 'professional repair'],
    openGraph: {
      title: 'Book Your Device Repair - RevivaTech',
      description: 'Get instant quotes and book professional repair services for phones, laptops, tablets, and more.',
      image: '/images/booking-hero.jpg',
      type: 'website',
    },
    schema: {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: 'RevivaTech',
      description: 'Professional device repair services with online booking',
      url: 'https://revivatech.co.uk/book-repair',
      telephone: '+44 20 7123 4567',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '123 Tech Street',
        addressLocality: 'London',
        postalCode: 'SW1A 1AA',
        addressCountry: 'GB'
      },
      openingHours: [
        'Mo-Fr 09:00-18:00',
        'Sa 10:00-16:00'
      ]
    }
  },

  layout: {
    type: 'full-width',
    showHeader: true,
    showFooter: true,
    showBreadcrumbs: true,
    containerClass: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
    backgroundClass: 'bg-gradient-to-br from-blue-50 to-indigo-50'
  },

  sections: [
    {
      id: 'booking-hero',
      component: 'BookingHero',
      order: 1,
      visible: true,
      config: {
        variant: 'centered',
        title: 'Book Your Repair',
        subtitle: 'Get instant quotes and professional repair services',
        description: 'Our expert technicians fix phones, laptops, tablets, and more with guaranteed quality and quick turnaround.',
        features: [
          'Instant quote generation',
          'Expert diagnostics',
          'Quality guarantee',
          'Fast turnaround'
        ],
        cta: {
          text: 'Start Booking',
          action: 'scroll-to-form',
          target: 'booking-wizard'
        },
        image: {
          src: '/images/booking-hero.jpg',
          alt: 'Professional device repair services',
          width: 600,
          height: 400
        }
      }
    },

    {
      id: 'booking-wizard',
      component: 'BookingWizard',
      order: 2,
      visible: true,
      config: {
        ...bookingFormConfig,
        integrations: {
          deviceDatabase: {
            enabled: true,
            endpoint: '/api/devices',
            searchable: true,
            filters: ['brand', 'category', 'year'],
            sortBy: 'popularity'
          },
          pricing: {
            enabled: true,
            endpoint: '/api/pricing/calculate',
            realTime: true,
            factors: ['device_type', 'issue_complexity', 'service_level', 'urgency']
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
              confirmation: 'booking-confirmation',
              updates: 'booking-updates',
              completion: 'booking-completion'
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
            'issues_selected',
            'quote_generated',
            'customer_details_entered',
            'booking_completed'
          ]
        }
      }
    },

    {
      id: 'booking-services',
      component: 'ServicesOverview',
      order: 3,
      visible: true,
      config: bookingServicesConfig
    },

    {
      id: 'booking-pricing',
      component: 'PricingDisplay',
      order: 4,
      visible: true,
      config: bookingPricingConfig
    },

    {
      id: 'booking-trust',
      component: 'TrustIndicators',
      order: 5,
      visible: true,
      config: {
        variant: 'compact',
        indicators: [
          {
            icon: 'shield-check',
            title: 'Quality Guarantee',
            description: '6-month warranty on all repairs',
            color: 'green'
          },
          {
            icon: 'clock',
            title: 'Fast Turnaround',
            description: 'Most repairs completed within 24-48 hours',
            color: 'blue'
          },
          {
            icon: 'users',
            title: 'Expert Technicians',
            description: 'Certified professionals with 10+ years experience',
            color: 'purple'
          },
          {
            icon: 'star',
            title: '5-Star Reviews',
            description: '1,000+ satisfied customers',
            color: 'yellow'
          }
        ]
      }
    },

    {
      id: 'booking-faq',
      component: 'FAQ',
      order: 6,
      visible: true,
      config: {
        title: 'Booking FAQs',
        items: [
          {
            question: 'How accurate are the instant quotes?',
            answer: 'Our quotes are based on extensive repair data and are accurate within ±10%. Final pricing is confirmed after diagnostic inspection.'
          },
          {
            question: 'What if the repair costs more than quoted?',
            answer: 'We always contact you before any additional work. You can choose to proceed, modify the repair, or cancel without additional charges.'
          },
          {
            question: 'How long does the repair take?',
            answer: 'Most repairs are completed within 24-48 hours. Complex repairs may take 3-5 days. We provide regular updates throughout the process.'
          },
          {
            question: 'What if my device cannot be repaired?',
            answer: 'If repair is not possible, we provide a detailed diagnostic report and data recovery options. No repair fee applies.'
          },
          {
            question: 'Do you provide warranties?',
            answer: 'Yes, all repairs come with a 6-month warranty covering the repaired components and workmanship.'
          }
        ]
      }
    }
  ],

  integrations: {
    analytics: {
      enabled: true,
      provider: 'google',
      events: ['page_view', 'booking_started', 'booking_completed'],
      conversions: ['booking_completed']
    },
    chatbot: {
      enabled: true,
      context: 'booking',
      suggestions: [
        'Help me choose the right repair type',
        'Explain the pricing structure',
        'What information do I need to provide?',
        'How long will my repair take?'
      ]
    },
    notifications: {
      enabled: true,
      realTime: true,
      channels: ['browser', 'email']
    }
  },

  performance: {
    preload: ['device-database', 'pricing-calculator'],
    lazy: ['testimonials', 'faq'],
    cache: {
      devices: '1h',
      pricing: '30m',
      availability: '5m'
    }
  }
};

export default bookingPageConfig;