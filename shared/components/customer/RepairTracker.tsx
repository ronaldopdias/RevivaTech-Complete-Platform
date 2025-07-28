'use client';

import React, { useState } from 'react';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Package, 
  Search, 
  Filter,
  Calendar,
  MapPin,
  Phone,
  Download,
  MessageSquare
} from 'lucide-react';

interface RepairStep {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'upcoming';
  timestamp?: string;
  notes?: string;
}

interface RepairItem {
  id: string;
  device: string;
  model: string;
  issue: string;
  status: 'pending' | 'diagnosed' | 'in_repair' | 'completed' | 'ready_pickup';
  submittedDate: string;
  estimatedCompletion?: string;
  quote?: number;
  quoteApproved?: boolean;
  technician?: string;
  location?: string;
  steps: RepairStep[];
  images?: string[];
  invoiceUrl?: string;
}

const mockRepairs: RepairItem[] = [
  {
    id: 'REP-001',
    device: 'MacBook Pro',
    model: '16" M1 Pro (2021)',
    issue: 'Screen replacement - LCD cracked, no display',
    status: 'in_repair',
    submittedDate: '2024-01-15',
    estimatedCompletion: '2024-01-20',
    quote: 450,
    quoteApproved: true,
    technician: 'John Smith',
    location: 'Main Workshop',
    steps: [
      {
        id: 'step1',
        title: 'Device Received',
        description: 'Device received and initial inspection completed',
        status: 'completed',
        timestamp: '2024-01-15 10:30',
        notes: 'Physical damage to LCD panel confirmed. Device powers on but no display.'
      },
      {
        id: 'step2',
        title: 'Diagnosis Complete',
        description: 'Full diagnostic completed and quote prepared',
        status: 'completed',
        timestamp: '2024-01-15 14:20',
        notes: 'LCD replacement required. No other damage found.'
      },
      {
        id: 'step3',
        title: 'Quote Approved',
        description: 'Customer approved repair quote',
        status: 'completed',
        timestamp: '2024-01-16 09:15',
        notes: 'Customer approved £450 quote for LCD replacement'
      },
      {
        id: 'step4',
        title: 'Parts Ordered',
        description: 'Replacement parts ordered from supplier',
        status: 'completed',
        timestamp: '2024-01-16 11:30',
        notes: 'OEM LCD panel ordered, 2-day delivery expected'
      },
      {
        id: 'step5',
        title: 'Repair in Progress',
        description: 'Technician working on device repair',
        status: 'current',
        timestamp: '2024-01-18 09:00',
        notes: 'LCD replacement in progress. Expected completion today.'
      },
      {
        id: 'step6',
        title: 'Quality Check',
        description: 'Repair completed, quality assurance testing',
        status: 'upcoming'
      },
      {
        id: 'step7',
        title: 'Ready for Collection',
        description: 'Device ready for customer pickup',
        status: 'upcoming'
      }
    ]
  },
  {
    id: 'REP-002',
    device: 'iPhone',
    model: '14 Pro Max',
    issue: 'Battery replacement',
    status: 'ready_pickup',
    submittedDate: '2024-01-10',
    quote: 120,
    quoteApproved: true,
    technician: 'Sarah Johnson',
    location: 'Express Repair Bay',
    invoiceUrl: '/invoices/REP-002.pdf',
    steps: [
      {
        id: 'step1',
        title: 'Device Received',
        description: 'Device received and initial inspection completed',
        status: 'completed',
        timestamp: '2024-01-10 11:00'
      },
      {
        id: 'step2',
        title: 'Diagnosis Complete',
        description: 'Battery health test completed',
        status: 'completed',
        timestamp: '2024-01-10 11:30'
      },
      {
        id: 'step3',
        title: 'Quote Approved',
        description: 'Customer approved repair quote',
        status: 'completed',
        timestamp: '2024-01-10 14:00'
      },
      {
        id: 'step4',
        title: 'Repair Completed',
        description: 'Battery replacement completed successfully',
        status: 'completed',
        timestamp: '2024-01-11 10:15'
      },
      {
        id: 'step5',
        title: 'Quality Check Passed',
        description: 'Device tested and quality assured',
        status: 'completed',
        timestamp: '2024-01-11 11:00'
      },
      {
        id: 'step6',
        title: 'Ready for Collection',
        description: 'Device ready for customer pickup',
        status: 'completed',
        timestamp: '2024-01-11 11:30',
        notes: 'Customer notified via SMS and email'
      }
    ]
  }
];

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  diagnosed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  in_repair: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  ready_pickup: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
};

