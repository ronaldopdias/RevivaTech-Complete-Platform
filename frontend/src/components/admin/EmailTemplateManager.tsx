'use client';

import React, { useState, useEffect } from 'react';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  category: string;
  template_type: string;
  is_active: boolean;
  usage_count: number;
  last_used_at: string;
  created_at: string;
  performance: {
    open_rate: number;
    click_rate: number;
    conversion_rate: number;
  };
}

interface EmailTemplateManagerProps {
  className?: string;
}

const EmailTemplateManager: React.FC<EmailTemplateManagerProps> = ({ className = '' }) => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Mock data for demonstration
  useEffect(() => {
    const mockTemplates: EmailTemplate[] = [
      {
        id: 'welcome_series_1',
        name: 'Welcome Email - New Customer',
        subject: 'Welcome to RevivaTech, {{user.first_name}}!',
        category: 'onboarding',
        template_type: 'transactional',
        is_active: true,
        usage_count: 245,
        last_used_at: '2025-07-16T10:30:00Z',
        created_at: '2025-07-01T09:00:00Z',
        performance: {
          open_rate: 0.65,
          click_rate: 0.12,
          conversion_rate: 0.08
        }
      },
      {
        id: 'repair_complete',
        name: 'Repair Completion Notification',
        subject: 'Your {{repair.device}} repair is complete!',
        category: 'repair',
        template_type: 'transactional',
        is_active: true,
        usage_count: 189,
        last_used_at: '2025-07-17T14:20:00Z',
        created_at: '2025-06-15T11:00:00Z',
        performance: {
          open_rate: 0.78,
          click_rate: 0.34,
          conversion_rate: 0.15
        }
      },
      {
        id: 'booking_reminder',
        name: 'Appointment Reminder',
        subject: 'Reminder: Your appointment tomorrow at {{booking.time_slot}}',
        category: 'booking',
        template_type: 'transactional',
        is_active: true,
        usage_count: 156,
        last_used_at: '2025-07-17T08:45:00Z',
        created_at: '2025-06-20T15:30:00Z',
        performance: {
          open_rate: 0.82,
          click_rate: 0.28,
          conversion_rate: 0.92
        }
      },
      {
        id: 'reactivation_campaign',
        name: 'Customer Reactivation Special Offer',
        subject: 'We miss you! 20% off your next repair',
        category: 'marketing',
        template_type: 'marketing',
        is_active: false,
        usage_count: 67,
        last_used_at: '2025-07-10T16:00:00Z',
        created_at: '2025-06-01T12:00:00Z',
        performance: {
          open_rate: 0.35,
          click_rate: 0.08,
          conversion_rate: 0.03
        }
      }
    ];

    setTimeout(() => {
      setTemplates(mockTemplates);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', 'onboarding', 'repair', 'booking', 'marketing', 'support'];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getPerformanceColor = (value: number, metric: string) => {
    const thresholds = {
      open_rate: { good: 0.5, ok: 0.3 },
      click_rate: { good: 0.15, ok: 0.08 },
      conversion_rate: { good: 0.05, ok: 0.02 }
    };

    const threshold = thresholds[metric as keyof typeof thresholds];
    if (value >= threshold.good) return 'text-green-600';
    if (value >= threshold.ok) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-8 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-8 ${className}`}>
        <div className="text-center text-red-600">
          <h3 className="text-lg font-semibold mb-2">Error Loading Templates</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Email Templates</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Template
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Templates List */}
      <div className="p-6">
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <h3 className="text-lg font-medium mb-2">No templates found</h3>
            <p>Try adjusting your search or create a new template.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedTemplate(template)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{template.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        template.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {template.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        {template.category}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{template.subject}</p>
                    
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <span>Used {template.usage_count} times</span>
                      <span>Last used {formatDate(template.last_used_at)}</span>
                      <span>Created {formatDate(template.created_at)}</span>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="flex gap-6 text-sm">
                    <div className="text-center">
                      <div className={`font-semibold ${getPerformanceColor(template.performance.open_rate, 'open_rate')}`}>
                        {formatPercentage(template.performance.open_rate)}
                      </div>
                      <div className="text-xs text-gray-500">Open Rate</div>
                    </div>
                    <div className="text-center">
                      <div className={`font-semibold ${getPerformanceColor(template.performance.click_rate, 'click_rate')}`}>
                        {formatPercentage(template.performance.click_rate)}
                      </div>
                      <div className="text-xs text-gray-500">Click Rate</div>
                    </div>
                    <div className="text-center">
                      <div className={`font-semibold ${getPerformanceColor(template.performance.conversion_rate, 'conversion_rate')}`}>
                        {formatPercentage(template.performance.conversion_rate)}
                      </div>
                      <div className="text-xs text-gray-500">Conv. Rate</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Template Detail Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">{selectedTemplate.name}</h3>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Template Information</h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium">Subject:</span>
                      <p className="text-gray-600 mt-1">{selectedTemplate.subject}</p>
                    </div>
                    <div>
                      <span className="font-medium">Category:</span>
                      <span className="ml-2 text-gray-600">{selectedTemplate.category}</span>
                    </div>
                    <div>
                      <span className="font-medium">Type:</span>
                      <span className="ml-2 text-gray-600">{selectedTemplate.template_type}</span>
                    </div>
                    <div>
                      <span className="font-medium">Status:</span>
                      <span className={`ml-2 ${selectedTemplate.is_active ? 'text-green-600' : 'text-gray-600'}`}>
                        {selectedTemplate.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Performance Metrics</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Open Rate:</span>
                      <span className={`font-semibold ${getPerformanceColor(selectedTemplate.performance.open_rate, 'open_rate')}`}>
                        {formatPercentage(selectedTemplate.performance.open_rate)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Click Rate:</span>
                      <span className={`font-semibold ${getPerformanceColor(selectedTemplate.performance.click_rate, 'click_rate')}`}>
                        {formatPercentage(selectedTemplate.performance.click_rate)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Conversion Rate:</span>
                      <span className={`font-semibold ${getPerformanceColor(selectedTemplate.performance.conversion_rate, 'conversion_rate')}`}>
                        {formatPercentage(selectedTemplate.performance.conversion_rate)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Usage:</span>
                      <span className="font-semibold">{selectedTemplate.usage_count}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Edit Template
                </button>
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  Preview
                </button>
                <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">
                  Test Send
                </button>
                <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                  Clone
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Create New Template</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter template name..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter subject line..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="onboarding">Onboarding</option>
                      <option value="repair">Repair</option>
                      <option value="booking">Booking</option>
                      <option value="marketing">Marketing</option>
                      <option value="support">Support</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="transactional">Transactional</option>
                      <option value="marketing">Marketing</option>
                      <option value="system">System</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    HTML Template
                  </label>
                  <textarea
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter HTML template content..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Create Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailTemplateManager;