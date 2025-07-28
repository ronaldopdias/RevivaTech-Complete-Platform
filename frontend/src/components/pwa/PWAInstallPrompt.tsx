'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Download, Smartphone, Monitor, Zap, Wifi, Camera } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAInstallPromptProps {
  onInstall?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function PWAInstallPrompt({ onInstall, onDismiss, className = '' }: PWAInstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<'desktop' | 'mobile' | 'unknown'>('unknown');
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    
    setPlatform(isMobile ? 'mobile' : 'desktop');
    setIsIOS(isIOSDevice);

    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isWebKit = 'standalone' in window.navigator;
    setIsInstalled(isStandalone || (isWebKit && (window.navigator as any).standalone));

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt after a delay (don't be too aggressive)
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      console.log('📱 PWA installed successfully');
      onInstall?.();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [onInstall]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    setIsInstalling(true);

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('✅ User accepted the install prompt');
        setShowPrompt(false);
        onInstall?.();
      } else {
        console.log('❌ User dismissed the install prompt');
      }
    } catch (error) {
      console.error('Install prompt failed:', error);
    } finally {
      setIsInstalling(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    onDismiss?.();
    
    // Don't show again for this session
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  // Don't show if already installed or dismissed this session
  if (isInstalled || 
      !showPrompt || 
      sessionStorage.getItem('pwa-prompt-dismissed') ||
      (!deferredPrompt && !isIOS)) {
    return null;
  }

  const features = [
    {
      icon: <Zap className="h-4 w-4" />,
      title: 'Faster Loading',
      description: 'Lightning-fast performance with offline capabilities'
    },
    {
      icon: <Wifi className="h-4 w-4" />,
      title: 'Works Offline',
      description: 'Access your bookings and data even without internet'
    },
    {
      icon: <Camera className="h-4 w-4" />,
      title: 'Camera Access',
      description: 'Take photos of your device directly in the app'
    }
  ];

  return (
    <div className={`fixed bottom-4 right-4 z-50 max-w-sm ${className}`}>
      <Card className="shadow-lg border-2 border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {platform === 'mobile' ? 
                <Smartphone className="h-5 w-5 text-primary" /> : 
                <Monitor className="h-5 w-5 text-primary" />
              }
              <CardTitle className="text-lg">Install RevivaTech</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Get the full app experience with enhanced features
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Features */}
          <div className="space-y-3">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="bg-primary/10 rounded-full p-1.5 mt-0.5">
                  {feature.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{feature.title}</div>
                  <div className="text-xs text-muted-foreground">{feature.description}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Platform-specific instructions */}
          {isIOS ? (
            <div className="space-y-3">
              <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                <strong>To install on iOS:</strong>
                <ol className="list-decimal list-inside mt-1 space-y-1">
                  <li>Tap the Share button in Safari</li>
                  <li>Scroll down and tap "Add to Home Screen"</li>
                  <li>Tap "Add" to install the app</li>
                </ol>
              </div>
              <Button onClick={handleDismiss} variant="outline" className="w-full">
                Got it!
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {platform === 'mobile' ? 'Mobile App' : 'Desktop App'}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Free
                </Badge>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={handleInstall}
                  disabled={isInstalling}
                  className="flex-1"
                >
                  {isInstalling ? (
                    <>
                      <Download className="h-4 w-4 mr-2 animate-bounce" />
                      Installing...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Install App
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleDismiss}
                  variant="outline"
                >
                  Later
                </Button>
              </div>
            </div>
          )}

          <div className="text-xs text-muted-foreground text-center">
            Install for the best RevivaTech experience
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PWAInstallPrompt;