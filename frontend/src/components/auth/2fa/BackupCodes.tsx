'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { backupCodesService, backupCodesUtils, BackupCode } from '@/lib/auth/backup-codes';
import { 
  Key, 
  Download, 
  Printer, 
  Copy, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  Eye, 
  EyeOff,
  Shield,
  BarChart3,
  Clock,
  AlertTriangle
} from 'lucide-react';

interface BackupCodesProps {
  codes: BackupCode[];
  userEmail: string;
  onCodeUsed?: (codeId: string) => void;
  onRegenerateRequested?: () => void;
  showManagement?: boolean;
  className?: string;
}

export const BackupCodes: React.FC<BackupCodesProps> = ({
  codes,
  userEmail,
  onCodeUsed,
  onRegenerateRequested,
  showManagement = true,
  className,
}) => {
  const [showCodes, setShowCodes] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedAction, setSelectedAction] = useState<'download' | 'print' | null>(null);

  // Get usage statistics
  const stats = backupCodesService.getUsageStatistics(codes);
  const analysis = backupCodesService.performSecurityAnalysis(codes);

  // Copy codes to clipboard
  const copyToClipboard = async () => {
    const success = await backupCodesUtils.copyToClipboard(codes);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Download codes
  const downloadCodes = () => {
    setSelectedAction('download');
    backupCodesUtils.downloadAsTextFile(codes, userEmail);
    setTimeout(() => setSelectedAction(null), 1000);
  };

  // Print codes
  const printCodes = () => {
    setSelectedAction('print');
    backupCodesUtils.printBackupCodes(codes, userEmail);
    setTimeout(() => setSelectedAction(null), 1000);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'secure': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'secure': return <Check className="h-5 w-5" />;
      case 'warning': return <AlertTriangle className="h-5 w-5" />;
      case 'critical': return <AlertCircle className="h-5 w-5" />;
      default: return <Shield className="h-5 w-5" />;
    }
  };

  return (
    <div className={className}>
      <Card className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Key className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Backup Codes</h3>
              <p className="text-sm text-muted-foreground">
                Use these codes if you lose access to your authenticator
              </p>
            </div>
          </div>
          
          {showManagement && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCodes(!showCodes)}
            >
              {showCodes ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          )}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.remaining}</div>
            <div className="text-sm text-muted-foreground">Remaining</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{stats.used}</div>
            <div className="text-sm text-muted-foreground">Used</div>
          </div>
        </div>

        {/* Security status */}
        <div className={`flex items-center space-x-2 p-3 rounded-lg mb-6 ${
          analysis.status === 'secure' ? 'bg-green-50 border border-green-200' :
          analysis.status === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
          'bg-red-50 border border-red-200'
        }`}>
          <div className={getStatusColor(analysis.status)}>
            {getStatusIcon(analysis.status)}
          </div>
          <div className="flex-1">
            <div className={`font-medium ${getStatusColor(analysis.status)}`}>
              {analysis.status === 'secure' && 'Backup codes are secure'}
              {analysis.status === 'warning' && 'Backup codes need attention'}
              {analysis.status === 'critical' && 'Critical: Backup codes depleted'}
            </div>
            {analysis.issues.length > 0 && (
              <div className="text-sm text-muted-foreground mt-1">
                {analysis.issues.join(', ')}
              </div>
            )}
          </div>
        </div>

        {/* Backup codes display */}
        <div className="space-y-4 mb-6">
          <div className="flex justify-between items-center">
            <h4 className="font-medium">Your Backup Codes</h4>
            {stats.lastUsed && (
              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Last used: {stats.lastUsed.toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {showCodes ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {codes.map((code, index) => (
                  <div 
                    key={code.id}
                    className={`p-3 rounded-lg border ${
                      code.used 
                        ? 'bg-gray-50 border-gray-200 text-gray-400 line-through' 
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <code className="font-mono text-sm">
                        {backupCodesService.formatSingleCode(code.code)}
                      </code>
                      {code.used && (
                        <span className="text-xs text-gray-400">Used</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                  className="flex items-center space-x-2"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span>{copied ? 'Copied!' : 'Copy All'}</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadCodes}
                  disabled={selectedAction === 'download'}
                  className="flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={printCodes}
                  disabled={selectedAction === 'print'}
                  className="flex items-center space-x-2"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Backup codes are hidden</p>
              <p className="text-sm">Click the eye icon to view your backup codes</p>
            </div>
          )}
        </div>

        {/* Usage progress */}
        <div className="space-y-2 mb-6">
          <div className="flex justify-between text-sm">
            <span>Usage</span>
            <span>{Math.round(stats.usagePercentage)}% used</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                stats.usagePercentage < 50 ? 'bg-green-500' :
                stats.usagePercentage < 80 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${stats.usagePercentage}%` }}
            />
          </div>
        </div>

        {/* Management actions */}
        {showManagement && (
          <div className="space-y-3">
            {/* Recommendations */}
            {analysis.recommendations.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h5 className="font-medium text-blue-900 mb-2">Recommendations</h5>
                <ul className="space-y-1">
                  {analysis.recommendations.map((recommendation, index) => (
                    <li key={index} className="text-sm text-blue-800 flex items-start space-x-2">
                      <span className="font-medium">•</span>
                      <span>{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Regenerate button */}
            <Button
              variant="outline"
              onClick={onRegenerateRequested}
              className="flex items-center space-x-2 w-full justify-center"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Generate New Backup Codes</span>
            </Button>

            {/* Warning */}
            <div className="text-xs text-muted-foreground p-3 bg-muted/50 rounded-lg">
              <strong>Important:</strong> Each backup code can only be used once. 
              Store these codes securely and generate new ones if you suspect they've been compromised.
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

// Component for using backup codes during login
export const BackupCodeVerify: React.FC<{
  onVerifySuccess: (code: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string;
}> = ({ onVerifySuccess, onCancel, isLoading, error }) => {
  const [backupCode, setBackupCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = backupCodesService.cleanCode(backupCode);
    if (backupCodesService.validateCodeFormat(cleanCode)) {
      onVerifySuccess(cleanCode);
    }
  };

  return (
    <Card className="p-8 max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Key className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Use Backup Code</h2>
        <p className="text-muted-foreground">
          Enter one of your backup codes to sign in
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            type="text"
            placeholder="XXXXXXXX"
            value={backupCode}
            onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
            maxLength={8}
            className="text-center text-xl font-mono tracking-widest"
            autoComplete="one-time-code"
            autoFocus
            disabled={isLoading}
          />
        </div>

        {error && (
          <div className="flex items-center space-x-2 text-red-600 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-3">
          <Button 
            type="submit"
            disabled={!backupCodesService.validateCodeFormat(backupCode) || isLoading} 
            fullWidth
            size="lg"
          >
            {isLoading ? 'Verifying...' : 'Verify Code'}
          </Button>
          
          <Button 
            type="button"
            variant="outline" 
            onClick={onCancel} 
            fullWidth
            disabled={isLoading}
          >
            Back to 2FA
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default BackupCodes;