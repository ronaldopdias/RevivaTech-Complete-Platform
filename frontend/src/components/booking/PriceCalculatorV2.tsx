import React, { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { DeviceModel } from '@/lib/services/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { 
  pricingEngine, 
  RepairOptions, 
  RepairType, 
  PriceEstimate 
} from '@/../config/pricing/pricing.engine';

interface PriceCalculatorV2Props {
  device: DeviceModel;
  selectedIssues: string[];
  onIssueToggle: (issue: string) => void;
  onProceed: (estimates: EstimateWithRepair[]) => void;
  className?: string;
}

interface EstimateWithRepair {
  repair: RepairType;
  estimate: PriceEstimate;
  selected: boolean;
}

interface RepairOptionsState {
  express: boolean;
  premiumParts: boolean;
  dataRecovery: boolean;
  warranty: 'standard' | 'extended' | 'premium';
  pickupDelivery: boolean;
}

const categoryIcons: Record<string, string> = {
  display: '📱',
  power: '🔋',
  input: '⌨️',
  motherboard: '🔧',
  ports: '🔌',
  data: '💾',
  software: '💻',
};

const categoryNames: Record<string, string> = {
  display: 'Screen & Display',
  power: 'Battery & Power',
  input: 'Keyboard & Input',
  motherboard: 'Logic Board',
  ports: 'Ports & Connectivity',
  data: 'Data Recovery',
  software: 'Software Services',
};

const complexityColors: Record<string, string> = {
  simple: 'text-green-600',
  moderate: 'text-blue-600',
  complex: 'text-orange-600',
  expert: 'text-red-600',
};

const complexityLabels: Record<string, string> = {
  simple: 'Simple',
  moderate: 'Standard',
  complex: 'Complex',
  expert: 'Expert Level',
};

