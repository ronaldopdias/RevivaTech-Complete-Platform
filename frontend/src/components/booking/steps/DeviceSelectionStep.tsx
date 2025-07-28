import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { DeviceModel, DeviceCategory } from '@/lib/services/types';
import { 
  allCategories, 
  allDevices, 
  getDevicesByCategory,
  searchDevices,
  getPopularDevices 
} from '@/../config/devices';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export interface DeviceSelectionStepProps {
  selectedDevice?: DeviceModel;
  onDeviceSelect: (device: DeviceModel) => void;
  className?: string;
}

interface CategoryCardProps {
  category: DeviceCategory;
  isSelected: boolean;
  deviceCount: number;
  onClick: () => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ 
  category, 
  isSelected, 
  deviceCount, 
  onClick 
}) => {
  const categoryIcons: Record<string, string> = {
    macbook: '💻',
    imac: '🖥️',
    'mac-mini': '⬛',
    'mac-pro': '🏗️',
    iphone: '📱',
    ipad: '📟',
    laptop: '💻',
    desktop: '🖥️',
    gaming: '🎮',
    android: '🤖',
  };

  return (
    <Card
      variant="outlined"
      className={cn(
        'p-4 cursor-pointer transition-all hover:shadow-md',
        isSelected 
          ? 'border-primary bg-primary/5 shadow-sm' 
          : 'hover:border-primary/50'
      )}
      onClick={onClick}
    >
      <div className="text-center">
        <div className="text-3xl mb-2">
          {categoryIcons[category.id] || '🔧'}
        </div>
        <h3 className="font-semibold text-lg mb-1">{category.name}</h3>
        <p className="text-sm text-muted-foreground mb-2">
          {category.description}
        </p>
        <div className="text-xs text-muted-foreground">
          {deviceCount} models available
        </div>
        {category.popularModels && category.popularModels.length > 0 && (
          <div className="mt-2 text-xs text-muted-foreground">
            Popular: {category.popularModels.slice(0, 2).join(', ')}
          </div>
        )}
      </div>
    </Card>
  );
};

interface DeviceCardProps {
  device: DeviceModel;
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

  return (
    <Card
      variant="outlined"
      className={cn(
        'p-4 cursor-pointer transition-all hover:shadow-md relative',
        isSelected 
          ? 'border-primary bg-primary/5 shadow-sm ring-2 ring-primary/20' 
          : 'hover:border-primary/50'
      )}
      onClick={onClick}
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
        {/* Device image placeholder */}
        <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center">
          <span className="text-4xl">📱</span>
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
            </div>
          )}

          {/* Common issues preview */}
          {device.commonIssues.length > 0 && (
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
              <span className="text-sm font-medium">£{device.averageRepairCost}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export const DeviceSelectionStep: React.FC<DeviceSelectionStepProps> = ({
  selectedDevice,
  onDeviceSelect,
  className,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllDevices, setShowAllDevices] = useState(false);

  // Get popular devices for quick selection
  const popularDevices = useMemo(() => getPopularDevices(), []);

  // Filter devices based on category and search
  const filteredDevices = useMemo(() => {
    let devices = selectedCategory 
      ? getDevicesByCategory(selectedCategory)
      : (showAllDevices ? allDevices : popularDevices);

    if (searchQuery.trim()) {
      devices = searchDevices(searchQuery.trim());
    }

    return devices;
  }, [selectedCategory, searchQuery, showAllDevices, popularDevices]);

  // Get device count per category
  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    allCategories.forEach(category => {
      stats[category.id] = getDevicesByCategory(category.id).length;
    });
    return stats;
  }, []);

  const handleCategorySelect = (categoryId: string) => {
    if (selectedCategory === categoryId) {
      setSelectedCategory('');
    } else {
      setSelectedCategory(categoryId);
      setShowAllDevices(false);
      setSearchQuery('');
    }
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      setSelectedCategory('');
      setShowAllDevices(false);
    }
  };

  const handleShowAllDevices = () => {
    setShowAllDevices(true);
    setSelectedCategory('');
    setSearchQuery('');
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Select Your Device</h2>
        <p className="text-muted-foreground">
          Choose your device to get accurate repair pricing and recommendations
        </p>
      </div>

      {/* Search */}
      <div className="max-w-md mx-auto">
        <Input
          type="text"
          placeholder="Search for your device model..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Quick selection - Popular devices */}
      {!searchQuery && !selectedCategory && !showAllDevices && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Popular Devices</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShowAllDevices}
            >
              View All Devices
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {popularDevices.map((device) => (
              <DeviceCard
                key={device.id}
                device={device}
                isSelected={selectedDevice?.id === device.id}
                onClick={() => onDeviceSelect(device)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Category selection */}
      {!searchQuery && !showAllDevices && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-center">
            Or Browse by Category
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {allCategories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                isSelected={selectedCategory === category.id}
                deviceCount={categoryStats[category.id] || 0}
                onClick={() => handleCategorySelect(category.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Device grid */}
      {(selectedCategory || searchQuery || showAllDevices) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {searchQuery 
                ? `Search Results (${filteredDevices.length})`
                : selectedCategory 
                  ? `${allCategories.find(c => c.id === selectedCategory)?.name} Devices`
                  : `All Devices (${filteredDevices.length})`
              }
            </h3>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedCategory('');
                setSearchQuery('');
                setShowAllDevices(false);
              }}
            >
              ← Back to Categories
            </Button>
          </div>

          {filteredDevices.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="text-4xl mb-4">🔍</div>
              <h4 className="text-lg font-semibold mb-2">No devices found</h4>
              <p className="text-muted-foreground">
                Try adjusting your search or browse by category
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredDevices.map((device) => (
                <DeviceCard
                  key={device.id}
                  device={device}
                  isSelected={selectedDevice?.id === device.id}
                  onClick={() => onDeviceSelect(device)}
                  showSpecs={filteredDevices.length <= 12}
                />
              ))}
            </div>
          )}
        </div>
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
              onClick={() => onDeviceSelect(selectedDevice)}
            >
              Change
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default DeviceSelectionStep;