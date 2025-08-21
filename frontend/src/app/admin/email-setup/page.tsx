'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/Badge';
import { AlertCircle, CheckCircle, Mail, Send, Settings, RefreshCw, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// Remove server-side import - will call API instead
// import { SMTP_PROVIDERS, SMTPConfiguration, EmailConfigStatus } from '@/lib/services/emailConfigService';

export default function EmailSetupPage() {
  const [config, setConfig] = useState<SMTPConfiguration>({
    provider: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: '',
      pass: ''
    },
    from: {
      email: 'noreply@revivatech.co.uk',
      name: 'RevivaTech'
    },
    enabled: false
  });
  
  const [status, setStatus] = useState<EmailConfigStatus>({
    configured: false,
    connected: false,
    queueStatus: {
      total: 0,
      pending: 0,
      sending: 0,
      failed: 0
    }
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  // Load current configuration
  useEffect(() => {
    loadCurrentConfig();
    const interval = setInterval(loadStatus, 30000); // Refresh status every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadCurrentConfig = async () => {
    try {
      const response = await fetch('/api/admin/email/configure');
      if (response.ok) {
        const data = await response.json();
        if (data.config) {
          setConfig(prev => ({
            ...prev,
            ...data.config,
            auth: {
              user: data.config.user || prev.auth.user,
              pass: prev.auth.pass // Don't overwrite password
            }
          }));
        }
        if (data.status) {
          setStatus(data.status);
        }
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  };

  const loadStatus = async () => {
    try {
      const response = await fetch('/api/admin/email/test-connection');
      if (response.ok) {
        const data = await response.json();
        setStatus(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error('Failed to load status:', error);
    }
  };

  const handleProviderChange = (provider: keyof typeof SMTP_PROVIDERS) => {
    const providerConfig = SMTP_PROVIDERS[provider];
    setConfig(prev => ({
      ...prev,
      provider,
      host: providerConfig.host,
      port: providerConfig.port,
      secure: providerConfig.secure
    }));
    setErrors([]);
  };

  const testConnection = async () => {
    setIsLoading(true);
    setErrors([]);
    
    try {
      const response = await fetch('/api/admin/email/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      const result = await response.json();
      
      if (result.success) {
        setStatus(prev => ({
          ...prev,
          connected: true,
          lastTest: result.timestamp,
          error: undefined
        }));
      } else {
        setStatus(prev => ({
          ...prev,
          connected: false,
          error: result.error
        }));
        setErrors([result.error || 'Connection test failed']);
      }
    } catch (error) {
      setErrors(['Failed to test connection']);
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfiguration = async () => {
    setIsLoading(true);
    setErrors([]);
    
    try {
      const response = await fetch('/api/admin/email/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      const result = await response.json();
      
      if (result.success) {
        setStatus(result.status);
        setLastSaved(new Date().toISOString());
        // Auto-test connection after saving
        await testConnection();
      } else {
        setErrors(result.details || [result.error || 'Failed to save configuration']);
      }
    } catch (error) {
      setErrors(['Failed to save configuration']);
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail) return;
    
    setIsLoading(true);
    setErrors([]);
    
    try {
      const response = await fetch('/api/admin/email/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          to: testEmail,
          config: config
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert(`✅ Test email sent successfully to ${testEmail}!`);
      } else {
        setErrors([result.error || 'Failed to send test email']);
      }
    } catch (error) {
      setErrors(['Failed to send test email']);
    } finally {
      setIsLoading(false);
    }
  };

  const currentProvider = SMTP_PROVIDERS[config.provider];

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Configuration</h1>
          <p className="text-muted-foreground">Configure SMTP settings for booking confirmations and notifications</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant={status.configured ? 'default' : 'secondary'}>
            {status.configured ? 'Configured' : 'Not Configured'}
          </Badge>
          <Badge variant={status.connected ? 'default' : 'destructive'}>
            {status.connected ? (
              <><CheckCircle className="h-3 w-3 mr-1" /> Connected</>
            ) : (
              <><AlertCircle className="h-3 w-3 mr-1" /> Disconnected</>
            )}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="configuration" className="space-y-6">
        <TabsList>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
          <TabsTrigger value="queue">Email Queue</TabsTrigger>
          <TabsTrigger value="setup">Setup Guide</TabsTrigger>
        </TabsList>

        <TabsContent value="configuration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                SMTP Configuration
              </CardTitle>
              <CardDescription>
                Configure your email provider settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email Provider Selection */}
              <div className="space-y-2">
                <Label>Email Provider</Label>
                <Select value={config.provider} onValueChange={handleProviderChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select email provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SMTP_PROVIDERS).map(([key, provider]) => (
                      <SelectItem key={key} value={key}>
                        {provider.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{currentProvider.instructions}</span>
                  {currentProvider.setupUrl && (
                    <a 
                      href={currentProvider.setupUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
                    >
                      Setup Guide <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>

              {/* SMTP Settings Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp-host">SMTP Host</Label>
                  <Input
                    id="smtp-host"
                    value={config.host}
                    onChange={(e) => setConfig(prev => ({ ...prev, host: e.target.value }))}
                    placeholder="smtp.gmail.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtp-port">Port</Label>
                  <Input
                    id="smtp-port"
                    type="number"
                    value={config.port}
                    onChange={(e) => setConfig(prev => ({ ...prev, port: parseInt(e.target.value) || 587 }))}
                    placeholder="587"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtp-user">Username/Email</Label>
                  <Input
                    id="smtp-user"
                    value={config.auth.user}
                    onChange={(e) => setConfig(prev => ({ 
                      ...prev, 
                      auth: { ...prev.auth, user: e.target.value }
                    }))}
                    placeholder="noreply@revivatech.co.uk"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtp-pass">Password/API Key</Label>
                  <div className="relative">
                    <Input
                      id="smtp-pass"
                      type={showPassword ? 'text' : 'password'}
                      value={config.auth.pass}
                      onChange={(e) => setConfig(prev => ({ 
                        ...prev, 
                        auth: { ...prev.auth, pass: e.target.value }
                      }))}
                      placeholder="App password or API key"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="from-email">From Email</Label>
                  <Input
                    id="from-email"
                    value={config.from.email}
                    onChange={(e) => setConfig(prev => ({ 
                      ...prev, 
                      from: { ...prev.from, email: e.target.value }
                    }))}
                    placeholder="noreply@revivatech.co.uk"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="from-name">From Name</Label>
                  <Input
                    id="from-name"
                    value={config.from.name}
                    onChange={(e) => setConfig(prev => ({ 
                      ...prev, 
                      from: { ...prev.from, name: e.target.value }
                    }))}
                    placeholder="RevivaTech"
                  />
                </div>
              </div>

              {/* Advanced Settings */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="secure"
                    checked={config.secure}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, secure: checked }))}
                  />
                  <Label htmlFor="secure">Use SSL/TLS (port 465)</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="enabled"
                    checked={config.enabled}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enabled: checked }))}
                  />
                  <Label htmlFor="enabled">Enable email sending</Label>
                </div>
              </div>

              {/* Error Display */}
              {errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1">
                      {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Success Message */}
              {lastSaved && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Configuration saved successfully at {new Date(lastSaved).toLocaleString()}
                  </AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <Button onClick={testConnection} disabled={isLoading} variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  {isLoading ? 'Testing...' : 'Test Connection'}
                </Button>
                
                <Button onClick={saveConfiguration} disabled={isLoading}>
                  {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Save Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Send Test Email
              </CardTitle>
              <CardDescription>
                Send a test email to verify your configuration is working
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Input
                  placeholder="test@example.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={sendTestEmail} 
                  disabled={!testEmail || !status.configured || isLoading}
                >
                  {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Send Test
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground">
                This will send a booking confirmation template to the specified email address.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Queue Status</CardTitle>
              <CardDescription>Monitor email sending queue and statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{status.queueStatus.total}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{status.queueStatus.pending}</div>
                  <div className="text-sm text-muted-foreground">Pending</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{status.queueStatus.sending}</div>
                  <div className="text-sm text-muted-foreground">Sending</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{status.queueStatus.failed}</div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </div>
              </div>
              
              {status.lastTest && (
                <div className="mt-4 text-sm text-muted-foreground">
                  Last connection test: {new Date(status.lastTest).toLocaleString()}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="setup" className="space-y-6">
          <div className="grid gap-6">
            {Object.entries(SMTP_PROVIDERS).map(([key, provider]) => (
              <Card key={key}>
                <CardHeader>
                  <CardTitle>{provider.name} Setup</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{provider.instructions}</p>
                  
                  {key === 'gmail' && (
                    <ol className="list-decimal list-inside space-y-1 text-sm ml-4">
                      <li>Enable 2-Factor Authentication on your Gmail account</li>
                      <li>Go to Google Account Settings → Security → App Passwords</li>
                      <li>Generate an App Password for "Mail"</li>
                      <li>Use your Gmail address as username and App Password as password</li>
                    </ol>
                  )}
                  
                  {key === 'sendgrid' && (
                    <ol className="list-decimal list-inside space-y-1 text-sm ml-4">
                      <li>Create a SendGrid account at sendgrid.com</li>
                      <li>Verify your domain and set up domain authentication</li>
                      <li>Create an API key with "Mail Send" permissions</li>
                      <li>Use "apikey" as username and your API key as password</li>
                    </ol>
                  )}
                  
                  {provider.setupUrl && (
                    <a 
                      href={provider.setupUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View Setup Guide <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}