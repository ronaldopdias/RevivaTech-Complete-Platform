import React, { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { DeviceModel } from '@/lib/services/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { pricingEngine, RepairOptions, RepairType } from '@/../config/pricing/pricing.engine';

interface RepairOption {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  estimatedTime: string;
  priority: 'standard' | 'priority' | 'emergency';
  category: 'screen' | 'battery' | 'performance' | 'data' | 'physical' | 'other';
}

interface PriceCalculatorProps {
  device: DeviceModel;
  selectedIssues: string[];
  selectedRepairs: string[];
  urgency: 'standard' | 'priority' | 'emergency';
  onIssueToggle: (issue: string) => void;
  onRepairToggle: (repairId: string) => void;
  onUrgencyChange: (urgency: 'standard' | 'priority' | 'emergency') => void;
  onProceed: () => void;
  className?: string;
}

// Common repair options based on device category
const getRepairOptions = (device: DeviceModel): RepairOption[] => {
  const baseOptions: RepairOption[] = [];
  
  // Common repairs for all devices
  if (device.categoryId.includes('phone') || device.categoryId.includes('tablet') || device.categoryId === 'iphone' || device.categoryId === 'ipad') {
    baseOptions.push(
      {
        id: 'screen-replacement',
        name: 'Screen Replacement',
        description: 'Replace cracked or damaged screen',
        basePrice: device.averageRepairCost * 0.6,
        estimatedTime: '2-4 hours',
        priority: 'standard',
        category: 'screen',
      },
      {
        id: 'battery-replacement',
        name: 'Battery Replacement',
        description: 'Replace degraded battery',
        basePrice: device.averageRepairCost * 0.3,
        estimatedTime: '1-2 hours',
        priority: 'standard',
        category: 'battery',
      },
      {
        id: 'charging-port-repair',
        name: 'Charging Port Repair',
        description: 'Fix charging port issues',
        basePrice: device.averageRepairCost * 0.4,
        estimatedTime: '2-3 hours',
        priority: 'standard',
        category: 'physical',
      },
    );
  }

  if (device.categoryId.includes('laptop') || device.categoryId === 'macbook' || device.categoryId.includes('desktop')) {
    baseOptions.push(
      {
        id: 'keyboard-replacement',
        name: 'Keyboard Replacement',
        description: 'Replace faulty keyboard',
        basePrice: device.averageRepairCost * 0.4,
        estimatedTime: '2-4 hours',
        priority: 'standard',
        category: 'physical',
      },
      {
        id: 'memory-upgrade',
        name: 'Memory Upgrade',
        description: 'Upgrade RAM for better performance',
        basePrice: device.averageRepairCost * 0.5,
        estimatedTime: '1-2 hours',
        priority: 'standard',
        category: 'performance',
      },
      {
        id: 'storage-upgrade',
        name: 'Storage Upgrade',
        description: 'Upgrade to SSD or larger capacity',
        basePrice: device.averageRepairCost * 0.7,
        estimatedTime: '2-3 hours',
        priority: 'standard',
        category: 'performance',
      },
      {
        id: 'thermal-cleaning',
        name: 'Deep Cleaning & Thermal Paste',
        description: 'Clean internals and replace thermal paste',
        basePrice: device.averageRepairCost * 0.2,
        estimatedTime: '1-2 hours',
        priority: 'standard',
        category: 'performance',
      },
    );
  }

  if (device.categoryId.includes('gaming')) {
    baseOptions.push(
      {
        id: 'controller-repair',
        name: 'Controller Repair',
        description: 'Fix stick drift or button issues',
        basePrice: device.averageRepairCost * 0.3,
        estimatedTime: '1-2 hours',
        priority: 'standard',
        category: 'physical',
      },
      {
        id: 'hdmi-port-repair',
        name: 'HDMI Port Repair',
        description: 'Fix HDMI connectivity issues',
        basePrice: device.averageRepairCost * 0.4,
        estimatedTime: '2-3 hours',
        priority: 'standard',
        category: 'physical',
      },
    );
  }

  // Universal repairs
  baseOptions.push(
    {
      id: 'diagnostic',
      name: 'Diagnostic Service',
      description: 'Comprehensive hardware and software analysis',
      basePrice: 0, // Free diagnostic
      estimatedTime: '30-60 minutes',
      priority: 'standard',
      category: 'other',
    },
    {
      id: 'data-recovery',
      name: 'Data Recovery',
      description: 'Recover lost or corrupted data',
      basePrice: device.averageRepairCost * 0.8,
      estimatedTime: '4-24 hours',
      priority: 'priority',
      category: 'data',
    },
    {
      id: 'software-cleanup',
      name: 'Software Cleanup',
      description: 'Remove malware and optimize performance',
      basePrice: device.averageRepairCost * 0.25,
      estimatedTime: '1-3 hours',
      priority: 'standard',
      category: 'performance',
    },
  );

  return baseOptions;
};

const urgencyMultipliers = {
  standard: 1,
  priority: 1.5,
  emergency: 2,
};

const urgencyLabels = {
  standard: 'Standard (5-7 days)',
  priority: 'Priority (2-3 days)',
  emergency: 'Emergency (Same day)',
};

const categoryIcons = {
  screen: '📱',
  battery: '🔋',
  performance: '⚡',
  data: '💾',
  physical: '🔧',
  other: '🛠️',
};

export const PriceCalculator: React.FC<PriceCalculatorProps> = ({
  device,
  selectedIssues,
  selectedRepairs,
  urgency,
  onIssueToggle,
  onRepairToggle,
  onUrgencyChange,
  onProceed,
  className,
}) => {
  const repairOptions = useMemo(() => getRepairOptions(device), [device]);

  const { totalPrice, estimatedTime } = useMemo(() => {
    const selectedOptions = repairOptions.filter(option => 
      selectedRepairs.includes(option.id)
    );

    const baseTotal = selectedOptions.reduce((sum, option) => sum + option.basePrice, 0);
    const urgencyMultiplier = urgencyMultipliers[urgency];
    const total = Math.round(baseTotal * urgencyMultiplier);

    // Calculate estimated time (use the longest repair time)
    const maxHours = Math.max(...selectedOptions.map(option => {
      const match = option.estimatedTime.match(/(\d+)-?(\d+)?/);
      return match ? parseInt(match[2] || match[1]) : 1;
    }), 0);

    const timeEstimate = maxHours > 0 ? `${maxHours} hour${maxHours > 1 ? 's' : ''}` : '';

    return {
      totalPrice: total,
      estimatedTime: timeEstimate,
    };
  }, [repairOptions, selectedRepairs, urgency]);

  const groupedOptions = useMemo(() => {
    const groups: Record<string, RepairOption[]> = {};
    repairOptions.forEach(option => {
      if (!groups[option.category]) {
        groups[option.category] = [];
      }
      groups[option.category].push(option);
    });
    return groups;
  }, [repairOptions]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Device Summary */}
      <Card className="p-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-primary/10 rounded-md flex items-center justify-center text-xl">
            📱
          </div>
          <div>
            <h3 className="font-medium">{device.name}</h3>
            <p className="text-sm text-muted-foreground">
              {device.brand} • {device.year}
            </p>
          </div>
        </div>
      </Card>

      {/* Common Issues */}
      {device.commonIssues.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium">Common issues for this device:</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {device.commonIssues.map((issue, index) => (
              <button
                key={index}
                onClick={() => onIssueToggle(issue)}
                className={cn(
                  'p-3 text-left text-sm border rounded-md transition-colors',
                  selectedIssues.includes(issue)
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <span className="mr-2">
                  {selectedIssues.includes(issue) ? '✓' : '+'}
                </span>
                {issue}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Repair Options */}
      <div className="space-y-4">
        <h4 className="font-medium">Select repair services:</h4>
        
        {Object.entries(groupedOptions).map(([category, options]) => (
          <div key={category} className="space-y-2">
            <h5 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <span>{categoryIcons[category as keyof typeof categoryIcons]}</span>
              {category.charAt(0).toUpperCase() + category.slice(1)} Repairs
            </h5>
            
            <div className="grid gap-3">
              {options.map((option) => {
                const isSelected = selectedRepairs.includes(option.id);
                const price = Math.round(option.basePrice * urgencyMultipliers[urgency]);
                
                return (
                  <Card
                    key={option.id}
                    variant="outlined"
                    className={cn(
                      'p-4 cursor-pointer transition-all',
                      isSelected 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:border-primary/50'
                    )}
                    onClick={() => onRepairToggle(option.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn(
                            'w-4 h-4 rounded border flex items-center justify-center text-xs',
                            isSelected 
                              ? 'bg-primary border-primary text-primary-foreground' 
                              : 'border-border'
                          )}>
                            {isSelected && '✓'}
                          </span>
                          <h6 className="font-medium">{option.name}</h6>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {option.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>⏱️ {option.estimatedTime}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {price === 0 ? 'FREE' : `£${price}`}
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

      {/* Urgency Selection */}
      <div className="space-y-3">
        <h4 className="font-medium">Service urgency:</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Object.entries(urgencyLabels).map(([key, label]) => {
            const isSelected = urgency === key;
            const multiplier = urgencyMultipliers[key as keyof typeof urgencyMultipliers];
            
            return (
              <Card
                key={key}
                variant="outlined"
                className={cn(
                  'p-4 cursor-pointer transition-all text-center',
                  isSelected 
                    ? 'border-primary bg-primary/5' 
                    : 'hover:border-primary/50'
                )}
                onClick={() => onUrgencyChange(key as typeof urgency)}
              >
                <div className="space-y-2">
                  <div className={cn(
                    'w-4 h-4 rounded-full border mx-auto',
                    isSelected 
                      ? 'bg-primary border-primary' 
                      : 'border-border'
                  )}></div>
                  <div className="text-sm font-medium">{label}</div>
                  {multiplier > 1 && (
                    <div className="text-xs text-muted-foreground">
                      +{Math.round((multiplier - 1) * 100)}% surcharge
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Price Summary */}
      <Card className="p-4 bg-muted/50">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-medium">Total Estimate:</span>
            <span className="text-2xl font-bold text-primary">
              {totalPrice === 0 ? 'FREE' : `£${totalPrice}`}
            </span>
          </div>
          
          {estimatedTime && (
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>Estimated completion:</span>
              <span>{estimatedTime}</span>
            </div>
          )}
          
          <div className="text-xs text-muted-foreground pt-2 border-t">
            • Prices include parts and labor
            • 90-day warranty on all repairs
            • Free diagnostic if you proceed with repair
          </div>
          
          <Button 
            onClick={onProceed}
            disabled={selectedRepairs.length === 0}
            className="w-full"
            size="lg"
          >
            {selectedRepairs.length === 0 
              ? 'Select repair services to continue' 
              : `Book Repair - £${totalPrice}`
            }
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default PriceCalculator;