'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Save, RefreshCw, Download, Trash2, Eye, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import MainLayout from '@/components/layout/MainLayout';
import { useConsent } from '@/components/privacy/ConsentManager';

interface ConsentPreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
  functional: boolean;
}

interface DataRequest {
  id: string;
  type: 'access' | 'deletion' | 'portability' | 'rectification';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  created_at: string;
  completed_at?: string;
}

export default function PrivacyPreferencesPage() {
  const { consent, updateConsent, revokeConsent } = useConsent();
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
    personalization: false,
    functional: false
  });
  const [dataRequests, setDataRequests] = useState<DataRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showDataRequestForm, setShowDataRequestForm] = useState(false);
  const [requestEmail, setRequestEmail] = useState('');
  const [requestType, setRequestType] = useState<'access' | 'deletion' | 'portability' | 'rectification'>('access');

  // Load current preferences
  useEffect(() => {
    if (consent?.preferences) {
      setPreferences(consent.preferences);
    }
  }, [consent]);

  // Load data requests
  useEffect(() => {
    loadDataRequests();
  }, []);

  const loadDataRequests = async () => {
    try {
      const response = await fetch('/api/privacy/data-requests');
      if (response.ok) {
        const requests = await response.json();
        setDataRequests(requests);
      }
    } catch (error) {
      console.error('Error loading data requests:', error);
    }
  };

  const handleTogglePreference = (key: keyof ConsentPreferences) => {
    if (key === 'necessary') return; // Can't disable necessary
    
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSavePreferences = async () => {
    setLoading(true);
    try {
      await updateConsent(preferences);
      setMessage({ type: 'success', text: 'Your privacy preferences have been saved successfully.' });
      
      // Clear message after 5 seconds
      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage({ type: 'error', text: 'Failed to save preferences. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeAllConsent = async () => {
    if (!confirm('Are you sure you want to revoke all consent? This will reset all your preferences to the minimum required.')) {
      return;
    }
    
    setLoading(true);
    try {
      await revokeConsent();
      setMessage({ type: 'success', text: 'All consent has been revoked. Only necessary cookies will be used.' });
    } catch (error) {
      console.error('Error revoking consent:', error);
      setMessage({ type: 'error', text: 'Failed to revoke consent. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDataRequest = async (type: string, email: string) => {
    if (!email || !email.includes('@')) {
      setMessage({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('/api/privacy/data-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, requestType: type })
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Data request submitted. Please check your email for verification.' });
        setShowDataRequestForm(false);
        setRequestEmail('');
        loadDataRequests();
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Failed to submit data request.' });
      }
    } catch (error) {
      console.error('Error submitting data request:', error);
      setMessage({ type: 'error', text: 'Failed to submit data request. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const ConsentToggle = ({ 
    title, 
    description, 
    isEnabled, 
    onToggle, 
    isRequired = false,
    details 
  }: {
    title: string;
    description: string;
    isEnabled: boolean;
    onToggle: () => void;
    isRequired?: boolean;
    details?: string;
  }) => (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-2">{title}</h3>
          <p className="text-muted-foreground mb-3">{description}</p>
          {details && (
            <p className="text-sm text-muted-foreground/80">{details}</p>
          )}
          {isRequired && (
            <span className="inline-block mt-2 px-2 py-1 text-xs bg-primary text-primary-foreground rounded">
              Required
            </span>
          )}
        </div>
        
        <div className="ml-4">
          {isRequired ? (
            <div className="w-12 h-6 bg-primary rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-full" />
            </div>
          ) : (
            <button
              onClick={onToggle}
              className={`w-12 h-6 rounded-full transition-colors ${
                isEnabled ? 'bg-primary' : 'bg-muted-foreground/30'
              }`}
              disabled={loading}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${
                isEnabled ? 'translate-x-7' : 'translate-x-1'
              }`} />
            </button>
          )}
        </div>
      </div>
    </Card>
  );

  const RequestStatusBadge = ({ status }: { status: string }) => {
    const variants = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${variants[status as keyof typeof variants]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold">Privacy Preferences</h1>
            </div>
            <p className="text-muted-foreground">
              Control how we use your data and manage your privacy settings. 
              You can change these preferences at any time.
            </p>
          </div>

          {/* Status Message */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* Consent Preferences */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Cookie & Data Processing Preferences</h2>
            
            <div className="space-y-4 mb-6">
              <ConsentToggle
                title="Necessary"
                description="Required for basic website functionality and security"
                details="These cookies are essential for the website to work properly. They include security features, session management, and basic functionality."
                isEnabled={preferences.necessary}
                onToggle={() => {}}
                isRequired={true}
              />
              
              <ConsentToggle
                title="Analytics"
                description="Help us understand how visitors interact with our website"
                details="We use Google Analytics and similar tools to understand usage patterns and improve our services. Data is anonymized and aggregated."
                isEnabled={preferences.analytics}
                onToggle={() => handleTogglePreference('analytics')}
              />
              
              <ConsentToggle
                title="Marketing"
                description="Used to show you relevant ads and measure campaign effectiveness"
                details="Enables personalized advertising and helps us measure the effectiveness of our marketing campaigns across different platforms."
                isEnabled={preferences.marketing}
                onToggle={() => handleTogglePreference('marketing')}
              />
              
              <ConsentToggle
                title="Personalization"
                description="Remember your preferences and provide customized content"
                details="Allows us to customize your experience, remember your preferences, and provide relevant content recommendations."
                isEnabled={preferences.personalization}
                onToggle={() => handleTogglePreference('personalization')}
              />
              
              <ConsentToggle
                title="Functional"
                description="Enable enhanced features like live chat and social media"
                details="Enables additional features like live chat support, social media integration, and enhanced user interface elements."
                isEnabled={preferences.functional}
                onToggle={() => handleTogglePreference('functional')}
              />
            </div>

            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={handleSavePreferences}
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Preferences
              </Button>
              
              <Button 
                variant="outline"
                onClick={handleRevokeAllConsent}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Revoke All Consent
              </Button>
            </div>
          </section>

          {/* Data Rights */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Your Data Rights</h2>
            
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Eye className="w-6 h-6 text-primary" />
                  <h3 className="font-semibold">Access Your Data</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Request a copy of all personal data we have about you
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setRequestType('access');
                    setShowDataRequestForm(true);
                  }}
                >
                  Request Data
                </Button>
              </Card>
              
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Download className="w-6 h-6 text-primary" />
                  <h3 className="font-semibold">Data Portability</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Export your data in a machine-readable format
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setRequestType('portability');
                    setShowDataRequestForm(true);
                  }}
                >
                  Export Data
                </Button>
              </Card>
              
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Trash2 className="w-6 h-6 text-primary" />
                  <h3 className="font-semibold">Delete Your Data</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Request deletion of your personal data (where legally possible)
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setRequestType('deletion');
                    setShowDataRequestForm(true);
                  }}
                >
                  Delete Data
                </Button>
              </Card>
              
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <RefreshCw className="w-6 h-6 text-primary" />
                  <h3 className="font-semibold">Correct Your Data</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Request correction of inaccurate personal data
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setRequestType('rectification');
                    setShowDataRequestForm(true);
                  }}
                >
                  Correct Data
                </Button>
              </Card>
            </div>
          </section>

          {/* Data Request Form */}
          {showDataRequestForm && (
            <Card className="p-6 mb-8">
              <h3 className="font-semibold text-lg mb-4">
                Submit {requestType.charAt(0).toUpperCase() + requestType.slice(1)} Request
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={requestEmail}
                    onChange={(e) => setRequestEmail(e.target.value)}
                    className="w-full p-3 border border-input rounded-md"
                    placeholder="Enter your email address"
                    required
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    We'll send a verification email to this address
                  </p>
                </div>
                
                <div className="flex gap-4">
                  <Button 
                    onClick={() => handleDataRequest(requestType, requestEmail)}
                    disabled={loading || !requestEmail}
                  >
                    {loading ? 'Submitting...' : 'Submit Request'}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setShowDataRequestForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Recent Data Requests */}
          {dataRequests.length > 0 && (
            <section>
              <h2 className="text-2xl font-semibold mb-6">Recent Data Requests</h2>
              
              <div className="space-y-4">
                {dataRequests.map((request) => (
                  <Card key={request.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold capitalize">
                          {request.type} Request
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Submitted on {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <RequestStatusBadge status={request.status} />
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Additional Information */}
          <Card className="p-6 mt-8">
            <h3 className="font-semibold text-lg mb-4">Need Help?</h3>
            <p className="text-muted-foreground mb-4">
              If you have questions about your privacy settings or data rights, 
              please contact our Data Protection Officer.
            </p>
            
            <div className="space-y-2 text-sm">
              <p><strong>Email:</strong> privacy@revivatech.co.uk</p>
              <p><strong>Phone:</strong> 020 7123 4567</p>
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
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
      </div>
    </MainLayout>
  );
}