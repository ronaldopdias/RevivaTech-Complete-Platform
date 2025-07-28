'use client';

import React, { useState, useEffect } from 'react';
import { Calculator, TrendingUp, Clock, CheckCircle, AlertCircle, Star, Zap, Shield, Award } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface DeviceModel {
  id: string;
  categoryId: string;
  brand: string;
  name: string;
  year: number;
  imageUrl: string;
  specifications: any;
  averageRepairCost: number;
  commonIssues: string[];
  screenSize?: number;
}

interface ModelVariant {
  id: string;
  name: string;
  storage?: string;
  color?: string;
  connectivity?: string;
  specs?: {
    memory?: string;
    storage?: string;
    processor?: string;
  };
  priceModifier?: number;
}

interface PricingBreakdown {
  basePrice: number;
  urgencyMultiplier: number;
  complexityMultiplier: number;
  marketDemand: number;
  seasonalFactor: number;
  variantModifier: number;
  finalPrice: number;
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
    breakdown: PricingBreakdown;
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
    difficulty: string;
  };
  disclaimers: string[];
  trustFactors: {
    warranty: string;
    expertise: string;
    turnaround: string;
  };
}

interface VisualPricingCalculatorProps {
  device: DeviceModel;
  repairType: string;
  variant?: ModelVariant;
  onAcceptQuote: (pricing: PricingData) => void;
  className?: string;
}

// Urgency options with visual indicators
const URGENCY_OPTIONS = [
  {
    id: 'standard',
    name: 'Standard Repair',
    description: '5-7 business days',
    multiplier: 1.0,
    icon: Clock,
    color: 'blue',
    savings: '25%',
    popular: true,
  },
  {
    id: 'priority',
    name: 'Priority Service',
    description: '2-3 business days',
    multiplier: 1.3,
    icon: TrendingUp,
    color: 'orange',
    savings: '',
    popular: false,
  },
  {
    id: 'express',
    name: 'Express Repair',
    description: 'Same day / 24 hours',
    multiplier: 1.8,
    icon: Zap,
    color: 'red',
    savings: '',
    popular: false,
  },
];

// Warranty options
const WARRANTY_OPTIONS = [
  {
    id: 'standard',
    name: '90-Day Warranty',
    description: 'Standard parts & labor warranty',
    priceModifier: 0,
    icon: Shield,
    features: ['Parts replacement', 'Labor coverage', 'Free diagnostics'],
  },
  {
    id: 'extended',
    name: '1-Year Premium Warranty',
    description: 'Extended warranty with premium support',
    priceModifier: 49,
    icon: Award,
    features: ['Extended coverage', 'Priority support', 'Free check-ups', 'Accidental damage'],
  },
];

