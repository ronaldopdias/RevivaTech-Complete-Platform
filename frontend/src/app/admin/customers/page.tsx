'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { UserRole } from '@/lib/auth/types';
import AnalyticsWidget from '@/components/admin/AnalyticsWidget';
import { useAuthenticatedApi } from '@/lib/auth/useAuthenticatedApi';
import { Search, Eye, Mail, Phone, User, Filter } from 'lucide-react';

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  joinDate: string;
  totalRepairs: number;
  totalSpent: number;
  lastRepair: string;
  status: 'Active' | 'Inactive';
  tier: string;
  loyaltyPoints: number;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Use authenticated API hook for backend calls
  const { get: getFromAPI, loading: isLoading, error: apiError } = useAuthenticatedApi<Customer[]>();

  useEffect(() => {
    // Fetch customers from authenticated backend API
    const fetchCustomers = async () => {
      try {
        const response = await getFromAPI('/api/admin/customers');
        if (response.success && response.data) {
          // Handle the API response structure - extract data array
          const customersArray = Array.isArray(response.data.data) ? response.data.data : [];
          setCustomers(customersArray);
        } else {
          console.error('Failed to fetch customers:', response.error?.message);
          setCustomers([]);
        }
      } catch (error) {
        console.error('Failed to fetch customers:', error);
        setCustomers([]);
      }
    };

    fetchCustomers();
  }, [getFromAPI]);

  // Defensive programming - ensure customers is always an array
  const safeCustomers = Array.isArray(customers) ? customers : [];
  
  const filteredCustomers = safeCustomers.filter(customer => {
    const matchesSearch = 
      customer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || customer.status.toLowerCase() === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Bronze': return 'bg-amber-100 text-amber-800';
      case 'Silver': return 'bg-gray-100 text-gray-800';
      case 'Gold': return 'bg-yellow-100 text-yellow-800';
      case 'Platinum': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'Active' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  const handleViewCustomer = (customerId: string) => {
    // Navigate to customer details page
    console.log('Viewing customer:', customerId);
  };

  const handleContactCustomer = (customer: Customer) => {
    // Open contact modal or navigate to messaging
    console.log('Contacting customer:', customer);
  };

  if (isLoading) {
    return (
      <ProtectedRoute requiredRole={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Customer Management</h1>
          <p className="text-gray-600">View and manage all customers</p>
        </div>

        {/* Error Display */}
        {apiError && (
          <Card className="p-4 mb-6 bg-red-50 border-red-200">
            <div className="text-red-800">
              <strong>Error loading customers:</strong> {apiError}
            </div>
          </Card>
        )}

        {/* Filters and Search */}
        <Card className="p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search customers by name, email, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>
        </Card>

        {/* Customer Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-600">{safeCustomers.length}</div>
            <div className="text-sm text-gray-600">Total Customers</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-green-600">
              {safeCustomers.filter(c => c.status === 'Active').length}
            </div>
            <div className="text-sm text-gray-600">Active Customers</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-purple-600">
              £{safeCustomers.reduce((sum, c) => sum + c.totalSpent, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Revenue</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-orange-600">
              {(safeCustomers.reduce((sum, c) => sum + c.totalSpent, 0) / safeCustomers.length || 0).toFixed(0)}
            </div>
            <div className="text-sm text-gray-600">Avg. Customer Value</div>
          </Card>
        </div>

        {/* Customer Analytics Widget */}
        <div className="mb-8">
          <AnalyticsWidget 
            variant="compact"
            categories={['customers', 'revenue']}
            maxItems={4}
            showRefresh={true}
            showViewAll={true}
            className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200"
          />
        </div>

        {/* Customer List */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Customer</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Contact</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Tier</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Repairs</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Total Spent</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Last Repair</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {customer.firstName} {customer.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{customer.id}</div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="text-gray-900">{customer.email}</div>
                        <div className="text-gray-500">{customer.phone}</div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(customer.status)}`}>
                        {customer.status}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTierColor(customer.tier)}`}>
                        {customer.tier}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {customer.totalRepairs}
                    </td>
                    
                    <td className="px-6 py-4 text-sm text-gray-900">
                      £{customer.totalSpent.toLocaleString()}
                    </td>
                    
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(customer.lastRepair).toLocaleDateString()}
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewCustomer(customer.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleContactCustomer(customer)}
                        >
                          <Mail className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredCustomers.length === 0 && (
            <div className="text-center py-12">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
              <p className="text-gray-600">No customers match your search criteria.</p>
            </div>
          )}
        </Card>
      </div>
    </ProtectedRoute>
  );
}