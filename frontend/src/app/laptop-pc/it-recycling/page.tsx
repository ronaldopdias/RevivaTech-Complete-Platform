'use client';

import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { 
  RefreshCw, 
  Leaf, 
  Shield,
  ArrowRight,
  CheckCircle,
  Clock,
  Wrench,
  Award,
  Recycle,
  FileX,
  Truck,
  Certificate
} from 'lucide-react';

// IT recycling services
const recyclingServices = [
  {
    id: 'secure-data-destruction',
    title: 'Secure Data Destruction',
    description: 'Professional data wiping and destruction services for complete security.',
    icon: Shield,
    gradient: 'from-red-500 to-pink-600',
    pricing: { from: 29, currency: 'GBP' },
    popular: true,
    features: ['DOD 5220.22-M standard', 'Certificate of destruction', 'GDPR compliant', 'Secure facility'],
    timeframe: '1-2 hours'
  },
  {
    id: 'equipment-recycling',
    title: 'Equipment Recycling',
    description: 'Environmentally responsible recycling of computers, laptops, and IT equipment.',
    icon: Recycle,
    gradient: 'from-green-500 to-emerald-600',
    pricing: { from: 19, currency: 'GBP' },
    features: ['Free collection', 'Eco-friendly process', 'Material recovery', 'Recycling certificate'],
    timeframe: 'Same day'
  },
  {
    id: 'asset-recovery',
    title: 'Asset Recovery',
    description: 'Recover value from old IT equipment through refurbishment and resale.',
    icon: RefreshCw,
    gradient: 'from-blue-500 to-indigo-600',
    pricing: { from: 39, currency: 'GBP' },
    features: ['Equipment valuation', 'Refurbishment', 'Resale service', 'Revenue sharing'],
    timeframe: '1-3 days'
  },
  {
    id: 'pickup-service',
    title: 'Collection Service',
    description: 'Convenient pickup service for bulk IT equipment disposal and recycling.',
    icon: Truck,
    gradient: 'from-purple-500 to-pink-600',
    pricing: { from: 49, currency: 'GBP' },
    features: ['Bulk collection', 'Scheduled pickup', 'Inventory tracking', 'Documentation'],
    timeframe: 'Next day'
  }
];

export default function ITRecyclingPage() {
  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-600 via-emerald-700 to-teal-800">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/15 via-transparent to-emerald-500/15"></div>
        </div>

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-6">
            <Recycle className="w-12 h-12 text-white mr-4" />
            <h1 className="text-5xl md:text-6xl font-bold text-white">
              IT Recycling Services
            </h1>
          </div>
          <p className="text-xl md:text-2xl text-green-100 mb-8 max-w-3xl mx-auto">
            Secure and environmentally responsible IT equipment recycling with data destruction and asset recovery.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-green-600 px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-green-50 transition-all duration-300 flex items-center justify-center">
              Recycle Equipment
              <ArrowRight className="ml-2 w-5 h-5" />
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-white hover:text-green-600 transition-all duration-300">
              Free Collection
            </button>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              IT Recycling Services
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Professional IT equipment recycling with secure data destruction and environmental responsibility.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {recyclingServices.map((service) => (
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
                  <button className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-300 flex items-center text-sm">
                    Book Now
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-green-600 to-emerald-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Recycle Responsibly
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Get secure IT equipment recycling with data destruction and environmental responsibility.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-green-600 px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-green-50 transition-all duration-300 flex items-center justify-center">
              Schedule Collection
              <ArrowRight className="ml-2 w-5 h-5" />
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-white hover:text-green-600 transition-all duration-300">
              Get Quote
            </button>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}