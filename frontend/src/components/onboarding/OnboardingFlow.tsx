'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, ChevronRight, ChevronLeft, X, Rocket, Shield, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  component: React.ComponentType<OnboardingStepProps>;
  optional?: boolean;
  completed?: boolean;
}

interface OnboardingStepProps {
  onNext: () => void;
  onPrevious: () => void;
  onSkip?: () => void;
  onComplete: (data?: any) => void;
  data?: any;
}

interface OnboardingFlowProps {
  userType: 'new' | 'returning' | 'guest';
  onComplete: (data: any) => void;
  onSkip: () => void;
  showWelcome?: boolean;
}

// Welcome Step Component
const WelcomeStep = ({ onNext, onComplete }: OnboardingStepProps) => {
  return (
    <div className="text-center space-y-6">
      <div className="space-y-4">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
          <Rocket className="w-10 h-10 text-blue-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Welcome to RevivaTech!</h2>
        <p className="text-lg text-gray-600 max-w-md mx-auto">
          Professional device repair services with real-time tracking and transparent pricing.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
        <div className="text-center p-4">
          <Shield className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <h3 className="font-semibold text-gray-900">Secure & Trusted</h3>
          <p className="text-sm text-gray-600">Your devices and data are safe with us</p>
        </div>
        <div className="text-center p-4">
          <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <h3 className="font-semibold text-gray-900">Fast Turnaround</h3>
          <p className="text-sm text-gray-600">Quick repairs without compromising quality</p>
        </div>
        <div className="text-center p-4">
          <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
          <h3 className="font-semibold text-gray-900">Expert Support</h3>
          <p className="text-sm text-gray-600">Professional technicians at your service</p>
        </div>
      </div>

      <div className="space-y-3">
        <Button onClick={onNext} className="w-full" size="lg">
          Get Started
        </Button>
        <p className="text-sm text-gray-500">
          This quick setup will help us provide you with the best service
        </p>
      </div>
    </div>
  );
};

