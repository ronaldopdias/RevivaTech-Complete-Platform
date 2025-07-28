'use client';

import React, { useState, useEffect } from 'react';
import { Filter, X, Calendar, DollarSign, Star, MapPin, Tag, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

export interface FilterOptions {
  // Content Type Filters
  contentTypes: string[];
  
  // Price Range Filters
  priceRange: {
    min: number;
    max: number;
    enabled: boolean;
  };
  
  // Rating Filters
  minRating: number;
  
  // Location Filters
  locations: string[];
  nearMe: boolean;
  maxDistance: number; // in miles
  
  // Date Filters
  dateRange: {
    start: Date | null;
    end: Date | null;
    enabled: boolean;
  };
  
  // Service Filters
  availability: 'all' | 'available' | 'urgent' | 'scheduled';
  serviceTypes: string[];
  
  // Device Filters
  brands: string[];
  deviceAge: {
    min: number; // years
    max: number;
    enabled: boolean;
  };
  
  // Quality Filters
  certified: boolean;
  warranty: boolean;
  
  // Sort Options
  sortBy: 'relevance' | 'price' | 'rating' | 'distance' | 'newest' | 'popular';
  sortOrder: 'asc' | 'desc';
}

interface AdvancedFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  onReset: () => void;
  className?: string;
  isOpen: boolean;
  onToggle: () => void;
}

const DEFAULT_FILTERS: FilterOptions = {
  contentTypes: [],
  priceRange: { min: 0, max: 1000, enabled: false },
  minRating: 0,
  locations: [],
  nearMe: false,
  maxDistance: 25,
  dateRange: { start: null, end: null, enabled: false },
  availability: 'all',
  serviceTypes: [],
  brands: [],
  deviceAge: { min: 0, max: 10, enabled: false },
  certified: false,
  warranty: false,
  sortBy: 'relevance',
  sortOrder: 'desc'
};

const CONTENT_TYPES = [
  { id: 'device', name: 'Devices', icon: '📱', description: 'Smartphones, tablets, laptops' },
  { id: 'service', name: 'Services', icon: '🔧', description: 'Repair services' },
  { id: 'location', name: 'Locations', icon: '📍', description: 'Store locations' },
  { id: 'article', name: 'Articles', icon: '📝', description: 'Help articles' },
  { id: 'repair_guide', name: 'Guides', icon: '📖', description: 'Repair guides' },
  { id: 'video', name: 'Videos', icon: '🎥', description: 'Tutorial videos' }
];

const SERVICE_TYPES = [
  { id: 'screen-repair', name: 'Screen Repair' },
  { id: 'battery-replacement', name: 'Battery Replacement' },
  { id: 'data-recovery', name: 'Data Recovery' },
  { id: 'water-damage', name: 'Water Damage' },
  { id: 'software-repair', name: 'Software Repair' },
  { id: 'motherboard-repair', name: 'Motherboard Repair' },
  { id: 'camera-repair', name: 'Camera Repair' },
  { id: 'speaker-repair', name: 'Speaker Repair' }
];

const DEVICE_BRANDS = [
  { id: 'apple', name: 'Apple', popular: true },
  { id: 'samsung', name: 'Samsung', popular: true },
  { id: 'google', name: 'Google', popular: true },
  { id: 'oneplus', name: 'OnePlus', popular: false },
  { id: 'huawei', name: 'Huawei', popular: false },
  { id: 'xiaomi', name: 'Xiaomi', popular: false },
  { id: 'dell', name: 'Dell', popular: true },
  { id: 'hp', name: 'HP', popular: true },
  { id: 'lenovo', name: 'Lenovo', popular: false },
  { id: 'asus', name: 'ASUS', popular: false }
];

const LOCATIONS = [
  { id: 'london', name: 'London', region: 'Greater London' },
  { id: 'manchester', name: 'Manchester', region: 'Greater Manchester' },
  { id: 'birmingham', name: 'Birmingham', region: 'West Midlands' },
  { id: 'leeds', name: 'Leeds', region: 'West Yorkshire' },
  { id: 'liverpool', name: 'Liverpool', region: 'Merseyside' },
  { id: 'bristol', name: 'Bristol', region: 'South West' },
  { id: 'sheffield', name: 'Sheffield', region: 'South Yorkshire' },
  { id: 'edinburgh', name: 'Edinburgh', region: 'Scotland' }
];

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Most Relevant', icon: '🎯' },
  { value: 'rating', label: 'Highest Rated', icon: '⭐' },
  { value: 'price', label: 'Price', icon: '💰' },
  { value: 'distance', label: 'Nearest', icon: '📍' },
  { value: 'newest', label: 'Newest', icon: '🆕' },
  { value: 'popular', label: 'Most Popular', icon: '🔥' }
];

