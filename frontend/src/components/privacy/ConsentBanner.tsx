'use client';

import React, { useState, useEffect } from 'react';
import { X, Shield, Settings, Cookie, Eye, Target, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ConsentBanner {
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onCustomize: () => void;
  onClose: () => void;
  isVisible: boolean;
  variant?: 'banner' | 'modal';
}

interface ConsentPreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
  functional: boolean;
}

const ConsentBanner: React.FC<ConsentBanner> = ({
  onAcceptAll,
  onRejectAll,
  onCustomize,
  onClose,
  isVisible,
  variant = 'banner'
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    necessary: true, // Always required
    analytics: false,
    marketing: false,
    personalization: false,
    functional: false
  });

  if (!isVisible) return null;

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
      personalization: true,
      functional: true
    };
    
    // Store consent preferences
    localStorage.setItem('revivatech-consent', JSON.stringify({
      preferences: allAccepted,
      timestamp: new Date().toISOString(),
      version: '1.0'
    }));
    
    onAcceptAll();
  };

  const handleRejectAll = () => {
    const minimal = {
      necessary: true,
      analytics: false,
      marketing: false,
      personalization: false,
      functional: false
    };
    
    localStorage.setItem('revivatech-consent', JSON.stringify({
      preferences: minimal,
      timestamp: new Date().toISOString(),
      version: '1.0'
    }));
    
    onRejectAll();
  };

  const handleSavePreferences = () => {
    localStorage.setItem('revivatech-consent', JSON.stringify({
      preferences,
      timestamp: new Date().toISOString(),
      version: '1.0'
    }));
    
    onCustomize();
  };

  const togglePreference = (key: keyof ConsentPreferences) => {
    if (key === 'necessary') return; // Can't disable necessary cookies
    
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const ConsentOption = ({ 
    icon: Icon, 
    title, 
    description, 
    isRequired = false, 
    isEnabled, 
    onToggle 
  }: {
    icon: React.ElementType;
    title: string;
    description: string;
    isRequired?: boolean;
    isEnabled: boolean;
    onToggle: () => void;
  }) => (
    <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
      <Icon className="w-5 h-5 text-primary mt-0.5" />
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-semibold text-sm">{title}</h4>
          {isRequired ? (
            <span className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded">
              Required
            </span>
          ) : (
            <button
              onClick={onToggle}
              className={`w-10 h-6 rounded-full transition-colors ${
                isEnabled ? 'bg-primary' : 'bg-muted-foreground/30'
              }`}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${
                isEnabled ? 'translate-x-5' : 'translate-x-1'
              }`} />
            </button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );

  const BannerContent = () => (
    <div className="bg-card border-t shadow-lg">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-start gap-3">
            <Shield className="w-6 h-6 text-primary mt-1" />
            <div>
              <h3 className="font-semibold text-lg mb-2">
                We respect your privacy
              </h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-2xl">
                We use cookies and similar technologies to enhance your experience, 
                analyze site usage, and provide personalized content. You can manage 
                your preferences or learn more in our{' '}
                <a href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </a>.
              </p>
              
              {showDetails && (
                <div className="grid gap-3 mb-6">
                  <ConsentOption
                    icon={Shield}
                    title="Necessary"
                    description="Required for basic site functionality and security"
                    isRequired={true}
                    isEnabled={preferences.necessary}
                    onToggle={() => {}}
                  />
                  <ConsentOption
                    icon={BarChart3}
                    title="Analytics"
                    description="Help us understand how visitors interact with our website"
                    isEnabled={preferences.analytics}
                    onToggle={() => togglePreference('analytics')}
                  />
                  <ConsentOption
                    icon={Target}
                    title="Marketing"
                    description="Used to show you relevant ads and measure campaign effectiveness"
                    isEnabled={preferences.marketing}
                    onToggle={() => togglePreference('marketing')}
                  />
                  <ConsentOption
                    icon={Eye}
                    title="Personalization"
                    description="Remember your preferences and provide customized content"
                    isEnabled={preferences.personalization}
                    onToggle={() => togglePreference('personalization')}
                  />
                  <ConsentOption
                    icon={Cookie}
                    title="Functional"
                    description="Enable enhanced features like live chat and social media"
                    isEnabled={preferences.functional}
                    onToggle={() => togglePreference('functional')}
                  />
                </div>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="shrink-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-6">
          <Button onClick={handleAcceptAll} className="font-semibold">
            Accept All
          </Button>
          <Button variant="outline" onClick={handleRejectAll}>
            Reject All
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm"
          >
            <Settings className="w-4 h-4 mr-2" />
            {showDetails ? 'Hide' : 'Customize'}
          </Button>
          
          {showDetails && (
            <Button onClick={handleSavePreferences} variant="outline">
              Save Preferences
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  const ModalContent = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold">Privacy Preferences</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mb-6">
            Choose how we use cookies and similar technologies. You can change these 
            settings anytime in your browser or by visiting our privacy center.
          </p>

          <div className="space-y-4 mb-6">
            <ConsentOption
              icon={Shield}
              title="Necessary"
              description="Required for basic site functionality, security, and legal compliance"
              isRequired={true}
              isEnabled={preferences.necessary}
              onToggle={() => {}}
            />
            <ConsentOption
              icon={BarChart3}
              title="Analytics"
              description="Anonymous usage statistics to improve our services"
              isEnabled={preferences.analytics}
              onToggle={() => togglePreference('analytics')}
            />
            <ConsentOption
              icon={Target}
              title="Marketing"
              description="Targeted advertising and campaign measurement"
              isEnabled={preferences.marketing}
              onToggle={() => togglePreference('marketing')}
            />
            <ConsentOption
              icon={Eye}
              title="Personalization"
              description="Customized content and remember your preferences"
              isEnabled={preferences.personalization}
              onToggle={() => togglePreference('personalization')}
            />
            <ConsentOption
              icon={Cookie}
              title="Functional"
              description="Enhanced features like live chat and social media integration"
              isEnabled={preferences.functional}
              onToggle={() => togglePreference('functional')}
            />
          </div>

          <div className="flex flex-wrap gap-3 pt-4 border-t">
            <Button onClick={handleAcceptAll} className="font-semibold">
              Accept All
            </Button>
            <Button variant="outline" onClick={handleRejectAll}>
              Reject All
            </Button>
            <Button onClick={handleSavePreferences} variant="outline">
              Save Preferences
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground mt-4">
            Learn more in our{' '}
            <a href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </a>{' '}
            and{' '}
            <a href="/terms" className="text-primary hover:underline">
              Terms of Service
            </a>
          </p>
        </div>
      </Card>
    </div>
  );

  return variant === 'banner' ? <BannerContent /> : <ModalContent />;
};

export default ConsentBanner;