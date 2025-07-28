'use client';

import { useState, useEffect } from 'react';
import { HelpCircle, X, ChevronRight, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface ContextualHelpProps {
  page: string;
  section?: string;
  position?: 'right' | 'left' | 'bottom';
  trigger?: 'hover' | 'click' | 'auto';
  className?: string;
}

interface HelpTip {
  id: string;
  title: string;
  content: string;
  page: string;
  section?: string;
  priority: 'high' | 'medium' | 'low';
  type: 'tip' | 'warning' | 'info' | 'tutorial';
  actions?: {
    label: string;
    action: () => void;
    type: 'primary' | 'secondary';
  }[];
  learnMoreUrl?: string;
}

// Contextual help content for different pages and sections
const helpContent: HelpTip[] = [
  // Booking page help
  {
    id: 'booking-device-selection',
    title: 'Selecting Your Device',
    content: 'Choose your device from our comprehensive database. If you can\'t find your exact model, search by brand and year, or contact support for assistance.',
    page: 'booking',
    section: 'device-selection',
    priority: 'high',
    type: 'tip',
    actions: [
      {
        label: 'Browse Devices',
        action: () => window.location.href = '/devices',
        type: 'primary',
      },
    ],
  },
  {
    id: 'booking-pricing',
    title: 'Understanding Pricing',
    content: 'Our quotes are estimates based on common repair scenarios. Final pricing is confirmed after device inspection and typically within 10% of the initial quote.',
    page: 'booking',
    section: 'pricing',
    priority: 'high',
    type: 'info',
    learnMoreUrl: '/help/pricing-explained',
  },
  {
    id: 'booking-service-levels',
    title: 'Service Level Options',
    content: 'Standard service is our best value option. Choose Express (+50%) or Same Day (+100%) for urgent repairs.',
    page: 'booking',
    section: 'service-levels',
    priority: 'medium',
    type: 'tip',
  },
  
  // Customer portal help
  {
    id: 'portal-tracking',
    title: 'Real-Time Tracking',
    content: 'Track your repair progress in real-time. You\'ll receive notifications at each stage, and you can communicate directly with your technician.',
    page: 'customer-portal',
    section: 'tracking',
    priority: 'high',
    type: 'tutorial',
    actions: [
      {
        label: 'View Guide',
        action: () => window.open('/help/customer-portal'),
        type: 'secondary',
      },
    ],
  },
  {
    id: 'portal-communication',
    title: 'Technician Chat',
    content: 'Use the chat feature to communicate directly with your assigned technician. Share photos, ask questions, and get updates on your repair.',
    page: 'customer-portal',
    section: 'communication',
    priority: 'medium',
    type: 'tip',
  },
  
  // Payment help
  {
    id: 'payment-security',
    title: 'Secure Payments',
    content: 'All payments are processed securely through Stripe with bank-level encryption. We don\'t store your payment details.',
    page: 'payment',
    section: 'security',
    priority: 'high',
    type: 'info',
  },
  {
    id: 'payment-methods',
    title: 'Payment Options',
    content: 'We accept all major credit cards, debit cards, PayPal, Apple Pay, and Google Pay. Business customers can also pay by bank transfer.',
    page: 'payment',
    section: 'methods',
    priority: 'medium',
    type: 'tip',
  },
  
  // Admin dashboard help
  {
    id: 'admin-overview',
    title: 'Dashboard Overview',
    content: 'Monitor real-time metrics, manage bookings, and track team performance from this central dashboard.',
    page: 'admin',
    section: 'overview',
    priority: 'high',
    type: 'tutorial',
    learnMoreUrl: '/help/admin-guide',
  },
  {
    id: 'admin-analytics',
    title: 'Analytics & Reporting',
    content: 'Access comprehensive analytics including revenue metrics, customer insights, and operational performance indicators.',
    page: 'admin',
    section: 'analytics',
    priority: 'medium',
    type: 'tip',
  },
];

const ContextualHelp = ({ 
  page, 
  section, 
  position = 'right', 
  trigger = 'click',
  className = ''
}: ContextualHelpProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [helpTips, setHelpTips] = useState<HelpTip[]>([]);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  // Filter help content based on page and section
  useEffect(() => {
    const relevantTips = helpContent.filter(tip => {
      if (tip.page !== page) return false;
      if (section && tip.section && tip.section !== section) return false;
      return true;
    }).sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
    
    setHelpTips(relevantTips);
    setCurrentTipIndex(0);
  }, [page, section]);

  // Auto-show help for first-time users
  useEffect(() => {
    if (trigger === 'auto' && helpTips.length > 0) {
      const hasSeenHelp = localStorage.getItem(`help-seen-${page}-${section}`);
      if (!hasSeenHelp) {
        setIsOpen(true);
        localStorage.setItem(`help-seen-${page}-${section}`, 'true');
      }
    }
  }, [page, section, trigger, helpTips]);

  const handleTrigger = () => {
    if (trigger === 'click') {
      setIsOpen(!isOpen);
    }
  };

  const handleMouseEnter = () => {
    if (trigger === 'hover') {
      setIsOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (trigger === 'hover') {
      setIsOpen(false);
    }
  };

  const nextTip = () => {
    if (currentTipIndex < helpTips.length - 1) {
      setCurrentTipIndex(currentTipIndex + 1);
    }
  };

  const previousTip = () => {
    if (currentTipIndex > 0) {
      setCurrentTipIndex(currentTipIndex - 1);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return '⚠️';
      case 'tutorial':
        return '🎯';
      case 'info':
        return 'ℹ️';
      default:
        return '💡';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'tutorial':
        return 'border-blue-200 bg-blue-50';
      case 'info':
        return 'border-gray-200 bg-gray-50';
      default:
        return 'border-green-200 bg-green-50';
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'left':
        return 'right-full mr-2 top-0';
      case 'bottom':
        return 'top-full mt-2 left-0';
      default:
        return 'left-full ml-2 top-0';
    }
  };

  if (helpTips.length === 0) {
    return null;
  }

  const currentTip = helpTips[currentTipIndex];

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Trigger button */}
      <button
        onClick={handleTrigger}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="text-gray-400 hover:text-blue-600 transition-colors focus:outline-none focus:text-blue-600"
        aria-label="Get help"
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      {/* Help tooltip */}
      {isOpen && currentTip && (
        <div 
          className={`absolute z-50 w-80 ${getPositionClasses()}`}
          onMouseEnter={trigger === 'hover' ? handleMouseEnter : undefined}
          onMouseLeave={trigger === 'hover' ? handleMouseLeave : undefined}
        >
          <Card className={`p-4 shadow-lg border-l-4 ${getTypeColor(currentTip.type)}`}>
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{getTypeIcon(currentTip.type)}</span>
                <h3 className="font-semibold text-gray-900 text-sm">{currentTip.title}</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <p className="text-sm text-gray-700 mb-4 leading-relaxed">
              {currentTip.content}
            </p>

            {/* Actions */}
            {currentTip.actions && currentTip.actions.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {currentTip.actions.map((action, index) => (
                  <Button
                    key={index}
                    size="sm"
                    variant={action.type === 'primary' ? 'primary' : 'secondary'}
                    onClick={action.action}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            )}

            {/* Learn more link */}
            {currentTip.learnMoreUrl && (
              <div className="mb-4">
                <a
                  href={currentTip.learnMoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
                >
                  <span>Learn more</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {/* Navigation */}
            {helpTips.length > 1 && (
              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={previousTip}
                    disabled={currentTipIndex === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={nextTip}
                    disabled={currentTipIndex === helpTips.length - 1}
                  >
                    Next
                  </Button>
                </div>
                <span className="text-xs text-gray-500">
                  {currentTipIndex + 1} of {helpTips.length}
                </span>
              </div>
            )}

            {/* Arrow pointer */}
            <div className={`absolute w-2 h-2 bg-white border transform rotate-45 ${
              position === 'left' ? 'right-0 top-4 -mr-1 border-r-0 border-b-0' :
              position === 'bottom' ? 'top-0 left-4 -mt-1 border-t-0 border-l-0' :
              'left-0 top-4 -ml-1 border-l-0 border-t-0'
            }`} />
          </Card>
        </div>
      )}
    </div>
  );
};

// Helper component for marking sections that have contextual help
export const HelpSection = ({ 
  children, 
  page, 
  section, 
  helpPosition = 'right',
  className = ''
}: {
  children: React.ReactNode;
  page: string;
  section: string;
  helpPosition?: 'right' | 'left' | 'bottom';
  className?: string;
}) => {
  return (
    <div className={`relative ${className}`}>
      {children}
      <div className="absolute top-2 right-2">
        <ContextualHelp 
          page={page} 
          section={section} 
          position={helpPosition}
          trigger="click"
        />
      </div>
    </div>
  );
};

// Hook for programmatic help content management
export const useContextualHelp = (page: string, section?: string) => {
  const [isVisible, setIsVisible] = useState(false);
  
  const showHelp = () => setIsVisible(true);
  const hideHelp = () => setIsVisible(false);
  
  const getHelpTips = () => {
    return helpContent.filter(tip => {
      if (tip.page !== page) return false;
      if (section && tip.section && tip.section !== section) return false;
      return true;
    });
  };

  return {
    isVisible,
    showHelp,
    hideHelp,
    getHelpTips,
  };
};

export default ContextualHelp;