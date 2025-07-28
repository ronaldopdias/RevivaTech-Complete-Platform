// Re-export pricing engine for easy access from lib
export {
  pricingEngine,
  PricingEngine,
  repairTypes,
  pricingRules,
  getRepairTypeById,
  getRepairTypesByCategory,
  getAllRepairTypes,
  type RepairType,
  type RepairOptions,
  type PriceEstimate,
  type PricingRule
} from '@/../config/pricing/pricing.engine';

// Re-export device utilities for pricing integration
export {
  allCategories,
  allDevices,
  getDeviceById,
  getCategoryById,
  getDevicesByCategory,
  getDevicesByBrand,
  getDevicesByYear,
  getDevicesByYearRange,
  searchDevices,
  getPopularDevices,
  getCategoryStats
} from '@/../config/devices';

// Utility function to get a quick price estimate
export const getQuickEstimate = (deviceId: string, repairTypeId: string) => {
  const device = require('@/../config/devices').getDeviceById(deviceId);
  if (!device) return null;
  
  return pricingEngine.calculatePrice(device, repairTypeId);
};

// Get device with pricing recommendations
export const getDeviceWithPricing = (deviceId: string) => {
  const device = require('@/../config/devices').getDeviceById(deviceId);
  if (!device) return null;

  const availableRepairs = pricingEngine.getAvailableRepairs(device);
  const recommendedRepairs = pricingEngine.getRecommendedRepairs(device);

  return {
    device,
    availableRepairs,
    recommendedRepairs,
    pricing: {
      calculate: (repairTypeId: string, options = {}) => 
        pricingEngine.calculatePrice(device, repairTypeId, options)
    }
  };
};

export default {
  pricingEngine,
  getQuickEstimate,
  getDeviceWithPricing
};