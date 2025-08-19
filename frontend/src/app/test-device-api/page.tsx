'use client';

import React from 'react';
import { useDeviceData } from '@/hooks/useDeviceData';

export default function TestDeviceApiPage() {
  const { categories, devices, brands, isLoading, error } = useDeviceData();

  if (isLoading) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold mb-6">Testing Device API Integration</h1>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Loading device data from API...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold mb-6">Testing Device API Integration</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold">API Error</h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Testing Device API Integration</h1>
      
      {/* API Status */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <h3 className="text-green-800 font-semibold">✅ API Connection Successful</h3>
        <p className="text-green-600">Successfully connected to backend device API</p>
      </div>

      {/* Categories Section */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Device Categories ({categories.length})</h2>
        {categories.length === 0 ? (
          <p className="text-gray-500">No categories found</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <div key={category.id} className="bg-white border rounded-lg p-4 shadow-sm">
                <h3 className="font-semibold text-lg">{category.name}</h3>
                <p className="text-gray-600 text-sm">{category.description}</p>
                <div className="mt-2 flex items-center text-xs text-gray-500">
                  <span>ID: {category.id}</span>
                  {category.iconName && <span className="ml-2">Icon: {category.iconName}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Devices Section */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Device Models ({devices.length})</h2>
        {devices.length === 0 ? (
          <p className="text-gray-500">No devices found</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {devices.slice(0, 12).map((device) => (
              <div key={device.id} className="bg-white border rounded-lg p-4 shadow-sm">
                <h3 className="font-semibold">{device.name}</h3>
                <p className="text-gray-600 text-sm">Brand: {device.brandName || 'N/A'}</p>
                <p className="text-gray-600 text-sm">Year: {device.year}</p>
                {device.screenSize && (
                  <p className="text-gray-600 text-sm">Screen: {device.screenSize}"</p>
                )}
                <div className="mt-2 text-xs text-gray-500">
                  <p>ID: {device.id}</p>
                  <p>Brand ID: {device.brandId}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        {devices.length > 12 && (
          <p className="text-gray-500 mt-4">Showing first 12 of {devices.length} devices</p>
        )}
      </section>

      {/* Brands Section */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Brands ({brands.length})</h2>
        {brands.length === 0 ? (
          <p className="text-gray-500">No brands found</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {brands.map((brand) => (
              <div key={brand.id} className="bg-white border rounded-lg p-4 shadow-sm">
                <h3 className="font-semibold">{brand.name}</h3>
                <p className="text-gray-600 text-sm">Slug: {brand.slug}</p>
                <p className="text-gray-600 text-sm">Category ID: {brand.categoryId}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Debug Info */}
      <section className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Debug Information</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <p>API Base URL: {window.location.protocol === 'https:' ? 'https://api.revivatech.co.uk' : 'http://localhost:3011'}</p>
          <p>Frontend: {window.location.origin}</p>
          <p>Environment: Development</p>
          <p>Total Categories: {categories.length}</p>
          <p>Total Devices: {devices.length}</p>
          <p>Total Brands: {brands.length}</p>
        </div>
      </section>
    </div>
  );
}