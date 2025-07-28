'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Icon } from '@/components/ui/Icon';

interface DeviceCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  brands: string[];
  popularModels: string[];
  deviceCount?: number;
  brandCount?: number;
}

interface DeviceModel {
  id: string;
  categoryId: string;
  category: string;
  brand: string;
  name: string;
  year: number;
  imageUrl?: string;
  specifications: any;
  commonIssues: string[];
  averageRepairCost: number;
  screenSize?: number;
}

interface AdvancedDeviceSelectorProps {
  onDeviceSelect: (device: DeviceModel) => void;
  selectedDeviceId?: string;
  className?: string;
}

export function AdvancedDeviceSelector({ 
  onDeviceSelect, 
  selectedDeviceId, 
  className = '' 
}: AdvancedDeviceSelectorProps) {
  const [categories, setCategories] = useState<DeviceCategory[]>([]);
  const [devices, setDevices] = useState<DeviceModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [yearRange, setYearRange] = useState<{ min: number; max: number }>({ 
    min: 2016, 
    max: new Date().getFullYear() 
  });
  const [showPopular, setShowPopular] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Fetch categories and devices
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch categories with stats
        const categoriesResponse = await fetch('/api/categories?includeStats=true');
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData.categories || []);

        // Fetch devices
        const devicesResponse = await fetch('/api/devices?limit=100');
        const devicesData = await devicesResponse.json();
        setDevices(devicesData.devices || []);
      } catch (error) {
        console.error('Error fetching device data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter devices based on current filters
  const filteredDevices = useMemo(() => {
    let filtered = devices;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(device => 
        device.name.toLowerCase().includes(query) ||
        device.brand.toLowerCase().includes(query) ||
        device.category.toLowerCase().includes(query) ||
        device.commonIssues.some(issue => issue.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (selectedCategoryId) {
      filtered = filtered.filter(device => device.categoryId === selectedCategoryId);
    }

    // Brand filter
    if (selectedBrand) {
      filtered = filtered.filter(device => device.brand === selectedBrand);
    }

    // Year range filter
    filtered = filtered.filter(device => 
      device.year >= yearRange.min && device.year <= yearRange.max
    );

    // Popular devices filter
    if (showPopular) {
      const currentYear = new Date().getFullYear();
      filtered = filtered.filter(device => 
        device.year >= currentYear - 3 && 
        device.averageRepairCost <= 300
      );
    }

    // Sort by year (newest first) and then by name
    return filtered.sort((a, b) => {
      if (b.year !== a.year) {
        return b.year - a.year;
      }
      return a.name.localeCompare(b.name);
    });
  }, [devices, searchQuery, selectedCategoryId, selectedBrand, yearRange, showPopular]);

  // Get available brands for selected category
  const availableBrands = useMemo(() => {
    if (!selectedCategoryId) return [];
    const categoryDevices = devices.filter(device => device.categoryId === selectedCategoryId);
    return [...new Set(categoryDevices.map(device => device.brand))].sort();
  }, [devices, selectedCategoryId]);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedBrand(''); // Reset brand when category changes
  };

  const handleDeviceSelect = (device: DeviceModel) => {
    onDeviceSelect(device);
  };

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-muted-foreground">Loading devices...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Category Selection */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Select Device Category</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategoryId === category.id ? 'primary' : 'ghost'}
              className="h-auto p-4 flex-col"
              onClick={() => handleCategorySelect(category.id)}
            >
              <Icon name={category.icon} className="w-8 h-8 mb-2" />
              <span className="text-sm font-medium">{category.name}</span>
              {category.deviceCount && (
                <span className="text-xs text-muted-foreground">
                  {category.deviceCount} models
                </span>
              )}
            </Button>
          ))}
        </div>
      </Card>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <Input
              placeholder="Search devices, brands, or issues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Brand Filter */}
          {selectedCategoryId && (
            <Select
              value={selectedBrand}
              onChange={(value) => setSelectedBrand(value)}
              placeholder="All Brands"
              className="w-full lg:w-48"
            >
              <option value="">All Brands</option>
              {availableBrands.map((brand) => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </Select>
          )}

          {/* Year Range */}
          <div className="flex gap-2 items-center">
            <Input
              type="number"
              placeholder="Min Year"
              value={yearRange.min}
              onChange={(e) => setYearRange(prev => ({ 
                ...prev, 
                min: parseInt(e.target.value) || 2016 
              }))}
              className="w-24"
              min="2016"
              max={new Date().getFullYear()}
            />
            <span className="text-muted-foreground">-</span>
            <Input
              type="number"
              placeholder="Max Year"
              value={yearRange.max}
              onChange={(e) => setYearRange(prev => ({ 
                ...prev, 
                max: parseInt(e.target.value) || new Date().getFullYear() 
              }))}
              className="w-24"
              min="2016"
              max={new Date().getFullYear()}
            />
          </div>

          {/* Popular Toggle */}
          <Button
            variant={showPopular ? 'primary' : 'ghost'}
            onClick={() => setShowPopular(!showPopular)}
            className="whitespace-nowrap"
          >
            <Icon name="star" className="w-4 h-4 mr-2" />
            Popular
          </Button>

          {/* View Mode Toggle */}
          <div className="flex border rounded-lg overflow-hidden">
            <Button
              variant={viewMode === 'grid' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-none"
            >
              <Icon name="grid" className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-none"
            >
              <Icon name="list" className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Device Results */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">
            {filteredDevices.length} Device{filteredDevices.length !== 1 ? 's' : ''} Found
          </h3>
          {selectedCategoryId && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Icon name="filter" className="w-4 h-4 mr-1" />
              {categories.find(c => c.id === selectedCategoryId)?.name}
              {selectedBrand && ` • ${selectedBrand}`}
            </div>
          )}
        </div>

        {filteredDevices.length === 0 ? (
          <div className="text-center py-12">
            <Icon name="search" className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h4 className="text-lg font-medium mb-2">No devices found</h4>
            <p className="text-muted-foreground">
              Try adjusting your search criteria or filters
            </p>
          </div>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
              : 'space-y-3'
          }>
            {filteredDevices.map((device) => (
              <DeviceCard
                key={device.id}
                device={device}
                isSelected={selectedDeviceId === device.id}
                onClick={() => handleDeviceSelect(device)}
                viewMode={viewMode}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

interface DeviceCardProps {
  device: DeviceModel;
  isSelected: boolean;
  onClick: () => void;
  viewMode: 'grid' | 'list';
}

function DeviceCard({ device, isSelected, onClick, viewMode }: DeviceCardProps) {
  if (viewMode === 'list') {
    return (
      <Card 
        className={`p-4 cursor-pointer transition-all hover:shadow-md ${
          isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
        }`}
        onClick={onClick}
      >
        <div className="flex items-center gap-4">
          {device.imageUrl && (
            <img
              src={device.imageUrl}
              alt={device.name}
              className="w-16 h-16 object-cover rounded-lg"
            />
          )}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium truncate">{device.name}</h4>
            <p className="text-sm text-muted-foreground">
              {device.brand} • {device.year}
              {device.screenSize && ` • ${device.screenSize}"`}
            </p>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-sm font-medium text-primary">
                £{device.averageRepairCost}
              </span>
              <span className="text-xs text-muted-foreground">
                {device.commonIssues.slice(0, 2).join(', ')}
              </span>
            </div>
          </div>
          <Button
            variant={isSelected ? 'primary' : 'ghost'}
            size="sm"
          >
            {isSelected ? 'Selected' : 'Select'}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      className={`p-4 cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
      }`}
      onClick={onClick}
    >
      {device.imageUrl && (
        <img
          src={device.imageUrl}
          alt={device.name}
          className="w-full h-32 object-cover rounded-lg mb-3"
        />
      )}
      <div className="space-y-2">
        <h4 className="font-medium text-sm line-clamp-2">{device.name}</h4>
        <p className="text-xs text-muted-foreground">
          {device.brand} • {device.year}
        </p>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-primary">
            £{device.averageRepairCost}
          </span>
          {device.screenSize && (
            <span className="text-xs text-muted-foreground">
              {device.screenSize}"
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-1">
          {device.commonIssues.slice(0, 2).map((issue, index) => (
            <span
              key={index}
              className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded"
            >
              {issue}
            </span>
          ))}
        </div>
        <Button
          variant={isSelected ? 'primary' : 'ghost'}
          size="sm"
          className="w-full"
        >
          {isSelected ? 'Selected' : 'Select Device'}
        </Button>
      </div>
    </Card>
  );
}