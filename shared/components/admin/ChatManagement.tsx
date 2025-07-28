'use client';

import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Users, 
  Clock, 
  Star,
  Filter,
  Search,
  MoreVertical,
  Phone,
  Video,
  Archive,
  Tag,
  AlertCircle,
  CheckCircle,
  UserCheck,
  MessageCircle,
  TrendingUp,
  Calendar
} from 'lucide-react';

interface ChatConversation {
  id: string;
  contactId: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  avatar?: string;
  status: 'open' | 'resolved' | 'pending';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedAgent?: {
    id: string;
    name: string;
    avatar?: string;
  };
  lastMessage: {
    content: string;
    timestamp: string;
    sender: 'customer' | 'agent';
  };
  unreadCount: number;
  labels: string[];
  createdAt: string;
  resolvedAt?: string;
  source: 'website' | 'email' | 'phone' | 'mobile_app';
  customerContext?: {
    repairId?: string;
    deviceType?: string;
    repairStatus?: string;
    customerType: 'new' | 'returning';
    totalRepairs: number;
  };
}

interface ChatStats {
  totalConversations: number;
  openConversations: number;
  averageResponseTime: number;
  resolutionRate: number;
  customerSatisfaction: number;
  activeAgents: number;
}

const mockConversations: ChatConversation[] = [
  {
    id: 'conv-001',
    contactId: 'contact-001',
    contactName: 'John Smith',
    contactEmail: 'john.smith@email.com',
    contactPhone: '+44 7700 900123',
    status: 'open',
    priority: 'high',
    assignedAgent: {
      id: 'agent-001',
      name: 'Sarah Johnson',
      avatar: '/api/placeholder/32/32'
    },
    lastMessage: {
      content: 'Hi, I need to check the status of my MacBook repair. The reference is REP-001.',
      timestamp: '2024-01-20T10:30:00Z',
      sender: 'customer'
    },
    unreadCount: 2,
    labels: ['repair-inquiry', 'urgent'],
    createdAt: '2024-01-20T09:15:00Z',
    source: 'website',
    customerContext: {
      repairId: 'REP-001',
      deviceType: 'MacBook Pro',
      repairStatus: 'in_progress',
      customerType: 'returning',
      totalRepairs: 3
    }
  },
  {
    id: 'conv-002',
    contactId: 'contact-002',
    contactName: 'Emma Wilson',
    contactEmail: 'emma.wilson@email.com',
    status: 'pending',
    priority: 'medium',
    lastMessage: {
      content: 'Can you give me a quote for iPhone screen replacement?',
      timestamp: '2024-01-20T09:45:00Z',
      sender: 'customer'
    },
    unreadCount: 1,
    labels: ['quote-request'],
    createdAt: '2024-01-20T09:45:00Z',
    source: 'website',
    customerContext: {
      deviceType: 'iPhone 14 Pro',
      customerType: 'new',
      totalRepairs: 0
    }
  }
];

const mockStats: ChatStats = {
  totalConversations: 47,
  openConversations: 12,
  averageResponseTime: 4.2,
  resolutionRate: 89,
  customerSatisfaction: 4.7,
  activeAgents: 3
};

