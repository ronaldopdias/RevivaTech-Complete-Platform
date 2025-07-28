'use client';

import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import LaptopRepairBooking from '@/components/booking/LaptopRepairBooking';
import { 
  Laptop, 
  Monitor, 
  HardDrive,
  Cpu,
  Memory,
  ArrowRight,
  Star,
  CheckCircle,
  Clock,
  Shield,
  Wrench,
  Zap,
  Award,
  RefreshCw,
  Settings,
  Wifi
} from 'lucide-react';

// PC repair services
const pcRepairServices = [
  {
    id: 'laptop-repair',
    title: 'Laptop Repair',
    description: 'Comprehensive laptop repair services for all brands including Dell, HP, Lenovo, ASUS, and more.',
    icon: Laptop,
    gradient: 'from-blue-500 to-purple-600',
    pricing: { from: 69, currency: 'GBP' },
    popular: true,
    brands: ['Dell', 'HP', 'Lenovo', 'ASUS', 'Acer', 'MSI', 'Alienware'],
    features: ['Hardware diagnostics', 'Component replacement', 'Performance optimization', 'Data recovery'],
    timeframe: '2-4 hours'
  },
  {
    id: 'desktop-repair',
    title: 'Desktop PC Repair',
    description: 'Professional desktop PC repair and upgrade services for custom builds and pre-built systems.',
    icon: Monitor,
    gradient: 'from-green-500 to-teal-600',
    pricing: { from: 59, currency: 'GBP' },
    brands: ['Custom PCs', 'Dell', 'HP', 'Lenovo', 'ASUS', 'MSI', 'Gaming PCs'],
    features: ['System diagnosis', 'Component upgrade', 'Performance tuning', 'Cable management'],
    timeframe: '1-3 hours'
  },
  {
    id: 'hardware-upgrade',
    title: 'Hardware Upgrades',
    description: 'Upgrade your PC with faster SSDs, more RAM, better graphics cards, and improved cooling.',
    icon: Cpu,
    gradient: 'from-orange-500 to-red-600',
    pricing: { from: 49, currency: 'GBP' },
    brands: ['All PC Brands', 'Custom Builds', 'Gaming PCs', 'Workstations'],
    features: ['SSD installation', 'RAM upgrade', 'Graphics card upgrade', 'CPU cooling'],
    timeframe: '1-2 hours'
  },
  {
    id: 'motherboard-repair',
    title: 'Motherboard Repair',
    description: 'Expert motherboard repair and replacement services for complex hardware issues.',
    icon: Settings,
    gradient: 'from-purple-500 to-pink-600',
    pricing: { from: 89, currency: 'GBP' },
    brands: ['All Motherboard Types', 'Intel', 'AMD', 'ASUS', 'MSI', 'Gigabyte'],
    features: ['Component-level repair', 'BIOS recovery', 'Port repair', 'Power delivery fix'],
    timeframe: '4-8 hours'
  },
  {
    id: 'power-supply-repair',
    title: 'Power Supply Repair',
    description: 'Power supply diagnosis, repair, and replacement for stable system operation.',
    icon: Zap,
    gradient: 'from-yellow-500 to-orange-600',
    pricing: { from: 39, currency: 'GBP' },
    brands: ['All PSU Types', 'Corsair', 'EVGA', 'Seasonic', 'Cooler Master'],
    features: ['Power diagnosis', 'PSU replacement', 'Efficiency testing', 'Cable management'],
    timeframe: '1-2 hours'
  },
  {
    id: 'cooling-system',
    title: 'Cooling System Repair',
    description: 'Fix overheating issues with professional cooling system repair and thermal management.',
    icon: RefreshCw,
    gradient: 'from-cyan-500 to-blue-600',
    pricing: { from: 59, currency: 'GBP' },
    brands: ['Air Cooling', 'Liquid Cooling', 'All PC Types', 'Gaming PCs'],
    features: ['Thermal paste replacement', 'Fan repair', 'Radiator cleaning', 'Temperature monitoring'],
    timeframe: '2-3 hours'
  }
];

