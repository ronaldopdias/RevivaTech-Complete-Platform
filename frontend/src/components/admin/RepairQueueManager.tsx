'use client';

import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  User, 
  Smartphone, 
  AlertCircle, 
  CheckCircle, 
  Filter, 
  Search,
  MoreVertical,
  Calendar,
  Users,
  Wrench,
  Package,
  DollarSign
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

// Mock repair queue data
const mockRepairs = [
  {
    id: 'REP_001',
    customer: 'John Smith',
    device: 'iPhone 14 Pro',
    service: 'Screen Replacement',
    status: 'in_progress',
    priority: 'high',
    technician: 'Mike Johnson',
    estimatedCompletion: '2025-07-20T16:00:00',
    price: 149.99,
    createdAt: '2025-07-20T09:00:00',
    notes: 'Customer dropped device, screen completely shattered'
  },
  {
    id: 'REP_002', 
    customer: 'Sarah Wilson',
    device: 'MacBook Air M2',
    service: 'Battery Replacement',
    status: 'pending',
    priority: 'medium',
    technician: null,
    estimatedCompletion: '2025-07-21T14:00:00',
    price: 89.99,
    createdAt: '2025-07-20T10:30:00',
    notes: 'Battery health at 68%, customer experiencing rapid drain'
  },
  {
    id: 'REP_003',
    customer: 'David Brown',
    device: 'Samsung Galaxy S23',
    service: 'Water Damage Repair',
    status: 'awaiting_parts',
    priority: 'high',
    technician: 'Lisa Chen',
    estimatedCompletion: '2025-07-22T12:00:00',
    price: 199.99,
    createdAt: '2025-07-19T15:20:00',
    notes: 'Device dropped in water, multiple components affected'
  },
  {
    id: 'REP_004',
    customer: 'Emma Davis',
    device: 'iPad Pro 12.9"',
    service: 'Charging Port Repair',
    status: 'completed',
    priority: 'low',
    technician: 'Mike Johnson',
    estimatedCompletion: '2025-07-20T11:00:00',
    price: 79.99,
    createdAt: '2025-07-19T09:00:00',
    notes: 'Charging port cleaned and repaired successfully'
  },
  {
    id: 'REP_005',
    customer: 'Tom Anderson',
    device: 'Surface Laptop 5',
    service: 'Logic Board Repair',
    status: 'diagnostic',
    priority: 'medium',
    technician: 'Lisa Chen',
    estimatedCompletion: '2025-07-23T16:00:00',
    price: 299.99,
    createdAt: '2025-07-20T08:00:00',
    notes: 'Random shutdowns, suspected motherboard issue'
  }
];

const technicians = [
  { id: 'tech_001', name: 'Mike Johnson', specialties: ['iPhone', 'iPad'], activeRepairs: 3 },
  { id: 'tech_002', name: 'Lisa Chen', specialties: ['Android', 'PC'], activeRepairs: 2 },
  { id: 'tech_003', name: 'James Taylor', specialties: ['MacBook', 'Logic Board'], activeRepairs: 1 }
];

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
  awaiting_parts: 'bg-orange-100 text-orange-800 border-orange-200',
  diagnostic: 'bg-purple-100 text-purple-800 border-purple-200',
  completed: 'bg-green-100 text-green-800 border-green-200'
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700'
};

