'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle, Smartphone, Settings, CreditCard, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import VisualDeviceSelector from './VisualDeviceSelector';
import ModernRepairSelector from './ModernRepairSelector';
import VisualPricingCalculator from './VisualPricingCalculator';

interface DeviceModel {
  id: string;
  categoryId: string;
  category: string;
  brand: string;
  name: string;
  year: number;
  imageUrl: string;
  specifications: any;
  averageRepairCost: number;
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

interface BookingData {
  device?: DeviceModel;
  variant?: ModelVariant;
  repairType?: string;
  pricing?: PricingData;
  urgencyLevel?: string;
  customerInfo?: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
}

const steps = [
  { 
    id: 'device', 
    title: 'Device Selection', 
    description: 'Choose your device brand, model, and configuration',
    icon: Smartphone,
  },
  { 
    id: 'repair', 
    title: 'Repair Details', 
    description: 'What needs fixing and urgency level',
    icon: Settings,
  },
  { 
    id: 'pricing', 
    title: 'Get Quote', 
    description: 'Review pricing and estimated timeline',
    icon: CreditCard,
  },
  { 
    id: 'booking', 
    title: 'Book Service', 
    description: 'Complete your booking and payment',
    icon: Calendar,
  },
];

interface ImprovedBookingWizardProps {
  onComplete?: (bookingData: BookingData) => void;
  className?: string;
}

export default function ImprovedBookingWizard({ onComplete, className = '' }: ImprovedBookingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [bookingData, setBookingData] = useState<BookingData>({});

  const currentStepId = steps[currentStep]?.id;
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const canContinue = () => {
    switch (currentStepId) {
      case 'device':
        return !!bookingData.device;
      case 'repair':
        return !!bookingData.repairType;
      case 'pricing':
        return !!bookingData.pricing;
      case 'booking':
        return false; // Final step
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canContinue() && !isLastStep) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleDeviceSelect = (device: DeviceModel, variant?: ModelVariant) => {
    setBookingData(prev => ({ ...prev, device, variant }));
  };

  const handleRepairTypeSelect = (repairType: string) => {
    setBookingData(prev => ({ ...prev, repairType }));
  };

  const handleAcceptQuote = (pricing: PricingData) => {
    setBookingData(prev => ({ ...prev, pricing }));
    if (onComplete) {
      onComplete({ ...bookingData, pricing });
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const getDeviceDisplayName = () => {
    if (!bookingData.device) return '';
    
    const baseName = `${bookingData.device.brand} ${bookingData.device.name}`;
    if (bookingData.variant && bookingData.variant.id !== `${bookingData.device.id}-standard`) {
      // Extract meaningful parts from variant name
      const variantParts = bookingData.variant.name.replace(baseName, '').trim();
      return `${baseName} ${variantParts}`;
    }
    return baseName;
  };

  const getTotalPrice = () => {
    if (!bookingData.device) return 0;
    const basePrice = bookingData.device.averageRepairCost;
    const variantModifier = bookingData.variant?.priceModifier || 0;
    return basePrice + variantModifier;
  };

  const renderStepContent = () => {
    switch (currentStepId) {
      case 'device':
        return (
          <VisualDeviceSelector
            onDeviceSelect={handleDeviceSelect}
            selectedDevice={bookingData.device}
            selectedVariant={bookingData.variant}
          />
        );
      
      case 'repair':
        return (
          <div className="space-y-6">
            {/* Device Summary */}
            {bookingData.device && (
              <Card className="p-4 bg-blue-50 border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-blue-900">
                      Selected Device
                    </h4>
                    <p className="text-blue-700">
                      {getDeviceDisplayName()}
                    </p>
                    <p className="text-sm text-blue-600">
                      {bookingData.device.year} • Base repair cost: £{getTotalPrice()}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCurrentStep(0)}
                  >
                    Change Device
                  </Button>
                </div>
              </Card>
            )}

            <ModernRepairSelector
              onRepairTypeSelect={handleRepairTypeSelect}
              selectedRepairType={bookingData.repairType}
              deviceCategory={bookingData.device?.category}
            />
          </div>
        );
      
      case 'pricing':
        return bookingData.device && bookingData.repairType ? (
          <div className="space-y-6">
            {/* Device & Repair Summary */}
            <Card className="p-4 bg-gray-50">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Booking Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Device:</span>
                    <p className="font-medium">{getDeviceDisplayName()}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Repair Type:</span>
                    <p className="font-medium capitalize">
                      {bookingData.repairType?.replace('_', ' ').toLowerCase()}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <VisualPricingCalculator
              device={bookingData.device}
              repairType={bookingData.repairType}
              onAcceptQuote={handleAcceptQuote}
              variant={bookingData.variant}
            />
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Please select a device and repair type first.</p>
          </div>
        );
      
      case 'booking':
        return (
          <div className="max-w-2xl mx-auto">
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <CheckCircle className="w-16 h-16 text-green-600" />
              </div>
              
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Quote Generated Successfully!
                </h2>
                <p className="text-gray-600">
                  Your personalized repair quote is ready. Complete your booking to secure this price.
                </p>
              </div>
              
              {/* Comprehensive Booking Summary */}
              {bookingData.pricing && (
                <div className="space-y-4">
                  <Card className="p-6 bg-green-50 border-green-200">
                    <div className="space-y-4">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold text-green-900">
                          {getDeviceDisplayName()}
                        </h3>
                        <p className="text-green-700 capitalize">
                          {bookingData.repairType?.replace('_', ' ').toLowerCase()}
                        </p>
                      </div>
                      
                      <div className="border-t border-green-200 pt-4">
                        <div className="flex justify-between items-center">
                          <span className="text-green-700">Total Price:</span>
                          <span className="text-2xl font-bold text-green-800">
                            £{bookingData.pricing.pricing.finalPrice}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm mt-1">
                          <span className="text-green-600">Estimated time:</span>
                          <span className="text-green-600">
                            {bookingData.pricing.repairDetails.estimatedTime}
                          </span>
                        </div>
                      </div>

                      {/* Price Breakdown */}
                      <div className="border-t border-green-200 pt-4 space-y-2">
                        <h4 className="font-medium text-green-900">Price Breakdown:</h4>
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span className="text-green-700">Base Price:</span>
                            <span>£{bookingData.pricing.pricing.breakdown.base}</span>
                          </div>
                          {bookingData.variant?.priceModifier && bookingData.variant.priceModifier > 0 && (
                            <div className="flex justify-between">
                              <span className="text-green-700">Configuration:</span>
                              <span>+£{bookingData.variant.priceModifier}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-green-700">Urgency:</span>
                            <span>×{bookingData.pricing.pricing.breakdown.urgencyMultiplier}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-green-700">Market Demand:</span>
                            <span>×{bookingData.pricing.pricing.breakdown.marketDemand}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Valid Until Warning */}
                  <Card className="p-4 bg-amber-50 border-amber-200">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                      <p className="text-sm text-amber-700">
                        <strong>Quote valid until:</strong> {new Date(bookingData.pricing.validity.validUntil).toLocaleString()}
                      </p>
                    </div>
                  </Card>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="space-y-3">
                <Button className="w-full py-3 text-lg" size="lg">
                  Complete Booking & Pay Now
                </Button>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="secondary" className="w-full">
                    Save Quote for Later
                  </Button>
                  <Button 
                    variant="secondary" 
                    className="w-full"
                    onClick={() => setCurrentStep(0)}
                  >
                    Start New Quote
                  </Button>
                </div>
              </div>

              {/* Trust Indicators */}
              <div className="pt-6 border-t">
                <div className="grid grid-cols-3 gap-4 text-center text-sm text-gray-600">
                  <div>
                    <div className="font-medium">✓ Free Diagnosis</div>
                    <div>No hidden costs</div>
                  </div>
                  <div>
                    <div className="font-medium">✓ 90-Day Warranty</div>
                    <div>On all repairs</div>
                  </div>
                  <div>
                    <div className="font-medium">✓ Expert Service</div>
                    <div>Certified technicians</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={`max-w-7xl mx-auto ${className}`}>
      {/* Enhanced Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            
            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all ${
                    isCompleted
                      ? 'bg-green-600 border-green-600 text-white'
                      : isCurrent
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-gray-300 text-gray-400 bg-white'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <Icon className="w-6 h-6" />
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <div className={`text-sm font-medium ${
                      isCurrent ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </div>
                    <div className="text-xs text-gray-500 max-w-24 leading-tight">
                      {step.description}
                    </div>
                  </div>
                </div>
                
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${
                    isCompleted ? 'bg-green-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="mb-8">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      {currentStepId !== 'booking' && (
        <div className="flex items-center justify-between">
          <Button
            variant="secondary"
            onClick={handlePrevious}
            disabled={isFirstStep}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </Button>

          <div className="text-sm text-gray-500">
            Step {currentStep + 1} of {steps.length}
          </div>

          <Button
            onClick={handleNext}
            disabled={!canContinue() || isLastStep}
            className="flex items-center space-x-2"
          >
            <span>Next</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}