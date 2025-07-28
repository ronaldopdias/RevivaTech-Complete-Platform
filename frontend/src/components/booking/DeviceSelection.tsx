'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { DeviceCategory, DeviceModel } from '@/lib/services/types';
import { getDeviceImageUrl } from '../../../config/devices/images.config';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

// Configuration interface for DeviceSelection component
export interface DeviceSelectionConfig {
  title: string;
  subtitle?: string;
  showSearch: boolean;
  showFilters: boolean;
  showBrandFilter: boolean;
  showYearFilter: boolean;
  showPriceFilter: boolean;
  layout: 'grid' | 'list';
  itemsPerRow: 2 | 3 | 4 | 6;
  showImages: boolean;
  showSpecs: boolean;
  showCommonIssues: boolean;
  enableSelection: boolean;
  multiSelect: boolean;
  sortBy: 'name' | 'year' | 'brand' | 'price' | 'popularity';
  sortOrder: 'asc' | 'desc';
  categoryOrder: string[];
  filters: {
    yearRange: { min: number; max: number };
    priceRange: { min: number; max: number };
    brands: string[];
  };
  animations: {
    enabled: boolean;
    duration: number;
    stagger: number;
  };
  responsive: {
    mobile: { itemsPerRow: number; showFilters: boolean };
    tablet: { itemsPerRow: number; showFilters: boolean };
    desktop: { itemsPerRow: number; showFilters: boolean };
  };
}

// Default configuration
const defaultConfig: DeviceSelectionConfig = {
  title: 'Select Your Device',
  subtitle: 'Choose the device that needs repair',
  showSearch: true,
  showFilters: true,
  showBrandFilter: true,
  showYearFilter: true,
  showPriceFilter: true,
  layout: 'grid',
  itemsPerRow: 3,
  showImages: true,
  showSpecs: true,
  showCommonIssues: false,
  enableSelection: true,
  multiSelect: false,
  sortBy: 'popularity',
  sortOrder: 'desc',
  categoryOrder: ['macbook', 'iphone', 'ipad', 'android-phone', 'gaming-console'],
  filters: {
    yearRange: { min: 2016, max: 2025 },
    priceRange: { min: 0, max: 1000 },
    brands: []
  },
  animations: {
    enabled: true,
    duration: 0.3,
    stagger: 0.1
  },
  responsive: {
    mobile: { itemsPerRow: 1, showFilters: false },
    tablet: { itemsPerRow: 2, showFilters: true },
    desktop: { itemsPerRow: 3, showFilters: true }
  }
};

// Component props
export interface DeviceSelectionProps {
  categories: DeviceCategory[];
  devices: DeviceModel[];
  config?: Partial<DeviceSelectionConfig>;
  selectedDevices?: string[];
  onDeviceSelect?: (deviceId: string) => void;
  onDeviceDeselect?: (deviceId: string) => void;
  onSelectionChange?: (selectedDevices: string[]) => void;
  className?: string;
}

// Filter state interface
interface FilterState {
  search: string;
  selectedCategory: string | null;
  selectedBrands: string[];
  yearRange: [number, number];
  priceRange: [number, number];
}