export default function RepairQueueManager() {
  const [repairs, setRepairs] = useState(mockRepairs);
  const [filteredRepairs, setFilteredRepairs] = useState(mockRepairs);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedTechnician, setSelectedTechnician] = useState('all');

  // Filter repairs based on search and filters
  useEffect(() => {
    let filtered = repairs;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(repair => 
        repair.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repair.device.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repair.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(repair => repair.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(repair => repair.priority === priorityFilter);
    }

    // Technician filter
    if (selectedTechnician !== 'all') {
      filtered = filtered.filter(repair => repair.technician === selectedTechnician);
    }

    setFilteredRepairs(filtered);
  }, [repairs, searchQuery, statusFilter, priorityFilter, selectedTechnician]);

  const assignTechnician = (repairId: string, technicianName: string) => {
    setRepairs(prev => prev.map(repair => 
      repair.id === repairId 
        ? { ...repair, technician: technicianName, status: repair.status === 'pending' ? 'in_progress' : repair.status }
        : repair
    ));
  };

  const updateStatus = (repairId: string, newStatus: string) => {
    setRepairs(prev => prev.map(repair => 
      repair.id === repairId ? { ...repair, status: newStatus } : repair
    ));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'in_progress': return <Wrench className="w-4 h-4" />;
      case 'awaiting_parts': return <Package className="w-4 h-4" />;
      case 'diagnostic': return <AlertCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  // Calculate queue statistics
  const queueStats = {
    total: repairs.length,
    pending: repairs.filter(r => r.status === 'pending').length,
    inProgress: repairs.filter(r => r.status === 'in_progress').length,
    awaitingParts: repairs.filter(r => r.status === 'awaiting_parts').length,
    completed: repairs.filter(r => r.status === 'completed').length,
    totalRevenue: repairs.reduce((sum, r) => sum + r.price, 0)
  };

  return (
    <div className="space-y-6">
      {/* Queue Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Repairs</p>
              <p className="text-2xl font-bold text-gray-900">{queueStats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Wrench className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">{queueStats.inProgress}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{queueStats.pending}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Revenue</p>
              <p className="text-2xl font-bold text-green-600">£{queueStats.totalRevenue.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search repairs, customers, or devices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="awaiting_parts">Awaiting Parts</option>
              <option value="diagnostic">Diagnostic</option>
              <option value="completed">Completed</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select
              value={selectedTechnician}
              onChange={(e) => setSelectedTechnician(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Technicians</option>
              {technicians.map(tech => (
                <option key={tech.id} value={tech.name}>{tech.name}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Technician Overview */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Technician Workload</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {technicians.map(tech => (
            <div key={tech.id} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-medium">{tech.name}</span>
                </div>
                <span className="text-sm text-gray-600">{tech.activeRepairs} active</span>
              </div>
              <div className="text-xs text-gray-500">
                Specialties: {tech.specialties.join(', ')}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Repair Queue */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Repair Queue</h3>
          <Button variant="outline" size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            Schedule View
          </Button>
        </div>

        <div className="space-y-4">
          {filteredRepairs.map(repair => (
            <div key={repair.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="font-medium text-gray-900">{repair.id}</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${statusColors[repair.status as keyof typeof statusColors]}`}>
                      {getStatusIcon(repair.status)}
                      <span className="ml-1 capitalize">{repair.status.replace('_', ' ')}</span>
                    </span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${priorityColors[repair.priority as keyof typeof priorityColors]}`}>
                      {repair.priority} priority
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Customer</p>
                      <p className="font-medium">{repair.customer}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Device</p>
                      <p className="font-medium">{repair.device}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Service</p>
                      <p className="font-medium">{repair.service}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Price</p>
                      <p className="font-medium">£{repair.price}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 text-sm">
                    <div>
                      <p className="text-gray-600">Technician</p>
                      <p className="font-medium">{repair.technician || 'Unassigned'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Est. Completion</p>
                      <p className="font-medium">
                        {new Date(repair.estimatedCompletion).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Created</p>
                      <p className="font-medium">
                        {new Date(repair.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {repair.notes && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">
                        <strong>Notes:</strong> {repair.notes}
                      </p>
                    </div>
                  )}
                </div>

                <div className="ml-4 flex flex-col space-y-2">
                  {!repair.technician && (
                    <select
                      onChange={(e) => e.target.value && assignTechnician(repair.id, e.target.value)}
                      className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      defaultValue=""
                    >
                      <option value="">Assign Tech</option>
                      {technicians.map(tech => (
                        <option key={tech.id} value={tech.name}>{tech.name}</option>
                      ))}
                    </select>
                  )}

                  {repair.status !== 'completed' && (
                    <select
                      value={repair.status}
                      onChange={(e) => updateStatus(repair.id, e.target.value)}
                      className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="awaiting_parts">Awaiting Parts</option>
                      <option value="diagnostic">Diagnostic</option>
                      <option value="completed">Completed</option>
                    </select>
                  )}

                  <Button variant="outline" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredRepairs.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No repairs found matching your filters.
          </div>
        )}
      </Card>
    </div>
  );
}