import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { DeviceModel } from '@/lib/services/types';
import { allCategories, allDevices, getDevicesByCategory, searchDevices } from '@/../config/devices';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface DeviceSelectorV2Props {
  onSelect: (category: string) => void;
  className?: string;
}

// Enhanced icon mapping for device categories
const categoryIcons: Record<string, string> = {
  laptop: '💻',
  desktop: '🖥️',
  smartphone: '📱',
  tablet: '📱',
  cpu: '🔧',
  'laptop-pc': '💻',
  'desktop-pc': '🖥️',
  'gaming-laptop': '🎮',
  ultrabook: '💻',
  macbook: '💻',
  imac: '🖥️',
  'mac-mini': '🔧',
  'mac-pro': '🔧',
  iphone: '📱',
  ipad: '📱',
  gaming: '🎮',
  console: '🎮',
  android: '📱',
  pc: '💻',
};

// Brand colors for visual distinction
const brandColors: Record<string, string> = {
  Apple: 'from-gray-100 to-gray-200 border-gray-300',
  Microsoft: 'from-blue-50 to-blue-100 border-blue-200',
  Samsung: 'from-blue-50 to-slate-100 border-slate-200',
  Google: 'from-red-50 to-yellow-50 border-yellow-200',
  Sony: 'from-gray-50 to-gray-100 border-gray-200',
  Nintendo: 'from-red-50 to-red-100 border-red-200',
  HP: 'from-blue-50 to-blue-100 border-blue-200',
  Dell: 'from-slate-50 to-slate-100 border-slate-200',
  Lenovo: 'from-red-50 to-gray-100 border-gray-200',
  ASUS: 'from-orange-50 to-orange-100 border-orange-200',
};

export const DeviceSelectorV2: React.FC<DeviceSelectorV2Props> = ({
  onSelect,
  className,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return allCategories;
    
    return allCategories.filter(category =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.brands.some(brand => 
        brand.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [searchQuery]);

  // Get unique brands from all categories
  const availableBrands = useMemo(() => {
    const brands = new Set<string>();
    allCategories.forEach(category => {
      category.brands.forEach(brand => brands.add(brand));
    });
    return Array.from(brands).sort();
  }, []);

  // Filter categories by selected brand
  const brandFilteredCategories = useMemo(() => {
    if (!selectedBrand) return filteredCategories;
    
    return filteredCategories.filter(category =>
      category.brands.includes(selectedBrand)
    );
  }, [filteredCategories, selectedBrand]);

  // Get device count per category
  const getCategoryDeviceCount = (categoryId: string) => {
    return getDevicesByCategory(categoryId).length;
  };

  // Get popular models for category preview
  const getCategoryPreview = (categoryId: string) => {
    const devices = getDevicesByCategory(categoryId);
    return devices
      .filter(device => device.year >= new Date().getFullYear() - 2)
      .slice(0, 3)
      .map(device => device.name);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Search and Filter Header */}
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">What device needs repair?</h2>
          <p className="text-muted-foreground">
            Select your device category to get started with pricing
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-md mx-auto">
          <Input
            type="text"
            placeholder="Search for your device..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Brand Filter */}
        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() => setSelectedBrand('')}
            className={cn(
              'px-3 py-1 text-sm rounded-full border transition-all',
              !selectedBrand
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background border-border hover:border-primary/50'
            )}
          >
            All Brands
          </button>
          {availableBrands.map(brand => (
            <button
              key={brand}
              onClick={() => setSelectedBrand(selectedBrand === brand ? '' : brand)}
              className={cn(
                'px-3 py-1 text-sm rounded-full border transition-all',
                selectedBrand === brand
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background border-border hover:border-primary/50'
              )}
            >
              {brand}
            </button>
          ))}
        </div>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {brandFilteredCategories.map((category) => {
          const deviceCount = getCategoryDeviceCount(category.id);
          const preview = getCategoryPreview(category.id);
          const primaryBrand = category.brands[0];
          const brandGradient = brandColors[primaryBrand] || 'from-gray-50 to-gray-100 border-gray-200';

          return (
            <Card
              key={category.id}
              className={cn(
                'p-6 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] border-2',
                `bg-gradient-to-br ${brandGradient}`
              )}
              onClick={() => onSelect(category.id)}
            >
              <div className="space-y-3">
                {/* Category Icon and Title */}
                <div className="flex items-center gap-3">
                  <div className="text-3xl">
                    {categoryIcons[category.id] || '📱'}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {deviceCount} models available
                    </p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground">
                  {category.description}
                </p>

                {/* Brands */}
                <div className="flex flex-wrap gap-1">
                  {category.brands.map(brand => (
                    <span
                      key={brand}
                      className="text-xs px-2 py-1 bg-white/70 rounded-full border"
                    >
                      {brand}
                    </span>
                  ))}
                </div>

                {/* Popular Models Preview */}
                {preview.length > 0 && (
                  <div className="border-t pt-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Popular models:
                    </p>
                    <div className="space-y-1">
                      {preview.map((model, index) => (
                        <p key={index} className="text-xs text-muted-foreground truncate">
                          • {model.length > 30 ? model.substring(0, 30) + '...' : model}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Call to Action */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm font-medium text-primary">
                    Select this category
                  </span>
                  <span className="text-primary">→</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* No Results Message */}
      {brandFilteredCategories.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold mb-2">No devices found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search or filter criteria
          </p>
          <Button
            variant="ghost"
            onClick={() => {
              setSearchQuery('');
              setSelectedBrand('');
            }}
          >
            Clear filters
          </Button>
        </div>
      )}

      {/* Quick Stats */}
      <div className="border-t pt-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary">{allCategories.length}</div>
            <div className="text-sm text-muted-foreground">Device Categories</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">{allDevices.length}</div>
            <div className="text-sm text-muted-foreground">Device Models</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">{availableBrands.length}</div>
            <div className="text-sm text-muted-foreground">Supported Brands</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">2016-2025</div>
            <div className="text-sm text-muted-foreground">Model Years</div>
          </div>
        </div>
      </div>

      {/* Help Text */}
      <div className="text-center text-sm text-muted-foreground">
        <p>Can't find your device? <span className="text-primary cursor-pointer hover:underline">Contact us</span> for custom repair quotes</p>
      </div>
    </div>
  );
};

export default DeviceSelectorV2;