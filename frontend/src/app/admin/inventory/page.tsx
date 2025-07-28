'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import AnalyticsWidget from '@/components/admin/AnalyticsWidget';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { UserRole } from '@/lib/auth/types';
import { Search, Package, AlertTriangle, Plus, Edit, Trash2 } from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  sku: string;
  quantity: number;
  minQuantity: number;
  cost: number;
  price: number;
  supplier: string;
  lastOrdered: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Discontinued';
  location: string;
}

export default function AdminInventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    // Fetch inventory from API
    const fetchInventory = async () => {
      try {
        const response = await fetch('/api/admin/inventory');
        if (response.ok) {
          const data = await response.json();
          setInventory(data);
        } else {
          // Fallback to mock data for development
          setInventory([
            {
              id: 'INV-001',
              name: 'iPhone 15 Pro Screen Assembly',
              category: 'Screens',
              sku: 'IP15P-SCR-BLK',
              quantity: 25,
              minQuantity: 10,
              cost: 180,
              price: 299,
              supplier: 'Premium Parts Ltd',
              lastOrdered: '2025-07-01',
              status: 'In Stock',
              location: 'A-1-5'
            },
            {
              id: 'INV-002',
              name: 'MacBook Pro 16" Logic Board',
              category: 'Logic Boards',
              sku: 'MBP16-LB-2023',
              quantity: 3,
              minQuantity: 5,
              cost: 850,
              price: 1299,
              supplier: 'Apple Authorized',
              lastOrdered: '2025-06-15',
              status: 'Low Stock',
              location: 'B-2-1'
            },
            {
              id: 'INV-003',
              name: 'Samsung Galaxy S24 Battery',
              category: 'Batteries',
              sku: 'SGS24-BAT-4000',
              quantity: 0,
              minQuantity: 15,
              cost: 45,
              price: 89,
              supplier: 'Mobile Parts Direct',
              lastOrdered: '2025-05-20',
              status: 'Out of Stock',
              location: 'C-1-3'
            },
            {
              id: 'INV-004',
              name: 'iPad Air 5 Charging Port',
              category: 'Charging Ports',
              sku: 'IPA5-CP-USBC',
              quantity: 18,
              minQuantity: 8,
              cost: 25,
              price: 59,
              supplier: 'Tech Components Co',
              lastOrdered: '2025-07-05',
              status: 'In Stock',
              location: 'A-3-2'
            },
            {
              id: 'INV-005',
              name: 'iPhone 12 Camera Module',
              category: 'Cameras',
              sku: 'IP12-CAM-12MP',
              quantity: 12,
              minQuantity: 10,
              cost: 120,
              price: 199,
              supplier: 'Optics Plus',
              lastOrdered: '2025-06-28',
              status: 'In Stock',
              location: 'D-1-4'
            }
          ]);
        }
      } catch (error) {
        console.error('Failed to fetch inventory:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInventory();
  }, []);

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = [...new Set(inventory.map(item => item.category))];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Stock': return 'bg-green-100 text-green-800';
      case 'Low Stock': return 'bg-yellow-100 text-yellow-800';
      case 'Out of Stock': return 'bg-red-100 text-red-800';
      case 'Discontinued': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStockIcon = (status: string) => {
    switch (status) {
      case 'Low Stock':
      case 'Out of Stock':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const handleAddItem = () => {
    // Open add item modal
    console.log('Adding new inventory item');
  };

  const handleEditItem = (itemId: string) => {
    // Open edit item modal
    console.log('Editing item:', itemId);
  };

  const handleDeleteItem = (itemId: string) => {
    // Confirm and delete item
    console.log('Deleting item:', itemId);
  };

  const handleReorder = (itemId: string) => {
    // Trigger reorder process
    console.log('Reordering item:', itemId);
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Inventory Management</h1>
            <p className="text-gray-600">Manage parts and components inventory</p>
          </div>
          <Button onClick={handleAddItem}>
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>

        {/* Inventory Analytics */}
        <div className="mb-8">
          <AnalyticsWidget 
            variant="detailed"
            categories={['repairs', 'performance']}
            maxItems={3}
            showRefresh={true}
            showViewAll={true}
            className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200"
          />
        </div>

        {/* Filters and Search */}
        <Card className="p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by name, SKU, or supplier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-4">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="In Stock">In Stock</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
                <option value="Discontinued">Discontinued</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Inventory Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-600">{inventory.length}</div>
            <div className="text-sm text-gray-600">Total Items</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-green-600">
              {inventory.filter(item => item.status === 'In Stock').length}
            </div>
            <div className="text-sm text-gray-600">In Stock</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-yellow-600">
              {inventory.filter(item => item.status === 'Low Stock').length}
            </div>
            <div className="text-sm text-gray-600">Low Stock</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-red-600">
              {inventory.filter(item => item.status === 'Out of Stock').length}
            </div>
            <div className="text-sm text-gray-600">Out of Stock</div>
          </Card>
        </div>

        {/* Inventory List */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Item</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">SKU</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Category</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Stock</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Cost</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Price</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Location</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                          {getStockIcon(item.status)}
                          <span className="text-white text-xs">
                            {item.status === 'Low Stock' || item.status === 'Out of Stock' ? '!' : ''}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{item.name}</div>
                          <div className="text-sm text-gray-500">{item.supplier}</div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 text-sm font-mono text-gray-900">
                      {item.sku}
                    </td>
                    
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {item.category}
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="text-gray-900">
                          {item.quantity} / {item.minQuantity} min
                        </div>
                        <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className={`h-2 rounded-full ${
                              item.quantity === 0 ? 'bg-red-500' :
                              item.quantity <= item.minQuantity ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ 
                              width: `${Math.min(100, (item.quantity / (item.minQuantity * 2)) * 100)}%` 
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 text-sm text-gray-900">
                      £{item.cost}
                    </td>
                    
                    <td className="px-6 py-4 text-sm text-gray-900">
                      £{item.price}
                    </td>
                    
                    <td className="px-6 py-4 text-sm font-mono text-gray-900">
                      {item.location}
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditItem(item.id)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        
                        {(item.status === 'Low Stock' || item.status === 'Out of Stock') && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleReorder(item.id)}
                          >
                            Reorder
                          </Button>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredInventory.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
              <p className="text-gray-600">No inventory items match your search criteria.</p>
            </div>
          )}
        </Card>
      </div>
    </ProtectedRoute>
  );
}