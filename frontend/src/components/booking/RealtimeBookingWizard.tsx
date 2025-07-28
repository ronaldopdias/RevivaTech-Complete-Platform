'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Check, Clock, MapPin, User, CreditCard, Calendar, Wifi, WifiOff } from 'lucide-react';
// import { useWebSocket, useWebSocketSubscription } from '@shared/components/realtime/WebSocketProvider';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
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

interface TimeSlot {
  id: string;
  date: string;
  time: string;
  available: boolean;
  technician?: string;
}

const STEPS = [
  { id: 'device', title: 'Select Device', icon: User },
  { id: 'issues', title: 'Describe Issues', icon: Clock },
  { id: 'service', title: 'Service Options', icon: MapPin },
  { id: 'schedule', title: 'Schedule', icon: Calendar },
  { id: 'quote', title: 'Get Quote', icon: CreditCard },
  { id: 'customer', title: 'Your Details', icon: User },
  { id: 'confirmation', title: 'Confirmation', icon: Check },
];

export default function RealtimeBookingWizard({ className = '' }: { className?: string }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [selectedIssues, setSelectedIssues] = useState<Issue[]>([]);
  const [serviceOptions, setServiceOptions] = useState<ServiceOptions>({
    service_type: 'standard',
    priority: 'medium',
    customer_type: 'individual',
    collection_method: 'postal',
  });
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    email: '',
    phone: '',
  });
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [realTimePricing, setRealTimePricing] = useState<number | null>(null);

  const { isConnected, sendMessage } = useWebSocket();
  const API_BASE = process.env.NODE_ENV === 'development' ? 'http://localhost:3011' : '';

  // Real-time price updates
  useWebSocketSubscription('price_update', (data) => {
    if (data.sessionId === getSessionId()) {
      setRealTimePricing(data.estimatedCost);
    }
  });

  // Real-time availability updates
  useWebSocketSubscription('availability_update', (data) => {
    setAvailableSlots(data.slots);
  });

  // Real-time booking confirmations
  useWebSocketSubscription('booking_confirmed', (data) => {
    if (data.sessionId === getSessionId()) {
      // Move to confirmation step
      setCurrentStep(STEPS.length - 1);
    }
  });

  // Generate a session ID for this booking
  const getSessionId = () => {
    if (typeof window !== 'undefined') {
      let sessionId = sessionStorage.getItem('booking_session_id');
      if (!sessionId) {
        sessionId = `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('booking_session_id', sessionId);
      }
      return sessionId;
    }
    return `booking_${Date.now()}`;
  };

  // Send real-time price calculation request
  const requestRealTimePrice = useCallback(() => {
    if (selectedDevice && selectedIssues.length > 0 && isConnected) {
      sendMessage({
        type: 'price_calculation_request',
        payload: {
          sessionId: getSessionId(),
          device_id: selectedDevice.id,
          issues: selectedIssues.map(issue => ({ id: issue.id })),
          service_type: serviceOptions.service_type,
          priority: serviceOptions.priority,
          customer_type: serviceOptions.customer_type,
        },
        timestamp: new Date().toISOString()
      });
    }
  }, [selectedDevice, selectedIssues, serviceOptions, isConnected, sendMessage]);

  // Request availability when scheduling step is reached
  const requestAvailability = useCallback(() => {
    if (isConnected) {
      sendMessage({
        type: 'availability_request',
        payload: {
          sessionId: getSessionId(),
          service_type: serviceOptions.service_type,
          estimated_duration: selectedIssues.reduce((sum, issue) => sum + issue.repair_time_minutes, 0),
          preferred_date: serviceOptions.preferred_date,
        },
        timestamp: new Date().toISOString()
      });
    }
  }, [serviceOptions, selectedIssues, isConnected, sendMessage]);

  // Trigger real-time price updates when relevant data changes
  useEffect(() => {
    if (selectedDevice && selectedIssues.length > 0) {
      const debounceTimer = setTimeout(() => {
        requestRealTimePrice();
      }, 500);
      
      return () => clearTimeout(debounceTimer);
    }
  }, [selectedDevice, selectedIssues, serviceOptions, requestRealTimePrice]);

  // Load availability when reaching schedule step
  useEffect(() => {
    if (currentStep === 3) { // Schedule step
      requestAvailability();
    }
  }, [currentStep, requestAvailability]);

  const canContinue = useCallback(() => {
    switch (currentStep) {
      case 0: return selectedDevice !== null;
      case 1: return selectedIssues.length > 0;
      case 2: return true; // Service options have defaults
      case 3: return selectedTimeSlot !== null;
      case 4: return quote !== null;
      case 5: return customerInfo.name && customerInfo.email && customerInfo.phone;
      case 6: return false; // Final step
      default: return false;
    }
  }, [currentStep, selectedDevice, selectedIssues, selectedTimeSlot, quote, customerInfo]);

  const handleNext = async () => {
    if (currentStep === 4 && !quote) {
      // Generate quote
      await generateQuote();
    } else if (currentStep === 5) {
      // Submit booking
      await submitBooking();
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
          time_slot: selectedTimeSlot?.id,
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

  const submitBooking = async () => {
    if (!quote || !selectedTimeSlot) return;

    setLoading(true);
    setError(null);

    try {
      const bookingData = {
        quote_id: quote.quote_id,
        customer: customerInfo,
        time_slot: selectedTimeSlot,
        service_options: serviceOptions,
        session_id: getSessionId(),
      };

      // Send via WebSocket for real-time handling
      if (isConnected) {
        sendMessage({
          type: 'booking_submission',
          payload: bookingData,
          timestamp: new Date().toISOString()
        });
      }

      // Also submit via HTTP API as backup
      const response = await fetch(`${API_BASE}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      if (response.ok) {
        setCurrentStep(currentStep + 1);
      } else {
        throw new Error('Failed to submit booking');
      }
    } catch (err) {
      setError('Failed to submit booking. Please try again.');
      console.error('Booking submission error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeviceSelect = (device: Device) => {
    setSelectedDevice(device);
    setSelectedIssues([]); // Reset issues when device changes
    setRealTimePricing(null);
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
          <div className="space-y-4">
            <IssueSelector
              device={selectedDevice}
              onIssuesSelect={handleIssuesSelect}
              selectedIssues={selectedIssues}
            />
            
            {/* Real-time price preview */}
            {realTimePricing && selectedIssues.length > 0 && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-blue-900">Estimated Cost</h4>
                      <p className="text-sm text-blue-600">Updated in real-time</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        £{realTimePricing.toFixed(2)}
                      </div>
                      <div className="flex items-center text-xs text-blue-500">
                        <Wifi className="h-3 w-3 mr-1" />
                        Live pricing
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
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
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Schedule Your Repair
              </h3>
              <p className="text-gray-600">
                Choose your preferred date and time
              </p>
            </div>

            {/* Real-time availability indicator */}
            <div className="flex items-center justify-center space-x-2 p-3 bg-gray-50 rounded-lg">
              {isConnected ? (
                <>
                  <Wifi className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600">Live availability updates</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-600">Offline - showing cached availability</span>
                </>
              )}
            </div>

            {/* Time slots */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableSlots.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => setSelectedTimeSlot(slot)}
                  disabled={!slot.available}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    selectedTimeSlot?.id === slot.id
                      ? 'border-blue-500 bg-blue-50'
                      : slot.available
                      ? 'border-gray-200 hover:border-gray-300'
                      : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="font-medium">{new Date(slot.date).toLocaleDateString()}</div>
                  <div className="text-sm text-gray-600">{slot.time}</div>
                  {slot.technician && (
                    <div className="text-xs text-blue-600 mt-1">with {slot.technician}</div>
                  )}
                  {!slot.available && (
                    <Badge variant="secondary" className="mt-2">Unavailable</Badge>
                  )}
                </button>
              ))}
            </div>

            {availableSlots.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Loading available time slots...</p>
              </div>
            )}
          </div>
        );

      case 4:
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
                Final quote with selected time slot
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

              {selectedTimeSlot && (
                <div className="mb-4 p-3 bg-white/60 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Scheduled Appointment</div>
                      <div className="text-sm text-gray-600">
                        {new Date(selectedTimeSlot.date).toLocaleDateString()} at {selectedTimeSlot.time}
                      </div>
                    </div>
                    {selectedTimeSlot.technician && (
                      <div className="text-right">
                        <div className="font-medium">{selectedTimeSlot.technician}</div>
                        <div className="text-xs text-gray-600">Technician</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

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
          </div>
        ) : null;

      case 5:
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
          </div>
        );

      case 6:
        return (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Booking Confirmed!
              </h3>
              <p className="text-gray-600">
                Your repair has been scheduled and you'll receive a confirmation email shortly.
              </p>
            </div>

            {quote && selectedTimeSlot && (
              <div className="bg-gray-50 rounded-lg p-4 text-left max-w-md mx-auto">
                <h4 className="font-medium mb-2">Booking Summary</h4>
                <div className="space-y-1 text-sm">
                  <div>Device: {quote.device.name}</div>
                  <div>Issues: {quote.issues.length} selected</div>
                  <div>Service: {quote.timing.service_level}</div>
                  <div>Date: {new Date(selectedTimeSlot.date).toLocaleDateString()}</div>
                  <div>Time: {selectedTimeSlot.time}</div>
                  <div>Total: £{quote.pricing.final_cost}</div>
                  <div>Quote ID: {quote.quote_id}</div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Button
                onClick={() => window.location.href = '/dashboard'}
                className="w-full"
              >
                View in Dashboard
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="secondary"
                className="w-full"
              >
                Book Another Repair
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
      {/* Real-time connection status */}
      <div className="mb-6 flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <>
              <Wifi className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-600">Real-time booking enabled</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-yellow-600">Offline mode - limited features</span>
            </>
          )}
        </div>
        <Badge variant={isConnected ? "default" : "secondary"}>
          {isConnected ? 'Connected' : 'Offline'}
        </Badge>
      </div>

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
          <Button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            variant="outline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <Button
            onClick={handleNext}
            disabled={!canContinue() || loading}
          >
            {currentStep === 4 && !quote ? 'Generate Quote' : 
             currentStep === 5 ? 'Confirm Booking' : 'Continue'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}