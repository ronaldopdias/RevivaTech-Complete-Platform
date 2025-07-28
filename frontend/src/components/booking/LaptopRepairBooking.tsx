'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { ArrowRight, ArrowLeft, ShoppingCart, Users, CreditCard, AlertCircle, CheckCircle, Percent, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';
import BandSelector from './BandSelector';
import ServiceCard from './ServiceCard';
import ServiceBundleSuggestions from './ServiceBundleSuggestions';
import DiagnosticPhotoUpload, { DiagnosticPhoto } from './DiagnosticPhotoUpload';
import BookingProgressManager from './BookingProgressManager';
import AppointmentScheduler from './AppointmentScheduler';
import RealtimeBookingIntegration from './RealtimeBookingIntegration';
import BundlePaymentIntegration from './BundlePaymentIntegration';
import AIPhotoAnalysisIntegration from './AIPhotoAnalysisIntegration';
import { generateBundleSuggestions } from '@/lib/data/service-bundling';
import { BookingProgress, loadProgress } from '@/lib/data/booking-progress';
import { TimeSlot, AppointmentPreference } from '@/lib/data/appointment-scheduling';
import { 
  SERVICE_BANDS, 
  getServicesByBand, 
  calculateTotalPrice, 
  LAPTOP_REPAIR_PRICING,
  SUPPORTED_BRANDS,
  LaptopRepairService
} from '@/lib/data/laptop-repair-services';

interface LaptopRepairBookingProps {
  className?: string;
  onBookingStart?: (selectedServices: string[], totalPrice: number) => void;
  userId?: string;
  authToken?: string;
}

type BookingStep = 'band-selection' | 'service-selection' | 'photo-upload' | 'summary';

interface BookingState {
  selectedBand: 'A' | 'B' | 'C' | null;
  selectedServices: string[];
  diagnosticPhotos: DiagnosticPhoto[];
  selectedAppointment: {
    slot: TimeSlot | null;
    preferences: AppointmentPreference | null;
  };
  appliedBundles: string[];
  discounts: {
    student: boolean;
    blueLightCard: boolean;
  };
  currentStep: BookingStep;
}