export const PriceCalculatorV2: React.FC<PriceCalculatorV2Props> = ({
  device,
  selectedIssues,
  onIssueToggle,
  onProceed,
  className,
}) => {
  const [selectedRepairs, setSelectedRepairs] = useState<string[]>([]);
  const [repairOptions, setRepairOptions] = useState<RepairOptionsState>({
    express: false,
    premiumParts: false,
    dataRecovery: false,
    warranty: 'standard',
    pickupDelivery: false,
  });

  // Get available and recommended repairs
  const { availableRepairs, recommendedRepairs } = useMemo(() => {
    const available = pricingEngine.getAvailableRepairs(device);
    const recommended = pricingEngine.getRecommendedRepairs(device);
    return { availableRepairs: available, recommendedRepairs: recommended };
  }, [device]);

  // Calculate estimates for selected repairs
  const estimates = useMemo(() => {
    const options: RepairOptions = {
      express: repairOptions.express,
      premiumParts: repairOptions.premiumParts,
      dataRecovery: repairOptions.dataRecovery,
      warranty: repairOptions.warranty,
      pickupDelivery: repairOptions.pickupDelivery,
    };

    return selectedRepairs.map(repairId => {
      const repair = availableRepairs.find(r => r.id === repairId);
      if (!repair) return null;

      const estimate = pricingEngine.calculatePrice(device, repairId, options);
      
      return {
        repair,
        estimate,
        selected: true,
      };
    }).filter(Boolean) as EstimateWithRepair[];
  }, [selectedRepairs, repairOptions, device, availableRepairs]);

  // Group repairs by category
  const groupedRepairs = useMemo(() => {
    const groups: Record<string, RepairType[]> = {};
    availableRepairs.forEach(repair => {
      if (!groups[repair.category]) {
        groups[repair.category] = [];
      }
      groups[repair.category].push(repair);
    });
    return groups;
  }, [availableRepairs]);

  // Calculate totals
  const totals = useMemo(() => {
    const total = estimates.reduce((sum, est) => sum + est.estimate.total, 0);
    const maxWarranty = Math.max(...estimates.map(est => est.estimate.warranty), 0);
    const estimatedDays = estimates.length > 0 ? (repairOptions.express ? '1 day' : '2-3 days') : '';

    return {
      total,
      warranty: maxWarranty,
      estimatedTime: estimatedDays,
    };
  }, [estimates, repairOptions.express]);

  const handleRepairToggle = (repairId: string) => {
    setSelectedRepairs(prev => 
      prev.includes(repairId) 
        ? prev.filter(id => id !== repairId)
        : [...prev, repairId]
    );
  };

  const handleOptionChange = (key: keyof RepairOptionsState, value: boolean | string) => {
    setRepairOptions(prev => ({ ...prev, [key]: value }));
  };

  const handleProceed = () => {
    if (estimates.length > 0) {
      onProceed(estimates);
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Device Summary */}
      <Card className="p-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-xl">
            📱
          </div>
          <div>
            <h3 className="font-semibold text-lg">{device.name}</h3>
            <p className="text-sm text-muted-foreground">
              {device.brand} • {device.year} • Avg. repair cost: £{device.averageRepairCost}
            </p>
          </div>
        </div>
      </Card>

      {/* Common Issues */}
      {device.commonIssues.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-base">Common issues for this device:</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {device.commonIssues.map((issue, index) => (
              <button
                key={index}
                onClick={() => onIssueToggle(issue)}
                className={cn(
                  'p-3 text-left text-sm border rounded-lg transition-all hover:shadow-sm',
                  selectedIssues.includes(issue)
                    ? 'border-primary bg-primary/5 text-primary shadow-sm'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <span className="mr-2 font-medium">
                  {selectedIssues.includes(issue) ? '✓' : '+'}
                </span>
                {issue}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Repairs */}
      {recommendedRepairs.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-base flex items-center gap-2">
            <span>⭐</span>
            Recommended repairs based on common issues:
          </h4>
          <div className="grid gap-3">
            {recommendedRepairs.map((repair) => {
              const isSelected = selectedRepairs.includes(repair.id);
              const estimate = isSelected 
                ? pricingEngine.calculatePrice(device, repair.id, repairOptions)
                : null;
              
              return (
                <Card
                  key={repair.id}
                  variant="outlined"
                  className={cn(
                    'p-4 cursor-pointer transition-all border-2',
                    isSelected 
                      ? 'border-primary bg-primary/5 shadow-sm' 
                      : 'border-amber-200 bg-amber-50 hover:border-primary/50'
                  )}
                  onClick={() => handleRepairToggle(repair.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          'w-5 h-5 rounded border-2 flex items-center justify-center text-xs font-bold',
                          isSelected 
                            ? 'bg-primary border-primary text-primary-foreground' 
                            : 'border-amber-300'
                        )}>
                          {isSelected && '✓'}
                        </span>
                        <h6 className="font-semibold">{repair.name}</h6>
                        <span className={cn(
                          'text-xs px-2 py-1 rounded-full font-medium',
                          complexityColors[repair.complexity]
                        )}>
                          {complexityLabels[repair.complexity]}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {repair.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>⏱️ {repair.laborHours}h labor</span>
                        <span>🛡️ {repair.warranty} days warranty</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg text-primary">
                        £{estimate?.total || `${repair.basePriceRange.min}-${repair.basePriceRange.max}`}
                      </div>
                      {estimate && (
                        <div className="text-xs text-muted-foreground">
                          {estimate.estimatedTime}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* All Available Repairs */}
      <div className="space-y-4">
        <h4 className="font-medium text-base">All available repair services:</h4>
        
        {Object.entries(groupedRepairs).map(([category, repairs]) => (
          <div key={category} className="space-y-3">
            <h5 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <span>{categoryIcons[category] || '🔧'}</span>
              {categoryNames[category] || category.charAt(0).toUpperCase() + category.slice(1)}
            </h5>
            
            <div className="grid gap-3">
              {repairs.map((repair) => {
                const isSelected = selectedRepairs.includes(repair.id);
                const isRecommended = recommendedRepairs.some(r => r.id === repair.id);
                const estimate = isSelected 
                  ? pricingEngine.calculatePrice(device, repair.id, repairOptions)
                  : null;
                
                if (isRecommended) return null; // Skip recommended repairs here
                
                return (
                  <Card
                    key={repair.id}
                    variant="outlined"
                    className={cn(
                      'p-4 cursor-pointer transition-all',
                      isSelected 
                        ? 'border-primary bg-primary/5 shadow-sm' 
                        : 'hover:border-primary/50 hover:shadow-sm'
                    )}
                    onClick={() => handleRepairToggle(repair.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn(
                            'w-5 h-5 rounded border-2 flex items-center justify-center text-xs font-bold',
                            isSelected 
                              ? 'bg-primary border-primary text-primary-foreground' 
                              : 'border-border'
                          )}>
                            {isSelected && '✓'}
                          </span>
                          <h6 className="font-medium">{repair.name}</h6>
                          <span className={cn(
                            'text-xs px-2 py-1 rounded-full font-medium',
                            complexityColors[repair.complexity]
                          )}>
                            {complexityLabels[repair.complexity]}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {repair.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>⏱️ {repair.laborHours}h labor</span>
                          <span>🛡️ {repair.warranty} days warranty</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-lg">
                          £{estimate?.total || `${repair.basePriceRange.min}-${repair.basePriceRange.max}`}
                        </div>
                        {estimate && (
                          <div className="text-xs text-muted-foreground">
                            {estimate.estimatedTime}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Service Options */}
      {selectedRepairs.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-base">Service options:</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Express Service */}
            <Card className="p-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={repairOptions.express}
                  onChange={(e) => handleOptionChange('express', e.target.checked)}
                  className="w-4 h-4 text-primary"
                />
                <div className="flex-1">
                  <div className="font-medium">Express Service</div>
                  <div className="text-sm text-muted-foreground">Same-day completion (+50%)</div>
                </div>
              </label>
            </Card>

            {/* Premium Parts */}
            <Card className="p-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={repairOptions.premiumParts}
                  onChange={(e) => handleOptionChange('premiumParts', e.target.checked)}
                  className="w-4 h-4 text-primary"
                />
                <div className="flex-1">
                  <div className="font-medium">Premium Parts</div>
                  <div className="text-sm text-muted-foreground">Genuine OEM parts (+25%)</div>
                </div>
              </label>
            </Card>

            {/* Data Recovery */}
            <Card className="p-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={repairOptions.dataRecovery}
                  onChange={(e) => handleOptionChange('dataRecovery', e.target.checked)}
                  className="w-4 h-4 text-primary"
                />
                <div className="flex-1">
                  <div className="font-medium">Data Recovery</div>
                  <div className="text-sm text-muted-foreground">Backup existing data (+£80)</div>
                </div>
              </label>
            </Card>

            {/* Pickup & Delivery */}
            <Card className="p-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={repairOptions.pickupDelivery}
                  onChange={(e) => handleOptionChange('pickupDelivery', e.target.checked)}
                  className="w-4 h-4 text-primary"
                />
                <div className="flex-1">
                  <div className="font-medium">Pickup & Delivery</div>
                  <div className="text-sm text-muted-foreground">Door-to-door service (+£25)</div>
                </div>
              </label>
            </Card>
          </div>

          {/* Warranty Options */}
          <Card className="p-4">
            <h5 className="font-medium mb-3">Warranty options:</h5>
            <div className="space-y-2">
              {[
                { key: 'standard', label: 'Standard Warranty', desc: 'Included with repair' },
                { key: 'extended', label: 'Extended Warranty', desc: '50% longer coverage (+£30)' },
                { key: 'premium', label: 'Premium Warranty', desc: 'Double coverage period (+£60)' },
              ].map(option => (
                <label key={option.key} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="warranty"
                    value={option.key}
                    checked={repairOptions.warranty === option.key}
                    onChange={(e) => handleOptionChange('warranty', e.target.value)}
                    className="w-4 h-4 text-primary"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{option.label}</div>
                    <div className="text-sm text-muted-foreground">{option.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Price Summary */}
      {selectedRepairs.length > 0 && (
        <Card className="p-6 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <div className="space-y-4">
            {/* Individual repair breakdown */}
            {estimates.map((est, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span>{est.repair.name}</span>
                <span className="font-medium">£{est.estimate.total}</span>
              </div>
            ))}
            
            <hr className="border-primary/20" />
            
            <div className="flex justify-between items-center">
              <span className="font-semibold text-lg">Total Estimate:</span>
              <span className="text-3xl font-bold text-primary">
                £{totals.total}
              </span>
            </div>
            
            {totals.estimatedTime && (
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>Estimated completion:</span>
                <span className="font-medium">{totals.estimatedTime}</span>
              </div>
            )}
            
            {totals.warranty > 0 && (
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>Warranty period:</span>
                <span className="font-medium">{totals.warranty} days</span>
              </div>
            )}
            
            <div className="text-xs text-muted-foreground pt-2 border-t border-primary/20">
              • Prices include parts, labor, and service fee
              • Free diagnostic included
              • All repairs backed by warranty
              • No hidden fees
            </div>
            
            <Button 
              onClick={handleProceed}
              className="w-full text-lg py-6"
              size="lg"
            >
              Book Repair - £{totals.total}
            </Button>
          </div>
        </Card>
      )}

      {selectedRepairs.length === 0 && (
        <Card className="p-6 text-center">
          <div className="text-muted-foreground">
            <p className="mb-2">Select repair services to see pricing</p>
            <p className="text-sm">Our pricing includes parts, labor, and warranty</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default PriceCalculatorV2;