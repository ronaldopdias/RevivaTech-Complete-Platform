import { RouteConfig } from '@/types/config';

export const routes: RouteConfig[] = [
  // Public routes
  {
    path: '/',
    page: 'home',
    exact: true,
  },
  
  {
    path: '/about',
    page: 'about',
  },
  
  {
    path: '/services',
    page: 'services',
    subroutes: [
      {
        path: '/services/mac-repair',
        page: 'services/mac-repair',
      },
      {
        path: '/services/iphone-repair',
        page: 'services/iphone-repair',
      },
      {
        path: '/services/ipad-repair',
        page: 'services/ipad-repair',
      },
      {
        path: '/services/pc-repair',
        page: 'services/pc-repair',
      },
      {
        path: '/services/data-recovery',
        page: 'services/data-recovery',
      },
      {
        path: '/services/virus-removal',
        page: 'services/virus-removal',
      },
    ],
  },
  
  {
    path: '/contact',
    page: 'contact',
  },
  
  {
    path: '/pricing',
    page: 'pricing',
  },
  
  {
    path: '/reviews',
    page: 'reviews',
  },
  
  // Booking flow
  {
    path: '/booking',
    page: 'booking/start',
    subroutes: [
      {
        path: '/booking/device',
        page: 'booking/device-selection',
      },
      {
        path: '/booking/model',
        page: 'booking/model-selection',
      },
      {
        path: '/booking/repair',
        page: 'booking/repair-selection',
      },
      {
        path: '/booking/details',
        page: 'booking/customer-details',
      },
      {
        path: '/booking/appointment',
        page: 'booking/appointment-scheduling',
      },
      {
        path: '/booking/confirmation',
        page: 'booking/confirmation',
      },
      {
        path: '/booking/success',
        page: 'booking/success',
      },
    ],
  },
  
  // Authentication routes
  {
    path: '/auth',
    page: 'auth/layout',
    subroutes: [
      {
        path: '/auth/login',
        page: 'auth/login',
      },
      {
        path: '/auth/register',
        page: 'auth/register',
      },
      {
        path: '/auth/forgot-password',
        page: 'auth/forgot-password',
      },
      {
        path: '/auth/reset-password',
        page: 'auth/reset-password',
      },
      {
        path: '/auth/verify-email',
        page: 'auth/verify-email',
      },
      {
        path: '/auth/verify-email-notice',
        page: 'auth/verify-email-notice',
      },
    ],
  },
  
  // Customer dashboard
  {
    path: '/dashboard',
    page: 'customer/dashboard',
    middleware: ['auth'],
    subroutes: [
      {
        path: '/dashboard/repairs',
        page: 'customer/repairs',
      },
      {
        path: '/dashboard/bookings',
        page: 'customer/bookings',
      },
      {
        path: '/dashboard/profile',
        page: 'customer/profile',
      },
      {
        path: '/dashboard/invoices',
        page: 'customer/invoices',
      },
      {
        path: '/dashboard/support',
        page: 'customer/support',
      },
      {
        path: '/dashboard/settings',
        page: 'customer/settings',
      },
    ],
  },
  
  // Admin dashboard
  {
    path: '/admin',
    page: 'admin/dashboard',
    middleware: ['auth', 'admin'],
    subroutes: [
      // Analytics
      {
        path: '/admin/analytics',
        page: 'admin/analytics/overview',
        subroutes: [
          {
            path: '/admin/analytics/bookings',
            page: 'admin/analytics/bookings',
          },
          {
            path: '/admin/analytics/revenue',
            page: 'admin/analytics/revenue',
          },
          {
            path: '/admin/analytics/customers',
            page: 'admin/analytics/customers',
          },
          {
            path: '/admin/analytics/performance',
            page: 'admin/analytics/performance',
          },
        ],
      },
      
      // Repair management
      {
        path: '/admin/repairs',
        page: 'admin/repairs/list',
        subroutes: [
          {
            path: '/admin/repairs/queue',
            page: 'admin/repairs/queue',
          },
          {
            path: '/admin/repairs/[id]',
            page: 'admin/repairs/details',
            dynamic: true,
          },
          {
            path: '/admin/repairs/new',
            page: 'admin/repairs/new',
          },
        ],
      },
      
      // Customer management
      {
        path: '/admin/customers',
        page: 'admin/customers/list',
        subroutes: [
          {
            path: '/admin/customers/[id]',
            page: 'admin/customers/details',
            dynamic: true,
          },
          {
            path: '/admin/customers/new',
            page: 'admin/customers/new',
          },
        ],
      },
      
      // Inventory management
      {
        path: '/admin/inventory',
        page: 'admin/inventory/overview',
        subroutes: [
          {
            path: '/admin/inventory/parts',
            page: 'admin/inventory/parts',
          },
          {
            path: '/admin/inventory/suppliers',
            page: 'admin/inventory/suppliers',
          },
          {
            path: '/admin/inventory/orders',
            page: 'admin/inventory/orders',
          },
        ],
      },
      
      // Chat management
      {
        path: '/admin/chat',
        page: 'admin/chat/dashboard',
        subroutes: [
          {
            path: '/admin/chat/conversations',
            page: 'admin/chat/conversations',
          },
          {
            path: '/admin/chat/agents',
            page: 'admin/chat/agents',
          },
          {
            path: '/admin/chat/settings',
            page: 'admin/chat/settings',
          },
        ],
      },
      
      // User management
      {
        path: '/admin/users',
        page: 'admin/users/list',
        subroutes: [
          {
            path: '/admin/users/[id]',
            page: 'admin/users/details',
            dynamic: true,
          },
          {
            path: '/admin/users/new',
            page: 'admin/users/new',
          },
          {
            path: '/admin/users/roles',
            page: 'admin/users/roles',
          },
        ],
      },
      
      // Content management
      {
        path: '/admin/content',
        page: 'admin/content/overview',
        subroutes: [
          {
            path: '/admin/content/pages',
            page: 'admin/content/pages',
          },
          {
            path: '/admin/content/blog',
            page: 'admin/content/blog',
          },
          {
            path: '/admin/content/media',
            page: 'admin/content/media',
          },
          {
            path: '/admin/content/translations',
            page: 'admin/content/translations',
          },
        ],
      },
      
      // SEO management
      {
        path: '/admin/seo',
        page: 'admin/seo/overview',
        subroutes: [
          {
            path: '/admin/seo/meta',
            page: 'admin/seo/meta',
          },
          {
            path: '/admin/seo/sitemap',
            page: 'admin/seo/sitemap',
          },
          {
            path: '/admin/seo/keywords',
            page: 'admin/seo/keywords',
          },
          {
            path: '/admin/seo/audit',
            page: 'admin/seo/audit',
          },
        ],
      },
      
      // Settings
      {
        path: '/admin/settings',
        page: 'admin/settings/general',
        subroutes: [
          {
            path: '/admin/settings/system',
            page: 'admin/settings/system',
          },
          {
            path: '/admin/settings/integrations',
            page: 'admin/settings/integrations',
          },
          {
            path: '/admin/settings/security',
            page: 'admin/settings/security',
          },
          {
            path: '/admin/settings/backup',
            page: 'admin/settings/backup',
          },
        ],
      },
    ],
  },
  
  // Device-specific routes
  {
    path: '/apple',
    page: 'devices/apple/overview',
    subroutes: [
      {
        path: '/apple/macbook-repair',
        page: 'devices/apple/macbook-repair',
      },
      {
        path: '/apple/imac-repair',
        page: 'devices/apple/imac-repair',
      },
      {
        path: '/apple/mac-mini-repair',
        page: 'devices/apple/mac-mini-repair',
      },
      {
        path: '/apple/iphone-repair',
        page: 'devices/apple/iphone-repair',
      },
      {
        path: '/apple/ipad-repair',
        page: 'devices/apple/ipad-repair',
      },
      {
        path: '/apple/data-recovery',
        page: 'devices/apple/data-recovery',
      },
    ],
  },
  
  {
    path: '/laptop-pc',
    page: 'devices/pc/overview',
    subroutes: [
      {
        path: '/laptop-pc/repair',
        page: 'devices/pc/laptop-repair',
      },
      {
        path: '/laptop-pc/screen-repair',
        page: 'devices/pc/screen-repair',
      },
      {
        path: '/laptop-pc/virus-removal',
        page: 'devices/pc/virus-removal',
      },
      {
        path: '/laptop-pc/data-recovery',
        page: 'devices/pc/data-recovery',
      },
      {
        path: '/laptop-pc/custom-builds',
        page: 'devices/pc/custom-builds',
      },
    ],
  },
  
  // Support and legal
  {
    path: '/support',
    page: 'support/overview',
    subroutes: [
      {
        path: '/support/faq',
        page: 'support/faq',
      },
      {
        path: '/support/warranty',
        page: 'support/warranty',
      },
      {
        path: '/support/track',
        page: 'support/track',
      },
      {
        path: '/support/contact',
        page: 'support/contact',
      },
    ],
  },
  
  {
    path: '/legal',
    page: 'legal/overview',
    subroutes: [
      {
        path: '/legal/privacy',
        page: 'legal/privacy',
      },
      {
        path: '/legal/terms',
        page: 'legal/terms',
      },
      {
        path: '/legal/cookies',
        page: 'legal/cookies',
      },
    ],
  },
  
  // API routes (handled by Next.js API)
  {
    path: '/api',
    page: 'api/index',
    dynamic: true,
  },
];

export default { routes };