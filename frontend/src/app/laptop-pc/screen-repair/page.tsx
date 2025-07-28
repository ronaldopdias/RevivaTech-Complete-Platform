'use client';

import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import ServicePageAnalytics from '@/components/analytics/ServicePageAnalytics';
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
  Zap,
  Award,
  RefreshCw,
  Eye,
  Palette,
  Settings
} from 'lucide-react';

// Screen repair services
const screenRepairServices = [
  {
    id: 'laptop-screen-repair',
    title: 'Laptop Screen Repair',
    description: 'Professional laptop screen replacement for all major brands with LCD, LED, and OLED displays.',
    icon: Laptop,
    gradient: 'from-blue-500 to-purple-600',
    pricing: { from: 89, currency: 'GBP' },
    popular: true,
    screenTypes: ['LCD', 'LED', 'OLED', 'IPS', 'TN'],
    features: ['All screen sizes', 'Touch screen support', 'High-resolution displays', 'Same-day service'],
    timeframe: '2-4 hours'
  },
  {
    id: 'desktop-monitor-repair',
    title: 'Desktop Monitor Repair',
    description: 'Expert desktop monitor repair and replacement services for all monitor brands and sizes.',
    icon: Monitor,
    gradient: 'from-green-500 to-teal-600',
    pricing: { from: 69, currency: 'GBP' },
    screenTypes: ['LCD', 'LED', 'OLED', 'Curved', 'Gaming'],
    features: ['All monitor sizes', 'Gaming monitors', 'Professional displays', 'Color calibration'],
    timeframe: '1-3 hours'
  },
  {
    id: 'touch-screen-repair',
    title: 'Touch Screen Repair',
    description: 'Specialized touch screen repair for laptops and all-in-one PCs with digitizer replacement.',
    icon: Smartphone,
    gradient: 'from-purple-500 to-pink-600',
    pricing: { from: 119, currency: 'GBP' },
    screenTypes: ['Capacitive', 'Resistive', 'Multi-touch', 'Stylus support'],
    features: ['Touch calibration', 'Digitizer replacement', 'Multi-touch support', 'Stylus compatibility'],
    timeframe: '3-5 hours'
  },
  {
    id: 'screen-cable-repair',
    title: 'Screen Cable Repair',
    description: 'Fix display issues caused by damaged or loose screen cables and connectors.',
    icon: Zap,
    gradient: 'from-orange-500 to-red-600',
    pricing: { from: 49, currency: 'GBP' },
    screenTypes: ['LVDS', 'eDP', 'HDMI', 'DisplayPort'],
    features: ['Cable replacement', 'Connector repair', 'Signal testing', 'Connection stability'],
    timeframe: '1-2 hours'
  }
];

// Screen issues we fix
const screenIssues = [
  {
    issue: 'Cracked Screen',
    description: 'Physical damage to the screen glass or LCD panel',
    icon: Monitor,
    severity: 'High',
    symptoms: ['Visible cracks', 'Display distortion', 'Black areas', 'Touch issues'],
    causes: ['Physical impact', 'Pressure damage', 'Dropping device']
  },
  {
    issue: 'No Display',
    description: 'Black screen or no image displayed',
    icon: Eye,
    severity: 'Critical',
    symptoms: ['Black screen', 'No backlight', 'No image', 'Power LED on'],
    causes: ['Backlight failure', 'LCD damage', 'Cable issues', 'Graphics problems']
  },
  {
    issue: 'Flickering Display',
    description: 'Screen flickering or unstable image',
    icon: Zap,
    severity: 'High',
    symptoms: ['Screen flickers', 'Unstable image', 'Intermittent display', 'Color shifting'],
    causes: ['Loose cables', 'Backlight issues', 'Graphics driver', 'Power supply']
  },
  {
    issue: 'Color Problems',
    description: 'Display color distortion or incorrect colors',
    icon: Palette,
    severity: 'Medium',
    symptoms: ['Color distortion', 'Pink/green tint', 'Washed out colors', 'Color banding'],
    causes: ['LCD degradation', 'Backlight aging', 'Graphics settings', 'Color calibration']
  },
  {
    issue: 'Dead Pixels',
    description: 'Stuck or dead pixels on the screen',
    icon: Settings,
    severity: 'Low',
    symptoms: ['Bright spots', 'Dark spots', 'Colored dots', 'Unchanging pixels'],
    causes: ['Manufacturing defect', 'Age-related wear', 'Physical damage', 'Electrical issues']
  },
  {
    issue: 'Dim Display',
    description: 'Screen is too dark or brightness issues',
    icon: RefreshCw,
    severity: 'Medium',
    symptoms: ['Very dim display', 'Brightness not adjustable', 'Uneven brightness', 'Dark areas'],
    causes: ['Backlight failure', 'Inverter issues', 'Power problems', 'Age-related dimming']
  }
];

// Screen sizes and types
const screenTypes = [
  {
    category: 'Laptop Screens',
    sizes: ['11.6"', '13.3"', '14"', '15.6"', '17.3"'],
    types: ['HD (1366x768)', 'Full HD (1920x1080)', '4K (3840x2160)', 'Touch Screen'],
    brands: ['Dell', 'HP', 'Lenovo', 'ASUS', 'Acer', 'MSI']
  },
  {
    category: 'Desktop Monitors',
    sizes: ['19"', '21.5"', '24"', '27"', '32"', '34"'],
    types: ['HD', 'Full HD', '4K', 'Ultrawide', 'Gaming (144Hz+)', 'Professional'],
    brands: ['Dell', 'HP', 'ASUS', 'Acer', 'Samsung', 'LG']
  },
  {
    category: 'All-in-One PCs',
    sizes: ['21.5"', '23.8"', '27"', '32"'],
    types: ['Touch Screen', 'Non-touch', '4K', 'Curved'],
    brands: ['HP', 'Dell', 'Lenovo', 'ASUS', 'Apple iMac']
  }
];

