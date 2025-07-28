'use client';

import React, { useState } from 'react';
import { 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Clock,
  User,
  Mail,
  Phone,
  Package,
  CreditCard,
  FileText,
  Camera,
  Upload
} from 'lucide-react';
import { DeviceSelector } from '../device/DeviceSelector';
import { ModelSelection } from '../device/ModelSelection';
import { PriceCalculator } from '../device/PriceCalculator';

interface BookingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

interface DeviceInfo {
  category: string;
  brand: string;
  model: string;
  year: number;
}

interface RepairSelection {
  type: string;
  description: string;
  estimatedPrice: number;
  estimatedTime: string;
}

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    postcode: string;
  };
}

interface AppointmentInfo {
  date: string;
  time: string;
  serviceType: 'dropoff' | 'pickup' | 'mail';
  location?: string;
}

const steps: BookingStep[] = [
  { id: 'device', title: 'Device Selection', description: 'Choose your device', completed: false },
  { id: 'repair', title: 'Repair Details', description: 'Describe the issue', completed: false },
  { id: 'appointment', title: 'Appointment', description: 'Schedule service', completed: false },
  { id: 'contact', title: 'Contact Info', description: 'Your details', completed: false },
  { id: 'confirmation', title: 'Confirmation', description: 'Review and confirm', completed: false }
];

