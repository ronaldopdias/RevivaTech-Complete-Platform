'use client';

import { useState, useEffect } from 'react';

/**
 * Custom hook to detect mobile devices and responsive breakpoints
 * Uses both CSS media queries and user agent detection for comprehensive mobile detection
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    // Function to check if device is mobile based on screen size
    const checkScreenSize = () => {
      if (typeof window === 'undefined') return false;
      
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Mobile: <= 768px
      const isMobileScreen = width <= 768;
      // Tablet: > 768px and <= 1024px
      const isTabletScreen = width > 768 && width <= 1024;
      
      setIsMobile(isMobileScreen);
      setIsTablet(isTabletScreen);
      
      if (isMobileScreen) {
        setScreenSize('mobile');
      } else if (isTabletScreen) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
      }
      
      return isMobileScreen;
    };

    // Function to check if device is mobile based on user agent
    const checkUserAgent = () => {
      if (typeof window === 'undefined') return false;
      
      const userAgent = navigator.userAgent.toLowerCase();
      const mobileKeywords = [
        'android', 'webos', 'iphone', 'ipad', 'ipod', 
        'blackberry', 'windows phone', 'mobile', 'tablet'
      ];
      
      return mobileKeywords.some(keyword => userAgent.includes(keyword));
    };

    // Function to check for touch capability
    const checkTouchCapability = () => {
      if (typeof window === 'undefined') return false;
      
      return (
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore - legacy support
        navigator.msMaxTouchPoints > 0
      );
    };

    // Initial check
    const initialMobileCheck = () => {
      const screenMobile = checkScreenSize();
      const userAgentMobile = checkUserAgent();
      const touchCapable = checkTouchCapability();
      
      // Device is considered mobile if any of these conditions are true
      const deviceIsMobile = screenMobile || userAgentMobile || (touchCapable && window.innerWidth <= 1024);
      
      setIsMobile(deviceIsMobile);
      
      return deviceIsMobile;
    };

    // Run initial check
    initialMobileCheck();

    // Set up resize listener for responsive behavior
    const handleResize = () => {
      checkScreenSize();
    };

    window.addEventListener('resize', handleResize);
    
    // Set up orientation change listener for mobile devices
    const handleOrientationChange = () => {
      // Delay to allow for orientation change to complete
      setTimeout(() => {
        checkScreenSize();
      }, 100);
    };

    window.addEventListener('orientationchange', handleOrientationChange);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return {
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet,
    screenSize,
    // Helper functions
    isMobileOrTablet: isMobile || isTablet,
    isSmallScreen: screenSize === 'mobile',
    isMediumScreen: screenSize === 'tablet',
    isLargeScreen: screenSize === 'desktop'
  };
}

/**
 * Hook to get current window dimensions
 * Useful for responsive design and layout calculations
 */
export function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: 0,
    height: 0
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    }

    // Set initial size
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
}

/**
 * Hook to detect PWA installation status
 * Useful for showing install prompts and PWA-specific features
 */
export function usePWA() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    // Check if running as installed PWA
    const checkInstallStatus = () => {
      // Check if running in standalone mode (iOS)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      
      // Check if running as PWA (Android)
      const isInWebApk = 'standalone' in window.navigator || window.matchMedia('(display-mode: standalone)').matches;
      
      setIsInstalled(isStandalone || isInWebApk);
    };

    checkInstallStatus();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      setIsInstallable(true);
    };

    // Listen for app installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      setIsInstallable(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!installPrompt) return false;

    try {
      // @ts-ignore - beforeinstallprompt event
      const result = await installPrompt.prompt();
      const outcome = await result.userChoice;
      
      setInstallPrompt(null);
      setIsInstallable(false);
      
      return outcome === 'accepted';
    } catch (error) {
      console.error('Error prompting for install:', error);
      return false;
    }
  };

  return {
    isInstalled,
    isInstallable,
    promptInstall
  };
}

/**
 * Hook to detect touch device and handle touch interactions
 * Useful for enabling touch-specific features and gestures
 */
export function useTouch() {
  const [isTouch, setIsTouch] = useState(false);
  const [lastTouch, setLastTouch] = useState<{ x: number; y: number; time: number } | null>(null);

  useEffect(() => {
    const checkTouch = () => {
      const hasTouch = (
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore - legacy support
        navigator.msMaxTouchPoints > 0
      );
      setIsTouch(hasTouch);
    };

    checkTouch();

    // Listen for first touch to confirm touch device
    const handleFirstTouch = (e: TouchEvent) => {
      setIsTouch(true);
      const touch = e.touches[0];
      setLastTouch({
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      });
    };

    document.addEventListener('touchstart', handleFirstTouch, { once: true });

    return () => {
      document.removeEventListener('touchstart', handleFirstTouch);
    };
  }, []);

  return {
    isTouch,
    lastTouch,
    isTouchDevice: isTouch
  };
}