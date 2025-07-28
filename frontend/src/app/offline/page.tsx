'use client';

import { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw, Home, Phone, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Check initial online status
    setIsOnline(navigator.onLine);

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      // Automatically retry when back online
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    window.location.reload();
  };

  const goHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center space-y-6">
        {/* Status Icon */}
        <div className="flex justify-center">
          <div className={`p-4 rounded-full ${isOnline ? 'bg-green-100' : 'bg-red-100'}`}>
            {isOnline ? (
              <Wifi className="w-12 h-12 text-green-600" />
            ) : (
              <WifiOff className="w-12 h-12 text-red-600" />
            )}
          </div>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isOnline ? 'Back Online!' : 'You\'re Offline'}
          </h1>
          <p className="text-gray-600">
            {isOnline 
              ? 'Great! Your connection has been restored. Redirecting you back...'
              : 'It looks like you\'re not connected to the internet. Don\'t worry, you can still access some features.'
            }
          </p>
        </div>

        {/* Connection Status */}
        {!isOnline && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">What you can still do:</h3>
            <ul className="text-sm text-blue-800 space-y-1 text-left">
              <li>• View previously loaded repair information</li>
              <li>• Access cached booking forms</li>
              <li>• Review repair pricing (cached data)</li>
              <li>• View contact information</li>
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {!isOnline && (
            <Button 
              onClick={handleRetry}
              className="w-full"
              disabled={retryCount > 3}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {retryCount > 3 ? 'Please check your connection' : 'Try Again'}
            </Button>
          )}

          <Button 
            onClick={goHome}
            variant="outline"
            className="w-full"
          >
            <Home className="w-4 h-4 mr-2" />
            Go to Homepage
          </Button>
        </div>

        {/* Offline Features */}
        {!isOnline && (
          <div className="pt-6 border-t border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Available Offline</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = '/services'}
                className="flex flex-col items-center p-4 h-auto"
              >
                <Phone className="w-6 h-6 mb-2" />
                <span className="text-xs">Contact Info</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = '/book-repair'}
                className="flex flex-col items-center p-4 h-auto"
              >
                <MessageCircle className="w-6 h-6 mb-2" />
                <span className="text-xs">Cached Forms</span>
              </Button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span>RevivaTech - Available Offline</span>
          </div>
        </div>
      </Card>
    </div>
  );
}