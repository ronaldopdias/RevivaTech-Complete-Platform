'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Sparkles, CheckCircle, Brain, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import ModernRepairBookingWizard from '@/components/booking/ModernRepairBookingWizard';
import IntelligentRepairChatbotAPI from '@/components/ai/IntelligentRepairChatbotAPI';
import BookingFlowTracker from '@/components/analytics/BookingFlowTracker';
import BookingFlowAnalytics from '@/components/analytics/BookingFlowAnalytics';
import useEventTracking from '@/hooks/useEventTracking';
import useConversionFunnel from '@/hooks/useConversionFunnel';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface BookingData {
  device?: {
    id: string;
    brand: string;
    name: string;
    year: number;
    averageRepairCost: number;
  };
  variant?: {
    id: string;
    name: string;
    priceModifier?: number;
  };
  repairType?: string;
  pricing?: {
    pricing: {
      finalPrice: number;
    };
    repairDetails: {
      estimatedTime: string;
    };
  };
}

export default function BookRepairPage() {
  const [completedBooking, setCompletedBooking] = useState<BookingData | null>(null);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiDiagnostic, setAiDiagnostic] = useState<any>(null);

  // Analytics tracking
  const {
    trackPageView,
    trackFeatureUsage,
    trackBookingCompleted,
    isTrackingEnabled
  } = useEventTracking();

  // Conversion funnel tracking
  const bookingFunnel = useConversionFunnel({
    funnelName: 'repair_booking',
    steps: [
      { id: 'landing', name: 'Landing Page', order: 1, required: true },
      { id: 'device_selection', name: 'Device Selection', order: 2, required: true },
      { id: 'issue_description', name: 'Issue Description', order: 3, required: true },
      { id: 'pricing_review', name: 'Pricing Review', order: 4, required: true },
      { id: 'contact_details', name: 'Contact Details', order: 5, required: true },
      { id: 'confirmation', name: 'Booking Confirmation', order: 6, required: true }
    ],
    initialStep: 'landing',
    sessionId: `booking_${Date.now()}`,
    autoTrack: true,
    trackingEnabled: isTrackingEnabled
  });

  // Track page view on mount
  useEffect(() => {
    if (isTrackingEnabled) {
      trackPageView({
        page_section: 'booking_page',
        visit_intent: 'booking'
      });
    }
  }, [trackPageView, isTrackingEnabled]);

  const handleBookingComplete = (bookingData: BookingData) => {
    setCompletedBooking(bookingData);
    
    const bookingId = 'booking-' + Date.now();
    const finalValue = bookingData.pricing?.pricing.finalPrice || 0;
    
    // Track booking completion with conversion funnel
    if (isTrackingEnabled && bookingData.device && bookingData.repairType) {
      // Traditional booking completion tracking
      trackBookingCompleted(
        bookingId,
        bookingData.device.brand,
        bookingData.repairType,
        finalValue,
        'standard'
      );

      // Complete the conversion funnel
      bookingFunnel.completeFunnel({
        booking_id: bookingId,
        device_brand: bookingData.device.brand,
        device_model: bookingData.device.name,
        repair_type: bookingData.repairType,
        final_price: finalValue,
        estimated_time: bookingData.pricing?.repairDetails.estimatedTime,
        completion_timestamp: new Date().toISOString()
      });
    }
  };

  const resetBooking = () => {
    setCompletedBooking(null);
    setAiDiagnostic(null);
  };

  const handleAIDiagnosticComplete = (diagnostic: any) => {
    setAiDiagnostic(diagnostic);
    setShowAIAssistant(false);
    
    // Track AI assistant usage
    if (isTrackingEnabled) {
      trackFeatureUsage('ai_diagnostic_assistant', 'completed', {
        diagnostic_type: diagnostic?.repairType || 'unknown',
        device_type: diagnostic?.deviceType || 'unknown',
        estimated_price: diagnostic?.estimatedPrice || 0
      });
    }
    // Auto-fill the booking wizard with AI diagnostic results
  };

  const handleAIBookingRequest = (details: any) => {
    setShowAIAssistant(false);
    // Pre-populate booking form with AI recommendations
  };

  if (completedBooking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-2 bg-green-100 text-green-800 px-4 py-2 rounded-full mb-4">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">Booking Quote Generated!</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Your Repair Quote is Ready
            </h1>
            <p className="text-gray-600">
              Complete your booking to secure this pricing and schedule your repair service
            </p>
          </div>

          <Card className="p-8 mb-8">
            <h2 className="text-xl font-semibold mb-6">Booking Summary</h2>
            
            <div className="space-y-6">
              {/* Device Information */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Device Details</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="text-blue-700">Device:</span> {completedBooking.device?.brand} {completedBooking.device?.name}</p>
                  <p><span className="text-blue-700">Year:</span> {completedBooking.device?.year}</p>
                  {completedBooking.variant && (
                    <p><span className="text-blue-700">Configuration:</span> {completedBooking.variant.name}</p>
                  )}
                </div>
              </div>

              {/* Repair Information */}
              <div className="bg-amber-50 p-4 rounded-lg">
                <h3 className="font-medium text-amber-900 mb-2">Service Details</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="text-amber-700">Service Type:</span> {completedBooking.repairType?.replace('_', ' ')}</p>
                </div>
              </div>

              {/* Pricing Information */}
              {completedBooking.pricing && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-medium text-green-900 mb-2">Quote Details</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-green-700">Total Price:</span> £{completedBooking.pricing.pricing.finalPrice}</p>
                    <p><span className="text-green-700">Estimated Time:</span> {completedBooking.pricing.repairDetails.estimatedTime}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Call to Action */}
            <div className="mt-8 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button size="lg" className="w-full">
                  Complete Booking & Pay
                </Button>
                <Button variant="secondary" size="lg" className="w-full">
                  Save Quote for Later
                </Button>
              </div>
              
              {/* Trust Indicators */}
              <div className="pt-6 border-t">
                <div className="grid grid-cols-3 gap-4 text-center text-sm text-gray-600">
                  <div>
                    <div className="font-medium">✓ Free Diagnosis</div>
                    <div>No hidden costs</div>
                  </div>
                  <div>
                    <div className="font-medium">✓ 1-Year Warranty</div>
                    <div>On all repairs</div>
                  </div>
                  <div>
                    <div className="font-medium">✓ Expert Service</div>
                    <div>Certified technicians</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <div className="flex justify-center space-x-4">
            <Button onClick={resetBooking} variant="secondary">
              Start New Booking
            </Button>
            <Link href="/">
              <Button variant="secondary">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <BookingFlowAnalytics 
      currentStep={bookingFunnel.currentStep}
      totalSteps={bookingFunnel.totalSteps}
      deviceSelected={completedBooking?.device ? {
        brand: completedBooking.device.brand,
        model: completedBooking.device.name,
        type: 'device'
      } : undefined}
      repairType={completedBooking?.repairType}
      estimatedValue={completedBooking?.pricing?.pricing.finalPrice}
      sessionId={bookingFunnel.sessionId}
      funnelName="repair_booking"
      funnelSteps={[
        { id: 'landing', name: 'Landing Page', order: 1, required: true },
        { id: 'device_selection', name: 'Device Selection', order: 2, required: true },
        { id: 'issue_description', name: 'Issue Description', order: 3, required: true },
        { id: 'pricing_review', name: 'Pricing Review', order: 4, required: true },
        { id: 'contact_details', name: 'Contact Details', order: 5, required: true },
        { id: 'confirmation', name: 'Booking Confirmation', order: 6, required: true }
      ]}
    >
      <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full mb-3">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">Professional Repair Service</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Book Your Device Repair
              </h1>
              <p className="text-gray-600 max-w-2xl">
                Get an instant quote with our 3-step booking process. Select your device, describe the issue, and receive transparent pricing with expert service.
              </p>
            </div>
            <Link href="/">
              <Button variant="secondary">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>

        {/* AI Assistant CTA */}
        <Card className="p-6 mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Need Help Diagnosing Your Device?</h3>
                <p className="text-gray-600">Get instant AI-powered diagnostic assistance and repair recommendations</p>
              </div>
            </div>
            <Button 
              onClick={() => setShowAIAssistant(true)}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Start AI Diagnosis
            </Button>
          </div>
        </Card>


        {/* AI Diagnostic Results */}
        {aiDiagnostic && (
          <Card className="p-6 mb-8 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Brain className="w-5 h-5 text-blue-600 mr-2" />
              AI Diagnostic Results
            </h3>
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div>
                <div className="text-sm text-gray-600">Identified Issue</div>
                <div className="font-medium">{aiDiagnostic.issue}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Estimated Cost</div>
                <div className="font-medium">£{aiDiagnostic.estimatedCost.min} - £{aiDiagnostic.estimatedCost.max}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Estimated Time</div>
                <div className="font-medium">{aiDiagnostic.estimatedTime}</div>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Confidence: {aiDiagnostic.confidence}% | Use this information to guide your booking below.
            </p>
          </Card>
        )}

        {/* Modern Repair Booking Wizard */}
        <ModernRepairBookingWizard 
          onComplete={handleBookingComplete}
          aiDiagnostic={aiDiagnostic}
        />

        {/* AI Assistant Modal */}
        {showAIAssistant && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center">
                  <Brain className="w-5 h-5 text-blue-600 mr-2" />
                  AI Repair Assistant
                </h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowAIAssistant(false)}
                >
                  Close
                </Button>
              </div>
              <div className="p-4 max-h-[calc(90vh-120px)] overflow-auto">
                <IntelligentRepairChatbotAPI
                  onDiagnosticComplete={handleAIDiagnosticComplete}
                  onBookingRequested={handleAIBookingRequest}
                  className="h-[600px]"
                />
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </BookingFlowAnalytics>
  );
}