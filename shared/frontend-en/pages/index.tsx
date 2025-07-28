import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import { Button, Card, CardContent, CardHeader, LoadingSpinner } from '@shared';
import { MainLayout } from '../components/layouts/MainLayout';
import { HeroSection } from '../components/sections/HeroSection';
import { ServicesSection } from '../components/sections/ServicesSection';
import { TestimonialsSection } from '../components/sections/TestimonialsSection';
import { CTASection } from '../components/sections/CTASection';
import useSWR from 'swr';

// SWR fetcher function
const fetcher = (url: string) => fetch(url).then(res => res.json());

interface HomePageProps {
  initialData?: any;
}

export default function HomePage({ initialData }: HomePageProps) {
  const { data: apiInfo, error } = useSWR('/api/info', fetcher, {
    fallbackData: initialData,
  });
  
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <>
      <Head>
        <title>RevivaTech - Professional Device Repair & Data Recovery | UK</title>
        <meta 
          name="description" 
          content="Expert device repair and data recovery services in the UK. iPhone, MacBook, laptop repair with same-day service available. Professional, reliable, and affordable." 
        />
        <meta 
          name="keywords" 
          content="device repair UK, data recovery UK, iPhone repair, MacBook repair, laptop repair, professional repair service" 
        />
        <meta property="og:title" content="RevivaTech - Professional Device Repair & Data Recovery" />
        <meta property="og:description" content="Expert device repair and data recovery services in the UK" />
        <meta property="og:url" content="https://revivatech.co.uk" />
        <meta property="og:image" content="https://revivatech.co.uk/images/og-image.jpg" />
        <link rel="canonical" href="https://revivatech.co.uk" />
      </Head>

      <MainLayout>
        {/* Hero Section */}
        <HeroSection />

        {/* Platform Status */}
        <div className="bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">
                  New Platform Status
                </h2>
              </CardHeader>
              <CardContent>
                {error ? (
                  <div className="text-red-600">
                    Failed to connect to backend API
                  </div>
                ) : !apiInfo ? (
                  <div className="flex items-center">
                    <LoadingSpinner className="mr-2" />
                    Loading platform status...
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm text-gray-600">
                        Platform: {apiInfo.name} v{apiInfo.version}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm text-gray-600">
                        Environment: {apiInfo.environment}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm text-gray-600">
                        Last Update: {isClient 
                          ? new Date(apiInfo.timestamp).toLocaleString('en-GB', {
                              timeZone: 'Europe/London',
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })
                          : 'Loading...'
                        }
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Services Section */}
        <ServicesSection />

        {/* Testimonials Section */}
        <TestimonialsSection />

        {/* CTA Section */}
        <CTASection />

        {/* Emergency Contact */}
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Emergency Data Recovery
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>
                    Critical data loss? Call our emergency hotline: <strong>0800 123 4567</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    </>
  );
}

// Server-side props for SEO and performance
export const getServerSideProps: GetServerSideProps = async () => {
  try {
    // Fetch initial data from API
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3011'}/api/info`);
    const initialData = await response.json();

    return {
      props: {
        initialData,
      },
    };
  } catch (error) {
    console.error('Failed to fetch initial data:', error);
    return {
      props: {
        initialData: null,
      },
    };
  }
};