// Common PC issues
const commonIssues = [
  {
    issue: 'Won\'t Turn On',
    description: 'PC doesn\'t start or show signs of power',
    icon: Zap,
    severity: 'Critical',
    causes: ['Power supply failure', 'Motherboard issues', 'Power button problems']
  },
  {
    issue: 'Overheating',
    description: 'System runs hot and may shut down unexpectedly',
    icon: RefreshCw,
    severity: 'High',
    causes: ['Dust buildup', 'Thermal paste dried out', 'Fan failure']
  },
  {
    issue: 'Blue Screen Errors',
    description: 'Windows crashes with blue screen of death',
    icon: Monitor,
    severity: 'High',
    causes: ['Driver issues', 'Hardware conflicts', 'Memory problems']
  },
  {
    issue: 'Slow Performance',
    description: 'PC runs slowly and takes long to load',
    icon: Cpu,
    severity: 'Medium',
    causes: ['Hard drive issues', 'Low RAM', 'Malware infection']
  },
  {
    issue: 'No Display',
    description: 'Monitor shows no signal or black screen',
    icon: Monitor,
    severity: 'High',
    causes: ['Graphics card failure', 'Cable issues', 'Monitor problems']
  },
  {
    issue: 'Strange Noises',
    description: 'Unusual clicking, grinding, or buzzing sounds',
    icon: Settings,
    severity: 'Medium',
    causes: ['Hard drive failure', 'Fan problems', 'Loose components']
  }
];

// PC brands we service
const pcBrands = [
  {
    brand: 'Dell',
    specialties: ['Optiplex', 'Inspiron', 'XPS', 'Alienware'],
    expertise: 'Business and gaming systems'
  },
  {
    brand: 'HP',
    specialties: ['Pavilion', 'Envy', 'Omen', 'EliteBook'],
    expertise: 'Consumer and professional PCs'
  },
  {
    brand: 'Lenovo',
    specialties: ['ThinkPad', 'IdeaPad', 'Legion', 'ThinkCentre'],
    expertise: 'Business laptops and desktops'
  },
  {
    brand: 'ASUS',
    specialties: ['ROG', 'TUF', 'ZenBook', 'VivoBook'],
    expertise: 'Gaming and creative systems'
  },
  {
    brand: 'MSI',
    specialties: ['Gaming', 'Creator', 'Business', 'Workstation'],
    expertise: 'High-performance systems'
  },
  {
    brand: 'Custom PCs',
    specialties: ['Gaming builds', 'Workstations', 'Budget builds', 'Enthusiast PCs'],
    expertise: 'All custom configurations'
  }
];

// Service quality features
const serviceFeatures = [
  {
    title: 'All PC Brands',
    description: 'Expert repair services for all major PC brands and custom builds',
    icon: Laptop
  },
  {
    title: 'Genuine Parts',
    description: 'Only genuine and compatible parts from trusted manufacturers',
    icon: Shield
  },
  {
    title: 'Quick Diagnosis',
    description: 'Fast and accurate diagnosis to identify the root cause',
    icon: Clock
  },
  {
    title: 'Quality Guarantee',
    description: 'All repairs backed by our comprehensive warranty',
    icon: Award
  }
];

