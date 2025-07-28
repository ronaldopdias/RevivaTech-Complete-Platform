'use client';

import React, { useState, useCallback } from 'react';
import { ArrowLeft, ArrowRight, Check, Clock, MapPin, User, CreditCard, Calendar } from 'lucide-react';
import DeviceSelector from './DeviceSelector';
import IssueSelector from './IssueSelector';

interface Device {
  id: string;
  display_name: string;
  brand_name: string;
  category_name: string;
  year: number;
  slug: string;
  thumbnail_url?: string;
  repairability_score: number;
  avg_repair_cost: number;
  popularity_score: number;
}

interface Issue {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  symptoms: string[];
  difficulty_level: string;
  estimated_cost_min: number;
  estimated_cost_max: number;
  repair_time_minutes: number;
  success_rate: number;
  parts_required: string[];
}

interface Quote {
  quote_id: string;
  device: {
    id: string;
    name: string;
    brand: string;
    category: string;
    year: number;
  };
  issues: Array<{
    id: string;
    name: string;
    category: string;
    difficulty: string;
    base_cost: number;
    time_minutes: number;
  }>;
  service: {
    type: string;
    priority: string;
    customer_type: string;
  };
  pricing: {
    base_cost: number;
    final_cost: number;
    currency: string;
    adjustments: Array<{
      name: string;
      type: string;
      adjustment: number;
      method: string;
      description: string;
    }>;
    savings: number;
  };
  timing: {
    estimated_hours: number;
    estimated_completion: string;
    service_level: string;
  };
  terms: {
    deposit_required: number;
    warranty_months: number;
    guarantee: string;
  };
}

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address?: {
    street: string;
    city: string;
    postcode: string;
    country: string;
  };
}

interface ServiceOptions {
  service_type: 'standard' | 'express' | 'same_day';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  customer_type: 'individual' | 'business' | 'education';
  collection_method: 'postal' | 'pickup' | 'drop_off';
  preferred_date?: string;
  notes?: string;
}

const STEPS = [
  { id: 'device', title: 'Select Device', icon: User },
  { id: 'issues', title: 'Describe Issues', icon: Clock },
  { id: 'service', title: 'Service Options', icon: MapPin },
  { id: 'quote', title: 'Get Quote', icon: CreditCard },
  { id: 'customer', title: 'Your Details', icon: User },
  { id: 'confirmation', title: 'Confirmation', icon: Check },
];

