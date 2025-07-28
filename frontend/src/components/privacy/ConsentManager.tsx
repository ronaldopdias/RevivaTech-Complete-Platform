'use client';

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import ConsentBanner from './ConsentBanner';

interface ConsentPreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
  functional: boolean;
}

interface ConsentData {
  preferences: ConsentPreferences;
  timestamp: string;
  version: string;
  userAgent?: string;
  location?: string;
  geoConsent?: boolean;
}

interface ConsentContextType {
  consent: ConsentData | null;
  hasConsent: boolean;
  isLoading: boolean;
  updateConsent: (preferences: Partial<ConsentPreferences>) => void;
  revokeConsent: () => void;
  showConsentBanner: () => void;
  hideConsentBanner: () => void;
  canUseAnalytics: boolean;
  canUseMarketing: boolean;
  canUsePersonalization: boolean;
  canUseFunctional: boolean;
}

const ConsentContext = createContext<ConsentContextType | undefined>(undefined);

export const useConsent = () => {
  const context = useContext(ConsentContext);
  if (!context) {
    throw new Error('useConsent must be used within a ConsentProvider');
  }
  return context;
};

interface ConsentProviderProps {
  children: React.ReactNode;
  autoShow?: boolean;
  showDelayMs?: number;
  version?: string;
  onConsentChange?: (consent: ConsentData) => void;
  onConsentRequired?: () => void;
}

const DEFAULT_PREFERENCES: ConsentPreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
  personalization: false,
  functional: false
};

