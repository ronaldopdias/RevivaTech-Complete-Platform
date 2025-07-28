'use client';

import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { 
  HardDrive, 
  RefreshCw, 
  Shield,
  ArrowRight,
  CheckCircle,
  Clock,
  Wrench,
  Award,
  AlertTriangle,
  Database,
  Smartphone,
  Usb
} from 'lucide-react';

// Data recovery services
const dataRecoveryServices = [
  {
    id: 'hard-drive-recovery',
    title: 'Hard Drive Recovery',
    description: 'Professional data recovery from failed hard drives, SSDs, and storage devices.',
    icon: HardDrive,
    gradient: 'from-blue-500 to-indigo-600',
    pricing: { from: 89, currency: 'GBP' },
    popular: true,
    features: ['HDD & SSD recovery', 'Physical damage repair', 'Logical recovery', 'No data, no fee'],
    timeframe: '1-3 days'
  },
  {
    id: 'deleted-file-recovery',
    title: 'Deleted File Recovery',
    description: 'Recover accidentally deleted files, photos, documents, and other important data.',
    icon: RefreshCw,
    gradient: 'from-green-500 to-emerald-600',
    pricing: { from: 59, currency: 'GBP' },
    features: ['Deleted file recovery', 'Formatted drive recovery', 'Partition recovery', 'Quick turnaround'],
    timeframe: '2-4 hours'
  },
  {
    id: 'raid-recovery',
    title: 'RAID Recovery',
    description: 'Specialized RAID array recovery for business and enterprise storage systems.',
    icon: Database,
    gradient: 'from-purple-500 to-pink-600',
    pricing: { from: 199, currency: 'GBP' },
    features: ['RAID 0, 1, 5, 10', 'NAS recovery', 'Server recovery', 'Business priority'],
    timeframe: '2-5 days'
  },
  {
    id: 'mobile-recovery',
    title: 'Mobile Device Recovery',
    description: 'Data recovery from smartphones, tablets, and mobile storage devices.',
    icon: Smartphone,
    gradient: 'from-orange-500 to-red-600',
    pricing: { from: 79, currency: 'GBP' },
    features: ['iPhone & Android', 'Photos & contacts', 'App data recovery', 'Water damage'],
    timeframe: '1-2 days'
  }
];

export default function DataRecoveryPage() {
  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/15 via-transparent to-indigo-500/15"></div>
        </div>

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-6">
            <HardDrive className="w-12 h-12 text-white mr-4" />
            <h1 className="text-5xl md:text-6xl font-bold text-white">
              Data Recovery Services
            </h1>
          </div>
          <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Professional data recovery from hard drives, SSDs, and storage devices with high success rates.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-blue-50 transition-all duration-300 flex items-center justify-center">
              Recover My Data
              <ArrowRight className="ml-2 w-5 h-5" />
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-white hover:text-blue-600 transition-all duration-300">
              Free Evaluation
            </button>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Data Recovery Services
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Professional data recovery services for all types of storage devices and data loss scenarios.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {dataRecoveryServices.map((service) => (
              <div
                key={service.id}
                className="group relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-blue-200"
              >
                {service.popular && (
                  <div className="absolute -top-3 left-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
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
                  <button className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 flex items-center text-sm">
                    Recover Now
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Don't Lose Your Data
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Get professional data recovery services with high success rates and no data, no fee guarantee.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-blue-50 transition-all duration-300 flex items-center justify-center">
              Start Recovery
              <ArrowRight className="ml-2 w-5 h-5" />
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-white hover:text-blue-600 transition-all duration-300">
              Free Evaluation
            </button>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}