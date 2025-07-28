'use client';

import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Check, Smartphone, Laptop, Monitor, TabletSmartphone, Cpu, Star, TrendingUp, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import appleDevices from '@/config/devices/apple.devices';
import SmartDeviceSearch from './SmartDeviceSearch';

interface DeviceModel {
  id: string;
  categoryId: string;
  brand: string;
  name: string;
  year: number;
  imageUrl: string;
  specifications: any;
  averageRepairCost: number;
  commonIssues: string[];
  screenSize?: number;
}

interface ModelVariant {
  id: string;
  name: string;
  storage?: string;
  color?: string;
  connectivity?: string;
  specs?: {
    memory?: string;
    storage?: string;
    processor?: string;
  };
  priceModifier?: number;
}

interface DeviceType {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  count: number;
  categories: string[];
  popular: boolean;
  priceRange: string;
  brandCount: number;
}

interface Brand {
  name: string;
  logo?: string;
  deviceCount: number;
  categories: string[];
  popularity: number;
  priceRange: string;
  marketShare: number;
}

interface VisualDeviceSelectorProps {
  onDeviceSelect: (device: DeviceModel, variant?: ModelVariant) => void;
  selectedDevice?: DeviceModel | null;
  selectedVariant?: ModelVariant | null;
}

// Device type categories with visual hierarchy
const DEVICE_TYPES: DeviceType[] = [
  {
    id: 'smartphone',
    name: 'Smartphones',
    description: 'iPhone, Android & Google Pixel phones',
    icon: Smartphone,
    count: 45,
    categories: ['iPhone', 'Samsung Galaxy', 'Google Pixel', 'OnePlus'],
    popular: true,
    priceRange: '£89-£499',
    brandCount: 6,
  },
  {
    id: 'laptop',
    name: 'Laptops',
    description: 'MacBook, Windows laptops & ultrabooks',
    icon: Laptop,
    count: 38,
    categories: ['MacBook', 'Dell XPS', 'HP Pavilion', 'Surface Laptop'],
    popular: true,
    priceRange: '£149-£899',
    brandCount: 8,
  },
  {
    id: 'desktop',
    name: 'Desktops',
    description: 'iMac, All-in-ones & desktop PCs',
    icon: Monitor,
    count: 22,
    categories: ['iMac', 'Mac Mini', 'Mac Studio', 'Desktop PC'],
    popular: false,
    priceRange: '£199-£1299',
    brandCount: 5,
  },
  {
    id: 'tablet',
    name: 'Tablets',
    description: 'iPad, Surface & Android tablets',
    icon: TabletSmartphone,
    count: 18,
    categories: ['iPad', 'Surface Pro', 'Galaxy Tab', 'Fire Tablet'],
    popular: false,
    priceRange: '£119-£749',
    brandCount: 4,
  },
  {
    id: 'gaming',
    name: 'Gaming Devices',
    description: 'Consoles, gaming laptops & handhelds',
    icon: Cpu,
    count: 12,
    categories: ['PlayStation', 'Xbox', 'Nintendo Switch', 'Steam Deck'],
    popular: false,
    priceRange: '£179-£999',
    brandCount: 4,
  },
];

