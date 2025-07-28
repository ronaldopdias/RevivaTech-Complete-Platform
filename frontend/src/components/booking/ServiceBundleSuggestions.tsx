'use client';

import React, { useMemo } from 'react';
import { Package, Plus, Lightbulb, Clock, Percent, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  generateBundleSuggestions, 
  BundleSuggestion,
  getServiceInfo,
  calculateBundleSavings
} from '@/lib/data/service-bundling';

interface ServiceBundleSuggestionsProps {
  selectedServices: string[];
  selectedBand: 'A' | 'B' | 'C' | null;
  onServiceAdd: (serviceIds: string[]) => void;
  className?: string;
}

const ServiceBundleSuggestions: React.FC<ServiceBundleSuggestionsProps> = ({
  selectedServices,
  selectedBand,
  onServiceAdd,
  className
}) => {
  // Generate suggestions based on current selection
  const suggestions = useMemo(() => {
    return generateBundleSuggestions(selectedServices, selectedBand);
  }, [selectedServices, selectedBand]);

  if (suggestions.length === 0) {
    return null;
  }

  const handleAddBundle = (suggestion: BundleSuggestion) => {
    onServiceAdd(suggestion.missingServices);
  };

  const renderSuggestionCard = (suggestion: BundleSuggestion) => {
    const { bundle, missingServices, confidence, reasoning } = suggestion;
    const missingServiceDetails = missingServices
      .map(id => getServiceInfo(id))
      .filter(Boolean);

    const potentialSavings = calculateBundleSavings(bundle.services);

    return (
      <div
        key={bundle.id}
        className={cn(
          "bg-white border border-gray-200 rounded-xl p-6 hover:border-trust-300 transition-all duration-300 hover:shadow-md",
          bundle.priority === 'high' && "border-professional-200 bg-gradient-to-br from-professional-25 to-white"
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              bundle.priority === 'high' ? "bg-professional-100 text-professional-700" :
              bundle.priority === 'medium' ? "bg-trust-100 text-trust-700" :
              "bg-gray-100 text-gray-600"
            )}>
              <Package className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h4 className="font-semibold text-gray-900">{bundle.name}</h4>
                {bundle.priority === 'high' && (
                  <span className="px-2 py-1 bg-professional-100 text-professional-700 text-xs font-medium rounded-full">
                    Recommended
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">{bundle.description}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900">
              {confidence}% match
            </div>
            {potentialSavings > 0 && (
              <div className="text-xs text-green-600 flex items-center">
                <Percent className="w-3 h-3 mr-1" />
                Save £{potentialSavings.toFixed(0)}
              </div>
            )}
          </div>
        </div>

        {/* Reasoning */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <div className="flex items-start space-x-2">
            <Lightbulb className="w-4 h-4 text-trust-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-700">{reasoning}</p>
          </div>
        </div>

        {/* Missing Services */}
        <div className="space-y-3 mb-4">
          <h5 className="text-sm font-medium text-gray-900 flex items-center">
            <Plus className="w-4 h-4 mr-1 text-professional-600" />
            Suggested Additional Services ({missingServices.length})
          </h5>
          <div className="space-y-2">
            {missingServiceDetails.map((service, index) => {
              if (!service) return null;
              
              return (
                <div key={service.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 text-sm">{service.name}</div>
                    <div className="text-xs text-gray-600">{service.category}</div>
                    <div className="flex items-center space-x-3 mt-1">
                      <span className="text-xs text-gray-500 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {service.estimatedTime}
                      </span>
                      <span className="text-xs text-gray-500">
                        {service.difficulty} difficulty
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">£{service.basePrice}</div>
                    <div className="text-xs text-gray-600">Band {service.band}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Common Use Case */}
        <div className="mb-4">
          <div className="text-xs font-medium text-gray-700 mb-1">Common Use Case:</div>
          <div className="text-xs text-gray-600 bg-gray-50 rounded-md p-2">
            {bundle.commonUseCase}
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => handleAddBundle(suggestion)}
          className={cn(
            "w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-all duration-300",
            bundle.priority === 'high' 
              ? "bg-professional-500 text-white hover:bg-professional-600 shadow-md hover:shadow-lg" 
              : "bg-trust-500 text-white hover:bg-trust-600"
          )}
        >
          <Plus className="w-4 h-4" />
          <span>Add {missingServices.length} Service{missingServices.length !== 1 ? 's' : ''}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2">
          <Package className="w-5 h-5 text-professional-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Recommended Service Bundles
          </h3>
        </div>
        <p className="text-sm text-gray-600 max-w-2xl mx-auto">
          Based on your selected services, we recommend these additional services for a complete repair solution.
        </p>
      </div>

      {/* Suggestions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {suggestions.map(renderSuggestionCard)}
      </div>

      {/* Help Text */}
      <div className="text-center">
        <div className="inline-flex items-center space-x-2 text-xs text-gray-500 bg-gray-50 rounded-full px-4 py-2">
          <Lightbulb className="w-3 h-3" />
          <span>Bundling services often saves time and provides more comprehensive repairs</span>
        </div>
      </div>
    </div>
  );
};

export default ServiceBundleSuggestions;