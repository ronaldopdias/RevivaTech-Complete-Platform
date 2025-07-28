'use client';

import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { 
  Gamepad2, 
  Monitor, 
  Wrench,
  ArrowRight,
  CheckCircle,
  Clock,
  Shield,
  Award,
  RefreshCw,
  Joystick,
  Zap,
  Settings
} from 'lucide-react';

// Gaming console repair services
const consoleServices = [
  {
    id: 'playstation-repair',
    title: 'PlayStation Repair',
    description: 'Professional PlayStation console repair for PS5, PS4, and older models.',
    icon: Gamepad2,
    gradient: 'from-blue-500 to-indigo-600',
    pricing: { from: 79, currency: 'GBP' },
    popular: true,
    consoles: ['PlayStation 5', 'PlayStation 4', 'PlayStation 3', 'PlayStation 2'],
    features: ['HDMI port repair', 'Cooling system', 'Controller repair', 'Disc drive issues'],
    timeframe: '2-4 hours'
  },
  {
    id: 'xbox-repair',
    title: 'Xbox Repair',
    description: 'Expert Xbox console repair services for Xbox Series X/S, Xbox One, and 360.',
    icon: Monitor,
    gradient: 'from-green-500 to-emerald-600',
    pricing: { from: 79, currency: 'GBP' },
    consoles: ['Xbox Series X/S', 'Xbox One', 'Xbox 360', 'Original Xbox'],
    features: ['Red ring of death', 'Power issues', 'Disc tray repair', 'Controller sync'],
    timeframe: '2-4 hours'
  },
  {
    id: 'nintendo-repair',
    title: 'Nintendo Repair',
    description: 'Nintendo console repair including Switch, Wii U, and retro gaming systems.',
    icon: Joystick,
    gradient: 'from-red-500 to-pink-600',
    pricing: { from: 69, currency: 'GBP' },
    consoles: ['Nintendo Switch', 'Wii U', 'Nintendo 3DS', 'Retro Consoles'],
    features: ['Joy-Con drift', 'Screen replacement', 'Charging issues', 'Button repair'],
    timeframe: '1-3 hours'
  },
  {
    id: 'retro-gaming',
    title: 'Retro Gaming',
    description: 'Specialized repair services for vintage and retro gaming consoles.',
    icon: Settings,
    gradient: 'from-purple-500 to-pink-600',
    pricing: { from: 89, currency: 'GBP' },
    consoles: ['Atari', 'Sega', 'GameCube', 'Dreamcast'],
    features: ['Capacitor replacement', 'Cartridge slot repair', 'AV mods', 'Preservation'],
    timeframe: '3-5 hours'
  }
];

export default function ConsolesPage() {
  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-700 to-red-800">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/15 via-transparent to-pink-500/15"></div>
        </div>

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-6">
            <Gamepad2 className="w-12 h-12 text-white mr-4" />
            <h1 className="text-5xl md:text-6xl font-bold text-white">
              Gaming Console Repair
            </h1>
          </div>
          <p className="text-xl md:text-2xl text-purple-100 mb-8 max-w-3xl mx-auto">
            Professional gaming console repair services for PlayStation, Xbox, Nintendo, and retro gaming systems.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-purple-600 px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-purple-50 transition-all duration-300 flex items-center justify-center">
              Book Console Repair
              <ArrowRight className="ml-2 w-5 h-5" />
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-white hover:text-purple-600 transition-all duration-300">
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
              Gaming Console Repair Services
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Professional repair services for all gaming consoles with genuine parts and expert technicians.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {consoleServices.map((service) => (
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
      <section className="py-20 px-6 bg-gradient-to-r from-purple-600 to-pink-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Get Back to Gaming
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Professional gaming console repair to get you back in the game quickly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-purple-600 px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-purple-50 transition-all duration-300 flex items-center justify-center">
              Repair My Console
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