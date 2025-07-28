'use client';

import React from 'react';
import { ChevronRight, Shield, Clock, CheckCircle, Star, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ServiceBand, getServicesByBand } from '@/lib/data/laptop-repair-services';

interface BandSelectorProps {
  bands: ServiceBand[];
  selectedBand: string | null;
  onBandSelect: (bandId: 'A' | 'B' | 'C') => void;
  className?: string;
}

const getBandIcon = (bandId: string) => {
  switch (bandId) {
    case 'A': return CheckCircle;
    case 'B': return Star;
    case 'C': return Award;
    default: return CheckCircle;
  }
};

const getBandGradient = (bandId: string, isSelected: boolean) => {
  if (isSelected) {
    switch (bandId) {
      case 'A': return 'bg-gradient-to-br from-trust-100 to-trust-200 border-trust-400';
      case 'B': return 'bg-gradient-to-br from-professional-100 to-professional-200 border-professional-400';
      case 'C': return 'bg-gradient-to-br from-neutral-100 to-neutral-200 border-neutral-400';
      default: return 'bg-gradient-to-br from-gray-100 to-gray-200 border-gray-400';
    }
  } else {
    switch (bandId) {
      case 'A': return 'bg-gradient-to-br from-trust-50 to-white border-trust-200 hover:border-trust-300';
      case 'B': return 'bg-gradient-to-br from-professional-50 to-white border-professional-200 hover:border-professional-300';
      case 'C': return 'bg-gradient-to-br from-neutral-50 to-white border-neutral-200 hover:border-neutral-300';
      default: return 'bg-gradient-to-br from-gray-50 to-white border-gray-200 hover:border-gray-300';
    }
  }
};

const getBandAccentColor = (bandId: string) => {
  switch (bandId) {
    case 'A': return 'text-trust-600';
    case 'B': return 'text-professional-600';
    case 'C': return 'text-neutral-600';
    default: return 'text-gray-600';
  }
};

const BandCard: React.FC<{
  band: ServiceBand;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ band, isSelected, onSelect }) => {
  const IconComponent = getBandIcon(band.id);
  const services = getServicesByBand(band.id);
  
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        'relative group cursor-pointer transition-all duration-300 rounded-2xl border-2 p-6',
        'hover:shadow-xl hover:-translate-y-2 transform',
        'focus:outline-none focus:ring-2 focus:ring-trust-500 focus:ring-offset-2',
        getBandGradient(band.id, isSelected),
        isSelected && 'shadow-xl -translate-y-2 ring-2 ring-offset-2',
        isSelected && band.id === 'A' && 'ring-trust-300',
        isSelected && band.id === 'B' && 'ring-professional-300',
        isSelected && band.id === 'C' && 'ring-neutral-300'
      )}
      aria-pressed={isSelected}
    >
      {/* Popular Badge for Band B */}
      {band.id === 'B' && (
        <div className="absolute -top-3 left-6 bg-gradient-to-r from-professional-500 to-professional-600 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
          Most Popular
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300',
            'group-hover:scale-110',
            band.id === 'A' && 'bg-trust-500',
            band.id === 'B' && 'bg-professional-500',
            band.id === 'C' && 'bg-neutral-700'
          )}>
            <IconComponent className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-900 leading-tight">
              Band {band.id}
            </h3>
            <p className="text-sm text-gray-600">
              {services.length} services
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900">
            £{band.price}
          </div>
          <div className="text-sm text-gray-600">
            Fixed labour fee
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-700 text-sm leading-relaxed mb-4">
        {band.description}
      </p>

      {/* Features */}
      <div className="space-y-2 mb-6">
        {band.features.map((feature, index) => (
          <div key={index} className="flex items-center space-x-2">
            <CheckCircle className={cn('w-4 h-4', getBandAccentColor(band.id))} />
            <span className="text-sm text-gray-700">{feature}</span>
          </div>
        ))}
      </div>

      {/* Service Examples */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 text-sm mb-2">Common Services:</h4>
        <div className="space-y-1">
          {services.slice(0, 3).map((service, index) => (
            <div key={index} className="text-xs text-gray-600 flex items-start space-x-1">
              <span className={cn('mt-1 w-1 h-1 rounded-full', 
                band.id === 'A' && 'bg-trust-400',
                band.id === 'B' && 'bg-professional-400',
                band.id === 'C' && 'bg-neutral-400'
              )} />
              <span>{service.name}</span>
            </div>
          ))}
          {services.length > 3 && (
            <div className="text-xs text-gray-500 italic">
              +{services.length - 3} more services...
            </div>
          )}
        </div>
      </div>

      {/* Trust Elements */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-4 text-xs text-gray-600">
          <div className="flex items-center space-x-1">
            <Shield className="w-3 h-3" />
            <span>1 Year Guarantee</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>No Upfront Payment</span>
          </div>
        </div>
        
        <ChevronRight className={cn(
          'w-5 h-5 transition-transform duration-300 group-hover:translate-x-1',
          getBandAccentColor(band.id)
        )} />
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-4 right-4">
          <div className={cn(
            'w-6 h-6 rounded-full flex items-center justify-center',
            band.id === 'A' && 'bg-trust-500',
            band.id === 'B' && 'bg-professional-500',
            band.id === 'C' && 'bg-neutral-700'
          )}>
            <CheckCircle className="w-4 h-4 text-white" />
          </div>
        </div>
      )}

      {/* Hover Glow Effect */}
      <div className={cn(
        'absolute inset-0 rounded-2xl transition-opacity duration-300 opacity-0 group-hover:opacity-100',
        band.id === 'A' && 'bg-trust-400/5',
        band.id === 'B' && 'bg-professional-400/5',
        band.id === 'C' && 'bg-neutral-400/5'
      )} />
    </div>
  );
};

const BandSelector: React.FC<BandSelectorProps> = ({
  bands,
  selectedBand,
  onBandSelect,
  className
}) => {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Section Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">
          Choose Your Service Band
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Select the service category that matches your laptop's needs. All prices include fixed labour fees with no upfront payment required.
        </p>
      </div>

      {/* Trust Signals Bar */}
      <div className="bg-gradient-to-r from-trust-50 to-professional-50 border border-trust-200 rounded-xl p-4">
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-700">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-trust-600" />
            <span className="font-medium">Fixed Labour Fee - No Hidden Costs</span>
          </div>
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-professional-600" />
            <span className="font-medium">1 Year Guarantee</span>
          </div>
          <div className="flex items-center space-x-2">
            <Star className="w-5 h-5 text-yellow-500" />
            <span className="font-medium">15% Off Students & Blue Light Card</span>
          </div>
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-green-600" />
            <span className="font-medium">Free Estimate Available</span>
          </div>
        </div>
      </div>

      {/* Band Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {bands.map((band) => (
          <BandCard
            key={band.id}
            band={band}
            isSelected={selectedBand === band.id}
            onSelect={() => onBandSelect(band.id)}
          />
        ))}
      </div>

      {/* Help Text */}
      <div className="text-center">
        <p className="text-sm text-gray-500">
          Not sure which band? Select any band to see the detailed services, or{' '}
          <button className="text-trust-600 hover:text-trust-700 underline font-medium">
            contact us for guidance
          </button>
        </p>
      </div>
    </div>
  );
};

export default BandSelector;