// Enhanced brand data with visual elements
const DEVICE_BRANDS: { [key: string]: Brand[] } = {
  smartphone: [
    {
      name: 'Apple',
      deviceCount: 18,
      categories: ['iPhone 15', 'iPhone 14', 'iPhone 13', 'iPhone 12'],
      popularity: 95,
      priceRange: '£199-£499',
      marketShare: 45,
    },
    {
      name: 'Samsung',
      deviceCount: 15,
      categories: ['Galaxy S24', 'Galaxy A55', 'Galaxy Note', 'Galaxy Z'],
      popularity: 88,
      priceRange: '£89-£399',
      marketShare: 32,
    },
    {
      name: 'Google',
      deviceCount: 8,
      categories: ['Pixel 8', 'Pixel 7', 'Pixel 6', 'Pixel Fold'],
      popularity: 78,
      priceRange: '£149-£449',
      marketShare: 12,
    },
    {
      name: 'OnePlus',
      deviceCount: 4,
      categories: ['OnePlus 12', 'OnePlus 11', 'OnePlus Nord'],
      popularity: 65,
      priceRange: '£179-£349',
      marketShare: 8,
    },
  ],
  laptop: [
    {
      name: 'Apple',
      deviceCount: 12,
      categories: ['MacBook Air', 'MacBook Pro 14"', 'MacBook Pro 16"'],
      popularity: 92,
      priceRange: '£299-£899',
      marketShare: 25,
    },
    {
      name: 'Dell',
      deviceCount: 10,
      categories: ['XPS 13', 'XPS 15', 'Inspiron', 'Alienware'],
      popularity: 85,
      priceRange: '£149-£699',
      marketShare: 22,
    },
    {
      name: 'HP',
      deviceCount: 8,
      categories: ['Pavilion', 'Envy', 'Omen', 'EliteBook'],
      popularity: 80,
      priceRange: '£159-£649',
      marketShare: 20,
    },
    {
      name: 'Microsoft',
      deviceCount: 6,
      categories: ['Surface Laptop', 'Surface Book', 'Surface Pro'],
      popularity: 75,
      priceRange: '£249-£799',
      marketShare: 15,
    },
    {
      name: 'Lenovo',
      deviceCount: 2,
      categories: ['ThinkPad', 'IdeaPad'],
      popularity: 70,
      priceRange: '£179-£549',
      marketShare: 18,
    },
  ],
  desktop: [
    {
      name: 'Apple',
      deviceCount: 8,
      categories: ['iMac 24"', 'Mac Mini', 'Mac Studio', 'Mac Pro'],
      popularity: 90,
      priceRange: '£199-£1299',
      marketShare: 35,
    },
    {
      name: 'Dell',
      deviceCount: 6,
      categories: ['OptiPlex', 'Inspiron Desktop', 'Alienware'],
      popularity: 75,
      priceRange: '£219-£899',
      marketShare: 25,
    },
    {
      name: 'HP',
      deviceCount: 5,
      categories: ['Pavilion Desktop', 'Elite Desktop', 'Omen'],
      popularity: 72,
      priceRange: '£199-£799',
      marketShare: 22,
    },
    {
      name: 'Microsoft',
      deviceCount: 3,
      categories: ['Surface Studio', 'Surface Hub'],
      popularity: 68,
      priceRange: '£599-£1199',
      marketShare: 18,
    },
  ],
  tablet: [
    {
      name: 'Apple',
      deviceCount: 8,
      categories: ['iPad Pro', 'iPad Air', 'iPad', 'iPad Mini'],
      popularity: 93,
      priceRange: '£119-£749',
      marketShare: 60,
    },
    {
      name: 'Microsoft',
      deviceCount: 4,
      categories: ['Surface Pro', 'Surface Go'],
      popularity: 80,
      priceRange: '£199-£699',
      marketShare: 20,
    },
    {
      name: 'Samsung',
      deviceCount: 4,
      categories: ['Galaxy Tab S9', 'Galaxy Tab A', 'Galaxy Tab Active'],
      popularity: 75,
      priceRange: '£149-£549',
      marketShare: 15,
    },
    {
      name: 'Amazon',
      deviceCount: 2,
      categories: ['Fire HD', 'Fire Max'],
      popularity: 60,
      priceRange: '£79-£199',
      marketShare: 5,
    },
  ],
  gaming: [
    {
      name: 'Sony',
      deviceCount: 3,
      categories: ['PlayStation 5', 'PlayStation 4'],
      popularity: 85,
      priceRange: '£179-£499',
      marketShare: 40,
    },
    {
      name: 'Microsoft',
      deviceCount: 3,
      categories: ['Xbox Series X', 'Xbox Series S', 'Xbox One'],
      popularity: 82,
      priceRange: '£199-£449',
      marketShare: 35,
    },
    {
      name: 'Nintendo',
      deviceCount: 3,
      categories: ['Nintendo Switch', 'Nintendo Switch Lite', 'Switch OLED'],
      popularity: 90,
      priceRange: '£149-£299',
      marketShare: 20,
    },
    {
      name: 'Valve',
      deviceCount: 3,
      categories: ['Steam Deck'],
      popularity: 75,
      priceRange: '£349-£579',
      marketShare: 5,
    },
  ],
};

