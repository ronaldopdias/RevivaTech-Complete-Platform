'use client';

import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { 
  Monitor, 
  Laptop, 
  HardDrive, 
  Smartphone, 
  Tablet,
  Battery,
  ArrowRight,
  Star,
  CheckCircle,
  Clock,
  Shield,
  Wrench,
  Apple
} from 'lucide-react';

// Apple services data following the existing component patterns
const appleServices = [
  {
    id: 'mac-repair',
    title: 'Mac Repair',
    description: 'Expert repair services for MacBook, iMac, and Mac Mini with genuine Apple parts.',
    icon: Monitor,
    href: '/apple/mac-repair',
    category: 'Mac Computers',
    featured: true,
    badge: 'Most Popular',
    gradient: 'from-blue-500 to-purple-600',
    pricing: { from: 89, currency: 'GBP' },
    stats: { completed: '2,847', satisfaction: '98%' },
    features: ['Genuine Apple parts', '90-day warranty', 'Same-day service', 'Data preservation']
  },
  {
    id: 'macbook-repair',
    title: 'MacBook Repair',
    description: 'Professional MacBook screen, battery, and hardware repair services.',
    icon: Laptop,
    href: '/apple/macbook-repair',
    category: 'MacBook',
    featured: true,
    badge: 'Quick Service',
    gradient: 'from-green-500 to-teal-600',
    pricing: { from: 129, currency: 'GBP' },
    stats: { completed: '1,932', satisfaction: '97%' },
    features: ['Screen replacement', 'Battery replacement', 'Keyboard repair', 'Logic board repair']
  },
  {
    id: 'imac-repair',
    title: 'iMac Repair',
    description: 'Expert iMac repair services including screen replacement and hardware upgrades.',
    icon: Monitor,
    href: '/apple/imac-repair',
    category: 'iMac',
    gradient: 'from-indigo-500 to-blue-600',
    pricing: { from: 149, currency: 'GBP' },
    stats: { completed: '756', satisfaction: '96%' },
    features: ['Screen replacement', 'Hardware upgrades', 'Data migration', 'Performance tuning']
  },
  {
    id: 'iphone-repair',
    title: 'iPhone Repair',
    description: 'Professional iPhone repair including screen, battery, and component replacement.',
    icon: Smartphone,
    href: '/apple/iphone-repair',
    category: 'iPhone',
    featured: true,
    badge: 'Same Day',
    gradient: 'from-purple-500 to-pink-600',
    pricing: { from: 49, currency: 'GBP' },
    stats: { completed: '3,421', satisfaction: '99%' },
    features: ['Screen repair', 'Battery replacement', 'Camera repair', 'Water damage']
  },
  {
    id: 'ipad-repair',
    title: 'iPad Repair',
    description: 'Comprehensive iPad repair services for all models and generations.',
    icon: Tablet,
    href: '/apple/ipad-repair',
    category: 'iPad',
    gradient: 'from-cyan-500 to-blue-600',
    pricing: { from: 79, currency: 'GBP' },
    stats: { completed: '1,234', satisfaction: '97%' },
    features: ['Screen replacement', 'Battery service', 'Port repair', 'Data recovery']
  },
  {
    id: 'apple-watch-repair',
    title: 'Apple Watch Repair',
    description: 'Professional Apple Watch repair and battery replacement services.',
    icon: Smartphone,
    href: '/apple/watch-repair',
    category: 'Apple Watch',
    gradient: 'from-orange-500 to-red-600',
    pricing: { from: 69, currency: 'GBP' },
    stats: { completed: '432', satisfaction: '95%' },
    features: ['Screen repair', 'Battery replacement', 'Band replacement', 'Water resistance']
  }
];

// Apple repair process steps
const repairProcess = [
  {
    step: 1,
    title: 'Diagnosis',
    description: 'Free comprehensive device diagnosis to identify the exact issue.',
    icon: Shield,
    duration: '15-30 min'
  },
  {
    step: 2,
    title: 'Quote',
    description: 'Transparent pricing with no hidden fees and multiple repair options.',
    icon: CheckCircle,
    duration: 'Immediate'
  },
  {
    step: 3,
    title: 'Repair',
    description: 'Expert repair using genuine Apple parts and professional tools.',
    icon: Wrench,
    duration: '1-4 hours'
  },
  {
    step: 4,
    title: 'Testing',
    description: 'Comprehensive testing to ensure everything works perfectly.',
    icon: Star,
    duration: '30 min'
  }
];

export default function ApplePage() {
  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        {/* Nordic Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-700 to-blue-800">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/15 via-transparent to-indigo-500/15"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-6">
            <Apple className="w-12 h-12 text-white mr-4" />
            <h1 className="text-5xl md:text-6xl font-bold text-white">
              Apple Device Repair
            </h1>
          </div>
          <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Expert repair services for all Apple devices with genuine parts, professional technicians, and comprehensive warranties.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-blue-50 transition-all duration-300 flex items-center justify-center">
              Book Apple Repair
              <ArrowRight className="ml-2 w-5 h-5" />
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-white hover:text-blue-600 transition-all duration-300">
              View All Services
            </button>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Apple Repair Services
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Professional repair services for all Apple devices with genuine parts and expert technicians.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {appleServices.map((service) => (
              <div
                key={service.id}
                className="group relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-blue-200"
              >
                {/* Badge */}
                {service.badge && (
                  <div className="absolute -top-3 left-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    {service.badge}
                  </div>
                )}

                {/* Icon */}
                <div className={`w-16 h-16 bg-gradient-to-r ${service.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <service.icon className="w-8 h-8 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{service.title}</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">{service.description}</p>

                {/* Stats */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm text-gray-600">{service.stats.completed} completed</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-semibold">{service.stats.satisfaction}</span>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-2 mb-6">
                  {service.features.slice(0, 2).map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Price and CTA */}
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

      {/* Repair Process */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Our Apple Repair Process
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Professional, transparent, and efficient repair process for all Apple devices.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {repairProcess.map((step) => (
              <div key={step.step} className="text-center group">
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                    <step.icon className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {step.step}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600 mb-4">{step.description}</p>
                <div className="text-sm text-blue-600 font-semibold">{step.duration}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-blue-600 to-purple-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Repair Your Apple Device?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Book your repair today and get professional service with genuine Apple parts and comprehensive warranty.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-blue-50 transition-all duration-300 flex items-center justify-center">
              Book Apple Repair Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-white hover:text-blue-600 transition-all duration-300">
              Contact Us
            </button>
          </div>
        </div>
      </section>
    </MainLayout>
  );
} 