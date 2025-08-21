'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, CheckCircle, AlertCircle, RefreshCw, Shield } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { authDiagnosticService, DiagnosticReport } from '@/lib/auth/diagnostic-service';

interface DiagnosticPanelProps {
  className?: string;
}

export function DiagnosticPanel({ className = '' }: DiagnosticPanelProps) {
  const { isAdmin } = useAuth();
  const [report, setReport] = useState<DiagnosticReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Only allow admin access
  if (!isAdmin) {
    return null;
  }

  const runDiagnostics = async () => {
    setIsRunning(true);
    try {
      const diagnosticReport = await authDiagnosticService.runDiagnostics();
      setReport(diagnosticReport);
    } catch (error) {
      console.error('Failed to run diagnostics:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'fail':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getOverallStatusColor = (overall: string) => {
    switch (overall) {
      case 'healthy':
        return 'text-green-600 bg-green-50';
      case 'issues':
        return 'text-yellow-600 bg-yellow-50';
      case 'critical':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  // Toggle visibility with keyboard shortcut (Ctrl+Shift+D)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setIsVisible(!isVisible);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isVisible]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`fixed top-4 right-4 z-50 ${className}`}>
      <Card className="w-96 max-h-[80vh] overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              Auth Diagnostics
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={runDiagnostics}
                disabled={isRunning}
                size="sm"
                variant="outline"
                className="h-7 px-2"
              >
                {isRunning ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3" />
                )}
              </Button>
              <button
                onClick={() => setIsVisible(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="pt-0 max-h-96 overflow-y-auto">
          {!report && !isRunning && (
            <div className="text-center py-8 text-gray-500">
              <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <div className="text-sm">Click refresh to run diagnostics</div>
              <div className="text-xs text-gray-400 mt-1">
                Ctrl+Shift+D to toggle panel
              </div>
            </div>
          )}

          {isRunning && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin text-blue-600" />
                <div className="text-sm text-gray-600">Running diagnostics...</div>
              </div>
            </div>
          )}

          {report && (
            <div className="space-y-3">
              {/* Overall Status */}
              <div className={`p-3 rounded-lg ${getOverallStatusColor(report.overall)}`}>
                <div className="font-medium text-sm">
                  System Status: {report.overall.toUpperCase()}
                </div>
                <div className="text-xs mt-1">
                  {report.summary.passed} passed • {report.summary.failed} failed • {report.summary.warnings} warnings
                </div>
              </div>

              {/* Test Results */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700">Test Results</div>
                {report.results.map((result, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 p-2 rounded border border-gray-100"
                  >
                    {getStatusIcon(result.status)}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-900">
                        {result.test}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {result.message}
                      </div>
                      {result.details && (
                        <details className="mt-1">
                          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                            Details
                          </summary>
                          <pre className="text-xs text-gray-600 mt-1 p-2 bg-gray-50 rounded overflow-x-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Timestamp */}
              <div className="text-xs text-gray-500 pt-2 border-t">
                Generated: {new Date(report.timestamp).toLocaleString()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default DiagnosticPanel;