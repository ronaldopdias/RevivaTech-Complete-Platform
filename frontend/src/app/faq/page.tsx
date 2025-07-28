'use client';

import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Phone, 
  Mail, 
  MessageCircle,
  Clock,
  Shield,
  CheckCircle,
  HelpCircle,
  Star,
  Zap
} from 'lucide-react';

// FAQ categories and questions
const faqCategories = [
  {
    id: 'general',
    name: 'General',
    icon: HelpCircle,
    questions: [
      {
        id: 'hours',
        question: 'What are your opening hours?',
        answer: 'We are open Monday to Friday 9:00 AM - 6:00 PM, and Saturday 10:00 AM - 4:00 PM. We are closed on Sundays and public holidays. We also offer emergency repair services 24/7 for critical business customers.'
      },
      {
        id: 'location',
        question: 'Where are you located?',
        answer: 'We are located in Central London with easy access to public transport. We also offer pickup and delivery services throughout London and surrounding areas. Contact us for exact location details and directions.'
      },
      {
        id: 'appointment',
        question: 'Do I need to make an appointment?',
        answer: 'While appointments are recommended for faster service, we also accept walk-ins. Booking an appointment ensures we have the time and parts available for your specific repair needs.'
      },
      {
        id: 'quote',
        question: 'How much does a repair cost?',
        answer: 'Repair costs vary depending on the device and issue. We offer free diagnostics to provide accurate quotes. Most repairs range from £49-£299. Check our pricing page for detailed information.'
      }
    ]
  },
  {
    id: 'repair',
    name: 'Repair Process',
    icon: Zap,
    questions: [
      {
        id: 'diagnostic',
        question: 'Is the diagnostic really free?',
        answer: 'Yes, our diagnostic service is completely free with no obligation to proceed with repairs. We will assess your device and provide a detailed quote for any necessary repairs.'
      },
      {
        id: 'time',
        question: 'How long do repairs take?',
        answer: 'Most repairs are completed within 24-48 hours. Simple repairs like screen replacements can often be done the same day. Complex repairs may take 3-5 days. We provide estimated completion times upfront.'
      },
      {
        id: 'parts',
        question: 'Do you use genuine parts?',
        answer: 'We use genuine manufacturer parts whenever possible. For older devices where genuine parts are unavailable, we use high-quality compatible parts that meet or exceed original specifications.'
      },
      {
        id: 'data',
        question: 'Will my data be safe during repair?',
        answer: 'We take data protection seriously. In most cases, your data remains untouched during hardware repairs. For repairs that might affect data, we create backups and inform you beforehand.'
      },
      {
        id: 'failed',
        question: 'What if my device cannot be repaired?',
        answer: 'If we cannot repair your device, you pay nothing for the diagnostic. We will explain why the repair is not possible and may offer alternatives like data recovery or trade-in options.'
      }
    ]
  },
  {
    id: 'warranty',
    name: 'Warranty & Support',
    icon: Shield,
    questions: [
      {
        id: 'warranty-period',
        question: 'What warranty do you offer?',
        answer: 'We offer a 90-day warranty on all repairs covering both parts and labor. Premium service includes 12-month warranty. Warranty covers defects in workmanship and part failures.'
      },
      {
        id: 'warranty-claim',
        question: 'How do I claim warranty?',
        answer: 'Simply contact us with your repair reference number. We will assess the issue and provide free repair or replacement if covered under warranty. Keep your receipt as proof of service.'
      },
      {
        id: 'support',
        question: 'Do you offer ongoing support?',
        answer: 'Yes, we provide ongoing support for all our repairs. Contact us anytime if you have questions or concerns about your repaired device. We are here to help.'
      },
      {
        id: 'return',
        question: 'What if I am not satisfied?',
        answer: 'Customer satisfaction is our priority. If you are not satisfied with our service, contact us within 7 days and we will work to resolve any issues or provide a full refund.'
      }
    ]
  },
  {
    id: 'devices',
    name: 'Device Support',
    icon: CheckCircle,
    questions: [
      {
        id: 'apple',
        question: 'Do you repair all Apple devices?',
        answer: 'Yes, we repair all Apple devices including iPhones, iPads, MacBooks, iMacs, Mac Minis, and Apple Watches. We have certified technicians and genuine Apple parts.'
      },
      {
        id: 'pc',
        question: 'What PC brands do you service?',
        answer: 'We service all major PC brands including Dell, HP, Lenovo, ASUS, Acer, MSI, and custom-built computers. We handle both hardware and software issues.'
      },
      {
        id: 'gaming',
        question: 'Do you repair gaming consoles?',
        answer: 'Yes, we repair PlayStation, Xbox, Nintendo Switch, and retro gaming consoles. Common repairs include HDMI ports, cooling fans, and disc drive issues.'
      },
      {
        id: 'age',
        question: 'Do you repair older devices?',
        answer: 'We repair devices of all ages, though parts availability may vary for very old devices. We will assess feasibility and provide honest advice about repair viability.'
      }
    ]
  },
  {
    id: 'payment',
    name: 'Payment & Pricing',
    icon: Star,
    questions: [
      {
        id: 'payment-methods',
        question: 'What payment methods do you accept?',
        answer: 'We accept cash, all major credit/debit cards, bank transfers, and contactless payments. Payment is due upon completion of repairs unless other arrangements are made.'
      },
      {
        id: 'upfront',
        question: 'Do I pay upfront?',
        answer: 'No upfront payment is required. You only pay after your device is repaired and you are satisfied with the service. We provide quotes before starting any work.'
      },
      {
        id: 'hidden-fees',
        question: 'Are there any hidden fees?',
        answer: 'No, we believe in transparent pricing. The quote we provide includes all costs. The only additional charge might be for upgraded parts if you choose premium options.'
      },
      {
        id: 'emergency',
        question: 'Do you charge extra for emergency repairs?',
        answer: 'Emergency same-day and out-of-hours repairs may incur additional charges. We will inform you of any additional costs before proceeding with emergency service.'
      }
    ]
  }
];

