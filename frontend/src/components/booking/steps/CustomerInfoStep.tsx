import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';

export interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    postcode: string;
    country: string;
  };
  preferredContact: 'email' | 'phone' | 'sms';
  marketingConsent: boolean;
}

export interface AppointmentPreferences {
  preferredDate?: Date;
  preferredTime?: string;
  serviceType: 'postal' | 'pickup' | 'in-store';
  notes: string;
}

export interface CustomerInfoStepProps {
  customerInfo: CustomerInfo;
  appointmentPreferences: AppointmentPreferences;
  onCustomerInfoChange: (info: CustomerInfo) => void;
  onAppointmentPreferencesChange: (preferences: AppointmentPreferences) => void;
  className?: string;
}

// Form validation
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone: string): boolean => {
  // UK phone number validation (basic)
  const phoneRegex = /^(\+44|0)[0-9]{10,11}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

const validatePostcode = (postcode: string): boolean => {
  // UK postcode validation (basic)
  const postcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i;
  return postcodeRegex.test(postcode);
};

// Service type options
const serviceTypes = [
  {
    key: 'postal' as const,
    title: 'Postal Service',
    description: 'Send your device via post with our secure packaging',
    details: 'Free insured postage both ways • 2-3 days each direction',
    icon: '📦',
    cost: 'FREE',
  },
  {
    key: 'pickup' as const,
    title: 'Pickup & Delivery',
    description: 'We collect and return your device to your address',
    details: 'Same day pickup available • Door-to-door service',
    icon: '🚗',
    cost: '+£25',
  },
  {
    key: 'in-store' as const,
    title: 'In-Store Service',
    description: 'Visit our repair center for immediate assessment',
    details: 'Instant diagnosis • Watch repair process • Same day service',
    icon: '🏪',
    cost: 'FREE',
  },
];

// Time slot options
const timeSlots = [
  '09:00-10:00',
  '10:00-11:00',
  '11:00-12:00',
  '12:00-13:00',
  '13:00-14:00',
  '14:00-15:00',
  '15:00-16:00',
  '16:00-17:00',
  '17:00-18:00',
];

export const CustomerInfoStep: React.FC<CustomerInfoStepProps> = ({
  customerInfo,
  appointmentPreferences,
  onCustomerInfoChange,
  onAppointmentPreferencesChange,
  className,
}) => {
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Validation effect
  useEffect(() => {
    const errors: Record<string, string> = {};

    if (customerInfo.firstName && customerInfo.firstName.trim().length < 2) {
      errors.firstName = 'First name must be at least 2 characters';
    }

    if (customerInfo.lastName && customerInfo.lastName.trim().length < 2) {
      errors.lastName = 'Last name must be at least 2 characters';
    }

    if (customerInfo.email && !validateEmail(customerInfo.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (customerInfo.phone && !validatePhone(customerInfo.phone)) {
      errors.phone = 'Please enter a valid UK phone number';
    }

    if (customerInfo.address.postcode && !validatePostcode(customerInfo.address.postcode)) {
      errors.postcode = 'Please enter a valid UK postcode';
    }

    setValidationErrors(errors);
  }, [customerInfo]);

  const updateCustomerInfo = (field: keyof CustomerInfo | string, value: any) => {
    if (field.includes('.')) {
      // Handle nested fields like address.street
      const [parent, child] = field.split('.');
      onCustomerInfoChange({
        ...customerInfo,
        [parent]: {
          ...customerInfo[parent as keyof CustomerInfo],
          [child]: value,
        },
      });
    } else {
      onCustomerInfoChange({
        ...customerInfo,
        [field]: value,
      });
    }
  };

  const updateAppointmentPreferences = (field: keyof AppointmentPreferences, value: any) => {
    onAppointmentPreferencesChange({
      ...appointmentPreferences,
      [field]: value,
    });
  };

  const isFormValid = () => {
    return (
      customerInfo.firstName.trim() &&
      customerInfo.lastName.trim() &&
      validateEmail(customerInfo.email) &&
      validatePhone(customerInfo.phone) &&
      customerInfo.address.street.trim() &&
      customerInfo.address.city.trim() &&
      validatePostcode(customerInfo.address.postcode) &&
      Object.keys(validationErrors).length === 0
    );
  };

  // Get minimum date (tomorrow)
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateString = minDate.toISOString().split('T')[0];

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Your Contact Details</h2>
        <p className="text-muted-foreground">
          We'll use this information to keep you updated about your repair
        </p>
      </div>

      {/* Personal Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              First Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={customerInfo.firstName}
              onChange={(e) => updateCustomerInfo('firstName', e.target.value)}
              placeholder="Enter your first name"
              className={cn(validationErrors.firstName && 'border-red-500')}
            />
            {validationErrors.firstName && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.firstName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Last Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={customerInfo.lastName}
              onChange={(e) => updateCustomerInfo('lastName', e.target.value)}
              placeholder="Enter your last name"
              className={cn(validationErrors.lastName && 'border-red-500')}
            />
            {validationErrors.lastName && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.lastName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Email Address <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              value={customerInfo.email}
              onChange={(e) => updateCustomerInfo('email', e.target.value)}
              placeholder="your.email@example.com"
              className={cn(validationErrors.email && 'border-red-500')}
            />
            {validationErrors.email && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <Input
              type="tel"
              value={customerInfo.phone}
              onChange={(e) => updateCustomerInfo('phone', e.target.value)}
              placeholder="07123 456789 or +44 7123 456789"
              className={cn(validationErrors.phone && 'border-red-500')}
            />
            {validationErrors.phone && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.phone}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Address Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Address Information</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Required for pickup/delivery service and warranty purposes
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Street Address <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={customerInfo.address.street}
              onChange={(e) => updateCustomerInfo('address.street', e.target.value)}
              placeholder="123 High Street, Apartment 4B"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                City <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={customerInfo.address.city}
                onChange={(e) => updateCustomerInfo('address.city', e.target.value)}
                placeholder="London"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Postcode <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={customerInfo.address.postcode}
                onChange={(e) => updateCustomerInfo('address.postcode', e.target.value.toUpperCase())}
                placeholder="SW1A 1AA"
                className={cn(validationErrors.postcode && 'border-red-500')}
              />
              {validationErrors.postcode && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.postcode}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Country</label>
              <select
                value={customerInfo.address.country}
                onChange={(e) => updateCustomerInfo('address.country', e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="UK">United Kingdom</option>
                <option value="IE">Ireland</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Service Type Selection */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Service Type</h3>
        <p className="text-sm text-muted-foreground mb-4">
          How would you like to get your device to us?
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {serviceTypes.map((service) => {
            const isSelected = appointmentPreferences.serviceType === service.key;
            
            return (
              <Card
                key={service.key}
                variant="outlined"
                className={cn(
                  'p-4 cursor-pointer transition-all hover:shadow-md',
                  isSelected 
                    ? 'border-primary bg-primary/5 shadow-sm' 
                    : 'hover:border-primary/50'
                )}
                onClick={() => updateAppointmentPreferences('serviceType', service.key)}
              >
                <div className="text-center space-y-3">
                  <div className="text-3xl">{service.icon}</div>
                  <div className={cn(
                    'w-4 h-4 rounded-full border-2 mx-auto',
                    isSelected 
                      ? 'bg-primary border-primary' 
                      : 'border-border'
                  )}></div>
                  <div>
                    <h4 className="font-semibold">{service.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {service.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {service.details}
                    </p>
                    <div className="mt-2">
                      <span className={cn(
                        'text-sm font-medium',
                        service.cost === 'FREE' ? 'text-green-600' : 'text-orange-600'
                      )}>
                        {service.cost}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </Card>

      {/* Appointment Scheduling */}
      {(appointmentPreferences.serviceType === 'pickup' || appointmentPreferences.serviceType === 'in-store') && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            {appointmentPreferences.serviceType === 'pickup' ? 'Pickup' : 'Appointment'} Scheduling
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Preferred Date
              </label>
              <Input
                type="date"
                min={minDateString}
                value={appointmentPreferences.preferredDate?.toISOString().split('T')[0] || ''}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : undefined;
                  updateAppointmentPreferences('preferredDate', date);
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Preferred Time
              </label>
              <select
                value={appointmentPreferences.preferredTime || ''}
                onChange={(e) => updateAppointmentPreferences('preferredTime', e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Select a time slot</option>
                {timeSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>
      )}

      {/* Communication Preferences */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Communication Preferences</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-3">
              How would you prefer to be contacted about your repair?
            </label>
            <div className="space-y-2">
              {[
                { key: 'email' as const, label: 'Email', icon: '📧' },
                { key: 'phone' as const, label: 'Phone Call', icon: '📞' },
                { key: 'sms' as const, label: 'Text Message (SMS)', icon: '💬' },
              ].map((option) => (
                <label key={option.key} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="preferredContact"
                    value={option.key}
                    checked={customerInfo.preferredContact === option.key}
                    onChange={(e) => updateCustomerInfo('preferredContact', e.target.value)}
                    className="w-4 h-4 text-primary"
                  />
                  <span className="text-lg">{option.icon}</span>
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={customerInfo.marketingConsent}
                onChange={(e) => updateCustomerInfo('marketingConsent', e.target.checked)}
                className="w-4 h-4 text-primary mt-1"
              />
              <div className="text-sm">
                <span className="font-medium">
                  I would like to receive updates about special offers and new services
                </span>
                <p className="text-muted-foreground mt-1">
                  You can unsubscribe at any time. We never share your information with third parties.
                </p>
              </div>
            </label>
          </div>
        </div>
      </Card>

      {/* Additional Notes */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Additional Notes</h3>
        <Textarea
          placeholder="Any special instructions, access codes, or additional information that might help us serve you better..."
          value={appointmentPreferences.notes}
          onChange={(e) => updateAppointmentPreferences('notes', e.target.value)}
          rows={3}
          className="w-full resize-none"
        />
      </Card>

      {/* Form Validation Summary */}
      <Card className="p-4 bg-muted/50">
        <h4 className="font-semibold mb-2">Form Completion Status</h4>
        <div className="space-y-1 text-sm">
          <div className="flex items-center justify-between">
            <span>Contact Information:</span>
            {isFormValid() ? (
              <span className="text-green-600 flex items-center gap-1">
                <span>✓</span> Complete
              </span>
            ) : (
              <span className="text-red-500">Required fields missing</span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span>Service Type:</span>
            <span className="text-green-600 flex items-center gap-1">
              <span>✓</span> {serviceTypes.find(s => s.key === appointmentPreferences.serviceType)?.title}
            </span>
          </div>
          {Object.keys(validationErrors).length > 0 && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
              Please fix the validation errors above to continue.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default CustomerInfoStep;