export default function VisualPricingCalculator({ 
  device, 
  repairType, 
  variant, 
  onAcceptQuote,
  className = ""
}: VisualPricingCalculatorProps) {
  const [selectedUrgency, setSelectedUrgency] = useState('standard');
  const [selectedWarranty, setSelectedWarranty] = useState('standard');
  const [isCalculating, setIsCalculating] = useState(false);
  const [pricingData, setPricingData] = useState<PricingData | null>(null);
  const [animationStep, setAnimationStep] = useState(0);

  // Calculate pricing when inputs change
  useEffect(() => {
    calculatePricing();
  }, [device, repairType, variant, selectedUrgency, selectedWarranty]);

  const calculatePricing = async () => {
    setIsCalculating(true);
    setAnimationStep(0);

    // Simulate real-time calculation with animation steps
    const steps = [
      'Analyzing device specifications...',
      'Checking parts availability...',
      'Calculating labor requirements...',
      'Applying market factors...',
      'Generating final quote...'
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 300));
      setAnimationStep(i + 1);
    }

    // Generate realistic pricing data
    const basePrice = device.averageRepairCost + (variant?.priceModifier || 0);
    const urgencyOption = URGENCY_OPTIONS.find(u => u.id === selectedUrgency)!;
    const warrantyOption = WARRANTY_OPTIONS.find(w => w.id === selectedWarranty)!;
    
    const breakdown: PricingBreakdown = {
      basePrice,
      urgencyMultiplier: urgencyOption.multiplier,
      complexityMultiplier: getComplexityMultiplier(repairType),
      marketDemand: getMarketDemandFactor(device.categoryId),
      seasonalFactor: getSeasonalFactor(),
      variantModifier: variant?.priceModifier || 0,
      finalPrice: 0, // Will be calculated
    };

    // Calculate final price
    const priceAfterMultipliers = basePrice * breakdown.urgencyMultiplier * breakdown.complexityMultiplier * breakdown.marketDemand * breakdown.seasonalFactor;
    const finalPrice = Math.round(priceAfterMultipliers + warrantyOption.priceModifier);
    breakdown.finalPrice = finalPrice;

    const validUntil = new Date();
    validUntil.setHours(validUntil.getHours() + 24);

    const mockPricingData: PricingData = {
      success: true,
      deviceInfo: {
        id: device.id,
        name: device.name,
        year: device.year,
        category: device.categoryId,
      },
      pricing: {
        basePrice,
        finalPrice,
        breakdown,
        currency: 'GBP',
      },
      validity: {
        validUntil: validUntil.toISOString(),
        validityHours: 24,
      },
      repairDetails: {
        type: repairType,
        urgency: selectedUrgency,
        estimatedTime: urgencyOption.description,
        difficulty: getDifficultyLevel(repairType),
      },
      disclaimers: [
        'Final pricing may vary based on diagnostic findings',
        'Quote valid for 24 hours from generation',
        'Additional parts may be required for complex repairs',
      ],
      trustFactors: {
        warranty: warrantyOption.name,
        expertise: 'Certified Apple & Samsung technicians',
        turnaround: urgencyOption.description,
      },
    };

    setPricingData(mockPricingData);
    setIsCalculating(false);
  };

  const getComplexityMultiplier = (repairType: string): number => {
    const complexityMap: { [key: string]: number } = {
      'screen_repair': 1.0,
      'battery_replacement': 0.8,
      'charging_port': 1.2,
      'camera_repair': 1.4,
      'water_damage': 1.6,
      'motherboard_repair': 2.0,
      'data_recovery': 1.8,
    };
    return complexityMap[repairType] || 1.0;
  };

  const getMarketDemandFactor = (categoryId: string): number => {
    const demandMap: { [key: string]: number } = {
      'iphone': 1.1,
      'macbook': 1.05,
      'ipad': 0.95,
      'imac': 1.0,
    };
    return demandMap[categoryId] || 1.0;
  };

  const getSeasonalFactor = (): number => {
    // Simulate seasonal pricing (higher in holiday seasons)
    const month = new Date().getMonth();
    if (month === 11 || month === 0 || month === 1) return 1.1; // Dec, Jan, Feb
    if (month >= 5 && month <= 7) return 0.95; // Jun, Jul, Aug
    return 1.0;
  };

  const getDifficultyLevel = (repairType: string): string => {
    const difficultyMap: { [key: string]: string } = {
      'screen_repair': 'Moderate',
      'battery_replacement': 'Easy',
      'charging_port': 'Moderate',
      'camera_repair': 'Complex',
      'water_damage': 'Expert',
      'motherboard_repair': 'Expert',
      'data_recovery': 'Expert',
    };
    return difficultyMap[repairType] || 'Moderate';
  };

  const handleAcceptQuote = () => {
    if (pricingData) {
      onAcceptQuote(pricingData);
    }
  };

  const renderCalculationAnimation = () => {
    const steps = [
      'Analyzing device specifications...',
      'Checking parts availability...',
      'Calculating labor requirements...',
      'Applying market factors...',
      'Generating final quote...'
    ];

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
            <Calculator className="w-8 h-8 text-white" />
          </div>
        </div>
        
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                index < animationStep 
                  ? 'bg-green-500 text-white' 
                  : index === animationStep 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-400'
              }`}>
                {index < animationStep ? (
                  <CheckCircle className="w-4 h-4" />
                ) : index === animationStep ? (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="text-xs font-bold">{index + 1}</span>
                )}
              </div>
              <span className={`text-sm ${
                index <= animationStep ? 'text-gray-900' : 'text-gray-400'
              }`}>
                {step}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderUrgencySelector = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Service Speed</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {URGENCY_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedUrgency === option.id;
          
          return (
            <Card
              key={option.id}
              className={`relative cursor-pointer transition-all duration-200 ${
                isSelected 
                  ? 'border-2 border-blue-500 shadow-lg scale-105' 
                  : 'border border-gray-200 hover:border-gray-300 hover:shadow-md'
              }`}
              onClick={() => setSelectedUrgency(option.id)}
            >
              <div className="p-4 space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    option.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                    option.color === 'orange' ? 'bg-orange-100 text-orange-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {option.popular && (
                    <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                      Most Popular
                    </div>
                  )}
                  {option.savings && (
                    <div className="bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs font-medium">
                      Save {option.savings}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div>
                  <h4 className="font-medium text-gray-900">{option.name}</h4>
                  <p className="text-sm text-gray-600">{option.description}</p>
                </div>

                {/* Price multiplier */}
                <div className="text-right">
                  <span className="text-sm text-gray-500">Price: </span>
                  <span className={`font-semibold ${
                    option.multiplier === 1.0 ? 'text-green-600' :
                    option.multiplier < 1.5 ? 'text-orange-600' :
                    'text-red-600'
                  }`}>
                    {option.multiplier === 1.0 ? 'Base' : `${option.multiplier}x`}
                  </span>
                </div>

                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle className="w-6 h-6 text-blue-500" />
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderWarrantySelector = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Warranty Protection</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {WARRANTY_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedWarranty === option.id;
          
          return (
            <Card
              key={option.id}
              className={`relative cursor-pointer transition-all duration-200 ${
                isSelected 
                  ? 'border-2 border-purple-500 shadow-lg' 
                  : 'border border-gray-200 hover:border-gray-300 hover:shadow-md'
              }`}
              onClick={() => setSelectedWarranty(option.id)}
            >
              <div className="p-4 space-y-4">
                {/* Header */}
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{option.name}</h4>
                    <p className="text-sm text-gray-600">{option.description}</p>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-2">
                  {option.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Price */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm text-gray-500">Additional cost:</span>
                  <span className="font-semibold text-purple-600">
                    {option.priceModifier === 0 ? 'Included' : `+£${option.priceModifier}`}
                  </span>
                </div>

                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle className="w-6 h-6 text-purple-500" />
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderPricingResults = () => {
    if (!pricingData) return null;

    return (
      <div className="space-y-6">
        {/* Main Price Display */}
        <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <h3 className="text-2xl font-bold text-green-900">Quote Ready!</h3>
            </div>
            
            <div className="space-y-2">
              <div className="text-4xl font-bold text-green-600">
                £{pricingData.pricing.finalPrice}
              </div>
              <div className="text-green-700">
                {device.name} • {repairType.replace('_', ' ')}
              </div>
              <div className="text-sm text-green-600">
                Estimated completion: {pricingData.repairDetails.estimatedTime}
              </div>
            </div>
          </div>
        </Card>

        {/* Price Breakdown */}
        <Card className="p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Price Breakdown</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Base repair cost</span>
              <span className="font-medium">£{pricingData.pricing.breakdown.basePrice}</span>
            </div>
            
            {variant?.priceModifier && variant.priceModifier > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Configuration premium</span>
                <span className="font-medium">+£{variant.priceModifier}</span>
              </div>
            )}
            
            <div className="flex justify-between">
              <span className="text-gray-600">Service speed ({selectedUrgency})</span>
              <span className="font-medium">
                {pricingData.pricing.breakdown.urgencyMultiplier === 1.0 ? 'Included' : `×${pricingData.pricing.breakdown.urgencyMultiplier}`}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Warranty ({selectedWarranty})</span>
              <span className="font-medium">
                {WARRANTY_OPTIONS.find(w => w.id === selectedWarranty)?.priceModifier === 0 ? 'Included' : `+£${WARRANTY_OPTIONS.find(w => w.id === selectedWarranty)?.priceModifier}`}
              </span>
            </div>
            
            <div className="border-t pt-3 flex justify-between">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="font-bold text-green-600">£{pricingData.pricing.finalPrice}</span>
            </div>
          </div>
        </Card>

        {/* Trust Factors */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-4 flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            What's Included
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <div className="font-medium text-blue-900">{pricingData.trustFactors.warranty}</div>
              <div className="text-blue-700">Full protection</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Star className="w-6 h-6 text-blue-600" />
              </div>
              <div className="font-medium text-blue-900">Expert Service</div>
              <div className="text-blue-700">{pricingData.trustFactors.expertise}</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div className="font-medium text-blue-900">Fast Turnaround</div>
              <div className="text-blue-700">{pricingData.trustFactors.turnaround}</div>
            </div>
          </div>
        </Card>

        {/* Quote Validity */}
        <Card className="p-4 bg-amber-50 border-amber-200">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <div className="text-sm text-amber-800">
              <strong>Quote valid until:</strong> {new Date(pricingData.validity.validUntil).toLocaleString()}
            </div>
          </div>
        </Card>

        {/* Action Button */}
        <Button 
          onClick={handleAcceptQuote}
          className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
          size="lg"
        >
          Accept Quote & Continue Booking
        </Button>
      </div>
    );
  };

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Device Summary */}
      <Card className="p-6 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Getting Quote For:</h3>
            <div className="text-gray-600">
              {device.name} • {repairType.replace('_', ' ')} • {device.year}
            </div>
            {variant && (
              <div className="text-sm text-gray-500">
                Configuration: {variant.name}
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Base cost</div>
            <div className="text-xl font-semibold text-gray-900">
              £{device.averageRepairCost + (variant?.priceModifier || 0)}
            </div>
          </div>
        </div>
      </Card>

      {/* Configuration Options */}
      {!isCalculating && !pricingData && (
        <div className="space-y-8">
          {renderUrgencySelector()}
          {renderWarrantySelector()}
        </div>
      )}

      {/* Calculation Animation */}
      {isCalculating && (
        <Card className="p-8">
          {renderCalculationAnimation()}
        </Card>
      )}

      {/* Pricing Results */}
      {!isCalculating && pricingData && renderPricingResults()}
    </div>
  );
}