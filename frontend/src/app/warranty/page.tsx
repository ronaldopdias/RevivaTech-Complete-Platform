'use client';

import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { 
  Shield, 
  CheckCircle, 
  Clock, 
  Award, 
  AlertCircle,
  FileText,
  Phone,
  Mail,
  Search,
  Calendar,
  Wrench,
  Zap,
  X,
  Check
} from 'lucide-react';

// Warranty tiers
const warrantyTiers = [
  {
    name: 'Basic Warranty',
    duration: '30 days',
    price: 'Included',
    description: 'Standard coverage for basic repairs',
    features: [
      'Parts and labor coverage',
      'Defect protection',
      'Email support',
      'Standard service priority'
    ],
    color: 'from-blue-500 to-blue-600'
  },
  {
    name: 'Professional Warranty',
    duration: '90 days',
    price: 'Included',
    description: 'Extended coverage for professional service',
    features: [
      'Parts and labor coverage',
      'Defect protection',
      'Priority support',
      'Fast-track service',
      'Data protection guarantee'
    ],
    color: 'from-purple-500 to-purple-600',
    popular: true
  },
  {
    name: 'Premium Warranty',
    duration: '12 months',
    price: 'Included',
    description: 'Complete peace of mind coverage',
    features: [
      'Parts and labor coverage',
      'Defect protection',
      '24/7 priority support',
      'Same-day service',
      'Data protection guarantee',
      'Accidental damage coverage',
      'Free pickup & delivery'
    ],
    color: 'from-green-500 to-green-600'
  }
];

// What's covered vs not covered
const coverage = {
  covered: [
    'Defects in repair workmanship',
    'Replacement part failures',
    'Labor costs for covered repairs',
    'Diagnostic fees for warranty claims',
    'Parts degradation under normal use',
    'Software issues related to hardware repair',
    'Data recovery due to repair defects',
    'Return shipping costs'
  ],
  notCovered: [
    'Physical damage after repair',
    'Liquid damage after repair',
    'Damage from misuse or abuse',
    'Normal wear and tear',
    'Software issues unrelated to repair',
    'Damage from third-party repairs',
    'Cosmetic damage not affecting function',
    'Issues with non-repaired components'
  ]
};

// Process steps
const processSteps = [
  {
    step: 1,
    title: 'Contact Us',
    description: 'Call, email, or chat with our support team',
    icon: Phone
  },
  {
    step: 2,
    title: 'Provide Details',
    description: 'Share your repair reference number and issue details',
    icon: FileText
  },
  {
    step: 3,
    title: 'Assessment',
    description: 'We evaluate if the issue is covered under warranty',
    icon: Search
  },
  {
    step: 4,
    title: 'Resolution',
    description: 'Free repair, replacement, or refund if covered',
    icon: Tool
  }
];

