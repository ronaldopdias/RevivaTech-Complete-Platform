'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { totpUtils } from '@/lib/auth/totp';
import { 
  Shield, 
  AlertCircle, 
  Clock, 
  Key, 
  Smartphone,
  HelpCircle,
  RotateCcw
} from 'lucide-react';

interface TwoFactorVerifyProps {
  onVerifySuccess: (code: string, rememberDevice?: boolean) => void;
  onUseBackupCode: () => void;
  onCancel?: () => void;
  isLoading?: boolean;
  error?: string;
  userEmail?: string;
  allowRememberDevice?: boolean;
}

export const TwoFactorVerify: React.FC<TwoFactorVerifyProps> = ({
  onVerifySuccess,
  onUseBackupCode,
  onCancel,
  isLoading = false,
  error,
  userEmail,
  allowRememberDevice = true,
}) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [rememberDevice, setRememberDevice] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [showHelp, setShowHelp] = useState(false);

  // Update countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(Math.max(0, timeRemaining - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining]);

  // Reset timer when it reaches 0
  useEffect(() => {
    if (timeRemaining === 0) {
      setTimeRemaining(30);
    }
  }, [timeRemaining]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (totpUtils.isValidCodeFormat(verificationCode)) {
      onVerifySuccess(verificationCode, rememberDevice);
    }
  };

  // Handle input change
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = totpUtils.cleanCodeInput(e.target.value);
    setVerificationCode(cleaned);
  };

  // Reset form
  const resetForm = () => {
    setVerificationCode('');
    setRememberDevice(false);
  };

  // Get progress bar width for timer
  const getTimerProgress = () => {
    return (timeRemaining / 30) * 100;
  };

  return (
    <div className="min-h-screen bg-muted/50 flex items-center justify-center p-4">
      <Card className="p-8 max-w-md mx-auto w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Two-Factor Authentication</h2>
          <p className="text-muted-foreground">
            {userEmail ? `Enter the verification code for ${userEmail}` : 'Enter your verification code'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Verification code input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Verification Code</label>
            <Input
              type="text"
              placeholder="000000"
              value={verificationCode}
              onChange={handleCodeChange}
              maxLength={6}
              className="text-center text-2xl font-mono tracking-widest"
              autoComplete="one-time-code"
              autoFocus
              disabled={isLoading}
            />
            
            {/* Timer */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>Code expires in {timeRemaining}s</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Smartphone className="h-4 w-4" />
                  <span>Check your app</span>
                </span>
              </div>
              
              {/* Progress bar */}
              <div className="w-full bg-muted rounded-full h-1">
                <div 
                  className="bg-primary h-1 rounded-full transition-all duration-1000"
                  style={{ width: `${getTimerProgress()}%` }}
                />
              </div>
            </div>
          </div>

          {/* Remember device option */}
          {allowRememberDevice && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember-device"
                checked={rememberDevice}
                onCheckedChange={(checked) => setRememberDevice(checked as boolean)}
                disabled={isLoading}
              />
              <label 
                htmlFor="remember-device" 
                className="text-sm cursor-pointer"
              >
                Trust this device for 30 days
              </label>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit button */}
          <Button 
            type="submit"
            disabled={!totpUtils.isValidCodeFormat(verificationCode) || isLoading} 
            fullWidth
            size="lg"
          >
            {isLoading ? 'Verifying...' : 'Verify Code'}
          </Button>

          {/* Alternative options */}
          <div className="space-y-3">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-muted" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-background text-muted-foreground">
                  Having trouble?
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onUseBackupCode}
                disabled={isLoading}
                className="flex items-center justify-center space-x-2"
              >
                <Key className="h-4 w-4" />
                <span>Use backup code</span>
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowHelp(!showHelp)}
                className="flex items-center justify-center space-x-2"
              >
                <HelpCircle className="h-4 w-4" />
                <span>Need help?</span>
              </Button>
            </div>
          </div>

          {/* Help section */}
          {showHelp && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
              <h3 className="font-medium text-blue-900">Troubleshooting</h3>
              <div className="space-y-2 text-sm text-blue-800">
                <div className="flex items-start space-x-2">
                  <span className="font-medium">•</span>
                  <span>Make sure your device's time is synchronized</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="font-medium">•</span>
                  <span>Check if your authenticator app is showing the latest code</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="font-medium">•</span>
                  <span>Wait for a new code if the current one is about to expire</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="font-medium">•</span>
                  <span>Use backup codes if you've lost access to your authenticator</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={resetForm}
              disabled={isLoading}
              className="flex items-center justify-center space-x-2"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset</span>
            </Button>

            {onCancel && (
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
                disabled={isLoading}
                fullWidth
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
};

export default TwoFactorVerify;