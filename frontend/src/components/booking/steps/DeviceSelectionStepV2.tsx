import React, { useState, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { DeviceModel } from '@/lib/services/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

// API response types
interface ApiDevice {
  id: string;
  categoryId: string;
  category: string;
  brand: string;
  name: string;
  year: number;
  imageUrl?: string;
  specifications?: any;
  commonIssues?: string[];
  averageRepairCost?: number;
  screenSize?: number;
}

interface ApiDeviceResponse {
  devices: ApiDevice[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  source: string;
}

// Revolutionary Device Type Categories (Step 1 in PRD hierarchy)
interface DeviceTypeCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  gradient: string;
  popularModels: string[];
  deviceCount: number;
}

const deviceTypeCategories: DeviceTypeCategory[] = [
  {
    id: 'smartphone',
    name: 'Smartphone',
    description: 'iPhone, Samsung, Google Pixel',
    icon: '📱',
    gradient: 'from-blue-500 to-indigo-600',
    popularModels: ['iPhone 15 Pro', 'Galaxy S24', 'Pixel 8'],
    deviceCount: 847
  },
  {
    id: 'laptop',
    name: 'Laptop',
    description: 'MacBook, Dell, HP, Lenovo',
    icon: '💻',
    gradient: 'from-purple-500 to-violet-600',
    popularModels: ['MacBook Pro M3', 'XPS 15', 'ThinkPad X1'],
    deviceCount: 623
  },
  {
    id: 'tablet',
    name: 'Tablet',
    description: 'iPad, Galaxy Tab, Surface',
    icon: '📟',
    gradient: 'from-pink-500 to-rose-600',
    popularModels: ['iPad Pro', 'Galaxy Tab S9', 'Surface Pro'],
    deviceCount: 284
  },
  {
    id: 'desktop',
    name: 'Desktop',
    description: 'iMac, PC Towers, Workstations',
    icon: '🖥️',
    gradient: 'from-green-500 to-emerald-600',
    popularModels: ['iMac 24"', 'Custom PC', 'Mac Studio'],
    deviceCount: 192
  }
];

// Brand Categories by Device Type (Step 2 in PRD hierarchy)
const brandsByDeviceType = {
  smartphone: [
    { id: 'apple', name: 'Apple', deviceCount: 324, featured: true, logo: '🍎' },
    { id: 'samsung', name: 'Samsung', deviceCount: 298, featured: true, logo: '📱' },
    { id: 'google', name: 'Google', deviceCount: 84, featured: false, logo: '🔍' },
    { id: 'oneplus', name: 'OnePlus', deviceCount: 67, featured: false, logo: '➕' },
    { id: 'xiaomi', name: 'Xiaomi', deviceCount: 74, featured: false, logo: '📲' }
  ],
  laptop: [
    { id: 'apple', name: 'Apple', deviceCount: 187, featured: true, logo: '🍎' },
    { id: 'dell', name: 'Dell', deviceCount: 156, featured: true, logo: '💻' },
    { id: 'hp', name: 'HP', deviceCount: 134, featured: true, logo: '🔧' },
    { id: 'lenovo', name: 'Lenovo', deviceCount: 146, featured: false, logo: '🖥️' }
  ],
  tablet: [
    { id: 'apple', name: 'Apple', deviceCount: 167, featured: true, logo: '🍎' },
    { id: 'samsung', name: 'Samsung', deviceCount: 89, featured: true, logo: '📱' },
    { id: 'microsoft', name: 'Microsoft', deviceCount: 28, featured: false, logo: '🪟' }
  ],
  desktop: [
    { id: 'apple', name: 'Apple', deviceCount: 67, featured: true, logo: '🍎' },
    { id: 'custom', name: 'Custom PC', deviceCount: 125, featured: true, logo: '🔧' }
  ]
};

export interface DeviceSelectionStepV2Props {
  selectedDevice?: DeviceModel;
  onDeviceSelect: (device: DeviceModel) => void;
  className?: string;
}

// Revolutionary Device Type Card (PRD Design)
interface DeviceTypeCardProps {
  deviceType: DeviceTypeCategory;
  isSelected: boolean;
  onClick: () => void;
  isLoading?: boolean;
}

const DeviceTypeCard: React.FC<DeviceTypeCardProps> = ({ 
  deviceType, 
  isSelected, 
  onClick,
  isLoading = false
}) => {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={cn(
        'group p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-center relative overflow-hidden',
        isSelected && 'ring-2 ring-blue-500 bg-blue-50',
        isLoading && 'opacity-50 cursor-wait'
      )}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-r ${deviceType.gradient} rounded-full`} />
        <div className={`absolute -bottom-10 -left-10 w-24 h-24 bg-gradient-to-r ${deviceType.gradient} rounded-full`} />
      </div>

      {/* Device Icon */}
      <div className={`relative w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-r ${deviceType.gradient} flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg`}>
        <span className="text-3xl">{deviceType.icon}</span>
      </div>

      {/* Content */}
      <h3 className="text-xl font-bold mb-2 group-hover:text-blue-600 transition-colors">
        {deviceType.name}
      </h3>
      <p className="text-gray-600 mb-4 text-sm leading-relaxed">
        {deviceType.description}
      </p>

      {/* Stats */}
      <div className="text-sm text-gray-500 mb-4">
        {isLoading ? 'Loading...' : `${deviceType.deviceCount} models available`}
      </div>

      {/* Popular Models Preview */}
      <div className="mb-4">
        <p className="text-xs text-gray-500 mb-2">Popular models:</p>
        <div className="space-y-1">
          {deviceType.popularModels.slice(0, 2).map((model, index) => (
            <div key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
              {model}
            </div>
          ))}
        </div>
      </div>

      {/* Arrow Indicator */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-5 h-5 mx-auto text-blue-500">
          →
        </div>
      </div>
    </button>
  );
};

// Brand Selection Card (PRD Design)
interface BrandCardProps {
  brand: { id: string; name: string; deviceCount: number; featured: boolean; logo: string };
  isSelected: boolean;
  onClick: () => void;
}

const BrandCard: React.FC<BrandCardProps> = ({ brand, isSelected, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-left relative',
        isSelected && 'ring-2 ring-blue-500 bg-blue-50'
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold group-hover:text-blue-600 transition-colors">
          {brand.name}
        </h3>
        {brand.featured && (
          <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
            Popular
          </span>
        )}
      </div>
      
      <div className="text-gray-600 mb-4">
        {brand.deviceCount} models available
      </div>
      
      <div className="flex items-center justify-between">
        <div className="w-12 h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg flex items-center justify-center text-2xl">
          {brand.logo}
        </div>
        <div className="w-5 h-5 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
          →
        </div>
      </div>
    </button>
  );
};

interface DeviceCardProps {
  device: ApiDevice;
  isSelected: boolean;
  onClick: () => void;
  showSpecs?: boolean;
}

const DeviceCard: React.FC<DeviceCardProps> = ({ 
  device, 
  isSelected, 
  onClick, 
  showSpecs = false 
}) => {
  const deviceAge = new Date().getFullYear() - device.year;
  const isNew = deviceAge <= 1;
  const isOld = deviceAge >= 5;

  // Convert API device to DeviceModel format for compatibility
  const convertedDevice: DeviceModel = {
    id: device.id,
    categoryId: device.categoryId,
    brand: device.brand,
    name: device.name,
    year: device.year,
    imageUrl: device.imageUrl || '/images/devices/placeholder.jpg',
    specifications: device.specifications || {},
    commonIssues: device.commonIssues || [],
    averageRepairCost: device.averageRepairCost || 0
  };

  return (
    <Card
      variant="outlined"
      className={cn(
        'p-4 cursor-pointer transition-all hover:shadow-md relative',
        isSelected 
          ? 'border-primary bg-primary/5 shadow-sm ring-2 ring-primary/20' 
          : 'hover:border-primary/50'
      )}
      onClick={() => onClick()}
      clickable
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
          <span className="text-primary-foreground text-sm font-bold">✓</span>
        </div>
      )}

      {/* Age indicator */}
      {isNew && (
        <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
          New
        </div>
      )}
      {isOld && (
        <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
          Legacy
        </div>
      )}

      <div className="space-y-3">
        {/* Device image */}
        <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
          {device.imageUrl ? (
            <img 
              src={device.imageUrl} 
              alt={device.name}
              className="w-full h-full object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <span className="text-4xl">
            {device.categoryId === 'iphone' ? '📱' : 
             device.categoryId === 'macbook' ? '💻' :
             device.categoryId === 'imac' ? '🖥️' :
             device.categoryId === 'ipad' ? '📟' :
             device.categoryId === 'android' ? '🤖' :
             device.categoryId === 'gaming' ? '🎮' : '🔧'}
          </span>
        </div>

        {/* Device info */}
        <div>
          <h4 className="font-semibold text-base mb-1">{device.name}</h4>
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>{device.brand}</span>
            <span>{device.year}</span>
          </div>
          
          {showSpecs && device.specifications && (
            <div className="text-xs text-muted-foreground space-y-1">
              {device.specifications.screen && (
                <div>Screen: {device.specifications.screen.size}</div>
              )}
              {device.specifications.processor && (
                <div>CPU: {device.specifications.processor}</div>
              )}
              {device.screenSize && (
                <div>Display: {device.screenSize}"</div>
              )}
            </div>
          )}

          {/* Common issues preview */}
          {device.commonIssues && device.commonIssues.length > 0 && (
            <div className="mt-2">
              <div className="text-xs font-medium text-muted-foreground mb-1">
                Common issues:
              </div>
              <div className="flex flex-wrap gap-1">
                {device.commonIssues.slice(0, 2).map((issue, index) => (
                  <span
                    key={index}
                    className="text-xs bg-muted px-2 py-1 rounded-full"
                  >
                    {issue}
                  </span>
                ))}
                {device.commonIssues.length > 2 && (
                  <span className="text-xs text-muted-foreground">
                    +{device.commonIssues.length - 2} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Average repair cost */}
          <div className="mt-2 pt-2 border-t">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Avg. repair:</span>
              <span className="text-sm font-medium">
                £{device.averageRepairCost || 'TBD'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export const DeviceSelectionStepV2: React.FC<DeviceSelectionStepV2Props> = ({
  selectedDevice,
  onDeviceSelect,
  className,
}) => {
  // Revolutionary 3-Step Selection State (PRD Implementation)
  const [currentStep, setCurrentStep] = useState<'device-type' | 'brand' | 'model'>('device-type');
  const [selectedDeviceType, setSelectedDeviceType] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  
  // Legacy states for backward compatibility
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [devices, setDevices] = useState<ApiDevice[]>([]);
  const [popularDevices, setPopularDevices] = useState<ApiDevice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categoryStats, setCategoryStats] = useState<Record<string, number>>({});

  // Load popular devices on mount
  useEffect(() => {
    const loadPopularDevices = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/devices?popular=true&limit=12');
        const data: ApiDeviceResponse = await response.json();
        
        if (response.ok) {
          setPopularDevices(data.devices);
        } else {
          setError('Failed to load popular devices');
        }
      } catch (error) {
        console.error('Error loading popular devices:', error);
        setError('Failed to load devices');
      } finally {
        setIsLoading(false);
      }
    };

    loadPopularDevices();
  }, []);

  // Load category statistics
  useEffect(() => {
    const loadCategoryStats = async () => {
      const stats: Record<string, number> = {};
      
      for (const category of deviceCategories) {
        try {
          const response = await fetch(`/api/devices?category=${category.id}&limit=1`);
          const data: ApiDeviceResponse = await response.json();
          
          if (response.ok) {
            stats[category.id] = data.pagination.total;
          }
        } catch (error) {
          console.error(`Error loading stats for ${category.id}:`, error);
          stats[category.id] = 0;
        }
      }
      
      setCategoryStats(stats);
    };

    loadCategoryStats();
  }, []);

  // Load devices based on category or search
  useEffect(() => {
    const loadDevices = async () => {
      if (!selectedCategory && !searchQuery.trim()) {
        setDevices([]);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        let url = '/api/devices?';
        const params = new URLSearchParams();
        
        if (selectedCategory) {
          params.append('category', selectedCategory);
        }
        
        if (searchQuery.trim()) {
          params.append('search', searchQuery.trim());
        }
        
        params.append('limit', '50');
        
        const response = await fetch(url + params.toString());
        const data: ApiDeviceResponse = await response.json();
        
        if (response.ok) {
          setDevices(data.devices);
        } else {
          setError(data.error || 'Failed to load devices');
          setDevices([]);
        }
      } catch (error) {
        console.error('Error loading devices:', error);
        setError('Failed to load devices');
        setDevices([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadDevices();
  }, [selectedCategory, searchQuery]);

  // Revolutionary Step Handlers (PRD Implementation)
  const handleDeviceTypeSelect = (deviceTypeId: string) => {
    setSelectedDeviceType(deviceTypeId);
    setSelectedBrand('');
    setCurrentStep('brand');
  };

  const handleBrandSelect = (brandId: string) => {
    setSelectedBrand(brandId);
    setCurrentStep('model');
    // Load models for this device type + brand combination
    setSelectedCategory(`${brandId}-${selectedDeviceType}`);
    setSearchQuery('');
  };

  const handleBackToDeviceTypes = () => {
    setCurrentStep('device-type');
    setSelectedDeviceType('');
    setSelectedBrand('');
    setSelectedCategory('');
  };

  const handleBackToBrands = () => {
    setCurrentStep('brand');
    setSelectedBrand('');
    setSelectedCategory('');
  };

  // Legacy handlers for backward compatibility
  const handleCategorySelect = (categoryId: string) => {
    if (selectedCategory === categoryId) {
      setSelectedCategory('');
    } else {
      setSelectedCategory(categoryId);
      setSearchQuery('');
    }
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      setSelectedCategory('');
      setCurrentStep('model'); // Jump to model search
    }
  };

  const handleDeviceSelect = (device: ApiDevice) => {
    // Convert API device to DeviceModel format
    const convertedDevice: DeviceModel = {
      id: device.id,
      categoryId: device.categoryId,
      brand: device.brand,
      name: device.name,
      year: device.year,
      imageUrl: device.imageUrl || '/images/devices/placeholder.jpg',
      specifications: device.specifications || {},
      commonIssues: device.commonIssues || [],
      averageRepairCost: device.averageRepairCost || 0
    };
    
    onDeviceSelect(convertedDevice);
  };

  // Get current brands for selected device type
  const currentBrands = selectedDeviceType ? brandsByDeviceType[selectedDeviceType as keyof typeof brandsByDeviceType] || [] : [];
  const displayDevices = selectedCategory || searchQuery.trim() ? devices : popularDevices;

  return (
    <div className={cn('space-y-8', className)}>
      {/* Revolutionary Progress Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-4">
          {currentStep === 'device-type' && "What type of device needs repair?"}
          {currentStep === 'brand' && "Select your device brand"}
          {currentStep === 'model' && "Choose your exact model"}
        </h2>
        <p className="text-muted-foreground text-lg">
          {currentStep === 'device-type' && "Choose your device category to get started"}
          {currentStep === 'brand' && `Choose from ${currentBrands.length} available brands`}
          {currentStep === 'model' && "Visual selection with pricing and availability"}
        </p>
      </div>

      {/* Progress Breadcrumbs */}
      <div className="flex items-center justify-center space-x-4 text-sm">
        <button 
          onClick={handleBackToDeviceTypes}
          className={cn(
            'px-3 py-1 rounded-full transition-colors',
            currentStep === 'device-type' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          )}
        >
          Device Type
        </button>
        <span className="text-gray-400">→</span>
        <button 
          onClick={handleBackToBrands}
          disabled={!selectedDeviceType}
          className={cn(
            'px-3 py-1 rounded-full transition-colors',
            currentStep === 'brand' ? 'bg-blue-500 text-white' : 
            selectedDeviceType ? 'bg-gray-200 text-gray-600 hover:bg-gray-300' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          )}
        >
          Brand
        </button>
        <span className="text-gray-400">→</span>
        <span className={cn(
          'px-3 py-1 rounded-full',
          currentStep === 'model' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400'
        )}>
          Model
        </span>
      </div>

      {/* Quick Search (always available) */}
      <div className="max-w-md mx-auto">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400">🔍</span>
          </div>
          <Input
            type="text"
            placeholder="Or search directly for your model..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10"
          />
        </div>
      </div>

      {/* Error message */}
      {error && (
        <Card className="p-4 bg-destructive/10 border-destructive/20">
          <p className="text-destructive text-center">{error}</p>
        </Card>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-muted-foreground">Loading devices...</p>
        </div>
      )}

      {/* Step 1: Revolutionary Device Type Selection */}
      {currentStep === 'device-type' && !searchQuery.trim() && !isLoading && (
        <div className="max-w-6xl mx-auto animate-slide-up">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {deviceTypeCategories.map((deviceType) => (
              <DeviceTypeCard
                key={deviceType.id}
                deviceType={deviceType}
                isSelected={selectedDeviceType === deviceType.id}
                onClick={() => handleDeviceTypeSelect(deviceType.id)}
                isLoading={isLoading}
              />
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Brand Selection */}
      {currentStep === 'brand' && selectedDeviceType && !searchQuery.trim() && !isLoading && (
        <div className="max-w-4xl mx-auto animate-slide-up">
          <div className="mb-6 text-center">
            <button 
              onClick={handleBackToDeviceTypes}
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
            >
              ← Back to device types
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentBrands.map((brand) => (
              <BrandCard
                key={brand.id}
                brand={brand}
                isSelected={selectedBrand === brand.id}
                onClick={() => handleBrandSelect(brand.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Enhanced Model Selection & Search Results */}
      {!isLoading && (currentStep === 'model' || searchQuery.trim()) && displayDevices.length > 0 && (
        <div className="max-w-6xl mx-auto animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">
              {searchQuery.trim() 
                ? `Search Results (${displayDevices.length})`
                : selectedCategory 
                  ? `${selectedBrand} ${selectedDeviceType} Models`
                  : `Popular Devices`
              }
            </h3>
            
            {searchQuery.trim() && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setCurrentStep(selectedDeviceType ? 'brand' : 'device-type');
                }}
              >
                ← Clear Search
              </Button>
            )}
            
            {currentStep === 'model' && selectedBrand && !searchQuery.trim() && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToBrands}
              >
                ← Back to Brands
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayDevices.map((device) => (
              <DeviceCard
                key={device.id}
                device={device}
                isSelected={selectedDevice?.id === device.id}
                onClick={() => handleDeviceSelect(device)}
                showSpecs={displayDevices.length <= 12}
              />
            ))}
          </div>
        </div>
      )}

      {/* No devices found */}
      {!isLoading && (selectedCategory || searchQuery.trim()) && displayDevices.length === 0 && (
        <Card className="p-8 text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h4 className="text-lg font-semibold mb-2">No devices found</h4>
          <p className="text-muted-foreground">
            Try adjusting your search or browse by category
          </p>
        </Card>
      )}

      {/* Selected device summary */}
      {selectedDevice && (
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">Selected Device</h4>
              <p className="text-sm text-muted-foreground">
                {selectedDevice.brand} {selectedDevice.name} ({selectedDevice.year})
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedCategory('');
                setSearchQuery('');
              }}
            >
              Change
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default DeviceSelectionStepV2;