export default function WarrantyPage() {
  const [warrantyLookup, setWarrantyLookup] = useState('');
  const [selectedTab, setSelectedTab] = useState('coverage');

  const tabs = [
    { id: 'coverage', label: 'Coverage' },
    { id: 'terms', label: 'Terms & Conditions' },
    { id: 'claim', label: 'Make a Claim' }
  ];

  return (
    <MainLayout>
      <div className="bg-white">
        {/* Hero Section */}
        <section className="pt-32 pb-16 bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-4xl mx-auto">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-5xl md:text-6xl font-display font-bold mb-6">
                Warranty <span className="gradient-text">Information</span>
              </h1>
              <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
                Comprehensive warranty coverage for all repairs. Your peace of mind is our priority.
              </p>
              
              {/* Quick warranty lookup */}
              <div className="bg-white rounded-2xl shadow-lg p-6 max-w-md mx-auto">
                <h3 className="text-lg font-display font-bold mb-4">Check Your Warranty</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter repair reference number"
                    value={warrantyLookup}
                    onChange={(e) => setWarrantyLookup(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  />
                  <button className="bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-600 transition-colors">
                    <Search className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Warranty Tiers */}
        <section className="py-16">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-display font-bold mb-4">
                Warranty <span className="gradient-text">Coverage</span>
              </h2>
              <p className="text-lg text-gray-600">
                Choose the warranty level that best suits your needs
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {warrantyTiers.map((tier, index) => (
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
                    <div className={`w-16 h-16 bg-gradient-to-r ${tier.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                      <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-display font-bold mb-2">{tier.name}</h3>
                    <p className="text-gray-600 mb-4">{tier.description}</p>
                    <div className="text-3xl font-bold text-gray-900">{tier.duration}</div>
                    <div className="text-sm text-gray-500">{tier.price}</div>
                  </div>

                  <div className="space-y-4">
                    {tier.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Coverage Details */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-display font-bold mb-4">
                What's <span className="gradient-text">Covered</span>
              </h2>
              <p className="text-lg text-gray-600">
                Clear breakdown of what is and isn't covered under our warranty
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {/* What's Covered */}
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                    <Check className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-display font-bold">What's Covered</h3>
                </div>
                <div className="space-y-4">
                  {coverage.covered.map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* What's Not Covered */}
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-600 rounded-xl flex items-center justify-center">
                    <X className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-display font-bold">What's Not Covered</h3>
                </div>
                <div className="space-y-4">
                  {coverage.notCovered.map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <X className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Warranty Process */}
        <section className="py-16">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-display font-bold mb-4">
                Warranty <span className="gradient-text">Process</span>
              </h2>
              <p className="text-lg text-gray-600">
                Simple steps to claim your warranty coverage
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
              {processSteps.map((step, index) => {
                const IconComponent = step.icon;
                return (
                  <div key={index} className="text-center">
                    <div className="relative mb-6">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto">
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full border-2 border-blue-500 flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-500">{step.step}</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-display font-bold mb-2">{step.title}</h3>
                    <p className="text-gray-600">{step.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Important Information */}
        <section className="py-16 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <div className="flex items-center gap-3 mb-6">
                  <AlertCircle className="w-8 h-8 text-blue-500" />
                  <h3 className="text-2xl font-display font-bold">Important Information</h3>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Warranty Period</h4>
                    <p className="text-gray-700">
                      Warranty coverage begins from the date of repair completion and lasts for the specified duration based on your service tier.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Proof of Service</h4>
                    <p className="text-gray-700">
                      Keep your repair receipt and reference number safe. This serves as proof of warranty coverage and is required for any warranty claims.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Coverage Limitations</h4>
                    <p className="text-gray-700">
                      Warranty covers defects in workmanship and part failures. It does not cover new damage, misuse, or issues unrelated to the original repair.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Claim Time Limit</h4>
                    <p className="text-gray-700">
                      Warranty claims must be made within the coverage period. We recommend contacting us as soon as you notice any issues.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-16">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-display font-bold mb-4">
                Need <span className="gradient-text">Help?</span>
              </h2>
              <p className="text-lg text-gray-600">
                Our support team is here to help with your warranty questions
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-display font-bold mb-2">Phone Support</h3>
                <p className="text-gray-600 mb-4">Speak with a warranty specialist</p>
                <p className="text-xl font-bold text-blue-600">020 7123 4567</p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-display font-bold mb-2">Email Support</h3>
                <p className="text-gray-600 mb-4">Send detailed warranty inquiries</p>
                <p className="text-lg font-semibold text-purple-600">warranty@revivatech.co.uk</p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-display font-bold mb-2">Response Time</h3>
                <p className="text-gray-600 mb-4">We respond to warranty claims</p>
                <p className="text-lg font-semibold text-green-600">Within 2 hours</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-4xl font-display font-bold mb-4">
              Ready to Experience Our Quality Service?
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Book your repair now and get comprehensive warranty coverage included
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-colors">
                Book Repair Now
              </button>
              <button className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/10 transition-colors">
                Contact Support
              </button>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}