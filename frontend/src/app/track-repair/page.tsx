import React from 'react';
import MainLayout from '@/components/layout/MainLayout';

export default function TrackRepairPage() {
  return (
    <MainLayout>
      <div className="min-h-screen bg-white">
        <section className="py-20">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-5xl font-bold text-gray-900 mb-6">
                Track Your Repair
              </h1>
              <p className="text-xl text-gray-600 mb-12">
                Enter your repair tracking number to see real-time updates on your device
              </p>
              
              <div className="max-w-md mx-auto mb-16">
                <input 
                  type="text" 
                  placeholder="Enter repair tracking ID (e.g., RT2024001234)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 text-center"
                />
                <button className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold">
                  Track Repair
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center p-6 bg-gray-50 rounded-xl">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-bold">1</span>
                  </div>
                  <h3 className="font-semibold mb-2">Real-Time Updates</h3>
                  <p className="text-gray-600 text-sm">Get instant notifications about your repair progress</p>
                </div>
                
                <div className="text-center p-6 bg-gray-50 rounded-xl">
                  <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-bold">2</span>
                  </div>
                  <h3 className="font-semibold mb-2">Detailed Timeline</h3>
                  <p className="text-gray-600 text-sm">See each step of the repair process with timestamps</p>
                </div>
                
                <div className="text-center p-6 bg-gray-50 rounded-xl">
                  <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-bold">3</span>
                  </div>
                  <h3 className="font-semibold mb-2">Quality Assurance</h3>
                  <p className="text-gray-600 text-sm">Final testing and quality checks before completion</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}