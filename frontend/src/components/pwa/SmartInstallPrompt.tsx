'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';

interface InstallPromptProps {
  className?: string;
  onInstallAttempt?: (successful: boolean) => void;
  onDismiss?: () => void;
}

interface UserEngagement {
  pageViews: number;
  timeSpent: number;
  actionsPerformed: number;
  bookingsStarted: number;
  returningUser: boolean;
  lastVisit: number;
}

interface InstallCriteria {
  minPageViews: number;
  minTimeSpent: number; // seconds
  minActions: number;
  waitAfterDismiss: number; // days
  requireHttps: boolean;
  requireStandalone: boolean;
}

export function SmartInstallPrompt({ 
  className = '',
  onInstallAttempt,
  onDismiss 
}: InstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [userEngagement, setUserEngagement] = useState<UserEngagement>({
    pageViews: 0,
    timeSpent: 0,
    actionsPerformed: 0,
    bookingsStarted: 0,
    returningUser: false,
    lastVisit: 0
  });

  // Intelligent install criteria
  const installCriteria: InstallCriteria = {
    minPageViews: 3,
    minTimeSpent: 120, // 2 minutes
    minActions: 5,
    waitAfterDismiss: 7, // 1 week
    requireHttps: true,
    requireStandalone: true
  };

  // Track user engagement
  useEffect(() => {
    const engagement = getStoredEngagement();
    setUserEngagement(engagement);
    
    // Track page view
    engagement.pageViews++;
    updateEngagement(engagement);
    
    // Track time spent
    const startTime = Date.now();
    const timeTracker = setInterval(() => {
      const currentEngagement = getStoredEngagement();
      currentEngagement.timeSpent += 5; // 5 second intervals
      updateEngagement(currentEngagement);
      setUserEngagement(currentEngagement);
    }, 5000);

    // Track user actions
    const actionTracker = (event: Event) => {
      const target = event.target as HTMLElement;
      if (target.closest('button, a, [role="button"]')) {
        const currentEngagement = getStoredEngagement();
        currentEngagement.actionsPerformed++;
        
        // Special tracking for booking-related actions
        if (target.closest('[data-booking-action]')) {
          currentEngagement.bookingsStarted++;
        }
        
        updateEngagement(currentEngagement);
        setUserEngagement(currentEngagement);
      }
    };

    document.addEventListener('click', actionTracker);
    document.addEventListener('touchend', actionTracker);

    return () => {
      clearInterval(timeTracker);
      document.removeEventListener('click', actionTracker);
      document.removeEventListener('touchend', actionTracker);
      
      // Update final time spent
      const finalEngagement = getStoredEngagement();
      finalEngagement.timeSpent += Math.floor((Date.now() - startTime) / 1000);
      finalEngagement.lastVisit = Date.now();
      updateEngagement(finalEngagement);
    };
  }, []);

  // Listen for beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowPrompt(false);
      
      // Track installation
      trackInstallEvent('automatic');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Intelligent prompt timing
  useEffect(() => {
    if (!deferredPrompt || isInstalled) return;

    const checkInstallCriteria = () => {
      // Check basic requirements
      if (!isHttps() && installCriteria.requireHttps) return false;
      if (isStandalone() && installCriteria.requireStandalone) return false;
      
      // Check if recently dismissed
      const lastDismiss = localStorage.getItem('pwa_install_dismissed');
      if (lastDismiss) {
        const daysSinceDismiss = (Date.now() - parseInt(lastDismiss)) / (1000 * 60 * 60 * 24);
        if (daysSinceDismiss < installCriteria.waitAfterDismiss) return false;
      }

      // Check engagement criteria
      const engagement = getStoredEngagement();
      
      // Returning user with higher intent
      if (engagement.returningUser && engagement.bookingsStarted > 0) {
        return true;
      }
      
      // New user with sufficient engagement
      return (
        engagement.pageViews >= installCriteria.minPageViews &&
        engagement.timeSpent >= installCriteria.minTimeSpent &&
        engagement.actionsPerformed >= installCriteria.minActions
      );
    };

    // Check criteria periodically
    const criteriaChecker = setInterval(() => {
      if (checkInstallCriteria()) {
        setShowPrompt(true);
        clearInterval(criteriaChecker);
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(criteriaChecker);
  }, [deferredPrompt, isInstalled, userEngagement]);

  // Handle install prompt
  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        trackInstallEvent('accepted');
        onInstallAttempt?.(true);
        setIsInstalled(true);
      } else {
        trackInstallEvent('dismissed');
        onInstallAttempt?.(false);
        handleDismiss();
      }
      
      setDeferredPrompt(null);
      setShowPrompt(false);
      
    } catch (error) {
      console.error('Install prompt error:', error);
      onInstallAttempt?.(false);
    }
  }, [deferredPrompt, onInstallAttempt]);

  // Handle dismiss
  const handleDismiss = useCallback(() => {
    localStorage.setItem('pwa_install_dismissed', Date.now().toString());
    setShowPrompt(false);
    onDismiss?.();
    
    trackInstallEvent('dismissed');
  }, [onDismiss]);

  // Get optimal prompt message based on user behavior
  const getPromptMessage = (): { title: string; description: string; icon: string } => {
    if (userEngagement.bookingsStarted > 0) {
      return {
        title: 'Quick Access to Your Repairs',
        description: 'Install our app for instant access to booking status and faster service.',
        icon: 'smartphone'
      };
    }
    
    if (userEngagement.returningUser) {
      return {
        title: 'Welcome Back!',
        description: 'Install our app for a faster, more convenient experience.',
        icon: 'download'
      };
    }
    
    return {
      title: 'Install RevivaTech App',
      description: 'Get faster access, offline support, and instant notifications.',
      icon: 'smartphone'
    };
  };

  // Utility functions
  const getStoredEngagement = (): UserEngagement => {
    const stored = localStorage.getItem('user_engagement');
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...parsed,
        returningUser: parsed.pageViews > 0
      };
    }
    return {
      pageViews: 0,
      timeSpent: 0,
      actionsPerformed: 0,
      bookingsStarted: 0,
      returningUser: false,
      lastVisit: 0
    };
  };

  const updateEngagement = (engagement: UserEngagement) => {
    localStorage.setItem('user_engagement', JSON.stringify(engagement));
  };

  const isHttps = (): boolean => {
    return location.protocol === 'https:' || location.hostname === 'localhost';
  };

  const isStandalone = (): boolean => {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  };

  const trackInstallEvent = (action: string) => {
    // Analytics tracking
    if (typeof gtag !== 'undefined') {
      gtag('event', 'pwa_install', {
        event_category: 'PWA',
        event_label: action,
        value: userEngagement.pageViews
      });
    }
    
    console.log('PWA Install Event:', action, { userEngagement });
  };

  // Don't show if already installed or no prompt available
  if (isInstalled || !deferredPrompt) return null;

  const promptContent = getPromptMessage();

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          className={`
            fixed bottom-4 left-4 right-4 z-50
            max-w-sm mx-auto
            ${className}
          `}
          initial={{ y: 100, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 100, opacity: 0, scale: 0.9 }}
          transition={{
            type: 'spring',
            damping: 20,
            stiffness: 300
          }}
        >
          <motion.div
            className="
              bg-white dark:bg-gray-800 
              rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700
              p-4 backdrop-blur-lg
            "
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-xl flex items-center justify-center">
                  <Icon name={promptContent.icon} size={24} className="text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                    {promptContent.title}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                    {promptContent.description}
                  </p>
                </div>
              </div>
              
              <motion.button
                onClick={handleDismiss}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                whileTap={{ scale: 0.9 }}
              >
                <Icon name="x" size={16} className="text-gray-400" />
              </motion.button>
            </div>

            {/* Features */}
            <div className="flex items-center gap-4 mb-4 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Icon name="zap" size={12} />
                <span>Faster</span>
              </div>
              <div className="flex items-center gap-1">
                <Icon name="wifi-off" size={12} />
                <span>Offline</span>
              </div>
              <div className="flex items-center gap-1">
                <Icon name="bell" size={12} />
                <span>Notifications</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <motion.button
                onClick={handleInstall}
                className="
                  flex-1 bg-primary-500 hover:bg-primary-600 text-white 
                  rounded-xl py-3 px-4 font-semibold text-sm
                  transition-colors flex items-center justify-center gap-2
                "
                whileTap={{ scale: 0.98 }}
              >
                <Icon name="download" size={16} />
                Install App
              </motion.button>
              
              <motion.button
                onClick={handleDismiss}
                className="
                  px-4 py-3 text-gray-600 dark:text-gray-300 hover:text-gray-800 
                  dark:hover:text-white text-sm font-medium
                  transition-colors
                "
                whileTap={{ scale: 0.98 }}
              >
                Not Now
              </motion.button>
            </div>

            {/* Engagement Indicator */}
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{userEngagement.pageViews} pages viewed</span>
                <span>{Math.floor(userEngagement.timeSpent / 60)}m on site</span>
                <span>{userEngagement.actionsPerformed} interactions</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// PWA Status Hook
export function usePWAStatus() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      return outcome === 'accepted';
    } catch (error) {
      console.error('Install error:', error);
      return false;
    }
  };

  return {
    isInstalled,
    isInstallable,
    install
  };
}

export default SmartInstallPrompt;