export const DeviceSelection: React.FC<DeviceSelectionProps> = ({
  categories,
  devices,
  config: userConfig = {},
  selectedDevices = [],
  onDeviceSelect,
  onDeviceDeselect,
  onSelectionChange,
  className
}) => {
  const config = { ...defaultConfig, ...userConfig };
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    selectedCategory: null,
    selectedBrands: [],
    yearRange: [config.filters.yearRange.min, config.filters.yearRange.max],
    priceRange: [config.filters.priceRange.min, config.filters.priceRange.max]
  });

  // Memoized filtered devices
  const filteredDevices = useMemo(() => {
    let filtered = devices;

    // Search filter
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(device =>
        device.name.toLowerCase().includes(search) ||
        device.brand.toLowerCase().includes(search) ||
        device.commonIssues.some(issue => issue.toLowerCase().includes(search))
      );
    }

    // Category filter
    if (filters.selectedCategory) {
      filtered = filtered.filter(device => device.categoryId === filters.selectedCategory);
    }

    // Brand filter
    if (filters.selectedBrands.length > 0) {
      filtered = filtered.filter(device => filters.selectedBrands.includes(device.brand));
    }

    // Year range filter
    filtered = filtered.filter(device => 
      device.year >= filters.yearRange[0] && device.year <= filters.yearRange[1]
    );

    // Price range filter
    filtered = filtered.filter(device => 
      device.averageRepairCost >= filters.priceRange[0] && 
      device.averageRepairCost <= filters.priceRange[1]
    );

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (config.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'year':
          comparison = a.year - b.year;
          break;
        case 'brand':
          comparison = a.brand.localeCompare(b.brand);
          break;
        case 'price':
          comparison = a.averageRepairCost - b.averageRepairCost;
          break;
        case 'popularity':
          // Sort by category order, then by year (newer first)
          const aCategoryIndex = config.categoryOrder.indexOf(a.categoryId);
          const bCategoryIndex = config.categoryOrder.indexOf(b.categoryId);
          if (aCategoryIndex !== bCategoryIndex) {
            comparison = aCategoryIndex - bCategoryIndex;
          } else {
            comparison = b.year - a.year;
          }
          break;
        default:
          comparison = 0;
      }

      return config.sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [devices, filters, config.sortBy, config.sortOrder, config.categoryOrder]);

  // Get unique brands from devices
  const availableBrands = useMemo(() => {
    const brands = [...new Set(devices.map(device => device.brand))].sort();
    return brands;
  }, [devices]);

  // Handle device selection
  const handleDeviceToggle = (deviceId: string) => {
    if (!config.enableSelection) return;

    const isSelected = selectedDevices.includes(deviceId);

    if (isSelected) {
      const newSelection = selectedDevices.filter(id => id !== deviceId);
      onDeviceDeselect?.(deviceId);
      onSelectionChange?.(newSelection);
    } else {
      const newSelection = config.multiSelect 
        ? [...selectedDevices, deviceId]
        : [deviceId];
      onDeviceSelect?.(deviceId);
      onSelectionChange?.(newSelection);
    }
  };

  // Handle filter changes
  const handleSearchChange = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  const handleCategorySelect = (categoryId: string | null) => {
    setFilters(prev => ({ ...prev, selectedCategory: categoryId }));
  };

  const handleBrandToggle = (brand: string) => {
    setFilters(prev => ({
      ...prev,
      selectedBrands: prev.selectedBrands.includes(brand)
        ? prev.selectedBrands.filter(b => b !== brand)
        : [...prev.selectedBrands, brand]
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      selectedCategory: null,
      selectedBrands: [],
      yearRange: [config.filters.yearRange.min, config.filters.yearRange.max],
      priceRange: [config.filters.priceRange.min, config.filters.priceRange.max]
    });
  };

  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6'
  };

  return (
    <div className={cn('w-full space-y-6', className)}>
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">{config.title}</h2>
        {config.subtitle && (
          <p className="text-gray-600">{config.subtitle}</p>
        )}
      </div>

      {/* Search and Filters */}
      {(config.showSearch || config.showFilters) && (
        <div className="space-y-4">
          {/* Search */}
          {config.showSearch && (
            <div className="relative">
              <Input
                type="text"
                placeholder="Search devices..."
                value={filters.search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full"
              />
            </div>
          )}

          {/* Filters */}
          {config.showFilters && (
            <div className="space-y-4">
              {/* Categories */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={filters.selectedCategory === null ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => handleCategorySelect(null)}
                >
                  All Categories
                </Button>
                {categories.map(category => (
                  <Button
                    key={category.id}
                    variant={filters.selectedCategory === category.id ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => handleCategorySelect(category.id)}
                  >
                    {category.name}
                  </Button>
                ))}
              </div>

              {/* Brands */}
              {config.showBrandFilter && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Brands</h4>
                  <div className="flex flex-wrap gap-2">
                    {availableBrands.map(brand => (
                      <Badge
                        key={brand}
                        variant={filters.selectedBrands.includes(brand) ? 'primary' : 'secondary'}
                        className="cursor-pointer"
                        onClick={() => handleBrandToggle(brand)}
                      >
                        {brand}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Clear Filters */}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-gray-500"
              >
                Clear All Filters
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        {filteredDevices.length} device{filteredDevices.length !== 1 ? 's' : ''} found
      </div>

      {/* Device Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${filters.selectedCategory}-${filters.search}-${filters.selectedBrands.join(',')}`}
          initial={config.animations.enabled ? { opacity: 0, y: 20 } : false}
          animate={config.animations.enabled ? { opacity: 1, y: 0 } : false}
          exit={config.animations.enabled ? { opacity: 0, y: -20 } : false}
          transition={{ duration: config.animations.duration }}
          className={cn(
            'grid gap-4',
            config.layout === 'grid' ? gridCols[config.itemsPerRow] : 'grid-cols-1',
            config.layout === 'list' && 'space-y-4'
          )}
        >
          {filteredDevices.map((device, index) => (
            <motion.div
              key={device.id}
              initial={config.animations.enabled ? { opacity: 0, scale: 0.9 } : false}
              animate={config.animations.enabled ? { opacity: 1, scale: 1 } : false}
              transition={config.animations.enabled ? {
                duration: config.animations.duration,
                delay: index * config.animations.stagger
              } : {}}
            >
              <DeviceCard
                device={device}
                config={config}
                isSelected={selectedDevices.includes(device.id)}
                onToggle={() => handleDeviceToggle(device.id)}
              />
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* No Results */}
      {filteredDevices.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No devices found matching your criteria.</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="mt-2"
          >
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
};

// Individual device card component
interface DeviceCardProps {
  device: DeviceModel;
  config: DeviceSelectionConfig;
  isSelected: boolean;
  onToggle: () => void;
}

const DeviceCard: React.FC<DeviceCardProps> = ({ device, config, isSelected, onToggle }) => {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200 hover:shadow-md',
        config.enableSelection && isSelected && 'ring-2 ring-primary border-primary',
        !config.enableSelection && 'cursor-default'
      )}
      onClick={config.enableSelection ? onToggle : undefined}
    >
      {/* Device Image */}
      {config.showImages && (
        <div className="aspect-video relative overflow-hidden rounded-t-lg">
          <img
            src={getDeviceImageUrl(device.imageUrl, 'card')}
            alt={device.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {isSelected && config.enableSelection && (
            <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
      )}

      {/* Device Info */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-gray-900">{device.name}</h3>
          <p className="text-sm text-gray-600">{device.brand} • {device.year}</p>
        </div>

        {/* Specifications */}
        {config.showSpecs && device.specifications.screen && (
          <div className="text-xs text-gray-500 space-y-1">
            <div>Screen: {device.specifications.screen.size}</div>
            {device.specifications.processor && (
              <div>Processor: {device.specifications.processor}</div>
            )}
          </div>
        )}

        {/* Common Issues */}
        {config.showCommonIssues && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-700">Common Issues:</p>
            <div className="flex flex-wrap gap-1">
              {device.commonIssues.slice(0, 3).map(issue => (
                <Badge key={issue} variant="secondary" className="text-xs">
                  {issue}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Average Repair Cost */}
        <div className="flex justify-between items-center pt-2 border-t">
          <span className="text-sm text-gray-600">Avg. Repair:</span>
          <span className="font-semibold text-primary">£{device.averageRepairCost}</span>
        </div>
      </div>
    </Card>
  );
};

export default DeviceSelection;