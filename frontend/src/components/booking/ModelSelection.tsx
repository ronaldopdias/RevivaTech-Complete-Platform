import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { DeviceModel } from '@/lib/services/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface ModelSelectionProps {
  models: DeviceModel[];
  selectedModel?: string;
  onModelSelect: (modelId: string, model: DeviceModel) => void;
  onBack?: () => void;
  loading?: boolean;
  error?: string;
  className?: string;
}

// Icon mapping for device categories
const categoryIcons: Record<string, string> = {
  laptop: '💻',
  desktop: '🖥️',
  smartphone: '📱',
  tablet: '📱',
  cpu: '🔧',
  gamepad: '🎮',
  'laptop-pc': '💻',
  'desktop-pc': '🖥️',
  'gaming-laptop': '🎮',
  'gaming-console': '🎮',
  'handheld-gaming': '🎮',
  ultrabook: '💻',
  macbook: '💻',
  imac: '🖥️',
  'mac-mini': '🔧',
  'mac-pro': '🔧',
  iphone: '📱',
  ipad: '📱',
  'android-phone': '📱',
  'android-tablet': '📱',
};

export const ModelSelection: React.FC<ModelSelectionProps> = ({
  models,
  selectedModel,
  onModelSelect,
  onBack,
  loading = false,
  error,
  className,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'year' | 'cost'>('name');

  // Filter models based on search
  const filteredModels = models.filter(model =>
    model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    model.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
    model.year.toString().includes(searchQuery)
  );

  // Sort models
  const sortedModels = [...filteredModels].sort((a, b) => {
    switch (sortBy) {
      case 'year':
        return b.year - a.year; // Newest first
      case 'cost':
        return a.averageRepairCost - b.averageRepairCost; // Cheapest first
      case 'name':
      default:
        return a.name.localeCompare(b.name); // Alphabetical
    }
  });

  const handleModelSelect = (model: DeviceModel) => {
    onModelSelect(model.id, model);
  };

  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 bg-muted rounded w-48 animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-64 animate-pulse"></div>
          </div>
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              ← Back
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="flex space-x-4">
                <div className="w-16 h-16 bg-muted rounded-md"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                  <div className="h-3 bg-muted rounded w-full"></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('text-center py-8 space-y-4', className)}>
        <p className="text-destructive">{error}</p>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            ← Back to Categories
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold mb-2">Choose your specific model</h3>
          <p className="text-muted-foreground">
            Find your exact device model for accurate repair pricing
          </p>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            ← Back
          </Button>
        )}
      </div>

      {/* Search and Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by model name, brand, or year..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="sm:w-48">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
          >
            <option value="name">Sort by Name</option>
            <option value="year">Sort by Year</option>
            <option value="cost">Sort by Repair Cost</option>
          </select>
        </div>
      </div>

      {/* Results Info */}
      {searchQuery && (
        <div className="text-sm text-muted-foreground">
          {filteredModels.length > 0 
            ? `Found ${filteredModels.length} model${filteredModels.length === 1 ? '' : 's'} matching "${searchQuery}"`
            : `No models found matching "${searchQuery}"`
          }
        </div>
      )}

      {/* Model Grid */}
      {sortedModels.length === 0 ? (
        <div className="text-center py-12 space-y-4">
          <div className="text-4xl mb-4">🔍</div>
          <h4 className="text-lg font-medium">
            {searchQuery ? 'No models found' : 'No models available'}
          </h4>
          <p className="text-muted-foreground max-w-md mx-auto">
            {searchQuery 
              ? 'Try adjusting your search terms or check the spelling'
              : 'No device models are available for this category'
            }
          </p>
          {searchQuery && (
            <Button 
              variant="outline" 
              onClick={() => setSearchQuery('')}
              className="mt-4"
            >
              Clear Search
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedModels.map((model) => (
            <Card
              key={model.id}
              variant="outlined"
              className={cn(
                'p-4 cursor-pointer transition-all hover:shadow-md hover:border-primary/50',
                selectedModel === model.id ? 'border-primary bg-primary/5' : ''
              )}
              onClick={() => handleModelSelect(model)}
            >
              <div className="flex space-x-4">
                {/* Device Image/Icon */}
                <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center text-2xl flex-shrink-0">
                  {categoryIcons[model.categoryId] || '📱'}
                </div>

                {/* Device Info */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div>
                    <h4 className="font-medium text-sm leading-tight">{model.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {model.brand} • {model.year}
                    </p>
                  </div>

                  {/* Key Specs */}
                  <div className="text-xs text-muted-foreground space-y-1">
                    {model.specifications.screen && (
                      <div className="truncate">
                        📺 {model.specifications.screen.size}
                        {model.specifications.screen.resolution && 
                          ` • ${model.specifications.screen.resolution}`
                        }
                      </div>
                    )}
                    {model.specifications.processor && (
                      <div className="truncate">
                        ⚙️ {model.specifications.processor}
                      </div>
                    )}
                    {model.specifications.memory && (
                      <div className="truncate">
                        🧠 {model.specifications.memory}
                      </div>
                    )}
                  </div>

                  {/* Repair Cost */}
                  <div className="flex items-center justify-between">
                    <div className="text-xs">
                      <span className="text-muted-foreground">Avg repair: </span>
                      <span className="font-medium text-primary">
                        £{model.averageRepairCost}
                      </span>
                    </div>
                    {selectedModel === model.id && (
                      <div className="text-primary text-xs font-medium">
                        ✓ Selected
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Common Issues */}
              {model.commonIssues.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Common issues:</p>
                  <div className="flex flex-wrap gap-1">
                    {model.commonIssues.slice(0, 3).map((issue, index) => (
                      <span
                        key={index}
                        className="text-xs bg-muted px-2 py-1 rounded-full"
                      >
                        {issue}
                      </span>
                    ))}
                    {model.commonIssues.length > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{model.commonIssues.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Load More Button (if needed for pagination) */}
      {sortedModels.length > 0 && sortedModels.length >= 50 && (
        <div className="text-center">
          <Button variant="outline">
            Load More Models
          </Button>
        </div>
      )}
    </div>
  );
};

export default ModelSelection;