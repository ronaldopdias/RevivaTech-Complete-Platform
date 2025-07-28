'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Icon } from '@/components/ui/Icon';

interface DeviceCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  deviceCount?: number;
  brandCount?: number;
}

interface DeviceBrand {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  logoUrl?: string;
  isActive: boolean;
}

interface DeviceModel {
  id: string;
  categoryId: string;
  category: string;
  brand: string;
  name: string;
  year: number;
  imageUrl?: string;
  specifications: any;
  commonIssues: string[];
  averageRepairCost: number;
  screenSize?: number;
}

interface DeviceDatabaseManagerProps {
  className?: string;
}

export function DeviceDatabaseManager({ className = '' }: DeviceDatabaseManagerProps) {
  const [categories, setCategories] = useState<DeviceCategory[]>([]);
  const [devices, setDevices] = useState<DeviceModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'categories' | 'devices' | 'import'>('devices');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState<DeviceModel | null>(null);

  // Fetch data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch categories
      const categoriesResponse = await fetch('/api/categories?includeStats=true');
      const categoriesData = await categoriesResponse.json();
      setCategories(categoriesData.categories || []);

      // Fetch devices
      const devicesResponse = await fetch('/api/devices?limit=1000');
      const devicesData = await devicesResponse.json();
      setDevices(devicesData.devices || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter devices
  const filteredDevices = devices.filter(device => {
    const matchesSearch = searchQuery === '' || 
      device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.brand.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === '' || device.categoryId === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleDeleteDevice = async (deviceId: string) => {
    if (!confirm('Are you sure you want to delete this device?')) return;

    try {
      const response = await fetch(`/api/devices/${deviceId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchData(); // Refresh data
      } else {
        alert('Failed to delete device');
      }
    } catch (error) {
      console.error('Error deleting device:', error);
      alert('Failed to delete device');
    }
  };

  const handleImportFromConfig = async () => {
    if (!confirm('This will import all devices from the configuration. Continue?')) return;

    try {
      // Trigger database seeding by making a request to the devices API
      const response = await fetch('/api/devices?limit=1');
      
      if (response.ok) {
        await fetchData(); // Refresh data
        alert('Devices imported successfully!');
      } else {
        alert('Failed to import devices');
      }
    } catch (error) {
      console.error('Error importing devices:', error);
      alert('Failed to import devices');
    }
  };

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-muted-foreground">Loading device database...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card className="p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Device Database Manager</h2>
            <p className="text-muted-foreground">
              Manage device categories, brands, and models
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={handleImportFromConfig}
            >
              <Icon name="download" className="w-4 h-4 mr-2" />
              Import from Config
            </Button>
            <Button
              onClick={() => setShowAddModal(true)}
            >
              <Icon name="plus" className="w-4 h-4 mr-2" />
              Add Device
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <Icon name="layers" className="w-8 h-8 text-primary" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Categories</p>
              <p className="text-2xl font-bold">{categories.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center">
            <Icon name="tag" className="w-8 h-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Total Brands</p>
              <p className="text-2xl font-bold">
                {categories.reduce((sum, cat) => sum + (cat.brandCount || 0), 0)}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center">
            <Icon name="smartphone" className="w-8 h-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Total Devices</p>
              <p className="text-2xl font-bold">{devices.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center">
            <Icon name="calendar" className="w-8 h-8 text-orange-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Latest Year</p>
              <p className="text-2xl font-bold">
                {devices.length > 0 ? Math.max(...devices.map(d => d.year)) : '—'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Card className="p-6">
        <div className="flex space-x-1 bg-muted p-1 rounded-lg">
          <Button
            variant={activeTab === 'categories' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('categories')}
            className="flex-1"
          >
            Categories
          </Button>
          <Button
            variant={activeTab === 'devices' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('devices')}
            className="flex-1"
          >
            Devices
          </Button>
          <Button
            variant={activeTab === 'import' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('import')}
            className="flex-1"
          >
            Import/Export
          </Button>
        </div>
      </Card>

      {/* Content based on active tab */}
      {activeTab === 'categories' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Device Categories</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <Card key={category.id} className="p-4">
                <div className="flex items-center mb-3">
                  <Icon name={category.icon} className="w-8 h-8 text-primary" />
                  <div className="ml-3">
                    <h4 className="font-medium">{category.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {category.deviceCount || 0} devices
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {category.description}
                </p>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{category.brandCount || 0} brands</span>
                  <span>ID: {category.id}</span>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      )}

      {activeTab === 'devices' && (
        <Card className="p-6">
          {/* Device Filters */}
          <div className="flex gap-4 mb-6">
            <Input
              placeholder="Search devices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Select
              value={selectedCategory}
              onChange={(value) => setSelectedCategory(value)}
              placeholder="All Categories"
              className="w-48"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Devices Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2">Device</th>
                  <th className="text-left py-3 px-2">Brand</th>
                  <th className="text-left py-3 px-2">Category</th>
                  <th className="text-left py-3 px-2">Year</th>
                  <th className="text-left py-3 px-2">Avg. Cost</th>
                  <th className="text-left py-3 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDevices.map((device) => (
                  <tr key={device.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-2">
                      <div className="flex items-center">
                        {device.imageUrl && (
                          <img
                            src={device.imageUrl}
                            alt={device.name}
                            className="w-10 h-10 object-cover rounded mr-3"
                          />
                        )}
                        <div>
                          <p className="font-medium">{device.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {device.screenSize ? `${device.screenSize}"` : ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2">{device.brand}</td>
                    <td className="py-3 px-2">{device.category}</td>
                    <td className="py-3 px-2">{device.year}</td>
                    <td className="py-3 px-2">£{device.averageRepairCost}</td>
                    <td className="py-3 px-2">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingDevice(device)}
                        >
                          <Icon name="edit" className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDevice(device.id)}
                        >
                          <Icon name="trash" className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredDevices.length === 0 && (
            <div className="text-center py-12">
              <Icon name="search" className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h4 className="text-lg font-medium mb-2">No devices found</h4>
              <p className="text-muted-foreground">
                Try adjusting your search criteria
              </p>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'import' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Import/Export Tools</h3>
          <div className="space-y-6">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Import from Configuration</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Import all devices from the static configuration files. This includes
                Apple, PC, Android, and Gaming devices from 2016-2025.
              </p>
              <Button onClick={handleImportFromConfig}>
                <Icon name="download" className="w-4 h-4 mr-2" />
                Import Devices
              </Button>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Export Database</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Export the current device database as JSON for backup or migration.
              </p>
              <Button variant="ghost" disabled>
                <Icon name="upload" className="w-4 h-4 mr-2" />
                Export (Coming Soon)
              </Button>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Bulk Upload</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Upload a CSV file with device data for bulk import.
              </p>
              <Button variant="ghost" disabled>
                <Icon name="upload" className="w-4 h-4 mr-2" />
                Upload CSV (Coming Soon)
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}