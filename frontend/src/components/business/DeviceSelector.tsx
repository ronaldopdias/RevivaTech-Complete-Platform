'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Monitor, Smartphone, Gamepad2, Laptop, ChevronRight, Star, Clock, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { allDevices, allCategories, searchDevices, getDevicesByCategory, getPopularDevices, getCategoryStats } from '../../../config/devices';
import type { DeviceModel, DeviceCategory } from '@/types/config';

export interface DeviceSelectorProps {
  onDeviceSelect: (device: DeviceModel) => void;
  selectedDevice?: DeviceModel | null;
  className?: string;
  variant?: 'default' | 'compact' | 'detailed';
  showPopular?: boolean;
  showSearch?: boolean;
  placeholder?: string;
}

const categoryIcons = {
  'macbook': Laptop,
  'imac': Monitor,
  'iphone': Smartphone,
  'ipad': Smartphone,
  'laptop': Laptop,
  'desktop': Monitor,
  'gaming': Gamepad2,
  'android': Smartphone,
};

export const DeviceSelector: React.FC<DeviceSelectorProps> = ({
  onDeviceSelect,
  selectedDevice,
  className,
  variant = 'default',
  showPopular = true,
  showSearch = true,
  placeholder = "Search for your device...",
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<DeviceModel[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [showAllCategories, setShowAllCategories] = useState(false);

  // Get popular devices and category stats
  const popularDevices = useMemo(() => getPopularDevices(), []);
  const categoryStats = useMemo(() => getCategoryStats(), []);
  
  // Filter devices based on search and category
  const filteredDevices = useMemo(() => {
    if (searchQuery.trim()) {
      return searchDevices(searchQuery);
    }
    
    if (selectedCategory) {
      return getDevicesByCategory(selectedCategory);
    }
    
    return [];
  }, [searchQuery, selectedCategory]);

  // Handle search input changes
  useEffect(() => {
    if (searchQuery.trim()) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        const results = searchDevices(searchQuery);
        setSearchResults(results);
        setIsSearching(false);
      }, 300);
      
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [searchQuery]);

  const handleDeviceClick = (device: DeviceModel) => {
    onDeviceSelect(device);
  };

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId === selectedCategory ? null : categoryId);
    setSearchQuery('');
  };

  const handleSearchFocus = () => {
    setSelectedCategory(null);
  };

  const displayCategories = showAllCategories ? allCategories : allCategories.slice(0, 4);

  if (variant === 'compact') {
    return (
      <div className={cn("space-y-4", className)}>
        {showSearch && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={placeholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={handleSearchFocus}
              className="w-full pl-10 pr-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            />
          </div>
        )}
        
        {searchQuery && (
          <div className="space-y-2">
            {isSearching ? (
              <div className="text-center py-4 text-neutral-500">Searching...</div>
            ) : searchResults.length > 0 ? (
              searchResults.map((device) => (
                <button
                  key={device.id}
                  onClick={() => handleDeviceClick(device)}
                  className={cn(
                    "w-full text-left p-3 border rounded-lg transition-colors hover:bg-neutral-50",
                    selectedDevice?.id === device.id ? "border-primary-500 bg-primary-50" : "border-neutral-200"
                  )}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{device.name}</div>
                      <div className="text-sm text-neutral-500">{device.brand} • {device.year}</div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-neutral-400" />
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-4 text-neutral-500">No devices found</div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Search Bar */}
      {showSearch && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={handleSearchFocus}
            className="w-full pl-12 pr-4 py-4 text-lg border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white shadow-sm"
          />
        </div>
      )}

      {/* Popular Devices */}
      {showPopular && !searchQuery && !selectedCategory && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-primary-500" />
            <h3 className="text-lg font-semibold text-neutral-900">Popular Devices</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {popularDevices.slice(0, 6).map((device) => (
              <button
                key={device.id}
                onClick={() => handleDeviceClick(device)}
                className={cn(
                  "text-left p-4 border-2 rounded-xl transition-all hover:shadow-md hover:border-primary-300",
                  selectedDevice?.id === device.id 
                    ? "border-primary-500 bg-primary-50 shadow-md" 
                    : "border-neutral-200 hover:bg-neutral-50"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-neutral-900">{device.name}</div>
                    <div className="text-sm text-neutral-500">{device.brand} • {device.year}</div>
                    <div className="text-sm text-primary-600 mt-1">
                      From £{device.averageRepairCost}
                    </div>
                  </div>
                  <Star className="h-4 w-4 text-amber-400 fill-current" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Category Selection */}
      {!searchQuery && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-neutral-900">Browse by Category</h3>
            {allCategories.length > 4 && (
              <button
                onClick={() => setShowAllCategories(!showAllCategories)}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                {showAllCategories ? 'Show Less' : 'Show All'}
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayCategories.map((category) => {
              const IconComponent = categoryIcons[category.id as keyof typeof categoryIcons] || Monitor;
              const stats = categoryStats.find(s => s.category.id === category.id);
              
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className={cn(
                    "text-left p-6 border-2 rounded-xl transition-all hover:shadow-lg",
                    selectedCategory === category.id
                      ? "border-primary-500 bg-primary-50 shadow-lg"
                      : "border-neutral-200 hover:border-primary-300 hover:bg-neutral-50"
                  )}
                >
                  <div className="flex items-start space-x-4">
                    <div className={cn(
                      "p-3 rounded-lg",
                      selectedCategory === category.id
                        ? "bg-primary-100 text-primary-600"
                        : "bg-neutral-100 text-neutral-600"
                    )}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-neutral-900">{category.name}</h4>
                      <p className="text-sm text-neutral-600 mt-1">{category.description}</p>
                      {stats && (
                        <div className="flex items-center space-x-4 mt-3 text-xs text-neutral-500">
                          <span>{stats.deviceCount} models</span>
                          <span>£{stats.avgRepairCost} avg</span>
                          <span>{stats.yearRange.min}-{stats.yearRange.max}</span>
                        </div>
                      )}
                    </div>
                    <ChevronRight className={cn(
                      "h-5 w-5 transition-transform",
                      selectedCategory === category.id ? "rotate-90 text-primary-500" : "text-neutral-400"
                    )} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Search Results or Category Devices */}
      {(searchQuery || selectedCategory) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-neutral-900">
              {searchQuery ? `Search Results (${filteredDevices.length})` : 'Select Your Device'}
            </h3>
            {(searchQuery || selectedCategory) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory(null);
                }}
                className="text-neutral-500 hover:text-neutral-700 text-sm"
              >
                Clear
              </button>
            )}
          </div>

          {isSearching ? (
            <div className="text-center py-8 text-neutral-500">
              <div className="animate-spin inline-block w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full mb-2"></div>
              <div>Searching devices...</div>
            </div>
          ) : filteredDevices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDevices.map((device) => (
                <button
                  key={device.id}
                  onClick={() => handleDeviceClick(device)}
                  className={cn(
                    "text-left p-4 border-2 rounded-xl transition-all hover:shadow-md",
                    selectedDevice?.id === device.id
                      ? "border-primary-500 bg-primary-50 shadow-md"
                      : "border-neutral-200 hover:border-primary-300 hover:bg-neutral-50"
                  )}
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-neutral-900">{device.name}</h4>
                        <p className="text-sm text-neutral-600">{device.brand}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-neutral-900">{device.year}</div>
                        <div className="text-xs text-neutral-500">
                          <Clock className="inline h-3 w-3 mr-1" />
                          {new Date().getFullYear() - device.year}y old
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-primary-600 font-medium">
                        From £{device.averageRepairCost}
                      </div>
                      {device.commonIssues && device.commonIssues.length > 0 && (
                        <div className="text-xs text-neutral-500">
                          {device.commonIssues.length} common issues
                        </div>
                      )}
                    </div>

                    {variant === 'detailed' && device.commonIssues && device.commonIssues.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-neutral-100">
                        <div className="text-xs text-neutral-600 mb-1">Common Issues:</div>
                        <div className="text-xs text-neutral-500">
                          {device.commonIssues.slice(0, 2).join(', ')}
                          {device.commonIssues.length > 2 && ` +${device.commonIssues.length - 2} more`}
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-neutral-500">
              <Monitor className="h-12 w-12 mx-auto mb-3 text-neutral-300" />
              <div className="text-lg font-medium mb-1">No devices found</div>
              <div className="text-sm">Try adjusting your search or browse by category</div>
            </div>
          )}
        </div>
      )}

      {/* Selected Device Summary */}
      {selectedDevice && (
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-primary-100 rounded-lg">
              <Monitor className="h-6 w-6 text-primary-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-primary-900">Selected Device</h4>
              <p className="text-primary-700">{selectedDevice.name} ({selectedDevice.year})</p>
              <p className="text-sm text-primary-600">Average repair cost: £{selectedDevice.averageRepairCost}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceSelector;