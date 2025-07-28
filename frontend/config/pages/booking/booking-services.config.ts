import { ComponentConfig } from '@/lib/components/types';

export const bookingServicesConfig: ComponentConfig = {
  id: 'booking-services',
  variant: 'comprehensive',
  
  title: 'Our Repair Services',
  subtitle: 'Professional repair for all your devices',
  description: 'We fix everything from smartphones to laptops with guaranteed quality and competitive pricing.',
  
  services: [
    {
      id: 'smartphone-repair',
      name: 'Smartphone Repair',
      icon: 'smartphone',
      image: '/images/services/smartphone-repair.jpg',
      description: 'Expert repair for all smartphone brands and models',
      features: [
        'Screen replacement',
        'Battery replacement',
        'Camera repair',
        'Charging port fix',
        'Water damage recovery',
        'Software troubleshooting'
      ],
      devices: [
        'iPhone (all models)',
        'Samsung Galaxy',
        'Google Pixel',
        'OnePlus',
        'Huawei',
        'Xiaomi'
      ],
      pricing: {
        startingFrom: 29,
        currency: 'GBP',
        typical: {
          screen: { min: 49, max: 199 },
          battery: { min: 29, max: 79 },
          camera: { min: 39, max: 129 }
        }
      },
      turnaround: {
        standard: '24-48 hours',
        express: '2-4 hours',
        emergency: 'Same day'
      },
      warranty: {
        duration: 6,
        unit: 'months',
        coverage: 'Parts and labor'
      }
    },
    
    {
      id: 'laptop-repair',
      name: 'Laptop Repair',
      icon: 'laptop',
      image: '/images/services/laptop-repair.jpg',
      description: 'Comprehensive laptop repair and upgrade services',
      features: [
        'Screen replacement',
        'Keyboard repair',
        'Hard drive upgrade',
        'RAM upgrade',
        'Fan cleaning',
        'Virus removal',
        'Operating system reinstall'
      ],
      devices: [
        'MacBook (all models)',
        'Dell Laptops',
        'HP Laptops',
        'Lenovo ThinkPad',
        'ASUS Laptops',
        'Surface Laptops'
      ],
      pricing: {
        startingFrom: 49,
        currency: 'GBP',
        typical: {
          screen: { min: 99, max: 399 },
          keyboard: { min: 79, max: 159 },
          upgrade: { min: 49, max: 299 }
        }
      },
      turnaround: {
        standard: '2-5 days',
        express: '24-48 hours',
        emergency: 'Same day'
      },
      warranty: {
        duration: 6,
        unit: 'months',
        coverage: 'Parts and labor'
      }
    },
    
    {
      id: 'tablet-repair',
      name: 'Tablet Repair',
      icon: 'tablet',
      image: '/images/services/tablet-repair.jpg',
      description: 'Professional tablet repair for all brands',
      features: [
        'Screen replacement',
        'Battery replacement',
        'Charging port repair',
        'Button repair',
        'Speaker repair',
        'Software issues'
      ],
      devices: [
        'iPad (all models)',
        'Samsung Galaxy Tab',
        'Surface Tablets',
        'Kindle Fire',
        'Huawei Tablets',
        'Lenovo Tablets'
      ],
      pricing: {
        startingFrom: 39,
        currency: 'GBP',
        typical: {
          screen: { min: 79, max: 299 },
          battery: { min: 49, max: 99 },
          port: { min: 39, max: 79 }
        }
      },
      turnaround: {
        standard: '24-72 hours',
        express: '4-8 hours',
        emergency: 'Same day'
      },
      warranty: {
        duration: 6,
        unit: 'months',
        coverage: 'Parts and labor'
      }
    },
    
    {
      id: 'desktop-repair',
      name: 'Desktop Repair',
      icon: 'monitor',
      image: '/images/services/desktop-repair.jpg',
      description: 'Complete desktop computer repair and upgrade',
      features: [
        'Hardware diagnosis',
        'Component replacement',
        'Performance upgrades',
        'Virus removal',
        'Data recovery',
        'Custom builds'
      ],
      devices: [
        'iMac (all models)',
        'Windows PCs',
        'Gaming PCs',
        'Workstations',
        'All-in-one PCs',
        'Custom builds'
      ],
      pricing: {
        startingFrom: 59,
        currency: 'GBP',
        typical: {
          diagnosis: { min: 29, max: 49 },
          repair: { min: 79, max: 499 },
          upgrade: { min: 99, max: 799 }
        }
      },
      turnaround: {
        standard: '2-7 days',
        express: '24-48 hours',
        emergency: 'Same day'
      },
      warranty: {
        duration: 12,
        unit: 'months',
        coverage: 'Parts and labor'
      }
    },
    
    {
      id: 'gaming-console-repair',
      name: 'Gaming Console Repair',
      icon: 'gamepad',
      image: '/images/services/console-repair.jpg',
      description: 'Professional gaming console repair services',
      features: [
        'HDMI port repair',
        'Laser lens cleaning',
        'Fan replacement',
        'Controller repair',
        'Software updates',
        'Overheating fixes'
      ],
      devices: [
        'PlayStation 5',
        'PlayStation 4',
        'Xbox Series X/S',
        'Xbox One',
        'Nintendo Switch',
        'Steam Deck'
      ],
      pricing: {
        startingFrom: 49,
        currency: 'GBP',
        typical: {
          cleaning: { min: 29, max: 49 },
          repair: { min: 79, max: 199 },
          controller: { min: 39, max: 89 }
        }
      },
      turnaround: {
        standard: '24-72 hours',
        express: '4-8 hours',
        emergency: 'Same day'
      },
      warranty: {
        duration: 3,
        unit: 'months',
        coverage: 'Repair work only'
      }
    },
    
    {
      id: 'data-recovery',
      name: 'Data Recovery',
      icon: 'hard-drive',
      image: '/images/services/data-recovery.jpg',
      description: 'Professional data recovery from damaged devices',
      features: [
        'Hard drive recovery',
        'SSD recovery',
        'SD card recovery',
        'USB drive recovery',
        'Phone data recovery',
        'RAID recovery'
      ],
      devices: [
        'All storage devices',
        'Smartphones',
        'Laptops',
        'Desktops',
        'Servers',
        'Memory cards'
      ],
      pricing: {
        startingFrom: 99,
        currency: 'GBP',
        typical: {
          evaluation: { min: 29, max: 49 },
          recovery: { min: 199, max: 799 },
          emergency: { min: 399, max: 1599 }
        }
      },
      turnaround: {
        standard: '5-10 days',
        express: '2-5 days',
        emergency: '24-48 hours'
      },
      warranty: {
        duration: 30,
        unit: 'days',
        coverage: 'Recovery success guarantee'
      }
    }
  ],
  
  serviceFeatures: {
    global: [
      {
        icon: 'shield-check',
        title: 'Quality Guarantee',
        description: 'All repairs backed by our comprehensive warranty'
      },
      {
        icon: 'clock',
        title: 'Fast Turnaround',
        description: 'Most repairs completed within 24-48 hours'
      },
      {
        icon: 'pound-sterling',
        title: 'No Fix, No Fee',
        description: 'If we can\'t fix it, you don\'t pay'
      },
      {
        icon: 'truck',
        title: 'Free Collection',
        description: 'Free collection and delivery within London'
      },
      {
        icon: 'users',
        title: 'Expert Technicians',
        description: 'Certified professionals with 10+ years experience'
      },
      {
        icon: 'star',
        title: '5-Star Service',
        description: 'Rated 5 stars by over 1,000 customers'
      }
    ]
  },
  
  bookingCTA: {
    title: 'Ready to get started?',
    description: 'Get an instant quote and book your repair in minutes',
    primaryButton: {
      text: 'Get Instant Quote',
      action: 'scroll-to-wizard',
      variant: 'primary'
    },
    secondaryButton: {
      text: 'Call Us Now',
      action: 'phone',
      href: 'tel:+442071234567',
      variant: 'secondary'
    }
  },
  
  testimonials: {
    enabled: true,
    count: 3,
    source: 'featured',
    items: [
      {
        id: 'testimonial-1',
        name: 'Sarah Johnson',
        role: 'Business Owner',
        avatar: '/images/testimonials/sarah.jpg',
        rating: 5,
        text: 'Excellent service! My MacBook was repaired within 24 hours and works perfectly. The team was professional and kept me updated throughout.',
        service: 'laptop-repair',
        date: '2024-01-15'
      },
      {
        id: 'testimonial-2',
        name: 'Mark Thompson',
        role: 'Student',
        avatar: '/images/testimonials/mark.jpg',
        rating: 5,
        text: 'Dropped my iPhone and the screen was completely shattered. They fixed it in 2 hours and it looks brand new. Great value for money!',
        service: 'smartphone-repair',
        date: '2024-01-12'
      },
      {
        id: 'testimonial-3',
        name: 'Emma Davis',
        role: 'Graphic Designer',
        avatar: '/images/testimonials/emma.jpg',
        rating: 5,
        text: 'Amazing data recovery service! They recovered all my important files from a crashed hard drive. Lifesavers!',
        service: 'data-recovery',
        date: '2024-01-10'
      }
    ]
  },
  
  layout: {
    type: 'grid',
    columns: {
      mobile: 1,
      tablet: 2,
      desktop: 3
    },
    spacing: 'lg',
    showIcons: true,
    showPricing: true,
    showFeatures: true,
    expandable: true
  }
};

export default bookingServicesConfig;