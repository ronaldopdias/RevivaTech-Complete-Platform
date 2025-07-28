'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Calculator, Clock, Shield, Truck, Zap, Info, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { pricingEngine, getAllRepairTypes, type RepairOptions, type PriceEstimate } from '../../../config/pricing/pricing.engine';
import type { DeviceModel, RepairType } from '@/types/config';

export interface PriceCalculatorProps {
  device: DeviceModel;
  onPriceCalculated?: (estimate: PriceEstimate) => void;
  className?: string;
  variant?: 'default' | 'compact' | 'detailed';
  showBreakdown?: boolean;
  allowOptions?: boolean;
}

export const PriceCalculator: React.FC<PriceCalculatorProps> = ({
  device,
  onPriceCalculated,
  className,
  variant = 'default',
  showBreakdown = true,
  allowOptions = true,
}) => {
  const [selectedRepairType, setSelectedRepairType] = useState<string>('');
  const [repairOptions, setRepairOptions] = useState<RepairOptions>({});
  const [priceEstimate, setPriceEstimate] = useState<PriceEstimate | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Get available repair types for the device
  const availableRepairs = useMemo(() => {
    return pricingEngine.getAvailableRepairs(device);
  }, [device]);

  // Get recommended repairs
  const recommendedRepairs = useMemo(() => {
    return pricingEngine.getRecommendedRepairs(device);
  }, [device]);

  // Calculate price when repair type or options change
  useEffect(() => {
    if (selectedRepairType) {
      setIsCalculating(true);
      
      // Simulate calculation delay for UX
      const timer = setTimeout(() => {
        try {
          const estimate = pricingEngine.calculatePrice(device, selectedRepairType, repairOptions);
          setPriceEstimate(estimate);
          onPriceCalculated?.(estimate);
        } catch (error) {
          console.error('Error calculating price:', error);
          setPriceEstimate(null);
        } finally {
          setIsCalculating(false);
        }
      }, 300);

      return () => clearTimeout(timer);
    } else {
      setPriceEstimate(null);
    }
  }, [selectedRepairType, repairOptions, device, onPriceCalculated]);

  const handleRepairTypeSelect = (repairTypeId: string) => {
    setSelectedRepairType(repairTypeId);
  };

  const handleOptionChange = (option: keyof RepairOptions, value: boolean | string) => {
    setRepairOptions(prev => ({
      ...prev,
      [option]: value
    }));
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'low': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-neutral-600 bg-neutral-50 border-neutral-200';
    }
  };

  const getConfidenceIcon = (confidence: string) => {
    switch (confidence) {
      case 'high': return CheckCircle;
      case 'medium': return AlertCircle;
      case 'low': return AlertCircle;
      default: return Info;
    }
  };

  if (variant === 'compact') {
    return (
      <div className={cn("space-y-4", className)}>
        <select
          value={selectedRepairType}
          onChange={(e) => handleRepairTypeSelect(e.target.value)}
          className="w-full p-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Select repair type...</option>
          {availableRepairs.map((repair) => (
            <option key={repair.id} value={repair.id}>
              {repair.name} (£{repair.basePriceRange.min}-{repair.basePriceRange.max})
            </option>
          ))}
        </select>

        {priceEstimate && (
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Price:</span>
              <span className="text-xl font-bold text-primary-600">£{priceEstimate.total}</span>
            </div>
            <div className="text-sm text-neutral-600 mt-1">
              Estimated time: {priceEstimate.estimatedTime}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="p-3 bg-primary-100 rounded-lg">
          <Calculator className="h-6 w-6 text-primary-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-neutral-900">Price Calculator</h3>
          <p className="text-neutral-600">Get an instant estimate for your {device.name}</p>
        </div>
      </div>

      {/* Recommended Repairs */}
      {recommendedRepairs.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-neutral-900">Recommended for Your Device</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recommendedRepairs.map((repair) => (
              <button
                key={repair.id}
                onClick={() => handleRepairTypeSelect(repair.id)}
                className={cn(
                  "text-left p-4 border-2 rounded-lg transition-all hover:shadow-md",
                  selectedRepairType === repair.id
                    ? "border-primary-500 bg-primary-50"
                    : "border-amber-200 bg-amber-50 hover:border-amber-300"
                )}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-medium text-neutral-900">{repair.name}</h5>
                    <p className="text-sm text-neutral-600 mt-1">{repair.description}</p>
                    <div className="text-sm text-primary-600 font-medium mt-2">
                      £{repair.basePriceRange.min} - £{repair.basePriceRange.max}
                    </div>
                  </div>
                  <div className="text-xs text-neutral-500">
                    <Clock className="inline h-3 w-3 mr-1" />
                    {repair.laborHours}h
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* All Repair Types */}
      <div className="space-y-3">
        <h4 className="font-semibold text-neutral-900">All Available Repairs</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {availableRepairs.map((repair) => (
            <button
              key={repair.id}
              onClick={() => handleRepairTypeSelect(repair.id)}
              className={cn(
                "text-left p-4 border-2 rounded-lg transition-all hover:shadow-md",
                selectedRepairType === repair.id
                  ? "border-primary-500 bg-primary-50"
                  : "border-neutral-200 hover:border-primary-300 hover:bg-neutral-50"
              )}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h5 className="font-medium text-neutral-900">{repair.name}</h5>
                  <p className="text-sm text-neutral-600 mt-1">{repair.description}</p>
                  <div className="flex items-center space-x-4 mt-3">
                    <div className="text-sm text-primary-600 font-medium">
                      £{repair.basePriceRange.min} - £{repair.basePriceRange.max}
                    </div>
                    <div className="text-xs text-neutral-500">
                      <Clock className="inline h-3 w-3 mr-1" />
                      {repair.laborHours}h
                    </div>
                    <div className={cn(
                      "text-xs px-2 py-1 rounded-full",
                      repair.complexity === 'simple' ? "bg-green-100 text-green-700" :
                      repair.complexity === 'moderate' ? "bg-blue-100 text-blue-700" :
                      repair.complexity === 'complex' ? "bg-amber-100 text-amber-700" :
                      "bg-red-100 text-red-700"
                    )}>
                      {repair.complexity}
                    </div>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Repair Options */}
      {allowOptions && selectedRepairType && (
        <div className="space-y-4">
          <h4 className="font-semibold text-neutral-900">Service Options</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Express Service */}
            <div className="border border-neutral-200 rounded-lg p-4">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={repairOptions.express || false}
                  onChange={(e) => handleOptionChange('express', e.target.checked)}
                  className="mt-1 h-4 w-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Zap className="h-4 w-4 text-amber-500" />
                    <span className="font-medium">Express Service</span>
                  </div>
                  <p className="text-sm text-neutral-600 mt-1">
                    Same-day service (+50% surcharge)
                  </p>
                </div>
              </label>
            </div>

            {/* Premium Parts */}
            <div className="border border-neutral-200 rounded-lg p-4">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={repairOptions.premiumParts || false}
                  onChange={(e) => handleOptionChange('premiumParts', e.target.checked)}
                  className="mt-1 h-4 w-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="font-medium">Premium Parts</span>
                  </div>
                  <p className="text-sm text-neutral-600 mt-1">
                    Genuine OEM parts (+25% surcharge)
                  </p>
                </div>
              </label>
            </div>

            {/* Data Recovery */}
            <div className="border border-neutral-200 rounded-lg p-4">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={repairOptions.dataRecovery || false}
                  onChange={(e) => handleOptionChange('dataRecovery', e.target.checked)}
                  className="mt-1 h-4 w-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">Data Recovery</span>
                  </div>
                  <p className="text-sm text-neutral-600 mt-1">
                    Recover your data (+£80)
                  </p>
                </div>
              </label>
            </div>

            {/* Pickup & Delivery */}
            <div className="border border-neutral-200 rounded-lg p-4">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={repairOptions.pickupDelivery || false}
                  onChange={(e) => handleOptionChange('pickupDelivery', e.target.checked)}
                  className="mt-1 h-4 w-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Truck className="h-4 w-4 text-purple-500" />
                    <span className="font-medium">Pickup & Delivery</span>
                  </div>
                  <p className="text-sm text-neutral-600 mt-1">
                    We'll collect and deliver (+£25)
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Warranty Options */}
          <div className="space-y-3">
            <h5 className="font-medium text-neutral-900">Warranty Options</h5>
            <div className="space-y-2">
              {[
                { value: 'standard', label: 'Standard Warranty', description: 'Included at no extra cost' },
                { value: 'extended', label: 'Extended Warranty', description: '50% longer coverage (+£30)' },
                { value: 'premium', label: 'Premium Warranty', description: 'Double coverage period (+£60)' }
              ].map((warranty) => (
                <label key={warranty.value} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="warranty"
                    value={warranty.value}
                    checked={(repairOptions.warranty || 'standard') === warranty.value}
                    onChange={(e) => handleOptionChange('warranty', e.target.value)}
                    className="h-4 w-4 text-primary-600 border-neutral-300 focus:ring-primary-500"
                  />
                  <div>
                    <span className="font-medium">{warranty.label}</span>
                    <span className="text-sm text-neutral-600 ml-2">{warranty.description}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Price Estimate */}
      {selectedRepairType && (
        <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-6">
          {isCalculating ? (
            <div className="text-center py-4">
              <div className="animate-spin inline-block w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full mb-2"></div>
              <div className="text-neutral-600">Calculating price...</div>
            </div>
          ) : priceEstimate ? (
            <div className="space-y-4">
              {/* Price Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-xl font-bold text-neutral-900">Total Estimate</h4>
                  <p className="text-neutral-600">For {device.name} repair</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary-600">£{priceEstimate.total}</div>
                  <div className="text-sm text-neutral-500">Estimated time: {priceEstimate.estimatedTime}</div>
                </div>
              </div>

              {/* Confidence Indicator */}
              <div className={cn(
                "flex items-center space-x-2 p-3 rounded-lg border",
                getConfidenceColor(priceEstimate.confidence)
              )}>
                {React.createElement(getConfidenceIcon(priceEstimate.confidence), { className: "h-4 w-4" })}
                <span className="text-sm font-medium capitalize">
                  {priceEstimate.confidence} Confidence Estimate
                </span>
              </div>

              {/* Price Breakdown */}
              {showBreakdown && (
                <div className="space-y-3">
                  <h5 className="font-medium text-neutral-900">Price Breakdown</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Base Price</span>
                      <span>£{priceEstimate.basePrice}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Labor Cost</span>
                      <span>£{priceEstimate.laborCost}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Parts Cost</span>
                      <span>£{priceEstimate.partsCost}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Service Fee</span>
                      <span>£{priceEstimate.serviceFee}</span>
                    </div>
                    {priceEstimate.options.map((option, index) => (
                      <div key={index} className="flex justify-between text-primary-600">
                        <span>{option.name}</span>
                        <span>+£{option.cost}</span>
                      </div>
                    ))}
                    <div className="border-t border-neutral-200 pt-2 flex justify-between font-medium">
                      <span>Total</span>
                      <span>£{priceEstimate.total}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Warranty Info */}
              <div className="flex items-center space-x-2 text-sm text-neutral-600">
                <Shield className="h-4 w-4" />
                <span>{priceEstimate.warranty} days warranty included</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-neutral-500">
              Unable to calculate price estimate
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PriceCalculator;