import React, { useMemo, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { DeviceModel } from '@/lib/services/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

// API Types
interface ApiPricingResponse {
  success: boolean;
  deviceInfo: {
    id: string;
    name: string;
    year: number;
    category: string;
  };
  pricing: {
    basePrice: number;
    finalPrice: number;
    breakdown: {
      base: number;
      urgencyMultiplier: number;
      complexityMultiplier: number;
      marketDemand: number;
      seasonalFactor: number;
    };
    currency: string;
  };
  validity: {
    validUntil: string;
    validityHours: number;
  };
  repairDetails: {
    type: string;
    urgency: string;
    estimatedTime: string;
  };
  disclaimers: string[];
  timestamp: string;
}

interface PriceCalculatorV3Props {
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

interface RepairType {
  id: string;
  name: string;
  description: string;
  category: string;
  complexity: string;
  estimatedTime: string;
  apiType: string; // Maps to API enum values
}

interface PriceEstimate {
  total: number;
  basePrice: number;
  breakdown: {
    base: number;
    urgency: number;
    complexity: number;
    market: number;
    seasonal: number;
  };
  warranty: number;
  validUntil: string;
  disclaimers: string[];
}

interface RepairOptionsState {
  express: boolean;
  premiumParts: boolean;
  dataRecovery: boolean;
  warranty: 'standard' | 'extended' | 'premium';
  pickupDelivery: boolean;
  urgency: 'LOW' | 'STANDARD' | 'HIGH' | 'URGENT' | 'EMERGENCY';
}

// Available repair types mapped to API enums
const availableRepairTypes: RepairType[] = [
  {
    id: 'screen-repair',
    name: 'Screen Repair',
    description: 'Fix cracked, damaged, or non-responsive screens',
    category: 'display',
    complexity: 'moderate',
    estimatedTime: '2-4 hours',
    apiType: 'SCREEN_REPAIR'
  },
  {
    id: 'battery-replacement',
    name: 'Battery Replacement',
    description: 'Replace worn-out or swollen batteries',
    category: 'power',
    complexity: 'simple',
    estimatedTime: '1-2 hours',
    apiType: 'BATTERY_REPLACEMENT'
  },
  {
    id: 'water-damage',
    name: 'Water Damage Repair',
    description: 'Comprehensive liquid damage restoration',
    category: 'motherboard',
    complexity: 'complex',
    estimatedTime: '1-3 days',
    apiType: 'WATER_DAMAGE'
  },
  {
    id: 'data-recovery',
    name: 'Data Recovery',
    description: 'Recover lost or corrupted files and data',
    category: 'data',
    complexity: 'expert',
    estimatedTime: '2-7 days',
    apiType: 'DATA_RECOVERY'
  },
  {
    id: 'software-issue',
    name: 'Software Repair',
    description: 'Fix software problems, crashes, and performance issues',
    category: 'software',
    complexity: 'simple',
    estimatedTime: '1-4 hours',
    apiType: 'SOFTWARE_ISSUE'
  },
  {
    id: 'hardware-diagnostic',
    name: 'Hardware Diagnostic',
    description: 'Comprehensive hardware analysis and diagnosis',
    category: 'motherboard',
    complexity: 'simple',
    estimatedTime: '30-60 minutes',
    apiType: 'HARDWARE_DIAGNOSTIC'
  },
  {
    id: 'motherboard-repair',
    name: 'Logic Board Repair',
    description: 'Advanced motherboard component repair',
    category: 'motherboard',
    complexity: 'expert',
    estimatedTime: '3-7 days',
    apiType: 'MOTHERBOARD_REPAIR'
  },
  {
    id: 'camera-repair',
    name: 'Camera Repair',
    description: 'Fix camera issues and lens problems',
    category: 'input',
    complexity: 'moderate',
    estimatedTime: '2-4 hours',
    apiType: 'CAMERA_REPAIR'
  },
  {
    id: 'speaker-repair',
    name: 'Speaker Repair',
    description: 'Fix audio and speaker problems',
    category: 'input',
    complexity: 'simple',
    estimatedTime: '1-3 hours',
    apiType: 'SPEAKER_REPAIR'
  },
  {
    id: 'charging-port',
    name: 'Charging Port Repair',
    description: 'Fix charging and connection issues',
    category: 'ports',
    complexity: 'moderate',
    estimatedTime: '2-4 hours',
    apiType: 'CHARGING_PORT'
  }
];

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
  input: 'Camera & Audio',
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

export const PriceCalculatorV3: React.FC<PriceCalculatorV3Props> = ({
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
    urgency: 'STANDARD'
  });
  const [priceData, setPriceData] = useState<Record<string, ApiPricingResponse>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter repairs based on device category and common issues
  const relevantRepairs = useMemo(() => {
    // Always show basic repairs
    let repairs = availableRepairTypes.filter(repair => 
      ['screen-repair', 'battery-replacement', 'hardware-diagnostic', 'software-issue'].includes(repair.id)
    );

    // Add category-specific repairs
    if (device.categoryId === 'iphone' || device.categoryId === 'android') {
      repairs = repairs.concat(availableRepairTypes.filter(repair => 
        ['camera-repair', 'speaker-repair', 'charging-port', 'water-damage'].includes(repair.id)
      ));
    }

    if (device.categoryId === 'macbook' || device.categoryId === 'laptop') {
      repairs = repairs.concat(availableRepairTypes.filter(repair => 
        ['motherboard-repair', 'data-recovery'].includes(repair.id)
      ));
    }

    // Remove duplicates
    return repairs.filter((repair, index, self) => 
      index === self.findIndex(r => r.id === repair.id)
    );
  }, [device.categoryId]);

  // Load pricing for selected repairs
  useEffect(() => {
    const loadPricing = async () => {
      if (selectedRepairs.length === 0) {
        setPriceData({});
        return;
      }

      setIsLoading(true);
      setError(null);
      
      const newPriceData: Record<string, ApiPricingResponse> = {};
      
      try {
        // Load pricing for each selected repair
        for (const repairId of selectedRepairs) {
          const repair = relevantRepairs.find(r => r.id === repairId);
          if (!repair) continue;

          const requestData = {
            deviceModelId: device.id,
            repairType: repair.apiType,
            urgencyLevel: repairOptions.urgency
          };

          const response = await fetch('/api/pricing/simple', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData),
          });

          const data = await response.json();
          
          if (response.ok && data.success) {
            newPriceData[repairId] = data;
          } else {
            console.error(`Failed to get pricing for ${repairId}:`, data.error);
          }
        }
        
        setPriceData(newPriceData);
      } catch (error) {
        console.error('Error loading pricing:', error);
        setError('Failed to load pricing information');
      } finally {
        setIsLoading(false);
      }
    };

    loadPricing();
  }, [selectedRepairs, repairOptions.urgency, device.id, relevantRepairs]);

  // Convert API data to EstimateWithRepair format
  const estimates = useMemo(() => {
    return selectedRepairs.map(repairId => {
      const repair = relevantRepairs.find(r => r.id === repairId);
      const apiData = priceData[repairId];
      
      if (!repair || !apiData) return null;

      const estimate: PriceEstimate = {
        total: apiData.pricing.finalPrice,
        basePrice: apiData.pricing.basePrice,
        breakdown: {
          base: apiData.pricing.breakdown.base,
          urgency: apiData.pricing.breakdown.urgencyMultiplier,
          complexity: apiData.pricing.breakdown.complexityMultiplier,
          market: apiData.pricing.breakdown.marketDemand,
          seasonal: apiData.pricing.breakdown.seasonalFactor,
        },
        warranty: repairOptions.warranty === 'extended' ? 180 : repairOptions.warranty === 'premium' ? 365 : 90,
        validUntil: apiData.validity.validUntil,
        disclaimers: apiData.disclaimers,
      };

      return {
        repair,
        estimate,
        selected: true,
      };
    }).filter(Boolean) as EstimateWithRepair[];
  }, [selectedRepairs, priceData, relevantRepairs, repairOptions.warranty]);

  // Group repairs by category
  const groupedRepairs = useMemo(() => {
    const groups: Record<string, RepairType[]> = {};
    relevantRepairs.forEach(repair => {
      if (!groups[repair.category]) {
        groups[repair.category] = [];
      }
      groups[repair.category].push(repair);
    });
    return groups;
  }, [relevantRepairs]);

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
    setRepairOptions(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleProceed = () => {
    if (estimates.length > 0) {
      onProceed(estimates);
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Select Repair Services</h2>
        <p className="text-muted-foreground">
          Choose the repairs needed for your {device.brand} {device.name}
        </p>
      </div>

      {/* Error display */}
      {error && (
        <Card className="p-4 bg-destructive/10 border-destructive/20">
          <p className="text-destructive text-center">{error}</p>
        </Card>
      )}

      {/* Repair Categories */}
      <div className="space-y-6">
        {Object.entries(groupedRepairs).map(([category, repairs]) => (
          <div key={category} className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className="text-xl">{categoryIcons[category]}</span>
              <h3 className="text-lg font-semibold">{categoryNames[category]}</h3>
            </div>
            
            <div className="grid gap-3">
              {repairs.map((repair) => {
                const isSelected = selectedRepairs.includes(repair.id);
                const priceInfo = priceData[repair.id];
                
                return (
                  <Card
                    key={repair.id}
                    variant="outlined"
                    className={cn(
                      'p-4 cursor-pointer transition-all hover:shadow-md',
                      isSelected 
                        ? 'border-primary bg-primary/5 shadow-sm' 
                        : 'hover:border-primary/50'
                    )}
                    onClick={() => handleRepairToggle(repair.id)}
                    clickable
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-semibold">{repair.name}</h4>
                          <span className={cn(
                            'text-xs px-2 py-1 rounded-full',
                            complexityColors[repair.complexity]
                          )}>
                            {complexityLabels[repair.complexity]}
                          </span>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">
                          {repair.description}
                        </p>
                        
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span>⏱️ {repair.estimatedTime}</span>
                          {priceInfo && (
                            <span>🔧 {priceInfo.repairDetails.estimatedTime}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        {isLoading && selectedRepairs.includes(repair.id) ? (
                          <div className="text-sm text-muted-foreground">Loading...</div>
                        ) : priceInfo ? (
                          <div>
                            <div className="font-semibold">£{priceInfo.pricing.finalPrice}</div>
                            {priceInfo.pricing.finalPrice !== priceInfo.pricing.basePrice && (
                              <div className="text-xs text-muted-foreground line-through">
                                £{priceInfo.pricing.basePrice}
                              </div>
                            )}
                          </div>
                        ) : isSelected ? (
                          <div className="text-sm text-muted-foreground">Select to see price</div>
                        ) : (
                          <div className="text-sm text-muted-foreground">£TBD</div>
                        )}
                        
                        {isSelected && (
                          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center mt-2 ml-auto">
                            <span className="text-primary-foreground text-sm font-bold">✓</span>
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

      {/* Repair Options */}
      {selectedRepairs.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Repair Options</h3>
          
          <div className="space-y-3">
            {/* Urgency Level */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Service Priority</label>
              <select 
                value={repairOptions.urgency}
                onChange={(e) => handleOptionChange('urgency', e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="STANDARD">Standard (2-3 days)</option>
                <option value="HIGH">High Priority (+20%)</option>
                <option value="URGENT">Urgent (+50%)</option>
                <option value="EMERGENCY">Emergency (+100%)</option>
              </select>
            </div>

            {/* Express Service */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Express Service</label>
              <input
                type="checkbox"
                checked={repairOptions.express}
                onChange={(e) => handleOptionChange('express', e.target.checked)}
                className="rounded"
              />
            </div>

            {/* Premium Parts */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Premium Parts</label>
              <input
                type="checkbox"
                checked={repairOptions.premiumParts}
                onChange={(e) => handleOptionChange('premiumParts', e.target.checked)}
                className="rounded"
              />
            </div>

            {/* Warranty */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Warranty</label>
              <select 
                value={repairOptions.warranty}
                onChange={(e) => handleOptionChange('warranty', e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="standard">Standard (90 days)</option>
                <option value="extended">Extended (6 months)</option>
                <option value="premium">Premium (1 year)</option>
              </select>
            </div>
          </div>
        </Card>
      )}

      {/* Price Summary */}
      {estimates.length > 0 && (
        <Card className="p-4 bg-primary/5 border-primary/20">
          <h3 className="font-semibold mb-4">Price Summary</h3>
          
          <div className="space-y-2">
            {estimates.map((est, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span>{est.repair.name}</span>
                <span>£{est.estimate.total}</span>
              </div>
            ))}
            
            <div className="border-t pt-2 flex justify-between font-semibold">
              <span>Total</span>
              <span>£{totals.total}</span>
            </div>
            
            <div className="text-xs text-muted-foreground space-y-1">
              <div>🛡️ Warranty: {totals.warranty} days</div>
              <div>⏱️ Estimated completion: {totals.estimatedTime}</div>
              <div>✨ All prices include free diagnosis</div>
            </div>
          </div>
        </Card>
      )}

      {/* Proceed Button */}
      <div className="text-center">
        <Button
          variant="primary"
          size="lg"
          onClick={handleProceed}
          disabled={estimates.length === 0 || isLoading}
          className="w-full sm:w-auto"
        >
          {isLoading ? 'Loading Prices...' : `Continue with ${estimates.length} Repair${estimates.length !== 1 ? 's' : ''}`}
        </Button>
        
        {estimates.length === 0 && (
          <p className="text-sm text-muted-foreground mt-2">
            Select at least one repair to continue
          </p>
        )}
      </div>
    </div>
  );
};

export default PriceCalculatorV3;