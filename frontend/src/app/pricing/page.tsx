'use client';

import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { 
  CheckCircle, 
  Star, 
  Zap, 
  Shield, 
  Clock, 
  Phone,
  ArrowRight,
  Award,
  Users,
  DollarSign
} from 'lucide-react';

// Pricing tiers data
const pricingTiers = [
  {
    name: 'Basic Repair',
    price: 49,
    description: 'Perfect for simple repairs and diagnostics',
    features: [
      'Free diagnostic evaluation',
      'Basic repair service',
      '30-day warranty',
      'Email support',
      'Standard turnaround (3-5 days)'
    ],
    popular: false,
    color: 'from-blue-500 to-blue-600'
  },
  {
    name: 'Professional',
    price: 89,
    description: 'Our most popular service for comprehensive repairs',
    features: [
      'Free diagnostic evaluation',
      'Professional repair service',
      '90-day warranty',
      'Priority support',
      'Fast turnaround (1-2 days)',
      'Genuine parts guarantee',
      'Data preservation'
    ],
    popular: true,
    color: 'from-purple-500 to-purple-600'
  },
  {
    name: 'Premium',
    price: 149,
    description: 'Complete service with premium features',
    features: [
      'Free diagnostic evaluation',
      'Premium repair service',
      '12-month warranty',
      '24/7 priority support',
      'Same-day service',
      'Genuine parts guarantee',
      'Data preservation',
      'Free pickup & delivery',
      'Preventive maintenance'
    ],
    popular: false,
    color: 'from-green-500 to-green-600'
  }
];

// Service categories with pricing
const serviceCategories = [
  {
    category: 'Apple Devices',
    services: [
      { name: 'iPhone Screen Repair', price: 89, duration: '1-2 hours' },
      { name: 'MacBook Screen Repair', price: 299, duration: '1-2 days' },
      { name: 'iPad Screen Repair', price: 179, duration: '1-2 days' },
      { name: 'Mac Logic Board Repair', price: 449, duration: '3-5 days' },
      { name: 'Battery Replacement', price: 79, duration: '1-2 hours' }
    ]
  },
  {
    category: 'PC & Laptops',
    services: [
      { name: 'Laptop Screen Repair', price: 199, duration: '1-2 days' },
      { name: 'Virus Removal', price: 59, duration: '1-2 hours' },
      { name: 'Data Recovery', price: 129, duration: '2-7 days' },
      { name: 'Custom PC Build', price: 299, duration: '1-3 days' },
      { name: 'Hardware Upgrade', price: 89, duration: '1-2 hours' }
    ]
  },
  {
    category: 'Gaming Consoles',
    services: [
      { name: 'PlayStation Repair', price: 99, duration: '2-3 days' },
      { name: 'Xbox Repair', price: 99, duration: '2-3 days' },
      { name: 'Nintendo Switch Repair', price: 89, duration: '1-2 days' },
      { name: 'Controller Repair', price: 39, duration: '1-2 hours' }
    ]
  }
];

export default function PricingPage() {
  return (
    <MainLayout>
      {/* SEO and Page Title */}
      <div className="bg-white">
        {/* Hero Section */}
        <section className="pt-32 pb-16 bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-5xl md:text-6xl font-display font-bold mb-6">
                <span className="gradient-text">Transparent Pricing</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                No hidden fees, no surprises. Get quality repairs at fair prices with our comprehensive warranty coverage.
              </p>
              
              {/* Trust indicators */}
              <div className="flex justify-center items-center gap-8 mb-12">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium">90-Day Warranty</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <span className="text-sm font-medium">Free Diagnostic</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-500" />
                  <span className="text-sm font-medium">Genuine Parts</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Tiers */}
        <section className="py-16">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-display font-bold mb-4">
                Choose Your <span className="gradient-text">Service Level</span>
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Select the perfect service package for your needs. All packages include our quality guarantee.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {pricingTiers.map((tier, index) => (
                <div 
                  key={tier.name}
                  className={`relative bg-white rounded-2xl shadow-lg p-8 border-2 ${
                    tier.popular ? 'border-purple-500 shadow-purple-100' : 'border-gray-200'
                  }`}
                >
                  {tier.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-full text-sm font-semibold">
                        Most Popular
                      </div>
                    </div>
                  )}

                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-display font-bold mb-2">{tier.name}</h3>
                    <p className="text-gray-600 mb-6">{tier.description}</p>
                    
                    <div className="mb-6">
                      <span className="text-5xl font-bold text-gray-900">£{tier.price}</span>
                      <span className="text-gray-500 ml-2">starting from</span>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    {tier.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <button className={`w-full py-4 px-6 rounded-xl font-semibold transition-all ${
                    tier.popular 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg' 
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}>
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-2 inline-block" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Service Categories Pricing */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-display font-bold mb-4">
                Service <span className="gradient-text">Pricing Guide</span>
              </h2>
              <p className="text-lg text-gray-600">
                Detailed pricing for our most popular repair services
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {serviceCategories.map((category, index) => (
                <div key={category.category} className="bg-white rounded-2xl shadow-lg p-8">
                  <h3 className="text-2xl font-display font-bold mb-6 text-center">
                    {category.category}
                  </h3>
                  
                  <div className="space-y-4">
                    {category.services.map((service, serviceIndex) => (
                      <div key={serviceIndex} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
                        <div>
                          <div className="font-semibold text-gray-900">{service.name}</div>
                          <div className="text-sm text-gray-500">{service.duration}</div>
                        </div>
                        <div className="text-xl font-bold text-blue-600">
                          £{service.price}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-16">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-display font-bold mb-4">
                Why Our <span className="gradient-text">Pricing</span> Works
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                We believe in transparent, fair pricing with no hidden fees or surprises
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  icon: Shield,
                  title: 'No Hidden Fees',
                  description: 'What you see is what you pay. No surprises at checkout.',
                  color: 'from-green-500 to-emerald-600'
                },
                {
                  icon: Clock,
                  title: 'Free Diagnostic',
                  description: 'Always free evaluation to determine exact repair needs.',
                  color: 'from-blue-500 to-cyan-600'
                },
                {
                  icon: Award,
                  title: 'Quality Guarantee',
                  description: 'All repairs backed by our comprehensive warranty.',
                  color: 'from-purple-500 to-violet-600'
                },
                {
                  icon: Users,
                  title: 'Fair Pricing',
                  description: 'Competitive rates with transparent breakdown.',
                  color: 'from-orange-500 to-red-600'
                }
              ].map((item, index) => (
                <div key={index} className="text-center">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${item.color} flex items-center justify-center mx-auto mb-4`}>
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-display font-bold mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-4xl font-display font-bold mb-4">
              Ready to Get Your Device Fixed?
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Get a free diagnostic and transparent quote for your repair
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-colors">
                Book Free Diagnostic
              </button>
              <button className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/10 transition-colors">
                <Phone className="w-5 h-5 inline-block mr-2" />
                Call Now
              </button>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}