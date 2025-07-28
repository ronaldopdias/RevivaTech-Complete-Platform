import { DeviceCategory, DeviceModel } from '@/lib/services/types';

// Import all device configurations
import appleDevices from './apple.devices';
import pcDevices from './pc.devices';
import androidDevices from './android.devices';
import gamingDevices from './gaming.devices';

// Combine all categories
export const allCategories: DeviceCategory[] = [
  ...appleDevices.categories,
  ...pcDevices.categories,
  ...androidDevices.categories,
  ...gamingDevices.categories,
];

// Combine all devices
export const allDevices: DeviceModel[] = [
  ...appleDevices.devices,
  ...pcDevices.devices,
  ...androidDevices.devices,
  ...gamingDevices.devices,
];

// Device lookup utilities
export const getDeviceById = (deviceId: string): DeviceModel | undefined => {
  return allDevices.find(device => device.id === deviceId);
};

export const getCategoryById = (categoryId: string): DeviceCategory | undefined => {
  return allCategories.find(category => category.id === categoryId);
};

export const getDevicesByCategory = (categoryId: string): DeviceModel[] => {
  return allDevices.filter(device => device.categoryId === categoryId);
};

export const getDevicesByBrand = (brand: string): DeviceModel[] => {
  return allDevices.filter(device => 
    device.brand.toLowerCase().includes(brand.toLowerCase())
  );
};

export const getDevicesByYear = (year: number): DeviceModel[] => {
  return allDevices.filter(device => device.year === year);
};

export const getDevicesByYearRange = (startYear: number, endYear: number): DeviceModel[] => {
  return allDevices.filter(device => 
    device.year >= startYear && device.year <= endYear
  );
};

export const searchDevices = (query: string): DeviceModel[] => {
  const searchQuery = query.toLowerCase();
  return allDevices.filter(device => 
    device.name.toLowerCase().includes(searchQuery) ||
    device.brand.toLowerCase().includes(searchQuery) ||
    device.categoryId.toLowerCase().includes(searchQuery) ||
    device.commonIssues.some(issue => 
      issue.toLowerCase().includes(searchQuery)
    )
  );
};

// Popular devices for quick access
export const getPopularDevices = (): DeviceModel[] => {
  // Return devices from the last 3 years with lower average repair costs
  const currentYear = new Date().getFullYear();
  return allDevices
    .filter(device => 
      device.year >= currentYear - 3 && 
      device.averageRepairCost <= 300
    )
    .sort((a, b) => b.year - a.year)
    .slice(0, 12);
};

// Category statistics
export const getCategoryStats = () => {
  const stats = allCategories.map(category => {
    const categoryDevices = getDevicesByCategory(category.id);
    const brands = [...new Set(categoryDevices.map(d => d.brand))];
    const avgRepairCost = categoryDevices.length > 0 
      ? Math.round(categoryDevices.reduce((sum, d) => sum + d.averageRepairCost, 0) / categoryDevices.length)
      : 0;
    const yearRange = categoryDevices.length > 0 
      ? {
          min: Math.min(...categoryDevices.map(d => d.year)),
          max: Math.max(...categoryDevices.map(d => d.year))
        }
      : { min: 0, max: 0 };

    return {
      category,
      deviceCount: categoryDevices.length,
      brands: brands.length,
      avgRepairCost,
      yearRange,
      mostCommonIssues: getMostCommonIssues(categoryDevices)
    };
  });

  return stats;
};

// Get most common repair issues across devices
const getMostCommonIssues = (devices: DeviceModel[]): string[] => {
  const issueCount: Record<string, number> = {};
  
  devices.forEach(device => {
    device.commonIssues.forEach(issue => {
      issueCount[issue] = (issueCount[issue] || 0) + 1;
    });
  });

  return Object.entries(issueCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([issue]) => issue);
};

// Export individual device collections
export {
  appleDevices,
  pcDevices,
  androidDevices,
  gamingDevices,
};

// Default export for easy access
export default {
  categories: allCategories,
  devices: allDevices,
  apple: appleDevices,
  pc: pcDevices,
  android: androidDevices,
  gaming: gamingDevices,
  utils: {
    getDeviceById,
    getCategoryById,
    getDevicesByCategory,
    getDevicesByBrand,
    getDevicesByYear,
    getDevicesByYearRange,
    searchDevices,
    getPopularDevices,
    getCategoryStats,
  },
};