// Repair process
const repairProcess = [
  {
    step: 1,
    title: 'Screen Diagnosis',
    description: 'Complete screen and display system diagnosis to identify the exact issue.',
    icon: Shield,
    duration: '15-30 min'
  },
  {
    step: 2,
    title: 'Screen Removal',
    description: 'Careful removal of the damaged screen using proper tools and techniques.',
    icon: Wrench,
    duration: '30-45 min'
  },
  {
    step: 3,
    title: 'Installation',
    description: 'Professional installation of replacement screen with proper alignment.',
    icon: Monitor,
    duration: '45-60 min'
  },
  {
    step: 4,
    title: 'Testing & Calibration',
    description: 'Comprehensive testing and calibration for optimal display performance.',
    icon: CheckCircle,
    duration: '15-30 min'
  }
];

// Service quality features
const qualityFeatures = [
  {
    title: 'OEM Quality Screens',
    description: 'High-quality replacement screens from original equipment manufacturers',
    icon: Award
  },
  {
    title: 'All Screen Types',
    description: 'LCD, LED, OLED, touch screens, and specialized gaming displays',
    icon: Monitor
  },
  {
    title: 'Professional Tools',
    description: 'Specialized tools and equipment for precise screen replacement',
    icon: Wrench
  },
  {
    title: 'Quality Warranty',
    description: 'Comprehensive warranty on all screen repairs and replacements',
    icon: Shield
  }
];

export default function ScreenRepairPage() {
  return (
    <MainLayout>
      <ServicePageAnalytics 
        pageName="Screen Repair"
        pageCategory="Computer Services"
        pageId="screen-repair"
        services={screenRepairServices}
      >
        {/* Hero Section */}
        <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-800">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/15 via-transparent to-purple-500/15"></div>
        </div>

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-6">
            <Monitor className="w-12 h-12 text-white mr-4" />
            <h1 className="text-5xl md:text-6xl font-bold text-white">
              Screen Repair Services
            </h1>
          </div>
          <p className="text-xl md:text-2xl text-purple-100 mb-8 max-w-3xl mx-auto">
            Professional screen repair and replacement for laptops, desktop monitors, and all-in-one PCs with OEM quality displays.
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
              Screen Repair Services
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Professional screen repair and replacement for all types of displays with OEM quality parts and expert installation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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

                <h3 className="text-xl font-bold text-gray-900 mb-4">{service.title}</h3>
                <p className="text-gray-600 mb-6 leading-relaxed text-sm">{service.description}</p>

                <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">Repair Time:</span>
                    <span className="text-sm text-purple-600 font-semibold">{service.timeframe}</span>
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
                    <span className="text-sm text-gray-500">From</span>
                    <div className="text-xl font-bold text-gray-900">£{service.pricing.from}</div>
                  </div>
                  <button className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-2 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-700 transition-all duration-300 flex items-center text-sm">
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
              Our expert technicians can diagnose and repair any screen issue quickly and professionally.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {screenIssues.map((issue, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200 hover:border-purple-200 transition-all duration-300 group">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <issue.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{issue.issue}</h3>
                <p className="text-gray-600 mb-4 text-sm">{issue.description}</p>
                
                <div className="space-y-2 mb-4">
                  <div className="text-xs font-semibold text-gray-700">Symptoms:</div>
                  {issue.symptoms.map((symptom, idx) => (
                    <div key={idx} className="text-xs text-gray-500">• {symptom}</div>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    issue.severity === 'Critical' ? 'bg-red-100 text-red-800' :
                    issue.severity === 'High' ? 'bg-orange-100 text-orange-800' :
                    issue.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {issue.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Screen Types & Sizes */}
      <section className="py-20 px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Screen Types & Sizes We Service
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Professional screen repair for all screen types, sizes, and brands with OEM quality replacements.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {screenTypes.map((category, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-purple-200 transition-all duration-300">
                <h3 className="text-xl font-bold text-gray-900 mb-4">{category.category}</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Available Sizes:</h4>
                    <div className="flex flex-wrap gap-2">
                      {category.sizes.map((size, idx) => (
                        <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
                          {size}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Screen Types:</h4>
                    <div className="space-y-1">
                      {category.types.map((type, idx) => (
                        <div key={idx} className="flex items-center space-x-2">
                          <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                          <span className="text-sm text-gray-600">{type}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Brands Supported:</h4>
                    <div className="text-sm text-gray-600">
                      {category.brands.join(', ')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Repair Process */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Our Screen Repair Process
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Professional screen replacement process with OEM quality parts and expert installation.
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
      <section className="py-20 px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Why Choose Our Screen Repair Service?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Professional quality, OEM parts, and expert service for all your screen repair needs.
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
            Ready to Fix Your Screen?
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Book your screen repair today and get professional service with OEM quality displays and comprehensive warranty.
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
      </ServicePageAnalytics>
    </MainLayout>
  );
}