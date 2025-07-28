'use client';

import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { 
  Smartphone, 
  Laptop, 
  HardDrive, 
  Shield, 
  Cpu, 
  Monitor,
  ArrowRight,
  Star,
  CheckCircle,
  Clock,
  Users,
  Award,
  Zap,
  Phone,
  Mail
} from 'lucide-react';

// Comprehensive services data
const services = [
  {
    id: 'mac-repair',
    title: 'Mac Repair',
    description: 'Expert MacBook, iMac, and Mac Mini repair services with genuine Apple parts and 90-day warranty.',
    icon: Laptop,
    href: '/booking-demo?service=mac-repair',
    category: 'Apple Devices',
    featured: true,
    badge: 'Most Popular',
    gradient: 'from-blue-500 to-purple-600',
    pricing: { from: 89, currency: 'GBP' },
    stats: { completed: '2,847', satisfaction: '98%' },
    features: ['Genuine Apple parts', '90-day warranty', 'Same-day service', 'Data preservation']
  },
  {
    id: 'mobile-repair',
    title: 'Mobile Device Repair',
    description: 'iPhone, iPad, Android phone and tablet repair with quality parts and quick turnaround.',
    icon: Smartphone,
    href: '/booking-demo?service=mobile-repair',
    category: 'Mobile Devices',
    featured: true,
    badge: 'Quick Service',
    gradient: 'from-green-500 to-teal-600',
    pricing: { from: 49, currency: 'GBP' },
    stats: { completed: '4,932', satisfaction: '97%' },
    features: ['Screen repairs', 'Battery replacement', 'Water damage', 'Same-day service']
  },
  {
    id: 'data-recovery',
    title: 'Data Recovery',
    description: 'Professional data recovery from damaged drives, SSDs, and mobile devices.',
    icon: HardDrive,
    href: '/booking-demo?service=data-recovery',
    category: 'Data Services',
    featured: true,
    badge: 'No Recovery, No Fee',
    gradient: 'from-orange-500 to-red-600',
    pricing: { from: 129, currency: 'GBP' },
    stats: { completed: '1,254', satisfaction: '95%' },
    features: ['Clean room facilities', 'All storage types', 'Emergency service', '24/7 support']
  },
  {
    id: 'pc-repair',
    title: 'PC & Laptop Repair',
    description: 'Professional Windows laptop and desktop repair for all major brands.',
    icon: Monitor,
    href: '/booking-demo?service=pc-repair',
    category: 'Windows Devices',
    gradient: 'from-indigo-500 to-blue-600',
    pricing: { from: 69, currency: 'GBP' },
    stats: { completed: '3,621', satisfaction: '96%' },
    features: ['All major brands', 'Hardware & software', 'Virus removal', 'Performance tuning']
  },
  {
    id: 'virus-removal',
    title: 'Virus & Security',
    description: 'Complete system cleaning and security optimization to protect your devices.',
    icon: Shield,
    href: '/booking-demo?service=virus-removal',
    category: 'Security Services',
    gradient: 'from-purple-500 to-pink-600',
    pricing: { from: 59, currency: 'GBP' },
    stats: { completed: '2,189', satisfaction: '99%' },
    features: ['Malware removal', 'System optimization', 'Security setup', 'Prevention training']
  },
  {
    id: 'custom-builds',
    title: 'Custom PC Builds',
    description: 'Professional custom PC building and upgrade services for gaming and workstations.',
    icon: Cpu,
    href: '/booking-demo?service=custom-builds',
    category: 'Custom Solutions',
    gradient: 'from-cyan-500 to-blue-600',
    pricing: { from: 299, currency: 'GBP' },
    stats: { completed: '892', satisfaction: '100%' },
    features: ['Gaming builds', 'Workstations', 'Component selection', 'Performance tuning']
  },
];

// Service categories for filtering
const serviceCategories = [
  { id: 'all', name: 'All Services', count: services.length },
  { id: 'apple', name: 'Apple Devices', count: services.filter(s => s.category === 'Apple Devices').length },
  { id: 'windows', name: 'Windows Devices', count: services.filter(s => s.category === 'Windows Devices').length },
  { id: 'mobile', name: 'Mobile Devices', count: services.filter(s => s.category === 'Mobile Devices').length },
  { id: 'data', name: 'Data Services', count: services.filter(s => s.category === 'Data Services').length },
  { id: 'security', name: 'Security Services', count: services.filter(s => s.category === 'Security Services').length },
  { id: 'custom', name: 'Custom Solutions', count: services.filter(s => s.category === 'Custom Solutions').length },
];

// Process steps
const processSteps = [
  {
    step: '01',
    title: 'Free Consultation',
    description: 'Discuss your needs and get expert advice on the best solution',
    icon: Phone,
    color: 'from-blue-500 to-indigo-600'
  },
  {
    step: '02', 
    title: 'Professional Diagnosis',
    description: 'Comprehensive diagnostic testing to identify all issues',
    icon: Award,
    color: 'from-purple-500 to-pink-600'
  },
  {
    step: '03',
    title: 'Expert Repair',
    description: 'Professional repair using genuine parts with warranty',
    icon: CheckCircle,
    color: 'from-green-500 to-emerald-600'
  }
];