// Profile Setup Step
const ProfileSetupStep = ({ onNext, onPrevious, onComplete, data = {} }: OnboardingStepProps) => {
  const [formData, setFormData] = useState({
    firstName: data.firstName || '',
    lastName: data.lastName || '',
    phone: data.phone || '',
    location: data.location || '',
    preferredContact: data.preferredContact || 'email',
    ...data,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(formData);
  };

  const isValid = formData.firstName.trim() && formData.lastName.trim();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Let's get to know you</h2>
        <p className="text-gray-600">This helps us personalize your experience</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name *
            </label>
            <Input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
              placeholder="Enter your first name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name *
            </label>
            <Input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
              placeholder="Enter your last name"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number (Optional)
          </label>
          <Input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="+44 7XXX XXXXXX"
          />
          <p className="text-xs text-gray-500 mt-1">
            We'll use this for repair updates and appointment confirmations
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location (Optional)
          </label>
          <Input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            placeholder="e.g., London, Manchester"
          />
          <p className="text-xs text-gray-500 mt-1">
            Helps us provide relevant service options
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preferred Contact Method
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="preferredContact"
                value="email"
                checked={formData.preferredContact === 'email'}
                onChange={(e) => setFormData(prev => ({ ...prev, preferredContact: e.target.value }))}
                className="mr-2"
              />
              Email notifications
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="preferredContact"
                value="sms"
                checked={formData.preferredContact === 'sms'}
                onChange={(e) => setFormData(prev => ({ ...prev, preferredContact: e.target.value }))}
                className="mr-2"
              />
              SMS updates
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="preferredContact"
                value="both"
                checked={formData.preferredContact === 'both'}
                onChange={(e) => setFormData(prev => ({ ...prev, preferredContact: e.target.value }))}
                className="mr-2"
              />
              Both email and SMS
            </label>
          </div>
        </div>
      </form>

      <div className="flex justify-between">
        <Button type="button" variant="secondary" onClick={onPrevious}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button 
          type="button" 
          onClick={handleSubmit}
          disabled={!isValid}
        >
          Continue
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

// Preferences Step
const PreferencesStep = ({ onNext, onPrevious, onComplete, data = {} }: OnboardingStepProps) => {
  const [preferences, setPreferences] = useState({
    notifications: {
      repair_updates: data.notifications?.repair_updates ?? true,
      promotional: data.notifications?.promotional ?? false,
      newsletter: data.notifications?.newsletter ?? false,
      security_alerts: data.notifications?.security_alerts ?? true,
    },
    privacy: {
      analytics: data.privacy?.analytics ?? true,
      marketing: data.privacy?.marketing ?? false,
      third_party: data.privacy?.third_party ?? false,
    },
    services: {
      interested_in: data.services?.interested_in || [],
    },
  });

  const serviceOptions = [
    { id: 'phone_repair', label: 'Phone & Tablet Repair' },
    { id: 'laptop_repair', label: 'Laptop & Computer Repair' },
    { id: 'console_repair', label: 'Gaming Console Repair' },
    { id: 'data_recovery', label: 'Data Recovery Services' },
    { id: 'business_support', label: 'Business IT Support' },
  ];

  const handleServiceToggle = (serviceId: string) => {
    setPreferences(prev => ({
      ...prev,
      services: {
        ...prev.services,
        interested_in: prev.services.interested_in.includes(serviceId)
          ? prev.services.interested_in.filter(id => id !== serviceId)
          : [...prev.services.interested_in, serviceId],
      },
    }));
  };

  const handleSubmit = () => {
    onComplete(preferences);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Customize your experience</h2>
        <p className="text-gray-600">Set your preferences for notifications and services</p>
      </div>

      <div className="space-y-6">
        {/* Notification Preferences */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Notifications</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Repair Updates</p>
                <p className="text-sm text-gray-600">Get notified about your repair progress</p>
              </div>
              <Checkbox
                checked={preferences.notifications.repair_updates}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, repair_updates: checked as boolean }
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Security Alerts</p>
                <p className="text-sm text-gray-600">Important security notifications</p>
              </div>
              <Checkbox
                checked={preferences.notifications.security_alerts}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, security_alerts: checked as boolean }
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Newsletter</p>
                <p className="text-sm text-gray-600">Tips, news, and special offers</p>
              </div>
              <Checkbox
                checked={preferences.notifications.newsletter}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, newsletter: checked as boolean }
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Promotional Offers</p>
                <p className="text-sm text-gray-600">Exclusive deals and discounts</p>
              </div>
              <Checkbox
                checked={preferences.notifications.promotional}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, promotional: checked as boolean }
                  }))
                }
              />
            </div>
          </div>
        </div>

        {/* Services of Interest */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Services You're Interested In</h3>
          <p className="text-sm text-gray-600 mb-3">
            Help us show you relevant content and offers
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {serviceOptions.map(service => (
              <div 
                key={service.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  preferences.services.interested_in.includes(service.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleServiceToggle(service.id)}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{service.label}</span>
                  <Checkbox
                    checked={preferences.services.interested_in.includes(service.id)}
                    readOnly
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy Settings */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Privacy</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Analytics</p>
                <p className="text-sm text-gray-600">Help improve our service with usage data</p>
              </div>
              <Checkbox
                checked={preferences.privacy.analytics}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({
                    ...prev,
                    privacy: { ...prev.privacy, analytics: checked as boolean }
                  }))
                }
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="secondary" onClick={onPrevious}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button onClick={handleSubmit}>
          Continue
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

// Completion Step
const CompletionStep = ({ onComplete }: OnboardingStepProps) => {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  const quickActions = [
    {
      id: 'book_repair',
      title: 'Book a Repair',
      description: 'Get your device fixed by our experts',
      action: '/booking',
      icon: '🔧',
    },
    {
      id: 'explore_services',
      title: 'Explore Services',
      description: 'See what we can repair for you',
      action: '/services',
      icon: '📱',
    },
    {
      id: 'customer_portal',
      title: 'Visit Portal',
      description: 'Access your customer dashboard',
      action: '/customer-portal',
      icon: '🏠',
    },
    {
      id: 'contact_support',
      title: 'Contact Support',
      description: 'Get help from our team',
      action: '/contact',
      icon: '💬',
    },
  ];

  const handleActionClick = (action: string) => {
    setSelectedAction(action);
    setTimeout(() => {
      const quickAction = quickActions.find(qa => qa.id === action);
      if (quickAction) {
        window.location.href = quickAction.action;
      }
    }, 500);
  };

  return (
    <div className="text-center space-y-6">
      <div className="space-y-4">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900">All set!</h2>
        <p className="text-lg text-gray-600 max-w-md mx-auto">
          Your account is ready. Here are some quick actions to get you started.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
        {quickActions.map(action => (
          <Card
            key={action.id}
            className={`p-4 cursor-pointer transition-all hover:shadow-md ${
              selectedAction === action.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
            }`}
            onClick={() => handleActionClick(action.id)}
          >
            <div className="text-center space-y-2">
              <div className="text-2xl">{action.icon}</div>
              <h3 className="font-semibold text-gray-900">{action.title}</h3>
              <p className="text-sm text-gray-600">{action.description}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        <Button onClick={() => onComplete()} variant="secondary" className="w-full">
          Skip for now - Take me to dashboard
        </Button>
        <p className="text-sm text-gray-500">
          You can always access these features from your dashboard
        </p>
      </div>
    </div>
  );
};

// Main Onboarding Flow Component
const OnboardingFlow = ({ 
  userType, 
  onComplete, 
  onSkip, 
  showWelcome = true 
}: OnboardingFlowProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [collectedData, setCollectedData] = useState({});

  const steps: OnboardingStep[] = [
    ...(showWelcome ? [{
      id: 'welcome',
      title: 'Welcome',
      description: 'Welcome to RevivaTech',
      icon: <Rocket className="w-5 h-5" />,
      component: WelcomeStep,
    }] : []),
    {
      id: 'profile',
      title: 'Profile',
      description: 'Set up your profile',
      icon: <Users className="w-5 h-5" />,
      component: ProfileSetupStep,
    },
    {
      id: 'preferences',
      title: 'Preferences',
      description: 'Customize your experience',
      icon: <Shield className="w-5 h-5" />,
      component: PreferencesStep,
      optional: true,
    },
    {
      id: 'completion',
      title: 'Complete',
      description: 'Get started',
      icon: <CheckCircle className="w-5 h-5" />,
      component: CompletionStep,
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepComplete = (data?: any) => {
    if (data) {
      setCollectedData(prev => ({ ...prev, [steps[currentStep].id]: data }));
    }
    
    if (currentStep === steps.length - 1) {
      // Final completion
      onComplete({ ...collectedData, [steps[currentStep].id]: data });
      setIsVisible(false);
    } else {
      handleNext();
    }
  };

  const handleSkipOnboarding = () => {
    onSkip();
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-900">Account Setup</h1>
            <div className="flex items-center space-x-2">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index <= currentStep ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              onClick={handleSkipOnboarding}
              className="text-gray-500 hover:text-gray-700"
            >
              Skip setup
            </Button>
            <Button
              variant="ghost"
              onClick={handleSkipOnboarding}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Step Progress */}
        <div className="px-6 py-3 bg-gray-50 border-b">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
            </span>
            <span className="text-gray-500">
              {Math.round(((currentStep + 1) / steps.length) * 100)}% complete
            </span>
          </div>
          <div className="mt-2 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <CurrentStepComponent
            onNext={handleNext}
            onPrevious={handlePrevious}
            onComplete={handleStepComplete}
            onSkip={steps[currentStep].optional ? handleNext : undefined}
            data={collectedData[steps[currentStep].id]}
          />
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;