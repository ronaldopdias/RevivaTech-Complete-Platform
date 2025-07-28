// Business Components - RevivaTech Phase 4
// Professional computer repair shop components with advanced features

export { DeviceSelector } from './DeviceSelector';
export type { DeviceSelectorProps } from './DeviceSelector';

export { PriceCalculator } from './PriceCalculator';
export type { PriceCalculatorProps } from './PriceCalculator';

export { PaymentGateway } from './PaymentGateway';
export type { 
  PaymentGatewayProps, 
  PaymentMethod, 
  PaymentData, 
  PaymentResult 
} from './PaymentGateway';

// Re-export related types for convenience
export type { DeviceModel, DeviceCategory } from '@/types/config';
export type { 
  RepairType, 
  RepairOptions, 
  PriceEstimate, 
  PricingRule 
} from '../../../config/pricing/pricing.engine';