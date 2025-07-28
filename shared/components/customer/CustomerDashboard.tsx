'use client';

import React from 'react';
import { Package, Clock, CheckCircle, AlertCircle, Plus, Calendar } from 'lucide-react';

interface RepairItem {
  id: string;
  device: string;
  model: string;
  issue: string;
  status: 'pending' | 'diagnosed' | 'in_repair' | 'completed' | 'ready_pickup';
  submittedDate: string;
  estimatedCompletion?: string;
  quote?: number;
}

interface QuoteItem {
  id: string;
  device: string;
  model: string;
  issue: string;
  amount: number;
  status: 'pending' | 'approved' | 'declined';
  expiresDate: string;
}

const mockRepairs: RepairItem[] = [
  {
    id: 'REP-001',
    device: 'MacBook Pro',
    model: '16" M1 Pro (2021)',
    issue: 'Screen replacement',
    status: 'in_repair',
    submittedDate: '2024-01-15',
    estimatedCompletion: '2024-01-20',
    quote: 450
  },
  {
    id: 'REP-002',
    device: 'iPhone',
    model: '14 Pro Max',
    issue: 'Battery replacement',
    status: 'ready_pickup',
    submittedDate: '2024-01-10',
    quote: 120
  }
];

const mockQuotes: QuoteItem[] = [
  {
    id: 'QUO-001',
    device: 'iPad',
    model: 'Air 5th Gen',
    issue: 'Water damage repair',
    amount: 280,
    status: 'pending',
    expiresDate: '2024-01-25'
  }
];

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  diagnosed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  in_repair: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  ready_pickup: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  declined: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
};

const statusLabels = {
  pending: 'Pending Review',
  diagnosed: 'Diagnosed',
  in_repair: 'In Repair',
  completed: 'Completed',
  ready_pickup: 'Ready for Pickup',
  approved: 'Approved',
  declined: 'Declined'
};

export const CustomerDashboard: React.FC = () => {
  const activeRepairs = mockRepairs.filter(r => !['completed', 'ready_pickup'].includes(r.status));
  const completedRepairs = mockRepairs.filter(r => ['completed', 'ready_pickup'].includes(r.status));
  const pendingQuotes = mockQuotes.filter(q => q.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Welcome back! Here's what's happening with your devices.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Active Repairs
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {activeRepairs.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Completed
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {completedRepairs.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Pending Quotes
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {pendingQuotes.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total Repairs
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {mockRepairs.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Quick Actions</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button className="flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
              <Plus className="h-5 w-5 mr-2" />
              Book New Repair
            </button>
            <button className="flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
              <Calendar className="h-5 w-5 mr-2" />
              Schedule Pickup
            </button>
            <button className="flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
              <Package className="h-5 w-5 mr-2" />
              Track Repair
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Repairs */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Active Repairs</h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {activeRepairs.length > 0 ? (
              activeRepairs.map((repair) => (
                <div key={repair.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {repair.device} - {repair.model}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {repair.issue}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        ID: {repair.id}
                      </p>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[repair.status]}`}>
                        {statusLabels[repair.status]}
                      </span>
                    </div>
                  </div>
                  {repair.estimatedCompletion && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Est. completion: {new Date(repair.estimatedCompletion).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-6 text-center">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No active repairs</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Get started by booking a new repair.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Pending Quotes */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Pending Quotes</h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {pendingQuotes.length > 0 ? (
              pendingQuotes.map((quote) => (
                <div key={quote.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {quote.device} - {quote.model}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {quote.issue}
                      </p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                        £{quote.amount}
                      </p>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[quote.status]}`}>
                        {statusLabels[quote.status]}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex space-x-2">
                    <button className="flex-1 bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-700 transition-colors">
                      Approve
                    </button>
                    <button className="flex-1 bg-gray-300 text-gray-700 px-3 py-1 rounded text-xs font-medium hover:bg-gray-400 transition-colors">
                      Decline
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    Expires: {new Date(quote.expiresDate).toLocaleDateString()}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-6 text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No pending quotes</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  All quotes have been reviewed.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;