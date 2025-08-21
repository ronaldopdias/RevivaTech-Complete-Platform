/**
 * Consent Manager Component
 * GDPR/CCPA compliant consent management for customer intelligence
 * Part of Phase 8 R1 implementation
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/Badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Shield, 
  Eye, 
  BarChart3, 
  Mail, 
  Settings,
  Check,
  X,
  Info
} from 'lucide-react';

interface ConsentSettings {
  analytics: boolean;
  fingerprinting: boolean;
  marketing: boolean;
  necessary: boolean; // Always true, non-toggleable
}

interface ConsentManagerProps {
  onConsentUpdate?: (consents: ConsentSettings) => void;
  showBanner?: boolean;
  position?: 'bottom' | 'top';
  className?: string;
}

// Note: "Analytics consent not granted" console messages are expected GDPR compliance behavior
// This ensures analytics only initialize after explicit user consent
const ConsentManager: React.FC<ConsentManagerProps> = ({
  onConsentUpdate,
  showBanner = true,
  position = 'bottom',
  className = ''
}) => {
  const [consents, setConsents] = useState<ConsentSettings>({
    analytics: false,
    fingerprinting: false,
    marketing: false,
    necessary: true
  });
  const [showConsentBanner, setShowConsentBanner] = useState(false);
  const [showDetailedSettings, setShowDetailedSettings] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Load saved consents on mount
  useEffect(() => {
    const savedConsents = loadSavedConsents();
    if (savedConsents) {
      setConsents(savedConsents);
      setHasInteracted(true);
    } else {
      // Show banner if no previous consent
      if (showBanner) {
        setShowConsentBanner(true);
      }
    }
  }, [showBanner]);

  // Save consents to localStorage
  const saveConsents = (newConsents: ConsentSettings) => {
    const consentData = {
      consents: newConsents,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
    localStorage.setItem('revivatech_consent', JSON.stringify(consentData));
    
    // Individual consent flags for easier access
    Object.entries(newConsents).forEach(([key, value]) => {
      localStorage.setItem(`consent_${key}`, value.toString());
    });
  };

  // Load saved consents from localStorage
  const loadSavedConsents = (): ConsentSettings | null => {
    try {
      const saved = localStorage.getItem('revivatech_consent');
      if (saved) {
        const data = JSON.parse(saved);
        return data.consents;
      }
    } catch (error) {
      console.error('Error loading saved consents:', error);
    }
    return null;
  };

  // Handle consent update
  const updateConsents = (newConsents: ConsentSettings) => {
    setConsents(newConsents);
    saveConsents(newConsents);
    setHasInteracted(true);
    
    if (onConsentUpdate) {
      onConsentUpdate(newConsents);
    }
  };

  // Accept all consents
  const acceptAll = () => {
    const allConsents: ConsentSettings = {
      analytics: true,
      fingerprinting: true,
      marketing: true,
      necessary: true
    };
    updateConsents(allConsents);
    setShowConsentBanner(false);
  };

  // Accept only necessary
  const acceptNecessary = () => {
    const necessaryOnly: ConsentSettings = {
      analytics: false,
      fingerprinting: false,
      marketing: false,
      necessary: true
    };
    updateConsents(necessaryOnly);
    setShowConsentBanner(false);
  };

  // Toggle individual consent
  const toggleConsent = (type: keyof ConsentSettings) => {
    if (type === 'necessary') return; // Can't toggle necessary
    
    const newConsents = {
      ...consents,
      [type]: !consents[type]
    };
    updateConsents(newConsents);
  };

  // Save detailed settings
  const saveDetailedSettings = () => {
    setShowDetailedSettings(false);
    setShowConsentBanner(false);
  };

  // Get consent status badge
  const getConsentStatusBadge = () => {
    const activeConsents = Object.entries(consents).filter(([key, value]) => value && key !== 'necessary').length;
    const totalConsents = 3; // analytics, fingerprinting, marketing
    
    if (activeConsents === totalConsents) {
      return <Badge className="bg-green-100 text-green-800">All consents granted</Badge>;
    } else if (activeConsents > 0) {
      return <Badge className="bg-yellow-100 text-yellow-800">Partial consents</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800">Essential only</Badge>;
    }
  };

  const consentDetails = [
    {
      key: 'necessary' as keyof ConsentSettings,
      title: 'Necessary Cookies',
      description: 'Essential for the website to function properly. These cannot be disabled.',
      icon: Shield,
      color: 'text-green-600',
      required: true,
      examples: ['Session management', 'Security', 'Basic functionality']
    },
    {
      key: 'analytics' as keyof ConsentSettings,
      title: 'Analytics & Performance',
      description: 'Help us understand how you use our website to improve your experience.',
      icon: BarChart3,
      color: 'text-blue-600',
      required: false,
      examples: ['Page views', 'User behavior', 'Performance metrics']
    },
    {
      key: 'fingerprinting' as keyof ConsentSettings,
      title: 'Device Fingerprinting',
      description: 'Advanced tracking to provide personalized experiences and prevent fraud.',
      icon: Eye,
      color: 'text-purple-600',
      required: false,
      examples: ['Device identification', 'Personalization', 'Security']
    },
    {
      key: 'marketing' as keyof ConsentSettings,
      title: 'Marketing & Advertising',
      description: 'Personalized content and targeted advertisements based on your interests.',
      icon: Mail,
      color: 'text-orange-600',
      required: false,
      examples: ['Email campaigns', 'Targeted ads', 'Social media tracking']
    }
  ];

  return (
    <div className={className}>
      {/* Consent Banner */}
      {showConsentBanner && (
        <div className={`fixed inset-x-0 z-50 p-4 ${position === 'bottom' ? 'bottom-0' : 'top-0'}`}>
          <Card className="mx-auto max-w-4xl border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    We value your privacy
                  </h3>
                  <p className="text-blue-800 text-sm mb-4">
                    We use cookies and similar technologies to improve your experience, 
                    analyze site traffic, and provide personalized content. You can choose 
                    which categories to allow.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      onClick={acceptAll}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Accept All
                    </Button>
                    <Button 
                      onClick={acceptNecessary}
                      variant="outline"
                      className="border-blue-300 text-blue-700 hover:bg-blue-50"
                    >
                      Necessary Only
                    </Button>
                    <Button 
                      onClick={() => setShowDetailedSettings(true)}
                      variant="outline"
                      className="border-blue-300 text-blue-700 hover:bg-blue-50"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Customize
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Settings Modal */}
      <Dialog open={showDetailedSettings} onOpenChange={setShowDetailedSettings}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Privacy Settings</span>
            </DialogTitle>
            <DialogDescription>
              Manage your privacy preferences. You can change these settings at any time.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {consentDetails.map((detail) => (
              <Card key={detail.key} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className={`p-2 rounded-full bg-gray-100 ${detail.color}`}>
                        <detail.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-gray-900">{detail.title}</h4>
                          {detail.required && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                              Required
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{detail.description}</p>
                        <div className="flex flex-wrap gap-1">
                          {detail.examples.map((example, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {example}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {consents[detail.key] ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <X className="w-4 h-4 text-red-600" />
                      )}
                      <Switch
                        checked={consents[detail.key]}
                        onCheckedChange={() => toggleConsent(detail.key)}
                        disabled={detail.required}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <DialogFooter className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Info className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                Changes are saved automatically
              </span>
            </div>
            <Button onClick={saveDetailedSettings}>
              Save Preferences
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Consent Status Indicator (for settings page) */}
      {hasInteracted && !showConsentBanner && (
        <Card className="border-dashed">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">Privacy Settings</p>
                  <p className="text-sm text-gray-600">Manage your consent preferences</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {getConsentStatusBadge()}
                <Button 
                  onClick={() => setShowDetailedSettings(true)}
                  variant="outline"
                  size="sm"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Manage
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Hook for checking consent status
export const useConsent = () => {
  const [consents, setConsents] = useState<ConsentSettings>({
    analytics: false,
    fingerprinting: false,
    marketing: false,
    necessary: true
  });

  useEffect(() => {
    const loadConsents = () => {
      try {
        const saved = localStorage.getItem('revivatech_consent');
        if (saved) {
          const data = JSON.parse(saved);
          setConsents(data.consents);
        }
      } catch (error) {
        console.error('Error loading consents:', error);
      }
    };

    loadConsents();

    // Listen for consent changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'revivatech_consent') {
        loadConsents();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const hasConsent = (type: keyof ConsentSettings): boolean => {
    return consents[type];
  };

  const updateConsent = (type: keyof ConsentSettings, granted: boolean) => {
    if (type === 'necessary') return; // Can't change necessary
    
    const newConsents = { ...consents, [type]: granted };
    setConsents(newConsents);
    
    // Save to localStorage
    const consentData = {
      consents: newConsents,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
    localStorage.setItem('revivatech_consent', JSON.stringify(consentData));
    localStorage.setItem(`consent_${type}`, granted.toString());
  };

  return {
    consents,
    hasConsent,
    updateConsent,
    hasInteracted: Object.values(consents).some(Boolean)
  };
};

export default ConsentManager;