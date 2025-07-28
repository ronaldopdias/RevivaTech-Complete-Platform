// Enhanced booking wizard component with configuration-driven architecture
// Supports advanced booking field types and real-time features

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { z } from 'zod';
import { BookingFormConfig, BookingWizardStep, BookingFormFieldConfig, BookingFormValidator } from './booking-types';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Icon } from '@/components/ui/Icon';

// Wizard state management
interface WizardState {
  currentStep: number;
  formData: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isLoading: boolean;
  isSubmitting: boolean;
  isValid: boolean;
  quote: any;
  availableSlots: any[];
  deviceSuggestions: any[];
}

interface WizardContextValue {
  state: WizardState;
  config: BookingFormConfig;
  actions: {
    updateField: (name: string, value: any) => void;
    validateField: (name: string, value: any) => void;
    nextStep: () => void;
    prevStep: () => void;
    goToStep: (step: number) => void;
    submitForm: () => Promise<void>;
    calculateQuote: () => Promise<void>;
    searchDevices: (query: string) => Promise<any[]>;
    getAvailableSlots: (date: string) => Promise<any[]>;
    uploadPhotos: (files: File[]) => Promise<string[]>;
    saveProgress: () => void;
    loadProgress: () => void;
  };
}

const WizardContext = React.createContext<WizardContextValue | null>(null);