export const ConsentProvider: React.FC<ConsentProviderProps> = ({
  children,
  autoShow = true,
  showDelayMs = 1000,
  version = '1.0',
  onConsentChange,
  onConsentRequired
}) => {
  const [consent, setConsent] = useState<ConsentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showBanner, setShowBanner] = useState(false);
  const [hasShownBanner, setHasShownBanner] = useState(false);

  // Check if user is in EU/EEA (simple detection)
  const isEUUser = useCallback(() => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const euTimezones = [
      'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Madrid',
      'Europe/Rome', 'Europe/Amsterdam', 'Europe/Vienna', 'Europe/Warsaw',
      'Europe/Prague', 'Europe/Budapest', 'Europe/Bucharest', 'Europe/Athens',
      'Europe/Stockholm', 'Europe/Copenhagen', 'Europe/Oslo', 'Europe/Helsinki',
      'Europe/Dublin', 'Europe/Brussels', 'Europe/Zurich', 'Europe/Lisbon'
    ];
    return euTimezones.includes(timezone);
  }, []);

  // Check if user is in California (CCPA)
  const isCCPAUser = useCallback(() => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return timezone.includes('Los_Angeles') || timezone.includes('Pacific');
  }, []);

  // Load existing consent from localStorage
  useEffect(() => {
    const loadConsent = () => {
      try {
        const stored = localStorage.getItem('revivatech-consent');
        if (stored) {
          const parsed = JSON.parse(stored);
          
          // Check if consent is still valid (not expired, correct version)
          const consentDate = new Date(parsed.timestamp);
          const now = new Date();
          const thirteenMonths = 13 * 30 * 24 * 60 * 60 * 1000; // 13 months in ms
          
          if (
            now.getTime() - consentDate.getTime() < thirteenMonths &&
            parsed.version === version
          ) {
            setConsent(parsed);
            setIsLoading(false);
            return;
          }
        }
      } catch (error) {
        console.warn('Error loading consent:', error);
      }
      
      setIsLoading(false);
    };

    loadConsent();
  }, [version]);

  // Auto-show banner if needed
  useEffect(() => {
    if (
      !isLoading &&
      !consent &&
      autoShow &&
      !hasShownBanner &&
      (isEUUser() || isCCPAUser())
    ) {
      const timer = setTimeout(() => {
        setShowBanner(true);
        setHasShownBanner(true);
        onConsentRequired?.();
      }, showDelayMs);

      return () => clearTimeout(timer);
    }
  }, [isLoading, consent, autoShow, hasShownBanner, showDelayMs, isEUUser, isCCPAUser, onConsentRequired]);

  const saveConsent = useCallback((preferences: ConsentPreferences) => {
    const consentData: ConsentData = {
      preferences,
      timestamp: new Date().toISOString(),
      version,
      userAgent: navigator.userAgent,
      location: Intl.DateTimeFormat().resolvedOptions().timeZone,
      geoConsent: isEUUser() || isCCPAUser()
    };

    try {
      localStorage.setItem('revivatech-consent', JSON.stringify(consentData));
      setConsent(consentData);
      
      // Also save to backend for audit trail
      if (typeof window !== 'undefined') {
        fetch('/api/consent/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(consentData)
        }).catch(error => {
          console.warn('Failed to save consent to backend:', error);
        });
      }
      
      onConsentChange?.(consentData);
    } catch (error) {
      console.error('Failed to save consent:', error);
    }
  }, [version, isEUUser, isCCPAUser, onConsentChange]);

  const updateConsent = useCallback((preferences: Partial<ConsentPreferences>) => {
    const currentPrefs = consent?.preferences || DEFAULT_PREFERENCES;
    const newPrefs = { ...currentPrefs, ...preferences, necessary: true };
    saveConsent(newPrefs);
  }, [consent, saveConsent]);

  const revokeConsent = useCallback(() => {
    try {
      localStorage.removeItem('revivatech-consent');
      setConsent(null);
      setShowBanner(true);
      
      // Notify backend
      if (typeof window !== 'undefined') {
        fetch('/api/consent/revoke', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
          })
        }).catch(error => {
          console.warn('Failed to notify backend of consent revocation:', error);
        });
      }
      
      onConsentChange?.(null as any);
    } catch (error) {
      console.error('Failed to revoke consent:', error);
    }
  }, [onConsentChange]);

  const showConsentBanner = useCallback(() => {
    setShowBanner(true);
  }, []);

  const hideConsentBanner = useCallback(() => {
    setShowBanner(false);
  }, []);

  const handleAcceptAll = useCallback(() => {
    saveConsent({
      necessary: true,
      analytics: true,
      marketing: true,
      personalization: true,
      functional: true
    });
    setShowBanner(false);
  }, [saveConsent]);

  const handleRejectAll = useCallback(() => {
    saveConsent(DEFAULT_PREFERENCES);
    setShowBanner(false);
  }, [saveConsent]);

  const handleCustomize = useCallback(() => {
    // Banner handles saving in this case
    setShowBanner(false);
  }, []);

  const contextValue: ConsentContextType = {
    consent,
    hasConsent: !!consent,
    isLoading,
    updateConsent,
    revokeConsent,
    showConsentBanner,
    hideConsentBanner,
    canUseAnalytics: consent?.preferences.analytics ?? false,
    canUseMarketing: consent?.preferences.marketing ?? false,
    canUsePersonalization: consent?.preferences.personalization ?? false,
    canUseFunctional: consent?.preferences.functional ?? false
  };

  return (
    <ConsentContext.Provider value={contextValue}>
      {children}
      <ConsentBanner
        isVisible={showBanner}
        onAcceptAll={handleAcceptAll}
        onRejectAll={handleRejectAll}
        onCustomize={handleCustomize}
        onClose={hideConsentBanner}
        variant="banner"
      />
    </ConsentContext.Provider>
  );
};

// Privacy Preference Center Component
export const PrivacyPreferenceCenter: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const { consent, updateConsent, revokeConsent } = useConsent();
  
  if (!isOpen) return null;

  return (
    <ConsentBanner
      isVisible={true}
      onAcceptAll={() => {
        updateConsent({
          analytics: true,
          marketing: true,
          personalization: true,
          functional: true
        });
        onClose();
      }}
      onRejectAll={() => {
        updateConsent({
          analytics: false,
          marketing: false,
          personalization: false,
          functional: false
        });
        onClose();
      }}
      onCustomize={() => {
        onClose();
      }}
      onClose={onClose}
      variant="modal"
    />
  );
};

// Utility hook for conditional rendering based on consent
export const useConditionalRender = (consentType: keyof ConsentPreferences) => {
  const { consent } = useConsent();
  
  return useCallback((component: React.ReactNode) => {
    if (!consent) return null;
    return consent.preferences[consentType] ? component : null;
  }, [consent, consentType]);
};

// Component wrapper for conditional rendering
export const ConsentGate: React.FC<{
  type: keyof ConsentPreferences;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ type, children, fallback = null }) => {
  const { consent } = useConsent();
  
  if (!consent) return fallback;
  return consent.preferences[type] ? <>{children}</> : fallback;
};

export default ConsentManager;