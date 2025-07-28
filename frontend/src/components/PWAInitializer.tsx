'use client';

import { useEffect, useState } from 'react';
import { Download, X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { initializePWA, isRunningAsPWA, isPWASupported } from '@/lib/pwa/pwaSetup';

export default function PWAInitializer() {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check PWA support
    setIsSupported(isPWASupported());
    setIsInstalled(isRunningAsPWA());

    if (!isPWASupported()) {
      console.log('📱 PWA: Not supported on this device');
      return;
    }

    // Initialize PWA manager
    const pwaManager = initializePWA();

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setShowInstallPrompt(true);
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
    };

    // Listen for service worker updates
    const handleServiceWorkerUpdate = () => {
      setShowUpdatePrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    
    // Check if already installed
    if (isRunningAsPWA()) {
      setIsInstalled(true);
      setShowInstallPrompt(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    const pwaManager = initializePWA();
    if (pwaManager) {
      const success = await pwaManager.promptInstall();
      if (success) {
        setShowInstallPrompt(false);
      }
    }
  };

  const handleUpdate = () => {
    const pwaManager = initializePWA();
    if (pwaManager) {
      pwaManager.updateApp();
      setShowUpdatePrompt(false);
    }
  };

  // Don't render anything if PWA is not supported or already installed
  if (!isSupported || isInstalled) {
    return null;
  }

  return (
    <>
      {/* Install Prompt */}
      {showInstallPrompt && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 animate-slide-up">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Download className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900">
                Install RevivaTech App
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Get the app for faster access and offline features.
              </p>
              <div className="flex items-center space-x-2 mt-3">
                <Button
                  size="sm"
                  onClick={handleInstall}
                  className="text-xs"
                >
                  Install
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowInstallPrompt(false)}
                  className="text-xs"
                >
                  Not now
                </Button>
              </div>
            </div>
            <button
              onClick={() => setShowInstallPrompt(false)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Update Prompt */}
      {showUpdatePrompt && (
        <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm bg-green-50 border border-green-200 rounded-lg shadow-lg p-4 z-50 animate-slide-down">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900">
                Update Available
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                A new version of RevivaTech is ready.
              </p>
              <div className="flex items-center space-x-2 mt-3">
                <Button
                  size="sm"
                  onClick={handleUpdate}
                  className="text-xs bg-green-600 hover:bg-green-700"
                >
                  Update Now
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowUpdatePrompt(false)}
                  className="text-xs"
                >
                  Later
                </Button>
              </div>
            </div>
            <button
              onClick={() => setShowUpdatePrompt(false)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}