'use client';

import React from 'react';

interface AuthLoadingSpinnerProps {
  message?: string;
  submessage?: string;
}

export const AuthLoadingSpinner: React.FC<AuthLoadingSpinnerProps> = ({
  message = "Loading...",
  submessage
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm text-gray-600">{message}</p>
        {submessage && (
          <p className="text-xs text-gray-400">{submessage}</p>
        )}
      </div>
    </div>
  );
};

export default AuthLoadingSpinner;