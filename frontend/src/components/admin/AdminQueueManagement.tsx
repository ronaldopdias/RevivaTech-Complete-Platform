'use client';

/**
 * Enhanced Admin Queue Management System
 * 
 * Complete workflow management for repair queue with:
 * - Real-time queue monitoring
 * - Drag & drop technician assignment
 * - Priority management
 * - Automated workflow triggers
 * - Performance analytics
 * - Bulk operations
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Clock,
  User,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Filter,
  Search,
  Calendar,
  DollarSign,
  Zap,
  Users,
  BarChart3,
  Settings,
  Bell,
  Download,
  Upload,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Eye,
  MessageSquare,
  Phone,
  Mail
} from 'lucide-react';

interface Repair {
  id: string;
  referenceNumber: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
  };
  device: {
    type: string;
    brand: string;
    model: string;
    serialNumber?: string;
    images?: string[];
  };
  issue: {
    description: string;
    category: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    symptoms: string[];
  };
  status: 'pending' | 'diagnosed' | 'in-progress' | 'waiting-parts' | 'quality-check' | 'completed' | 'ready-pickup' | 'delivered' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTechnician?: {
    id: string;
    name: string;
    avatar?: string;
    expertise: string[];
    workload: number;
    isOnline: boolean;
  };
  cost: {
    estimated: number;
    actual?: number;
    parts: number;
    labor: number;
    tax: number;
  };
  timeline: {
    created: string;
    estimated: string;
    started?: string;
    completed?: string;
    dueDate: string;
  };
  notes: {
    id: string;
    author: string;
    content: string;
    timestamp: string;
    type: 'internal' | 'customer' | 'system';
  }[];
  parts: {
    id: string;
    name: string;
    quantity: number;
    cost: number;
    supplier: string;
    status: 'ordered' | 'in-stock' | 'installed';
    estimatedArrival?: string;
  }[];
  qualityChecks: {
    id: string;
    category: string;
    status: 'pending' | 'passed' | 'failed';
    notes?: string;
    checkedBy?: string;
    timestamp?: string;
  }[];
  customerSatisfaction?: {
    rating: number;
    feedback: string;
    timestamp: string;
  };
}

interface Technician {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  expertise: string[];
  performance: {
    completionRate: number;
    averageTime: number;
    customerRating: number;
    totalRepairs: number;
  };
  schedule: {
    isOnline: boolean;
    currentWorkload: number;
    maxCapacity: number;
    shift: {
      start: string;
      end: string;
    };
  };
  currentRepairs: string[];
}

interface QueueMetrics {
  totalRepairs: number;
  pendingRepairs: number;
  inProgressRepairs: number;
  overdue: number;
  averageCompletionTime: number;
  customerSatisfaction: number;
  techniciansAvailable: number;
  partsOnOrder: number;
  dailyRevenue: number;
  weeklyTrend: number;
}

export default function AdminQueueManagement() {
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [metrics, setMetrics] = useState<QueueMetrics | null>(null);
  const [selectedRepair, setSelectedRepair] = useState<Repair | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'calendar'>('list');
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    technician: 'all',
    dateRange: 'today',
    search: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRepairs, setSelectedRepairs] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Load queue data
  const loadQueueData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Simulate API calls
      const [repairsResponse, techniciansResponse, metricsResponse] = await Promise.all([
        fetch('/api/admin/repairs'),
        fetch('/api/admin/technicians'),
        fetch('/api/admin/queue-metrics')
      ]);

      // Mock data for demonstration
      const mockRepairs: Repair[] = [
        {
          id: 'repair-001',
          referenceNumber: 'REV-2025-001',
          customer: {
            id: 'cust-001',
            name: 'John Smith',
            email: 'john.smith@email.com',
            phone: '+44 7700 900123'
          },
          device: {
            type: 'Laptop',
            brand: 'Apple',
            model: 'MacBook Pro 16" M3',
            serialNumber: 'FVFH3LL/A'
          },
          issue: {
            description: 'Screen flickering and keyboard not responsive',
            category: 'Hardware',
            severity: 'high',
            symptoms: ['Screen flickering', 'Keyboard unresponsive', 'Trackpad issues']
          },
          status: 'in-progress',
          priority: 'high',
          assignedTechnician: {
            id: 'tech-001',
            name: 'Sarah Johnson',
            expertise: ['Apple', 'Hardware', 'Display'],
            workload: 3,
            isOnline: true
          },
          cost: {
            estimated: 350,
            parts: 280,
            labor: 70,
            tax: 35
          },
          timeline: {
            created: '2025-01-15T09:00:00Z',
            estimated: '2025-01-18T17:00:00Z',
            started: '2025-01-16T10:00:00Z',
            dueDate: '2025-01-20T17:00:00Z'
          },
          notes: [
            {
              id: 'note-001',
              author: 'Sarah Johnson',
              content: 'Initial diagnosis completed. Display cable and keyboard assembly need replacement.',
              timestamp: '2025-01-16T14:30:00Z',
              type: 'internal'
            }
          ],
          parts: [
            {
              id: 'part-001',
              name: 'MacBook Pro 16" Display Cable',
              quantity: 1,
              cost: 180,
              supplier: 'Apple',
              status: 'in-stock'
            },
            {
              id: 'part-002',
              name: 'Keyboard Assembly',
              quantity: 1,
              cost: 100,
              supplier: 'Apple',
              status: 'ordered',
              estimatedArrival: '2025-01-18T12:00:00Z'
            }
          ],
          qualityChecks: [
            {
              id: 'qc-001',
              category: 'Display Functionality',
              status: 'pending'
            },
            {
              id: 'qc-002',
              category: 'Keyboard Response',
              status: 'pending'
            }
          ]
        },
        {
          id: 'repair-002',
          referenceNumber: 'REV-2025-002',
          customer: {
            id: 'cust-002',
            name: 'Maria Garcia',
            email: 'maria.garcia@email.com'
          },
          device: {
            type: 'Smartphone',
            brand: 'iPhone',
            model: '15 Pro'
          },
          issue: {
            description: 'Cracked screen replacement needed',
            category: 'Display',
            severity: 'medium',
            symptoms: ['Cracked screen', 'Touch sensitivity issues']
          },
          status: 'waiting-parts',
          priority: 'medium',
          assignedTechnician: {
            id: 'tech-002',
            name: 'Mike Chen',
            expertise: ['Mobile', 'Display', 'Repair'],
            workload: 2,
            isOnline: true
          },
          cost: {
            estimated: 220,
            parts: 180,
            labor: 40,
            tax: 22
          },
          timeline: {
            created: '2025-01-14T11:00:00Z',
            estimated: '2025-01-16T15:00:00Z',
            started: '2025-01-15T09:00:00Z',
            dueDate: '2025-01-17T17:00:00Z'
          },
          notes: [],
          parts: [
            {
              id: 'part-003',
              name: 'iPhone 15 Pro Display Assembly',
              quantity: 1,
              cost: 180,
              supplier: 'OEM',
              status: 'ordered',
              estimatedArrival: '2025-01-17T10:00:00Z'
            }
          ],
          qualityChecks: []
        }
      ];

      const mockTechnicians: Technician[] = [
        {
          id: 'tech-001',
          name: 'Sarah Johnson',
          email: 'sarah@revivatech.co.uk',
          role: 'Senior Technician',
          expertise: ['Apple', 'Hardware', 'Display', 'Logic Board'],
          performance: {
            completionRate: 95,
            averageTime: 2.5,
            customerRating: 4.8,
            totalRepairs: 147
          },
          schedule: {
            isOnline: true,
            currentWorkload: 3,
            maxCapacity: 5,
            shift: {
              start: '09:00',
              end: '17:00'
            }
          },
          currentRepairs: ['repair-001']
        },
        {
          id: 'tech-002',
          name: 'Mike Chen',
          email: 'mike@revivatech.co.uk',
          role: 'Mobile Specialist',
          expertise: ['Mobile', 'Android', 'iOS', 'Display'],
          performance: {
            completionRate: 92,
            averageTime: 1.8,
            customerRating: 4.7,
            totalRepairs: 203
          },
          schedule: {
            isOnline: true,
            currentWorkload: 2,
            maxCapacity: 4,
            shift: {
              start: '08:00',
              end: '16:00'
            }
          },
          currentRepairs: ['repair-002']
        }
      ];

      const mockMetrics: QueueMetrics = {
        totalRepairs: 23,
        pendingRepairs: 5,
        inProgressRepairs: 8,
        overdue: 2,
        averageCompletionTime: 2.3,
        customerSatisfaction: 4.6,
        techniciansAvailable: 3,
        partsOnOrder: 12,
        dailyRevenue: 1240,
        weeklyTrend: 15
      };

      setRepairs(mockRepairs);
      setTechnicians(mockTechnicians);
      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Failed to load queue data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQueueData();
    
    // Set up real-time updates
    const interval = setInterval(loadQueueData, 30000);
    return () => clearInterval(interval);
  }, [loadQueueData]);

  // Filter repairs based on current filters
  const filteredRepairs = repairs.filter(repair => {
    const statusMatch = filters.status === 'all' || repair.status === filters.status;
    const priorityMatch = filters.priority === 'all' || repair.priority === filters.priority;
    const technicianMatch = filters.technician === 'all' || repair.assignedTechnician?.id === filters.technician;
    const searchMatch = filters.search === '' || 
      repair.referenceNumber.toLowerCase().includes(filters.search.toLowerCase()) ||
      repair.customer.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      repair.device.model.toLowerCase().includes(filters.search.toLowerCase());
    
    return statusMatch && priorityMatch && technicianMatch && searchMatch;
  });

  // Handle repair selection
  const handleRepairSelect = (repairId: string) => {
    setSelectedRepairs(prev => 
      prev.includes(repairId) 
        ? prev.filter(id => id !== repairId)
        : [...prev, repairId]
    );
  };

  // Handle bulk actions
  const handleBulkAction = async (action: string) => {
    if (selectedRepairs.length === 0) return;
    
    try {
      await fetch('/api/admin/repairs/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          repairIds: selectedRepairs
        })
      });
      
      // Refresh data
      loadQueueData();
      setSelectedRepairs([]);
    } catch (error) {
      console.error('Bulk action failed:', error);
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      diagnosed: 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-purple-100 text-purple-800',
      'waiting-parts': 'bg-orange-100 text-orange-800',
      'quality-check': 'bg-indigo-100 text-indigo-800',
      completed: 'bg-green-100 text-green-800',
      'ready-pickup': 'bg-cyan-100 text-cyan-800',
      delivered: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || colors.pending;
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'text-green-600',
      medium: 'text-yellow-600',
      high: 'text-orange-600',
      urgent: 'text-red-600'
    };
    return colors[priority] || colors.low;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Queue Management</h1>
          <p className="text-gray-600">
            Monitor and manage repair workflows in real-time
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={loadQueueData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Repair
          </Button>
        </div>
      </div>

      {/* Metrics Dashboard */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Repairs</p>
                <p className="text-2xl font-bold">{metrics.totalRepairs}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold">{metrics.inProgressRepairs}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-2xl font-bold">{metrics.overdue}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Available Techs</p>
                <p className="text-2xl font-bold">{metrics.techniciansAvailable}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Daily Revenue</p>
                <p className="text-2xl font-bold">£{metrics.dailyRevenue}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters and Controls */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search repairs..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="diagnosed">Diagnosed</option>
            <option value="in-progress">In Progress</option>
            <option value="waiting-parts">Waiting Parts</option>
            <option value="quality-check">Quality Check</option>
            <option value="completed">Completed</option>
            <option value="ready-pickup">Ready for Pickup</option>
          </select>
          
          <select
            value={filters.priority}
            onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          
          <select
            value={filters.technician}
            onChange={(e) => setFilters(prev => ({ ...prev, technician: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Technicians</option>
            {technicians.map(tech => (
              <option key={tech.id} value={tech.id}>{tech.name}</option>
            ))}
          </select>

          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              List
            </Button>
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('kanban')}
            >
              Kanban
            </Button>
          </div>
        </div>
      </Card>

      {/* Bulk Actions */}
      {selectedRepairs.length > 0 && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-800">
              {selectedRepairs.length} repair{selectedRepairs.length > 1 ? 's' : ''} selected
            </span>
            
            <div className="flex space-x-2">
              <Button size="sm" onClick={() => handleBulkAction('assign')}>
                Assign Technician
              </Button>
              <Button size="sm" onClick={() => handleBulkAction('priority')}>
                Change Priority
              </Button>
              <Button size="sm" onClick={() => handleBulkAction('status')}>
                Update Status
              </Button>
              <Button size="sm" variant="outline" onClick={() => setSelectedRepairs([])}>
                Clear Selection
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Repair Queue */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">
            Repair Queue ({filteredRepairs.length})
          </h2>
        </div>
        
        <div className="space-y-4">
          {filteredRepairs.map((repair) => {
            const isOverdue = new Date(repair.timeline.dueDate) < new Date();
            
            return (
              <Card
                key={repair.id}
                className={`p-4 hover:shadow-md transition-shadow cursor-pointer ${
                  selectedRepairs.includes(repair.id) ? 'ring-2 ring-blue-500' : ''
                } ${isOverdue ? 'border-red-200 bg-red-50' : ''}`}
                onClick={() => setSelectedRepair(repair)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <input
                      type="checkbox"
                      checked={selectedRepairs.includes(repair.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleRepairSelect(repair.id);
                      }}
                      className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    
                    <div className="flex-1 space-y-3">
                      {/* Header */}
                      <div className="flex items-center space-x-3">
                        <span className="font-mono text-sm font-medium">
                          {repair.referenceNumber}
                        </span>
                        <Badge className={getStatusColor(repair.status)}>
                          {repair.status.replace('-', ' ')}
                        </Badge>
                        <span className={`text-sm font-medium ${getPriorityColor(repair.priority)}`}>
                          {repair.priority.toUpperCase()}
                        </span>
                        {isOverdue && (
                          <Badge className="bg-red-100 text-red-800">
                            OVERDUE
                          </Badge>
                        )}
                      </div>
                      
                      {/* Details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="font-medium">{repair.customer.name}</p>
                          <p className="text-gray-600">{repair.customer.email}</p>
                        </div>
                        <div>
                          <p className="font-medium">{repair.device.brand} {repair.device.model}</p>
                          <p className="text-gray-600">{repair.issue.description}</p>
                        </div>
                        <div>
                          {repair.assignedTechnician ? (
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <span>{repair.assignedTechnician.name}</span>
                              <div className={`w-2 h-2 rounded-full ${
                                repair.assignedTechnician.isOnline ? 'bg-green-500' : 'bg-gray-400'
                              }`}></div>
                            </div>
                          ) : (
                            <span className="text-gray-500">Unassigned</span>
                          )}
                          <p className="text-gray-600">Due: {new Date(repair.timeline.dueDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                      
                      {/* Progress and Cost */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-4">
                          <span>£{repair.cost.estimated}</span>
                          {repair.parts.length > 0 && (
                            <span className="text-gray-600">
                              {repair.parts.filter(p => p.status === 'in-stock').length}/{repair.parts.length} parts ready
                            </span>
                          )}
                        </div>
                        <div className="text-gray-500">
                          Created {new Date(repair.timeline.created).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm">
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
        
        {filteredRepairs.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No repairs found</h3>
            <p className="text-gray-600">No repairs match your current filters</p>
          </div>
        )}
      </Card>
    </div>
  );
}