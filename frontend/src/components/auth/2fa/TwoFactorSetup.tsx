'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/lib/auth';
import { totpService, totpUtils } from '@/lib/auth/totp';
import { backupCodesService, backupCodesUtils } from '@/lib/auth/backup-codes';
import { 
  Shield, 
  QrCode, 
  Copy, 
  Check, 
  Download, 
  Printer, 
  RefreshCw, 
  AlertCircle,
  Eye,
  EyeOff,
  Smartphone,
  Key
} from 'lucide-react';

interface TwoFactorSetupProps {
  onSetupComplete?: () => void;
  onCancel?: () => void;
}

type SetupStep = 'intro' | 'setup' | 'verify' | 'backup-codes' | 'complete';

export const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({
  onSetupComplete,
  onCancel,
}) => {
  const { user, updateUser } = useAuth();
  const [currentStep, setCurrentStep] = useState<SetupStep>('intro');
  const [secret, setSecret] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<any[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [copied, setCopied] = useState(false);

  // Update countdown timer
  useEffect(() => {
    if (currentStep === 'verify') {
      const interval = setInterval(() => {
        setTimeRemaining(totpService.getTimeRemaining());
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [currentStep]);

  // Start 2FA setup
  const startSetup = async () => {
    if (!user) return;

    setIsLoading(true);
    setError('');

    try {
      // Generate secret and QR code
      const newSecret = totpService.generateSecret();
      const uri = totpService.generateTOTPUri(newSecret, user.email);
      const qrCode = await totpService.generateQRCodeDataURL(uri);

      setSecret(newSecret);
      setQrCodeUrl(qrCode);
      setCurrentStep('setup');
    } catch (err) {
      setError('Failed to generate 2FA setup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Verify TOTP code
  const verifyCode = async () => {
    if (!secret || !verificationCode) return;

    setIsLoading(true);
    setError('');

    try {
      // Verify the code locally first
      const isValid = totpService.verifyTOTP(secret, verificationCode);
      
      if (!isValid) {
        setError('Invalid verification code. Please try again.');
        setIsLoading(false);
        return;
      }

      // Generate backup codes
      const codes = backupCodesService.generateBackupCodes();
      setBackupCodes(codes);
      
      // Move to backup codes step
      setCurrentStep('backup-codes');
    } catch (err) {
      setError('Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Complete 2FA setup
  const completeSetup = async () => {
    if (!user) return;

    setIsLoading(true);
    setError('');

    try {
      // In real implementation, this would save to backend
      await updateUser({
        twoFactorEnabled: true,
        twoFactorSecret: secret,
      });

      setCurrentStep('complete');
      setTimeout(() => {
        onSetupComplete?.();
      }, 2000);
    } catch (err) {
      setError('Failed to enable 2FA. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Copy secret to clipboard
  const copySecret = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      console.error('Failed to copy to clipboard');
    }
  };

  // Download backup codes
  const downloadBackupCodes = () => {
    if (user) {
      backupCodesUtils.downloadAsTextFile(backupCodes, user.email);
    }
  };

  // Print backup codes
  const printBackupCodes = () => {
    if (user) {
      backupCodesUtils.printBackupCodes(backupCodes, user.email);
    }
  };

  // Render intro step
  const renderIntro = () => (
    <Card className="p-8 max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Enable Two-Factor Authentication</h2>
        <p className="text-muted-foreground">
          Add an extra layer of security to your account
        </p>
      </div>

      <div className="space-y-4 mb-6">
        <div className="flex items-start space-x-3">
          <Smartphone className="h-5 w-5 text-primary mt-1" />
          <div>
            <h3 className="font-medium">Authenticator App Required</h3>
            <p className="text-sm text-muted-foreground">
              You'll need an authenticator app like Google Authenticator, Authy, or 1Password
            </p>
          </div>
        </div>
        
        <div className="flex items-start space-x-3">
          <Key className="h-5 w-5 text-primary mt-1" />
          <div>
            <h3 className="font-medium">Backup Codes</h3>
            <p className="text-sm text-muted-foreground">
              We'll provide backup codes to access your account if you lose your device
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Button 
          onClick={startSetup} 
          disabled={isLoading} 
          fullWidth
          size="lg"
        >
          {isLoading ? 'Setting up...' : 'Start Setup'}
        </Button>
        
        <Button 
          variant="outline" 
          onClick={onCancel} 
          fullWidth
        >
          Cancel
        </Button>
      </div>
    </Card>
  );

  // Render setup step
  const renderSetup = () => (
    <Card className="p-8 max-w-lg mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Scan QR Code</h2>
        <p className="text-muted-foreground">
          Use your authenticator app to scan this QR code
        </p>
      </div>

      <div className="space-y-6">
        {/* QR Code */}
        <div className="flex justify-center">
          <div className="p-4 bg-white border rounded-lg">
            {qrCodeUrl ? (
              <img src={qrCodeUrl} alt="2FA QR Code" className="w-48 h-48" />
            ) : (
              <div className="w-48 h-48 bg-muted flex items-center justify-center">
                <QrCode className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>

        {/* Manual entry option */}
        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-2">Can't scan the code?</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Enter this code manually in your authenticator app:
          </p>
          <div className="flex items-center space-x-2">
            <code className="flex-1 p-2 bg-muted rounded text-sm font-mono">
              {totpUtils.formatSecret(secret)}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={copySecret}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            onClick={() => setCurrentStep('intro')} 
            fullWidth
          >
            Back
          </Button>
          <Button 
            onClick={() => setCurrentStep('verify')} 
            fullWidth
          >
            Next
          </Button>
        </div>
      </div>
    </Card>
  );

  // Render verification step
  const renderVerify = () => (
    <Card className="p-8 max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Enter Verification Code</h2>
        <p className="text-muted-foreground">
          Enter the 6-digit code from your authenticator app
        </p>
      </div>

      <div className="space-y-4">
        {/* Verification code input */}
        <div>
          <Input
            type="text"
            placeholder="000000"
            value={verificationCode}
            onChange={(e) => setVerificationCode(totpUtils.cleanCodeInput(e.target.value))}
            maxLength={6}
            className="text-center text-2xl font-mono tracking-widest"
            autoComplete="one-time-code"
          />
          <p className="text-sm text-muted-foreground text-center mt-2">
            Code refreshes in {timeRemaining} seconds
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-center space-x-2 text-red-600 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Navigation */}
        <div className="space-y-3">
          <Button 
            onClick={verifyCode} 
            disabled={!totpUtils.isValidCodeFormat(verificationCode) || isLoading} 
            fullWidth
            size="lg"
          >
            {isLoading ? 'Verifying...' : 'Verify Code'}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => setCurrentStep('setup')} 
            fullWidth
          >
            Back
          </Button>
        </div>
      </div>
    </Card>
  );

  // Render backup codes step
  const renderBackupCodes = () => (
    <Card className="p-8 max-w-lg mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Save Your Backup Codes</h2>
        <p className="text-muted-foreground">
          Store these codes in a safe place. You can use them to access your account if you lose your authenticator device.
        </p>
      </div>

      <div className="space-y-6">
        {/* Backup codes display */}
        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Backup Codes</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBackupCodes(!showBackupCodes)}
            >
              {showBackupCodes ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          
          {showBackupCodes ? (
            <div className="grid grid-cols-2 gap-2">
              {backupCodesService.formatCodesForDisplay(backupCodes).map((code, index) => (
                <code key={index} className="p-2 bg-muted rounded text-sm font-mono text-center">
                  {code}
                </code>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Eye className="h-8 w-8 mx-auto mb-2" />
              <p>Click the eye icon to view codes</p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={downloadBackupCodes}
            className="flex items-center justify-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Download</span>
          </Button>
          
          <Button
            variant="outline"
            onClick={printBackupCodes}
            className="flex items-center justify-center space-x-2"
          >
            <Printer className="h-4 w-4" />
            <span>Print</span>
          </Button>
        </div>

        {/* Warning */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800">Important:</p>
              <p className="text-yellow-700">
                Each backup code can only be used once. Generate new codes if you suspect these have been compromised.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <Button 
          onClick={completeSetup} 
          disabled={isLoading} 
          fullWidth
          size="lg"
        >
          {isLoading ? 'Enabling 2FA...' : 'Complete Setup'}
        </Button>
      </div>
    </Card>
  );

  // Render completion step
  const renderComplete = () => (
    <Card className="p-8 max-w-md mx-auto text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Check className="h-8 w-8 text-green-600" />
      </div>
      
      <h2 className="text-2xl font-bold mb-2">2FA Enabled Successfully!</h2>
      <p className="text-muted-foreground mb-6">
        Your account is now protected with two-factor authentication
      </p>
      
      <Button onClick={onSetupComplete} fullWidth size="lg">
        Continue to Settings
      </Button>
    </Card>
  );

  // Main render
  return (
    <div className="min-h-screen bg-muted/50 flex items-center justify-center p-4">
      {currentStep === 'intro' && renderIntro()}
      {currentStep === 'setup' && renderSetup()}
      {currentStep === 'verify' && renderVerify()}
      {currentStep === 'backup-codes' && renderBackupCodes()}
      {currentStep === 'complete' && renderComplete()}
    </div>
  );
};

export default TwoFactorSetup;