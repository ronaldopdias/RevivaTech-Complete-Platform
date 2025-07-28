'use client';

import React, { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Download,
  MessageSquare,
  Calculator,
  Info,
  Calendar
} from 'lucide-react';

interface QuoteItem {
  id: string;
  repairId: string;
  device: string;
  model: string;
  issue: string;
  diagnosis: string;
  laborCost: number;
  partsCost: number;
  totalCost: number;
  estimatedDuration: string;
  warrantyPeriod: string;
  status: 'pending' | 'approved' | 'declined' | 'expired';
  createdDate: string;
  expiresDate: string;
  technician: string;
  notes?: string;
  partsBreakdown: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

const mockQuotes: QuoteItem[] = [
  {
    id: 'QUO-001',
    repairId: 'REP-003',
    device: 'iPad',
    model: 'Air 5th Gen',
    issue: 'Water damage - device not turning on',
    diagnosis: 'Liquid damage to motherboard components. Requires cleaning, component replacement, and testing.',
    laborCost: 120,
    partsCost: 160,
    totalCost: 280,
    estimatedDuration: '3-5 business days',
    warrantyPeriod: '90 days',
    status: 'pending',
    createdDate: '2024-01-18',
    expiresDate: '2024-01-25',
    technician: 'Michael Chen',
    notes: 'Device has been submerged in water. Logic board cleaning required with potential component replacement.',
    partsBreakdown: [
      { name: 'Logic Board Cleaning Kit', quantity: 1, unitPrice: 45, total: 45 },
      { name: 'Power Management IC', quantity: 1, unitPrice: 85, total: 85 },
      { name: 'Charging Port Assembly', quantity: 1, unitPrice: 30, total: 30 }
    ]
  },
  {
    id: 'QUO-002',
    repairId: 'REP-004',
    device: 'Samsung Galaxy',
    model: 'S23 Ultra',
    issue: 'Cracked back glass and camera lens',
    diagnosis: 'Rear glass panel and camera lens replacement required. Frame inspection shows no damage.',
    laborCost: 80,
    partsCost: 140,
    totalCost: 220,
    estimatedDuration: '2-3 business days',
    warrantyPeriod: '60 days',
    status: 'pending',
    createdDate: '2024-01-19',
    expiresDate: '2024-01-26',
    technician: 'Sarah Johnson',
    partsBreakdown: [
      { name: 'Rear Glass Panel - Phantom Black', quantity: 1, unitPrice: 95, total: 95 },
      { name: 'Camera Lens Cover', quantity: 1, unitPrice: 35, total: 35 },
      { name: 'Adhesive Kit', quantity: 1, unitPrice: 10, total: 10 }
    ]
  },
  {
    id: 'QUO-003',
    repairId: 'REP-005',
    device: 'MacBook Air',
    model: 'M2 13" (2022)',
    issue: 'Keyboard not responding, trackpad issues',
    diagnosis: 'Top case replacement required. Keyboard and trackpad assembly needs replacement.',
    laborCost: 150,
    partsCost: 320,
    totalCost: 470,
    estimatedDuration: '4-6 business days',
    warrantyPeriod: '90 days',
    status: 'expired',
    createdDate: '2024-01-10',
    expiresDate: '2024-01-17',
    technician: 'David Wilson',
    partsBreakdown: [
      { name: 'Top Case Assembly with Keyboard', quantity: 1, unitPrice: 280, total: 280 },
      { name: 'Trackpad Assembly', quantity: 1, unitPrice: 40, total: 40 }
    ]
  }
];

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  declined: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  expired: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
};

const statusLabels = {
  pending: 'Pending Review',
  approved: 'Approved',
  declined: 'Declined',
  expired: 'Expired'
};

