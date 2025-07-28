/**
 * Booking Flow Analytics Tracker
 * RevivaTech Conversion Tracking Component
 * 
 * Automatically tracks key events in the booking funnel
 * Provides detailed analytics for conversion optimization
 */

'use client';

import React, { useEffect, useRef } from 'react';
import useEventTracking from '@/hooks/useEventTracking';

interface BookingFlowTrackerProps {
  step: 'device_selection' | 'pricing' | 'details' | 'confirmation' | 'completed';
  deviceType?: string;
  deviceModel?: string;
  repairType?: string;
  serviceLevel?: string;
  quoteValue?: number;
  bookingId?: string;
  children?: React.ReactNode;
}

const BookingFlowTracker: React.FC<BookingFlowTrackerProps> = ({
  step,
  deviceType,
  deviceModel,
  repairType,
  serviceLevel,
  quoteValue,
  bookingId,
  children
}) => {
  const {
    trackDeviceSelection,
    trackQuoteRequest,
    trackBookingInitiated,
    trackBookingCompleted,
    trackFormInteraction,
    isTrackingEnabled
  } = useEventTracking();

  const hasTrackedStep = useRef<Set<string>>(new Set());

  // Track step entry
  useEffect(() => {
    if (!isTrackingEnabled) return;

    const stepKey = `${step}-${deviceType}-${repairType}`;
    
    // Prevent duplicate tracking for the same step
    if (hasTrackedStep.current.has(stepKey)) return;
    hasTrackedStep.current.add(stepKey);

    switch (step) {
      case 'device_selection':
        if (deviceType && deviceModel && repairType) {
          trackDeviceSelection(deviceType, deviceModel, repairType);
        }
        trackFormInteraction('booking_flow', 'start', 'device_selection');
        break;

      case 'pricing':
        if (deviceType && repairType) {
          trackQuoteRequest(deviceType, repairType, quoteValue);
        }
        break;

      case 'details':
        trackFormInteraction('booking_flow', 'start', 'customer_details');
        break;

      case 'confirmation':
        if (deviceType && repairType && serviceLevel) {
          trackBookingInitiated(deviceType, repairType, serviceLevel);
        }
        break;

      case 'completed':
        if (bookingId && deviceType && repairType && quoteValue && serviceLevel) {
          trackBookingCompleted(bookingId, deviceType, repairType, quoteValue, serviceLevel);
        }
        trackFormInteraction('booking_flow', 'complete');
        break;
    }
  }, [
    step,
    deviceType,
    deviceModel,
    repairType,
    serviceLevel,
    quoteValue,
    bookingId,
    trackDeviceSelection,
    trackQuoteRequest,
    trackBookingInitiated,
    trackBookingCompleted,
    trackFormInteraction,
    isTrackingEnabled
  ]);

  // Clean up tracking state when component unmounts
  useEffect(() => {
    return () => {
      hasTrackedStep.current.clear();
    };
  }, []);

  return <>{children}</>;
};

// Higher-order component for wrapping booking steps
export const withBookingTracking = <P extends object>(
  Component: React.ComponentType<P>,
  step: BookingFlowTrackerProps['step']
) => {
  const WrappedComponent = (props: P & Partial<BookingFlowTrackerProps>) => {
    const {
      deviceType,
      deviceModel,
      repairType,
      serviceLevel,
      quoteValue,
      bookingId,
      ...componentProps
    } = props;

    return (
      <BookingFlowTracker
        step={step}
        deviceType={deviceType}
        deviceModel={deviceModel}
        repairType={repairType}
        serviceLevel={serviceLevel}
        quoteValue={quoteValue}
        bookingId={bookingId}
      >
        <Component {...(componentProps as P)} />
      </BookingFlowTracker>
    );
  };

  WrappedComponent.displayName = `withBookingTracking(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Hook for manual tracking within booking components
export const useBookingStepTracking = () => {
  const {
    trackDeviceSelection,
    trackQuoteRequest,
    trackBookingInitiated,
    trackBookingCompleted,
    trackFormInteraction,
    isTrackingEnabled
  } = useEventTracking();

  const trackStepInteraction = (
    step: string,
    action: string,
    data?: Record<string, any>
  ) => {
    if (!isTrackingEnabled) return;

    trackFormInteraction(`booking_${step}`, action as any, data?.field);
  };

  const trackPricingInteraction = (
    deviceType: string,
    repairType: string,
    priceRange: { min: number; max: number }
  ) => {
    if (!isTrackingEnabled) return;

    trackQuoteRequest(deviceType, repairType, (priceRange.min + priceRange.max) / 2);
  };

  const trackServiceLevelSelection = (
    serviceLevel: string,
    additionalCost: number = 0
  ) => {
    if (!isTrackingEnabled) return;

    trackFormInteraction('service_level_selection', 'complete', serviceLevel);
  };

  return {
    trackStepInteraction,
    trackPricingInteraction,
    trackServiceLevelSelection,
    isTrackingEnabled
  };
};

export default BookingFlowTracker;