export default function BookingWizard({ className = '' }: { className?: string }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [selectedIssues, setSelectedIssues] = useState<Issue[]>([]);
  const [serviceOptions, setServiceOptions] = useState<ServiceOptions>({
    service_type: 'standard',
    priority: 'medium',
    customer_type: 'individual',
    collection_method: 'postal',
  });
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    email: '',
    phone: '',
  });
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = process.env.NODE_ENV === 'development' ? 'http://localhost:3011' : '';

  const canContinue = useCallback(() => {
    switch (currentStep) {
      case 0: return selectedDevice !== null;
      case 1: return selectedIssues.length > 0;
      case 2: return true; // Service options have defaults
      case 3: return quote !== null;
      case 4: return customerInfo.name && customerInfo.email && customerInfo.phone;
      case 5: return false; // Final step
      default: return false;
    }
  }, [currentStep, selectedDevice, selectedIssues, quote, customerInfo]);

  const handleNext = async () => {
    if (currentStep === 3 && !quote) {
      // Generate quote
      await generateQuote();
    } else if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const generateQuote = async () => {
    if (!selectedDevice || selectedIssues.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/pricing/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          device_id: selectedDevice.id,
          issues: selectedIssues.map(issue => ({ id: issue.id })),
          service_type: serviceOptions.service_type,
          priority: serviceOptions.priority,
          customer_type: serviceOptions.customer_type,
        }),
      });

      if (response.ok) {
        const quoteData = await response.json();
        setQuote(quoteData);
        setCurrentStep(currentStep + 1);
      } else {
        throw new Error('Failed to generate quote');
      }
    } catch (err) {
      setError('Failed to generate quote. Please try again.');
      console.error('Quote generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeviceSelect = (device: Device) => {
    setSelectedDevice(device);
  };

  const handleIssuesSelect = (issues: Issue[]) => {
    setSelectedIssues(issues);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <DeviceSelector
            onDeviceSelect={handleDeviceSelect}
            selectedDevice={selectedDevice}
          />
        );

      case 1:
        return selectedDevice ? (
          <IssueSelector
            device={selectedDevice}
            onIssuesSelect={handleIssuesSelect}
            selectedIssues={selectedIssues}
          />
        ) : null;

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Service Options
              </h3>
              <p className="text-gray-600">
                Choose how you'd like your repair handled
              </p>
            </div>

            {/* Service Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Service Speed
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { value: 'standard', label: 'Standard', description: '3-5 business days', multiplier: '1x price' },
                  { value: 'express', label: 'Express', description: '24-48 hours', multiplier: '1.5x price' },
                  { value: 'same_day', label: 'Same Day', description: 'Within 8 hours', multiplier: '2x price' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setServiceOptions(prev => ({ ...prev, service_type: option.value as any }))}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      serviceOptions.service_type === option.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">{option.label}</div>
                    <div className="text-sm text-gray-600">{option.description}</div>
                    <div className="text-xs text-blue-600 mt-1">{option.multiplier}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Collection Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Collection Method
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { value: 'postal', label: 'Post to Us', description: 'Send via post with prepaid label', icon: '📮' },
                  { value: 'pickup', label: 'We Collect', description: 'We pick up from your address', icon: '🚗' },
                  { value: 'drop_off', label: 'Drop Off', description: 'Bring to our workshop', icon: '🏪' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setServiceOptions(prev => ({ ...prev, collection_method: option.value as any }))}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      serviceOptions.collection_method === option.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">{option.icon}</div>
                    <div className="font-medium">{option.label}</div>
                    <div className="text-sm text-gray-600">{option.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Customer Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Customer Type
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { value: 'individual', label: 'Individual', description: 'Personal device' },
                  { value: 'business', label: 'Business', description: 'Company device' },
                  { value: 'education', label: 'Education', description: 'Student/school discount' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setServiceOptions(prev => ({ ...prev, customer_type: option.value as any }))}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      serviceOptions.customer_type === option.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">{option.label}</div>
                    <div className="text-sm text-gray-600">{option.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        if (loading) {
          return (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="mt-2 text-gray-600">Generating your quote...</p>
            </div>
          );
        }

        if (error) {
          return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-red-800">{error}</p>
              <button
                onClick={generateQuote}
                className="mt-2 text-red-600 hover:text-red-700 underline"
              >
                Try again
              </button>
            </div>
          );
        }

        return quote ? (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Your Repair Quote
              </h3>
              <p className="text-gray-600">
                Quote valid until {new Date(quote.validity?.valid_until || '').toLocaleDateString()}
              </p>
            </div>

            {/* Quote Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-gray-900">{quote.device.name}</h4>
                  <p className="text-sm text-gray-600">{quote.device.brand} • {quote.device.year}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">
                    £{quote.pricing.final_cost}
                  </div>
                  <div className="text-sm text-gray-600">
                    {quote.timing.service_level}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <Calendar className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                  <div className="text-sm font-medium">{quote.timing.estimated_hours}h</div>
                  <div className="text-xs text-gray-600">Repair Time</div>
                </div>
                <div>
                  <Check className="w-5 h-5 mx-auto mb-1 text-green-600" />
                  <div className="text-sm font-medium">{quote.terms.warranty_months} months</div>
                  <div className="text-xs text-gray-600">Warranty</div>
                </div>
                <div>
                  <CreditCard className="w-5 h-5 mx-auto mb-1 text-purple-600" />
                  <div className="text-sm font-medium">£{quote.terms.deposit_required}</div>
                  <div className="text-xs text-gray-600">Deposit</div>
                </div>
                <div>
                  <Check className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                  <div className="text-sm font-medium">No Fix</div>
                  <div className="text-xs text-gray-600">No Fee</div>
                </div>
              </div>
            </div>

            {/* Issues Breakdown */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Issues to be repaired:</h4>
              <div className="space-y-2">
                {quote.issues.map((issue, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium">{issue.name}</span>
                      <span className="ml-2 text-sm text-gray-600">({issue.difficulty} difficulty)</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">£{issue.base_cost}</div>
                      <div className="text-xs text-gray-600">{issue.time_minutes}min</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Breakdown */}
            {quote.pricing.adjustments.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Price breakdown:</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Base cost:</span>
                    <span>£{quote.pricing.base_cost}</span>
                  </div>
                  {quote.pricing.adjustments.map((adjustment, index) => (
                    <div key={index} className="flex justify-between text-gray-600">
                      <span>{adjustment.name}:</span>
                      <span>+£{adjustment.adjustment}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-medium text-lg border-t pt-1">
                    <span>Total:</span>
                    <span>£{quote.pricing.final_cost}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null;

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Your Contact Details
              </h3>
              <p className="text-gray-600">
                We'll use these details to keep you updated on your repair
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John Smith"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+44 7123 456789"
                />
              </div>
            </div>

            {serviceOptions.collection_method === 'pickup' && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Collection Address</h4>
                <div className="grid grid-cols-1 gap-4">
                  <input
                    type="text"
                    placeholder="Street Address"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onChange={(e) => setCustomerInfo(prev => ({
                      ...prev,
                      address: { ...prev.address, street: e.target.value, city: '', postcode: '', country: 'UK' }
                    }))}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="City"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onChange={(e) => setCustomerInfo(prev => ({
                        ...prev,
                        address: { ...prev.address!, city: e.target.value }
                      }))}
                    />
                    <input
                      type="text"
                      placeholder="Postcode"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onChange={(e) => setCustomerInfo(prev => ({
                        ...prev,
                        address: { ...prev.address!, postcode: e.target.value }
                      }))}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Booking Request Sent!
              </h3>
              <p className="text-gray-600">
                We'll contact you within 1 hour to confirm your repair booking.
              </p>
            </div>

            {quote && (
              <div className="bg-gray-50 rounded-lg p-4 text-left max-w-md mx-auto">
                <h4 className="font-medium mb-2">Booking Summary</h4>
                <div className="space-y-1 text-sm">
                  <div>Device: {quote.device.name}</div>
                  <div>Issues: {quote.issues.length} selected</div>
                  <div>Service: {quote.timing.service_level}</div>
                  <div>Total: £{quote.pricing.final_cost}</div>
                  <div>Quote ID: {quote.quote_id}</div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Book Another Repair
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Return to Homepage
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const IconComponent = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            
            return (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                  isCompleted
                    ? 'bg-green-500 border-green-500 text-white'
                    : isActive
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}>
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <IconComponent className="w-5 h-5" />
                  )}
                </div>
                
                <div className="ml-3 hidden md:block">
                  <div className={`text-sm font-medium ${
                    isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </div>
                </div>
                
                {index < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        {renderStepContent()}
      </div>

      {/* Navigation Buttons */}
      {currentStep < STEPS.length - 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </button>

          <button
            onClick={handleNext}
            disabled={!canContinue() || loading}
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {currentStep === 3 && !quote ? 'Generate Quote' : 'Continue'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      )}
    </div>
  );
}