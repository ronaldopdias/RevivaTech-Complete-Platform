'use client';

import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Smartphone, 
  Wrench, 
  User, 
  Calendar,
  Star,
  Shield,
  Award,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { realBookingService, RealDevice, BookingResponse } from '@/lib/services/realBookingService';

interface BookingWizardProps {
  className?: string;
  onComplete?: (booking: any) => void;
  aiDiagnostic?: any;
}

const STEPS = [
  { id: 'device', title: 'Select Device', icon: Smartphone, description: 'Choose your device model' },
  { id: 'repair', title: 'Repair Type', icon: Wrench, description: 'What needs fixing?' },
  { id: 'details', title: 'Your Details', icon: User, description: 'Contact information' },
  { id: 'confirmation', title: 'Confirm', icon: Check, description: 'Review and submit' },
];

export default function RealApiBookingWizard({ 
  className = '', 
  onComplete,
  aiDiagnostic 
}: BookingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Device Selection
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [deviceModels, setDeviceModels] = useState<RealDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<RealDevice | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Step 2: Repair Selection
  const [repairTypes] = useState(realBookingService.getRepairTypes());
  const [selectedRepairType, setSelectedRepairType] = useState<string>('');
  const [problemDescription, setProblemDescription] = useState('');
  const [urgencyLevel, setUrgencyLevel] = useState<'STANDARD' | 'URGENT' | 'EMERGENCY'>('STANDARD');
  const [pricing, setPricing] = useState<any>(null);

  // Step 3: Customer Information
  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      postalCode: '',
      country: 'UK'
    }
  });

  // Step 4: Final booking data
  const [finalBooking, setFinalBooking] = useState<BookingResponse | null>(null);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Auto-populate from AI diagnostic if provided
  useEffect(() => {
    if (aiDiagnostic) {
      if (aiDiagnostic.repairType) {
        setSelectedRepairType(aiDiagnostic.repairType);
      }
      if (aiDiagnostic.issue) {
        setProblemDescription(aiDiagnostic.issue);
      }
    }
  }, [aiDiagnostic]);

  // Update pricing when repair selection changes
  useEffect(() => {
    if (selectedDevice && selectedRepairType) {
      updatePricing();
    }
  }, [selectedDevice, selectedRepairType, urgencyLevel]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [categoriesData, brandsData] = await Promise.all([
        realBookingService.getDeviceCategories(),
        realBookingService.getDeviceBrands()
      ]);
      setCategories(categoriesData);
      setBrands(brandsData);
    } catch (err) {
      setError('Failed to load device data');
      console.error('Error loading initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const updatePricing = async () => {
    if (!selectedDevice || !selectedRepairType) return;

    try {
      const priceEstimate = await realBookingService.estimateRepairPrice(
        selectedDevice.id,
        selectedRepairType,
        urgencyLevel
      );
      setPricing(priceEstimate);
    } catch (err) {
      console.error('Failed to get pricing:', err);
    }
  };

  const searchDevices = async (term: string) => {
    if (term.length < 2) {
      setDeviceModels([]);
      return;
    }

    try {
      setLoading(true);
      const models = await realBookingService.searchDeviceModels(term);
      setDeviceModels(models);
    } catch (err) {
      console.error('Device search failed:', err);
      setError('Device search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDeviceSearch = (term: string) => {
    setSearchTerm(term);
    if (term !== searchTerm) {
      searchDevices(term);
    }
  };

  const canContinue = (): boolean => {
    switch (currentStep) {
      case 0: return !!selectedDevice;
      case 1: return !!selectedRepairType && problemDescription.length >= 10;
      case 2: return !!(customerInfo.firstName && customerInfo.lastName && 
                       customerInfo.email && customerInfo.phone);
      case 3: return false; // Final step
      default: return false;
    }
  };

  const handleNext = async () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Submit booking
      await submitBooking();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const submitBooking = async () => {
    if (!selectedDevice || !selectedRepairType) {
      setError('Missing required booking information');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const bookingData = {
        deviceModelId: selectedDevice.id,
        repairType: selectedRepairType,
        problemDescription,
        urgencyLevel,
        customerInfo,
        deviceCondition: {
          hasWarranty: false,
          condition: 'UNKNOWN'
        },
        customerNotes: ''
      };

      const booking = await realBookingService.createBooking(bookingData);
      setFinalBooking(booking);

      // Prepare completion data for parent component
      const completionData = {
        device: {
          id: selectedDevice.id,
          brand: selectedDevice.brandName,
          name: selectedDevice.name,
          year: selectedDevice.year,
          averageRepairCost: pricing?.finalPrice || 0
        },
        repairType: selectedRepairType,
        pricing: {
          pricing: {
            finalPrice: pricing?.finalPrice || 0
          },
          repairDetails: {
            estimatedTime: pricing?.estimatedTime || 'Unknown'
          }
        },
        bookingId: booking.id
      };

      if (onComplete) {
        onComplete(completionData);
      }

    } catch (err: any) {
      console.error('Booking submission failed:', err);
      setError(err.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return renderDeviceSelection();
      case 1:
        return renderRepairSelection();
      case 2:
        return renderCustomerDetails();
      case 3:
        return renderConfirmation();
      default:
        return null;
    }
  };

  const renderDeviceSelection = () => (
    <div className="space-y-6">
      {/* Trust Signals Header */}
      <div className="bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-teal-600 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-semibold text-gray-800">Expert Device Repair Service</div>
              <div className="text-sm text-gray-600">2,847+ repairs completed • 98% satisfaction rate</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-teal-700">✓ No Fix, No Fee</div>
            <div className="text-xs text-gray-600">1-Year Warranty</div>
          </div>
        </div>
      </div>

      {/* Device Search */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search for your device
        </label>
        <Input
          type="text"
          placeholder="e.g., iPhone 14 Pro, MacBook Pro 2021, Samsung Galaxy S23..."
          value={searchTerm}
          onChange={(e) => handleDeviceSearch(e.target.value)}
          className="w-full"
        />
        {searchTerm.length >= 2 && deviceModels.length === 0 && !loading && (
          <p className="text-sm text-gray-500 mt-2">No devices found. Try a different search term.</p>
        )}
      </div>

      {/* Search Results */}
      {deviceModels.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Select your device:</h3>
          <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto">
            {deviceModels.map((device) => (
              <Card 
                key={device.id}
                className={`p-4 cursor-pointer transition-colors hover:bg-blue-50 ${
                  selectedDevice?.id === device.id ? 'bg-blue-100 border-blue-300' : ''
                }`}
                onClick={() => setSelectedDevice(device)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">
                      {device.brandName} {device.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {device.year} • {device.categoryName}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {device.brandName}
                    </div>
                    {selectedDevice?.id === device.id && (
                      <Check className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {selectedDevice && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Check className="w-5 h-5 text-green-600" />
            <span className="font-medium text-green-800">
              Selected: {selectedDevice.brandName} {selectedDevice.name} ({selectedDevice.year})
            </span>
          </div>
        </div>
      )}
    </div>
  );

  const renderRepairSelection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">What needs to be repaired?</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {repairTypes.map((repair) => (
            <Card
              key={repair.id}
              className={`p-4 cursor-pointer transition-colors hover:bg-blue-50 ${
                selectedRepairType === repair.id ? 'bg-blue-100 border-blue-300' : ''
              }`}
              onClick={() => setSelectedRepairType(repair.id)}
            >
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Wrench className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{repair.name}</div>
                  <div className="text-sm text-gray-600">{repair.description}</div>
                  {selectedRepairType === repair.id && (
                    <div className="mt-2 text-xs text-blue-600 font-medium">✓ Selected</div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {selectedRepairType && (
        <>
          {/* Problem Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Describe the problem in detail *
            </label>
            <textarea
              value={problemDescription}
              onChange={(e) => setProblemDescription(e.target.value)}
              placeholder="e.g., Screen cracked after dropping, won't turn on, making strange noises..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              minLength={10}
            />
            <div className="text-xs text-gray-500 mt-1">
              {problemDescription.length}/1000 characters (minimum 10 required)
            </div>
          </div>

          {/* Urgency Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Service urgency
            </label>
            <div className="space-y-3">
              {[
                { 
                  value: 'STANDARD', 
                  label: 'Standard Service', 
                  description: '3-5 business days • Standard pricing',
                  multiplier: '×1.0'
                },
                { 
                  value: 'URGENT', 
                  label: 'Priority Service', 
                  description: '1-2 business days • +25% fee',
                  multiplier: '×1.25'
                },
                { 
                  value: 'EMERGENCY', 
                  label: 'Emergency Service', 
                  description: 'Same day (subject to availability) • +50% fee',
                  multiplier: '×1.5'
                }
              ].map((urgency) => (
                <Card
                  key={urgency.value}
                  className={`p-3 cursor-pointer transition-colors hover:bg-blue-50 ${
                    urgencyLevel === urgency.value ? 'bg-blue-100 border-blue-300' : ''
                  }`}
                  onClick={() => setUrgencyLevel(urgency.value as any)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{urgency.label}</div>
                      <div className="text-sm text-gray-600">{urgency.description}</div>
                    </div>
                    <div className="text-sm font-medium text-blue-600">{urgency.multiplier}</div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Pricing Preview */}
          {pricing && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2">Price Estimate</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Base Price:</div>
                  <div className="font-medium">£{pricing.basePrice}</div>
                </div>
                <div>
                  <div className="text-gray-600">Total Price:</div>
                  <div className="font-semibold text-lg text-green-700">£{pricing.finalPrice}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-gray-600">Estimated Time:</div>
                  <div className="font-medium">{pricing.estimatedTime}</div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderCustomerDetails = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Your Contact Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            First Name *
          </label>
          <Input
            type="text"
            value={customerInfo.firstName}
            onChange={(e) => setCustomerInfo({ ...customerInfo, firstName: e.target.value })}
            className="w-full"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Last Name *
          </label>
          <Input
            type="text"
            value={customerInfo.lastName}
            onChange={(e) => setCustomerInfo({ ...customerInfo, lastName: e.target.value })}
            className="w-full"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email Address *
        </label>
        <Input
          type="email"
          value={customerInfo.email}
          onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
          className="w-full"
          required
        />
        <p className="text-xs text-gray-500 mt-1">We'll send booking confirmation and updates here</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Phone Number *
        </label>
        <Input
          type="tel"
          value={customerInfo.phone}
          onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
          className="w-full"
          placeholder="+44 20 1234 5678"
          required
        />
        <p className="text-xs text-gray-500 mt-1">For urgent updates about your repair</p>
      </div>

      {/* Trust indicators */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <Shield className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-blue-800">Your information is secure</span>
        </div>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>✓ GDPR compliant data handling</li>
          <li>✓ Secure encrypted transmission</li>
          <li>✓ No data shared with third parties</li>
        </ul>
      </div>
    </div>
  );

  const renderConfirmation = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Confirm Your Booking</h3>
      
      {/* Booking Summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Device</h4>
          <p className="text-gray-700">
            {selectedDevice?.brandName} {selectedDevice?.name} ({selectedDevice?.year})
          </p>
        </div>

        <div>
          <h4 className="font-medium text-gray-900 mb-2">Repair Service</h4>
          <p className="text-gray-700">
            {repairTypes.find(r => r.id === selectedRepairType)?.name}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {urgencyLevel === 'STANDARD' && 'Standard Service (3-5 business days)'}
            {urgencyLevel === 'URGENT' && 'Priority Service (1-2 business days)'}
            {urgencyLevel === 'EMERGENCY' && 'Emergency Service (same day)'}
          </p>
        </div>

        <div>
          <h4 className="font-medium text-gray-900 mb-2">Problem Description</h4>
          <p className="text-gray-700">{problemDescription}</p>
        </div>

        <div>
          <h4 className="font-medium text-gray-900 mb-2">Customer</h4>
          <p className="text-gray-700">
            {customerInfo.firstName} {customerInfo.lastName}
          </p>
          <p className="text-sm text-gray-600">
            {customerInfo.email} • {customerInfo.phone}
          </p>
        </div>

        {pricing && (
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-2">Pricing</h4>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Total Cost:</span>
              <span className="text-xl font-bold text-green-600">£{pricing.finalPrice}</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">Estimated time: {pricing.estimatedTime}</p>
          </div>
        )}
      </div>

      {/* Final Trust Elements */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center text-sm text-gray-600">
        <div className="flex flex-col items-center p-3 bg-green-50 rounded-lg">
          <Award className="w-6 h-6 text-green-600 mb-2" />
          <div className="font-medium text-green-800">Certified Experts</div>
          <div>CompTIA A+ certified technicians</div>
        </div>
        <div className="flex flex-col items-center p-3 bg-blue-50 rounded-lg">
          <Shield className="w-6 h-6 text-blue-600 mb-2" />
          <div className="font-medium text-blue-800">1-Year Warranty</div>
          <div>On all repairs and parts</div>
        </div>
        <div className="flex flex-col items-center p-3 bg-purple-50 rounded-lg">
          <Star className="w-6 h-6 text-purple-600 mb-2" />
          <div className="font-medium text-purple-800">98% Satisfaction</div>
          <div>2,847+ happy customers</div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-800">{error}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      {/* Trust Blue Color Scheme - Step Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            
            return (
              <div key={step.id} className="flex-1 flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center mb-2
                    ${isActive ? 'bg-blue-400 text-white' : ''}
                    ${isCompleted ? 'bg-teal-600 text-white' : ''}
                    ${!isActive && !isCompleted ? 'bg-gray-200 text-gray-600' : ''}
                  `}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className={`text-center ${isActive ? 'text-blue-700 font-medium' : 'text-gray-600'}`}>
                    <div className="text-sm font-medium">{step.title}</div>
                    <div className="text-xs">{step.description}</div>
                  </div>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${
                    index < currentStep ? 'bg-teal-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <Card className="p-6 min-h-[500px]">
        {renderStep()}
      </Card>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button
          variant="secondary"
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className="flex items-center space-x-2"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </Button>

        <Button
          onClick={handleNext}
          disabled={!canContinue() || loading}
          className="flex items-center space-x-2 bg-blue-400 hover:bg-blue-500"
        >
          <span>
            {currentStep === STEPS.length - 1 ? 'Submit Booking' : 'Continue'}
          </span>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {loading && (
        <div className="text-center py-4">
          <div className="text-gray-600">Loading...</div>
        </div>
      )}
    </div>
  );
}