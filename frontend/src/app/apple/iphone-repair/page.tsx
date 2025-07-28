'use client';

import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import ServicePageAnalytics from '@/components/analytics/ServicePageAnalytics';
import { 
  Smartphone, 
  Camera, 
  Battery,
  ArrowRight,
  Star,
  CheckCircle,
  Clock,
  Shield,
  Wrench,
  Apple,
  Speaker,
  Award,
  RefreshCw,
  Droplets,
  Zap
} from 'lucide-react';

// iPhone repair services
const iPhoneRepairServices = [
  {
    id: 'iphone-screen-repair',
    title: 'iPhone Screen Repair',
    description: 'Professional iPhone screen replacement with genuine Apple displays for all iPhone models.',
    icon: Smartphone,
    gradient: 'from-blue-500 to-purple-600',
    pricing: { from: 49, currency: 'GBP' },
    popular: true,
    models: ['iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15', 'iPhone 14 Series', 'iPhone 13 Series', 'iPhone 12 Series'],
    features: ['Genuine Apple screens', 'True Tone technology', 'Face ID compatibility', 'Same-day service'],
    timeframe: '30-60 minutes'
  },
  {
    id: 'iphone-battery-replacement',
    title: 'iPhone Battery Replacement',
    description: 'Restore your iPhone battery life with genuine Apple batteries and professional installation.',
    icon: Battery,
    gradient: 'from-green-500 to-emerald-600',
    pricing: { from: 39, currency: 'GBP' },
    models: ['iPhone 15 Series', 'iPhone 14 Series', 'iPhone 13 Series', 'iPhone 12 Series', 'iPhone 11 Series'],
    features: ['Genuine Apple batteries', 'Battery health optimization', 'Quick replacement', '90-day warranty'],
    timeframe: '45-60 minutes'
  },
  {
    id: 'iphone-camera-repair',
    title: 'iPhone Camera Repair',
    description: 'Expert iPhone camera repair including back camera, front camera, and camera lens replacement.',
    icon: Camera,
    gradient: 'from-purple-500 to-pink-600',
    pricing: { from: 69, currency: 'GBP' },
    models: ['iPhone 15 Pro Series', 'iPhone 14 Pro Series', 'iPhone 13 Pro Series', 'All iPhone Models'],
    features: ['Camera module replacement', 'Lens replacement', 'Focus calibration', 'Quality testing'],
    timeframe: '60-90 minutes'
  },
  {
    id: 'iphone-water-damage',
    title: 'iPhone Water Damage Repair',
    description: 'Comprehensive water damage repair service to restore your iPhone to full functionality.',
    icon: Droplets,
    gradient: 'from-cyan-500 to-blue-600',
    pricing: { from: 89, currency: 'GBP' },
    models: ['All iPhone Models', 'Emergency Service Available'],
    features: ['Liquid damage assessment', 'Component cleaning', 'Logic board repair', 'Data recovery'],
    timeframe: '2-4 hours'
  },
  {
    id: 'iphone-charging-port',
    title: 'iPhone Charging Port Repair',
    description: 'Fix charging issues with professional Lightning port and USB-C port repair services.',
    icon: Zap,
    gradient: 'from-orange-500 to-red-600',
    pricing: { from: 59, currency: 'GBP' },
    models: ['iPhone 15 Series (USB-C)', 'iPhone 14 & Earlier (Lightning)', 'All iPhone Models'],
    features: ['Port cleaning', 'Port replacement', 'Charging optimization', 'Cable testing'],
    timeframe: '30-45 minutes'
  },
  {
    id: 'iphone-speaker-repair',
    title: 'iPhone Speaker Repair',
    description: 'Restore audio quality with professional speaker replacement for earpiece and loud speaker.',
    icon: Speaker,
    gradient: 'from-indigo-500 to-purple-600',
    pricing: { from: 49, currency: 'GBP' },
    models: ['All iPhone Models', 'Earpiece & Loud Speaker', 'Audio Testing'],
    features: ['Speaker replacement', 'Audio calibration', 'Volume testing', 'Sound quality check'],
    timeframe: '45-60 minutes'
  }
];

// iPhone models we service
const iPhoneModels = [
  {
    series: 'iPhone 15 Series',
    models: ['iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15 Plus', 'iPhone 15'],
    year: '2023',
    features: ['USB-C', 'Titanium Pro Models', 'Action Button', 'Latest iOS']
  },
  {
    series: 'iPhone 14 Series',
    models: ['iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14 Plus', 'iPhone 14'],
    year: '2022',
    features: ['Dynamic Island', 'Always-On Display', 'Crash Detection', 'Emergency SOS']
  },
  {
    series: 'iPhone 13 Series',
    models: ['iPhone 13 Pro Max', 'iPhone 13 Pro', 'iPhone 13 Mini', 'iPhone 13'],
    year: '2021',
    features: ['ProMotion Display', 'Cinematic Mode', 'A15 Bionic', 'Improved Battery']
  },
  {
    series: 'iPhone 12 Series',
    models: ['iPhone 12 Pro Max', 'iPhone 12 Pro', 'iPhone 12 Mini', 'iPhone 12'],
    year: '2020',
    features: ['5G Connectivity', 'MagSafe', 'Ceramic Shield', 'OLED Display']
  }
];

