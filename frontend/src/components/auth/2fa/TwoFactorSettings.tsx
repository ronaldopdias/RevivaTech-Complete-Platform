'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/lib/auth';
import { totpUtils } from '@/lib/auth/totp';
import { BackupCode } from '@/lib/auth/backup-codes';
import TwoFactorSetup from './TwoFactorSetup';
import BackupCodes from './BackupCodes';
import { 
  Shield, 
  ShieldCheck, 
  ShieldX, 
  AlertCircle, 
  Check, 
  X, 
  RefreshCw, 
  Settings as SettingsIcon,
  Smartphone,
  Key,
  Clock,
  AlertTriangle
} from 'lucide-react';

interface TwoFactorSettingsProps {
  className?: string;
}

type SettingsMode = 'overview' | 'setup' | 'disable' | 'regenerate-codes';

export const TwoFactorSettings: React.FC<TwoFactorSettingsProps> = ({ className }) => {
  const { user, updateUser } = useAuth();
  const [mode, setMode] = useState<SettingsMode>('overview');
  const [disableCode, setDisableCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Mock backup codes - in real implementation, fetch from API
  const [backupCodes] = useState<BackupCode[]>([
    { id: '1', code: 'A1B2C3D4', used: false },
    { id: '2', code: 'E5F6G7H8', used: true, usedAt: new Date('2024-01-15'), usedFrom: '192.168.1.1' },
    { id: '3', code: 'I9J0K1L2', used: false },
    { id: '4', code: 'M3N4O5P6', used: false },
    { id: '5', code: 'Q7R8S9T0', used: false },
    { id: '6', code: 'U1V2W3X4', used: false },
    { id: '7', code: 'Y5Z6A7B8', used: false },
    { id: '8', code: 'C9D0E1F2', used: false },
    { id: '9', code: 'G3H4I5J6', used: false },
    { id: '10', code: 'K7L8M9N0', used: false },
  ]);

  const isTwoFactorEnabled = totpUtils.isTOTPEnabled(user);

  // Handle 2FA setup completion
  const handleSetupComplete = () => {
    setMode('overview');
    setSuccess('Two-factor authentication has been enabled successfully!');
    setTimeout(() => setSuccess(''), 5000);
  };

  // Handle 2FA disable
  const handleDisable2FA = async () => {
    if (!disableCode) return;

    setIsLoading(true);
    setError('');

    try {
      // In real implementation, verify code with backend
      // For now, just simulate the process
      await new Promise(resolve => setTimeout(resolve, 1000));

      await updateUser({
        twoFactorEnabled: false,
        twoFactorSecret: null,
      });

      setMode('overview');
      setDisableCode('');
      setSuccess('Two-factor authentication has been disabled.');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError('Failed to disable 2FA. Please check your verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle backup codes regeneration
  const handleRegenerateBackupCodes = async () => {
    setIsLoading(true);
    setError('');

    try {
      // In real implementation, generate new codes via API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('New backup codes have been generated. Please save them securely.');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError('Failed to generate new backup codes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Render setup mode
  if (mode === 'setup') {
    return (
      <TwoFactorSetup
        onSetupComplete={handleSetupComplete}
        onCancel={() => setMode('overview')}
      />
    );
  }

  // Render main settings
  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold mb-2">Two-Factor Authentication</h2>
          <p className="text-muted-foreground">
            Secure your account with an additional layer of protection
          </p>
        </div>

        {/* Success/Error messages */}
        {success && (
          <div className="flex items-center space-x-2 text-green-600 bg-green-50 p-4 rounded-lg border border-green-200">
            <Check className="h-5 w-5" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Current Status */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isTwoFactorEnabled 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-gray-100 text-gray-400'
              }`}>
                {isTwoFactorEnabled ? <ShieldCheck className="h-6 w-6" /> : <ShieldX className="h-6 w-6" />}
              </div>
              
              <div>
                <h3 className="text-lg font-semibold">
                  {isTwoFactorEnabled ? '2FA Enabled' : '2FA Disabled'}
                </h3>
                <p className="text-muted-foreground">
                  {isTwoFactorEnabled 
                    ? 'Your account is protected with two-factor authentication' 
                    : 'Your account is not protected with two-factor authentication'
                  }
                </p>
              </div>
            </div>

            <div className="flex space-x-2">
              {isTwoFactorEnabled ? (
                <Button
                  variant="destructive"
                  onClick={() => setMode('disable')}
                >
                  Disable 2FA
                </Button>
              ) : (
                <Button
                  onClick={() => setMode('setup')}
                  className="flex items-center space-x-2"
                >
                  <Shield className="h-4 w-4" />
                  <span>Enable 2FA</span>
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Security Information */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <SettingsIcon className="h-5 w-5" />
            <span>Security Information</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Smartphone className="h-5 w-5 text-blue-500 mt-1" />
                <div>
                  <h4 className="font-medium">Authenticator App</h4>
                  <p className="text-sm text-muted-foreground">
                    Use apps like Google Authenticator, Authy, or 1Password
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Key className="h-5 w-5 text-green-500 mt-1" />
                <div>
                  <h4 className="font-medium">Backup Codes</h4>
                  <p className="text-sm text-muted-foreground">
                    Use backup codes when you don't have access to your phone
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Clock className="h-5 w-5 text-orange-500 mt-1" />
                <div>
                  <h4 className="font-medium">Time-Based Codes</h4>
                  <p className="text-sm text-muted-foreground">
                    Codes refresh every 30 seconds for maximum security
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-1" />
                <div>
                  <h4 className="font-medium">Account Recovery</h4>
                  <p className="text-sm text-muted-foreground">
                    Keep backup codes safe to avoid account lockout
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Backup Codes Section */}
        {isTwoFactorEnabled && (
          <BackupCodes
            codes={backupCodes}
            userEmail={user?.email || ''}
            onRegenerateRequested={handleRegenerateBackupCodes}
          />
        )}

        {/* Disable 2FA Modal */}
        {mode === 'disable' && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="p-8 max-w-md w-full">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldX className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Disable Two-Factor Authentication</h3>
                <p className="text-muted-foreground">
                  Enter a verification code from your authenticator app to disable 2FA
                </p>
              </div>

              <div className="space-y-4">
                <Input
                  type="text"
                  placeholder="000000"
                  value={disableCode}
                  onChange={(e) => setDisableCode(totpUtils.cleanCodeInput(e.target.value))}
                  maxLength={6}
                  className="text-center text-xl font-mono tracking-widest"
                  autoComplete="one-time-code"
                  autoFocus
                  disabled={isLoading}
                />

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-800">Warning:</p>
                      <p className="text-yellow-700">
                        Disabling 2FA will make your account less secure. Make sure you understand the risks.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <Button
                    variant="destructive"
                    onClick={handleDisable2FA}
                    disabled={!totpUtils.isValidCodeFormat(disableCode) || isLoading}
                    fullWidth
                  >
                    {isLoading ? 'Disabling...' : 'Disable 2FA'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      setMode('overview');
                      setDisableCode('');
                      setError('');
                    }}
                    fullWidth
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default TwoFactorSettings;