export default function PCRepairPage() {
  const [showBooking, setShowBooking] = useState(false);

  const handleBookingStart = (selectedServices: string[], totalPrice: number) => {
    // Here you would typically navigate to the main booking wizard or handle the booking
    console.log('Starting booking with services:', selectedServices, 'Total:', totalPrice);
    // For now, we'll just show an alert
    alert(`Booking started with ${selectedServices.length} services. Total: £${totalPrice}. This would normally integrate with the main booking system.`);
  };

  const scrollToBooking = () => {
    const bookingSection = document.getElementById('laptop-booking');
    if (bookingSection) {
      bookingSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-trust-600 via-professional-700 to-neutral-800">
          <div className="absolute inset-0 bg-gradient-to-r from-trust-500/15 via-transparent to-professional-500/15"></div>
        </div>

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-6">
            <Laptop className="w-12 h-12 text-white mr-4" />
            <h1 className="text-5xl md:text-6xl font-bold text-white">
              Laptop Repair Services
            </h1>
          </div>
          <p className="text-xl md:text-2xl text-trust-100 mb-8 max-w-3xl mx-auto">
            Professional laptop repair with fixed pricing, 1-year guarantee, and no upfront payment. Serving all major brands in Bournemouth.
          </p>
          
          {/* Trust Signals */}
          <div className="flex flex-wrap items-center justify-center gap-6 mb-8 text-white">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-trust-200" />
              <span className="font-medium">Fixed Labour Fee</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-trust-200" />
              <span className="font-medium">1 Year Guarantee</span>
            </div>
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-trust-200" />
              <span className="font-medium">15% Student Discount</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-trust-200" />
              <span className="font-medium">No Upfront Payment</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={scrollToBooking}
              className="bg-trust-500 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-trust-600 transition-all duration-300 flex items-center justify-center shadow-lg"
            >
              Book Laptop Repair
              <ArrowRight className="ml-2 w-5 h-5" />
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-white hover:text-trust-600 transition-all duration-300">
              Get Free Quote
            </button>
          </div>
        </div>
      </section>

      {/* Dynamic Laptop Booking Section */}
      <section id="laptop-booking" className="py-20 px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <LaptopRepairBooking onBookingStart={handleBookingStart} />
        </div>
      </section>

      {/* Why Choose Our Service */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Why Choose RevivaTech for Laptop Repair?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Professional quality, transparent pricing, and expert service for all your laptop repair needs in Bournemouth.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {serviceFeatures.map((feature, index) => (
              <div key={index} className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-r from-trust-500 to-professional-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Common Laptop Issues */}
      <section className="py-20 px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Common Laptop Issues We Fix
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From simple software problems to complex hardware repairs, our expert technicians handle all laptop issues with professional care.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {commonIssues.map((issue, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200 hover:border-trust-200 transition-all duration-300 group">
                <div className="w-12 h-12 bg-gradient-to-r from-trust-500 to-professional-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <issue.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{issue.issue}</h3>
                <p className="text-gray-600 mb-4 text-sm">{issue.description}</p>
                <div className="space-y-2 mb-4">
                  <div className="text-xs font-semibold text-gray-700">Common causes:</div>
                  {issue.causes.map((cause, idx) => (
                    <div key={idx} className="text-xs text-gray-500">• {cause}</div>
                  ))}
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  issue.severity === 'Critical' ? 'bg-red-100 text-red-800' :
                  issue.severity === 'High' ? 'bg-orange-100 text-orange-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {issue.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Laptop Brands We Service */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Laptop Brands We Service
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Expert laptop repair services for all major brands with specialized knowledge and genuine parts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {pcBrands.map((brand, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-trust-200 transition-all duration-300 group">
                <h3 className="text-xl font-bold text-gray-900 mb-4">{brand.brand}</h3>
                <p className="text-gray-600 mb-4 text-sm">{brand.expertise}</p>
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-gray-700">Specialties:</div>
                  {brand.specialties.map((specialty, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <CheckCircle className="w-3 h-3 text-trust-500 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{specialty}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Service Features */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Why Choose Our PC Repair Service?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Professional quality, genuine parts, and expert service for all your PC and laptop repair needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {serviceFeatures.map((feature, index) => (
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
      <section className="py-20 px-6 bg-gradient-to-r from-trust-600 to-professional-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Repair Your Laptop?
          </h2>
          <p className="text-xl text-trust-100 mb-8">
            Book your laptop repair today with our three-tier pricing system. Fixed labour fees, 1-year guarantee, and no upfront payment required.
          </p>
          
          {/* Trust signals in CTA */}
          <div className="flex flex-wrap items-center justify-center gap-6 mb-8 text-trust-100">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span>Fixed Pricing</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>1 Year Guarantee</span>
            </div>
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5" />
              <span>15% Student Discount</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={scrollToBooking}
              className="bg-white text-trust-600 px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-trust-50 transition-all duration-300 flex items-center justify-center shadow-lg"
            >
              Book Laptop Repair Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-white hover:text-trust-600 transition-all duration-300">
              Get Free Quote
            </button>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}