// Enhanced field components for booking-specific types
const DeviceSearchField: React.FC<{ field: BookingFormFieldConfig; value: any; onChange: (value: any) => void; error?: string }> = ({
  field,
  value,
  onChange,
  error
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  const handleSearch = useCallback(async (query: string) => {
    if (query.length < (field.config?.deviceSearch?.minSearchLength || 2)) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`${field.config?.deviceSearch?.endpoint}?q=${encodeURIComponent(query)}&limit=${field.config?.deviceSearch?.maxResults || 20}`);
      const results = await response.json();
      setSuggestions(results.devices || []);
    } catch (error) {
      console.error('Device search error:', error);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  }, [field.config?.deviceSearch]);

  const debouncedSearch = useCallback((query: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(query);
    }, field.config?.deviceSearch?.debounceMs || 300);
  }, [handleSearch, field.config?.deviceSearch?.debounceMs]);

  useEffect(() => {
    if (searchQuery) {
      debouncedSearch(searchQuery);
    }
  }, [searchQuery, debouncedSearch]);

  return (
    <div className="device-search-field">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={field.placeholder}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            error ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        
        {isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <LoadingSpinner size="sm" />
          </div>
        )}
      </div>

      {/* Search Results */}
      {suggestions.length > 0 && (
        <div className="mt-2 border border-gray-200 rounded-md bg-white shadow-lg max-h-64 overflow-y-auto">
          {suggestions.map((device, index) => (
            <button
              key={device.id || index}
              type="button"
              onClick={() => {
                onChange(device);
                setSearchQuery(device.name);
                setSuggestions([]);
              }}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center space-x-3"
            >
              {device.image && (
                <img
                  src={device.image}
                  alt={device.name}
                  className="w-12 h-12 object-cover rounded"
                />
              )}
              <div className="flex-1">
                <div className="font-medium text-gray-900">{device.name}</div>
                <div className="text-sm text-gray-500">
                  {device.brand} • {device.year} • {device.category}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Selected Device Display */}
      {value && (
        <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-200">
          <div className="flex items-center space-x-3">
            {value.image && (
              <img
                src={value.image}
                alt={value.name}
                className="w-16 h-16 object-cover rounded"
              />
            )}
            <div className="flex-1">
              <div className="font-medium text-blue-900">{value.name}</div>
              <div className="text-sm text-blue-700">
                {value.brand} • {value.year} • {value.category}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setSearchQuery('');
              }}
              className="text-blue-600 hover:text-blue-800"
            >
              <Icon name="x" size={20} />
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

const RadioGroupField: React.FC<{ field: BookingFormFieldConfig; value: any; onChange: (value: any) => void; error?: string }> = ({
  field,
  value,
  onChange,
  error
}) => {
  const layout = field.config?.layout || 'list';
  const showPrices = field.config?.showPrices || false;
  const showDescriptions = field.config?.showDescriptions || false;

  return (
    <div className="radio-group-field">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {field.description && (
        <p className="text-sm text-gray-600 mb-4">{field.description}</p>
      )}

      <div className={`space-y-3 ${layout === 'grid' ? 'grid grid-cols-2 gap-4 space-y-0' : ''}`}>
        {field.options?.map((option) => (
          <label
            key={option.value}
            className={`relative flex items-start p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
              value === option.value
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                : 'border-gray-200'
            }`}
          >
            <input
              type="radio"
              name={field.name}
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange(e.target.value)}
              className="sr-only"
            />
            
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                {option.icon && (
                  <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full ${
                    option.color === 'green' ? 'bg-green-100 text-green-600' :
                    option.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                    option.color === 'yellow' ? 'bg-yellow-100 text-yellow-600' :
                    option.color === 'red' ? 'bg-red-100 text-red-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    <Icon name={option.icon} size={16} />
                  </div>
                )}
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{option.label}</span>
                    {showPrices && option.priceModifier && option.priceModifier !== 1.0 && (
                      <span className="text-sm font-medium text-blue-600">
                        +{Math.round((option.priceModifier - 1) * 100)}%
                      </span>
                    )}
                    {option.additionalFee && (
                      <span className="text-sm font-medium text-green-600">
                        +£{option.additionalFee}
                      </span>
                    )}
                  </div>
                  
                  {showDescriptions && option.description && (
                    <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                  )}
                  
                  {option.details && (
                    <div className="mt-2 text-xs text-gray-500">
                      {Object.entries(option.details).map(([key, val]) => (
                        <div key={key}>
                          <span className="font-medium">{key.replace(/_/g, ' ')}:</span> {val}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Selection indicator */}
            <div className={`flex-shrink-0 w-5 h-5 border-2 rounded-full flex items-center justify-center ${
              value === option.value
                ? 'border-blue-500 bg-blue-500'
                : 'border-gray-300'
            }`}>
              {value === option.value && (
                <div className="w-2 h-2 bg-white rounded-full" />
              )}
            </div>
          </label>
        ))}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

const PhotoUploadField: React.FC<{ field: BookingFormFieldConfig; value: any; onChange: (value: any) => void; error?: string }> = ({
  field,
  value = [],
  onChange,
  error
}) => {
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const config = field.config?.photoUpload;
  const maxFiles = config?.maxFiles || 5;
  const maxFileSize = config?.maxFileSize || 10 * 1024 * 1024; // 10MB
  const acceptedFormats = config?.acceptedFormats || ['image/jpeg', 'image/png', 'image/webp'];

  const handleFileSelect = async (files: FileList) => {
    if (value.length + files.length > maxFiles) {
      alert(`Maximum ${maxFiles} photos allowed`);
      return;
    }

    setUploading(true);
    const newFiles: File[] = [];
    const newPreviews: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validate file type
      if (!acceptedFormats.includes(file.type)) {
        alert(`File type ${file.type} not supported`);
        continue;
      }
      
      // Validate file size
      if (file.size > maxFileSize) {
        alert(`File ${file.name} is too large. Maximum size is ${Math.round(maxFileSize / 1024 / 1024)}MB`);
        continue;
      }

      newFiles.push(file);
      
      // Create preview
      const preview = URL.createObjectURL(file);
      newPreviews.push(preview);
    }

    if (newFiles.length > 0) {
      onChange([...value, ...newFiles]);
      setPreviews([...previews, ...newPreviews]);
    }

    setUploading(false);
  };

  const removeFile = (index: number) => {
    const newFiles = value.filter((_: any, i: number) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    
    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(previews[index]);
    
    onChange(newFiles);
    setPreviews(newPreviews);
  };

  return (
    <div className="photo-upload-field">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {field.description && (
        <p className="text-sm text-gray-600 mb-4">{field.description}</p>
      )}

      {/* Upload Guidelines */}
      {config?.guidelines?.show && (
        <div className="mb-4 p-4 bg-blue-50 rounded-md border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">Photo Guidelines:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            {config.guidelines.instructions?.map((instruction, index) => (
              <li key={index} className="flex items-start space-x-2">
                <Icon name="check" size={16} className="mt-0.5 text-blue-600" />
                <span>{instruction}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Upload Area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors ${
          value.length >= maxFiles ? 'border-gray-200 bg-gray-50 cursor-not-allowed' : 'border-gray-300'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedFormats.join(',')}
          onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
          className="hidden"
          disabled={value.length >= maxFiles}
        />
        
        <div className="space-y-2">
          <Icon name="camera" size={48} className="mx-auto text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-900">
              {value.length >= maxFiles ? 'Maximum photos reached' : 'Click to upload photos'}
            </p>
            <p className="text-xs text-gray-500">
              {acceptedFormats.join(', ')} up to {Math.round(maxFileSize / 1024 / 1024)}MB each
            </p>
            <p className="text-xs text-gray-500">
              {value.length}/{maxFiles} photos
            </p>
          </div>
        </div>
      </div>

      {/* Photo Previews */}
      {value.length > 0 && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {previews.map((preview, index) => (
            <div key={index} className="relative group">
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                className="w-full h-24 object-cover rounded-md border border-gray-200"
              />
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Icon name="x" size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {uploading && (
        <div className="mt-4 flex items-center space-x-2">
          <LoadingSpinner size="sm" />
          <span className="text-sm text-gray-600">Processing photos...</span>
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

// Field renderer that maps field types to components
const FieldRenderer: React.FC<{ field: BookingFormFieldConfig; value: any; onChange: (value: any) => void; error?: string }> = ({
  field,
  value,
  onChange,
  error
}) => {
  switch (field.type) {
    case 'device-search':
      return <DeviceSearchField field={field} value={value} onChange={onChange} error={error} />;
    
    case 'radio-group':
      return <RadioGroupField field={field} value={value} onChange={onChange} error={error} />;
    
    case 'photo-upload':
      return <PhotoUploadField field={field} value={value} onChange={onChange} error={error} />;
    
    case 'textarea':
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {field.description && (
            <p className="text-sm text-gray-600 mb-2">{field.description}</p>
          )}
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            rows={field.config?.rows || 4}
            maxLength={field.config?.maxLength}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {field.config?.showCharacterCount && field.config?.maxLength && (
            <p className="text-xs text-gray-500 mt-1">
              {(value || '').length}/{field.config.maxLength} characters
            </p>
          )}
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      );
    
    case 'conditional-group':
      // Render conditional fields based on conditions
      const shouldShow = !field.conditions || field.conditions.every(condition => {
        // Simple condition evaluation - would be more complex in real implementation
        return true; // Placeholder
      });
      
      if (!shouldShow) return null;
      
      return (
        <div className="space-y-4 p-4 border border-gray-200 rounded-md bg-gray-50">
          {field.fields?.map((subField) => (
            <FieldRenderer
              key={subField.id}
              field={subField}
              value={value?.[subField.name]}
              onChange={(newValue) => onChange({ ...value, [subField.name]: newValue })}
              error={error}
            />
          ))}
        </div>
      );
    
    default:
      // Fallback for standard field types
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type={field.type === 'email' ? 'email' : field.type === 'tel' ? 'tel' : 'text'}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      );
  }
};

// Main booking wizard component
export const BookingWizard: React.FC<{ config: BookingFormConfig }> = ({ config }) => {
  const router = useRouter();
  const [state, setState] = useState<WizardState>({
    currentStep: 0,
    formData: {},
    errors: {},
    touched: {},
    isLoading: false,
    isSubmitting: false,
    isValid: false,
    quote: null,
    availableSlots: [],
    deviceSuggestions: []
  });

  const currentStepConfig = config.wizard.steps[state.currentStep];

  // Form actions
  const updateField = useCallback((name: string, value: any) => {
    setState(prev => ({
      ...prev,
      formData: { ...prev.formData, [name]: value },
      touched: { ...prev.touched, [name]: true }
    }));
  }, []);

  const validateField = useCallback((name: string, value: any) => {
    // Implementation would use the BookingFormValidator
    const errors = {}; // Placeholder
    setState(prev => ({ ...prev, errors: { ...prev.errors, ...errors } }));
  }, []);

  const nextStep = useCallback(() => {
    if (state.currentStep < config.wizard.steps.length - 1) {
      // Validate current step
      const stepId = currentStepConfig.id;
      const validation = BookingFormValidator.validateStep(stepId, state.formData);
      
      if (validation.isValid) {
        setState(prev => ({ ...prev, currentStep: prev.currentStep + 1, errors: {} }));
      } else {
        setState(prev => ({ ...prev, errors: validation.errors }));
      }
    }
  }, [state.currentStep, state.formData, currentStepConfig, config.wizard.steps.length]);

  const prevStep = useCallback(() => {
    if (state.currentStep > 0) {
      setState(prev => ({ ...prev, currentStep: prev.currentStep - 1 }));
    }
  }, [state.currentStep]);

  const submitForm = useCallback(async () => {
    setState(prev => ({ ...prev, isSubmitting: true }));
    
    try {
      const response = await fetch(config.submission.endpoint, {
        method: config.submission.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state.formData)
      });
      
      if (response.ok) {
        if (config.submission.successRedirect) {
          router.push(config.submission.successRedirect);
        }
      } else {
        throw new Error('Submission failed');
      }
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setState(prev => ({ ...prev, isSubmitting: false }));
    }
  }, [config.submission, state.formData, router]);

  // Context value
  const contextValue: WizardContextValue = {
    state,
    config,
    actions: {
      updateField,
      validateField,
      nextStep,
      prevStep,
      goToStep: (step: number) => setState(prev => ({ ...prev, currentStep: step })),
      submitForm,
      calculateQuote: async () => {}, // Placeholder
      searchDevices: async (query: string) => [], // Placeholder
      getAvailableSlots: async (date: string) => [], // Placeholder
      uploadPhotos: async (files: File[]) => [], // Placeholder
      saveProgress: () => {}, // Placeholder
      loadProgress: () => {} // Placeholder
    }
  };

  return (
    <WizardContext.Provider value={contextValue}>
      <div className="booking-wizard max-w-4xl mx-auto">
        {/* Progress Indicator */}
        {config.wizard.showProgress && (
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {config.wizard.steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index <= state.currentStep
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {index + 1}
                  </div>
                  {config.wizard.navigation?.showStepTitles && (
                    <span className={`ml-2 text-sm ${
                      index <= state.currentStep ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </span>
                  )}
                  {index < config.wizard.steps.length - 1 && (
                    <div className={`w-16 h-1 mx-4 ${
                      index < state.currentStep ? 'bg-blue-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current Step */}
        <Card className="p-6">
          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-2">
              {currentStepConfig.icon && <Icon name={currentStepConfig.icon} size={24} />}
              <h2 className="text-2xl font-bold text-gray-900">{currentStepConfig.title}</h2>
            </div>
            {currentStepConfig.description && (
              <p className="text-gray-600">{currentStepConfig.description}</p>
            )}
            {currentStepConfig.estimatedTime && (
              <p className="text-sm text-gray-500 mt-1">
                Estimated time: {Math.round(currentStepConfig.estimatedTime / 60)} minutes
              </p>
            )}
          </div>

          {/* Step Fields */}
          <div className="space-y-6">
            {currentStepConfig.fields.map((field) => (
              <FieldRenderer
                key={field.id}
                field={field}
                value={state.formData[field.name]}
                onChange={(value) => updateField(field.name, value)}
                error={state.errors[field.name]}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={state.currentStep === 0 || state.isSubmitting}
            >
              Previous
            </Button>

            <div className="text-sm text-gray-500">
              Step {state.currentStep + 1} of {config.wizard.steps.length}
            </div>

            {state.currentStep === config.wizard.steps.length - 1 ? (
              <Button
                onClick={submitForm}
                disabled={state.isSubmitting}
                className="min-w-32"
              >
                {state.isSubmitting ? <LoadingSpinner size="sm" /> : 'Complete Booking'}
              </Button>
            ) : (
              <Button
                onClick={nextStep}
                disabled={state.isSubmitting}
              >
                Next
              </Button>
            )}
          </div>
        </Card>
      </div>
    </WizardContext.Provider>
  );
};

// Hook to use wizard context
export const useBookingWizard = () => {
  const context = React.useContext(WizardContext);
  if (!context) {
    throw new Error('useBookingWizard must be used within a BookingWizard');
  }
  return context;
};

export default BookingWizard;