export const ChatManagement: React.FC = () => {
  const [conversations, setConversations] = useState<ChatConversation[]>(mockConversations);
  const [stats, setStats] = useState<ChatStats>(mockStats);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // Filter conversations
  const filteredConversations = conversations.filter(conv => {
    const matchesStatus = statusFilter === 'all' || conv.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || conv.priority === priorityFilter;
    const matchesSearch = searchTerm === '' || 
      conv.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.contactEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.lastMessage.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesPriority && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'resolved':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const handleAssignAgent = (conversationId: string, agentId: string) => {
    setConversations(prev => prev.map(conv => 
      conv.id === conversationId 
        ? { ...conv, assignedAgent: { id: agentId, name: 'Agent Name' } }
        : conv
    ));
  };

  const handleStatusChange = (conversationId: string, newStatus: ChatConversation['status']) => {
    setConversations(prev => prev.map(conv => 
      conv.id === conversationId 
        ? { 
            ...conv, 
            status: newStatus,
            resolvedAt: newStatus === 'resolved' ? new Date().toISOString() : undefined
          }
        : conv
    ));
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return time.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chat Management</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Manage customer conversations and support tickets.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total Conversations
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {stats.totalConversations}
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
                <AlertCircle className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Open
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {stats.openConversations}
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
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Avg Response
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {stats.averageResponseTime}m
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
                <CheckCircle className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Resolution Rate
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {stats.resolutionRate}%
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
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Satisfaction
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {stats.customerSatisfaction}/5
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
                <Users className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Active Agents
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {stats.activeAgents}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Priority</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <button className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            <Filter className="h-4 w-4 mr-2" />
            Apply Filters
          </button>
        </div>
      </div>

      {/* Conversations List */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Conversations ({filteredConversations.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading conversations...</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                  selectedConversation?.id === conversation.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
                onClick={() => setSelectedConversation(conversation)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {conversation.avatar ? (
                        <img
                          src={conversation.avatar}
                          alt={conversation.contactName}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {conversation.contactName.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Conversation Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                            {conversation.contactName}
                          </h3>
                          {conversation.customerContext?.repairId && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                              {conversation.customerContext.repairId}
                            </span>
                          )}
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(conversation.status)}`}>
                            {conversation.status}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(conversation.priority)}`}>
                            {conversation.priority}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {conversation.unreadCount > 0 && (
                            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-red-500 rounded-full">
                              {conversation.unreadCount}
                            </span>
                          )}
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTimeAgo(conversation.lastMessage.timestamp)}
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {conversation.contactEmail}
                      </p>

                      <p className="text-sm text-gray-900 dark:text-white mt-2 truncate">
                        {conversation.lastMessage.content}
                      </p>

                      {/* Labels */}
                      {conversation.labels.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {conversation.labels.map((label) => (
                            <span
                              key={label}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                            >
                              <Tag className="h-3 w-3 mr-1" />
                              {label}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Customer Context */}
                      {conversation.customerContext && (
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                          {conversation.customerContext.deviceType && (
                            <span>📱 {conversation.customerContext.deviceType}</span>
                          )}
                          <span>
                            {conversation.customerContext.customerType === 'returning' ? '🔁' : '🆕'} 
                            {conversation.customerContext.customerType} customer
                          </span>
                          <span>🔧 {conversation.customerContext.totalRepairs} repairs</span>
                        </div>
                      )}

                      {/* Assigned Agent */}
                      {conversation.assignedAgent && (
                        <div className="flex items-center mt-2">
                          <UserCheck className="h-4 w-4 text-green-500 mr-1" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            Assigned to {conversation.assignedAgent.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`tel:${conversation.contactPhone}`, '_self');
                      }}
                      className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400"
                      title="Call customer"
                    >
                      <Phone className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Open Chatwoot conversation
                        window.open(`/admin/chat/${conversation.id}`, '_blank');
                      }}
                      className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                      title="Open in Chatwoot"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </button>

                    <div className="relative">
                      <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Conversation Details */}
      {selectedConversation && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Conversation Details
            </h3>
            <div className="flex space-x-2">
              <select
                value={selectedConversation.status}
                onChange={(e) => handleStatusChange(selectedConversation.id, e.target.value as ChatConversation['status'])}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="open">Open</option>
                <option value="pending">Pending</option>
                <option value="resolved">Resolved</option>
              </select>
              
              <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                Assign Agent
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Customer Information</h4>
              <div className="space-y-2 text-sm">
                <p><strong>Name:</strong> {selectedConversation.contactName}</p>
                <p><strong>Email:</strong> {selectedConversation.contactEmail}</p>
                {selectedConversation.contactPhone && (
                  <p><strong>Phone:</strong> {selectedConversation.contactPhone}</p>
                )}
                <p><strong>Source:</strong> {selectedConversation.source}</p>
                <p><strong>Created:</strong> {new Date(selectedConversation.createdAt).toLocaleString()}</p>
              </div>
            </div>

            {selectedConversation.customerContext && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Repair Context</h4>
                <div className="space-y-2 text-sm">
                  {selectedConversation.customerContext.repairId && (
                    <p><strong>Repair ID:</strong> {selectedConversation.customerContext.repairId}</p>
                  )}
                  {selectedConversation.customerContext.deviceType && (
                    <p><strong>Device:</strong> {selectedConversation.customerContext.deviceType}</p>
                  )}
                  {selectedConversation.customerContext.repairStatus && (
                    <p><strong>Status:</strong> {selectedConversation.customerContext.repairStatus}</p>
                  )}
                  <p><strong>Customer Type:</strong> {selectedConversation.customerContext.customerType}</p>
                  <p><strong>Total Repairs:</strong> {selectedConversation.customerContext.totalRepairs}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatManagement;