'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check, Camera, Upload, Star, Zap, Clock, Shield, Search, X, WifiOff, RefreshCw } from 'lucide-react';
import { AdvancedGestureRecognizer, EnhancedTouchButton } from '@/components/mobile/AdvancedGestures';
import { MobileNavigation } from '@/components/mobile/MobileNavigation';
import { MobileProgressSteps } from '@/components/mobile/MobilePatterns';
import { TouchButton, SwipeableCard } from '@/components/mobile/TouchOptimized';
import { haptics, deviceInfo } from '@/components/mobile/NativeFeatures';
import { offlineStorage } from '@/lib/pwa/offlineStorage';
import appleDevices from '@/config/devices/apple.devices';

interface DeviceModel {
  id: string;
  categoryId: string;
  brand: string;
  name: string;
  year: number;
  imageUrl: string;
  specifications: any;
  averageRepairCost: number;
  commonIssues: string[];
  screenSize?: number;
}

interface RepairIssue {
  id: string;
  name: string;
  description: string;
  estimatedCost: number;
  estimatedTime: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  partsRequired: boolean;
  warranty: string;
  icon: string;
}

interface MobileBookingWizardProps {
  onComplete: (bookingData: any, isOffline?: boolean) => void;
  className?: string;
}

const DEVICE_TYPES = [
  {
    id: 'smartphone',
    name: 'Smartphone',
    icon: '📱',
    description: 'iPhone, Android phones',
    color: 'bg-gradient-to-br from-blue-500 to-purple-600',
    count: 45,
    popular: true
  },
  {
    id: 'laptop',
    name: 'Laptop',
    icon: '💻',
    description: 'MacBook, Windows laptops',
    color: 'bg-gradient-to-br from-green-500 to-emerald-600',
    count: 38,
    popular: true
  },
  {
    id: 'tablet',
    name: 'Tablet',
    icon: '📱',
    description: 'iPad, Android tablets',
    color: 'bg-gradient-to-br from-purple-500 to-pink-600',
    count: 22,
    popular: false
  },
  {
    id: 'desktop',
    name: 'Desktop',
    icon: '🖥️',
    description: 'iMac, Desktop PCs',
    color: 'bg-gradient-to-br from-orange-500 to-red-600',
    count: 18,
    popular: false
  }
];

const BOOKING_STEPS = [
  {
    id: 'device-type',
    title: 'Device Type',
    description: 'Select device category',
    icon: 'smartphone'
  },
  {
    id: 'device-model',
    title: 'Your Device',
    description: 'Choose specific model',
    icon: 'laptop'
  },
  {
    id: 'issue-selection',
    title: 'What\'s Wrong?',
    description: 'Describe the problem',
    icon: 'wrench'
  },
  {
    id: 'details',
    title: 'Details',
    description: 'Contact & pickup info',
    icon: 'user'
  }
];

