'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Search,
  Settings,
  TestTube,
  Download,
  Eye,
  RotateCcw
} from 'lucide-react';

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  customer: {
    id: string;
    name: string;
    email: string;
  };
  description: string;
  repair_id: string;
  created: string;
  method: string;
  card_last4: string;
  card_brand: string;
  failure_reason?: string;
}

interface PaymentStats {
  total_revenue: number;
  today_revenue: number;
  total_transactions: number;
  success_rate: number;
  pending_count: number;
  failed_count: number;
}

interface PaymentsData {
  payments: Payment[];
  refunds: any[];
  config: {
    enabled: boolean;
    public_key: string;
  };
}

export default function PaymentsPage() {
  const [data, setData] = useState<PaymentsData | null>(null);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');

  const fetchPayments = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/payments/stripe?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/payments/stripe?action=stats');
      const result = await response.json();
      
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch payment stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchStats();
  }, [statusFilter, searchTerm]);

  const formatCurrency = (amount: number, currency: string = 'gbp') => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'succeeded': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: string } = {
      succeeded: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800'
    };
    return variants[status] || 'bg-gray-100 text-gray-800';
  };

  const handleRefund = async (paymentId: string, amount: number) => {
    try {
      const response = await fetch('/api/payments/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'process_refund',
          payment_id: paymentId,
          amount,
          reason: 'requested_by_customer'
        })
      });
      const result = await response.json();
      
      if (result.success) {
        alert('Refund processed successfully');
        fetchPayments();
      }
    } catch (error) {
      console.error('Failed to process refund:', error);
    }
  };

  const testStripeConnection = async () => {
    try {
      const response = await fetch('/api/payments/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test_connection' })
      });
      const result = await response.json();
      alert(result.message);
    } catch (error) {
      console.error('Failed to test connection:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Payment Processing</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={testStripeConnection}>
            <TestTube className="h-4 w-4 mr-2" />
            Test Connection
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Reports
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold">{formatCurrency(stats.total_revenue)}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
                      <p className="text-2xl font-bold">{formatCurrency(stats.today_revenue)}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Success Rate</p>
                      <p className="text-2xl font-bold">{stats.success_rate}%</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending</p>
                      <p className="text-2xl font-bold">{stats.pending_count}</p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Configuration Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Payment Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${data?.config.enabled ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="font-medium">Stripe Integration</span>
                  <Badge variant={data?.config.enabled ? 'default' : 'secondary'}>
                    {data?.config.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="font-medium">Webhook Configured</span>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="font-medium">SSL Enabled</span>
                  <Badge variant="default">Secure</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search transactions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="succeeded">Succeeded</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Transactions List */}
          <div className="space-y-4">
            {data?.payments.map((payment) => (
              <Card key={payment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-gray-400" />
                      <div>
                        <h3 className="font-semibold">{payment.description}</h3>
                        <p className="text-sm text-gray-600">
                          {payment.customer.name} • {payment.customer.email}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-2xl font-bold">{formatCurrency(payment.amount, payment.currency)}</p>
                      <Badge className={getStatusBadge(payment.status)}>
                        {getStatusIcon(payment.status)}
                        {payment.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Payment ID</p>
                      <p className="font-mono text-sm">{payment.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Payment Method</p>
                      <p className="text-sm capitalize">{payment.card_brand} •••• {payment.card_last4}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Date</p>
                      <p className="text-sm">{new Date(payment.created).toLocaleDateString('en-GB')}</p>
                    </div>
                  </div>

                  {payment.failure_reason && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">
                        <AlertCircle className="h-4 w-4 inline mr-1" />
                        Failure reason: {payment.failure_reason.replace('_', ' ')}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      Repair: {payment.repair_id}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                      
                      {payment.status === 'succeeded' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleRefund(payment.id, payment.amount)}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Refund
                        </Button>
                      )}
                      
                      {payment.status === 'pending' && (
                        <Button variant="outline" size="sm">
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Retry
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Stripe Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="stripe_enabled">Enable Stripe Payments</Label>
                  <Switch
                    id="stripe_enabled"
                    checked={data?.config.enabled || false}
                  />
                </div>
                
                <div>
                  <Label htmlFor="public_key">Publishable Key</Label>
                  <Input
                    id="public_key"
                    value={data?.config.public_key || ''}
                    placeholder="pk_..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="secret_key">Secret Key</Label>
                  <Input
                    id="secret_key"
                    type="password"
                    placeholder="sk_..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="webhook_secret">Webhook Secret</Label>
                  <Input
                    id="webhook_secret"
                    type="password"
                    placeholder="whsec_..."
                  />
                </div>
                
                <Button className="w-full">
                  Save Configuration
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="currency">Default Currency</Label>
                  <Select defaultValue="gbp">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gbp">GBP (£)</SelectItem>
                      <SelectItem value="eur">EUR (€)</SelectItem>
                      <SelectItem value="usd">USD ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto_capture">Auto-capture Payments</Label>
                  <Switch id="auto_capture" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="email_receipts">Send Email Receipts</Label>
                  <Switch id="email_receipts" defaultChecked />
                </div>
                
                <div>
                  <Label htmlFor="statement_descriptor">Statement Descriptor</Label>
                  <Input
                    id="statement_descriptor"
                    defaultValue="REVIVATECH"
                    maxLength={22}
                  />
                </div>
                
                <Button className="w-full">
                  Save Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}