'use client';

import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useServiceContext } from '@/providers/ServiceProvider';

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

interface Brand {
  name: string;
  logo?: string;
  deviceCount: number;
  categories: string[];
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

interface ThreeStepDeviceSelectorProps {
  onDeviceSelect: (device: DeviceModel, variant?: ModelVariant) => void;
  selectedDevice?: DeviceModel | null;
  selectedVariant?: ModelVariant | null;
}

// MOCK_BRANDS removed - now using real device categories from API

export default function ThreeStepDeviceSelector({ 
  onDeviceSelect, 
  selectedDevice,
  selectedVariant 
}: ThreeStepDeviceSelectorProps) {
  const { factory } = useServiceContext();
  const [currentStep, setCurrentStep] = useState<'brand' | 'model' | 'variant'>('brand');
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<DeviceModel | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Available data based on current state
  const [deviceCategories, setDeviceCategories] = useState<any[]>([]);
  const [availableModels, setAvailableModels] = useState<DeviceModel[]>([]);
  const [availableVariants, setAvailableVariants] = useState<ModelVariant[]>([]);

  // Load device categories on mount
  useEffect(() => {
    loadDeviceCategories();
  }, []);

  // Load models when brand is selected
  useEffect(() => {
    if (selectedBrand && currentStep === 'model') {
      loadModelsForBrand(selectedBrand);
    }
  }, [selectedBrand, currentStep]);

  // Generate variants when model is selected
  useEffect(() => {
    if (selectedModel && currentStep === 'variant') {
      generateVariantsForModel(selectedModel);
    }
  }, [selectedModel, currentStep]);

  const loadDeviceCategories = async () => {
    try {
      setLoading(true);
      const deviceService = factory.getDeviceService();
      const response = await deviceService.getCategories();
      
      if (response.success && response.data) {
        setDeviceCategories(response.data);
      } else {
        console.error('Failed to load device categories:', response.error);
      }
    } catch (error) {
      console.error('Error loading device categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadModelsForBrand = async (categoryIdOrSlug: string) => {
    try {
      setLoading(true);
      const deviceService = factory.getDeviceService();
      
      // Find the selected category to get the proper categoryId
      const selectedCategory = deviceCategories.find(cat => 
        cat.id === categoryIdOrSlug || cat.slug === categoryIdOrSlug
      );
      
      if (!selectedCategory) {
        console.error('Category not found:', categoryIdOrSlug);
        setAvailableModels([]);
        return;
      }
      
      const response = await deviceService.getDeviceModels({ 
        categoryId: selectedCategory.id, 
        limit: 50 
      });
      
      if (response.success && response.data) {
        setAvailableModels(response.data as DeviceModel[]);
      } else {
        console.error('Failed to load models:', response.error);
        setAvailableModels([]);
      }
    } catch (error) {
      console.error('Failed to load models:', error);
      setAvailableModels([]);
    } finally {
      setLoading(false);
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

  const handleCategorySelect = (categorySlug: string, categoryName: string) => {
    setSelectedBrand(categorySlug); // Reusing selectedBrand state for category slug
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
    }
  };

  const filteredItems = () => {
    if (currentStep === 'brand') {
      return deviceCategories.filter(category => 
        category.name.toLowerCase().includes(searchQuery.toLowerCase())
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
    <div className="flex items-center justify-center space-x-4 mb-8">
      {['brand', 'model', 'variant'].map((step, index) => (
        <div key={step} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            currentStep === step
              ? 'bg-blue-600 text-white'
              : index < ['brand', 'model', 'variant'].indexOf(currentStep)
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 text-gray-600'
          }`}>
            {index < ['brand', 'model', 'variant'].indexOf(currentStep) ? (
              <Check className="w-4 h-4" />
            ) : (
              index + 1
            )}
          </div>
          {index < 2 && (
            <ChevronRight className={`w-4 h-4 mx-2 ${
              index < ['brand', 'model', 'variant'].indexOf(currentStep)
                ? 'text-green-600'
                : 'text-gray-400'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderBrandSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Select Device Brand
        </h2>
        <p className="text-gray-600">
          Choose the manufacturer of your device
        </p>
      </div>

      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search brands..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-500">Loading categories...</p>
          </div>
        ) : (
          filteredItems().map((category) => (
            <Card
              key={category.id}
              className="p-6 cursor-pointer hover:shadow-lg transition-all border-2 border-transparent hover:border-blue-200"
              onClick={() => handleCategorySelect(category.slug, category.name)}
            >
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto">
                  <span className="text-xl font-bold text-gray-600">
                    {category.name.charAt(0)}
                  </span>
                </div>
                <h3 className="font-medium text-gray-900">{category.name}</h3>
                <div className="text-sm text-gray-500 space-y-1">
                  <p className="text-xs">{category.description}</p>
                </div>
            </div>
          </Card>
          ))
        )}
      </div>
    </div>
  );

  const renderModelSelection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Select {selectedBrand} Model
          </h2>
          <p className="text-gray-600">
            Choose your specific device model
          </p>
        </div>
        <Button variant="secondary" onClick={handleBack}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Brands
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search models..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems().map((model) => (
          <Card
            key={model.id}
            className="p-4 cursor-pointer hover:shadow-lg transition-all border-2 border-transparent hover:border-blue-200"
            onClick={() => handleModelSelect(model)}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{model.name}</h3>
                  <p className="text-sm text-gray-600">{model.year}</p>
                  <p className="text-xs text-gray-500 capitalize">{model.categoryId.replace('-', ' ')}</p>
                </div>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {model.year}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">From</span>
                <span className="font-medium text-green-600">
                  £{model.averageRepairCost}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredItems().length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No models found. Try a different search term.</p>
        </div>
      )}
    </div>
  );

  const renderVariantSelection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Select Configuration
          </h2>
          <p className="text-gray-600">
            Choose the specific configuration of your {selectedModel?.name}
          </p>
        </div>
        <Button variant="secondary" onClick={handleBack}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Models
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search configurations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredItems().map((variant) => (
          <Card
            key={variant.id}
            className="p-4 cursor-pointer hover:shadow-lg transition-all border-2 border-transparent hover:border-blue-200"
            onClick={() => handleVariantSelect(variant)}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{variant.name}</h3>
                  <div className="text-sm text-gray-600 space-y-1 mt-2">
                    {variant.storage && <p>Storage: {variant.storage}</p>}
                    {variant.color && <p>Color: {variant.color}</p>}
                    {variant.connectivity && <p>Connectivity: {variant.connectivity}</p>}
                    {variant.specs?.memory && <p>Memory: {variant.specs.memory}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-green-600">
                    £{(selectedModel?.averageRepairCost || 0) + (variant.priceModifier || 0)}
                  </span>
                  {variant.priceModifier && variant.priceModifier > 0 && (
                    <p className="text-xs text-gray-500">
                      +£{variant.priceModifier}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredItems().length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No configurations found. Try a different search term.</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      {renderStepIndicator()}
      
      {currentStep === 'brand' && renderBrandSelection()}
      {currentStep === 'model' && renderModelSelection()}
      {currentStep === 'variant' && renderVariantSelection()}
    </div>
  );
}