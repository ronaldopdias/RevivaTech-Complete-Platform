'use client';

import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { 
  Monitor, 
  Laptop, 
  Smartphone,
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
  Eye,
  Palette
} from 'lucide-react';

// MacBook screen repair services
const screenRepairServices = [
  {
    id: 'macbook-air-screen',
    title: 'MacBook Air Screen',
    description: 'Professional screen replacement for all MacBook Air models with Retina display technology.',
    icon: Laptop,
    gradient: 'from-blue-500 to-purple-600',
    pricing: { from: 189, currency: 'GBP' },
    popular: true,
    models: ['MacBook Air 13" (2018-2024)', 'MacBook Air 15" (2023-2024)'],
    features: ['Retina display', 'True Tone technology', 'P3 wide color gamut', '90-day warranty']
  },
  {
    id: 'macbook-pro-screen',
    title: 'MacBook Pro Screen',
    description: 'Expert screen replacement for MacBook Pro including Pro Display XDR technology.',
    icon: Monitor,
    gradient: 'from-green-500 to-teal-600',
    pricing: { from: 249, currency: 'GBP' },
    models: ['MacBook Pro 13"', 'MacBook Pro 14"', 'MacBook Pro 16"'],
    features: ['Liquid Retina XDR', '1000 nits brightness', 'ProMotion technology', 'Mini-LED backlight']
  },
  {
    id: 'macbook-lcd-screen',
    title: 'MacBook LCD Screen',
    description: 'Screen replacement for older MacBook models with LCD technology.',
    icon: Monitor,
    gradient: 'from-purple-500 to-pink-600',
    pricing: { from: 149, currency: 'GBP' },
    models: ['MacBook Pro (2012-2017)', 'MacBook Air (2010-2017)'],
    features: ['LCD display', 'LED backlight', 'Anti-glare coating', 'Original quality']
  }
];

// Screen issues we fix
const screenIssues = [
  {
    issue: 'Cracked Screen',
    description: 'Physical damage to the screen glass or LCD panel',
    icon: Monitor,
    severity: 'High',
    timeframe: '2-4 hours',
    symptoms: ['Visible cracks', 'Display distortion', 'Touch issues']
  },
  {
    issue: 'Black Screen',
    description: 'No display output or completely black screen',
    icon: Eye,
    severity: 'Critical',
    timeframe: '2-6 hours',
    symptoms: ['No display', 'Backlight issues', 'Logic board problems']
  },
  {
    issue: 'Color Issues',
    description: 'Display color problems and calibration issues',
    icon: Palette,
    severity: 'Medium',
    timeframe: '1-2 hours',
    symptoms: ['Color distortion', 'Pink/green tints', 'Brightness issues']
  },
  {
    issue: 'Flickering Display',
    description: 'Screen flickering or intermittent display problems',
    icon: Zap,
    severity: 'High',
    timeframe: '2-4 hours',
    symptoms: ['Screen flickers', 'Intermittent display', 'Cable issues']
  }
];

// Screen repair process
const repairProcess = [
  {
    step: 1,
    title: 'Diagnosis',
    description: 'Complete screen and display system diagnosis to identify the exact issue.',
    icon: Shield,
    duration: '15-30 min'
  },
  {
    step: 2,
    title: 'Screen Removal',
    description: 'Careful removal of the damaged screen assembly using professional tools.',
    icon: Wrench,
    duration: '30-45 min'
  },
  {
    step: 3,
    title: 'Installation',
    description: 'Professional installation of genuine Apple screen with proper calibration.',
    icon: Monitor,
    duration: '45-60 min'
  },
  {
    step: 4,
    title: 'Testing',
    description: 'Comprehensive testing including color accuracy, brightness, and touch response.',
    icon: CheckCircle,
    duration: '15-30 min'
  }
];

// Quality features
const qualityFeatures = [
  {
    title: 'Genuine Apple Screens',
    description: 'Only genuine Apple screen assemblies with original specifications',
    icon: Apple
  },
  {
    title: 'Color Calibration',
    description: 'Professional color calibration for accurate display reproduction',
    icon: Palette
  },
  {
    title: 'Same-Day Service',
    description: 'Most screen repairs completed within 2-4 hours',
    icon: Clock
  },
  {
    title: 'Warranty Coverage',
    description: 'Comprehensive 90-day warranty on all screen repairs',
    icon: Shield
  }
];

export default function MacBookScreenRepairPage() {
  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-800">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/15 via-transparent to-purple-500/15"></div>
        </div>

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-6">
            <Laptop className="w-12 h-12 text-white mr-4" />
            <h1 className="text-5xl md:text-6xl font-bold text-white">
              MacBook Screen Repair
            </h1>
          </div>
          <p className="text-xl md:text-2xl text-purple-100 mb-8 max-w-3xl mx-auto">
            Professional MacBook screen replacement with genuine Apple displays, expert installation, and comprehensive warranty coverage.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-purple-600 px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-purple-50 transition-all duration-300 flex items-center justify-center">
              Book Screen Repair
              <ArrowRight className="ml-2 w-5 h-5" />
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-white hover:text-purple-600 transition-all duration-300">
              Get Free Quote
            </button>
          </div>
        </div>
      </section>

      {/* Screen Repair Services */}
      <section className="py-20 px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              MacBook Screen Repair Services
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Professional screen replacement for all MacBook models with genuine Apple displays and expert installation.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {screenRepairServices.map((service) => (
              <div
                key={service.id}
                className="group relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-purple-200"
              >
                {service.popular && (
                  <div className="absolute -top-3 left-6 bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                )}

                <div className={`w-16 h-16 bg-gradient-to-r ${service.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <service.icon className="w-8 h-8 text-white" />
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-4">{service.title}</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">{service.description}</p>

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
                  <button className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-700 transition-all duration-300 flex items-center">
                    Book Now
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Screen Issues We Fix */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Screen Issues We Fix
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our expert technicians can diagnose and repair any MacBook screen issue quickly and professionally.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {screenIssues.map((issue, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200 hover:border-purple-200 transition-all duration-300 group">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <issue.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{issue.issue}</h3>
                <p className="text-gray-600 mb-4 text-sm">{issue.description}</p>
                <div className="space-y-2 mb-4">
                  {issue.symptoms.map((symptom, idx) => (
                    <div key={idx} className="text-xs text-gray-500">• {symptom}</div>
                  ))}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    issue.severity === 'Critical' ? 'bg-red-100 text-red-800' :
                    issue.severity === 'High' ? 'bg-orange-100 text-orange-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {issue.severity}
                  </span>
                  <span className="text-gray-500">{issue.timeframe}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Repair Process */}
      <section className="py-20 px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Our Screen Repair Process
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Professional screen replacement process with genuine Apple parts and expert installation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {repairProcess.map((step) => (
              <div key={step.step} className="text-center group">
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                    <step.icon className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {step.step}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600 mb-4">{step.description}</p>
                <div className="text-sm text-purple-600 font-semibold">{step.duration}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quality Features */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Why Choose Our Screen Repair Service?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Professional quality, genuine parts, and expert service for all your MacBook screen repair needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {qualityFeatures.map((feature, index) => (
              <div key={index} className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
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
      <section className="py-20 px-6 bg-gradient-to-r from-purple-600 to-pink-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Fix Your MacBook Screen?
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Book your screen repair today and get professional service with genuine Apple displays and comprehensive warranty.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-purple-600 px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-purple-50 transition-all duration-300 flex items-center justify-center">
              Book Screen Repair Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-white hover:text-purple-600 transition-all duration-300">
              Get Free Quote
            </button>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}