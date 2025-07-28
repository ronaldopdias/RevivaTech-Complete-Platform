import { PageConfig } from '@/types/config';

export const ServicesPageConfig: PageConfig = {
  meta: {
    title: 'Our Services - RevivaTech Computer Repair',
    description: 'Comprehensive computer repair services including Mac, PC, laptop, and mobile device repairs. Professional data recovery and virus removal services.',
    keywords: [
      'computer repair services',
      'mac repair',
      'pc repair',
      'laptop repair',
      'data recovery',
      'virus removal',
      'screen replacement',
      'hardware upgrade',
      'professional repair',
      'london',
      'revivatech'
    ],
    ogImage: '/images/revivatech-og-services.jpg',
    robots: 'index,follow',
  },
  
  layout: 'MainLayout',
  
  sections: [
    // Page Header
    {
      id: 'page-header',
      component: 'PageHeader',
      props: {
        variant: 'centered',
        size: 'large',
        title: {
          text: 'services.header.title',
          level: 1,
          variant: 'display',
        },
        subtitle: {
          text: 'services.header.subtitle',
          variant: 'large',
        },
        description: {
          text: 'services.header.description',
          variant: 'body',
        },
        breadcrumb: [
          { label: 'Home', href: '/' },
          { label: 'Services', href: '/services' },
        ],
      },
    },
    
    // Services Grid
    {
      id: 'services-grid',
      component: 'ServicesGrid',
      props: {
        variant: 'detailed',
        layout: 'grid',
        columns: {
          mobile: 1,
          tablet: 2,
          desktop: 3,
        },
        services: [
          {
            id: 'mac-repair',
            category: 'Apple Devices',
            title: 'services.mac.title',
            description: 'services.mac.description',
            icon: 'laptop',
            href: '/apple/mac-repair',
            featured: true,
            pricing: {
              from: 49,
              currency: 'GBP',
            },
            features: [
              'services.mac.feature1',
              'services.mac.feature2',
              'services.mac.feature3',
              'services.mac.feature4',
            ],
            badge: 'Most Popular',
          },
          {
            id: 'pc-repair',
            category: 'PC & Laptop',
            title: 'services.pc.title',
            description: 'services.pc.description',
            icon: 'desktop',
            href: '/laptop-pc/repair',
            pricing: {
              from: 39,
              currency: 'GBP',
            },
            features: [
              'services.pc.feature1',
              'services.pc.feature2',
              'services.pc.feature3',
              'services.pc.feature4',
            ],
          },
          {
            id: 'iphone-repair',
            category: 'Mobile Devices',
            title: 'services.iphone.title',
            description: 'services.iphone.description',
            icon: 'smartphone',
            href: '/apple/iphone-repair',
            pricing: {
              from: 29,
              currency: 'GBP',
            },
            features: [
              'services.iphone.feature1',
              'services.iphone.feature2',
              'services.iphone.feature3',
              'services.iphone.feature4',
            ],
          },
          {
            id: 'data-recovery',
            category: 'Data Services',
            title: 'services.data.title',
            description: 'services.data.description',
            icon: 'harddrive',
            href: '/data-recovery',
            pricing: {
              from: 99,
              currency: 'GBP',
            },
            features: [
              'services.data.feature1',
              'services.data.feature2',
              'services.data.feature3',
              'services.data.feature4',
            ],
            badge: 'Emergency Available',
          },
          {
            id: 'virus-removal',
            category: 'Software Services',
            title: 'services.virus.title',
            description: 'services.virus.description',
            icon: 'shield',
            href: '/laptop-pc/virus-removal',
            pricing: {
              from: 69,
              currency: 'GBP',
            },
            features: [
              'services.virus.feature1',
              'services.virus.feature2',
              'services.virus.feature3',
              'services.virus.feature4',
            ],
          },
          {
            id: 'hardware-upgrade',
            category: 'Upgrades',
            title: 'services.upgrade.title',
            description: 'services.upgrade.description',
            icon: 'cpu',
            href: '/laptop-pc/upgrades',
            pricing: {
              from: 79,
              currency: 'GBP',
            },
            features: [
              'services.upgrade.feature1',
              'services.upgrade.feature2',
              'services.upgrade.feature3',
              'services.upgrade.feature4',
            ],
          },
        ],
      },
    },
    
    // Service Categories
    {
      id: 'service-categories',
      component: 'ServiceCategories',
      props: {
        variant: 'tabs',
        title: {
          text: 'services.categories.title',
          level: 2,
          alignment: 'center',
        },
        subtitle: {
          text: 'services.categories.subtitle',
          alignment: 'center',
        },
        categories: [
          {
            id: 'apple-devices',
            title: 'services.categories.apple.title',
            description: 'services.categories.apple.description',
            icon: 'apple',
            services: [
              'MacBook Repair',
              'iMac Repair',
              'iPhone Repair',
              'iPad Repair',
              'Mac Mini Repair',
              'Apple Watch Repair',
            ],
          },
          {
            id: 'pc-laptop',
            title: 'services.categories.pc.title',
            description: 'services.categories.pc.description',
            icon: 'monitor',
            services: [
              'Laptop Repair',
              'Desktop PC Repair',
              'Gaming PC Repair',
              'Workstation Repair',
              'All-in-One PC Repair',
              'Custom Builds',
            ],
          },
          {
            id: 'mobile-devices',
            title: 'services.categories.mobile.title',
            description: 'services.categories.mobile.description',
            icon: 'smartphone',
            services: [
              'Android Repair',
              'Samsung Repair',
              'Google Pixel Repair',
              'OnePlus Repair',
              'Tablet Repair',
              'Smartwatch Repair',
            ],
          },
          {
            id: 'data-services',
            title: 'services.categories.data.title',
            description: 'services.categories.data.description',
            icon: 'database',
            services: [
              'Hard Drive Recovery',
              'SSD Recovery',
              'RAID Recovery',
              'USB Recovery',
              'SD Card Recovery',
              'Cloud Recovery',
            ],
          },
        ],
      },
    },
    
    // Service Process
    {
      id: 'service-process',
      component: 'ServiceProcess',
      props: {
        variant: 'detailed',
        layout: 'vertical',
        title: {
          text: 'services.process.title',
          level: 2,
          alignment: 'center',
        },
        subtitle: {
          text: 'services.process.subtitle',
          alignment: 'center',
        },
        steps: [
          {
            id: 'step-1',
            number: 1,
            title: 'services.process.step1.title',
            description: 'services.process.step1.description',
            icon: 'calendar',
            details: [
              'services.process.step1.detail1',
              'services.process.step1.detail2',
              'services.process.step1.detail3',
            ],
          },
          {
            id: 'step-2',
            number: 2,
            title: 'services.process.step2.title',
            description: 'services.process.step2.description',
            icon: 'search',
            details: [
              'services.process.step2.detail1',
              'services.process.step2.detail2',
              'services.process.step2.detail3',
            ],
          },
          {
            id: 'step-3',
            number: 3,
            title: 'services.process.step3.title',
            description: 'services.process.step3.description',
            icon: 'file-text',
            details: [
              'services.process.step3.detail1',
              'services.process.step3.detail2',
              'services.process.step3.detail3',
            ],
          },
          {
            id: 'step-4',
            number: 4,
            title: 'services.process.step4.title',
            description: 'services.process.step4.description',
            icon: 'wrench',
            details: [
              'services.process.step4.detail1',
              'services.process.step4.detail2',
              'services.process.step4.detail3',
            ],
          },
          {
            id: 'step-5',
            number: 5,
            title: 'services.process.step5.title',
            description: 'services.process.step5.description',
            icon: 'check-circle',
            details: [
              'services.process.step5.detail1',
              'services.process.step5.detail2',
              'services.process.step5.detail3',
            ],
          },
        ],
      },
    },
    
    // Warranty & Guarantees
    {
      id: 'warranty-section',
      component: 'WarrantySection',
      props: {
        variant: 'highlighted',
        background: 'muted',
        title: {
          text: 'services.warranty.title',
          level: 2,
          alignment: 'center',
        },
        subtitle: {
          text: 'services.warranty.subtitle',
          alignment: 'center',
        },
        guarantees: [
          {
            id: 'warranty',
            icon: 'shield',
            title: 'services.warranty.guarantee1.title',
            description: 'services.warranty.guarantee1.description',
            period: '90 days',
          },
          {
            id: 'parts',
            icon: 'check-circle',
            title: 'services.warranty.guarantee2.title',
            description: 'services.warranty.guarantee2.description',
            period: 'Genuine',
          },
          {
            id: 'satisfaction',
            icon: 'star',
            title: 'services.warranty.guarantee3.title',
            description: 'services.warranty.guarantee3.description',
            period: '100%',
          },
          {
            id: 'data-safety',
            icon: 'lock',
            title: 'services.warranty.guarantee4.title',
            description: 'services.warranty.guarantee4.description',
            period: 'Protected',
          },
        ],
      },
    },
    
    // Pricing Information
    {
      id: 'pricing-info',
      component: 'PricingInfo',
      props: {
        variant: 'transparent',
        title: {
          text: 'services.pricing.title',
          level: 2,
          alignment: 'center',
        },
        subtitle: {
          text: 'services.pricing.subtitle',
          alignment: 'center',
        },
        features: [
          'services.pricing.feature1',
          'services.pricing.feature2',
          'services.pricing.feature3',
          'services.pricing.feature4',
        ],
        cta: {
          text: 'services.pricing.cta',
          href: '/book-repair',
          variant: 'primary',
        },
      },
    },
    
    // FAQ Section
    {
      id: 'services-faq',
      component: 'FAQSection',
      props: {
        variant: 'accordion',
        title: {
          text: 'services.faq.title',
          level: 2,
          alignment: 'center',
        },
        subtitle: {
          text: 'services.faq.subtitle',
          alignment: 'center',
        },
        faqs: [
          {
            id: 'faq-1',
            question: 'services.faq.question1',
            answer: 'services.faq.answer1',
          },
          {
            id: 'faq-2',
            question: 'services.faq.question2',
            answer: 'services.faq.answer2',
          },
          {
            id: 'faq-3',
            question: 'services.faq.question3',
            answer: 'services.faq.answer3',
          },
          {
            id: 'faq-4',
            question: 'services.faq.question4',
            answer: 'services.faq.answer4',
          },
          {
            id: 'faq-5',
            question: 'services.faq.question5',
            answer: 'services.faq.answer5',
          },
        ],
      },
    },
    
    // CTA Section
    {
      id: 'services-cta',
      component: 'CallToAction',
      props: {
        variant: 'primary',
        background: 'gradient',
        alignment: 'center',
        title: {
          text: 'services.cta.title',
          level: 2,
          variant: 'display',
        },
        description: {
          text: 'services.cta.description',
          variant: 'large',
        },
        actions: [
          {
            component: 'Button',
            props: {
              text: 'services.cta.primaryAction',
              variant: 'secondary',
              size: 'lg',
              href: '/book-repair',
            },
          },
          {
            component: 'Button',
            props: {
              text: 'services.cta.secondaryAction',
              variant: 'ghost',
              size: 'lg',
              href: '/contact',
            },
          },
        ],
        contact: {
          phone: '+44 20 1234 5678',
          email: 'support@revivatech.com',
        },
      },
    },
  ],
  
  features: [
    'seo',
    'analytics',
    'performance',
    'accessibility',
  ],
  
  auth: {
    required: false,
  },
  
  analytics: {
    pageType: 'service',
    category: 'marketing',
    customDimensions: {
      section: 'services',
      template: 'services-listing',
    },
  },
};

export default ServicesPageConfig;