export default function AdvancedFilters({
  filters,
  onFiltersChange,
  onReset,
  className = "",
  isOpen,
  onToggle
}: AdvancedFiltersProps) {
  const [activeTab, setActiveTab] = useState<string>('content');
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalFilters(filters);
    setHasChanges(false);
  }, [filters]);

  const updateFilter = <K extends keyof FilterOptions>(
    key: K,
    value: FilterOptions[K]
  ) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    setHasChanges(true);
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
    setHasChanges(false);
  };

  const resetFilters = () => {
    setLocalFilters(DEFAULT_FILTERS);
    onReset();
    setHasChanges(false);
  };

  const toggleArrayFilter = <T extends string>(
    filterKey: keyof FilterOptions,
    value: T
  ) => {
    const currentArray = localFilters[filterKey] as T[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    updateFilter(filterKey, newArray as FilterOptions[typeof filterKey]);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (localFilters.contentTypes.length > 0) count++;
    if (localFilters.priceRange.enabled) count++;
    if (localFilters.minRating > 0) count++;
    if (localFilters.locations.length > 0 || localFilters.nearMe) count++;
    if (localFilters.dateRange.enabled) count++;
    if (localFilters.availability !== 'all') count++;
    if (localFilters.serviceTypes.length > 0) count++;
    if (localFilters.brands.length > 0) count++;
    if (localFilters.deviceAge.enabled) count++;
    if (localFilters.certified || localFilters.warranty) count++;
    if (localFilters.sortBy !== 'relevance') count++;
    return count;
  };

  const filterTabs = [
    { id: 'content', name: 'Content', icon: Tag },
    { id: 'price', name: 'Price', icon: DollarSign },
    { id: 'location', name: 'Location', icon: MapPin },
    { id: 'service', name: 'Service', icon: Clock },
    { id: 'quality', name: 'Quality', icon: Star },
    { id: 'sort', name: 'Sort', icon: Filter }
  ];

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        onClick={onToggle}
        className={`relative ${className}`}
      >
        <Filter className="w-4 h-4 mr-2" />
        Filters
        {getActiveFilterCount() > 0 && (
          <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {getActiveFilterCount()}
          </span>
        )}
      </Button>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900">Advanced Filters</h3>
          {getActiveFilterCount() > 0 && (
            <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full">
              {getActiveFilterCount()} active
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {hasChanges && (
            <Button variant="primary" size="sm" onClick={applyFilters}>
              Apply
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            Reset
          </Button>
          <Button variant="ghost" size="sm" onClick={onToggle}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {filterTabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* Filter Content */}
      <div className="space-y-6">
        {/* Content Types */}
        {activeTab === 'content' && (
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Content Types</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {CONTENT_TYPES.map(type => (
                <label
                  key={type.id}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    localFilters.contentTypes.includes(type.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={localFilters.contentTypes.includes(type.id)}
                    onChange={() => toggleArrayFilter('contentTypes', type.id)}
                    className="sr-only"
                  />
                  <span className="text-lg mr-3">{type.icon}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{type.name}</div>
                    <div className="text-xs text-gray-500">{type.description}</div>
                  </div>
                  {localFilters.contentTypes.includes(type.id) && (
                    <CheckCircle className="w-5 h-5 text-blue-500" />
                  )}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Price Range */}
        {activeTab === 'price' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-md font-medium text-gray-900">Price Range</h4>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={localFilters.priceRange.enabled}
                  onChange={(e) => updateFilter('priceRange', {
                    ...localFilters.priceRange,
                    enabled: e.target.checked
                  })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-600">Enable</span>
              </label>
            </div>
            
            {localFilters.priceRange.enabled && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum (£)
                    </label>
                    <Input
                      type="number"
                      value={localFilters.priceRange.min}
                      onChange={(e) => updateFilter('priceRange', {
                        ...localFilters.priceRange,
                        min: Number(e.target.value)
                      })}
                      min="0"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Maximum (£)
                    </label>
                    <Input
                      type="number"
                      value={localFilters.priceRange.max}
                      onChange={(e) => updateFilter('priceRange', {
                        ...localFilters.priceRange,
                        max: Number(e.target.value)
                      })}
                      min="0"
                      className="w-full"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>£{localFilters.priceRange.min}</span>
                    <span>£{localFilters.priceRange.max}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    value={localFilters.priceRange.max}
                    onChange={(e) => updateFilter('priceRange', {
                      ...localFilters.priceRange,
                      max: Number(e.target.value)
                    })}
                    className="w-full"
                  />
                </div>
              </div>
            )}
            
            <div>
              <h5 className="text-sm font-medium text-gray-900 mb-2">Minimum Rating</h5>
              <div className="flex space-x-2">
                {[0, 1, 2, 3, 4, 4.5].map(rating => (
                  <button
                    key={rating}
                    onClick={() => updateFilter('minRating', rating)}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm ${
                      localFilters.minRating === rating
                        ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Star className="w-3 h-3" />
                    <span>{rating === 0 ? 'Any' : `${rating}+`}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Location */}
        {activeTab === 'location' && (
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">Location</h4>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={localFilters.nearMe}
                onChange={(e) => updateFilter('nearMe', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-600">Near me</span>
            </label>
            
            {localFilters.nearMe && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Distance: {localFilters.maxDistance} miles
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={localFilters.maxDistance}
                  onChange={(e) => updateFilter('maxDistance', Number(e.target.value))}
                  className="w-full"
                />
              </div>
            )}
            
            <div>
              <h5 className="text-sm font-medium text-gray-900 mb-2">Specific Locations</h5>
              <div className="grid grid-cols-2 gap-2">
                {LOCATIONS.map(location => (
                  <label
                    key={location.id}
                    className={`flex items-center p-2 border rounded cursor-pointer transition-colors ${
                      localFilters.locations.includes(location.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={localFilters.locations.includes(location.id)}
                      onChange={() => toggleArrayFilter('locations', location.id)}
                      className="sr-only"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{location.name}</div>
                      <div className="text-xs text-gray-500">{location.region}</div>
                    </div>
                    {localFilters.locations.includes(location.id) && (
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                    )}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Service */}
        {activeTab === 'service' && (
          <div className="space-y-4">
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">Availability</h4>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'all', label: 'All Services' },
                  { value: 'available', label: 'Available Now' },
                  { value: 'urgent', label: 'Same Day' },
                  { value: 'scheduled', label: 'Scheduled' }
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => updateFilter('availability', option.value as any)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      localFilters.availability === option.value
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <h5 className="text-sm font-medium text-gray-900 mb-2">Service Types</h5>
              <div className="grid grid-cols-2 gap-2">
                {SERVICE_TYPES.map(service => (
                  <label
                    key={service.id}
                    className={`flex items-center p-2 border rounded cursor-pointer transition-colors ${
                      localFilters.serviceTypes.includes(service.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={localFilters.serviceTypes.includes(service.id)}
                      onChange={() => toggleArrayFilter('serviceTypes', service.id)}
                      className="sr-only"
                    />
                    <span className="text-sm text-gray-900 flex-1">{service.name}</span>
                    {localFilters.serviceTypes.includes(service.id) && (
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                    )}
                  </label>
                ))}
              </div>
            </div>
            
            <div>
              <h5 className="text-sm font-medium text-gray-900 mb-2">Device Brands</h5>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {DEVICE_BRANDS.filter(brand => brand.popular).map(brand => (
                    <label
                      key={brand.id}
                      className={`flex items-center p-2 border rounded cursor-pointer transition-colors ${
                        localFilters.brands.includes(brand.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={localFilters.brands.includes(brand.id)}
                        onChange={() => toggleArrayFilter('brands', brand.id)}
                        className="sr-only"
                      />
                      <span className="text-sm text-gray-900 flex-1">{brand.name}</span>
                      {localFilters.brands.includes(brand.id) && (
                        <CheckCircle className="w-4 h-4 text-blue-500" />
                      )}
                    </label>
                  ))}
                </div>
                
                <details className="mt-2">
                  <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-700">
                    Show more brands ({DEVICE_BRANDS.filter(brand => !brand.popular).length})
                  </summary>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {DEVICE_BRANDS.filter(brand => !brand.popular).map(brand => (
                      <label
                        key={brand.id}
                        className={`flex items-center p-2 border rounded cursor-pointer transition-colors ${
                          localFilters.brands.includes(brand.id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={localFilters.brands.includes(brand.id)}
                          onChange={() => toggleArrayFilter('brands', brand.id)}
                          className="sr-only"
                        />
                        <span className="text-sm text-gray-900 flex-1">{brand.name}</span>
                        {localFilters.brands.includes(brand.id) && (
                          <CheckCircle className="w-4 h-4 text-blue-500" />
                        )}
                      </label>
                    ))}
                  </div>
                </details>
              </div>
            </div>
          </div>
        )}

        {/* Quality */}
        {activeTab === 'quality' && (
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">Quality Filters</h4>
            
            <div className="space-y-3">
              <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={localFilters.certified}
                  onChange={(e) => updateFilter('certified', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">Certified Technicians Only</div>
                  <div className="text-xs text-gray-500">Services performed by certified professionals</div>
                </div>
              </label>
              
              <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={localFilters.warranty}
                  onChange={(e) => updateFilter('warranty', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">Warranty Included</div>
                  <div className="text-xs text-gray-500">Services that include warranty coverage</div>
                </div>
              </label>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-sm font-medium text-gray-900">Device Age Range</h5>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={localFilters.deviceAge.enabled}
                    onChange={(e) => updateFilter('deviceAge', {
                      ...localFilters.deviceAge,
                      enabled: e.target.checked
                    })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-600">Enable</span>
                </label>
              </div>
              
              {localFilters.deviceAge.enabled && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{localFilters.deviceAge.min} year{localFilters.deviceAge.min !== 1 ? 's' : ''}</span>
                    <span>{localFilters.deviceAge.max} year{localFilters.deviceAge.max !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max="15"
                      value={localFilters.deviceAge.min}
                      onChange={(e) => updateFilter('deviceAge', {
                        ...localFilters.deviceAge,
                        min: Number(e.target.value)
                      })}
                      className="w-full"
                    />
                    <input
                      type="range"
                      min="0"
                      max="15"
                      value={localFilters.deviceAge.max}
                      onChange={(e) => updateFilter('deviceAge', {
                        ...localFilters.deviceAge,
                        max: Number(e.target.value)
                      })}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sort */}
        {activeTab === 'sort' && (
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">Sort Options</h4>
            
            <div className="space-y-2">
              {SORT_OPTIONS.map(option => (
                <label
                  key={option.value}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    localFilters.sortBy === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="sortBy"
                    value={option.value}
                    checked={localFilters.sortBy === option.value}
                    onChange={(e) => updateFilter('sortBy', e.target.value as any)}
                    className="sr-only"
                  />
                  <span className="text-lg mr-3">{option.icon}</span>
                  <span className="text-sm font-medium text-gray-900 flex-1">{option.label}</span>
                  {localFilters.sortBy === option.value && (
                    <CheckCircle className="w-5 h-5 text-blue-500" />
                  )}
                </label>
              ))}
            </div>
            
            {['price', 'rating', 'distance', 'newest'].includes(localFilters.sortBy) && (
              <div className="mt-4">
                <h5 className="text-sm font-medium text-gray-900 mb-2">Order</h5>
                <div className="flex space-x-2">
                  <button
                    onClick={() => updateFilter('sortOrder', 'asc')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      localFilters.sortOrder === 'asc'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Ascending
                  </button>
                  <button
                    onClick={() => updateFilter('sortOrder', 'desc')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      localFilters.sortOrder === 'desc'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Descending
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Apply/Reset Actions */}
      {hasChanges && (
        <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between">
          <Button variant="ghost" onClick={resetFilters}>
            Reset All Filters
          </Button>
          <Button variant="primary" onClick={applyFilters}>
            Apply Filters ({getActiveFilterCount()})
          </Button>
        </div>
      )}
    </Card>
  );
}