import { useState, useEffect } from 'react';
import { DeviceServiceImpl } from '@/lib/services/deviceService';
import { deviceServiceConfig } from '@/../config/services/api.config';
import { DeviceCategory, DeviceModel } from '@/lib/services/types';

interface UseDeviceDataReturn {
  categories: DeviceCategory[];
  devices: DeviceModel[];
  brands: Array<{ id: string; name: string; slug: string; categoryId: string }>;
  isLoading: boolean;
  error: string | null;
  searchDevices: (query: string) => Promise<DeviceModel[]>;
  getDevicesByCategory: (categoryId: string) => Promise<DeviceModel[]>;
  getDevicesByBrand: (brandId: string) => Promise<DeviceModel[]>;
}

export function useDeviceData(): UseDeviceDataReturn {
  const [categories, setCategories] = useState<DeviceCategory[]>([]);
  const [devices, setDevices] = useState<DeviceModel[]>([]);
  const [brands, setBrands] = useState<Array<{ id: string; name: string; slug: string; categoryId: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize device service
  const deviceService = new DeviceServiceImpl(deviceServiceConfig);

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch categories
        const categoriesResponse = await deviceService.getCategories();
        if (categoriesResponse.success && categoriesResponse.data) {
          setCategories(categoriesResponse.data);
        } else {
          throw new Error(categoriesResponse.error || 'Failed to fetch categories');
        }

        // Fetch all devices
        const devicesResponse = await deviceService.getDeviceModels({ limit: 100 });
        if (devicesResponse.success && devicesResponse.data) {
          setDevices(devicesResponse.data);
        } else {
          throw new Error(devicesResponse.error || 'Failed to fetch devices');
        }

        // Fetch brands
        const brandsResponse = await fetch(`${deviceServiceConfig.baseUrl}/brands`);
        if (brandsResponse.ok) {
          const brandsData = await brandsResponse.json();
          if (brandsData.success && brandsData.brandsByCategory) {
            // Flatten brands from categories
            const allBrands = brandsData.brandsByCategory.flatMap((category: any) => 
              category.brands.map((brand: any) => ({
                ...brand,
                categoryId: category.categoryId
              }))
            );
            setBrands(allBrands);
          }
        }
      } catch (err) {
        console.error('Error fetching device data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load device data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Search devices
  const searchDevices = async (query: string): Promise<DeviceModel[]> => {
    try {
      const response = await deviceService.searchDevices(query);
      if (response.success && response.data) {
        return response.data;
      }
      return [];
    } catch (err) {
      console.error('Error searching devices:', err);
      return [];
    }
  };

  // Get devices by category
  const getDevicesByCategory = async (categoryId: string): Promise<DeviceModel[]> => {
    try {
      const response = await deviceService.getDeviceModels({ categoryId });
      if (response.success && response.data) {
        return response.data;
      }
      return [];
    } catch (err) {
      console.error('Error fetching devices by category:', err);
      return [];
    }
  };

  // Get devices by brand
  const getDevicesByBrand = async (brandId: string): Promise<DeviceModel[]> => {
    try {
      const response = await deviceService.getDeviceModels({ brandId });
      if (response.success && response.data) {
        return response.data;
      }
      return [];
    } catch (err) {
      console.error('Error fetching devices by brand:', err);
      return [];
    }
  };

  return {
    categories,
    devices,
    brands,
    isLoading,
    error,
    searchDevices,
    getDevicesByCategory,
    getDevicesByBrand
  };
}