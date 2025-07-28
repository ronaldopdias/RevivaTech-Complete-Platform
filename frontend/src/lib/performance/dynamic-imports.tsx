// Dynamic imports for code splitting and performance optimization
import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

// Loading component for dynamic imports
const LoadingComponent = () => {
  if (typeof window === 'undefined') return null;
  
  return (
    <div className="flex items-center justify-center p-4">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
};

// Admin components (heavy, only load when needed)
export const AdminDashboard = dynamic(
  () => import('@/components/admin/AdminDashboard'),
  {
    loading: LoadingComponent,
    ssr: false, // Admin components don't need SSR
  }
);

export const AdvancedAnalytics = dynamic(
  () => import('@/components/admin/AdvancedAnalytics'),
  {
    loading: LoadingComponent,
    ssr: false,
  }
);

export const BusinessIntelligence = dynamic(
  () => import('@/components/admin/BusinessIntelligence'),
  {
    loading: LoadingComponent,
    ssr: false,
  }
);

// Booking components (split into separate chunks)
export const BookingWizard = dynamic(
  () => import('@/components/booking/BookingWizard'),
  {
    loading: LoadingComponent,
  }
);

export const ModernBookingWizard = dynamic(
  () => import('@/components/booking/ModernBookingWizard'),
  {
    loading: LoadingComponent,
  }
);

export const RealtimeBookingWizard = dynamic(
  () => import('@/components/booking/RealtimeBookingWizard'),
  {
    loading: LoadingComponent,
  }
);

export const PaymentGateway = dynamic(
  () => import('@/components/booking/PaymentGateway'),
  {
    loading: LoadingComponent,
  }
);

// Realtime components (only load when needed)
export const BookingNotificationSystem = dynamic(
  () => import('@/components/realtime/BookingNotificationSystem'),
  {
    loading: LoadingComponent,
    ssr: false,
  }
);

export const RepairProgressTracker = dynamic(
  () => import('@/components/realtime/RepairProgressTracker'),
  {
    loading: LoadingComponent,
    ssr: false,
  }
);

export const ChatWidget = dynamic(
  () => import('@/components/realtime/ChatWidget'),
  {
    loading: LoadingComponent,
    ssr: false,
  }
);

// Customer components
export const AdvancedCustomerDashboard = dynamic(
  () => import('@/components/customer/AdvancedCustomerDashboard'),
  {
    loading: LoadingComponent,
  }
);

// Auth components (2FA, security)
export const TwoFactorSetup = dynamic(
  () => import('@/components/auth/2fa/TwoFactorSetup'),
  {
    loading: LoadingComponent,
    ssr: false,
  }
);

export const SecurityDashboard = dynamic(
  () => import('@/components/admin/security/SecurityDashboard'),
  {
    loading: LoadingComponent,
    ssr: false,
  }
);

// AI/ML components (heavy dependencies)
export const AIDeviceDiagnostics = dynamic(
  () => import('@/components/booking/AIDeviceDiagnostics'),
  {
    loading: LoadingComponent,
    ssr: false,
  }
);

// Type helper for dynamic components
export type DynamicComponent<T = {}> = ComponentType<T>;

// Helper function to create optimized dynamic imports
export function createDynamicImport<T = {}>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  options: {
    ssr?: boolean;
    loading?: ComponentType;
  } = {}
) {
  return dynamic(importFn, {
    loading: options.loading || LoadingComponent,
    ssr: options.ssr !== false,
  });
}

// Preload critical components for better UX
export function preloadCriticalComponents() {
  if (typeof window !== 'undefined') {
    // Preload booking wizard for home page
    import('@/components/booking/ModernBookingWizard');
    
    // Preload customer dashboard for authenticated users
    if (localStorage.getItem('auth-token')) {
      import('@/components/customer/AdvancedCustomerDashboard');
    }
  }
}