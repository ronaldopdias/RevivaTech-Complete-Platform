import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { DeviceModel } from '@/lib/services/types';
import { getDevicesByCategory, getDevicesByYear } from '@/../config/devices';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface ModelSelectionV2Props {
  category: string;
  onSelect: (device: DeviceModel) => void;
  onBack?: () => void;
  className?: string;
}

// Device condition indicators
const getDeviceCondition = (year: number) => {
  const currentYear = new Date().getFullYear();
  const age = currentYear - year;
  
  if (age <= 1) return { label: 'Latest', color: 'text-green-600', bg: 'bg-green-50' };
  if (age <= 3) return { label: 'Current', color: 'text-blue-600', bg: 'bg-blue-50' };
  if (age <= 5) return { label: 'Recent', color: 'text-orange-600', bg: 'bg-orange-50' };
  return { label: 'Legacy', color: 'text-gray-600', bg: 'bg-gray-50' };
};

// Repair difficulty indicators
const getRepairDifficulty = (device: DeviceModel) => {
  const avgCost = device.averageRepairCost;
  
  if (avgCost <= 150) return { label: 'Easy', color: 'text-green-600', icon: '🟢' };
  if (avgCost <= 300) return { label: 'Medium', color: 'text-yellow-600', icon: '🟡' };
  if (avgCost <= 500) return { label: 'Hard', color: 'text-orange-600', icon: '🟠' };
  return { label: 'Expert', color: 'text-red-600', icon: '🔴' };
};

