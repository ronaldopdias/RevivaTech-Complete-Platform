'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Shield, AlertCircle, Check, Star } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface DeviceModel {
  id: string;
  name: string;
  brand: string;
  year: number;
  category: string;
}

interface PricingData {
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
}

interface ModernPricingDisplayProps {
  device: DeviceModel;
  repairType: string;
  urgencyLevel?: 'LOW' | 'STANDARD' | 'HIGH' | 'URGENT' | 'EMERGENCY';
  onAcceptQuote?: (pricing: PricingData) => void;
}

const urgencyOptions = [
  { id: 'STANDARD', name: 'Standard', description: '1-2 days', multiplier: '1.0x' },
  { id: 'HIGH', name: 'Priority', description: 'Same day', multiplier: '1.2x' },
  { id: 'URGENT', name: 'Urgent', description: '2-4 hours', multiplier: '1.5x' },
  { id: 'EMERGENCY', name: 'Emergency', description: '1 hour', multiplier: '2.0x' },
];

export default function ModernPricingDisplay({ 
  device, 
  repairType, 
  urgencyLevel = 'STANDARD',
  onAcceptQuote 
}: ModernPricingDisplayProps) {
  const [pricing, setPricing] = useState<PricingData | null>(null);
  const [selectedUrgency, setSelectedUrgency] = useState(urgencyLevel);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (device && repairType) {
      calculatePricing();
    }
  }, [device, repairType, selectedUrgency]);

  const calculatePricing = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/pricing/simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceModelId: device.id,
          repairType,
          urgencyLevel: selectedUrgency,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to calculate pricing');
      }

      const data = await response.json();
      setPricing(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate pricing');
      console.error('Pricing calculation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getValidityColor = (validityHours: number) => {
    if (validityHours <= 2) return 'text-red-600';
    if (validityHours <= 12) return 'text-yellow-600';
    return 'text-green-600';
  };

  const formatValidUntil = (validUntil: string) => {
    const date = new Date(validUntil);
    return date.toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Calculating pricing...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 border-red-200 bg-red-50">
        <div className="flex items-center space-x-2 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">Pricing Error</span>
        </div>
        <p className="text-red-600 mt-1">{error}</p>
        <Button 
          onClick={calculatePricing}
          variant="secondary"
          className="mt-3"
        >
          Try Again
        </Button>
      </Card>
    );
  }

  if (!pricing) {
    return (
      <Card className="p-6">
        <p className="text-gray-500 text-center">
          Select a device and repair type to see pricing
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Get Your Quote
        </h2>
        <p className="text-gray-600">
          Choose your service level and confirm the pricing
        </p>
      </div>

      {/* Device Summary */}
      <Card className="p-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900">{pricing.deviceInfo.name}</h3>
            <p className="text-sm text-gray-600">
              {pricing.repairDetails.type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())} • {pricing.deviceInfo.year}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-blue-600">
              £{pricing.pricing.finalPrice}
            </p>
            <p className="text-sm text-gray-500">
              Est. {pricing.repairDetails.estimatedTime}
            </p>
          </div>
        </div>
      </Card>

      {/* Urgency Selection */}
      <div>
        <h3 className="font-medium text-gray-900 mb-3">Service Level</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {urgencyOptions.map((option) => (
            <Card
              key={option.id}
              className={`p-3 cursor-pointer transition-all border-2 ${
                selectedUrgency === option.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-200'
              }`}
              onClick={() => setSelectedUrgency(option.id as any)}
            >
              <div className="text-center space-y-1">
                <h4 className="font-medium text-sm">{option.name}</h4>
                <p className="text-xs text-gray-600">{option.description}</p>
                <span className="text-xs font-medium text-blue-600">{option.multiplier}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Price Breakdown */}
      <Card className="p-4">
        <h3 className="font-medium text-gray-900 mb-3">Price Breakdown</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Base repair cost</span>
            <span className="font-medium">£{pricing.pricing.breakdown.base}</span>
          </div>
          {pricing.pricing.breakdown.urgencyMultiplier !== 1 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Service level adjustment</span>
              <span className="font-medium">
                {pricing.pricing.breakdown.urgencyMultiplier}x
              </span>
            </div>
          )}
          {pricing.pricing.breakdown.complexityMultiplier !== 1 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Complexity factor</span>
              <span className="font-medium">
                {pricing.pricing.breakdown.complexityMultiplier}x
              </span>
            </div>
          )}
          <hr className="my-2" />
          <div className="flex justify-between text-lg font-semibold">
            <span>Total</span>
            <span className="text-blue-600">£{pricing.pricing.finalPrice}</span>
          </div>
        </div>
      </Card>

      {/* Quote Validity */}
      <Card className="p-4 border-yellow-200 bg-yellow-50">
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-yellow-600" />
          <span className="font-medium text-yellow-800">Quote Validity</span>
        </div>
        <p className="text-yellow-700 mt-1">
          This quote is valid until{' '}
          <span className={`font-medium ${getValidityColor(pricing.validity.validityHours)}`}>
            {formatValidUntil(pricing.validity.validUntil)}
          </span>
          {' '}({pricing.validity.validityHours} hours)
        </p>
      </Card>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <Shield className="w-6 h-6 text-blue-600 mx-auto mb-2" />
          <h4 className="font-medium text-gray-900 mb-1">Warranty</h4>
          <p className="text-sm text-gray-600">6 months on repairs</p>
        </Card>
        <Card className="p-4 text-center">
          <Star className="w-6 h-6 text-blue-600 mx-auto mb-2" />
          <h4 className="font-medium text-gray-900 mb-1">Quality Parts</h4>
          <p className="text-sm text-gray-600">Premium components</p>
        </Card>
        <Card className="p-4 text-center">
          <Check className="w-6 h-6 text-blue-600 mx-auto mb-2" />
          <h4 className="font-medium text-gray-900 mb-1">Expert Service</h4>
          <p className="text-sm text-gray-600">Certified technicians</p>
        </Card>
      </div>

      {/* Disclaimers */}
      <Card className="p-4 bg-gray-50">
        <h4 className="font-medium text-gray-900 mb-2">Important Notes</h4>
        <ul className="space-y-1 text-sm text-gray-600">
          {pricing.disclaimers.map((disclaimer, index) => (
            <li key={index} className="flex items-start space-x-2">
              <span className="text-gray-400 mt-1">•</span>
              <span>{disclaimer}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Accept Quote Button */}
      {onAcceptQuote && (
        <Button
          onClick={() => onAcceptQuote(pricing)}
          className="w-full py-3 text-lg"
          size="lg"
        >
          Accept Quote & Continue
        </Button>
      )}
    </div>
  );
}