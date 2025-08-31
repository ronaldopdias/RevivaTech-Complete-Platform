import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Checkbox from '@/components/ui/Checkbox';
import { User, CircleCheck, Mail, Phone, MapPin } from 'lucide-react';

interface ProfileCompletionFormProps {
  userId: string;
  onSuccess?: () => void;
  onSkip?: () => void;
  className?: string;
}

interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  profilePicture?: string;
  locale?: string;
  isGoogleUser: boolean;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  acceptTerms: boolean;
}

export const ProfileCompletionForm: React.FC<ProfileCompletionFormProps> = ({
  userId,
  onSuccess,
  onSkip,
  className,
}) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    acceptTerms: false,
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUserData, setIsLoadingUserData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user data for pre-filling
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const response = await fetch(`/api/profile-completion/user-data/${userId}`);
        const data = await response.json();
        
        if (data.success) {
          setUserData(data.user);
          setFormData({
            firstName: data.user.firstName || '',
            lastName: data.user.lastName || '',
            email: data.user.email || '',
            phone: data.user.phone || '',
            acceptTerms: false,
          });
        } else {
          setError(data.error || 'Failed to load user data');
        }
      } catch (err) {
        setError('Failed to load user data');
        console.error('Failed to load user data:', err);
      } finally {
        setIsLoadingUserData(false);
      }
    };

    if (userId) {
      loadUserData();
    }
  }, [userId]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // First Name
    if (!formData.firstName) {
      errors.firstName = 'First name is required';
    } else if (formData.firstName.length < 2) {
      errors.firstName = 'First name must be at least 2 characters';
    }

    // Last Name
    if (!formData.lastName) {
      errors.lastName = 'Last name is required';
    } else if (formData.lastName.length < 2) {
      errors.lastName = 'Last name must be at least 2 characters';
    }

    // Email
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }

    // Phone (required for completion)
    if (!formData.phone) {
      errors.phone = 'Phone number is required';
    } else if (!/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      errors.phone = 'Please enter a valid phone number';
    }

    // Terms acceptance
    if (!formData.acceptTerms) {
      errors.acceptTerms = 'You must accept the terms and conditions';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/profile-completion/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        onSuccess?.();
      } else {
        setError(data.error || 'Failed to complete profile');
      }
    } catch (err) {
      setError('Failed to complete profile. Please try again.');
      console.error('Profile completion error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    if (!onSkip) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/profile-completion/skip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();
      if (data.success) {
        onSkip();
      }
    } catch (err) {
      console.error('Skip error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  if (isLoadingUserData) {
    return (
      <div className={cn("w-full max-w-md mx-auto", className)}>
        <Card className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">Loading your profile...</span>
          </div>
        </Card>
      </div>
    );
  }

  if (error && !userData) {
    return (
      <div className={cn("w-full max-w-md mx-auto", className)}>
        <Card className="p-6">
          <div className="text-center py-8">
            <div className="text-red-600 mb-4">{error}</div>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("w-full max-w-md mx-auto", className)}>
      <Card className="p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="flex justify-center mb-4">
              {userData?.profilePicture ? (
                <img 
                  src={userData.profilePicture} 
                  alt="Profile" 
                  className="w-16 h-16 rounded-full"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-8 w-8 text-primary" />
                </div>
              )}
            </div>
            <h1 className="text-2xl font-semibold mb-2">Complete Your Profile</h1>
            <p className="text-muted-foreground text-sm">
              {userData?.isGoogleUser 
                ? "We've pre-filled your information from Google. Please add your phone number to complete your registration."
                : "Please complete your profile to continue."
              }
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className={cn("pl-10", validationErrors.firstName && "border-red-500")}
                  placeholder="First name"
                  required
                />
              </div>
              {validationErrors.firstName && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.firstName}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className={cn("pl-10", validationErrors.lastName && "border-red-500")}
                  placeholder="Last name"
                  required
                />
              </div>
              {validationErrors.lastName && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.lastName}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={cn("pl-10", validationErrors.email && "border-red-500")}
                  placeholder="your.email@example.com"
                  required
                />
              </div>
              {validationErrors.email && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number * <span className="text-primary">(Required to complete)</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={cn("pl-10", validationErrors.phone && "border-red-500")}
                  placeholder="+44 7700 900123"
                  required
                />
              </div>
              {validationErrors.phone && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.phone}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                We need your phone number to contact you about your repairs
              </p>
            </div>

            {/* Terms Acceptance */}
            <div>
              <Checkbox
                checked={formData.acceptTerms}
                onCheckedChange={(checked) => handleInputChange('acceptTerms', checked as boolean)}
                className={cn(validationErrors.acceptTerms && "border-red-500")}
              >
                I accept the{' '}
                <a href="/terms" target="_blank" className="text-primary hover:underline">
                  Terms and Conditions
                </a>{' '}
                and{' '}
                <a href="/privacy" target="_blank" className="text-primary hover:underline">
                  Privacy Policy
                </a>
              </Checkbox>
              {validationErrors.acceptTerms && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.acceptTerms}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Completing Profile...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <CircleCheck className="h-4 w-4 mr-2" />
                    Complete Profile
                  </div>
                )}
              </Button>

              {onSkip && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleSkip}
                  className="w-full"
                  disabled={isLoading}
                >
                  Skip for Now
                </Button>
              )}
            </div>
          </form>

          {/* Google Info */}
          {userData?.isGoogleUser && (
            <div className="text-center text-xs text-muted-foreground">
              <MapPin className="inline h-3 w-3 mr-1" />
              Information pre-filled from your Google account
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};