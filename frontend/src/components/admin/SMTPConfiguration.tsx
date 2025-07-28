'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Mail, Send, Settings } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  fromName: string;
}

interface SMTPStatus {
  configured: boolean;
  connected: boolean;
  lastTest?: string;
  error?: string;
}

const SMTP_PRESETS = {
  gmail: {
    name: 'Gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    instructions: 'Use your Gmail address and App Password (not regular password)'
  },
  sendgrid: {
    name: 'SendGrid',
    host: 'smtp.sendgrid.net',
    port: 587,
    secure: false,
    instructions: 'Use "apikey" as username and your API key as password'
  },
  ses: {
    name: 'Amazon SES',
    host: 'email-smtp.eu-west-1.amazonaws.com',
    port: 587,
    secure: false,
    instructions: 'Use your SES SMTP credentials (not AWS access keys)'
  },
  custom: {
    name: 'Custom SMTP',
    host: '',
    port: 587,
    secure: false,
    instructions: 'Configure your own SMTP server settings'
  }
};

export function SMTPConfiguration() {
  const [config, setConfig] = useState<SMTPConfig>({
    host: '',
    port: 587,
    secure: false,
    user: '',
    pass: '',
    from: 'noreply@revivatech.co.uk',
    fromName: 'RevivaTech'
  });
  
  const [status, setStatus] = useState<SMTPStatus>({
    configured: false,
    connected: false
  });
  
  const [selectedPreset, setSelectedPreset] = useState<keyof typeof SMTP_PRESETS>('gmail');
  const [isLoading, setIsLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Load current SMTP configuration
  useEffect(() => {
    loadSMTPConfig();
  }, []);

  const loadSMTPConfig = async () => {
    try {
      const response = await fetch('/api/admin/email/config');
      if (response.ok) {
        const data = await response.json();
        setConfig(data.config || config);
        setStatus(data.status || status);
      }
    } catch (error) {
      console.error('Failed to load SMTP config:', error);
    }
  };

  const handlePresetChange = (preset: keyof typeof SMTP_PRESETS) => {
    setSelectedPreset(preset);
    const presetConfig = SMTP_PRESETS[preset];
    setConfig(prev => ({
      ...prev,
      host: presetConfig.host,
      port: presetConfig.port,
      secure: presetConfig.secure
    }));
  };

  const testConnection = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      const result = await response.json();
      setStatus(prev => ({
        ...prev,
        connected: result.success,
        lastTest: new Date().toISOString(),
        error: result.error
      }));
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        connected: false,
        error: 'Failed to test connection'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfiguration = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/email/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      if (response.ok) {
        setStatus(prev => ({ ...prev, configured: true }));
        await testConnection();
      }
    } catch (error) {
      console.error('Failed to save SMTP config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail) return;
    
    setIsLoading(true);
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
        alert('Test email sent successfully!');
      } else {
        alert(`Failed to send test email: ${result.error}`);
      }
    } catch (error) {
      alert('Failed to send test email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            SMTP Email Configuration
          </CardTitle>
          <CardDescription>
            Configure email settings for booking confirmations and notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Display */}
          <div className="flex items-center gap-4">
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

          {/* SMTP Provider Presets */}
          <div className="space-y-2">
            <Label>Email Provider</Label>
            <Select value={selectedPreset} onValueChange={handlePresetChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select email provider" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SMTP_PRESETS).map(([key, preset]) => (
                  <SelectItem key={key} value={key}>
                    {preset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {SMTP_PRESETS[selectedPreset].instructions}
            </p>
          </div>

          {/* SMTP Configuration Form */}
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
                onChange={(e) => setConfig(prev => ({ ...prev, port: parseInt(e.target.value) }))}
                placeholder="587"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtp-user">Username/Email</Label>
              <Input
                id="smtp-user"
                value={config.user}
                onChange={(e) => setConfig(prev => ({ ...prev, user: e.target.value }))}
                placeholder="noreply@revivatech.co.uk"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtp-pass">Password/API Key</Label>
              <div className="relative">
                <Input
                  id="smtp-pass"
                  type={showPassword ? 'text' : 'password'}
                  value={config.pass}
                  onChange={(e) => setConfig(prev => ({ ...prev, pass: e.target.value }))}
                  placeholder="App password or API key"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtp-from">From Email</Label>
              <Input
                id="smtp-from"
                value={config.from}
                onChange={(e) => setConfig(prev => ({ ...prev, from: e.target.value }))}
                placeholder="noreply@revivatech.co.uk"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtp-from-name">From Name</Label>
              <Input
                id="smtp-from-name"
                value={config.fromName}
                onChange={(e) => setConfig(prev => ({ ...prev, fromName: e.target.value }))}
                placeholder="RevivaTech"
              />
            </div>
          </div>

          {/* Error Display */}
          {status.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{status.error}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={testConnection} disabled={isLoading} variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Test Connection
            </Button>
            
            <Button onClick={saveConfiguration} disabled={isLoading}>
              Save Configuration
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Email Section */}
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
              Send Test
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground">
            This will send a booking confirmation template to the specified email address.
          </p>
        </CardContent>
      </Card>

      {/* Production Setup Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Production Setup Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <h4 className="font-medium">Gmail Setup (Recommended)</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground ml-4">
              <li>Enable 2-Factor Authentication on your Gmail account</li>
              <li>Go to Google Account Settings → Security → App Passwords</li>
              <li>Generate an App Password for "Mail"</li>
              <li>Use your Gmail address as username and App Password as password</li>
            </ol>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">SendGrid Setup (High Volume)</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground ml-4">
              <li>Create a SendGrid account at sendgrid.com</li>
              <li>Verify your domain and set up domain authentication</li>
              <li>Create an API key with "Mail Send" permissions</li>
              <li>Use "apikey" as username and your API key as password</li>
            </ol>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">Environment Variables</h4>
            <div className="bg-muted p-3 rounded-md text-sm font-mono">
              SMTP_HOST=smtp.gmail.com<br/>
              SMTP_PORT=587<br/>
              SMTP_USER=noreply@revivatech.co.uk<br/>
              SMTP_PASS=your-app-password<br/>
              SMTP_FROM_EMAIL=noreply@revivatech.co.uk<br/>
              SMTP_FROM_NAME=RevivaTech
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SMTPConfiguration;