// Quality assurance features
const qualityFeatures = [
  {
    title: 'Genuine Apple Parts',
    description: 'Only genuine Apple components and accessories for authentic quality',
    icon: Apple
  },
  {
    title: 'Expert Technicians',
    description: 'Apple-certified technicians with specialized iPhone repair expertise',
    icon: Award
  },
  {
    title: 'Same-Day Service',
    description: 'Most iPhone repairs completed within 1-2 hours for quick turnaround',
    icon: Clock
  },
  {
    title: 'Comprehensive Warranty',
    description: 'All iPhone repairs backed by our 90-day comprehensive warranty',
    icon: Shield
  }
];

// Common iPhone issues
const commonIssues = [
  'Cracked or shattered screen',
  'Battery draining quickly',
  'Camera not working properly',
  'Water damage from liquid exposure',
  'Charging port not working',
  'Speaker or microphone issues',
  'Home button not responding',
  'Face ID or Touch ID problems',
  'Overheating during use',
  'Apps crashing or freezing'
];

export default function iPhoneRepairPage() {
  return (
    <MainLayout>
      <ServicePageAnalytics 
        pageName="iPhone Repair"
        pageCategory="Apple Services"
        pageId="iphone-repair"
        services={iPhoneRepairServices}
      >
        {/* Hero Section */}
        <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-700 to-pink-800">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/15 via-transparent to-purple-500/15"></div>
        </div>

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-6">
            <Smartphone className="w-12 h-12 text-white mr-4" />
            <h1 className="text-5xl md:text-6xl font-bold text-white">
              iPhone Repair Services
            </h1>
          </div>
          <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Professional iPhone repair services for all models with genuine Apple parts, expert technicians, and same-day service.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-blue-50 transition-all duration-300 flex items-center justify-center">
              Book iPhone Repair
              <ArrowRight className="ml-2 w-5 h-5" />
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-white hover:text-blue-600 transition-all duration-300">
              Get Free Quote
            </button>
          </div>
        </div>
      </section>

      {/* iPhone Repair Services */}
      <section className="py-20 px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              iPhone Repair Services
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive iPhone repair services for all models with genuine Apple parts and professional expertise.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {iPhoneRepairServices.map((service) => (
              <div
                key={service.id}
                className="group relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-blue-200"
              >
                {service.popular && (
                  <div className="absolute -top-3 left-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
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
                    <span className="text-sm text-blue-600 font-semibold">{service.timeframe}</span>
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
                  <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 flex items-center">
                    Book Now
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* iPhone Models We Service */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              iPhone Models We Service
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Professional repair services for all iPhone models from the latest iPhone 15 series to older models.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {iPhoneModels.map((modelGroup, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200 hover:border-blue-200 transition-all duration-300 group">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">{modelGroup.series}</h3>
                  <span className="text-sm text-blue-600 font-semibold">{modelGroup.year}</span>
                </div>
                
                <div className="space-y-2 mb-4">
                  {modelGroup.models.map((model, idx) => (
                    <div key={idx} className="text-sm text-gray-600">• {model}</div>
                  ))}
                </div>

                <div className="space-y-1">
                  {modelGroup.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                      <span className="text-xs text-gray-600">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Common iPhone Issues */}
      <section className="py-20 px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Common iPhone Issues We Fix
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our expert technicians can diagnose and repair any iPhone issue quickly and professionally.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {commonIssues.map((issue, index) => (
              <div key={index} className="flex items-center space-x-4 bg-white rounded-2xl p-6 border border-gray-200 hover:border-blue-200 transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <span className="text-gray-700 font-medium">{issue}</span>
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
              Why Choose Our iPhone Repair Service?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Professional quality, genuine parts, and expert service for all your iPhone repair needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {qualityFeatures.map((feature, index) => (
              <div key={index} className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
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
      <section className="py-20 px-6 bg-gradient-to-r from-blue-600 to-purple-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Repair Your iPhone?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Book your iPhone repair today and get professional service with genuine Apple parts and same-day turnaround.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-blue-50 transition-all duration-300 flex items-center justify-center">
              Book iPhone Repair Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-white hover:text-blue-600 transition-all duration-300">
              Get Free Quote
            </button>
          </div>
        </div>
      </section>
      </ServicePageAnalytics>
    </MainLayout>
  );
}