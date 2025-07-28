import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { DynamicForm } from '@/lib/forms/renderer';
import { FormData } from '@/lib/forms/schema';
import BookingFormConfig from '../../../config/forms/booking.form';
import Card from '@/components/ui/Card';
import { useServices } from '@/lib/services/serviceFactory';

// Estimate configuration
interface EstimateConfig {
  diagnosticFee: number;
  priorityFee: number;
  emergencyFee: number;
  pickupDeliveryFee: number;
  onSiteFee: number;
}

// Props interface
export interface BookingFormProps {
  variant?: 'simple' | 'comprehensive' | 'wizard';
  title?: {
    text: string;
    level?: 1 | 2 | 3 | 4 | 5 | 6;
  };
  description?: {
    text: string;
  };
  formConfig?: string; // Reference to form config
  onSubmit?: string; // Function name
  showEstimate?: boolean;
  estimateConfig?: EstimateConfig;
  className?: string;
}

// Estimate calculator component
interface EstimateDisplayProps {
  formData: FormData;
  config: EstimateConfig;
}

const EstimateDisplay: React.FC<EstimateDisplayProps> = ({ formData, config }) => {
  const [estimate, setEstimate] = useState<number>(0);
  const [breakdown, setBreakdown] = useState<Array<{ item: string; amount: number }>>([]);

  React.useEffect(() => {
    const calculateEstimate = () => {
      const items: Array<{ item: string; amount: number }> = [];
      let total = 0;

      // Base diagnostic fee
      items.push({ item: 'Diagnostic Fee', amount: config.diagnosticFee });
      total += config.diagnosticFee;

      // Urgency fees
      if (formData.urgency === 'priority') {
        items.push({ item: 'Priority Service', amount: config.priorityFee });
        total += config.priorityFee;
      } else if (formData.urgency === 'emergency') {
        items.push({ item: 'Emergency Service', amount: config.emergencyFee });
        total += config.emergencyFee;
      }

      // Service type fees
      if (formData.serviceType === 'pickup-delivery') {
        items.push({ item: 'Pickup & Delivery', amount: config.pickupDeliveryFee });
        total += config.pickupDeliveryFee;
      } else if (formData.serviceType === 'on-site') {
        items.push({ item: 'On-site Service', amount: config.onSiteFee });
        total += config.onSiteFee;
      }

      setBreakdown(items);
      setEstimate(total);
    };

    calculateEstimate();
  }, [formData, config]);

  if (breakdown.length === 0) return null;

  return (
    <Card variant="outlined" className="sticky top-4">
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">Service Estimate</h3>
        
        <div className="space-y-3">
          {breakdown.map((item, index) => (
            <div key={index} className="flex justify-between">
              <span className="text-muted-foreground">{item.item}</span>
              <span className="font-medium">£{item.amount}</span>
            </div>
          ))}
          
          <div className="border-t pt-3">
            <div className="flex justify-between text-lg font-semibold">
              <span>Total Service Fees</span>
              <span>£{estimate}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-muted rounded-md">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> This covers service fees only. Repair costs (parts + labor) 
            will be quoted after diagnosis. Diagnostic fee is waived if repair is completed.
          </p>
        </div>
      </div>
    </Card>
  );
};

// Success message component
const BookingSuccess: React.FC<{ bookingId: string }> = ({ bookingId }) => (
  <Card variant="elevated" className="text-center p-8">
    <div className="space-y-4">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <span className="text-2xl">✅</span>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-green-700">Booking Confirmed!</h3>
        <p className="text-muted-foreground">
          Your repair booking has been successfully submitted.
        </p>
      </div>
      
      <div className="bg-muted p-4 rounded-md">
        <p className="font-medium">Booking Reference: <span className="font-mono">{bookingId}</span></p>
        <p className="text-sm text-muted-foreground mt-1">
          Save this reference for tracking your repair.
        </p>
      </div>
      
      <div className="space-y-2 text-sm text-muted-foreground">
        <p>📧 Confirmation email sent</p>
        <p>📱 SMS updates will be sent to your phone</p>
        <p>⏰ We'll contact you within 24 hours to confirm your appointment</p>
      </div>
    </div>
  </Card>
);

