'use client';

import React, { useState, useEffect } from 'react';
import { Search, Smartphone, Laptop, Tablet, Monitor, Gamepad2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

interface DeviceCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface DeviceModel {
  id: string;
  categoryId: string;
  category: string;
  brand: string;
  name: string;
  year: number;
  imageUrl: string;
  specifications: any;
  averageRepairCost: number;
  screenSize?: number;
}

interface ModernDeviceSelectorProps {
  onDeviceSelect: (device: DeviceModel) => void;
  selectedDevice?: DeviceModel | null;
}

const categoryIcons: Record<string, React.ComponentType<any>> = {
  smartphone: Smartphone,
  laptop: Laptop,
  tablet: Tablet,
  desktop: Monitor,
  gamepad: Gamepad2,
};

export default function ModernDeviceSelector({ onDeviceSelect, selectedDevice }: ModernDeviceSelectorProps) {
  const [categories, setCategories] = useState<DeviceCategory[]>([]);
  const [devices, setDevices] = useState<DeviceModel[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Load devices when category changes
  useEffect(() => {
    if (selectedCategory) {
      loadDevices();
    }
  }, [selectedCategory, searchQuery]);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadDevices = async () => {
    if (!selectedCategory) return;
    
    setLoading(true);
    try {
      let url = `/api/devices?category=${selectedCategory}&limit=20`;
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      setDevices(data.devices || []);
    } catch (error) {
      console.error('Failed to load devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSearchQuery('');
    setDevices([]);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const getIconComponent = (iconName: string) => {
    const IconComponent = categoryIcons[iconName] || Smartphone;
    return IconComponent;
  };

  if (!selectedCategory) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            What device needs repair?
          </h2>
          <p className="text-gray-600">
            Select the category that best matches your device
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((category) => {
            const IconComponent = getIconComponent(category.icon);
            return (
              <Card
                key={category.id}
                className="p-6 cursor-pointer hover:shadow-lg transition-shadow border-2 border-transparent hover:border-blue-200"
                onClick={() => handleCategorySelect(category.id)}
              >
                <div className="text-center space-y-3">
                  <div className="flex justify-center">
                    <IconComponent className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="font-medium text-gray-900">{category.name}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {category.description}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Select Your Device Model
          </h2>
          <p className="text-gray-600">
            Choose the specific model for accurate pricing
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => {
            setSelectedCategory(null);
            setDevices([]);
            setSearchQuery('');
          }}
        >
          Change Category
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search for your device model..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading devices...</p>
        </div>
      ) : devices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map((device) => (
            <Card
              key={device.id}
              className={`p-4 cursor-pointer transition-all border-2 ${ 
                selectedDevice?.id === device.id
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-transparent hover:border-blue-200 hover:shadow-md'
              }`}
              onClick={() => onDeviceSelect(device)}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{device.name}</h3>
                    <p className="text-sm text-gray-600">{device.brand}</p>
                    <p className="text-xs text-gray-500">{device.year}</p>
                  </div>
                  {device.screenSize && (
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {device.screenSize}"
                    </span>
                  )}
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Avg. repair</span>
                  <span className="font-medium text-green-600">
                    £{device.averageRepairCost}
                  </span>
                </div>

                {selectedDevice?.id === device.id && (
                  <div className="flex items-center text-blue-600 text-sm">
                    <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                    Selected
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No devices found. Try a different search term.</p>
        </div>
      )}

      {selectedDevice && (
        <div className="mt-6">
          <Card className="p-4 bg-green-50 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-green-900">
                  {selectedDevice.brand} {selectedDevice.name}
                </h4>
                <p className="text-sm text-green-700">
                  {selectedDevice.year} • {selectedDevice.category}
                </p>
              </div>
              <span className="text-green-600 font-semibold">Selected ✓</span>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}