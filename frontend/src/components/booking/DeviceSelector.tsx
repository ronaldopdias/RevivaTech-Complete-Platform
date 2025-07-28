'use client';

import React, { useState, useEffect } from 'react';
import { Search, Smartphone, Tablet, Laptop, Monitor, ChevronRight } from 'lucide-react';

interface Device {
  id: string;
  display_name: string;
  brand_name: string;
  category_name: string;
  year: number;
  slug: string;
  thumbnail_url?: string;
  repairability_score: number;
  avg_repair_cost: number;
  popularity_score: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  device_count: number;
}

interface Brand {
  id: string;
  name: string;
  slug: string;
  device_count: number;
}

interface DeviceSelectorProps {
  onDeviceSelect: (device: Device) => void;
  selectedDevice?: Device | null;
  className?: string;
}

const categoryIcons = {
  smartphones: Smartphone,
  tablets: Tablet,
  laptops: Laptop,
  desktops: Monitor,
};

export default function DeviceSelector({ onDeviceSelect, selectedDevice, className = '' }: DeviceSelectorProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [yearRange, setYearRange] = useState<[number, number]>([2020, 2025]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // API Base URL - use the backend container port
  const API_BASE = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3011' 
    : '';

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Load brands when category changes
  useEffect(() => {
    if (selectedCategory) {
      loadBrands(selectedCategory);
    } else {
      loadBrands();
    }
  }, [selectedCategory]);

  // Load devices when filters change
  useEffect(() => {
    loadDevices();
  }, [selectedCategory, selectedBrand, searchQuery, yearRange, currentPage]);

  const loadCategories = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/devices/categories`);
      if (response.ok) {
        const data = await response.json();
        // Map the backend format to our component format
        const mappedCategories = data.map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          icon: cat.icon,
          device_count: 0 // Will be populated when we load devices
        }));
        setCategories(mappedCategories);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const loadBrands = async (category?: string) => {
    try {
      const url = category 
        ? `${API_BASE}/api/devices/brands?category=${category}`
        : `${API_BASE}/api/devices/brands`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        // Map the backend format to our component format
        const mappedBrands = data.map((brand: any) => ({
          id: brand.id,
          name: brand.name,
          slug: brand.slug || brand.name.toLowerCase(),
          device_count: brand.device_count || 0
        }));
        setBrands(mappedBrands);
      }
    } catch (err) {
      console.error('Failed to load brands:', err);
    }
  };

  const loadDevices = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        sort: 'popularity'
      });

      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedBrand) params.append('brand', selectedBrand);
      if (searchQuery.trim()) params.append('q', searchQuery.trim());
      if (yearRange[0]) params.append('year_min', yearRange[0].toString());
      if (yearRange[1]) params.append('year_max', yearRange[1].toString());

      const response = await fetch(`${API_BASE}/api/devices/models/search?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        // Map the backend format to our component format
        const mappedDevices = data.models.map((device: any) => ({
          id: device.id,
          display_name: device.name,
          brand_name: device.brandName,
          category_name: device.categoryName,
          year: device.year,
          slug: device.slug,
          thumbnail_url: device.imageUrl,
          repairability_score: device.specs?.repairability_score || 5.0,
          avg_repair_cost: device.specs?.average_repair_cost || 200,
          popularity_score: device.specs?.popularity_score || 5.0
        }));
        setDevices(mappedDevices);
        setTotalPages(data.pagination?.pages || 1);
      } else {
        throw new Error('Failed to load devices');
      }
    } catch (err) {
      setError('Failed to load devices. Please try again.');
      console.error('Device loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setSelectedCategory('');
    setSelectedBrand('');
    setSearchQuery('');
    setYearRange([2020, 2025]);
    setCurrentPage(1);
  };

  const handleCategorySelect = (categorySlug: string) => {
    setSelectedCategory(categorySlug === selectedCategory ? '' : categorySlug);
    setSelectedBrand(''); // Reset brand when category changes
    setCurrentPage(1);
  };

  const handleBrandSelect = (brandSlug: string) => {
    setSelectedBrand(brandSlug === selectedBrand ? '' : brandSlug);
    setCurrentPage(1);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Select Your Device
        </h2>
        <p className="text-gray-600">
          Choose your device to get an instant repair quote
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search for your device (e.g., iPhone 15, Galaxy S23)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Category Filter */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Device Category</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {categories.map((category) => {
            const IconComponent = categoryIcons[category.slug as keyof typeof categoryIcons] || Smartphone;
            const isSelected = selectedCategory === category.slug;
            
            return (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category.slug)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 text-center hover:shadow-md ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <IconComponent className="w-8 h-8 mx-auto mb-2" />
                <div className="font-medium">{category.name}</div>
                <div className="text-sm text-gray-500">{category.device_count} devices</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Brand Filter */}
      {brands.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Brand</h3>
          <div className="flex flex-wrap gap-2">
            {brands.map((brand) => {
              const isSelected = selectedBrand === brand.slug;
              
              return (
                <button
                  key={brand.id}
                  onClick={() => handleBrandSelect(brand.slug)}
                  className={`px-4 py-2 rounded-full border transition-colors duration-200 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-500 text-white'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  {brand.name} ({brand.device_count})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Filters */}
      {(selectedCategory || selectedBrand || searchQuery) && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-700">Active filters:</span>
          {selectedCategory && (
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              {categories.find(c => c.slug === selectedCategory)?.name}
            </span>
          )}
          {selectedBrand && (
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              {brands.find(b => b.slug === selectedBrand)?.name}
            </span>
          )}
          {searchQuery && (
            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
              &quot;{searchQuery}&quot;
            </span>
          )}
          <button
            onClick={resetFilters}
            className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm hover:bg-gray-200 transition-colors"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={loadDevices}
            className="mt-2 text-red-600 hover:text-red-700 underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">Loading devices...</p>
        </div>
      )}

      {/* Devices Grid */}
      {!loading && devices.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map((device) => {
            const isSelected = selectedDevice?.id === device.id;
            
            return (
              <button
                key={device.id}
                onClick={() => onDeviceSelect(device)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 text-left hover:shadow-md ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-gray-900">{device.brand_name}</span>
                    <span className="text-gray-500">({device.year})</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
                
                <h4 className="font-medium text-gray-900 mb-2">
                  {device.display_name}
                </h4>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{device.category_name}</span>
                  <div className="flex items-center space-x-1">
                    <div className="flex">
                      {Array.from({ length: 5 }, (_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full ${
                            i < (device.repairability_score || 0) / 2
                              ? 'bg-green-400'
                              : 'bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">Repairability</span>
                  </div>
                </div>
                
                {device.avg_repair_cost && (
                  <div className="mt-2 text-sm text-gray-600">
                    From £{Math.round(device.avg_repair_cost)}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* No Results */}
      {!loading && devices.length === 0 && !error && (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">No devices found matching your criteria</p>
          <button
            onClick={resetFilters}
            className="text-blue-600 hover:text-blue-700 underline"
          >
            Clear filters to see all devices
          </button>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          
          <span className="px-4 py-2 text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}