const statusLabels = {
  pending: 'Pending Review',
  diagnosed: 'Diagnosed',
  in_repair: 'In Repair',
  completed: 'Completed',
  ready_pickup: 'Ready for Pickup'
};

export const RepairTracker: React.FC = () => {
  const [selectedRepair, setSelectedRepair] = useState<RepairItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredRepairs = mockRepairs.filter(repair => {
    const matchesSearch = repair.device.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         repair.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         repair.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || repair.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStepIcon = (status: RepairStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'current':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'upcoming':
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Search */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Repair Tracking</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Track the progress of all your device repairs in real-time.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by device, model, or repair ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="diagnosed">Diagnosed</option>
            <option value="in_repair">In Repair</option>
            <option value="completed">Completed</option>
            <option value="ready_pickup">Ready for Pickup</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Repair List */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Your Repairs</h2>
          {filteredRepairs.map((repair) => (
            <div
              key={repair.id}
              onClick={() => setSelectedRepair(repair)}
              className={`bg-white dark:bg-gray-800 shadow rounded-lg p-6 cursor-pointer transition-all hover:shadow-md ${
                selectedRepair?.id === repair.id ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    {repair.device} - {repair.model}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {repair.issue}
                  </p>
                  <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>ID: {repair.id}</span>
                    <span>Submitted: {new Date(repair.submittedDate).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="ml-4 flex flex-col items-end space-y-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[repair.status]}`}>
                    {statusLabels[repair.status]}
                  </span>
                  {repair.quote && (
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      £{repair.quote}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Repair Details */}
        {selectedRepair ? (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Repair Details</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{selectedRepair.id}</p>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Device Information</h3>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Device:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedRepair.device} {selectedRepair.model}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Issue:</span>
                    <span className="text-sm text-gray-900 dark:text-white">{selectedRepair.issue}</span>
                  </div>
                  {selectedRepair.technician && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Technician:</span>
                      <span className="text-sm text-gray-900 dark:text-white">{selectedRepair.technician}</span>
                    </div>
                  )}
                  {selectedRepair.location && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Location:</span>
                      <span className="text-sm text-gray-900 dark:text-white">{selectedRepair.location}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Timeline */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Progress Timeline</h3>
                <div className="flow-root">
                  <ul className="-mb-8">
                    {selectedRepair.steps.map((step, stepIdx) => (
                      <li key={step.id}>
                        <div className="relative pb-8">
                          {stepIdx !== selectedRepair.steps.length - 1 ? (
                            <span
                              className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-600"
                              aria-hidden="true"
                            />
                          ) : null}
                          <div className="relative flex space-x-3">
                            <div className="flex h-8 w-8 items-center justify-center">
                              {getStepIcon(step.status)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {step.title}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {step.description}
                                </p>
                                {step.timestamp && (
                                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                    {new Date(step.timestamp).toLocaleString()}
                                  </p>
                                )}
                                {step.notes && (
                                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 italic">
                                    {step.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap gap-2">
                  <button className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800 rounded-md transition-colors">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Contact Support
                  </button>
                  {selectedRepair.status === 'ready_pickup' && (
                    <button className="flex items-center px-3 py-2 text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800 rounded-md transition-colors">
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule Pickup
                    </button>
                  )}
                  {selectedRepair.invoiceUrl && (
                    <button className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-md transition-colors">
                      <Download className="h-4 w-4 mr-2" />
                      Download Invoice
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="text-center">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                Select a repair to view details
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Click on any repair from the list to see its progress timeline and details.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RepairTracker;