'use client';

import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { 
  Battery, 
  Laptop, 
  Zap,
  ArrowRight,
  Star,
  CheckCircle,
  Clock,
  Shield,
  Wrench,
  Apple,
  TrendingUp,
  Award,
  RefreshCw,
  AlertTriangle,
  Info
} from 'lucide-react';

// Battery replacement services
const batteryServices = [
  {
    id: 'macbook-air-battery',
    title: 'MacBook Air Battery',
    description: 'Professional battery replacement for MacBook Air with genuine Apple batteries and expert installation.',
    icon: Battery,
    gradient: 'from-green-500 to-emerald-600',
    pricing: { from: 129, currency: 'GBP' },
    popular: true,
    models: ['MacBook Air 13" (2018-2024)', 'MacBook Air 15" (2023-2024)', 'MacBook Air 11" (2010-2017)'],
    features: ['Genuine Apple battery', 'Up to 18 hours battery life', 'Quick installation', '90-day warranty'],
    batteryLife: '15-18 hours',
    cycles: '1000 cycles'
  },
  {
    id: 'macbook-pro-battery',
    title: 'MacBook Pro Battery',
    description: 'Expert battery replacement for MacBook Pro with high-capacity genuine Apple batteries.',
    icon: Laptop,
    gradient: 'from-blue-500 to-purple-600',
    pricing: { from: 159, currency: 'GBP' },
    models: ['MacBook Pro 13"', 'MacBook Pro 14"', 'MacBook Pro 16"', 'MacBook Pro 15"'],
    features: ['High-capacity battery', 'Up to 20 hours battery life', 'Professional installation', 'Battery health optimization'],
    batteryLife: '17-20 hours',
    cycles: '1000 cycles'
  },
  {
    id: 'older-macbook-battery',
    title: 'Older MacBook Battery',
    description: 'Battery replacement for older MacBook models with compatible high-quality batteries.',
    icon: Battery,
    gradient: 'from-orange-500 to-red-600',
    pricing: { from: 99, currency: 'GBP' },
    models: ['MacBook Pro (2012-2017)', 'MacBook Air (2010-2017)', 'MacBook (2015-2017)'],
    features: ['Compatible batteries', 'Restored battery life', 'Professional service', 'Quality guarantee'],
    batteryLife: '8-12 hours',
    cycles: '500-1000 cycles'
  }
];

// Battery warning signs
const batteryWarnings = [
  {
    warning: 'Short Battery Life',
    description: 'Battery drains quickly even with minimal usage',
    icon: Battery,
    severity: 'High',
    action: 'Replace immediately'
  },
  {
    warning: 'Overheating',
    description: 'Device gets unusually hot during normal use',
    icon: Zap,
    severity: 'Critical',
    action: 'Stop using immediately'
  },
  {
    warning: 'Swollen Battery',
    description: 'Physical swelling causing trackpad or keyboard issues',
    icon: AlertTriangle,
    severity: 'Critical',
    action: 'Professional service required'
  },
  {
    warning: 'Service Battery Warning',
    description: 'macOS displays service battery notification',
    icon: Info,
    severity: 'Medium',
    action: 'Schedule replacement'
  }
];

// Battery replacement process
const replacementProcess = [
  {
    step: 1,
    title: 'Battery Diagnosis',
    description: 'Complete battery health assessment and capacity testing using professional tools.',
    icon: Shield,
    duration: '15-30 min'
  },
  {
    step: 2,
    title: 'Safe Removal',
    description: 'Careful removal of old battery with proper disposal and safety protocols.',
    icon: Wrench,
    duration: '30-45 min'
  },
  {
    step: 3,
    title: 'Installation',
    description: 'Professional installation of genuine Apple battery with proper calibration.',
    icon: Battery,
    duration: '45-60 min'
  },
  {
    step: 4,
    title: 'Testing & Calibration',
    description: 'Comprehensive testing and battery calibration for optimal performance.',
    icon: CheckCircle,
    duration: '30-45 min'
  }
];

// Battery health benefits
const batteryBenefits = [
  {
    title: 'Genuine Apple Batteries',
    description: 'Only genuine Apple batteries with original specifications and safety features',
    icon: Apple
  },
  {
    title: 'Extended Battery Life',
    description: 'Restore your MacBook to original battery performance and longevity',
    icon: TrendingUp
  },
  {
    title: 'Professional Service',
    description: 'Expert technicians with specialized tools and proper safety procedures',
    icon: Award
  },
  {
    title: 'Environmental Safety',
    description: 'Proper disposal of old batteries and environmentally responsible service',
    icon: RefreshCw
  }
];

export default function MacBatteryReplacementPage() {
  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-600 via-emerald-700 to-teal-800">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/15 via-transparent to-emerald-500/15"></div>
        </div>

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-6">
            <Battery className="w-12 h-12 text-white mr-4" />
            <h1 className="text-5xl md:text-6xl font-bold text-white">
              Mac Battery Replacement
            </h1>
          </div>
          <p className="text-xl md:text-2xl text-green-100 mb-8 max-w-3xl mx-auto">
            Professional MacBook battery replacement with genuine Apple batteries, expert installation, and restored performance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-green-600 px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-green-50 transition-all duration-300 flex items-center justify-center">
              Book Battery Replacement
              <ArrowRight className="ml-2 w-5 h-5" />
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-white hover:text-green-600 transition-all duration-300">
              Check Battery Health
            </button>
          </div>
        </div>
      </section>

      {/* Battery Replacement Services */}
      <section className="py-20 px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Mac Battery Replacement Services
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Professional battery replacement for all MacBook models with genuine Apple batteries and expert installation.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {batteryServices.map((service) => (
              <div
                key={service.id}
                className="group relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-green-200"
              >
                {service.popular && (
                  <div className="absolute -top-3 left-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                )}

                <div className={`w-16 h-16 bg-gradient-to-r ${service.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <service.icon className="w-8 h-8 text-white" />
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-4">{service.title}</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">{service.description}</p>

                <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">Battery Life:</span>
                    <span className="text-sm text-green-600 font-semibold">{service.batteryLife}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">Cycle Count:</span>
                    <span className="text-sm text-green-600 font-semibold">{service.cycles}</span>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-2">Compatible Models:</h4>
                  <div className="space-y-1">
                    {service.models.map((model, index) => (
                      <div key={index} className="text-sm text-gray-600">• {model}</div>
                    ))}
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
                  <button className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-300 flex items-center">
                    Book Now
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Battery Warning Signs */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Signs Your Battery Needs Replacement
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Recognize these warning signs to know when your MacBook battery needs professional replacement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {batteryWarnings.map((warning, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200 hover:border-green-200 transition-all duration-300 group">
                <div className={`w-12 h-12 bg-gradient-to-r ${
                  warning.severity === 'Critical' ? 'from-red-500 to-red-600' :
                  warning.severity === 'High' ? 'from-orange-500 to-orange-600' :
                  'from-yellow-500 to-yellow-600'
                } rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <warning.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{warning.warning}</h3>
                <p className="text-gray-600 mb-4 text-sm">{warning.description}</p>
                <div className="flex flex-col space-y-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold self-start ${
                    warning.severity === 'Critical' ? 'bg-red-100 text-red-800' :
                    warning.severity === 'High' ? 'bg-orange-100 text-orange-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {warning.severity}
                  </span>
                  <span className="text-sm text-green-600 font-semibold">{warning.action}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Battery Replacement Process */}
      <section className="py-20 px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Our Battery Replacement Process
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Professional battery replacement process with genuine Apple batteries and expert installation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {replacementProcess.map((step) => (
              <div key={step.step} className="text-center group">
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                    <step.icon className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {step.step}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600 mb-4">{step.description}</p>
                <div className="text-sm text-green-600 font-semibold">{step.duration}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Battery Benefits */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Benefits of Professional Battery Replacement
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Why choose professional battery replacement with genuine Apple batteries and expert service.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {batteryBenefits.map((benefit, index) => (
              <div key={index} className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <benefit.icon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-green-600 to-emerald-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Replace Your Mac Battery?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Book your battery replacement today and restore your MacBook to peak performance with genuine Apple batteries.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-green-600 px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-green-50 transition-all duration-300 flex items-center justify-center">
              Book Battery Replacement Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-white hover:text-green-600 transition-all duration-300">
              Check Battery Health
            </button>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}