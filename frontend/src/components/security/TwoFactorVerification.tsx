'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { useTwoFactor } from '@/lib/services/twoFactorService';

interface TwoFactorVerificationProps {
  userId: string;
  onSuccess: (trustDeviceToken?: string) => void;
  onCancel: () => void;
  className?: string;
  allowTrustDevice?: boolean;
}

export function TwoFactorVerification({
  userId,
  onSuccess,
  onCancel,
  className = '',
  allowTrustDevice = true
}: TwoFactorVerificationProps) {
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState('');
  const [trustDevice, setTrustDevice] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { verifyLogin, loading, error } = useTwoFactor();

  // Countdown timer for code refresh
  useEffect(() => {
    if (useBackupCode) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          return 30; // Reset to 30 seconds
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [useBackupCode]);

  // Account lockout timer
  useEffect(() => {
    if (isLocked) {
      const lockTimer = setTimeout(() => {
        setIsLocked(false);
        setAttempts(0);
      }, 300000); // 5 minutes lockout

      return () => clearTimeout(lockTimer);
    }
  }, [isLocked]);

  // Handle code input
  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only digits
    
    const newCode = [...verificationCode];
    newCode[index] = value.slice(-1); // Take only the last digit
    setVerificationCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (newCode.every(digit => digit !== '') && !useBackupCode) {
      handleVerification(newCode.join(''));
    }
  };

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text');
    const digits = pasteData.replace(/\D/g, '').slice(0, 6);
    
    if (digits.length === 6) {
      const newCode = digits.split('');
      setVerificationCode(newCode);
      handleVerification(digits);
    }
  };

  // Handle verification
  const handleVerification = async (code?: string) => {
    if (isLocked) return;
    
    const tokenToVerify = useBackupCode ? backupCode : (code || verificationCode.join(''));
    
    if (!tokenToVerify || (useBackupCode ? tokenToVerify.length < 6 : tokenToVerify.length !== 6)) {
      return;
    }

    try {
      const result = await verifyLogin(userId, {
        token: tokenToVerify,
        backup: useBackupCode,
        trustDevice: trustDevice
      });

      if (result.success) {
        onSuccess(result.trustDeviceToken);
      } else {
        // Handle failed verification
        setAttempts(prev => prev + 1);
        
        if (attempts >= 4) { // 5 attempts total
          setIsLocked(true);
        }
        
        // Clear the code
        if (useBackupCode) {
          setBackupCode('');
        } else {
          setVerificationCode(['', '', '', '', '', '']);
          inputRefs.current[0]?.focus();
        }
      }
    } catch (error) {
      console.error('2FA verification error:', error);
      setAttempts(prev => prev + 1);
      
      if (attempts >= 4) {
        setIsLocked(true);
      }
    }
  };

  // Toggle backup code mode
  const toggleBackupCode = () => {
    setUseBackupCode(!useBackupCode);
    setVerificationCode(['', '', '', '', '', '']);
    setBackupCode('');
    
    if (!useBackupCode) {
      // Switching to backup code mode
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  };

  const progressPercentage = ((30 - timeLeft) / 30) * 100;

  return (
    <div className={`max-w-md mx-auto ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl p-8"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="shield-check" size={24} className="text-primary-600" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Two-Factor Authentication
          </h2>
          <p className="text-gray-600">
            {useBackupCode 
              ? 'Enter one of your backup codes'
              : 'Enter the 6-digit code from your authenticator app'
            }
          </p>
        </div>

        {/* Account Lockout Warning */}
        {isLocked && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6"
          >
            <div className="flex items-center gap-3">
              <Icon name="lock" size={20} className="text-red-500" />
              <div>
                <h3 className="font-semibold text-red-800">Account Temporarily Locked</h3>
                <p className="text-red-600 text-sm">
                  Too many failed attempts. Please wait 5 minutes before trying again.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Verification Input */}
        <div className="mb-6">
          {useBackupCode ? (
            // Backup Code Input
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Backup Code:
              </label>
              <input
                ref={el => inputRefs.current[0] = el}
                type="text"
                placeholder="Enter backup code"
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && handleVerification()}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center font-mono text-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={isLocked || loading}
                maxLength={10}
              />
            </div>
          ) : (
            // TOTP Code Input
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Authentication Code:
              </label>
              <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                {verificationCode.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => inputRefs.current[index] = el}
                    type="text"
                    inputMode="numeric"
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-12 text-center text-lg font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    disabled={isLocked || loading}
                    maxLength={1}
                  />
                ))}
              </div>

              {/* Timer Progress */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
                  <span>Code expires in {timeLeft}s</span>
                  <span>{Math.round(progressPercentage)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <motion.div
                    className="bg-primary-500 h-1 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4"
          >
            <div className="flex items-center gap-2">
              <Icon name="alert-circle" size={16} className="text-red-500" />
              <span className="text-red-700 text-sm">
                {attempts > 0 && `Attempt ${attempts}/5: `}
                Invalid code. Please try again.
              </span>
            </div>
          </motion.div>
        )}

        {/* Trust Device Option */}
        {allowTrustDevice && !isLocked && (
          <div className="mb-6">
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={trustDevice}
                onChange={(e) => setTrustDevice(e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
              />
              <span className="text-gray-700">
                Trust this device for 30 days
              </span>
              <Icon name="info" size={16} className="text-gray-400" />
            </label>
            {trustDevice && (
              <p className="text-xs text-gray-500 mt-1 ml-7">
                You won't need 2FA on this device for 30 days
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {useBackupCode ? (
            <Button
              onClick={() => handleVerification()}
              disabled={!backupCode || isLocked || loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Icon name="loader" size={16} className="mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  Verify Backup Code
                  <Icon name="key" size={16} className="ml-2" />
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={() => handleVerification()}
              disabled={verificationCode.some(d => !d) || isLocked || loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Icon name="loader" size={16} className="mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  Verify Code
                  <Icon name="shield-check" size={16} className="ml-2" />
                </>
              )}
            </Button>
          )}

          {/* Toggle Backup Code */}
          <button
            onClick={toggleBackupCode}
            disabled={isLocked}
            className="w-full text-center text-sm text-blue-600 hover:text-blue-800 underline"
          >
            {useBackupCode 
              ? 'Use authenticator app instead' 
              : 'Use backup code instead'
            }
          </button>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center mt-6 pt-6 border-t">
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={loading}
          >
            <Icon name="arrow-left" size={16} className="mr-2" />
            Back to Login
          </Button>

          <div className="text-xs text-gray-500">
            Attempts: {attempts}/5
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Lost your device?{' '}
            <button className="text-blue-600 hover:text-blue-800 underline">
              Contact Support
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default TwoFactorVerification;