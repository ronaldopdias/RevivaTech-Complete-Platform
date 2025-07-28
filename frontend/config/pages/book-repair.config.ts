import { PageConfig } from '@/types/config';

export const BookRepairPageConfig: PageConfig = {
  meta: {
    title: 'Book a Repair - RevivaTech Computer Repair',
    description: 'Book your computer repair online. Quick diagnostic, transparent pricing, and professional service for Mac, PC, and mobile devices.',
    keywords: [
      'book repair',
      'computer repair booking',
      'mac repair booking',
      'pc repair booking',
      'device repair appointment',
      'online booking',
      'repair quote',
      'london computer repair',
      'revivatech booking'
    ],
    ogImage: '/images/revivatech-og-booking.jpg',
    robots: 'index,follow',
  },
  
  layout: 'MainLayout',
  
  sections: [
    // Page Header
    {
      id: 'booking-header',
      component: 'PageHeader',
      props: {
        variant: 'simple',
        size: 'medium',
        title: {
          text: 'booking.header.title',
          level: 1,
          variant: 'heading',
        },
        subtitle: {
          text: 'booking.header.subtitle',
          variant: 'large',
        },
        description: {
          text: 'booking.header.description',
          variant: 'body',
        },
        breadcrumb: [
          { label: 'Home', href: '/' },
          { label: 'Book Repair', href: '/book-repair' },
        ],
      },
    },
    
    // Benefits Bar
    {
      id: 'booking-benefits',
      component: 'BenefitsBar',
      props: {
        variant: 'horizontal',
        background: 'muted',
        benefits: [
          {
            icon: 'clock',
            text: 'booking.benefits.benefit1',
          },
          {
            icon: 'shield',
            text: 'booking.benefits.benefit2',
          },
          {
            icon: 'star',
            text: 'booking.benefits.benefit3',
          },
          {
            icon: 'phone',
            text: 'booking.benefits.benefit4',
          },
        ],
      },
    },
    
    // Main Booking Form
    {
      id: 'booking-form',
      component: 'BookingForm',
      props: {
        variant: 'comprehensive',
        title: {
          text: 'booking.form.title',
          level: 2,
        },
        description: {
          text: 'booking.form.description',
        },
        formConfig: 'booking', // Reference to booking form config
        onSubmit: 'handleBookingSubmit',
        showEstimate: true,
        estimateConfig: {
          diagnosticFee: 25,
          priorityFee: 25,
          emergencyFee: 50,
          pickupDeliveryFee: 15,
          onSiteFee: 45,
        },
      },
    },
    
    // Booking Process
    {
      id: 'booking-process',
      component: 'BookingProcess',
      props: {
        variant: 'timeline',
        title: {
          text: 'booking.process.title',
          level: 2,
          alignment: 'center',
        },
        subtitle: {
          text: 'booking.process.subtitle',
          alignment: 'center',
        },
        steps: [
          {
            id: 'step-1',
            number: 1,
            title: 'booking.process.step1.title',
            description: 'booking.process.step1.description',
            icon: 'form',
            status: 'current',
          },
          {
            id: 'step-2',
            number: 2,
            title: 'booking.process.step2.title',
            description: 'booking.process.step2.description',
            icon: 'calendar-check',
            status: 'upcoming',
          },
          {
            id: 'step-3',
            number: 3,
            title: 'booking.process.step3.title',
            description: 'booking.process.step3.description',
            icon: 'search',
            status: 'upcoming',
          },
          {
            id: 'step-4',
            number: 4,
            title: 'booking.process.step4.title',
            description: 'booking.process.step4.description',
            icon: 'wrench',
            status: 'upcoming',
          },
          {
            id: 'step-5',
            number: 5,
            title: 'booking.process.step5.title',
            description: 'booking.process.step5.description',
            icon: 'check-circle',
            status: 'upcoming',
          },
        ],
      },
    },
    
    // Pricing Information
    {
      id: 'booking-pricing',
      component: 'PricingInformation',
      props: {
        variant: 'transparent',
        background: 'muted',
        title: {
          text: 'booking.pricing.title',
          level: 2,
          alignment: 'center',
        },
        subtitle: {
          text: 'booking.pricing.subtitle',
          alignment: 'center',
        },
        pricingItems: [
          {
            id: 'diagnostic',
            title: 'booking.pricing.diagnostic.title',
            price: '£25',
            description: 'booking.pricing.diagnostic.description',
            badge: 'booking.pricing.diagnostic.badge',
          },
          {
            id: 'priority',
            title: 'booking.pricing.priority.title',
            price: '+£25',
            description: 'booking.pricing.priority.description',
          },
          {
            id: 'emergency',
            title: 'booking.pricing.emergency.title',
            price: '+£50',
            description: 'booking.pricing.emergency.description',
          },
          {
            id: 'pickup-delivery',
            title: 'booking.pricing.pickup.title',
            price: '+£15',
            description: 'booking.pricing.pickup.description',
          },
        ],
        note: 'booking.pricing.note',
      },
    },
    
    // FAQ Section
    {
      id: 'booking-faq',
      component: 'FAQSection',
      props: {
        variant: 'compact',
        title: {
          text: 'booking.faq.title',
          level: 2,
          alignment: 'center',
        },
        subtitle: {
          text: 'booking.faq.subtitle',
          alignment: 'center',
        },
        faqs: [
          {
            id: 'faq-1',
            question: 'booking.faq.question1',
            answer: 'booking.faq.answer1',
          },
          {
            id: 'faq-2',
            question: 'booking.faq.question2',
            answer: 'booking.faq.answer2',
          },
          {
            id: 'faq-3',
            question: 'booking.faq.question3',
            answer: 'booking.faq.answer3',
          },
          {
            id: 'faq-4',
            question: 'booking.faq.question4',
            answer: 'booking.faq.answer4',
          },
          {
            id: 'faq-5',
            question: 'booking.faq.question5',
            answer: 'booking.faq.answer5',
          },
        ],
      },
    },
    
    // Contact Support
    {
      id: 'booking-support',
      component: 'ContactSupport',
      props: {
        variant: 'minimal',
        title: {
          text: 'booking.support.title',
          level: 3,
          alignment: 'center',
        },
        description: {
          text: 'booking.support.description',
          alignment: 'center',
        },
        contactMethods: [
          {
            id: 'phone',
            icon: 'phone',
            label: 'booking.support.phone.label',
            value: '+44 20 1234 5678',
            href: 'tel:+442012345678',
          },
          {
            id: 'email',
            icon: 'mail',
            label: 'booking.support.email.label',
            value: 'booking@revivatech.com',
            href: 'mailto:booking@revivatech.com',
          },
          {
            id: 'whatsapp',
            icon: 'message-circle',
            label: 'booking.support.whatsapp.label',
            value: 'WhatsApp',
            href: 'https://wa.me/442012345678',
          },
        ],
      },
    },
  ],
  
  features: [
    'seo',
    'analytics',
    'performance',
    'accessibility',
    'forms',
  ],
  
  auth: {
    required: false,
  },
  
  analytics: {
    pageType: 'conversion',
    category: 'booking',
    customDimensions: {
      section: 'booking',
      template: 'booking-form',
      funnel_step: 'initial',
    },
  },
};

export default BookRepairPageConfig;