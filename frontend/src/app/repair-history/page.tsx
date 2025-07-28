'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { UserRole } from '@/lib/auth/types';
import { Calendar, Download, Eye, Star } from 'lucide-react';

interface RepairRecord {
  id: string;
  device: string;
  issue: string;
  status: 'Completed' | 'In Progress' | 'Cancelled';
  date: string;
  cost: number;
  technician: string;
  rating?: number;
  warrantyExpiry?: string;
}

export default function RepairHistoryPage() {
  const [repairHistory, setRepairHistory] = useState<RepairRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch repair history from API
    const fetchRepairHistory = async () => {
      try {
        // Replace with actual API call
        const response = await fetch('/api/customer/repair-history');
        if (response.ok) {
          const data = await response.json();
          setRepairHistory(data);
        } else {
          // Fallback to mock data for development
          setRepairHistory([
            {
              id: 'RPR-001',
              device: 'MacBook Pro 16" 2023',
              issue: 'Screen Replacement',
              status: 'Completed',
              date: '2025-07-10',
              cost: 299,
              technician: 'Marcus Thompson',
              rating: 5,
              warrantyExpiry: '2025-10-10'
            },
            {
              id: 'RPR-002',
              device: 'iPhone 15 Pro',
              issue: 'Battery Replacement',
              status: 'Completed',
              date: '2025-06-15',
              cost: 89,
              technician: 'Sarah Johnson',
              rating: 5,
              warrantyExpiry: '2025-09-15'
            },
            {
              id: 'RPR-003',
              device: 'iPad Air 5th Gen',
              issue: 'Charging Port Repair',
              status: 'Completed',
              date: '2025-05-20',
              cost: 129,
              technician: 'David Chen',
              rating: 4,
              warrantyExpiry: '2025-08-20'
            }
          ]);
        }
      } catch (error) {
        console.error('Failed to fetch repair history:', error);
        // Set mock data on error
        setRepairHistory([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRepairHistory();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDownloadInvoice = (repairId: string) => {
    // Implement invoice download
    console.log('Downloading invoice for repair:', repairId);
  };

  const handleViewDetails = (repairId: string) => {
    // Navigate to repair details
    console.log('Viewing details for repair:', repairId);
  };

  if (isLoading) {
    return (
      <ProtectedRoute requiredRole={[UserRole.CUSTOMER]}>
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole={[UserRole.CUSTOMER]}>
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Repair History</h1>
          <p className="text-gray-600">View all your past repairs and download invoices</p>
        </div>

        {repairHistory.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-gray-400 mb-4">
              <Calendar className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Repair History</h3>
            <p className="text-gray-600 mb-6">You haven't had any repairs with us yet.</p>
            <Button href="/book-repair">Book Your First Repair</Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {repairHistory.map((repair) => (
              <Card key={repair.id} className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{repair.device}</h3>
                        <p className="text-gray-600">{repair.issue}</p>
                        <p className="text-sm text-gray-500">Technician: {repair.technician}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(repair.status)}`}>
                        {repair.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Repair ID:</span>
                        <p className="font-medium">{repair.id}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Date:</span>
                        <p className="font-medium">{new Date(repair.date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Cost:</span>
                        <p className="font-medium">£{repair.cost}</p>
                      </div>
                      {repair.warrantyExpiry && (
                        <div>
                          <span className="text-gray-500">Warranty Until:</span>
                          <p className="font-medium">{new Date(repair.warrantyExpiry).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>

                    {repair.rating && (
                      <div className="flex items-center mt-4">
                        <span className="text-gray-500 text-sm mr-2">Your Rating:</span>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < repair.rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 mt-4 lg:mt-0 lg:ml-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(repair.id)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadInvoice(repair.id)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Invoice
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}