export default function FAQPage() {
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [openQuestions, setOpenQuestions] = useState<{ [key: string]: boolean }>({});
  const [searchTerm, setSearchTerm] = useState('');

  const toggleQuestion = (questionId: string) => {
    setOpenQuestions(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const filteredQuestions = faqCategories.find(cat => cat.id === selectedCategory)?.questions.filter(q =>
    q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.answer.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <MainLayout>
      <div className="bg-white">
        {/* Hero Section */}
        <section className="pt-32 pb-16 bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-5xl md:text-6xl font-display font-bold mb-6">
                Frequently Asked <span className="gradient-text">Questions</span>
              </h1>
              <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
                Find answers to common questions about our repair services, warranty, and support.
              </p>
              
              {/* Search Bar */}
              <div className="relative max-w-md mx-auto">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Category Sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
                  <h3 className="text-lg font-display font-bold mb-6">Categories</h3>
                  <div className="space-y-2">
                    {faqCategories.map((category) => {
                      const IconComponent = category.icon;
                      return (
                        <button
                          key={category.id}
                          onClick={() => setSelectedCategory(category.id)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                            selectedCategory === category.id
                              ? 'bg-blue-500 text-white shadow-lg'
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <IconComponent className="w-5 h-5" />
                          <span className="font-medium">{category.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* FAQ Content */}
              <div className="lg:col-span-3">
                <div className="space-y-4">
                  {filteredQuestions.map((faq) => (
                    <div key={faq.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                      <button
                        onClick={() => toggleQuestion(faq.id)}
                        className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
                      >
                        <h3 className="text-lg font-display font-semibold text-gray-900 pr-4">
                          {faq.question}
                        </h3>
                        {openQuestions[faq.id] ? (
                          <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        )}
                      </button>
                      
                      {openQuestions[faq.id] && (
                        <div className="px-6 pb-6">
                          <div className="border-t border-gray-100 pt-4">
                            <p className="text-gray-700 leading-relaxed">
                              {faq.answer}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {filteredQuestions.length === 0 && (
                    <div className="text-center py-12">
                      <HelpCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">
                        No questions found matching your search.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Help Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-display font-bold mb-4">
                Still Need <span className="gradient-text">Help?</span>
              </h2>
              <p className="text-lg text-gray-600">
                Our support team is here to help you with any questions
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-display font-bold mb-2">Call Us</h3>
                <p className="text-gray-600 mb-4">Speak directly with our support team</p>
                <p className="text-2xl font-bold text-blue-600">020 7123 4567</p>
                <p className="text-sm text-gray-500 mt-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Mon-Fri 9AM-6PM
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-display font-bold mb-2">Email Us</h3>
                <p className="text-gray-600 mb-4">Send us a detailed message</p>
                <p className="text-lg font-semibold text-purple-600">hello@revivatech.co.uk</p>
                <p className="text-sm text-gray-500 mt-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Response within 2 hours
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-display font-bold mb-2">Live Chat</h3>
                <p className="text-gray-600 mb-4">Get instant help from our team</p>
                <button className="bg-green-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-600 transition-colors">
                  Start Chat
                </button>
                <p className="text-sm text-gray-500 mt-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Available 24/7
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Stats */}
        <section className="py-16">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-blue-600 mb-2">2min</div>
                <div className="text-gray-600">Average Response Time</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-purple-600 mb-2">98%</div>
                <div className="text-gray-600">Customer Satisfaction</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-green-600 mb-2">24/7</div>
                <div className="text-gray-600">Support Available</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-orange-600 mb-2">50K+</div>
                <div className="text-gray-600">Questions Answered</div>
              </div>
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
              Have all your questions answered? Book your repair now and experience our quality service.
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