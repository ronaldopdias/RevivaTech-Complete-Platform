'use client';

import React from 'react';
import { Check, Clock, Shield, Info, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LaptopRepairService } from '@/lib/data/laptop-repair-services';

interface ServiceCardProps {
  service: LaptopRepairService;
  isSelected: boolean;
  onSelect: (serviceId: string) => void;
  className?: string;
}

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'Low': return 'text-green-600 bg-green-100';
    case 'Medium': return 'text-yellow-600 bg-yellow-100';
    case 'High': return 'text-orange-600 bg-orange-100';
    case 'Expert': return 'text-red-600 bg-red-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

const getBandColor = (band: string) => {
  switch (band) {
    case 'A': return 'border-trust-300 bg-trust-50/50';
    case 'B': return 'border-professional-300 bg-professional-50/50';
    case 'C': return 'border-neutral-300 bg-neutral-50/50';
    default: return 'border-gray-300 bg-gray-50/50';
  }
};

const ServiceCard: React.FC<ServiceCardProps> = ({ 
  service, 
  isSelected, 
  onSelect, 
  className 
}) => {
  const handleClick = () => {
    onSelect(service.id);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(service.id);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyPress}
      className={cn(
        'relative group cursor-pointer transition-all duration-300 rounded-xl border-2 p-4',
        'hover:shadow-lg hover:shadow-blue-100/50 hover:-translate-y-1',
        'focus:outline-none focus:ring-2 focus:ring-trust-500 focus:ring-offset-2',
        isSelected 
          ? 'border-trust-500 bg-trust-50 shadow-lg shadow-trust-100/50 transform -translate-y-1' 
          : `${getBandColor(service.band)} hover:border-trust-300`,
        className
      )}
      aria-pressed={isSelected}
      aria-describedby={`service-${service.id}-description`}
    >
      {/* Selection Indicator */}
      <div className={cn(
        'absolute top-3 right-3 w-6 h-6 rounded-full border-2 transition-all duration-200',
        'flex items-center justify-center',
        isSelected 
          ? 'bg-trust-500 border-trust-500' 
          : 'border-gray-300 group-hover:border-trust-400'
      )}>
        {isSelected && <Check className="w-4 h-4 text-white" />}
      </div>

      {/* Service Header */}
      <div className="pr-8 mb-3">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1">
          {service.name}
        </h3>
        <p 
          id={`service-${service.id}-description`}
          className="text-xs text-gray-600 leading-relaxed"
        >
          {service.description}
        </p>
      </div>

      {/* Service Details */}
      <div className="space-y-2">
        {/* Price and Time */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1">
            <span className="font-bold text-lg text-gray-900">£{service.basePrice}</span>
            <span className="text-gray-500">fixed fee</span>
          </div>
          <div className="flex items-center space-x-1 text-gray-600">
            <Clock className="w-3 h-3" />
            <span>{service.estimatedTime}</span>
          </div>
        </div>

        {/* Difficulty and Band */}
        <div className="flex items-center justify-between">
          <span className={cn(
            'px-2 py-1 rounded-full text-xs font-medium',
            getDifficultyColor(service.difficulty)
          )}>
            {service.difficulty}
          </span>
          <span className="text-xs text-gray-500 font-medium">
            Band {service.band}
          </span>
        </div>

        {/* Category */}
        <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-md">
          {service.category}
        </div>

        {/* Includes/Excludes */}
        {service.includes && service.includes.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-green-700 flex items-center space-x-1">
              <Check className="w-3 h-3" />
              <span>Includes:</span>
            </div>
            <ul className="text-xs text-gray-600 space-y-0.5 ml-4">
              {service.includes.slice(0, 2).map((item, index) => (
                <li key={index} className="flex items-start space-x-1">
                  <span className="text-green-500 mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
              {service.includes.length > 2 && (
                <li className="text-gray-500 italic">
                  +{service.includes.length - 2} more...
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Excludes */}
        {service.excludes && service.excludes.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-orange-700 flex items-center space-x-1">
              <AlertCircle className="w-3 h-3" />
              <span>Excludes:</span>
            </div>
            <ul className="text-xs text-gray-600 space-y-0.5 ml-4">
              {service.excludes.map((item, index) => (
                <li key={index} className="flex items-start space-x-1">
                  <span className="text-orange-500 mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Special Pricing */}
        {service.specialPricing && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-2">
            <div className="text-xs font-medium text-blue-800 flex items-center space-x-1 mb-1">
              <Info className="w-3 h-3" />
              <span>Optional Upgrade:</span>
            </div>
            <div className="text-xs text-blue-700">
              {service.specialPricing.description} (+£{service.specialPricing.additionalCost})
            </div>
          </div>
        )}

        {/* Additional Notes */}
        {service.additionalNotes && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-2">
            <div className="text-xs font-medium text-yellow-800 flex items-center space-x-1 mb-1">
              <Info className="w-3 h-3" />
              <span>Important:</span>
            </div>
            <div className="text-xs text-yellow-700">
              {service.additionalNotes}
            </div>
          </div>
        )}

        {/* Warranty */}
        <div className="flex items-center space-x-1 text-xs text-gray-600">
          <Shield className="w-3 h-3" />
          <span>{service.warranty} warranty</span>
        </div>

        {/* Common Issues Preview */}
        {service.commonIssues && service.commonIssues.length > 0 && (
          <details className="group/details">
            <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 flex items-center space-x-1">
              <span>Common issues this fixes...</span>
              <span className="transform transition-transform group-open/details:rotate-90">▶</span>
            </summary>
            <div className="mt-1 ml-3 space-y-0.5">
              {service.commonIssues.slice(0, 3).map((issue, index) => (
                <div key={index} className="text-xs text-gray-600 flex items-start space-x-1">
                  <span className="text-gray-400 mt-0.5">•</span>
                  <span>{issue}</span>
                </div>
              ))}
              {service.commonIssues.length > 3 && (
                <div className="text-xs text-gray-500 italic">
                  +{service.commonIssues.length - 3} more...
                </div>
              )}
            </div>
          </details>
        )}
      </div>

      {/* Hover overlay for better interactivity */}
      <div className={cn(
        'absolute inset-0 rounded-xl transition-opacity duration-200',
        'bg-gradient-to-r from-trust-500/5 to-professional-500/5 opacity-0',
        'group-hover:opacity-100',
        isSelected && 'opacity-100'
      )} />
    </div>
  );
};

export default ServiceCard;