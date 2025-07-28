'use client';

import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Plus, 
  Edit2, 
  Trash2, 
  Send, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Star,
  Settings,
  Eye,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface EmailAccount {
  id: string;
  name: string;
  email: string;
  purpose: string;
  provider: string;
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_user: string;
  from_name: string;
  reply_to_email?: string;
  is_active: boolean;
  is_primary: boolean;
  priority: number;
  daily_limit: number;
  hourly_limit: number;
  created_at: string;
  updated_at: string;
  last_used_at?: string;
  total_sent: number;
  total_failed: number;
  last_error?: string;
}

interface NewEmailAccount {
  name: string;
  email: string;
  purpose: string;
  provider: 'zoho' | 'gmail' | 'sendgrid' | 'smtp';
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_user: string;
  smtp_password: string;
  from_name: string;
  reply_to_email: string;
  is_active: boolean;
  is_primary: boolean;
  priority: number;
  daily_limit: number;
  hourly_limit: number;
}

export default function EmailAccountsManager() {
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<EmailAccount | null>(null);
  const [testingAccount, setTestingAccount] = useState<string | null>(null);
  const [newAccount, setNewAccount] = useState<NewEmailAccount>({
    name: '',
    email: '',
    purpose: '',
    provider: 'zoho',
    smtp_host: 'smtp.zoho.com',
    smtp_port: 587,
    smtp_secure: false,
    smtp_user: '',
    smtp_password: '',
    from_name: 'RevivaTech',
    reply_to_email: '',
    is_active: true,
    is_primary: false,
    priority: 1,
    daily_limit: 1000,
    hourly_limit: 100
  });
  const [testEmail, setTestEmail] = useState('admin@revivatech.co.uk');
  const [message, setMessage] = useState<{type: 'success' | 'error' | 'info', text: string} | null>(null);

  // Dynamic API URL configuration (matching admin.service.ts pattern)
  const getApiBaseUrl = () => {
    if (typeof window === 'undefined') {
      return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3011';
    }

    const hostname = window.location.hostname;
    
    // Check if we're running locally (even if accessed via external domain)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3011';
    }
    
    // For external domains, use localhost backend in development
    if (hostname.includes('revivatech.co.uk') || hostname.includes('revivatech.com.br')) {
      return 'http://localhost:3011';
    }
    
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3011';
  };

  // Get auth token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem('accessToken');
  };

  // API headers with authentication
  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getAuthToken()}`
  });

  // Load email accounts on component mount
  useEffect(() => {
    loadEmailAccounts();
  }, []);

  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const loadEmailAccounts = async () => {
    try {
      setLoading(true);
      const apiUrl = getApiBaseUrl();
      const response = await fetch(`${apiUrl}/api/admin/email-accounts`, {
        headers: getHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setAccounts(data.accounts || []);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to load email accounts:', error);
      showMessage('error', 'Failed to load email accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    try {
      const apiUrl = getApiBaseUrl();
      const response = await fetch(`${apiUrl}/api/admin/email-accounts`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(newAccount)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showMessage('success', 'Email account created successfully');
        setShowAddForm(false);
        setNewAccount({
          name: '',
          email: '',
          purpose: '',
          provider: 'zoho',
          smtp_host: 'smtp.zoho.com',
          smtp_port: 587,
          smtp_secure: false,
          smtp_user: '',
          smtp_password: '',
          from_name: 'RevivaTech',
          reply_to_email: '',
          is_active: true,
          is_primary: false,
          priority: 1,
          daily_limit: 1000,
          hourly_limit: 100
        });
        await loadEmailAccounts();
      } else {
        throw new Error(data.error || 'Failed to create account');
      }
    } catch (error) {
      console.error('Failed to create email account:', error);
      showMessage('error', `Failed to create account: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleUpdateAccount = async (account: EmailAccount) => {
    try {
      const apiUrl = getApiBaseUrl();
      const response = await fetch(`${apiUrl}/api/admin/email-accounts/${account.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(account)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showMessage('success', 'Email account updated successfully');
        setEditingAccount(null);
        await loadEmailAccounts();
      } else {
        throw new Error(data.error || 'Failed to update account');
      }
    } catch (error) {
      console.error('Failed to update email account:', error);
      showMessage('error', `Failed to update account: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm('Are you sure you want to delete this email account?')) {
      return;
    }

    try {
      const apiUrl = getApiBaseUrl();
      const response = await fetch(`${apiUrl}/api/admin/email-accounts/${accountId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showMessage('success', 'Email account deleted successfully');
        await loadEmailAccounts();
      } else {
        throw new Error(data.error || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Failed to delete email account:', error);
      showMessage('error', `Failed to delete account: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleTestAccount = async (accountId: string) => {
    try {
      setTestingAccount(accountId);
      const apiUrl = getApiBaseUrl();
      const response = await fetch(`${apiUrl}/api/admin/email-accounts/${accountId}/test`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          to_email: testEmail,
          subject: 'Email Account Test',
          message: 'This is a test email to verify your email account configuration is working correctly.'
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showMessage('success', `Test email sent successfully to ${testEmail}`);
      } else {
        throw new Error(data.details || data.error || 'Failed to send test email');
      }
    } catch (error) {
      console.error('Failed to send test email:', error);
      showMessage('error', `Failed to send test email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setTestingAccount(null);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'zoho': return '🔷';
      case 'gmail': return '📧';
      case 'sendgrid': return '📮';
      default: return '📨';
    }
  };

  const getStatusBadge = (account: EmailAccount) => {
    if (!account.is_active) {
      return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
    }
    if (account.last_error) {
      return <Badge className="bg-red-100 text-red-800">Error</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800">Active</Badge>;
  };

  const renderAccountForm = (account: NewEmailAccount | EmailAccount, isEdit: boolean = false) => (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">
        {isEdit ? 'Edit Email Account' : 'Add New Email Account'}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Account Name *
          </label>
          <input
            type="text"
            value={account.name}
            onChange={(e) => isEdit 
              ? setEditingAccount({...editingAccount!, name: e.target.value})
              : setNewAccount({...newAccount, name: e.target.value})
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Customer Support"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address *
          </label>
          <input
            type="email"
            value={account.email}
            onChange={(e) => isEdit 
              ? setEditingAccount({...editingAccount!, email: e.target.value})
              : setNewAccount({...newAccount, email: e.target.value})
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="support@revivatech.co.uk"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Purpose
          </label>
          <input
            type="text"
            value={account.purpose}
            onChange={(e) => isEdit 
              ? setEditingAccount({...editingAccount!, purpose: e.target.value})
              : setNewAccount({...newAccount, purpose: e.target.value})
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Description of what this email is used for"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Provider *
          </label>
          <select
            value={account.provider}
            onChange={(e) => {
              const provider = e.target.value as 'zoho' | 'gmail' | 'sendgrid' | 'smtp';
              const updates = { provider };
              if (provider === 'zoho') {
                Object.assign(updates, { smtp_host: 'smtp.zoho.com', smtp_port: 587 });
              } else if (provider === 'gmail') {
                Object.assign(updates, { smtp_host: 'smtp.gmail.com', smtp_port: 587 });
              }
              
              isEdit 
                ? setEditingAccount({...editingAccount!, ...updates})
                : setNewAccount({...newAccount, ...updates});
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="zoho">Zoho Mail</option>
            <option value="gmail">Gmail</option>
            <option value="sendgrid">SendGrid</option>
            <option value="smtp">Custom SMTP</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            SMTP Host *
          </label>
          <input
            type="text"
            value={account.smtp_host}
            onChange={(e) => isEdit 
              ? setEditingAccount({...editingAccount!, smtp_host: e.target.value})
              : setNewAccount({...newAccount, smtp_host: e.target.value})
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            SMTP Port *
          </label>
          <input
            type="number"
            value={account.smtp_port}
            onChange={(e) => isEdit 
              ? setEditingAccount({...editingAccount!, smtp_port: parseInt(e.target.value)})
              : setNewAccount({...newAccount, smtp_port: parseInt(e.target.value)})
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            SMTP Username *
          </label>
          <input
            type="email"
            value={account.smtp_user}
            onChange={(e) => isEdit 
              ? setEditingAccount({...editingAccount!, smtp_user: e.target.value})
              : setNewAccount({...newAccount, smtp_user: e.target.value})
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {!isEdit && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SMTP Password *
            </label>
            <input
              type="password"
              value={account.smtp_password}
              onChange={(e) => setNewAccount({...newAccount, smtp_password: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            From Name *
          </label>
          <input
            type="text"
            value={account.from_name}
            onChange={(e) => isEdit 
              ? setEditingAccount({...editingAccount!, from_name: e.target.value})
              : setNewAccount({...newAccount, from_name: e.target.value})
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reply-To Email
          </label>
          <input
            type="email"
            value={account.reply_to_email || ''}
            onChange={(e) => isEdit 
              ? setEditingAccount({...editingAccount!, reply_to_email: e.target.value})
              : setNewAccount({...newAccount, reply_to_email: e.target.value})
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Priority
          </label>
          <input
            type="number"
            min="1"
            max="100"
            value={account.priority}
            onChange={(e) => isEdit 
              ? setEditingAccount({...editingAccount!, priority: parseInt(e.target.value)})
              : setNewAccount({...newAccount, priority: parseInt(e.target.value)})
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="mt-6 flex items-center space-x-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={account.is_active}
            onChange={(e) => isEdit 
              ? setEditingAccount({...editingAccount!, is_active: e.target.checked})
              : setNewAccount({...newAccount, is_active: e.target.checked})
            }
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm">Active</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={account.is_primary}
            onChange={(e) => isEdit 
              ? setEditingAccount({...editingAccount!, is_primary: e.target.checked})
              : setNewAccount({...newAccount, is_primary: e.target.checked})
            }
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm">Primary account</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={account.smtp_secure}
            onChange={(e) => isEdit 
              ? setEditingAccount({...editingAccount!, smtp_secure: e.target.checked})
              : setNewAccount({...newAccount, smtp_secure: e.target.checked})
            }
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm">Use SSL/TLS</span>
        </label>
      </div>

      <div className="mt-6 flex items-center justify-end space-x-3">
        <Button
          onClick={() => {
            isEdit ? setEditingAccount(null) : setShowAddForm(false);
          }}
          variant="outline"
        >
          Cancel
        </Button>
        <Button
          onClick={() => {
            isEdit ? handleUpdateAccount(editingAccount!) : handleCreateAccount();
          }}
        >
          {isEdit ? 'Update Account' : 'Create Account'}
        </Button>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p>Loading email accounts...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Account Management</h1>
          <p className="text-gray-600">Manage your email accounts and configurations</p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Email Account</span>
        </Button>
      </div>

      {/* Message Alert */}
      {message && (
        <div className={`p-4 rounded-md ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
          message.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
          'bg-blue-50 text-blue-800 border border-blue-200'
        }`}>
          <div className="flex items-center">
            {message.type === 'success' && <CheckCircle className="w-5 h-5 mr-2" />}
            {message.type === 'error' && <XCircle className="w-5 h-5 mr-2" />}
            {message.type === 'info' && <AlertCircle className="w-5 h-5 mr-2" />}
            <span>{message.text}</span>
          </div>
        </div>
      )}

      {/* Add Account Form */}
      {showAddForm && renderAccountForm(newAccount)}

      {/* Edit Account Form */}
      {editingAccount && renderAccountForm(editingAccount, true)}

      {/* Email Accounts List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {accounts.map((account) => (
          <Card key={account.id} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{getProviderIcon(account.provider)}</div>
                <div>
                  <h3 className="text-lg font-semibold flex items-center space-x-2">
                    <span>{account.name}</span>
                    {account.is_primary && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                  </h3>
                  <p className="text-sm text-gray-600">{account.email}</p>
                </div>
              </div>
              {getStatusBadge(account)}
            </div>

            {account.purpose && (
              <p className="text-sm text-gray-600 mb-4">{account.purpose}</p>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <span className="font-medium">Provider:</span> {account.provider}
              </div>
              <div>
                <span className="font-medium">Priority:</span> {account.priority}
              </div>
              <div>
                <span className="font-medium">Total Sent:</span> {account.total_sent}
              </div>
              <div>
                <span className="font-medium">Total Failed:</span> {account.total_failed}
              </div>
            </div>

            {account.last_used_at && (
              <p className="text-xs text-gray-500 mb-4">
                Last used: {new Date(account.last_used_at).toLocaleString()}
              </p>
            )}

            {account.last_error && (
              <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
                <p className="text-sm text-red-800">
                  <strong>Last Error:</strong> {account.last_error}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="test@example.com"
                  className="text-sm px-2 py-1 border border-gray-300 rounded"
                />
                <Button
                  onClick={() => handleTestAccount(account.id)}
                  disabled={testingAccount === account.id}
                  size="sm"
                  variant="outline"
                >
                  {testingAccount === account.id ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Test
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => setEditingAccount(account)}
                  size="sm"
                  variant="outline"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => handleDeleteAccount(account.id)}
                  size="sm"
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {accounts.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <Mail className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Email Accounts</h3>
            <p className="text-gray-600 mb-4">Get started by adding your first email account.</p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Email Account
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}