export const ModelSelectionV2: React.FC<ModelSelectionV2Props> = ({
  category,
  onSelect,
  onBack,
  className,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'year' | 'cost'>('year');

  // Get devices for the selected category
  const categoryDevices = useMemo(() => {
    return getDevicesByCategory(category);
  }, [category]);

  // Get available years for filtering
  const availableYears = useMemo(() => {
    const years = [...new Set(categoryDevices.map(device => device.year))];
    return years.sort((a, b) => b - a); // Latest first
  }, [categoryDevices]);

  // Filter and sort devices
  const filteredDevices = useMemo(() => {
    let filtered = categoryDevices;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(device =>
        device.name.toLowerCase().includes(query) ||
        device.brand.toLowerCase().includes(query) ||
        device.commonIssues.some(issue => issue.toLowerCase().includes(query))
      );
    }

    // Filter by year
    if (selectedYear) {
      filtered = filtered.filter(device => device.year === selectedYear);
    }

    // Sort devices
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'year':
          return b.year - a.year; // Latest first
        case 'cost':
          return a.averageRepairCost - b.averageRepairCost; // Cheapest first
        default:
          return 0;
      }
    });

    return filtered;
  }, [categoryDevices, searchQuery, selectedYear, sortBy]);

  // Group devices by brand for better organization
  const devicesByBrand = useMemo(() => {
    const grouped: Record<string, DeviceModel[]> = {};
    filteredDevices.forEach(device => {
      if (!grouped[device.brand]) {
        grouped[device.brand] = [];
      }
      grouped[device.brand].push(device);
    });
    return grouped;
  }, [filteredDevices]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Select Your Model</h2>
          <p className="text-muted-foreground">
            Choose the specific model that needs repair
          </p>
        </div>
        {onBack && (
          <Button variant="ghost" onClick={onBack}>
            ← Back to Categories
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div>
          <label className="text-sm font-medium mb-2 block">Search Models</label>
          <Input
            type="text"
            placeholder="Search by name or issue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Year Filter */}
        <div>
          <label className="text-sm font-medium mb-2 block">Filter by Year</label>
          <select
            value={selectedYear || ''}
            onChange={(e) => setSelectedYear(e.target.value ? parseInt(e.target.value) : null)}
            className="w-full p-2 border rounded-md"
          >
            <option value="">All Years</option>
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div>
          <label className="text-sm font-medium mb-2 block">Sort by</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'year' | 'cost')}
            className="w-full p-2 border rounded-md"
          >
            <option value="year">Release Year</option>
            <option value="name">Name</option>
            <option value="cost">Repair Cost</option>
          </select>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground border-b pb-4">
        <span>
          Showing {filteredDevices.length} of {categoryDevices.length} models
        </span>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <span>🟢 Easy</span>
            <span>🟡 Medium</span>
            <span>🟠 Hard</span>
            <span>🔴 Expert</span>
          </div>
        </div>
      </div>

      {/* Device Grid - Grouped by Brand */}
      <div className="space-y-8">
        {Object.entries(devicesByBrand).map(([brand, devices]) => (
          <div key={brand} className="space-y-4">
            {/* Brand Header */}
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold">{brand}</h3>
              <span className="text-sm text-muted-foreground">
                {devices.length} model{devices.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Brand Devices Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {devices.map((device) => {
                const condition = getDeviceCondition(device.year);
                const difficulty = getRepairDifficulty(device);

                return (
                  <Card
                    key={device.id}
                    className="p-4 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] border-2 hover:border-primary/50"
                    onClick={() => onSelect(device)}
                  >
                    <div className="space-y-3">
                      {/* Device Image Placeholder */}
                      <div className="aspect-[16/10] bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center border">
                        {device.imageUrl ? (
                          <img
                            src={device.imageUrl}
                            alt={device.name}
                            className="w-full h-full object-cover rounded-lg"
                            onError={(e) => {
                              // Fallback to emoji on image error
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.parentElement!.innerHTML = '<div class="text-4xl">📱</div>';
                            }}
                          />
                        ) : (
                          <div className="text-4xl">📱</div>
                        )}
                      </div>

                      {/* Device Info */}
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h4 className="font-semibold text-sm leading-tight">
                            {device.name}
                          </h4>
                          <div className="flex gap-1">
                            <span className={cn('text-xs px-2 py-1 rounded-full', condition.bg, condition.color)}>
                              {condition.label}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{device.year}</span>
                          <div className="flex items-center gap-1">
                            <span>{difficulty.icon}</span>
                            <span className={difficulty.color}>{difficulty.label}</span>
                          </div>
                        </div>

                        {/* Specifications Preview */}
                        {device.specifications && (
                          <div className="text-xs text-muted-foreground space-y-1">
                            {device.specifications.screen && (
                              <div className="truncate">
                                📺 {device.specifications.screen.size} {device.specifications.screen.type}
                              </div>
                            )}
                            {device.specifications.processor && (
                              <div className="truncate">
                                ⚡ {device.specifications.processor.length > 25 
                                  ? device.specifications.processor.substring(0, 25) + '...'
                                  : device.specifications.processor
                                }
                              </div>
                            )}
                          </div>
                        )}

                        {/* Common Issues */}
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">Common issues:</p>
                          <div className="flex flex-wrap gap-1">
                            {device.commonIssues.slice(0, 2).map((issue, index) => (
                              <span
                                key={index}
                                className="text-xs px-2 py-1 bg-muted/50 rounded text-muted-foreground"
                              >
                                {issue.length > 15 ? issue.substring(0, 15) + '...' : issue}
                              </span>
                            ))}
                            {device.commonIssues.length > 2 && (
                              <span className="text-xs px-2 py-1 bg-muted/50 rounded text-muted-foreground">
                                +{device.commonIssues.length - 2} more
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Pricing */}
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="text-sm font-medium">
                            Avg. repair: £{device.averageRepairCost}
                          </span>
                          <span className="text-primary text-sm font-medium">
                            Select →
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* No Results */}
      {filteredDevices.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold mb-2">No models found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search or filter criteria
          </p>
          <Button
            variant="ghost"
            onClick={() => {
              setSearchQuery('');
              setSelectedYear(null);
            }}
          >
            Clear filters
          </Button>
        </div>
      )}

      {/* Help Section */}
      <div className="border-t pt-6 text-center">
        <p className="text-sm text-muted-foreground mb-4">
          Don't see your exact model? No problem! Our technicians can work with similar models.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="font-medium mb-1">📋 Free Diagnosis</div>
            <div className="text-muted-foreground">We'll identify your exact model when you bring it in</div>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="font-medium mb-1">🛡️ Same Warranty</div>
            <div className="text-muted-foreground">All repairs covered by our 90-day warranty</div>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="font-medium mb-1">💰 Price Match</div>
            <div className="text-muted-foreground">Similar models have similar repair costs</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelSelectionV2;