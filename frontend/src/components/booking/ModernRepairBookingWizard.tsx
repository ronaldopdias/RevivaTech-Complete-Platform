'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Check, Calendar, Clock, MapPin, Phone, Mail, User, CreditCard, Shield, Star, ArrowRight } from 'lucide-react';
import { repairBookingSystem, Device, RepairService, BookingSession } from '@/lib/booking/repairBookingSystem';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useServices } from '@/lib/services/serviceFactory';

interface BookingWizardProps {
  className?: string;
  onComplete?: (booking: BookingSession) => void;
}

const STEPS = [
  { id: 'device', title: 'Device', icon: MapPin },
  { id: 'service', title: 'Service', icon: Clock },
  { id: 'appointment', title: 'Appointment', icon: Calendar },
  { id: 'customer', title: 'Details', icon: User },
  { id: 'confirmation', title: 'Confirm', icon: Check },
];

export default function ModernRepairBookingWizard({ className = '', onComplete }: BookingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [session, setSession] = useState<BookingSession | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [selectedServices, setSelectedServices] = useState<RepairService[]>([]);
  const [availableServices, setAvailableServices] = useState<RepairService[]>([]);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [pricing, setPricing] = useState<any>(null);
  
  // Get services for real API calls
  const { booking: bookingService } = useServices();
  
  // Device selection states
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Initialize booking session
  useEffect(() => {
    const newSession = repairBookingSystem.startBookingSession();
    setSession(newSession);
  }, []);

  // Get available services when device is selected
  useEffect(() => {
    if (selectedDevice) {
      // If device has common_issues from real API, use those
      if (selectedDevice.commonIssues && selectedDevice.commonIssues.length > 0) {
        const realServices = selectedDevice.commonIssues.map((issue: string, index: number) => ({
          id: `service-${selectedDevice.id}-${index}`,
          name: issue,
          description: `Professional repair for ${issue.toLowerCase()}`,
          category: issue.toLowerCase().includes('screen') ? 'screen' : 
                   issue.toLowerCase().includes('battery') ? 'battery' :
                   issue.toLowerCase().includes('camera') ? 'hardware' : 'hardware',
          basePrice: 80 + (index * 20), // Dynamic pricing
          estimatedTime: 45 + (index * 15),
          difficulty: 'medium',
          warranty: 365,
          deviceTypes: [selectedDevice.category],
          active: true
        }));
        setAvailableServices(realServices);
      } else {
        // Fallback to mock system services
        const services = repairBookingSystem.getCompatibleServices(selectedDevice.id);
        setAvailableServices(services);
      }
    }
  }, [selectedDevice]);

  // Reset device selection states when device is cleared
  useEffect(() => {
    if (!selectedDevice) {
      setSelectedCategory(null);
      setSelectedBrand(null);
    }
  }, [selectedDevice]);

  // Get available slots when services are selected
  useEffect(() => {
    if (selectedServices.length > 0) {
      const slots = repairBookingSystem.getAvailableSlots();
      setAvailableSlots(slots);
    }
  }, [selectedServices]);

  const canContinue = () => {
    switch (currentStep) {
      case 0: return selectedDevice !== null;
      case 1: return selectedServices.length > 0;
      case 2: return selectedSlot !== null;
      case 3: return customerInfo.firstName && customerInfo.lastName && customerInfo.email && customerInfo.phone;
      case 4: return false; // Final step
      default: return false;
    }
  };

  const handleNext = async () => {
    if (!session) return;
    
    setLoading(true);
    setError(null);

    try {
      switch (currentStep) {
        case 0:
          if (selectedDevice) {
            const result = repairBookingSystem.selectDevice(session.id, selectedDevice.id);
            if (result.success && result.session) {
              setSession(result.session);
              setCurrentStep(1);
            } else {
              setError(result.error || 'Failed to select device');
            }
          }
          break;

        case 1:
          if (selectedServices.length > 0) {
            const serviceIds = selectedServices.map(s => s.id);
            const result = repairBookingSystem.selectServices(session.id, serviceIds);
            if (result.success && result.session) {
              setSession(result.session);
              setPricing(result.pricing);
              setCurrentStep(2);
            } else {
              setError(result.error || 'Failed to select services');
            }
          }
          break;

        case 2:
          if (selectedSlot) {
            const result = repairBookingSystem.bookAppointment(session.id, selectedSlot.date, selectedSlot.time);
            if (result.success && result.session) {
              setSession(result.session);
              setCurrentStep(3);
            } else {
              setError(result.error || 'Failed to book appointment');
            }
          }
          break;

        case 3:
          const result = repairBookingSystem.addCustomerInfo(session.id, customerInfo);
          if (result.success && result.session) {
            setSession(result.session);
            setCurrentStep(4);
          } else {
            setError(result.error || 'Failed to add customer info');
          }
          break;

        case 4:
          // Submit booking to real API instead of mock system
          if (!selectedDevice || selectedServices.length === 0) {
            setError('Please select a device and repair service');
            break;
          }

          try {
            // Map the booking data to API format
            const bookingData = {
              deviceModelId: selectedDevice.id,
              repairType: selectedServices[0].category.toUpperCase(), // Map to API enum
              problemDescription: session?.problemDescription || 'Repair requested through booking wizard',
              urgencyLevel: 'STANDARD',
              preferredDate: selectedSlot?.date || undefined,
              customerInfo: {
                firstName: customerInfo.firstName,
                lastName: customerInfo.lastName,
                email: customerInfo.email,
                phone: customerInfo.phone,
                address: customerInfo.address
              },
              deviceCondition: {
                hasWarranty: false,
                condition: 'UNKNOWN'
              },
              customerNotes: session?.notes || ''
            };

            // Submit to real API
            const bookingResult = await bookingService.submitBooking(bookingData);
            
            if (bookingResult) {
              // Update session with real booking ID
              const updatedSession = {
                ...session,
                id: bookingResult.bookingId || session?.id,
                status: 'confirmed'
              };
              setSession(updatedSession);
              onComplete?.(updatedSession);
            } else {
              setError('Failed to submit booking');
            }
          } catch (err) {
            console.error('Booking submission error:', err);
            setError('Failed to submit booking. Please try again.');
          }
          break;
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Booking error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      // If going back to device selection, reset device-related states
      if (currentStep === 1) {
        setSelectedDevice(null);
        setSelectedServices([]);
        setAvailableServices([]);
      }
      setCurrentStep(currentStep - 1);
    }
  };

  const renderDeviceSelection = () => {
    // Fetch real devices from API instead of mock system
    const [realDevices, setRealDevices] = useState<any[]>([]);
    const [devicesLoaded, setDevicesLoaded] = useState(false);
    
    useEffect(() => {
      const fetchRealDevices = async () => {
        try {
          const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3011';
          const response = await fetch(`${API_BASE}/api/devices/models/search`);
          if (response.ok) {
            const data = await response.json();
            // Map backend format to match component expectations
            const mappedDevices = data.models.map((device: any) => ({
              id: device.id,
              brand: device.brandName,
              category: device.categorySlug || 'smartphone', // Map to expected category format
              model: device.name,
              year: device.year,
              commonIssues: device.specs?.common_issues || [], // Extract common issues from API
              repairDifficulty: 'medium', // Default since not in API
              partAvailability: 'high',   // Default since not in API
              avgRepairTime: 60,          // Default since not in API
              active: true
            }));
            setRealDevices(mappedDevices);
            setDevicesLoaded(true);
          } else {
            throw new Error('API call failed');
          }
        } catch (error) {
          console.error('Failed to fetch real devices:', error);
          // Fallback to mock system if API fails
          setRealDevices(repairBookingSystem.getAllDevices());
          setDevicesLoaded(true);
        }
      };
      
      if (!devicesLoaded) {
        fetchRealDevices();
      }
    }, [devicesLoaded]);
    
    const devices = realDevices.length > 0 ? realDevices : repairBookingSystem.getAllDevices();
    
    
    // Define device categories with proper labels and icons
    const deviceCategories = [
      {
        id: 'smartphone',
        label: 'SmartPhone/iPhone',
        icon: '📱',
        description: 'Mobile phones, smartphones, and iPhones',
        color: 'from-blue-50 to-blue-100 border-blue-200',
        textColor: 'text-blue-900',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-300'
      },
      {
        id: 'tablet',
        label: 'Tablet/iPad',
        icon: '📟',
        description: 'Tablets, iPads, and similar devices',
        color: 'from-teal-50 to-teal-100 border-teal-200',
        textColor: 'text-teal-900',
        bgColor: 'bg-teal-50',
        borderColor: 'border-teal-300'
      },
      {
        id: 'laptop',
        label: 'Laptop/Mac/PC',
        icon: '💻',
        description: 'Laptops, MacBooks, and portable PCs',
        color: 'from-blue-50 to-blue-100 border-blue-200',
        textColor: 'text-blue-900',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-300'
      },
      {
        id: 'gaming',
        label: 'Console',
        icon: '🎮',
        description: 'Gaming consoles and related devices',
        color: 'from-teal-50 to-teal-100 border-teal-200',
        textColor: 'text-teal-900',
        bgColor: 'bg-teal-50',
        borderColor: 'border-teal-300'
      }
    ];

    // Reset selections when going back
    const resetSelection = () => {
      setSelectedCategory(null);
      setSelectedBrand(null);
      setSelectedDevice(null);
    };

    // Step 1: Category Selection
    if (!selectedCategory) {
      return (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Select Device Category</h3>
            <p className="text-gray-600">Choose the type of device you need repaired</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {deviceCategories.map(category => {
              const categoryDevices = devices.filter(d => d.category === category.id);
              const uniqueBrands = Array.from(new Set(categoryDevices.map(d => d.brand)));
              
              return (
                <Card
                  key={category.id}
                  clickable={true}
                  className={`p-6 cursor-pointer transition-all duration-300 hover:shadow-xl bg-gradient-to-br ${category.color} hover:scale-105 hover:rotate-1 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                  onClick={() => {
                    setIsTransitioning(true);
                    setTimeout(() => {
                      setSelectedCategory(category.id);
                      setIsTransitioning(false);
                    }, 150);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setIsTransitioning(true);
                      setTimeout(() => {
                        setSelectedCategory(category.id);
                        setIsTransitioning(false);
                      }, 150);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Select ${category.label} devices`}
                  style={{ minHeight: '200px' }}
                >
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="text-6xl mb-2">{category.icon}</div>
                    <h4 className={`text-xl font-bold ${category.textColor}`}>
                      {category.label}
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">{category.description}</p>
                    <div className="mt-auto">
                      <div className="text-xs text-gray-500 mb-2">
                        {categoryDevices.length} devices available
                      </div>
                      <div className="text-xs text-gray-500">
                        Brands: {uniqueBrands.slice(0, 3).join(', ')}
                        {uniqueBrands.length > 3 && ` +${uniqueBrands.length - 3} more`}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      );
    }

    // Step 2: Brand Selection
    if (!selectedBrand) {
      const categoryDevices = devices.filter(d => d.category === selectedCategory);
      const brands = Array.from(new Set(categoryDevices.map(d => d.brand)));
      const selectedCategoryInfo = deviceCategories.find(c => c.id === selectedCategory);

      return (
        <div className="space-y-6">
          <div className="text-center">
            <button
              onClick={resetSelection}
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4 p-2 rounded-lg hover:bg-gray-100 min-h-[48px]"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to categories
            </button>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Select {selectedCategoryInfo?.label} Brand
            </h3>
            <p className="text-gray-600">Choose your device manufacturer</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {brands.map(brand => {
              const brandDevices = categoryDevices.filter(d => d.brand === brand);
              
              return (
                <Card
                  key={brand}
                  clickable={true}
                  className="p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:bg-teal-50 border-2 hover:border-teal-300 hover:scale-105 active:scale-95 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                  onClick={() => {
                    setIsTransitioning(true);
                    setTimeout(() => {
                      setSelectedBrand(brand);
                      setIsTransitioning(false);
                    }, 150);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setIsTransitioning(true);
                      setTimeout(() => {
                        setSelectedBrand(brand);
                        setIsTransitioning(false);
                      }, 150);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Select ${brand} devices`}
                  style={{ minHeight: '120px' }}
                >
                  <div className="text-center space-y-3">
                    <div className="w-16 h-16 mx-auto bg-gradient-to-br from-teal-100 to-teal-200 rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-teal-700">
                        {brand.charAt(0)}
                      </span>
                    </div>
                    <h4 className="font-semibold text-gray-900">{brand}</h4>
                    <div className="text-xs text-gray-500">
                      {brandDevices.length} model{brandDevices.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      );
    }

    // Step 3: Model Selection
    const filteredDevices = devices.filter(d => 
      d.category === selectedCategory && d.brand === selectedBrand
    );
    const selectedCategoryInfo = deviceCategories.find(c => c.id === selectedCategory);

    return (
      <div className="space-y-6">
        <div className="text-center">
          <button
            onClick={() => setSelectedBrand(null)}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4 p-2 rounded-lg hover:bg-gray-100 min-h-[48px]"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to brands
          </button>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Select {selectedBrand} {selectedCategoryInfo?.label.split('/')[0]}
          </h3>
          <p className="text-gray-600">Choose your specific device model</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDevices.map(device => (
            <Card
              key={device.id}
              clickable={true}
              className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-xl min-h-[140px] hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                selectedDevice?.id === device.id
                  ? 'ring-2 ring-blue-400 border-blue-300 bg-blue-50 shadow-lg'
                  : 'hover:bg-blue-50 hover:border-blue-200 border-gray-200'
              }`}
              onClick={() => {
                setSelectedDevice(device);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedDevice(device);
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={`Select ${device.model} from ${device.year}`}
              style={{ minHeight: '140px' }}
            >
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">{selectedCategoryInfo?.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium text-gray-900 truncate">{device.model}</h5>
                    <p className="text-sm text-gray-600">{device.year}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Repair Difficulty:</span>
                    <span className={`px-2 py-1 rounded-full font-medium ${
                      device.repairDifficulty === 'easy' ? 'bg-green-100 text-green-800' :
                      device.repairDifficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      device.repairDifficulty === 'hard' ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {device.repairDifficulty}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Parts Available:</span>
                    <span className={`px-2 py-1 rounded-full font-medium ${
                      device.partAvailability === 'high' ? 'bg-green-100 text-green-800' :
                      device.partAvailability === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {device.partAvailability}
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    Avg. repair time: {device.avgRepairTime} min
                  </div>
                </div>

                {selectedDevice?.id === device.id && (
                  <div className="mt-3 flex items-center text-blue-600">
                    <Check className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium">Selected</span>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderServiceSelection = () => {
    if (!selectedDevice) return null;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Select Services</h3>
          <p className="text-gray-600">Choose the repairs needed for your {selectedDevice.model}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableServices.map(service => {
            const isSelected = selectedServices.some(s => s.id === service.id);
            const adjustedPrice = service.basePrice * (
              selectedDevice.repairDifficulty === 'expert' ? 1.3 :
              selectedDevice.repairDifficulty === 'hard' ? 1.2 : 1
            );

            return (
              <Card
                key={service.id}
                className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                  isSelected
                    ? 'ring-2 ring-blue-500 bg-blue-50'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => {
                  if (isSelected) {
                    setSelectedServices(selectedServices.filter(s => s.id !== service.id));
                  } else {
                    setSelectedServices([...selectedServices, service]);
                  }
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900">{service.name}</h5>
                    <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                    <div className="mt-2 flex items-center space-x-2">
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">{service.estimatedTime}min</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        service.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                        service.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        service.difficulty === 'hard' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {service.difficulty}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-blue-600">
                      £{adjustedPrice.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">{service.warranty === 365 ? '1 year' : `${service.warranty} days`} warranty</div>
                  </div>
                </div>
                {isSelected && (
                  <div className="mt-3 flex items-center text-blue-600">
                    <Check className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium">Selected</span>
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {selectedServices.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Selected Services</h4>
            <div className="space-y-2">
              {selectedServices.map(service => (
                <div key={service.id} className="flex items-center justify-between text-sm">
                  <span>{service.name}</span>
                  <span className="font-medium">£{service.basePrice.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAppointmentSelection = () => {
    if (availableSlots.length === 0) return null;

    // Group slots by date
    const slotsByDate = availableSlots.reduce((acc, slot) => {
      if (!acc[slot.date]) acc[slot.date] = [];
      acc[slot.date].push(slot);
      return acc;
    }, {} as Record<string, any[]>);

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Choose Appointment</h3>
          <p className="text-gray-600">Select a convenient time for your repair</p>
        </div>

        {pricing && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-900">Repair Estimate</h4>
                <p className="text-sm text-gray-600">Total time: {pricing.estimatedTime} minutes</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">£{pricing.total}</div>
                <div className="text-sm text-gray-600">inc. VAT</div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {Object.entries(slotsByDate).map(([date, slots]) => (
            <div key={date} className="space-y-3">
              <h4 className="font-medium text-gray-900">
                {new Date(date).toLocaleDateString('en-GB', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h4>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {slots.map(slot => (
                  <button
                    key={`${slot.date}-${slot.time}`}
                    onClick={() => setSelectedSlot(slot)}
                    className={`p-3 text-sm font-medium rounded-lg transition-all ${
                      selectedSlot?.date === slot.date && selectedSlot?.time === slot.time
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {selectedSlot && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-900">
                Appointment booked for {new Date(selectedSlot.date).toLocaleDateString()} at {selectedSlot.time}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCustomerInfo = () => {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Your Details</h3>
          <p className="text-gray-600">We'll use this information to contact you about your repair</p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
              <Input
                value={customerInfo.firstName}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, firstName: e.target.value }))}
                placeholder="John"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
              <Input
                value={customerInfo.lastName}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, lastName: e.target.value }))}
                placeholder="Smith"
                className="w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
            <Input
              type="email"
              value={customerInfo.email}
              onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
              placeholder="john@example.com"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
            <Input
              type="tel"
              value={customerInfo.phone}
              onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="+44 7123 456789"
              className="w-full"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Address (Optional)</label>
            <Input
              value={customerInfo.address.street}
              onChange={(e) => setCustomerInfo(prev => ({ 
                ...prev, 
                address: { ...prev.address, street: e.target.value } 
              }))}
              placeholder="Street Address"
              className="w-full"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                value={customerInfo.address.city}
                onChange={(e) => setCustomerInfo(prev => ({ 
                  ...prev, 
                  address: { ...prev.address, city: e.target.value } 
                }))}
                placeholder="City"
              />
              <Input
                value={customerInfo.address.postalCode}
                onChange={(e) => setCustomerInfo(prev => ({ 
                  ...prev, 
                  address: { ...prev.address, postalCode: e.target.value } 
                }))}
                placeholder="Postal Code"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderConfirmation = () => {
    if (!session || !selectedDevice || !pricing) return null;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h3>
          <p className="text-gray-600">Your repair booking has been successfully submitted</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Booking Summary</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Device:</span>
              <span className="font-medium">{selectedDevice.model}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Services:</span>
              <span className="font-medium">{selectedServices.length} selected</span>
            </div>
            {selectedSlot && (
              <div className="flex justify-between">
                <span className="text-gray-600">Appointment:</span>
                <span className="font-medium">
                  {new Date(selectedSlot.date).toLocaleDateString()} at {selectedSlot.time}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Estimated Time:</span>
              <span className="font-medium">{pricing.estimatedTime} minutes</span>
            </div>
            <div className="flex justify-between text-lg font-semibold border-t pt-3">
              <span>Total:</span>
              <span className="text-blue-600">£{pricing.total}</span>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">What's Next?</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• We'll send you a confirmation email shortly</li>
            <li>• You'll receive updates about your repair progress</li>
            <li>• Our team will contact you if any questions arise</li>
            <li>• We'll notify you when your repair is complete</li>
          </ul>
        </div>

        <div className="flex space-x-4">
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            className="flex-1"
          >
            Return Home
          </Button>
          <Button
            onClick={() => window.location.reload()}
            className="flex-1"
          >
            Book Another Repair
          </Button>
        </div>
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: return renderDeviceSelection();
      case 1: return renderServiceSelection();
      case 2: return renderAppointmentSelection();
      case 3: return renderCustomerInfo();
      case 4: return renderConfirmation();
      default: return null;
    }
  };

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      {/* Progress Steps with Percentage */}
      <div className="mb-8">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm font-medium text-blue-600">
              {Math.round(((currentStep + 1) / STEPS.length) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-teal-500 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const IconComponent = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            
            return (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                  isCompleted
                    ? 'bg-green-500 border-green-500 text-white shadow-lg'
                    : isActive
                    ? 'bg-blue-500 border-blue-500 text-white shadow-lg animate-pulse'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}>
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <IconComponent className="w-5 h-5" />
                  )}
                </div>
                
                <div className="ml-3 hidden md:block">
                  <div className={`text-sm font-medium transition-colors duration-300 ${
                    isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </div>
                  {isActive && (
                    <div className="text-xs text-gray-500">Current step</div>
                  )}
                </div>
                
                {index < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 transition-all duration-500 ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Step Content */}
      <Card className="p-6 mb-6 relative">
        {isTransitioning && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
              <span className="text-sm text-gray-600">Loading...</span>
            </div>
          </div>
        )}
        <div className={`transition-opacity duration-300 ${isTransitioning ? 'opacity-50' : 'opacity-100'}`}>
          {renderStepContent()}
        </div>
      </Card>

      {/* Navigation */}
      {currentStep < STEPS.length - 1 && (
        <div className="flex items-center justify-between">
          <Button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            variant="outline"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <Button
            onClick={handleNext}
            disabled={!canContinue() || loading}
            loading={loading}
          >
            {currentStep === STEPS.length - 2 ? 'Complete Booking' : 'Continue'}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}