'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useTwoFactor } from '@/lib/services/twoFactorService';

interface TwoFactorSetupProps {
  userId: string;
  email: string;
  onComplete: () => void;
  onCancel: () => void;
  className?: string;
}

interface SetupStep {
  id: string;
  title: string;
  description: string;
  icon: string;
}

const setupSteps: SetupStep[] = [
  {
    id: 'app',
    title: 'Install Authenticator App',
    description: 'Download Google Authenticator, Authy, or similar app',
    icon: 'smartphone'
  },
  {
    id: 'scan',
    title: 'Scan QR Code',
    description: 'Use your authenticator app to scan the QR code',
    icon: 'qr-code'
  },
  {
    id: 'verify',
    title: 'Verify Setup',
    description: 'Enter the 6-digit code from your app',
    icon: 'shield-check'
  },
  {
    id: 'backup',
    title: 'Save Backup Codes',
    description: 'Store backup codes in a safe place',
    icon: 'key'
  }
];

export function TwoFactorSetup({
  userId,
  email,
  onComplete,
  onCancel,
  className = ''
}: TwoFactorSetupProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [setupData, setSetupData] = useState<any>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodesSaved, setBackupCodesSaved] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  
  const { setupTwoFactor, verifySetup, loading, error } = useTwoFactor();

  // Initialize setup
  useEffect(() => {
    const initializeSetup = async () => {
      try {
        const setup = await setupTwoFactor(userId, email);
        setSetupData(setup);
      } catch (error) {
        console.error('Failed to initialize 2FA setup:', error);
      }
    };

    initializeSetup();
  }, [userId, email, setupTwoFactor]);

  // Handle verification
  const handleVerification = async () => {
    if (!setupData || !verificationCode) return;

    try {
      const success = await verifySetup(userId, setupData.secret, verificationCode);
      
      if (success) {
        setCurrentStep(3); // Move to backup codes step
      } else {
        // Show error for invalid code
        setVerificationCode('');
      }
    } catch (error) {
      console.error('Verification failed:', error);
    }
  };

  // Handle completion
  const handleComplete = () => {
    if (backupCodesSaved) {
      onComplete();
    }
  };

  // Download backup codes
  const downloadBackupCodes = () => {
    if (!setupData?.backupCodes) return;
    
    const content = [
      'RevivaTech 2FA Backup Codes',
      '================================',
      'Save these codes in a safe place.',
      'Each code can only be used once.',
      '',
      ...setupData.backupCodes.map((code: string, index: number) => 
        `${index + 1}. ${code}`
      ),
      '',
      'Generated on: ' + new Date().toLocaleString()
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'revivatech-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setBackupCodesSaved(true);
  };

  // Copy backup codes to clipboard
  const copyBackupCodes = async () => {
    if (!setupData?.backupCodes) return;
    
    const content = setupData.backupCodes.join('\n');
    
    try {
      await navigator.clipboard.writeText(content);
      // Show success feedback
    } catch (error) {
      console.error('Failed to copy backup codes:', error);
    }
  };

  const currentStepData = setupSteps[currentStep];

  return (
    <div className={`max-w-md mx-auto ${className}`}>
      {/* Progress Indicator */}
      <div className="flex items-center justify-between mb-8">
        {setupSteps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <motion.div
              className={`
                w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold
                ${index <= currentStep 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-gray-200 text-gray-500'
                }
              `}
              animate={{
                scale: index === currentStep ? 1.1 : 1,
                backgroundColor: index <= currentStep ? '#3B82F6' : '#E5E7EB'
              }}
              transition={{ duration: 0.3 }}
            >
              {index < currentStep ? (
                <Icon name="check" size={16} />
              ) : (
                index + 1
              )}
            </motion.div>
            
            {index < setupSteps.length - 1 && (
              <div 
                className={`w-8 h-0.5 mx-2 ${
                  index < currentStep ? 'bg-primary-500' : 'bg-gray-200'
                }`} 
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          {/* Step Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name={currentStepData.icon} size={24} className="text-primary-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {currentStepData.title}
            </h2>
            <p className="text-gray-600">
              {currentStepData.description}
            </p>
          </div>

          {/* Step Content */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Recommended Apps:</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Icon name="smartphone" size={16} className="text-blue-600" />
                    <span className="text-blue-800">Google Authenticator</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Icon name="smartphone" size={16} className="text-blue-600" />
                    <span className="text-blue-800">Authy</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Icon name="smartphone" size={16} className="text-blue-600" />
                    <span className="text-blue-800">Microsoft Authenticator</span>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={() => setCurrentStep(1)}
                className="w-full"
                disabled={loading}
              >
                I've Installed an App
                <Icon name="arrow-right" size={16} className="ml-2" />
              </Button>
            </div>
          )}

          {currentStep === 1 && setupData && (
            <div className="space-y-6">
              {/* QR Code */}
              <div className="text-center">
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block">
                  {/* QR Code would be generated here using a library like qrcode */}
                  <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Icon name="qr-code" size={48} className="text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">QR Code</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Manual Entry Option */}
              <div className="text-center">
                <button
                  onClick={() => setShowManualEntry(!showManualEntry)}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Can't scan? Enter manually
                </button>
              </div>

              {showManualEntry && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-gray-50 rounded-lg p-4"
                >
                  <p className="text-sm text-gray-600 mb-2">Account:</p>
                  <code className="block text-sm bg-white p-2 rounded border mb-3">
                    {setupData.accountName}
                  </code>
                  
                  <p className="text-sm text-gray-600 mb-2">Secret Key:</p>
                  <code className="block text-sm bg-white p-2 rounded border break-all">
                    {setupData.secret}
                  </code>
                </motion.div>
              )}

              <Button 
                onClick={() => setCurrentStep(2)}
                className="w-full"
              >
                I've Added the Account
                <Icon name="arrow-right" size={16} className="ml-2" />
              </Button>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter 6-digit code from your app:
                </label>
                <Input
                  type="text"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="text-center text-2xl tracking-widest"
                  maxLength={6}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Icon name="alert-circle" size={16} className="text-red-500" />
                    <span className="text-red-700 text-sm">
                      Invalid code. Please try again.
                    </span>
                  </div>
                </div>
              )}

              <Button 
                onClick={handleVerification}
                disabled={verificationCode.length !== 6 || loading}
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
            </div>
          )}

          {currentStep === 3 && setupData && (
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Icon name="alert-triangle" size={20} className="text-amber-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-amber-800 mb-1">Important!</h3>
                    <p className="text-amber-700 text-sm">
                      Save these backup codes in a secure location. You can use them to access your account if you lose your authenticator device.
                    </p>
                  </div>
                </div>
              </div>

              {/* Backup Codes */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-2">
                  {setupData.backupCodes.map((code: string, index: number) => (
                    <div
                      key={index}
                      className="bg-white rounded px-3 py-2 text-center font-mono text-sm border"
                    >
                      {code}
                    </div>
                  ))}
                </div>
              </div>

              {/* Save Options */}
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={downloadBackupCodes}
                  className="flex-1"
                >
                  <Icon name="download" size={16} className="mr-2" />
                  Download
                </Button>
                <Button
                  variant="secondary"
                  onClick={copyBackupCodes}
                  className="flex-1"
                >
                  <Icon name="copy" size={16} className="mr-2" />
                  Copy
                </Button>
              </div>

              {/* Confirmation */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="backup-saved"
                  checked={backupCodesSaved}
                  onChange={(e) => setBackupCodesSaved(e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded border-gray-300"
                />
                <label htmlFor="backup-saved" className="text-sm text-gray-700">
                  I have saved my backup codes in a secure location
                </label>
              </div>

              <Button 
                onClick={handleComplete}
                disabled={!backupCodesSaved}
                className="w-full"
              >
                Complete Setup
                <Icon name="check" size={16} className="ml-2" />
              </Button>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-6 pt-6 border-t">
            <Button
              variant="ghost"
              onClick={currentStep > 0 ? () => setCurrentStep(currentStep - 1) : onCancel}
            >
              <Icon name="arrow-left" size={16} className="mr-2" />
              {currentStep > 0 ? 'Back' : 'Cancel'}
            </Button>

            {currentStep < 3 && currentStep !== 2 && (
              <Button
                variant="ghost"
                onClick={() => setCurrentStep(currentStep + 1)}
              >
                Skip
                <Icon name="arrow-right" size={16} className="ml-2" />
              </Button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default TwoFactorSetup;