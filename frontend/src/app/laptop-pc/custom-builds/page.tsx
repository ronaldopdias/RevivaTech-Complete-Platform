'use client';

import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { 
  Cpu, 
  Monitor, 
  HardDrive,
  Zap,
  ArrowRight,
  CheckCircle,
  Clock,
  Shield,
  Wrench,
  Award,
  RefreshCw,
  Settings,
  Gamepad2
} from 'lucide-react';

// Custom build services
const customBuildServices = [
  {
    id: 'gaming-pc',
    title: 'Gaming PC Build',
    description: 'High-performance gaming PCs built for the latest games and maximum performance.',
    icon: Gamepad2,
    gradient: 'from-purple-500 to-pink-600',
    pricing: { from: 599, currency: 'GBP' },
    popular: true,
    features: ['Latest graphics cards', 'High-refresh gaming', 'RGB lighting', 'Overclocking ready'],
    timeframe: '2-3 days'
  },
  {
    id: 'workstation-pc',
    title: 'Workstation PC',
    description: 'Professional workstations for content creation, 3D rendering, and heavy computing.',
    icon: Monitor,
    gradient: 'from-blue-500 to-indigo-600',
    pricing: { from: 899, currency: 'GBP' },
    features: ['Professional graphics', 'Multi-core processors', 'ECC memory', 'Certified drivers'],
    timeframe: '2-4 days'
  },
  {
    id: 'budget-build',
    title: 'Budget PC Build',
    description: 'Affordable PC builds for everyday computing, office work, and light gaming.',
    icon: Cpu,
    gradient: 'from-green-500 to-teal-600',
    pricing: { from: 349, currency: 'GBP' },
    features: ['Value components', 'Efficient performance', 'Upgrade ready', 'Warranty included'],
    timeframe: '1-2 days'
  },
  {
    id: 'custom-upgrade',
    title: 'PC Upgrades',
    description: 'Upgrade your existing PC with new components for better performance.',
    icon: Settings,
    gradient: 'from-orange-500 to-red-600',
    pricing: { from: 49, currency: 'GBP' },
    features: ['Component installation', 'Compatibility check', 'Performance testing', 'Setup included'],
    timeframe: '2-4 hours'
  }
];

export default function CustomBuildsPage() {
  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-indigo-700 to-blue-800">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/15 via-transparent to-blue-500/15"></div>
        </div>

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-6">
            <Cpu className="w-12 h-12 text-white mr-4" />
            <h1 className="text-5xl md:text-6xl font-bold text-white">
              Custom PC Builds
            </h1>
          </div>
          <p className="text-xl md:text-2xl text-purple-100 mb-8 max-w-3xl mx-auto">
            Professional custom PC builds tailored to your needs - gaming, workstation, or budget builds.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-purple-600 px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-purple-50 transition-all duration-300 flex items-center justify-center">
              Build My PC
              <ArrowRight className="ml-2 w-5 h-5" />
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-white hover:text-purple-600 transition-all duration-300">
              Get Quote
            </button>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Custom PC Build Services
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Professional custom PC builds for gaming, work, and everyday computing needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {customBuildServices.map((service) => (
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
                    Build Now
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-purple-600 to-pink-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Build Your Dream PC
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Get a custom PC build tailored to your specific needs and budget.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-purple-600 px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-purple-50 transition-all duration-300 flex items-center justify-center">
              Start Building
              <ArrowRight className="ml-2 w-5 h-5" />
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-white hover:text-purple-600 transition-all duration-300">
              Get Quote
            </button>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}