export const QuoteApproval: React.FC = () => {
  const [selectedQuote, setSelectedQuote] = useState<QuoteItem | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<{
    show: boolean;
    action: 'approve' | 'decline' | null;
    quote: QuoteItem | null;
  }>({ show: false, action: null, quote: null });

  const pendingQuotes = mockQuotes.filter(q => q.status === 'pending');
  const otherQuotes = mockQuotes.filter(q => q.status !== 'pending');

  const handleQuoteAction = (quote: QuoteItem, action: 'approve' | 'decline') => {
    setShowConfirmModal({ show: true, action, quote });
  };

  const confirmQuoteAction = () => {
    if (showConfirmModal.quote && showConfirmModal.action) {
      console.log(`${showConfirmModal.action} quote ${showConfirmModal.quote.id}`);
      setShowConfirmModal({ show: false, action: null, quote: null });
    }
  };

  const getDaysUntilExpiry = (expiresDate: string) => {
    const today = new Date();
    const expiry = new Date(expiresDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quote Approval</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Review and approve repair quotes for your devices.
        </p>
      </div>

      {/* Pending Quotes Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Pending Quotes ({pendingQuotes.length})
          </h2>
          {pendingQuotes.length > 0 && (
            <div className="flex items-center text-sm text-yellow-600 dark:text-yellow-400">
              <AlertTriangle className="h-4 w-4 mr-1" />
              Action required
            </div>
          )}
        </div>

        {pendingQuotes.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {pendingQuotes.map((quote) => {
              const daysLeft = getDaysUntilExpiry(quote.expiresDate);
              return (
                <div
                  key={quote.id}
                  className="bg-white dark:bg-gray-800 shadow rounded-lg border-l-4 border-yellow-400"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {quote.device} - {quote.model}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{quote.issue}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          Quote ID: {quote.id} | Repair ID: {quote.repairId}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          £{quote.totalCost}
                        </div>
                        <div className={`text-sm ${daysLeft <= 2 ? 'text-red-600' : 'text-gray-500'}`}>
                          {daysLeft > 0 ? `${daysLeft} days left` : 'Expired'}
                        </div>
                      </div>
                    </div>

                    {/* Cost Breakdown */}
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                      <div className="flex items-center mb-2">
                        <Calculator className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Cost Breakdown
                        </span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Parts:</span>
                          <span className="text-gray-900 dark:text-white">£{quote.partsCost}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Labor:</span>
                          <span className="text-gray-900 dark:text-white">£{quote.laborCost}</span>
                        </div>
                        <div className="border-t border-gray-200 dark:border-gray-600 pt-1 mt-2">
                          <div className="flex justify-between font-medium">
                            <span className="text-gray-900 dark:text-white">Total:</span>
                            <span className="text-gray-900 dark:text-white">£{quote.totalCost}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Key Details */}
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Duration:</span>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {quote.estimatedDuration}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Warranty:</span>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {quote.warrantyPeriod}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleQuoteAction(quote, 'approve')}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve Quote
                      </button>
                      <button
                        onClick={() => handleQuoteAction(quote, 'decline')}
                        className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors flex items-center justify-center"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Decline
                      </button>
                    </div>

                    <button
                      onClick={() => setSelectedQuote(quote)}
                      className="w-full mt-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center"
                    >
                      <Info className="h-4 w-4 mr-2" />
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                No pending quotes
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                All quotes have been reviewed.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Quote History */}
      {otherQuotes.length > 0 && (
        <div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Quote History
          </h2>
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {otherQuotes.map((quote) => (
                <div key={quote.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        {quote.device} - {quote.model}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{quote.issue}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {quote.id} • Created: {new Date(quote.createdDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="ml-4 flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                          £{quote.totalCost}
                        </div>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[quote.status]}`}>
                        {statusLabels[quote.status]}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quote Details Modal */}
      {selectedQuote && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setSelectedQuote(null)} />
            
            <div className="relative bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-2xl sm:w-full sm:p-6">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Quote Details - {selectedQuote.id}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedQuote.device} - {selectedQuote.model}
                </p>
              </div>

              <div className="space-y-6">
                {/* Diagnosis */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Diagnosis</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    {selectedQuote.diagnosis}
                  </p>
                </div>

                {/* Parts Breakdown */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Parts Required</h4>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <div className="space-y-2">
                      {selectedQuote.partsBreakdown.map((part, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            {part.name} (×{part.quantity})
                          </span>
                          <span className="text-gray-900 dark:text-white font-medium">
                            £{part.total}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Technician</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{selectedQuote.technician}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Expires</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(selectedQuote.expiresDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {selectedQuote.notes && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Additional Notes</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      {selectedQuote.notes}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => setSelectedQuote(null)}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400 transition-colors"
                >
                  Close
                </button>
                <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Contact Technician
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal.show && showConfirmModal.quote && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            
            <div className="relative bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${
                  showConfirmModal.action === 'approve' ? 'bg-green-100' : 'bg-red-100'
                } sm:mx-0 sm:h-10 sm:w-10`}>
                  {showConfirmModal.action === 'approve' ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-600" />
                  )}
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                    {showConfirmModal.action === 'approve' ? 'Approve Quote' : 'Decline Quote'}
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Are you sure you want to {showConfirmModal.action} the quote for {showConfirmModal.quote.device} - {showConfirmModal.quote.model}?
                    </p>
                    {showConfirmModal.action === 'approve' && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                        <strong>Total cost: £{showConfirmModal.quote.totalCost}</strong>
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  onClick={confirmQuoteAction}
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white sm:ml-3 sm:w-auto sm:text-sm ${
                    showConfirmModal.action === 'approve'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {showConfirmModal.action === 'approve' ? 'Approve' : 'Decline'}
                </button>
                <button
                  onClick={() => setShowConfirmModal({ show: false, action: null, quote: null })}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuoteApproval;