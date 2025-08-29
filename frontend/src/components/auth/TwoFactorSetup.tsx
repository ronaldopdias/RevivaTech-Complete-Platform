/**
 * Two-Factor Authentication Setup Component
 * Provides comprehensive 2FA management interface
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useAuth } from '@/lib/auth';

interface TwoFactorStatus {
  enabled: boolean;
  backupCodesRemaining: number;
  lowBackupCodesWarning: boolean;
}

interface SetupData {
  qrCode: string;
  manualEntryKey: string;
  instructions: {
    step1: string;
    step2: string;
    step3: string;
  };
}

const TwoFactorSetup: React.FC = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [verificationToken, setVerificationToken] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/two-factor/status', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const result = await response.json();
        setStatus(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch 2FA status:', error);
    }
  };

  const startSetup = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/two-factor/setup', {
        method: 'POST',
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSetupData(result.data);
      } else {
        setError(result.message || 'Failed to setup 2FA');
      }
    } catch (error) {
      setError('Failed to setup 2FA');
    } finally {
      setLoading(false);
    }
  };

  const verifySetup = async () => {
    if (!verificationToken || verificationToken.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/two-factor/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ token: verificationToken })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setBackupCodes(result.data.backupCodes);
        setShowBackupCodes(true);
        setSuccess('2FA enabled successfully!');
        setSetupData(null);
        fetchStatus(); // Refresh status
      } else {
        setError(result.message || 'Failed to verify 2FA');
      }
    } catch (error) {
      setError('Failed to verify 2FA');
    } finally {
      setLoading(false);
    }
  };

  const regenerateBackupCodes = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/two-factor/backup-codes/regenerate', {
        method: 'POST',
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (result.success) {
        setBackupCodes(result.data.backupCodes);
        setShowBackupCodes(true);
        setSuccess('Backup codes regenerated successfully!');
        fetchStatus();
      } else {
        setError(result.message || 'Failed to regenerate backup codes');
      }
    } catch (error) {
      setError('Failed to regenerate backup codes');
    } finally {
      setLoading(false);
    }
  };

  const disable2FA = async () => {
    if (!confirm('Are you sure you want to disable two-factor authentication? This will make your account less secure.')) {
      return;
    }

    const password = prompt('Please enter your password to confirm:');
    if (!password) return;

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/two-factor/disable', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ confirmPassword: password })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSuccess('2FA disabled successfully');
        fetchStatus();
        setSetupData(null);
        setShowBackupCodes(false);
        setBackupCodes([]);
      } else {
        setError(result.message || 'Failed to disable 2FA');
      }
    } catch (error) {
      setError('Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const copyBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    navigator.clipboard.writeText(codesText);
    setSuccess('Backup codes copied to clipboard!');
  };

  if (!status) {
    return <div className="animate-pulse">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Two-Factor Authentication
            {status.enabled && <Badge variant="success">Enabled</Badge>}
            {!status.enabled && <Badge variant="secondary">Disabled</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert variant="default" className="mb-4">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {!status.enabled ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Two-factor authentication adds an extra layer of security to your account.
                You'll need to enter a code from your authenticator app when signing in.
              </p>

              {!setupData ? (
                <Button onClick={startSetup} disabled={loading} className="w-full">
                  {loading ? 'Setting up...' : 'Enable Two-Factor Authentication'}
                </Button>
              ) : (
                <Tabs defaultValue="qr" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="qr">QR Code</TabsTrigger>
                    <TabsTrigger value="manual">Manual Setup</TabsTrigger>
                  </TabsList>

                  <TabsContent value="qr" className="space-y-4">
                    <div className="text-center">
                      <img 
                        src={setupData.qrCode} 
                        alt="2FA QR Code" 
                        className="mx-auto mb-4 border rounded"
                      />
                      <p className="text-sm text-muted-foreground">
                        Scan this QR code with your authenticator app
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="manual" className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Manual Entry Key:
                      </label>
                      <Input 
                        value={setupData.manualEntryKey}
                        readOnly
                        className="font-mono"
                      />
                    </div>
                  </TabsContent>

                  <div className="mt-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Verification Code:
                      </label>
                      <Input
                        type="text"
                        placeholder="Enter 6-digit code"
                        value={verificationToken}
                        onChange={(e) => setVerificationToken(e.target.value)}
                        maxLength={6}
                        className="text-center tracking-wider"
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button 
                        onClick={verifySetup} 
                        disabled={loading || verificationToken.length !== 6}
                        className="flex-1"
                      >
                        {loading ? 'Verifying...' : 'Verify & Enable'}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setSetupData(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </Tabs>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Two-Factor Authentication Enabled</p>
                  <p className="text-sm text-muted-foreground">
                    Backup codes remaining: {status.backupCodesRemaining}
                    {status.lowBackupCodesWarning && (
                      <span className="text-amber-600 ml-2">⚠️ Running low</span>
                    )}
                  </p>
                </div>
                <Button variant="destructive" size="sm" onClick={disable2FA}>
                  Disable
                </Button>
              </div>

              <Button 
                variant="outline" 
                onClick={regenerateBackupCodes}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Generating...' : 'Regenerate Backup Codes'}
              </Button>
            </div>
          )}

          {showBackupCodes && backupCodes.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Backup Codes</CardTitle>
              </CardHeader>
              <CardContent>
                <Alert className="mb-4">
                  <AlertDescription>
                    <strong>Important:</strong> Save these backup codes in a secure location. 
                    Each code can only be used once and they will not be shown again.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  {backupCodes.map((code, index) => (
                    <div 
                      key={index}
                      className="font-mono text-sm bg-muted p-2 rounded text-center"
                    >
                      {code}
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <Button onClick={copyBackupCodes} variant="outline" className="flex-1">
                    Copy Codes
                  </Button>
                  <Button 
                    onClick={() => setShowBackupCodes(false)} 
                    variant="outline"
                  >
                    I've Saved Them
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TwoFactorSetup;