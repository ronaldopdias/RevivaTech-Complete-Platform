// Booking components
export { default as DeviceSelector } from './DeviceSelector';
export { default as ModelSelection } from './ModelSelection';
export { default as PriceCalculator } from './PriceCalculator';
export { default as PriceCalculatorV2 } from './PriceCalculatorV2';
export { default as BookingWizard } from './BookingWizard';

// Enhanced V2 components
export { default as DeviceSelectorV2 } from './DeviceSelectorV2';
export { default as ModelSelectionV2 } from './ModelSelectionV2';
export { default as PhotoUploadV2 } from './PhotoUploadV2';

// Real-time components
export { default as RealtimeBookingWizard } from './RealtimeBookingWizard';
export { default as RealtimePricingCalculator } from './RealtimePricingCalculator';
export { default as RealtimePhotoUpload } from './RealtimePhotoUpload';
export { default as RealtimeScheduler } from './RealtimeScheduler';

// Export step components
export {
  DeviceSelectionStep,
  ProblemDescriptionStep,
  PhotoUploadStep,
  CustomerInfoStep,
  ConfirmationStep
} from './steps';

// Export types for external use
export type { BookingData, WizardStep as WizardStepInterface } from './BookingWizard';
export type { CustomerInfo, AppointmentPreferences } from './steps';

// Import DeviceModel for type definitions
import type { DeviceModel } from '@/lib/services/types';

// Wizard step types for multi-step booking
export type WizardStep = 
  | 'device-selection'
  | 'problem-description' 
  | 'photo-upload'
  | 'pricing-review'
  | 'customer-info'
  | 'payment'
  | 'confirmation';

// Comprehensive wizard data interface
export interface WizardData {
  // Device selection
  selectedDevice?: DeviceModel;
  
  // Problem description
  selectedIssues: string[];
  problemDescription: string;
  urgency: 'standard' | 'priority' | 'emergency';
  
  // Photo upload
  photos: File[];
  
  // Pricing and repairs
  selectedRepairs: string[];
  repairEstimates: Array<{
    repair: any;
    estimate: any;
  }>;
  
  // Service options
  serviceOptions: {
    express: boolean;
    premiumParts: boolean;
    dataRecovery: boolean;
    warranty: 'standard' | 'extended';
    pickupDelivery: boolean;
  };
  
  // Customer information
  customerInfo: CustomerInfo;
  
  // Appointment preferences
  appointmentPreferences: AppointmentPreferences;
  
  // Payment information
  paymentResult?: any;
}