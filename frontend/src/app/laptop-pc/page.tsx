'use client';

import React from 'react';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';
import ServicePageAnalytics from '@/components/analytics/ServicePageAnalytics';
import { 
  Laptop, 
  Monitor, 
  Shield, 
  HardDrive, 
  Cpu, 
  Wrench, 
  ArrowRight, 
  CheckCircle,
  Clock,
  Award
} from 'lucide-react';

const pcServices = [
  {
    id: 'laptop-repair',
    title: 'Laptop Repair',
    description: 'Professional repair services for all laptop brands including HP, Dell, Lenovo, ASUS, and more.',
    icon: Laptop,
    href: '/laptop-pc/repair',
    features: ['Screen repairs', 'Keyboard replacement', 'Battery service', 'Motherboard repair'],
    price: 'From £69'
  },
  {
    id: 'screen-repair',
    title: 'Screen Repair',
    description: 'Expert screen replacement for cracked, broken, or malfunctioning laptop displays.',
    icon: Monitor,
    href: '/laptop-pc/screen-repair',
    features: ['LCD replacement', 'LED backlight repair', 'Touch screen service', 'Same-day service'],
    price: 'From £89'
  },
  {
    id: 'virus-removal',
    title: 'Virus Removal',
    description: 'Complete malware removal and system optimization to restore your PC performance.',
    icon: Shield,
    href: '/laptop-pc/virus-removal',
    features: ['Malware removal', 'System optimization', 'Security setup', 'Data backup'],
    price: 'From £59'
  },
  {
    id: 'custom-builds',
    title: 'Custom PC Builds',
    description: 'Professional custom PC building for gaming, work, or content creation.',
    icon: Cpu,
    href: '/laptop-pc/custom-builds',
    features: ['Gaming PCs', 'Workstations', 'Budget builds', 'Component upgrades'],
    price: 'From £299'
  },
  {
    id: 'data-recovery',
    title: 'Data Recovery',
    description: 'Recover lost data from damaged hard drives, SSDs, and storage devices.',
    icon: HardDrive,
    href: '/laptop-pc/data-recovery',
    features: ['Hard drive recovery', 'SSD recovery', 'RAID recovery', 'No data, no fee'],
    price: 'From £129'
  },
  {
    id: 'it-recycling',
    title: 'IT Recycling',
    description: 'Secure and environmentally friendly disposal of old computers and electronics.',
    icon: Wrench,
    href: '/laptop-pc/it-recycling',
    features: ['Data destruction', 'Certificate of disposal', 'Free collection', 'WEEE compliant'],
    price: 'Free Service'
  }
];

const stats = [
  { value: '10,000+', label: 'PCs Repaired', icon: Award },
  { value: '24hrs', label: 'Turnaround Time', icon: Clock },
  { value: '98%', label: 'Success Rate', icon: CheckCircle },
  { value: '5★', label: 'Customer Rating', icon: Award }
];

export default function LaptopPCPage() {
  return (
    <MainLayout>
      <ServicePageAnalytics 
        pageName="PC & Laptop Repair"
        pageCategory="Computer Services"
        pageId="laptop-pc"
        services={pcServices}
      >
        <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="relative py-20 bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full mb-6">
                <Laptop className="w-4 h-4" />
                <span className="font-medium">Professional PC & Laptop Services</span>
              </div>
              
              <h1 className="text-5xl font-bold text-gray-900 mb-6">
                PC & Laptop Repair Services
              </h1>
              
              <p className="text-xl text-gray-600 mb-8">
                Expert repair and upgrade services for all Windows laptops and desktop computers. 
                Fast turnaround, quality parts, and professional service guaranteed.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/book-repair" className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center">
                  Book Repair Now
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
                <Link href="/contact" className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                  Get Free Quote
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 bg-gray-50">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, index) => {
                const IconComponent = stat.icon;
                return (
                  <div key={index} className="text-center">
                    <IconComponent className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Services Grid */}
        <section className="py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Our PC & Laptop Services
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                From simple repairs to complete custom builds, we handle all your PC needs
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {pcServices.map((service) => {
                const IconComponent = service.icon;
                return (
                  <div key={service.id} className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-shadow">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6">
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      {service.title}
                    </h3>
                    
                    <p className="text-gray-600 mb-6">
                      {service.description}
                    </p>

                    <ul className="space-y-2 mb-6">
                      {service.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center text-gray-600">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-blue-600">
                        {service.price}
                      </span>
                      <Link 
                        href={service.href}
                        className="text-blue-600 font-semibold hover:text-blue-700 inline-flex items-center"
                      >
                        Learn More
                        <ArrowRight className="ml-1 w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
                Why Choose RevivaTech for PC Repair?
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">All Brands Supported</h3>
                    <p className="text-gray-600">We repair all major PC and laptop brands including HP, Dell, Lenovo, ASUS, Acer, MSI, and more.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Award className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Certified Technicians</h3>
                    <p className="text-gray-600">Our technicians are certified and experienced in diagnosing and repairing all PC issues.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Fast Turnaround</h3>
                    <p className="text-gray-600">Most repairs completed within 24-48 hours. Express service available for urgent repairs.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Warranty Included</h3>
                    <p className="text-gray-600">All repairs come with a comprehensive warranty for your peace of mind.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Fix Your PC or Laptop?
            </h2>
            <p className="text-xl mb-8 text-blue-100">
              Book online now for fast, professional repair service
            </p>
            <Link 
              href="/book-repair" 
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors inline-flex items-center"
            >
              Book Your Repair
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </div>
        </section>
        </div>
      </ServicePageAnalytics>
    </MainLayout>
  );
}