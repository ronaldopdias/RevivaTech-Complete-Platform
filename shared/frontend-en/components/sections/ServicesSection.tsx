import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, Button } from '@shared';

export const ServicesSection: React.FC = () => {
  const services = [
    {
      title: 'Data Recovery',
      description: 'Professional data recovery from failed drives, corrupted files, and accidental deletion.',
      icon: '💾',
      features: ['24/7 emergency service', 'No data, no fee', 'Secure handling'],
      href: '/data-recovery',
      price: 'From £199',
    },
    {
      title: 'iPhone Repair',
      description: 'Screen replacement, battery service, and comprehensive iPhone repairs.',
      icon: '📱',
      features: ['Original parts', 'Same-day service', '90-day warranty'],
      href: '/repairs/iphone',
      price: 'From £49',
    },
    {
      title: 'MacBook Repair',
      description: 'Logic board repair, screen replacement, and MacBook maintenance.',
      icon: '💻',
      features: ['Certified technicians', 'Genuine parts', 'Free diagnosis'],
      href: '/repairs/macbook',
      price: 'From £99',
    },
    {
      title: 'Laptop Repair',
      description: 'Windows laptop repair, hardware upgrades, and virus removal.',
      icon: '🖥️',
      features: ['All brands', 'Quick turnaround', 'Data preservation'],
      href: '/repairs/laptop',
      price: 'From £79',
    },
    {
      title: 'Tablet Repair',
      description: 'iPad and Android tablet screen replacement and repairs.',
      icon: '📟',
      features: ['Touch restoration', 'Battery service', 'Water damage'],
      href: '/repairs/tablet',
      price: 'From £69',
    },
    {
      title: 'Business Solutions',
      description: 'Corporate device management, bulk repairs, and IT support.',
      icon: '🏢',
      features: ['Priority service', 'Volume discounts', 'On-site support'],
      href: '/business',
      price: 'Contact us',
    },
  ];

  return (
    <div className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Our Services
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Professional repair and recovery services for all your devices. 
            We use only genuine parts and provide comprehensive warranties.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <Card key={index} className="h-full hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl">{service.icon}</span>
                  <span className="text-lg font-semibold text-primary-600">
                    {service.price}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {service.title}
                </h3>
              </CardHeader>
              <CardContent className="flex flex-col justify-between flex-1">
                <div>
                  <p className="text-gray-600 mb-4">
                    {service.description}
                  </p>
                  <ul className="space-y-2 mb-6">
                    {service.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-sm text-gray-600">
                        <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <Link href={service.href} className="w-full">
                  <Button variant="outline" className="w-full">Learn More</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="/services">
            <Button size="lg">View All Services</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};