import React from 'react';
import Link from 'next/link';
import { Button } from '@shared';

export const CTASection: React.FC = () => {
  return (
    <div className="bg-primary-600">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          <span className="block">Need help with your device?</span>
          <span className="block text-primary-200">Get started today.</span>
        </h2>
        <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
          <div className="inline-flex rounded-md shadow">
            <Link href="/contact">
              <Button size="lg" variant="secondary">Get free quote</Button>
            </Link>
          </div>
          <div className="ml-3 inline-flex rounded-md shadow">
            <Link href="/emergency">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary-600">Emergency service</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};