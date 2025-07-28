'use client';

import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import ServicePageAnalytics from '@/components/analytics/ServicePageAnalytics';
import { 
  Tablet, 
  Smartphone, 
  Battery,
  ArrowRight,
  Star,
  CheckCircle,
  Clock,
  Shield,
  Wrench,
  Apple,
  Zap,
  Award,
  RefreshCw,
  Monitor,
  Pen
} from 'lucide-react';

// iPad repair services
const iPadRepairServices = [
  {
    id: 'ipad-screen-repair',
    title: 'iPad Screen Repair',
    description: 'Professional iPad screen replacement with genuine Apple displays for all iPad models and sizes.',
    icon: Tablet,
    gradient: 'from-blue-500 to-purple-600',
    pricing: { from: 89, currency: 'GBP' },
    popular: true,
    models: ['iPad Pro 12.9"', 'iPad Pro 11"', 'iPad Air', 'iPad (10th gen)', 'iPad Mini'],
    features: ['Genuine Apple screens', 'Liquid Retina display', 'Apple Pencil compatibility', 'Multi-touch support'],
    timeframe: '2-4 hours'
  },
  {
    id: 'ipad-battery-replacement',
    title: 'iPad Battery Replacement',
    description: 'Restore your iPad battery life with genuine Apple batteries and professional installation.',
    icon: Battery,
    gradient: 'from-green-500 to-emerald-600',
    pricing: { from: 99, currency: 'GBP' },
    models: ['All iPad Models', 'iPad Pro Series', 'iPad Air Series', 'iPad Mini Series'],
    features: ['Genuine Apple batteries', 'Extended battery life', 'Optimal performance', '90-day warranty'],
    timeframe: '2-3 hours'
  },
  {
    id: 'ipad-charging-port',
    title: 'iPad Charging Port Repair',
    description: 'Fix charging issues with professional Lightning port and USB-C port repair services.',
    icon: Zap,
    gradient: 'from-orange-500 to-red-600',
    pricing: { from: 79, currency: 'GBP' },
    models: ['iPad Pro (USB-C)', 'iPad Air (USB-C)', 'Older iPads (Lightning)', 'All iPad Models'],
    features: ['Port cleaning', 'Port replacement', 'Fast charging support', 'Cable testing'],
    timeframe: '1-2 hours'
  },
  {
    id: 'ipad-home-button',
    title: 'iPad Home Button Repair',
    description: 'Repair or replace non-responsive home buttons and Touch ID sensors for older iPad models.',
    icon: Smartphone,
    gradient: 'from-purple-500 to-pink-600',
    pricing: { from: 69, currency: 'GBP' },
    models: ['iPad (6th-9th gen)', 'iPad Air 2', 'iPad Mini 3-5', 'iPad Pro (1st-2nd gen)'],
    features: ['Home button replacement', 'Touch ID repair', 'Button calibration', 'Functionality testing'],
    timeframe: '1-2 hours'
  },
  {
    id: 'ipad-camera-repair',
    title: 'iPad Camera Repair',
    description: 'Professional iPad camera repair including front and rear camera replacement and lens repair.',
    icon: Monitor,
    gradient: 'from-cyan-500 to-blue-600',
    pricing: { from: 89, currency: 'GBP' },
    models: ['iPad Pro Series', 'iPad Air Series', 'iPad (10th gen)', 'All iPad Models'],
    features: ['Camera module replacement', 'Lens repair', 'Focus calibration', 'Video recording test'],
    timeframe: '2-3 hours'
  },
  {
    id: 'ipad-speaker-repair',
    title: 'iPad Speaker Repair',
    description: 'Restore audio quality with professional speaker replacement and audio system repair.',
    icon: Wrench,
    gradient: 'from-indigo-500 to-purple-600',
    pricing: { from: 79, currency: 'GBP' },
    models: ['iPad Pro (4-speaker)', 'iPad Air (stereo)', 'iPad Mini', 'All iPad Models'],
    features: ['Speaker replacement', 'Audio calibration', 'Stereo balance', 'Volume testing'],
    timeframe: '2-3 hours'
  }
];

// iPad models we service
const iPadModels = [
  {
    series: 'iPad Pro',
    models: ['iPad Pro 12.9" (6th gen)', 'iPad Pro 11" (4th gen)', 'iPad Pro 12.9" (5th gen)', 'iPad Pro 11" (3rd gen)'],
    year: '2021-2022',
    features: ['M2 / M1 Chip', 'Liquid Retina XDR', 'Apple Pencil (2nd gen)', 'Magic Keyboard'],
    screenSizes: ['11"', '12.9"']
  },
  {
    series: 'iPad Air',
    models: ['iPad Air (5th gen)', 'iPad Air (4th gen)'],
    year: '2020-2022',
    features: ['M1 / A14 Bionic', 'Liquid Retina display', 'USB-C', 'Apple Pencil (2nd gen)'],
    screenSizes: ['10.9"']
  },
  {
    series: 'iPad',
    models: ['iPad (10th gen)', 'iPad (9th gen)', 'iPad (8th gen)', 'iPad (7th gen)'],
    year: '2019-2022',
    features: ['A14 / A10-A12 Bionic', 'Retina display', 'Lightning / USB-C', 'Apple Pencil (1st gen)'],
    screenSizes: ['10.2"', '10.9"']
  },
  {
    series: 'iPad Mini',
    models: ['iPad Mini (6th gen)', 'iPad Mini (5th gen)'],
    year: '2019-2021',
    features: ['A15 / A12 Bionic', 'Liquid Retina display', 'USB-C / Lightning', 'Apple Pencil (2nd gen)'],
    screenSizes: ['8.3"', '7.9"']
  }
];

