'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { XIcon, SaveIcon, CalculatorIcon, AlertTriangleIcon } from 'lucide-react';

const REPAIR_TYPES = [
  'SCREEN_REPAIR',
  'BATTERY_REPLACEMENT', 
  'WATER_DAMAGE',
  'DATA_RECOVERY',
  'SOFTWARE_ISSUE',
  'HARDWARE_DIAGNOSTIC',
  'MOTHERBOARD_REPAIR',
  'CAMERA_REPAIR',
  'SPEAKER_REPAIR',
  'CHARGING_PORT',
  'BUTTON_REPAIR',
  'CUSTOM_REPAIR'
] as const;

type RepairType = typeof REPAIR_TYPES[number];

interface DeviceModel {
  id: string;
  name: string;
  brand: {
    id: string;
    name: string;
    category: {
      id: string;
      name: string;
    };
  };
}

interface PricingRule {
  id?: string;
  deviceModelId?: string;
  repairType: RepairType;
  basePrice: number;
  urgencyMultiplier: number;
  complexityMultiplier: number;
  marketDemand: number;
  seasonalFactor: number;
  isActive: boolean;
  validFrom: string;
  validUntil?: string;
}

interface FormData {
  deviceModelId: string;
  repairType: RepairType | '';
  basePrice: string;
  urgencyMultiplier: string;
  complexityMultiplier: string;
  marketDemand: string;
  seasonalFactor: string;
  isActive: boolean;
  validFrom: string;
  validUntil: string;
}

interface PricingRuleFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rule: PricingRule) => void;
  editingRule?: PricingRule | null;
  mode: 'create' | 'edit';
}