export const BookingFlow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [bookingSteps, setBookingSteps] = useState(steps);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [repairSelection, setRepairSelection] = useState<RepairSelection | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    email: '',
    phone: '',
    address: { street: '', city: '', postcode: '' }
  });
  const [appointmentInfo, setAppointmentInfo] = useState<AppointmentInfo>({
    date: '',
    time: '',
    serviceType: 'dropoff'
  });
  const [issueDescription, setIssueDescription] = useState('');
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);

  const updateStepCompleted = (stepIndex: number, completed: boolean) => {
    const updatedSteps = [...bookingSteps];
    updatedSteps[stepIndex].completed = completed;
    setBookingSteps(updatedSteps);
  };

  const handleNext = () => {
    if (currentStep < bookingSteps.length - 1) {
      updateStepCompleted(currentStep, true);
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleDeviceSelection = (device: any) => {
    setDeviceInfo(device);
    updateStepCompleted(0, true);
  };

  const handleRepairSelection = (repair: any) => {
    setRepairSelection(repair);
    updateStepCompleted(1, true);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedImages(prev => [...prev, ...files]);
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return deviceInfo !== null;
      case 1:
        return repairSelection !== null && issueDescription.trim() !== '';
      case 2:
        return appointmentInfo.date && appointmentInfo.time;
      case 3:
        return customerInfo.name && customerInfo.email && customerInfo.phone;
      default:
        return true;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Select Your Device
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Choose the device category and model that needs repair.
              </p>
            </div>
            <DeviceSelector
              onDeviceSelect={handleDeviceSelection}
              selectedDevice={deviceInfo}
            />
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Repair Details
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Tell us what's wrong with your {deviceInfo?.brand} {deviceInfo?.model}.
              </p>
            </div>

            {deviceInfo && (
              <PriceCalculator
                device={deviceInfo}
                onRepairSelect={handleRepairSelection}
                selectedRepair={repairSelection}
              />
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Describe the Issue
              </label>
              <textarea
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Please describe the problem in detail. When did it start? What were you doing when it happened?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Upload Photos (Optional)
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600 dark:text-gray-400">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white dark:bg-gray-700 rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                      <span>Upload photos</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    PNG, JPG, GIF up to 10MB each
                  </p>
                </div>
              </div>
              
              {uploadedImages.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {uploadedImages.map((file, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Schedule Appointment
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Choose how you'd like to get your device to us.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Service Type
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { id: 'dropoff', title: 'Drop-off', description: 'Bring device to our location', icon: MapPin },
                  { id: 'pickup', title: 'Pickup', description: 'We collect from your address', icon: Package },
                  { id: 'mail', title: 'Mail-in', description: 'Send device by post', icon: FileText }
                ].map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.id}
                      onClick={() => setAppointmentInfo(prev => ({ ...prev, serviceType: option.id as any }))}
                      className={`p-4 border-2 rounded-lg text-left transition-colors ${
                        appointmentInfo.serviceType === option.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 dark:border-blue-400'
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                    >
                      <Icon className="h-6 w-6 mb-2 text-blue-600" />
                      <div className="font-medium text-gray-900 dark:text-white">{option.title}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{option.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {appointmentInfo.serviceType !== 'mail' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Preferred Date
                    </label>
                    <input
                      type="date"
                      value={appointmentInfo.date}
                      onChange={(e) => setAppointmentInfo(prev => ({ ...prev, date: e.target.value }))}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Preferred Time
                    </label>
                    <select
                      value={appointmentInfo.time}
                      onChange={(e) => setAppointmentInfo(prev => ({ ...prev, time: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select time</option>
                      <option value="09:00">9:00 AM</option>
                      <option value="10:00">10:00 AM</option>
                      <option value="11:00">11:00 AM</option>
                      <option value="12:00">12:00 PM</option>
                      <option value="13:00">1:00 PM</option>
                      <option value="14:00">2:00 PM</option>
                      <option value="15:00">3:00 PM</option>
                      <option value="16:00">4:00 PM</option>
                      <option value="17:00">5:00 PM</option>
                    </select>
                  </div>
                </div>

                {appointmentInfo.serviceType === 'pickup' && (
                  <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <Clock className="inline h-4 w-4 mr-1" />
                      Pickup service is available within 10 miles of our location. Additional charges may apply for longer distances.
                    </p>
                  </div>
                )}
              </>
            )}

            {appointmentInfo.serviceType === 'mail' && (
              <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <FileText className="inline h-4 w-4 mr-1" />
                  We'll provide prepaid shipping labels and packaging instructions. Your device will be insured during transit.
                </p>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Contact Information
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                We'll use this information to keep you updated on your repair.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="John Smith"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="+44 7700 900123"
              />
            </div>

            {appointmentInfo.serviceType === 'pickup' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Pickup Address
                  </label>
                  <input
                    type="text"
                    value={customerInfo.address.street}
                    onChange={(e) => setCustomerInfo(prev => ({ 
                      ...prev, 
                      address: { ...prev.address, street: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="123 High Street"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={customerInfo.address.city}
                      onChange={(e) => setCustomerInfo(prev => ({ 
                        ...prev, 
                        address: { ...prev.address, city: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="London"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Postcode
                    </label>
                    <input
                      type="text"
                      value={customerInfo.address.postcode}
                      onChange={(e) => setCustomerInfo(prev => ({ 
                        ...prev, 
                        address: { ...prev.address, postcode: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="SW1A 1AA"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Booking Confirmation
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Please review your booking details before confirming.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-6">
              {/* Device Info */}
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Device</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {deviceInfo?.brand} {deviceInfo?.model} ({deviceInfo?.year})
                </p>
              </div>

              {/* Repair Info */}
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Repair</h3>
                <p className="text-gray-600 dark:text-gray-400">{repairSelection?.description}</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  Estimated: £{repairSelection?.estimatedPrice} | {repairSelection?.estimatedTime}
                </p>
              </div>

              {/* Issue Description */}
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Issue Description</h3>
                <p className="text-gray-600 dark:text-gray-400">{issueDescription}</p>
              </div>

              {/* Service Type */}
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Service</h3>
                <p className="text-gray-600 dark:text-gray-400 capitalize">
                  {appointmentInfo.serviceType}
                  {appointmentInfo.date && appointmentInfo.time && (
                    <> - {appointmentInfo.date} at {appointmentInfo.time}</>
                  )}
                </p>
              </div>

              {/* Contact Info */}
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Contact</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {customerInfo.name}<br />
                  {customerInfo.email}<br />
                  {customerInfo.phone}
                </p>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <CheckCircle className="inline h-4 w-4 mr-1" />
                By confirming this booking, you agree to our terms and conditions. We'll send you a confirmation email with your booking reference.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {bookingSteps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                index <= currentStep
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : step.completed
                  ? 'bg-green-600 border-green-600 text-white'
                  : 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400'
              }`}>
                {step.completed ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              <div className="ml-3 hidden md:block">
                <p className={`text-sm font-medium ${
                  index <= currentStep ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {step.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{step.description}</p>
              </div>
              {index < bookingSteps.length - 1 && (
                <ArrowRight className="ml-4 h-4 w-4 text-gray-400" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            currentStep === 0
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </button>

        {currentStep === bookingSteps.length - 1 ? (
          <button
            disabled={!isStepValid()}
            className={`flex items-center px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              isStepValid()
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Confirm Booking
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={!isStepValid()}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              isStepValid()
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </button>
        )}
      </div>
    </div>
  );
};

export default BookingFlow;