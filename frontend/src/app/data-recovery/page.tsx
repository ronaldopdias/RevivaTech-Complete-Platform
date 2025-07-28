'use client';

import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { HardDrive, Shield, Clock, CheckCircle, Database, Zap } from 'lucide-react';

export default function DataRecovery() {
  return (
    <MainLayout>
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="relative py-20 bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <HardDrive className="w-16 h-16 mx-auto mb-6 text-blue-600" />
              <h1 className="text-5xl font-bold text-gray-900 mb-6">
                Professional Data Recovery Services
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Advanced data recovery from damaged drives, SSDs, and mobile devices. 
                No recovery, no fee guarantee.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="/book-repair" className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                  Start Recovery
                </a>
                <a href="/contact" className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                  Get Quote
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-16">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-12">Recovery Services</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-lg border">
                <Database className="w-12 h-12 text-blue-600 mb-4" />
                <h3 className="text-xl font-bold mb-3">Hard Drive Recovery</h3>
                <p className="text-gray-600">Mechanical and logical failures, clicking drives, water damage</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-lg border">
                <Zap className="w-12 h-12 text-green-600 mb-4" />
                <h3 className="text-xl font-bold mb-3">SSD Recovery</h3>
                <p className="text-gray-600">Flash memory recovery, controller failures, NAND chip repair</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-lg border">
                <Shield className="w-12 h-12 text-purple-600 mb-4" />
                <h3 className="text-xl font-bold mb-3">Emergency Recovery</h3>
                <p className="text-gray-600">24/7 emergency service for critical business data</p>
              </div>
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-12">Recovery Process</h2>
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold">1</div>
                  <h3 className="font-bold mb-2">Evaluation</h3>
                  <p className="text-sm text-gray-600">Free diagnostic assessment</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold">2</div>
                  <h3 className="font-bold mb-2">Quote</h3>
                  <p className="text-sm text-gray-600">Transparent pricing, no hidden fees</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold">3</div>
                  <h3 className="font-bold mb-2">Recovery</h3>
                  <p className="text-sm text-gray-600">Clean room data extraction</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold">4</div>
                  <h3 className="font-bold mb-2">Delivery</h3>
                  <p className="text-sm text-gray-600">Secure data transfer</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}