// Testimonials
const testimonials = [
  {
    id: 1,
    name: 'James Mitchell',
    role: 'Business Owner',
    content: 'My MacBook Pro had a liquid spill and I thought it was done for. RevivaTech not only recovered all my data but also got it working perfectly again.',
    rating: 5,
    service: 'Mac Repair'
  },
  {
    id: 2,
    name: 'Sarah Thompson',
    role: 'Graphic Designer',
    content: 'Lost 5 years of client work when my external drive failed. The team recovered 99% of my files from what seemed like a completely dead drive.',
    rating: 5,
    service: 'Data Recovery'
  },
  {
    id: 3,
    name: 'Michael Chen',
    role: 'Student',
    content: 'Dropped my iPhone and shattered the screen the day before an important presentation. They fixed it same-day with a perfect replacement.',
    rating: 5,
    service: 'Mobile Repair'
  }
];

export default function ServicesPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter services
  const filteredServices = services.filter(service => {
    const categoryMatch = activeCategory === 'all' || service.category === getCategoryName(activeCategory);
    const searchMatch = service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       service.description.toLowerCase().includes(searchTerm.toLowerCase());
    return categoryMatch && searchMatch;
  });

  function getCategoryName(categoryId: string): string {
    const categoryMap: Record<string, string> = {
      'apple': 'Apple Devices',
      'windows': 'Windows Devices',
      'mobile': 'Mobile Devices',
      'data': 'Data Services',
      'security': 'Security Services',
      'custom': 'Custom Solutions',
    };
    return categoryMap[categoryId] || '';
  }

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative py-24 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Expert Repair Services
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Professional technology repairs with transparent pricing, genuine parts, and industry-leading warranties
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/booking-demo" 
              className="bg-white text-blue-600 font-bold py-4 px-8 rounded-xl hover:bg-blue-50 transition-colors inline-flex items-center gap-2"
            >
              Book Repair Now
              <ArrowRight className="w-5 h-5" />
            </a>
            <a 
              href="#services" 
              className="border-2 border-white/30 text-white font-bold py-4 px-8 rounded-xl hover:bg-white/10 transition-colors"
            >
              Explore Services
            </a>
          </div>
        </div>
      </section>

      {/* Service Categories */}
      <section id="services" className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-6">Our Services</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Discover our comprehensive repair services with instant quotes and professional expertise
            </p>
            
            {/* Search Bar */}
            <div className="max-w-md mx-auto mb-8">
              <input
                type="text"
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all"
              />
            </div>
          </div>
          
          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {serviceCategories.map((category) => {
              const isActive = activeCategory === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`px-6 py-3 rounded-xl font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  {category.name} ({category.count})
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredServices.map((service, index) => {
              const IconComponent = service.icon;
              return (
                <div 
                  key={service.id} 
                  className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all transform hover:scale-105"
                >
                  {/* Service Badge */}
                  {service.badge && (
                    <div className="inline-block bg-gradient-to-r from-pink-500 to-rose-500 text-white px-3 py-1 rounded-full text-sm font-medium mb-4">
                      {service.badge}
                    </div>
                  )}

                  {/* Service Icon */}
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${service.gradient} flex items-center justify-center mb-6`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>

                  {/* Service Content */}
                  <h3 className="text-2xl font-bold mb-3 text-gray-900">
                    {service.title}
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {service.description}
                  </p>

                  {/* Statistics */}
                  {service.stats && (
                    <div className="flex justify-between items-center mb-6 p-4 bg-gray-50 rounded-xl">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{service.stats.completed}</div>
                        <div className="text-sm text-gray-600">Completed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{service.stats.satisfaction}</div>
                        <div className="text-sm text-gray-600">Satisfaction</div>
                      </div>
                    </div>
                  )}

                  {/* Features */}
                  <div className="mb-6">
                    <div className="grid grid-cols-2 gap-2">
                      {service.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="text-sm text-gray-600">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pricing & CTA */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-sm text-gray-500">From</span>
                      <div className="text-3xl font-bold text-gray-900">
                        £{service.pricing.from}
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <a 
                    href={service.href}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-6 rounded-xl font-medium text-center block hover:shadow-lg transition-all"
                  >
                    Get Quote
                    <ArrowRight className="w-4 h-4 ml-2 inline-block" />
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Process Steps */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold mb-6">Our Service Process</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Simple, transparent, and professional - we make device repair stress-free
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {processSteps.map((step, index) => {
              const IconComponent = step.icon;
              return (
                <div key={index} className="text-center">
                  <div className={`w-24 h-24 rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                    <IconComponent className="w-12 h-12 text-white" />
                  </div>
                  <div className="text-6xl font-bold text-gray-200 mb-4">{step.step}</div>
                  <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                  <p className="text-gray-600 text-lg">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold mb-6">Customer Success Stories</h2>
            <p className="text-xl text-gray-600">
              Real customers, real repairs, real results
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="bg-white rounded-2xl shadow-lg p-8">
                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>

                {/* Content */}
                <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                  "{testimonial.content}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{testimonial.name}</div>
                    <div className="text-gray-600">{testimonial.role}</div>
                    <div className="text-sm text-blue-600">{testimonial.service}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Fix Your Device?
          </h2>
          <p className="text-xl mb-12 max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust us with their repairs
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <a 
              href="/booking-demo" 
              className="bg-white text-blue-600 font-bold py-4 px-8 rounded-xl hover:bg-blue-50 transition-colors"
            >
              Book Repair Now
            </a>
            <a 
              href="tel:02071234567" 
              className="border-2 border-white/30 text-white font-bold py-4 px-8 rounded-xl hover:bg-white/10 transition-colors inline-flex items-center gap-3"
            >
              <Phone className="w-5 h-5" />
              020 7123 4567
            </a>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}