'use client';

import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { 
  Shield, 
  Zap, 
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Clock,
  Wrench,
  Award,
  RefreshCw,
  Lock,
  FileX,
  Eye
} from 'lucide-react';

// Virus removal services
const virusRemovalServices = [
  {
    id: 'virus-malware-removal',
    title: 'Virus & Malware Removal',
    description: 'Complete removal of viruses, malware, spyware, and other malicious software.',
    icon: Shield,
    gradient: 'from-red-500 to-pink-600',
    pricing: { from: 59, currency: 'GBP' },
    popular: true,
    features: ['Deep system scan', 'Malware removal', 'Registry cleaning', 'Security hardening'],
    timeframe: '2-4 hours'
  },
  {
    id: 'ransomware-recovery',
    title: 'Ransomware Recovery',
    description: 'Professional ransomware removal and data recovery services.',
    icon: Lock,
    gradient: 'from-orange-500 to-red-600',
    pricing: { from: 99, currency: 'GBP' },
    features: ['Ransomware removal', 'Data recovery', 'System restoration', 'Prevention setup'],
    timeframe: '4-8 hours'
  },
  {
    id: 'system-optimization',
    title: 'System Optimization',
    description: 'Complete system cleanup and optimization for improved performance.',
    icon: Zap,
    gradient: 'from-green-500 to-emerald-600',
    pricing: { from: 49, currency: 'GBP' },
    features: ['System cleanup', 'Startup optimization', 'Registry repair', 'Performance tuning'],
    timeframe: '1-2 hours'
  },
  {
    id: 'security-setup',
    title: 'Security Setup',
    description: 'Comprehensive security software installation and configuration.',
    icon: Eye,
    gradient: 'from-blue-500 to-purple-600',
    pricing: { from: 39, currency: 'GBP' },
    features: ['Antivirus installation', 'Firewall setup', 'Security updates', 'Safe browsing'],
    timeframe: '1-2 hours'
  }
];

export default function VirusRemovalPage() {
  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-pink-700 to-purple-800">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/15 via-transparent to-pink-500/15"></div>
        </div>

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-6">
            <Shield className="w-12 h-12 text-white mr-4" />
            <h1 className="text-5xl md:text-6xl font-bold text-white">
              Virus Removal & Security
            </h1>
          </div>
          <p className="text-xl md:text-2xl text-red-100 mb-8 max-w-3xl mx-auto">
            Professional virus removal, malware cleanup, and comprehensive security setup to protect your PC.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-red-600 px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-red-50 transition-all duration-300 flex items-center justify-center">
              Book Virus Removal
              <ArrowRight className="ml-2 w-5 h-5" />
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-white hover:text-red-600 transition-all duration-300">
              Get Free Scan
            </button>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Virus Removal & Security Services
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Complete virus removal and security services to protect your PC and data.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {virusRemovalServices.map((service) => (
              <div
                key={service.id}
                className="group relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-red-200"
              >
                {service.popular && (
                  <div className="absolute -top-3 left-6 bg-gradient-to-r from-red-500 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
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
                  <button className="bg-gradient-to-r from-red-500 to-pink-600 text-white px-4 py-2 rounded-xl font-semibold hover:from-red-600 hover:to-pink-700 transition-all duration-300 flex items-center text-sm">
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
      <section className="py-20 px-6 bg-gradient-to-r from-red-600 to-pink-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Protect Your PC Today
          </h2>
          <p className="text-xl text-red-100 mb-8">
            Get professional virus removal and security setup to keep your PC safe and secure.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-red-600 px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-red-50 transition-all duration-300 flex items-center justify-center">
              Book Security Service
              <ArrowRight className="ml-2 w-5 h-5" />
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-white hover:text-red-600 transition-all duration-300">
              Get Free Scan
            </button>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}