export function MobileBookingWizard({ onComplete, className = '' }: MobileBookingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedDeviceType, setSelectedDeviceType] = useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<DeviceModel | null>(null);
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingData, setBookingData] = useState({
    deviceType: '',
    device: null,
    issues: [],
    photos: [],
    customerInfo: {
      name: '',
      email: '',
      phone: '',
      address: ''
    },
    estimatedCost: 0,
    priority: 'medium' as const
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const canProceed = () => {
    switch (currentStep) {
      case 0: return selectedDeviceType !== null;
      case 1: return selectedDevice !== null;
      case 2: return selectedIssues.length > 0;
      case 3: return bookingData.customerInfo.name && bookingData.customerInfo.email;
      default: return false;
    }
  };

  const nextStep = () => {
    if (canProceed() && currentStep < BOOKING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleDeviceTypeSelect = (deviceType: string) => {
    setSelectedDeviceType(deviceType);
    setBookingData(prev => ({ ...prev, deviceType }));
  };

  const handleDeviceSelect = (device: DeviceModel) => {
    setSelectedDevice(device);
    setBookingData(prev => ({ ...prev, device }));
  };

  const handleIssueToggle = (issueId: string) => {
    setSelectedIssues(prev => {
      const newIssues = prev.includes(issueId) 
        ? prev.filter(id => id !== issueId)
        : [...prev, issueId];
      
      // Update estimated cost based on selected issues
      const totalCost = newIssues.length * 149; // Base cost per issue
      setBookingData(prevData => ({ 
        ...prevData, 
        issues: newIssues,
        estimatedCost: totalCost 
      }));
      
      return newIssues;
    });
  };

  const handleCompleteBooking = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    haptics.medium();

    try {
      const finalBookingData = {
        ...bookingData,
        deviceType: selectedDeviceType,
        device: selectedDevice,
        issues: selectedIssues,
        timestamp: Date.now(),
        clientInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      };

      if (isOnline) {
        // Try online submission first
        try {
          await onComplete(finalBookingData, false);
          haptics.success();
          return;
        } catch (error) {
          console.warn('Online submission failed, falling back to offline:', error);
        }
      }

      // Offline submission or online fallback
      console.log('💾 Saving booking offline...');
      
      // Convert any File objects to base64 for offline storage
      const processedData = { ...finalBookingData };
      if (processedData.photos && processedData.photos.length > 0) {
        processedData.photos = await Promise.all(
          processedData.photos.map(async (photo: any) => {
            if (photo instanceof File) {
              return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.readAsDataURL(photo);
              });
            }
            return photo;
          })
        );
      }

      // Save to offline storage
      const offlineId = await offlineStorage.saveOfflineBooking({
        data: processedData
      });

      console.log('✅ Booking saved offline with ID:', offlineId);
      
      // Trigger background sync if available
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if ('sync' in registration) {
          await registration.sync.register('background-booking');
        }
      }

      // Show offline success message
      await onComplete(finalBookingData, true);
      haptics.success();

    } catch (error) {
      console.error('❌ Failed to complete booking:', error);
      haptics.error();
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGesture = (event: any) => {
    if (event.type === 'swipe') {
      if (event.data.direction === 'left' && canProceed()) {
        nextStep();
      } else if (event.data.direction === 'right' && currentStep > 0) {
        prevStep();
      }
    }
  };

  // Device Type Selection Step
  const renderDeviceTypeStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <motion.h1 
          className="text-2xl font-bold text-gray-900 mb-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          What device needs repair?
        </motion.h1>
        <motion.p 
          className="text-gray-600"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Select your device type to get started
        </motion.p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {DEVICE_TYPES.map((type, index) => (
          <motion.div
            key={type.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <SwipeableCard
              className={`
                relative p-6 rounded-2xl text-white cursor-pointer
                ${type.color}
                ${selectedDeviceType === type.id ? 'ring-4 ring-white/50' : ''}
                mobile-card touch-feedback
              `}
              onSwipeLeft={() => handleDeviceTypeSelect(type.id)}
              onSwipeRight={() => handleDeviceTypeSelect(type.id)}
            >
              <div className="text-center">
                <div className="text-4xl mb-3">{type.icon}</div>
                <h3 className="font-semibold text-lg mb-1">{type.name}</h3>
                <p className="text-sm opacity-90 mb-3">{type.description}</p>
                <div className="flex justify-between items-center text-xs">
                  <span className="bg-white/20 px-2 py-1 rounded-full">
                    {type.count} models
                  </span>
                  {type.popular && (
                    <span className="bg-white/20 px-2 py-1 rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      Popular
                    </span>
                  )}
                </div>
              </div>
              
              {selectedDeviceType === type.id && (
                <motion.div
                  className="absolute top-2 right-2 bg-white/20 rounded-full p-1"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.1 }}
                >
                  <Check className="w-4 h-4 text-white" />
                </motion.div>
              )}
            </SwipeableCard>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <motion.div
          className="text-sm text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Tap to select or swipe left/right
        </motion.div>
      </div>
    </div>
  );

  // Device Model Selection Step
  const renderDeviceModelStep = () => {
    const deviceModels = appleDevices.slice(0, 12); // Show first 12 for demo
    
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <motion.h1 
            className="text-2xl font-bold text-gray-900 mb-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Choose your device
          </motion.h1>
          <motion.p 
            className="text-gray-600"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Find your specific {selectedDeviceType} model
          </motion.p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search for your device..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent mobile-input"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Device List */}
        <div className="space-y-3">
          {deviceModels
            .filter(device => device.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((device, index) => (
            <motion.div
              key={device.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <SwipeableCard
                className={`
                  p-4 bg-white rounded-xl border-2 cursor-pointer transition-all
                  ${selectedDevice?.id === device.id 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                  mobile-card touch-feedback
                `}
                onSwipeLeft={() => handleDeviceSelect(device)}
                onSwipeRight={() => handleDeviceSelect(device)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                    <img 
                      src={device.imageUrl} 
                      alt={device.name}
                      className="w-12 h-12 object-contain"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{device.name}</h3>
                    <p className="text-sm text-gray-600">{device.year} • {device.brand}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        2-4 hours
                      </span>
                      <span className="flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        From £{device.averageRepairCost}
                      </span>
                    </div>
                  </div>
                  
                  {selectedDevice?.id === device.id && (
                    <motion.div
                      className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring' }}
                    >
                      <Check className="w-4 h-4 text-white" />
                    </motion.div>
                  )}
                </div>
              </SwipeableCard>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  // Issue Selection Step
  const renderIssueSelectionStep = () => {
    const commonIssues = [
      {
        id: 'screen-damage',
        name: 'Screen Damage',
        description: 'Cracked, shattered, or unresponsive screen',
        estimatedCost: 149,
        estimatedTime: '2-3 hours',
        difficulty: 'Medium' as const,
        partsRequired: true,
        warranty: '90 days',
        icon: '📱'
      },
      {
        id: 'battery',
        name: 'Battery Issues',
        description: 'Poor battery life or charging problems',
        estimatedCost: 79,
        estimatedTime: '1-2 hours',
        difficulty: 'Easy' as const,
        partsRequired: true,
        warranty: '12 months',
        icon: '🔋'
      },
      {
        id: 'water-damage',
        name: 'Water Damage',
        description: 'Liquid spill or water exposure',
        estimatedCost: 199,
        estimatedTime: '4-6 hours',
        difficulty: 'Hard' as const,
        partsRequired: true,
        warranty: '30 days',
        icon: '💧'
      },
      {
        id: 'charging-port',
        name: 'Charging Port',
        description: 'Won\'t charge or loose connection',
        estimatedCost: 89,
        estimatedTime: '1-2 hours',
        difficulty: 'Medium' as const,
        partsRequired: true,
        warranty: '90 days',
        icon: '🔌'
      }
    ];

    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <motion.h1 
            className="text-2xl font-bold text-gray-900 mb-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            What's the problem?
          </motion.h1>
          <motion.p 
            className="text-gray-600"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Select all issues that apply to your device
          </motion.p>
        </div>

        <div className="space-y-4">
          {commonIssues.map((issue, index) => (
            <motion.div
              key={issue.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <SwipeableCard
                className={`
                  p-4 bg-white rounded-xl border-2 cursor-pointer transition-all
                  ${selectedIssues.includes(issue.id) 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                  mobile-card touch-feedback
                `}
                onSwipeLeft={() => handleIssueToggle(issue.id)}
                onSwipeRight={() => handleIssueToggle(issue.id)}
              >
                <div className="flex items-start gap-4">
                  <div className="text-2xl">{issue.icon}</div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{issue.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">{issue.description}</p>
                    
                    <div className="flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1 text-green-600">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        £{issue.estimatedCost}
                      </span>
                      <span className="flex items-center gap-1 text-blue-600">
                        <Clock className="w-3 h-3" />
                        {issue.estimatedTime}
                      </span>
                      <span className="flex items-center gap-1 text-purple-600">
                        <Shield className="w-3 h-3" />
                        {issue.warranty}
                      </span>
                    </div>
                  </div>
                  
                  {selectedIssues.includes(issue.id) && (
                    <motion.div
                      className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring' }}
                    >
                      <Check className="w-3 h-3 text-white" />
                    </motion.div>
                  )}
                </div>
              </SwipeableCard>
            </motion.div>
          ))}
        </div>

        {/* Photo Upload */}
        <div className="mt-8">
          <h3 className="font-semibold text-gray-900 mb-4">Add Photos (Optional)</h3>
          <div className="grid grid-cols-2 gap-4">
            <EnhancedTouchButton
              className="aspect-square bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:bg-gray-100"
              onClick={() => console.log('Take photo')}
            >
              <Camera className="w-8 h-8 mb-2" />
              <span className="text-sm">Take Photo</span>
            </EnhancedTouchButton>
            
            <EnhancedTouchButton
              className="aspect-square bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:bg-gray-100"
              onClick={() => console.log('Upload photos')}
            >
              <Upload className="w-8 h-8 mb-2" />
              <span className="text-sm">Upload</span>
            </EnhancedTouchButton>
          </div>
        </div>
      </div>
    );
  };

  // Details Step
  const renderDetailsStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <motion.h1 
          className="text-2xl font-bold text-gray-900 mb-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Contact Details
        </motion.h1>
        <motion.p 
          className="text-gray-600"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          We'll use these details to contact you about your repair
        </motion.p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent mobile-input"
            placeholder="Enter your full name"
            value={bookingData.customerInfo.name}
            onChange={(e) => setBookingData(prev => ({
              ...prev,
              customerInfo: { ...prev.customerInfo, name: e.target.value }
            }))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address *
          </label>
          <input
            type="email"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent mobile-input"
            placeholder="Enter your email"
            value={bookingData.customerInfo.email}
            onChange={(e) => setBookingData(prev => ({
              ...prev,
              customerInfo: { ...prev.customerInfo, email: e.target.value }
            }))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent mobile-input"
            placeholder="Enter your phone number"
            value={bookingData.customerInfo.phone}
            onChange={(e) => setBookingData(prev => ({
              ...prev,
              customerInfo: { ...prev.customerInfo, phone: e.target.value }
            }))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pickup Address
          </label>
          <textarea
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none mobile-input"
            placeholder="Enter your address for device pickup"
            rows={3}
            value={bookingData.customerInfo.address}
            onChange={(e) => setBookingData(prev => ({
              ...prev,
              customerInfo: { ...prev.customerInfo, address: e.target.value }
            }))}
          />
        </div>
      </div>

      <div className="mt-8 p-4 bg-green-50 rounded-xl">
        <h3 className="font-semibold text-green-800 mb-2">Your Repair Summary</h3>
        <div className="space-y-2 text-sm text-green-700">
          <div>Device: {selectedDevice?.name}</div>
          <div>Issues: {selectedIssues.length} selected</div>
          <div>Estimated Cost: £{selectedIssues.length * 149}</div>
          <div>Estimated Time: 2-4 hours</div>
        </div>
      </div>
    </div>
  );

  const getCurrentStepContent = () => {
    switch (currentStep) {
      case 0: return renderDeviceTypeStep();
      case 1: return renderDeviceModelStep();
      case 2: return renderIssueSelectionStep();
      case 3: return renderDetailsStep();
      default: return null;
    }
  };

  return (
    <AdvancedGestureRecognizer
      onGesture={handleGesture}
      config={{ enableSwipe: true, enableHaptics: true }}
      className={`min-h-screen bg-gray-50 ${className}`}
    >
      <div className="max-w-md mx-auto bg-white min-h-screen">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <EnhancedTouchButton
              onClick={prevStep}
              disabled={currentStep === 0}
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center disabled:opacity-50"
            >
              <ChevronLeft className="w-5 h-5" />
            </EnhancedTouchButton>
            
            <div className="flex-1 mx-4">
              <MobileProgressSteps
                steps={BOOKING_STEPS}
                currentStep={currentStep}
                orientation="horizontal"
              />
            </div>
            
            <div className="flex items-center gap-2">
              {/* Offline Indicator */}
              {!isOnline && (
                <div className="flex items-center gap-1 px-2 py-1 bg-amber-100 rounded-full">
                  <WifiOff className="w-3 h-3 text-amber-600" />
                  <span className="text-xs text-amber-600 font-medium">Offline</span>
                </div>
              )}
              
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-primary-600 font-semibold text-sm">
                  {currentStep + 1}/{BOOKING_STEPS.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {getCurrentStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Actions */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 safe-area-pb">
          <div className="flex gap-4">
            {currentStep > 0 && (
              <EnhancedTouchButton
                onClick={prevStep}
                variant="secondary"
                className="flex-1"
              >
                <ChevronLeft className="w-5 h-5" />
                Back
              </EnhancedTouchButton>
            )}
            
            <EnhancedTouchButton
              onClick={currentStep === BOOKING_STEPS.length - 1 ? handleCompleteBooking : nextStep}
              disabled={!canProceed() || isSubmitting}
              variant="primary"
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  {isOnline ? 'Submitting...' : 'Saving Offline...'}
                </>
              ) : (
                <>
                  {currentStep === BOOKING_STEPS.length - 1 ? (
                    <>
                      {isOnline ? 'Complete Booking' : 'Save Offline'}
                      {!isOnline && <WifiOff className="w-4 h-4 ml-2" />}
                    </>
                  ) : (
                    <>
                      Continue
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </>
              )}
            </EnhancedTouchButton>
          </div>
        </div>
      </div>
    </AdvancedGestureRecognizer>
  );
}

export default MobileBookingWizard;