const LaptopRepairBooking: React.FC<LaptopRepairBookingProps> = ({
  className,
  onBookingStart,
  userId,
  authToken
}) => {
  const [bookingState, setBookingState] = useState<BookingState>({
    selectedBand: null,
    selectedServices: [],
    diagnosticPhotos: [],
    selectedAppointment: {
      slot: null,
      preferences: null
    },
    appliedBundles: [],
    discounts: {
      student: false,
      blueLightCard: false
    },
    currentStep: 'band-selection'
  });

  // Calculate pricing with bundle savings
  const originalPrice = useMemo(() => {
    return calculateTotalPrice(bookingState.selectedServices);
  }, [bookingState.selectedServices]);

  const bundleDiscount = useMemo(() => {
    // Apply 15% discount for each applied bundle
    return bookingState.appliedBundles.length > 0 ? originalPrice * 0.15 : 0;
  }, [originalPrice, bookingState.appliedBundles]);

  const totalPrice = useMemo(() => {
    const basePrice = calculateTotalPrice(bookingState.selectedServices, bookingState.discounts);
    return Math.max(0, basePrice - bundleDiscount);
  }, [bookingState.selectedServices, bookingState.discounts, bundleDiscount]);

  const discount = originalPrice - totalPrice;

  // Get services for current band
  const currentBandServices = useMemo(() => {
    return bookingState.selectedBand ? getServicesByBand(bookingState.selectedBand) : [];
  }, [bookingState.selectedBand]);

  // Event handlers
  const handleBandSelect = useCallback((bandId: 'A' | 'B' | 'C') => {
    setBookingState(prev => ({
      ...prev,
      selectedBand: bandId,
      selectedServices: [], // Clear services when switching bands
      currentStep: 'service-selection'
    }));
  }, []);

  const handleServiceToggle = useCallback((serviceId: string) => {
    setBookingState(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.includes(serviceId)
        ? prev.selectedServices.filter(id => id !== serviceId)
        : [...prev.selectedServices, serviceId]
    }));
  }, []);

  const handleBundleServicesAdd = useCallback((serviceIds: string[]) => {
    setBookingState(prev => ({
      ...prev,
      selectedServices: [...new Set([...prev.selectedServices, ...serviceIds])]
    }));
  }, []);

  const handleBundleApply = useCallback((bundleId: string, serviceIds: string[]) => {
    setBookingState(prev => ({
      ...prev,
      selectedServices: [...new Set([...prev.selectedServices, ...serviceIds])],
      appliedBundles: [...new Set([...prev.appliedBundles, bundleId])]
    }));
  }, []);

  const handlePhotosChange = useCallback((photos: DiagnosticPhoto[]) => {
    setBookingState(prev => ({
      ...prev,
      diagnosticPhotos: photos
    }));
  }, []);

  const handleProgressRestore = useCallback((progress: BookingProgress) => {
    setBookingState({
      selectedBand: progress.data.selectedBand,
      selectedServices: progress.data.selectedServices,
      diagnosticPhotos: progress.data.diagnosticPhotos,
      selectedAppointment: {
        slot: null,
        preferences: null
      },
      discounts: progress.data.discounts,
      currentStep: progress.step
    });
  }, []);

  const handleAppointmentSelect = useCallback((slot: TimeSlot | null, preferences: AppointmentPreference) => {
    setBookingState(prev => ({
      ...prev,
      selectedAppointment: {
        slot,
        preferences
      }
    }));
  }, []);

  const handleDiscountToggle = useCallback((discountType: 'student' | 'blueLightCard') => {
    setBookingState(prev => ({
      ...prev,
      discounts: {
        ...prev.discounts,
        [discountType]: !prev.discounts[discountType]
      }
    }));
  }, []);

  const handleStepChange = useCallback((step: BookingStep) => {
    setBookingState(prev => ({ ...prev, currentStep: step }));
  }, []);

  const handleBookingStart = useCallback(() => {
    if (onBookingStart) {
      onBookingStart(bookingState.selectedServices, totalPrice);
    }
  }, [bookingState.selectedServices, totalPrice, onBookingStart]);

  // Render step content
  const renderStepContent = () => {
    switch (bookingState.currentStep) {
      case 'band-selection':
        return (
          <BandSelector
            bands={SERVICE_BANDS}
            selectedBand={bookingState.selectedBand}
            onBandSelect={handleBandSelect}
          />
        );

      case 'service-selection':
        return (
          <div className="space-y-8">
            {/* Step Header */}
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={() => handleStepChange('band-selection')}
                  className="flex items-center space-x-2 text-trust-600 hover:text-trust-700 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Bands</span>
                </button>
                <div className="h-4 w-px bg-gray-300" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Band {bookingState.selectedBand} Services
                </h2>
              </div>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Select the specific services you need. You can choose multiple services within this band.
              </p>
            </div>

            {/* Band Info Bar */}
            <div className="bg-gradient-to-r from-trust-50 to-professional-50 border border-trust-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-2xl font-bold text-gray-900">
                    Band {bookingState.selectedBand}
                  </div>
                  <div className="text-gray-600">
                    {currentBandServices.length} available services
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">
                    £{SERVICE_BANDS.find(b => b.id === bookingState.selectedBand)?.price} per service
                  </div>
                  <div className="text-sm text-gray-600">Fixed labour fee</div>
                </div>
              </div>
            </div>

            {/* Services Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentBandServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  isSelected={bookingState.selectedServices.includes(service.id)}
                  onSelect={handleServiceToggle}
                />
              ))}
            </div>

            {/* Service Bundle Suggestions */}
            {bookingState.selectedServices.length > 0 && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <ServiceBundleSuggestions
                  selectedServices={bookingState.selectedServices}
                  selectedBand={bookingState.selectedBand}
                  onServiceAdd={handleBundleServicesAdd}
                />
              </div>
            )}

            {/* Selected Services Summary */}
            {bookingState.selectedServices.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-6 sticky bottom-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <ShoppingCart className="w-5 h-5 text-trust-600" />
                    <div>
                      <div className="font-semibold text-gray-900">
                        {bookingState.selectedServices.length} service{bookingState.selectedServices.length !== 1 ? 's' : ''} selected
                      </div>
                      <div className="text-sm text-gray-600">
                        Ready to proceed with booking
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      {discount > 0 && (
                        <div className="text-sm text-green-600 line-through">
                          £{originalPrice.toFixed(2)}
                        </div>
                      )}
                      <div className="text-2xl font-bold text-gray-900">
                        £{totalPrice.toFixed(2)}
                      </div>
                    </div>
                    <button
                      onClick={() => handleStepChange('photo-upload')}
                      className="bg-trust-500 text-white px-6 py-3 rounded-lg hover:bg-trust-600 transition-colors flex items-center space-x-2"
                    >
                      <span>Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'photo-upload':
        return (
          <div className="space-y-8">
            {/* Step Header */}
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={() => handleStepChange('service-selection')}
                  className="flex items-center space-x-2 text-trust-600 hover:text-trust-700 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Services</span>
                </button>
                <div className="h-4 w-px bg-gray-300" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Diagnostic Photos (Optional)
                </h2>
              </div>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Upload photos to help our technicians diagnose your laptop more accurately. 
                This step is optional but can significantly improve our repair process.
              </p>
            </div>

            {/* Photo Upload Component */}
            <DiagnosticPhotoUpload
              onPhotosChange={handlePhotosChange}
              selectedServices={bookingState.selectedServices}
              maxPhotos={8}
            />

            {/* AI Photo Analysis Integration */}
            {bookingState.diagnosticPhotos.length > 0 && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <AIPhotoAnalysisIntegration
                  photos={bookingState.diagnosticPhotos}
                  selectedServices={bookingState.selectedServices}
                  onAnalysisComplete={(results) => {
                    console.log('AI analysis completed:', results);
                  }}
                  onRecommendationApply={(serviceIds) => {
                    // Add AI-recommended services to the selection
                    setBookingState(prev => ({
                      ...prev,
                      selectedServices: [...new Set([...prev.selectedServices, ...serviceIds])]
                    }));
                  }}
                />
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button
                onClick={() => handleStepChange('service-selection')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Services</span>
              </button>
              
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">
                  {bookingState.diagnosticPhotos.length} photos uploaded
                </div>
                <button
                  onClick={() => handleStepChange('summary')}
                  className="bg-trust-500 text-white px-6 py-3 rounded-lg hover:bg-trust-600 transition-colors flex items-center space-x-2"
                >
                  <span>Continue to Summary</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );

      case 'summary':
        return (
          <div className="space-y-8">
            {/* Step Header */}
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={() => handleStepChange('photo-upload')}
                  className="flex items-center space-x-2 text-trust-600 hover:text-trust-700 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Photos</span>
                </button>
                <div className="h-4 w-px bg-gray-300" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Booking Summary
                </h2>
              </div>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Review your selected services and proceed to complete your booking.
              </p>
            </div>

            {/* Appointment Scheduler */}
            <div className="mb-8">
              <AppointmentScheduler
                selectedServices={bookingState.selectedServices}
                onAppointmentSelect={handleAppointmentSelect}
              />
            </div>

            {/* Payment Option */}
            {bookingState.selectedServices.length > 0 && (
              <div className="mb-8">
                <BundlePaymentIntegration
                  paymentData={{
                    selectedServices: bookingState.selectedServices,
                    bundleSuggestions: generateBundleSuggestions(bookingState.selectedServices, bookingState.selectedBand),
                    appliedBundles: bookingState.appliedBundles,
                    totalPrice,
                    originalPrice,
                    discounts: bookingState.discounts
                  }}
                  onPaymentSuccess={(paymentId, bundleData) => {
                    console.log('Payment successful:', { paymentId, bundleData });
                    onBookingStart?.(bookingState.selectedServices, totalPrice);
                  }}
                  onPaymentError={(error) => {
                    console.error('Payment error:', error);
                  }}
                />
              </div>
            )}

            {/* Summary Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Selected Services */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Selected Services
                  </h3>
                  <div className="space-y-4">
                    {bookingState.selectedServices.map((serviceId) => {
                      const service = currentBandServices.find(s => s.id === serviceId);
                      if (!service) return null;
                      
                      return (
                        <div key={serviceId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium text-gray-900">{service.name}</div>
                            <div className="text-sm text-gray-600">{service.category}</div>
                            <div className="text-xs text-gray-500">
                              {service.estimatedTime} • {service.difficulty} difficulty
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-gray-900">£{service.basePrice}</div>
                            <div className="text-xs text-gray-600">Fixed fee</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Discounts */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Percent className="w-5 h-5" />
                    <span>Available Discounts</span>
                  </h3>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bookingState.discounts.student}
                        onChange={() => handleDiscountToggle('student')}
                        className="w-4 h-4 text-trust-600 border-gray-300 rounded focus:ring-trust-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">Student Discount</div>
                        <div className="text-sm text-gray-600">15% off with valid student ID</div>
                      </div>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bookingState.discounts.blueLightCard}
                        onChange={() => handleDiscountToggle('blueLightCard')}
                        className="w-4 h-4 text-trust-600 border-gray-300 rounded focus:ring-trust-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">Blue Light Card</div>
                        <div className="text-sm text-gray-600">15% off for NHS, emergency services & social care workers</div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Pricing Sidebar */}
              <div>
                <div className="bg-gradient-to-br from-trust-50 to-professional-50 border border-trust-200 rounded-xl p-6 sticky top-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Pricing Summary
                  </h3>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Services ({bookingState.selectedServices.length})</span>
                      <span className="font-medium">£{originalPrice.toFixed(2)}</span>
                    </div>
                    
                    {discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount (15%)</span>
                        <span>-£{discount.toFixed(2)}</span>
                      </div>
                    )}
                    
                    <div className="border-t pt-3">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span>£{totalPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Trust Elements */}
                  <div className="space-y-3 mb-6 text-sm">
                    <div className="flex items-center space-x-2 text-green-700">
                      <CheckCircle className="w-4 h-4" />
                      <span>Fixed labour fee - no hidden costs</span>
                    </div>
                    <div className="flex items-center space-x-2 text-green-700">
                      <CheckCircle className="w-4 h-4" />
                      <span>No upfront payment required</span>
                    </div>
                    <div className="flex items-center space-x-2 text-green-700">
                      <CheckCircle className="w-4 h-4" />
                      <span>1 year guarantee included</span>
                    </div>
                    <div className="flex items-center space-x-2 text-green-700">
                      <CheckCircle className="w-4 h-4" />
                      <span>90-day warranty on all repairs</span>
                    </div>
                  </div>

                  {/* Supported Brands */}
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-2">Supported Brands</h4>
                    <div className="text-xs text-gray-600">
                      {SUPPORTED_BRANDS.slice(0, 6).join(', ')} + {SUPPORTED_BRANDS.length - 6} more
                    </div>
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={handleBookingStart}
                    className="w-full bg-gradient-to-r from-trust-500 to-professional-500 text-white py-4 px-6 rounded-lg hover:from-trust-600 hover:to-professional-600 transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                  >
                    <CreditCard className="w-5 h-5" />
                    <span className="font-semibold">Continue to Booking</span>
                  </button>
                  
                  <p className="text-xs text-center text-gray-500 mt-3">
                    Secure booking process with instant confirmation
                  </p>
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
    <div className={cn('max-w-7xl mx-auto', className)}>
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-4 mb-4">
          {[
            { id: 'band-selection', label: 'Choose Band', icon: Users },
            { id: 'service-selection', label: 'Select Services', icon: ShoppingCart },
            { id: 'photo-upload', label: 'Add Photos', icon: Camera },
            { id: 'summary', label: 'Review & Book', icon: CreditCard }
          ].map((step, index) => {
            const IconComponent = step.icon;
            const isActive = bookingState.currentStep === step.id;
            const isCompleted = 
              (step.id === 'band-selection' && bookingState.selectedBand) ||
              (step.id === 'service-selection' && bookingState.selectedServices.length > 0 && ['photo-upload', 'summary'].includes(bookingState.currentStep)) ||
              (step.id === 'photo-upload' && bookingState.currentStep === 'summary');
            
            return (
              <React.Fragment key={step.id}>
                <div className="flex items-center space-x-2">
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center transition-all',
                    isCompleted ? 'bg-green-500 text-white' :
                    isActive ? 'bg-trust-500 text-white' :
                    'bg-gray-200 text-gray-500'
                  )}>
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <IconComponent className="w-4 h-4" />
                    )}
                  </div>
                  <span className={cn(
                    'text-sm font-medium transition-colors',
                    isActive ? 'text-trust-600' :
                    isCompleted ? 'text-green-600' :
                    'text-gray-500'
                  )}>
                    {step.label}
                  </span>
                </div>
                {index < 3 && (
                  <div className={cn(
                    'w-12 h-0.5 transition-colors',
                    isCompleted ? 'bg-green-500' : 'bg-gray-300'
                  )} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Progress Manager */}
      <div className="mb-8">
        <BookingProgressManager
          currentStep={bookingState.currentStep}
          currentData={{
            selectedBand: bookingState.selectedBand,
            selectedServices: bookingState.selectedServices,
            diagnosticPhotos: bookingState.diagnosticPhotos,
            discounts: bookingState.discounts
          }}
          totalPrice={totalPrice}
          onProgressRestore={handleProgressRestore}
        />
      </div>

      {/* Real-time Integration */}
      {(userId && authToken) && (
        <div className="mb-8">
          <RealtimeBookingIntegration
            bookingState={bookingState}
            totalPrice={totalPrice}
            userId={userId}
            authToken={authToken}
            onBookingUpdate={(update) => {
              console.log('Real-time booking update:', update);
            }}
          />
        </div>
      )}

      {/* Step Content */}
      <div className="min-h-[600px]">
        {renderStepContent()}
      </div>
    </div>
  );
};

export default LaptopRepairBooking;