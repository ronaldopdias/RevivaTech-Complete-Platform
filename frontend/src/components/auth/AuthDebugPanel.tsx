'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Eye, EyeOff, RefreshCw, X } from 'lucide-react';

interface AuthDebugPanelProps {
  isVisible?: boolean;
  onToggle?: () => void;
}

export const AuthDebugPanel: React.FC<AuthDebugPanelProps> = ({ 
  isVisible = false, 
  onToggle 
}) => {
  const auth = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);

  // Test session validation endpoint
  const testValidation = async () => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/auth/validate', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      const result = await response.json();
      setValidationResult({ status: response.status, data: result });
    } catch (error) {
      setValidationResult({ 
        status: 'error', 
        data: { error: error instanceof Error ? error.message : 'Unknown error' } 
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Auto-refresh validation on auth state changes
  useEffect(() => {
    if (isVisible && auth.isAuthenticated) {
      testValidation();
    }
  }, [isVisible, auth.isAuthenticated]);

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-4 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 z-50"
        title="Show Auth Debug Panel"
      >
        <Eye className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-96 bg-white border border-gray-300 rounded-lg shadow-xl z-50 overflow-hidden">
      <div className="flex items-center justify-between p-3 bg-gray-100 border-b">
        <h3 className="font-semibold text-sm">Auth Debug Panel</h3>
        <div className="flex gap-2">
          <button
            onClick={testValidation}
            disabled={refreshing}
            className="p-1 text-gray-600 hover:text-gray-800 disabled:opacity-50"
            title="Refresh Validation"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onToggle}
            className="p-1 text-gray-600 hover:text-gray-800"
            title="Hide Debug Panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="p-3 max-h-80 overflow-y-auto">
        {/* Authentication State */}
        <div className="mb-4">
          <h4 className="font-medium text-xs text-gray-700 mb-2">Authentication State</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className={`p-2 rounded ${auth.isAuthenticated ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              <div className="font-medium">Authenticated</div>
              <div>{auth.isAuthenticated ? 'Yes' : 'No'}</div>
            </div>
            <div className={`p-2 rounded ${auth.isLoading ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
              <div className="font-medium">Loading</div>
              <div>{auth.isLoading ? 'Yes' : 'No'}</div>
            </div>
            <div className={`p-2 rounded ${auth.hasValidSession ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              <div className="font-medium">Valid Session</div>
              <div>{auth.hasValidSession ? 'Yes' : 'No'}</div>
            </div>
            <div className={`p-2 rounded ${auth.hasSessionData ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              <div className="font-medium">Session Data</div>
              <div>{auth.hasSessionData ? 'Yes' : 'No'}</div>
            </div>
          </div>
        </div>

        {/* User Information */}
        <div className="mb-4">
          <h4 className="font-medium text-xs text-gray-700 mb-2">User Information</h4>
          <div className="bg-gray-50 p-2 rounded text-xs">
            <div><strong>ID:</strong> {auth.user?.id || 'N/A'}</div>
            <div><strong>Email:</strong> {auth.user?.email || 'N/A'}</div>
            <div><strong>Name:</strong> {auth.user?.name || 'N/A'}</div>
            <div><strong>Role:</strong> {auth.role || auth.currentRole || 'N/A'}</div>
            <div><strong>Active:</strong> {auth.user?.isActive ? 'Yes' : 'No'}</div>
          </div>
        </div>

        {/* Role Checks */}
        <div className="mb-4">
          <h4 className="font-medium text-xs text-gray-700 mb-2">Role Checks</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className={`p-2 rounded ${auth.isAdmin ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
              <div className="font-medium">Admin</div>
              <div>{auth.isAdmin ? 'Yes' : 'No'}</div>
            </div>
            <div className={`p-2 rounded ${auth.isSuperAdmin ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
              <div className="font-medium">Super Admin</div>
              <div>{auth.isSuperAdmin ? 'Yes' : 'No'}</div>
            </div>
            <div className={`p-2 rounded ${auth.isTechnician ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
              <div className="font-medium">Technician</div>
              <div>{auth.isTechnician ? 'Yes' : 'No'}</div>
            </div>
            <div className={`p-2 rounded ${auth.isCustomer ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
              <div className="font-medium">Customer</div>
              <div>{auth.isCustomer ? 'Yes' : 'No'}</div>
            </div>
          </div>
        </div>

        {/* Session Validation */}
        {validationResult && (
          <div className="mb-4">
            <h4 className="font-medium text-xs text-gray-700 mb-2">Session Validation</h4>
            <div className={`p-2 rounded text-xs ${
              validationResult.status === 200 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              <div><strong>Status:</strong> {validationResult.status}</div>
              <div><strong>Valid:</strong> {validationResult.data.valid ? 'Yes' : 'No'}</div>
              {validationResult.data.reason && (
                <div><strong>Reason:</strong> {validationResult.data.reason}</div>
              )}
              {validationResult.data.user?.role && (
                <div><strong>Server Role:</strong> {validationResult.data.user.role}</div>
              )}
            </div>
          </div>
        )}

        {/* Error Information */}
        {auth.error && (
          <div className="mb-4">
            <h4 className="font-medium text-xs text-gray-700 mb-2">Error</h4>
            <div className="bg-red-100 text-red-800 p-2 rounded text-xs">
              {auth.error.message || String(auth.error)}
            </div>
          </div>
        )}

        {/* Raw Session Data */}
        <div className="mb-4">
          <h4 className="font-medium text-xs text-gray-700 mb-2">Raw Session</h4>
          <details className="text-xs">
            <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
              Show Raw Data
            </summary>
            <pre className="mt-2 p-2 bg-gray-100 rounded overflow-x-auto text-xs">
              {JSON.stringify(auth.sessionData || auth.session, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    </div>
  );
};

export default AuthDebugPanel;