// iPad repair specialties
const repairSpecialties = [
  {
    specialty: 'Apple Pencil Support',
    description: 'Ensuring Apple Pencil compatibility and pressure sensitivity after screen repairs',
    icon: Pen,
    importance: 'Critical for creative professionals'
  },
  {
    specialty: 'Multi-Touch Calibration',
    description: 'Precise calibration for multi-touch gestures and palm rejection',
    icon: Tablet,
    importance: 'Essential for productivity'
  },
  {
    specialty: 'Display Color Accuracy',
    description: 'Professional color calibration for True Tone and P3 wide color gamut',
    icon: Monitor,
    importance: 'Important for design work'
  },
  {
    specialty: 'Fast Charging Support',
    description: 'Ensuring compatibility with USB-C fast charging and power delivery',
    icon: Zap,
    importance: 'Convenience and efficiency'
  }
];

// Quality assurance
const qualityAssurance = [
  {
    title: 'Genuine Apple Parts',
    description: 'Only genuine Apple components for authentic performance and compatibility',
    icon: Apple
  },
  {
    title: 'Specialized Tools',
    description: 'Professional iPad repair tools and equipment for precise work',
    icon: Wrench
  },
  {
    title: 'Quick Turnaround',
    description: 'Most iPad repairs completed within 2-4 hours for fast service',
    icon: Clock
  },
  {
    title: 'Quality Guarantee',
    description: 'Comprehensive 90-day warranty on all iPad repairs and parts',
    icon: Shield
  }
];

export default function iPadRepairPage() {
  return (
    <MainLayout>
      <ServicePageAnalytics 
        pageName="iPad Repair"
        pageCategory="Apple Services"
        pageId="ipad-repair"
        services={iPadRepairServices}
      >
        {/* Hero Section */}
        <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-600 via-blue-700 to-purple-800">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/15 via-transparent to-blue-500/15"></div>
        </div>

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-6">
            <Tablet className="w-12 h-12 text-white mr-4" />
            <h1 className="text-5xl md:text-6xl font-bold text-white">
              iPad Repair Services
            </h1>
          </div>
          <p className="text-xl md:text-2xl text-cyan-100 mb-8 max-w-3xl mx-auto">
            Professional iPad repair services for all models with genuine Apple parts, expert technicians, and Apple Pencil compatibility.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-cyan-600 px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-cyan-50 transition-all duration-300 flex items-center justify-center">
              Book iPad Repair
              <ArrowRight className="ml-2 w-5 h-5" />
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-white hover:text-cyan-600 transition-all duration-300">
              Get Free Quote
            </button>
          </div>
        </div>
      </section>

      {/* iPad Repair Services */}
      <section className="py-20 px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              iPad Repair Services
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive iPad repair services for all models with genuine Apple parts and professional expertise.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {iPadRepairServices.map((service) => (
              <div
                key={service.id}
                className="group relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-cyan-200"
              >
                {service.popular && (
                  <div className="absolute -top-3 left-6 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                )}

                <div className={`w-16 h-16 bg-gradient-to-r ${service.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <service.icon className="w-8 h-8 text-white" />
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-4">{service.title}</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">{service.description}</p>

                <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">Repair Time:</span>
                    <span className="text-sm text-cyan-600 font-semibold">{service.timeframe}</span>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  {service.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-gray-500">Starting from</span>
                    <div className="text-2xl font-bold text-gray-900">£{service.pricing.from}</div>
                  </div>
                  <button className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 flex items-center">
                    Book Now
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* iPad Models We Service */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              iPad Models We Service
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Professional repair services for all iPad models from the latest iPad Pro to older generation iPads.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {iPadModels.map((modelGroup, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200 hover:border-cyan-200 transition-all duration-300 group">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">{modelGroup.series}</h3>
                  <span className="text-sm text-cyan-600 font-semibold">{modelGroup.year}</span>
                </div>
                
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {modelGroup.screenSizes.map((size, idx) => (
                      <span key={idx} className="px-2 py-1 bg-cyan-100 text-cyan-800 rounded-full text-xs font-semibold">
                        {size}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-1 mb-4">
                  {modelGroup.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                      <span className="text-xs text-gray-600">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="text-xs text-gray-500">
                  {modelGroup.models.length} models supported
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Repair Specialties */}
      <section className="py-20 px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              iPad Repair Specialties
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Specialized expertise in iPad-specific features and functionality for professional results.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {repairSpecialties.map((specialty, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-cyan-200 transition-all duration-300 group">
                <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <specialty.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{specialty.specialty}</h3>
                <p className="text-gray-600 mb-4 text-sm">{specialty.description}</p>
                <div className="text-xs text-cyan-600 font-semibold">{specialty.importance}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quality Assurance */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Why Choose Our iPad Repair Service?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Professional quality, genuine parts, and specialized expertise for all your iPad repair needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {qualityAssurance.map((feature, index) => (
              <div key={index} className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-cyan-600 to-blue-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Repair Your iPad?
          </h2>
          <p className="text-xl text-cyan-100 mb-8">
            Book your iPad repair today and get professional service with genuine Apple parts and Apple Pencil compatibility.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-cyan-600 px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-cyan-50 transition-all duration-300 flex items-center justify-center">
              Book iPad Repair Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-white hover:text-cyan-600 transition-all duration-300">
              Get Free Quote
            </button>
          </div>
        </div>
      </section>
      </ServicePageAnalytics>
    </MainLayout>
  );
}