export default function PricingRuleForm({
  isOpen,
  onClose,
  onSave,
  editingRule,
  mode
}: PricingRuleFormProps) {
  const [formData, setFormData] = useState<FormData>({
    deviceModelId: '',
    repairType: '',
    basePrice: '',
    urgencyMultiplier: '1.00',
    complexityMultiplier: '1.00',
    marketDemand: '1.00',
    seasonalFactor: '1.00',
    isActive: true,
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: '',
  });

  const [deviceModels, setDeviceModels] = useState<DeviceModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previewPrice, setPreviewPrice] = useState<number | null>(null);

  // Load device models
  useEffect(() => {
    if (isOpen) {
      fetchDeviceModels();
    }
  }, [isOpen]);

  // Populate form when editing
  useEffect(() => {
    if (mode === 'edit' && editingRule) {
      setFormData({
        deviceModelId: editingRule.deviceModelId || '',
        repairType: editingRule.repairType,
        basePrice: editingRule.basePrice.toString(),
        urgencyMultiplier: editingRule.urgencyMultiplier.toString(),
        complexityMultiplier: editingRule.complexityMultiplier.toString(),
        marketDemand: editingRule.marketDemand.toString(),
        seasonalFactor: editingRule.seasonalFactor.toString(),
        isActive: editingRule.isActive,
        validFrom: editingRule.validFrom.split('T')[0],
        validUntil: editingRule.validUntil ? editingRule.validUntil.split('T')[0] : '',
      });
    } else if (mode === 'create') {
      // Reset form for create mode
      setFormData({
        deviceModelId: '',
        repairType: '',
        basePrice: '',
        urgencyMultiplier: '1.00',
        complexityMultiplier: '1.00',
        marketDemand: '1.00',
        seasonalFactor: '1.00',
        isActive: true,
        validFrom: new Date().toISOString().split('T')[0],
        validUntil: '',
      });
    }
  }, [mode, editingRule]);

  // Calculate preview price when form data changes
  useEffect(() => {
    if (formData.basePrice && 
        formData.urgencyMultiplier && 
        formData.complexityMultiplier && 
        formData.marketDemand && 
        formData.seasonalFactor) {
      
      const basePrice = parseFloat(formData.basePrice);
      const urgency = parseFloat(formData.urgencyMultiplier);
      const complexity = parseFloat(formData.complexityMultiplier);
      const market = parseFloat(formData.marketDemand);
      const seasonal = parseFloat(formData.seasonalFactor);

      if (!isNaN(basePrice) && !isNaN(urgency) && !isNaN(complexity) && !isNaN(market) && !isNaN(seasonal)) {
        const finalPrice = basePrice * urgency * complexity * market * seasonal;
        setPreviewPrice(Math.round(finalPrice * 100) / 100);
      } else {
        setPreviewPrice(null);
      }
    } else {
      setPreviewPrice(null);
    }
  }, [formData.basePrice, formData.urgencyMultiplier, formData.complexityMultiplier, formData.marketDemand, formData.seasonalFactor]);

  const fetchDeviceModels = async () => {
    try {
      setLoadingDevices(true);
      const response = await fetch('/api/devices?limit=1000&active=true');
      if (!response.ok) throw new Error('Failed to fetch device models');
      
      const data = await response.json();
      setDeviceModels(data.devices || []);
    } catch (error) {
      console.error('Error fetching device models:', error);
      setErrors({ general: 'Failed to load device models' });
    } finally {
      setLoadingDevices(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.repairType) {
      newErrors.repairType = 'Repair type is required';
    }

    const basePrice = parseFloat(formData.basePrice);
    if (!formData.basePrice || isNaN(basePrice) || basePrice <= 0) {
      newErrors.basePrice = 'Valid base price is required (must be greater than 0)';
    }

    const urgency = parseFloat(formData.urgencyMultiplier);
    if (isNaN(urgency) || urgency < 0.5 || urgency > 3.0) {
      newErrors.urgencyMultiplier = 'Urgency multiplier must be between 0.5 and 3.0';
    }

    const complexity = parseFloat(formData.complexityMultiplier);
    if (isNaN(complexity) || complexity < 0.5 || complexity > 3.0) {
      newErrors.complexityMultiplier = 'Complexity multiplier must be between 0.5 and 3.0';
    }

    const market = parseFloat(formData.marketDemand);
    if (isNaN(market) || market < 0.5 || market > 2.0) {
      newErrors.marketDemand = 'Market demand must be between 0.5 and 2.0';
    }

    const seasonal = parseFloat(formData.seasonalFactor);
    if (isNaN(seasonal) || seasonal < 0.5 || seasonal > 2.0) {
      newErrors.seasonalFactor = 'Seasonal factor must be between 0.5 and 2.0';
    }

    if (!formData.validFrom) {
      newErrors.validFrom = 'Valid from date is required';
    }

    if (formData.validUntil && formData.validFrom && formData.validUntil <= formData.validFrom) {
      newErrors.validUntil = 'Valid until date must be after valid from date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);

      const payload = {
        deviceModelId: formData.deviceModelId || undefined,
        repairType: formData.repairType as RepairType,
        basePrice: parseFloat(formData.basePrice),
        urgencyMultiplier: parseFloat(formData.urgencyMultiplier),
        complexityMultiplier: parseFloat(formData.complexityMultiplier),
        marketDemand: parseFloat(formData.marketDemand),
        seasonalFactor: parseFloat(formData.seasonalFactor),
        isActive: formData.isActive,
        validFrom: new Date(formData.validFrom).toISOString(),
        validUntil: formData.validUntil ? new Date(formData.validUntil).toISOString() : undefined,
      };

      let response;
      if (mode === 'create') {
        response = await fetch('/api/pricing/simple', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch(`/api/pricing/simple/${editingRule!.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save pricing rule');
      }

      const savedRule = await response.json();
      onSave(savedRule);
      onClose();
    } catch (error) {
      console.error('Error saving pricing rule:', error);
      setErrors({ 
        general: error instanceof Error ? error.message : 'Failed to save pricing rule' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const formatRepairType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[95vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900">
                {mode === 'create' ? 'Create Pricing Rule' : 'Edit Pricing Rule'}
              </h2>
              <p className="text-neutral-600 mt-1">
                {mode === 'create' 
                  ? 'Set up dynamic pricing for repair services'
                  : 'Update existing pricing rule configuration'
                }
              </p>
            </div>
            <Button
              variant="outline"
              onClick={onClose}
              className="p-2"
            >
              <XIcon className="w-4 h-4" />
            </Button>
          </div>

          {/* General Error */}
          {errors.general && (
            <Card className="p-4 bg-red-50 border-red-200 mb-6">
              <div className="flex items-center">
                <AlertTriangleIcon className="w-4 h-4 text-red-600 mr-2" />
                <p className="text-red-800">{errors.general}</p>
              </div>
            </Card>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Device Model (Optional)
                </label>
                <Select
                  value={formData.deviceModelId}
                  onValueChange={(value) => handleInputChange('deviceModelId', value)}
                  disabled={loadingDevices}
                  placeholder={loadingDevices ? 'Loading devices...' : 'Select device or leave empty for generic rule'}
                >
                  <option value="">Generic Rule (All Devices)</option>
                  {deviceModels.map(device => (
                    <option key={device.id} value={device.id}>
                      {device.brand.name} {device.name} ({device.brand.category.name})
                    </option>
                  ))}
                </Select>
                <p className="text-xs text-neutral-500 mt-1">
                  Leave empty to create a generic rule that applies to all devices for the selected repair type
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Repair Type *
                </label>
                <Select
                  value={formData.repairType}
                  onValueChange={(value) => handleInputChange('repairType', value)}
                  placeholder="Select repair type"
                  className={errors.repairType ? 'border-red-300' : ''}
                >
                  {REPAIR_TYPES.map(type => (
                    <option key={type} value={type}>
                      {formatRepairType(type)}
                    </option>
                  ))}
                </Select>
                {errors.repairType && (
                  <p className="text-red-600 text-xs mt-1">{errors.repairType}</p>
                )}
              </div>
            </div>

            {/* Pricing Configuration */}
            <Card className="p-4 bg-neutral-50">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Pricing Configuration</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Base Price (£) *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.basePrice}
                    onChange={(e) => handleInputChange('basePrice', e.target.value)}
                    placeholder="0.00"
                    className={errors.basePrice ? 'border-red-300' : ''}
                  />
                  {errors.basePrice && (
                    <p className="text-red-600 text-xs mt-1">{errors.basePrice}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Urgency Multiplier (0.5 - 3.0)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.5"
                    max="3.0"
                    value={formData.urgencyMultiplier}
                    onChange={(e) => handleInputChange('urgencyMultiplier', e.target.value)}
                    className={errors.urgencyMultiplier ? 'border-red-300' : ''}
                  />
                  {errors.urgencyMultiplier && (
                    <p className="text-red-600 text-xs mt-1">{errors.urgencyMultiplier}</p>
                  )}
                  <p className="text-xs text-neutral-500 mt-1">1.0 = standard, 1.5 = urgent, 2.0 = emergency</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Complexity Multiplier (0.5 - 3.0)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.5"
                    max="3.0"
                    value={formData.complexityMultiplier}
                    onChange={(e) => handleInputChange('complexityMultiplier', e.target.value)}
                    className={errors.complexityMultiplier ? 'border-red-300' : ''}
                  />
                  {errors.complexityMultiplier && (
                    <p className="text-red-600 text-xs mt-1">{errors.complexityMultiplier}</p>
                  )}
                  <p className="text-xs text-neutral-500 mt-1">0.8 = simple, 1.0 = standard, 1.5 = complex</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Market Demand (0.5 - 2.0)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.5"
                    max="2.0"
                    value={formData.marketDemand}
                    onChange={(e) => handleInputChange('marketDemand', e.target.value)}
                    className={errors.marketDemand ? 'border-red-300' : ''}
                  />
                  {errors.marketDemand && (
                    <p className="text-red-600 text-xs mt-1">{errors.marketDemand}</p>
                  )}
                  <p className="text-xs text-neutral-500 mt-1">0.8 = low demand, 1.0 = normal, 1.5 = high demand</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Seasonal Factor (0.5 - 2.0)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.5"
                    max="2.0"
                    value={formData.seasonalFactor}
                    onChange={(e) => handleInputChange('seasonalFactor', e.target.value)}
                    className={errors.seasonalFactor ? 'border-red-300' : ''}
                  />
                  {errors.seasonalFactor && (
                    <p className="text-red-600 text-xs mt-1">{errors.seasonalFactor}</p>
                  )}
                  <p className="text-xs text-neutral-500 mt-1">0.9 = off-season, 1.0 = normal, 1.2 = peak season</p>
                </div>

                {/* Price Preview */}
                <div className="md:col-span-2">
                  {previewPrice !== null && (
                    <Card className="p-4 bg-trust-50 border-trust-200">
                      <div className="flex items-center">
                        <CalculatorIcon className="w-5 h-5 text-trust-600 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-trust-800">Final Price Preview</p>
                          <p className="text-2xl font-bold text-trust-900">
                            {formatCurrency(previewPrice)}
                          </p>
                          <p className="text-xs text-trust-600">
                            Base: {formatCurrency(parseFloat(formData.basePrice) || 0)} × 
                            Urgency: {formData.urgencyMultiplier} × 
                            Complexity: {formData.complexityMultiplier} × 
                            Market: {formData.marketDemand} × 
                            Seasonal: {formData.seasonalFactor}
                          </p>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            </Card>

            {/* Validity and Status */}
            <Card className="p-4 bg-neutral-50">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Validity & Status</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Valid From *
                  </label>
                  <Input
                    type="date"
                    value={formData.validFrom}
                    onChange={(e) => handleInputChange('validFrom', e.target.value)}
                    className={errors.validFrom ? 'border-red-300' : ''}
                  />
                  {errors.validFrom && (
                    <p className="text-red-600 text-xs mt-1">{errors.validFrom}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Valid Until (Optional)
                  </label>
                  <Input
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => handleInputChange('validUntil', e.target.value)}
                    className={errors.validUntil ? 'border-red-300' : ''}
                  />
                  {errors.validUntil && (
                    <p className="text-red-600 text-xs mt-1">{errors.validUntil}</p>
                  )}
                  <p className="text-xs text-neutral-500 mt-1">Leave empty for no expiry</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Status
                  </label>
                  <div className="flex items-center space-x-3 pt-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={formData.isActive}
                        onChange={() => handleInputChange('isActive', true)}
                        className="mr-2"
                      />
                      <Badge variant="success" className="text-xs">Active</Badge>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={!formData.isActive}
                        onChange={() => handleInputChange('isActive', false)}
                        className="mr-2"
                      />
                      <Badge variant="secondary" className="text-xs">Inactive</Badge>
                    </label>
                  </div>
                </div>
              </div>
            </Card>

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-trust-500 hover:bg-trust-700 text-white"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <SaveIcon className="w-4 h-4 mr-2" />
                    {mode === 'create' ? 'Create Pricing Rule' : 'Update Pricing Rule'}
                  </div>
                )}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}