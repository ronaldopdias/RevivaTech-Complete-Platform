'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import ModernDeviceSelector from './ModernDeviceSelector';
import ModernRepairSelector from './ModernRepairSelector';
import ModernPricingDisplay from './ModernPricingDisplay';

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
  repairType?: string;
  pricing?: PricingData;
  urgencyLevel?: string;
}

const steps = [
  { id: 'device', title: 'Select Device', description: 'Choose your device model' },
  { id: 'repair', title: 'Repair Type', description: 'What needs fixing?' },
  { id: 'pricing', title: 'Get Quote', description: 'Review pricing and options' },
  { id: 'booking', title: 'Book Service', description: 'Complete your booking' },
];

interface ModernBookingWizardProps {
  onComplete?: (bookingData: BookingData) => void;
  className?: string;
}

export default function ModernBookingWizard({ onComplete, className = '' }: ModernBookingWizardProps) {
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

  const handleDeviceSelect = (device: DeviceModel) => {
    setBookingData(prev => ({ ...prev, device }));
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

  const renderStepContent = () => {
    switch (currentStepId) {
      case 'device':
        return (
          <ModernDeviceSelector
            onDeviceSelect={handleDeviceSelect}
            selectedDevice={bookingData.device}
          />
        );
      
      case 'repair':
        return (
          <ModernRepairSelector
            onRepairTypeSelect={handleRepairTypeSelect}
            selectedRepairType={bookingData.repairType}
            deviceCategory={bookingData.device?.category}
          />
        );
      
      case 'pricing':
        return bookingData.device && bookingData.repairType ? (
          <ModernPricingDisplay
            device={bookingData.device}
            repairType={bookingData.repairType}
            onAcceptQuote={handleAcceptQuote}
          />
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Please select a device and repair type first.</p>
          </div>
        );
      
      case 'booking':
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <CheckCircle className="w-16 h-16 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Quote Generated Successfully!
              </h2>
              <p className="text-gray-600">
                Your quote has been generated. Proceed to book your repair service.
              </p>
            </div>
            
            {bookingData.pricing && (
              <Card className="p-6 bg-green-50 border-green-200">
                <div className="text-center space-y-2">
                  <h3 className="font-semibold text-green-900">
                    {bookingData.device?.brand} {bookingData.device?.name}
                  </h3>
                  <p className="text-green-700">
                    {bookingData.repairType?.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                  </p>
                  <p className="text-2xl font-bold text-green-800">
                    £{bookingData.pricing.pricing.finalPrice}
                  </p>
                  <p className="text-sm text-green-600">
                    Estimated time: {bookingData.pricing.repairDetails.estimatedTime}
                  </p>
                </div>
              </Card>
            )}
            
            <div className="space-y-3">
              <Button className="w-full py-3 text-lg" size="lg">
                Proceed to Booking Details
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
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                index <= currentStep
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'border-gray-300 text-gray-400'
              }`}>
                {index < currentStep ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 ${
                  index < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
        
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900">
            {steps[currentStep]?.title}
          </h1>
          <p className="text-gray-600">
            {steps[currentStep]?.description}
          </p>
        </div>
      </div>

      {/* Step Content */}
      <div className="mb-8">
        {renderStepContent()}
      </div>

      {/* Navigation */}
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
    </div>
  );
}