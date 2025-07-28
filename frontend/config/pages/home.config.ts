import { PageConfig } from '@/types/config';

export const HomePageConfig: PageConfig = {
  meta: {
    title: 'RevivaTech - Professional Computer Repair Services',
    description: 'Expert computer repair services for Mac, PC, and mobile devices. Fast, reliable, and affordable solutions in London and Lisbon.',
    keywords: [
      'computer repair',
      'mac repair',
      'pc repair',
      'laptop repair',
      'phone repair',
      'data recovery',
      'london',
      'lisbon',
      'revivatech'
    ],
    ogImage: '/images/revivatech-og-home.jpg',
    robots: 'index,follow',
  },
  
  layout: 'MainLayout',
  
  sections: [
    // Hero Section
    {
      id: 'hero',
      component: 'HeroSection',
      props: {
        variant: 'primary',
        size: 'large',
        background: 'gradient',
        alignment: 'center',
        title: {
          text: 'home.hero.title',
          level: 1,
          variant: 'display',
        },
        subtitle: {
          text: 'home.hero.subtitle',
          variant: 'large',
        },
        description: {
          text: 'home.hero.description',
          variant: 'body',
        },
        actions: [
          {
            component: 'Button',
            props: {
              text: 'home.hero.primaryAction',
              variant: 'primary',
              size: 'lg',
              href: '/book-repair',
            },
          },
          {
            component: 'Button',
            props: {
              text: 'home.hero.secondaryAction',
              variant: 'outline',
              size: 'lg',
              href: '/services',
            },
          },
        ],
        media: {
          type: 'image',
          src: '/images/hero-repair-workspace.jpg',
          alt: 'home.hero.imageAlt',
          priority: true,
        },
      },
      visibility: {
        responsive: {
          mobile: true,
          tablet: true,
          desktop: true,
        },
      },
    },
    
    // Services Overview Section
    {
      id: 'services-overview',
      component: 'ServicesGrid',
      props: {
        variant: 'cards',
        layout: 'grid',
        columns: {
          mobile: 1,
          tablet: 2,
          desktop: 3,
        },
        title: {
          text: 'home.services.title',
          level: 2,
          alignment: 'center',
        },
        services: [
          {
            id: 'mac-repair',
            icon: 'laptop',
            title: 'home.services.mac.title',
            description: 'home.services.mac.description',
            href: '/apple/mac-repair',
            features: [
              'home.services.mac.feature1',
              'home.services.mac.feature2',
              'home.services.mac.feature3',
            ],
          },
          {
            id: 'pc-repair',
            icon: 'desktop',
            title: 'home.services.pc.title',
            description: 'home.services.pc.description',
            href: '/laptop-pc/repair',
            features: [
              'home.services.pc.feature1',
              'home.services.pc.feature2',
              'home.services.pc.feature3',
            ],
          },
          {
            id: 'data-recovery',
            icon: 'harddrive',
            title: 'home.services.data.title',
            description: 'home.services.data.description',
            href: '/data-recovery',
            features: [
              'home.services.data.feature1',
              'home.services.data.feature2',
              'home.services.data.feature3',
            ],
          },
        ],
      },
    },
    
    // Why Choose Us Section
    {
      id: 'why-choose-us',
      component: 'FeatureHighlights',
      props: {
        variant: 'alternating',
        background: 'muted',
        title: {
          text: 'home.whyChoose.title',
          level: 2,
          alignment: 'center',
        },
        subtitle: {
          text: 'home.whyChoose.subtitle',
          alignment: 'center',
        },
        features: [
          {
            id: 'expert-technicians',
            icon: 'users',
            title: 'home.whyChoose.experts.title',
            description: 'home.whyChoose.experts.description',
            media: {
              type: 'image',
              src: '/images/expert-technicians.jpg',
              alt: 'home.whyChoose.experts.imageAlt',
            },
          },
          {
            id: 'fast-turnaround',
            icon: 'clock',
            title: 'home.whyChoose.fast.title',
            description: 'home.whyChoose.fast.description',
            media: {
              type: 'image',
              src: '/images/fast-repair.jpg',
              alt: 'home.whyChoose.fast.imageAlt',
            },
            reverse: true,
          },
          {
            id: 'warranty',
            icon: 'shield',
            title: 'home.whyChoose.warranty.title',
            description: 'home.whyChoose.warranty.description',
            media: {
              type: 'image',
              src: '/images/warranty-guarantee.jpg',
              alt: 'home.whyChoose.warranty.imageAlt',
            },
          },
        ],
      },
    },
    
    // Testimonials Section
    {
      id: 'testimonials',
      component: 'TestimonialsCarousel',
      props: {
        variant: 'cards',
        autoplay: true,
        title: {
          text: 'home.testimonials.title',
          level: 2,
          alignment: 'center',
        },
        testimonials: [
          {
            id: 'testimonial-1',
            name: 'Sarah Johnson',
            role: 'home.testimonials.customer1.role',
            content: 'home.testimonials.customer1.content',
            rating: 5,
            avatar: '/images/avatars/sarah-j.jpg',
          },
          {
            id: 'testimonial-2',
            name: 'Marco Silva',
            role: 'home.testimonials.customer2.role',
            content: 'home.testimonials.customer2.content',
            rating: 5,
            avatar: '/images/avatars/marco-s.jpg',
          },
          {
            id: 'testimonial-3',
            name: 'Emily Chen',
            role: 'home.testimonials.customer3.role',
            content: 'home.testimonials.customer3.content',
            rating: 5,
            avatar: '/images/avatars/emily-c.jpg',
          },
        ],
      },
    },
    
    // Process Section
    {
      id: 'repair-process',
      component: 'ProcessSteps',
      props: {
        variant: 'numbered',
        layout: 'horizontal',
        title: {
          text: 'home.process.title',
          level: 2,
          alignment: 'center',
        },
        subtitle: {
          text: 'home.process.subtitle',
          alignment: 'center',
        },
        steps: [
          {
            id: 'step-1',
            number: 1,
            icon: 'calendar',
            title: 'home.process.step1.title',
            description: 'home.process.step1.description',
          },
          {
            id: 'step-2',
            number: 2,
            icon: 'search',
            title: 'home.process.step2.title',
            description: 'home.process.step2.description',
          },
          {
            id: 'step-3',
            number: 3,
            icon: 'tool',
            title: 'home.process.step3.title',
            description: 'home.process.step3.description',
          },
          {
            id: 'step-4',
            number: 4,
            icon: 'check',
            title: 'home.process.step4.title',
            description: 'home.process.step4.description',
          },
        ],
      },
    },
    
    // CTA Section
    {
      id: 'cta',
      component: 'CallToAction',
      props: {
        variant: 'primary',
        background: 'gradient',
        alignment: 'center',
        title: {
          text: 'home.cta.title',
          level: 2,
          variant: 'display',
        },
        description: {
          text: 'home.cta.description',
          variant: 'large',
        },
        actions: [
          {
            component: 'Button',
            props: {
              text: 'home.cta.primaryAction',
              variant: 'secondary',
              size: 'lg',
              href: '/book-repair',
            },
          },
          {
            component: 'Button',
            props: {
              text: 'home.cta.secondaryAction',
              variant: 'ghost',
              size: 'lg',
              href: '/contact',
            },
          },
        ],
        features: [
          'home.cta.feature1',
          'home.cta.feature2',
          'home.cta.feature3',
        ],
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
    pageType: 'landing',
    category: 'marketing',
    customDimensions: {
      section: 'home',
      template: 'landing-page',
    },
  },
};

export default HomePageConfig;