export default function VisualDeviceSelector({ 
  onDeviceSelect, 
  selectedDevice,
  selectedVariant 
}: VisualDeviceSelectorProps) {
  const [currentStep, setCurrentStep] = useState<'type' | 'brand' | 'model' | 'variant'>('type');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<DeviceModel | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Available data based on current state
  const [availableModels, setAvailableModels] = useState<DeviceModel[]>([]);
  const [availableVariants, setAvailableVariants] = useState<ModelVariant[]>([]);

  // Load models when brand and type are selected
  useEffect(() => {
    if (selectedBrand && selectedType && currentStep === 'model') {
      loadModelsForBrandAndType(selectedBrand, selectedType);
    }
  }, [selectedBrand, selectedType, currentStep]);

  // Generate variants when model is selected
  useEffect(() => {
    if (selectedModel && currentStep === 'variant') {
      generateVariantsForModel(selectedModel);
    }
  }, [selectedModel, currentStep]);

  const loadModelsForBrandAndType = async (brand: string, type: string) => {
    try {
      if (brand === 'Apple') {
        // Filter Apple devices by type
        const filteredDevices = appleDevices.devices.filter(device => {
          if (type === 'smartphone') return device.categoryId === 'iphone';
          if (type === 'laptop') return device.categoryId === 'macbook';
          if (type === 'desktop') return ['imac', 'mac-mini', 'mac-studio', 'mac-pro'].includes(device.categoryId);
          if (type === 'tablet') return device.categoryId === 'ipad';
          return false;
        });
        setAvailableModels(filteredDevices);
      } else {
        // For other brands, we would fetch from API
        // For now, use mock data
        setAvailableModels([]);
      }
    } catch (error) {
      console.error('Failed to load models:', error);
      setAvailableModels([]);
    }
  };

  const generateVariantsForModel = (model: DeviceModel) => {
    // Generate realistic variants based on the device type
    const variants: ModelVariant[] = [];

    if (model.categoryId === 'iphone') {
      // iPhone variants - storage options
      const storageOptions = ['128GB', '256GB', '512GB', '1TB'];
      const colors = ['Natural Titanium', 'Blue Titanium', 'White Titanium', 'Black Titanium'];
      
      storageOptions.forEach((storage, index) => {
        variants.push({
          id: `${model.id}-${storage.toLowerCase()}`,
          name: `${model.name} ${storage}`,
          storage,
          color: colors[index % colors.length],
          priceModifier: index * 100, // £100 per storage tier
        });
      });
    } else if (model.categoryId === 'macbook') {
      // MacBook variants - memory and storage combinations
      const memoryOptions = model.specifications?.memory?.includes('8GB') ? ['8GB', '16GB', '32GB'] : ['16GB', '32GB', '64GB'];
      const storageOptions = ['256GB SSD', '512GB SSD', '1TB SSD', '2TB SSD'];
      
      memoryOptions.forEach((memory) => {
        storageOptions.forEach((storage, storageIndex) => {
          variants.push({
            id: `${model.id}-${memory}-${storage.replace(' ', '').toLowerCase()}`,
            name: `${model.name} ${memory} ${storage}`,
            specs: {
              memory,
              storage,
              processor: model.specifications?.processor,
            },
            priceModifier: (memoryOptions.indexOf(memory) * 200) + (storageIndex * 250),
          });
        });
      });
    } else if (model.categoryId === 'ipad') {
      // iPad variants - storage and connectivity
      const storageOptions = ['128GB', '256GB', '512GB', '1TB'];
      const connectivity = ['Wi-Fi', 'Wi-Fi + Cellular'];
      
      storageOptions.forEach((storage, storageIndex) => {
        connectivity.forEach((conn) => {
          variants.push({
            id: `${model.id}-${storage.toLowerCase()}-${conn.replace(/\s/g, '').toLowerCase()}`,
            name: `${model.name} ${storage} ${conn}`,
            storage,
            connectivity: conn,
            priceModifier: storageIndex * 150 + (conn.includes('Cellular') ? 200 : 0),
          });
        });
      });
    } else {
      // Default single variant for other device types
      variants.push({
        id: `${model.id}-standard`,
        name: `${model.name} (Standard)`,
        priceModifier: 0,
      });
    }

    setAvailableVariants(variants);
  };

  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId);
    setCurrentStep('brand');
    setSelectedBrand(null);
    setSelectedModel(null);
    setSearchQuery('');
  };

  const handleBrandSelect = (brand: string) => {
    setSelectedBrand(brand);
    setCurrentStep('model');
    setSelectedModel(null);
    setSearchQuery('');
  };

  const handleModelSelect = (model: DeviceModel) => {
    setSelectedModel(model);
    if (model.categoryId === 'iphone' || model.categoryId === 'macbook' || model.categoryId === 'ipad') {
      setCurrentStep('variant');
    } else {
      // For devices without variants, complete selection
      onDeviceSelect(model);
    }
  };

  const handleVariantSelect = (variant: ModelVariant) => {
    if (selectedModel) {
      onDeviceSelect(selectedModel, variant);
    }
  };

  const handleBack = () => {
    if (currentStep === 'variant') {
      setCurrentStep('model');
      setAvailableVariants([]);
    } else if (currentStep === 'model') {
      setCurrentStep('brand');
      setSelectedBrand(null);
      setAvailableModels([]);
    } else if (currentStep === 'brand') {
      setCurrentStep('type');
      setSelectedType(null);
    }
  };

  const filteredItems = () => {
    if (currentStep === 'type') {
      return DEVICE_TYPES.filter(type => 
        type.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        type.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    } else if (currentStep === 'brand') {
      const brands = selectedType ? DEVICE_BRANDS[selectedType] || [] : [];
      return brands.filter(brand =>
        brand.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    } else if (currentStep === 'model') {
      return availableModels.filter(model =>
        model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        model.categoryId.toLowerCase().includes(searchQuery.toLowerCase())
      );
    } else {
      return availableVariants.filter(variant =>
        variant.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center space-x-3 mb-8">
      {[
        { id: 'type', label: 'Device Type', number: 1 },
        { id: 'brand', label: 'Brand', number: 2 },
        { id: 'model', label: 'Model', number: 3 },
        { id: 'variant', label: 'Configuration', number: 4 }
      ].map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
            currentStep === step.id
              ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg scale-105'
              : index < ['type', 'brand', 'model', 'variant'].indexOf(currentStep)
              ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-400 border-2 border-gray-200'
          }`}>
            {index < ['type', 'brand', 'model', 'variant'].indexOf(currentStep) ? (
              <Check className="w-5 h-5" />
            ) : (
              step.number
            )}
          </div>
          <div className="ml-2 text-center">
            <div className={`text-xs font-medium ${
              currentStep === step.id ? 'text-blue-600' : 
              index < ['type', 'brand', 'model', 'variant'].indexOf(currentStep) ? 'text-green-600' : 'text-gray-400'
            }`}>
              {step.label}
            </div>
          </div>
          {index < 3 && (
            <ChevronRight className={`w-4 h-4 mx-3 ${
              index < ['type', 'brand', 'model', 'variant'].indexOf(currentStep)
                ? 'text-green-500'
                : 'text-gray-300'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderTypeSelection = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          What type of device needs repair?
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Choose your device category to see available brands and models
        </p>
      </div>

      {/* Smart Search Alternative */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200 mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-blue-900">Quick Device Search</h3>
          </div>
          <SmartDeviceSearch
            onDeviceSelect={(device) => {
              // Auto-detect device type and brand, then navigate to model selection
              const deviceTypeMapping: { [key: string]: string } = {
                'iphone': 'smartphone',
                'macbook': 'laptop',
                'imac': 'desktop',
                'mac-mini': 'desktop',
                'mac-studio': 'desktop',
                'ipad': 'tablet',
              };
              
              const detectedType = deviceTypeMapping[device.categoryId];
              if (detectedType) {
                setSelectedType(detectedType);
                setSelectedBrand(device.brand);
                setSelectedModel(device);
                setCurrentStep('variant');
                generateVariantsForModel(device);
              }
            }}
            placeholder="Type your device name (e.g., iPhone 15, MacBook Pro M4...)"
            className="w-full"
          />
          <p className="text-sm text-blue-700 mt-2">
            💡 Skip the categories and search directly for your device
          </p>
        </div>
      </div>

      <div className="text-center mb-6">
        <div className="inline-flex items-center space-x-2 text-gray-500">
          <div className="h-px bg-gray-300 w-16"></div>
          <span className="text-sm">or browse by category</span>
          <div className="h-px bg-gray-300 w-16"></div>
        </div>
      </div>

      <div className="relative max-w-lg mx-auto">
        <Search className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
        <Input
          placeholder="Search device types..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 h-12 text-lg"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {filteredItems().map((type) => {
          const Icon = type.icon;
          return (
            <Card
              key={type.id}
              className="group relative overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-blue-200 hover:scale-105"
              onClick={() => handleTypeSelect(type.id)}
            >
              <div className="p-6 space-y-4">
                {/* Header with icon and popular badge */}
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  {type.popular && (
                    <div className="flex items-center space-x-1 bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs font-medium">
                      <Star className="w-3 h-3 fill-current" />
                      <span>Popular</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{type.name}</h3>
                  <p className="text-gray-600 text-sm mb-3">{type.description}</p>
                  
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-gray-50 p-2 rounded-lg">
                      <div className="font-medium text-gray-900">{type.count} models</div>
                      <div className="text-gray-500">Available</div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-lg">
                      <div className="font-medium text-gray-900">{type.brandCount} brands</div>
                      <div className="text-gray-500">Supported</div>
                    </div>
                  </div>
                  
                  {/* Price range */}
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm text-gray-500">Repair from</span>
                    <span className="font-semibold text-green-600">{type.priceRange}</span>
                  </div>
                </div>

                {/* Hover effect gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderBrandSelection = () => {
    const selectedTypeData = DEVICE_TYPES.find(t => t.id === selectedType);
    
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Choose your {selectedTypeData?.name} brand
            </h2>
            <p className="text-lg text-gray-600">
              Select the manufacturer of your device
            </p>
          </div>
          <Button variant="secondary" onClick={handleBack}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Device Types
          </Button>
        </div>

        <div className="relative max-w-lg mx-auto">
          <Search className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search brands..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 text-lg"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems().map((brand) => (
            <Card
              key={brand.name}
              className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-blue-200 hover:scale-105"
              onClick={() => handleBrandSelect(brand.name)}
            >
              <div className="p-6 space-y-4">
                {/* Brand header */}
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-700">
                      {brand.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 text-sm">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="font-medium text-green-600">{brand.popularity}%</span>
                  </div>
                </div>

                {/* Brand info */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{brand.name}</h3>
                  
                  {/* Popular categories */}
                  <div className="space-y-2 mb-4">
                    <div className="text-sm text-gray-600">Popular models:</div>
                    <div className="flex flex-wrap gap-1">
                      {brand.categories.slice(0, 3).map((category, index) => (
                        <span 
                          key={index}
                          className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-gray-50 p-2 rounded-lg">
                      <div className="font-medium text-gray-900">{brand.deviceCount} models</div>
                      <div className="text-gray-500">Available</div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-lg">
                      <div className="font-medium text-gray-900">{brand.marketShare}%</div>
                      <div className="text-gray-500">Market share</div>
                    </div>
                  </div>

                  {/* Price range */}
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm text-gray-500">Repair from</span>
                    <span className="font-semibold text-green-600">{brand.priceRange}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredItems().length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Smartphone className="w-16 h-16 mx-auto" />
            </div>
            <p className="text-lg text-gray-500">No brands found for "{searchQuery}"</p>
            <p className="text-gray-400">Try adjusting your search terms</p>
          </div>
        )}
      </div>
    );
  };

  const renderModelSelection = () => (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Select your {selectedBrand} model
          </h2>
          <p className="text-lg text-gray-600">
            Choose your specific device model and year
          </p>
        </div>
        <Button variant="secondary" onClick={handleBack}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Brands
        </Button>
      </div>

      <div className="relative max-w-lg mx-auto">
        <Search className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
        <Input
          placeholder="Search models..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 h-12 text-lg"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems().map((model) => (
          <Card
            key={model.id}
            className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-blue-200 hover:scale-105"
            onClick={() => handleModelSelect(model)}
          >
            <div className="p-6 space-y-4">
              {/* Model header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{model.name}</h3>
                  <p className="text-sm text-gray-600 capitalize mb-2">
                    {model.categoryId.replace('-', ' ')}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {model.year}
                  </span>
                </div>
              </div>

              {/* Specifications preview */}
              {model.specifications && (
                <div className="space-y-2">
                  <div className="text-sm text-gray-600">Key specs:</div>
                  <div className="space-y-1 text-xs text-gray-500">
                    {model.specifications.processor && (
                      <div>• {model.specifications.processor}</div>
                    )}
                    {model.specifications.memory && (
                      <div>• {model.specifications.memory} RAM</div>
                    )}
                    {model.screenSize && (
                      <div>• {model.screenSize}" display</div>
                    )}
                  </div>
                </div>
              )}

              {/* Common issues preview */}
              {model.commonIssues && model.commonIssues.length > 0 && (
                <div className="bg-amber-50 p-3 rounded-lg">
                  <div className="text-xs font-medium text-amber-800 mb-1">Common repairs:</div>
                  <div className="text-xs text-amber-700">
                    {model.commonIssues.slice(0, 2).join(', ')}
                    {model.commonIssues.length > 2 && '...'}
                  </div>
                </div>
              )}

              {/* Pricing */}
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm text-gray-500">Repair from</span>
                <span className="text-lg font-semibold text-green-600">
                  £{model.averageRepairCost}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredItems().length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Monitor className="w-16 h-16 mx-auto" />
          </div>
          <p className="text-lg text-gray-500">No models found for "{searchQuery}"</p>
          <p className="text-gray-400">Try adjusting your search terms or contact us for other models</p>
        </div>
      )}
    </div>
  );

  const renderVariantSelection = () => (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Choose configuration
          </h2>
          <p className="text-lg text-gray-600">
            Select the specific configuration of your {selectedModel?.name}
          </p>
        </div>
        <Button variant="secondary" onClick={handleBack}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Models
        </Button>
      </div>

      <div className="relative max-w-lg mx-auto">
        <Search className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
        <Input
          placeholder="Search configurations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 h-12 text-lg"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredItems().map((variant) => (
          <Card
            key={variant.id}
            className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-blue-200 hover:scale-105"
            onClick={() => handleVariantSelect(variant)}
          >
            <div className="p-6 space-y-4">
              {/* Variant header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{variant.name}</h3>
                  
                  {/* Configuration details */}
                  <div className="space-y-2 text-sm text-gray-600">
                    {variant.storage && (
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        <span>Storage: {variant.storage}</span>
                      </div>
                    )}
                    {variant.color && (
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                        <span>Color: {variant.color}</span>
                      </div>
                    )}
                    {variant.connectivity && (
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span>Connectivity: {variant.connectivity}</span>
                      </div>
                    )}
                    {variant.specs?.memory && (
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                        <span>Memory: {variant.specs.memory}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Price display */}
                <div className="text-right">
                  <div className="text-lg font-semibold text-green-600">
                    £{(selectedModel?.averageRepairCost || 0) + (variant.priceModifier || 0)}
                  </div>
                  {variant.priceModifier && variant.priceModifier > 0 && (
                    <div className="text-xs text-gray-500">
                      +£{variant.priceModifier}
                    </div>
                  )}
                </div>
              </div>

              {/* Premium indicator */}
              {variant.priceModifier && variant.priceModifier > 200 && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-3 rounded-lg border border-amber-200">
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-amber-500 fill-current" />
                    <span className="text-sm font-medium text-amber-800">Premium Configuration</span>
                  </div>
                  <div className="text-xs text-amber-700 mt-1">
                    Enhanced performance and features
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {filteredItems().length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Settings className="w-16 h-16 mx-auto" />
          </div>
          <p className="text-lg text-gray-500">No configurations found for "{searchQuery}"</p>
          <p className="text-gray-400">Try adjusting your search terms</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto">
      {renderStepIndicator()}
      
      {currentStep === 'type' && renderTypeSelection()}
      {currentStep === 'brand' && renderBrandSelection()}
      {currentStep === 'model' && renderModelSelection()}
      {currentStep === 'variant' && renderVariantSelection()}
    </div>
  );
}