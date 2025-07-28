'use client';

import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import ServicePageAnalytics from '@/components/analytics/ServicePageAnalytics';
import { 
  Monitor, 
  Laptop, 
  HardDrive, 
  Cpu,
  Memory,
  ArrowRight,
  Star,
  CheckCircle,
  Clock,
  Shield,
  Wrench,
  Apple,
  Zap,
  Award,
  RefreshCw
} from 'lucide-react';

// Mac repair services data
const macRepairServices = [
  {
    id: 'macbook-repair',
    title: 'MacBook Repair',
    description: 'Professional MacBook repair services including screen replacement, logic board repair, and keyboard fixes.',
    icon: Laptop,
    gradient: 'from-blue-500 to-purple-600',
    pricing: { from: 89, currency: 'GBP' },
    popular: true,
    features: ['Screen replacement', 'Logic board repair', 'Keyboard replacement', 'Battery service', 'SSD upgrades']
  },
  {
    id: 'imac-repair',
    title: 'iMac Repair',
    description: 'Expert iMac repair services including screen replacement, hardware upgrades, and performance optimization.',
    icon: Monitor,
    gradient: 'from-green-500 to-teal-600',
    pricing: { from: 129, currency: 'GBP' },
    features: ['Screen replacement', 'Hard drive upgrade', 'RAM upgrade', 'Graphics card repair', 'Cooling system']
  },
  {
    id: 'mac-mini-repair',
    title: 'Mac Mini Repair',
    description: 'Comprehensive Mac Mini repair services including logic board repair and component replacement.',
    icon: Cpu,
    gradient: 'from-purple-500 to-pink-600',
    pricing: { from: 79, currency: 'GBP' },
    features: ['Logic board repair', 'SSD replacement', 'RAM upgrade', 'Port repair', 'Power supply fix']
  },
  {
    id: 'mac-pro-repair',
    title: 'Mac Pro Repair',
    description: 'Professional Mac Pro repair services for power users including component upgrades and optimization.',
    icon: Cpu,
    gradient: 'from-indigo-500 to-blue-600',
    pricing: { from: 159, currency: 'GBP' },
    features: ['Component upgrades', 'Graphics card repair', 'Power supply replacement', 'Cooling optimization']
  }
];

// Common Mac issues
const commonIssues = [
  {
    issue: 'Screen Issues',
    description: 'Cracked screens, display problems, backlight issues',
    icon: Monitor,
    severity: 'High',
    timeframe: '2-4 hours'
  },
  {
    issue: 'Logic Board Problems',
    description: 'No power, boot issues, component failures',
    icon: Cpu,
    severity: 'Critical',
    timeframe: '1-2 days'
  },
  {
    issue: 'Storage Issues',
    description: 'Hard drive failure, SSD problems, data corruption',
    icon: HardDrive,
    severity: 'High',
    timeframe: '4-6 hours'
  },
  {
    issue: 'Performance Issues',
    description: 'Slow performance, overheating, freezing',
    icon: Zap,
    severity: 'Medium',
    timeframe: '2-3 hours'
  }
];

// Why choose us features
const whyChooseUs = [
  {
    title: 'Genuine Apple Parts',
    description: 'We only use genuine Apple parts and components for all repairs',
    icon: Shield
  },
  {
    title: 'Expert Technicians',
    description: 'Apple-certified technicians with years of Mac repair experience',
    icon: Award
  },
  {
    title: 'Quick Turnaround',
    description: 'Most repairs completed within 24-48 hours',
    icon: Clock
  },
  {
    title: '90-Day Warranty',
    description: 'All repairs come with a comprehensive 90-day warranty',
    icon: RefreshCw
  }
];

export default function MacRepairPage() {
  return (
    <MainLayout>
      <ServicePageAnalytics
        pageId="mac-repair"
        pageName="Mac Repair Services"
        serviceCategory="apple_repair"
        deviceType="mac"
        repairType="comprehensive_mac_repair"
        estimatedPrice={129}
        competitorComparison={{
          ourPrice: 129,
          marketPrice: 179,
          savings: 50
        }}
      >
      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/15 via-transparent to-purple-500/15"></div>
        </div>

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-6">
            <Monitor className="w-12 h-12 text-white mr-4" />
            <h1 className="text-5xl md:text-6xl font-bold text-white">
              Mac Repair Services
            </h1>
          </div>
          <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Professional Mac repair services for MacBook, iMac, Mac Mini, and Mac Pro with genuine Apple parts and expert technicians.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-blue-50 transition-all duration-300 flex items-center justify-center">
              Book Mac Repair
              <ArrowRight className="ml-2 w-5 h-5" />
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-white hover:text-blue-600 transition-all duration-300">
              Get Free Quote
            </button>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Mac Repair Services
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive repair services for all Mac models with genuine parts and professional expertise.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {macRepairServices.map((service) => (
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

      {/* Common Issues */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Common Mac Issues We Fix
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our expert technicians can diagnose and repair any Mac issue quickly and efficiently.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {commonIssues.map((issue, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200 hover:border-blue-200 transition-all duration-300 group">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <issue.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{issue.issue}</h3>
                <p className="text-gray-600 mb-4 text-sm">{issue.description}</p>
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

      {/* Why Choose Us */}
      <section className="py-20 px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Why Choose Our Mac Repair Service?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Professional service, genuine parts, and expert technicians for all your Mac repair needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {whyChooseUs.map((feature, index) => (
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
            Ready to Repair Your Mac?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Book your Mac repair today and get professional service with genuine Apple parts and comprehensive warranty.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-blue-50 transition-all duration-300 flex items-center justify-center">
              Book Mac Repair Now
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