// Error message component
const BookingError: React.FC<{ error: string; onRetry: () => void }> = ({ error, onRetry }) => (
  <Card variant="outlined" className="text-center p-8 border-destructive">
    <div className="space-y-4">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
        <span className="text-2xl">❌</span>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-destructive">Booking Failed</h3>
        <p className="text-muted-foreground">
          {error || 'Something went wrong while processing your booking.'}
        </p>
      </div>
      
      <button
        onClick={onRetry}
        className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
      >
        Try Again
      </button>
      
      <p className="text-sm text-muted-foreground">
        Need help? Call us at <a href="tel:+442012345678" className="text-primary">+44 20 1234 5678</a>
      </p>
    </div>
  </Card>
);

// Main BookingForm component
export const BookingForm: React.FC<BookingFormProps> = ({
  variant = 'comprehensive',
  title,
  description,
  formConfig,
  onSubmit,
  showEstimate = false,
  estimateConfig,
  className,
}) => {
  const [formData, setFormData] = useState<FormData>({});
  const [submissionState, setSubmissionState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [bookingId, setBookingId] = useState<string>('');
  const [error, setError] = useState<string>('');
  
  // Get booking service from service factory
  const { booking } = useServices();

  const TitleTag = title?.level ? (`h${title.level}` as any) : 'h2';

  // Handle form submission
  const handleSubmit = async (data: FormData) => {
    setSubmissionState('submitting');
    setError('');

    try {
      // Submit booking using real API service
      const response = await booking.submitBooking(data);
      
      // Extract booking ID from response
      const bookingData = response.data;
      setBookingId(bookingData.bookingId || bookingData.id || `REV-${Date.now()}`);
      setSubmissionState('success');

    } catch (err: any) {
      console.error('Booking submission error:', err);
      let errorMessage = 'Failed to submit booking';
      
      // Handle different error types
      if (err.status === 400 && err.data?.details) {
        errorMessage = `Validation error: ${err.data.details.join(', ')}`;
      } else if (err.status === 401) {
        errorMessage = 'Authentication required. Please log in and try again.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setSubmissionState('error');
    }
  };

  // Handle form data changes
  const handleFormChange = (data: FormData) => {
    setFormData(data);
  };

  // Handle retry
  const handleRetry = () => {
    setSubmissionState('idle');
    setError('');
  };

  // Show success state
  if (submissionState === 'success') {
    return (
      <div className={cn("space-y-6", className)}>
        <BookingSuccess bookingId={bookingId} />
      </div>
    );
  }

  // Show error state
  if (submissionState === 'error') {
    return (
      <div className={cn("space-y-6", className)}>
        <BookingError error={error} onRetry={handleRetry} />
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Section Header */}
      {(title || description) && (
        <div className="space-y-2">
          {title && (
            <TitleTag className="text-2xl font-bold">
              {title.text}
            </TitleTag>
          )}
          {description && (
            <p className="text-muted-foreground">
              {description.text}
            </p>
          )}
        </div>
      )}

      <div className={cn(
        "grid gap-8",
        showEstimate && estimateConfig ? "lg:grid-cols-3" : "grid-cols-1"
      )}>
        {/* Main Form */}
        <div className={cn(
          showEstimate && estimateConfig ? "lg:col-span-2" : "col-span-1"
        )}>
          <DynamicForm
            config={BookingFormConfig}
            onSubmit={handleSubmit}
            onChange={handleFormChange}
            className="space-y-6"
          />
        </div>

        {/* Estimate Sidebar */}
        {showEstimate && estimateConfig && (
          <div>
            <EstimateDisplay 
              formData={formData} 
              config={estimateConfig} 
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingForm;