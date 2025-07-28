'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { MessageSquare, X, Minimize2, Maximize2 } from 'lucide-react';

interface ChatwootConfig {
  websiteToken: string;
  baseUrl: string;
  hasUserSession: boolean;
  authToken?: string;
  user?: {
    identifier: string;
    name: string;
    email: string;
    avatar_url?: string;
    phone_number?: string;
  };
  customAttributes?: Record<string, any>;
  locale?: string;
  type?: 'standard' | 'expanded_bubble';
  darkMode?: 'auto' | 'light' | 'dark';
}

interface ChatwootWidgetProps {
  config: Partial<ChatwootConfig>;
  className?: string;
  autoOpen?: boolean;
  showBranding?: boolean;
  position?: 'left' | 'right';
}

declare global {
  interface Window {
    chatwootSDK: any;
    $chatwoot: any;
    chatwootSettings: any;
  }
}

export const ChatwootWidget: React.FC<ChatwootWidgetProps> = ({
  config,
  className = '',
  autoOpen = false,
  showBranding = true,
  position = 'right'
}) => {
  const { user, isAuthenticated } = useAuth();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  const defaultConfig: ChatwootConfig = {
    websiteToken: process.env.NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN || 'your-website-token',
    baseUrl: process.env.NEXT_PUBLIC_CHATWOOT_BASE_URL || 'https://app.chatwoot.com',
    hasUserSession: isAuthenticated,
    locale: 'en',
    type: 'expanded_bubble',
    darkMode: 'auto',
    ...config
  };

  // Auto-authenticate users
  useEffect(() => {
    if (isAuthenticated && user && isScriptLoaded) {
      const userData = {
        identifier: user.id || user.email,
        name: user.name || '',
        email: user.email || '',
        avatar_url: user.avatar || '',
        phone_number: user.phone || ''
      };

      // Set user data in Chatwoot
      if (window.$chatwoot) {
        window.$chatwoot.setUser(userData.identifier, userData);
        
        // Set custom attributes for repair context
        window.$chatwoot.setCustomAttributes({
          user_type: user.role || 'customer',
          registration_date: user.createdAt || new Date().toISOString(),
          total_repairs: user.totalRepairs || 0,
          account_type: 'authenticated',
          user_id: user.id
        });
      }
    }
  }, [isAuthenticated, user, isScriptLoaded]);

  // Load Chatwoot script
  useEffect(() => {
    if (isScriptLoaded) return;

    const script = document.createElement('script');
    script.src = `${defaultConfig.baseUrl}/packs/js/sdk.js`;
    script.defer = true;
    script.async = true;
    
    script.onload = () => {
      setIsScriptLoaded(true);
      
      // Initialize Chatwoot
      window.chatwootSettings = {
        hideMessageBubble: true, // We'll use custom trigger
        position: position, // 'left' or 'right'
        locale: defaultConfig.locale,
        type: defaultConfig.type,
        darkMode: defaultConfig.darkMode,
        showBranding: showBranding
      };

      if (window.chatwootSDK) {
        window.chatwootSDK.run({
          websiteToken: defaultConfig.websiteToken,
          baseUrl: defaultConfig.baseUrl
        });

        // Setup event listeners
        window.addEventListener('chatwoot:ready', () => {
          setIsLoaded(true);
          
          if (autoOpen) {
            window.$chatwoot.toggle('open');
          }
        });

        window.addEventListener('chatwoot:on-message', (event: any) => {
          if (event.detail?.type === 'incoming') {
            setUnreadCount(prev => prev + 1);
          }
        });

        window.addEventListener('chatwoot:on-bubble-click', () => {
          setUnreadCount(0);
        });
      }
    };

    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [defaultConfig.websiteToken, defaultConfig.baseUrl, defaultConfig.locale, position, showBranding, autoOpen, isScriptLoaded]);

  const handleToggleChat = () => {
    if (window.$chatwoot) {
      window.$chatwoot.toggle();
      setUnreadCount(0);
    }
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  if (!isLoaded) {
    return (
      <div className={`fixed bottom-4 ${position === 'left' ? 'left-4' : 'right-4'} z-50 ${className}`}>
        <div className="bg-blue-600 text-white p-3 rounded-full shadow-lg animate-pulse">
          <MessageSquare className="h-6 w-6" />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Custom Chat Bubble */}
      <div className={`fixed bottom-4 ${position === 'left' ? 'left-4' : 'right-4'} z-50 ${className}`}>
        {!isMinimized && (
          <div className="mb-4">
            {/* Chat Preview/Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                    <MessageSquare className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                      Need Help?
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      We're here to assist you
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleMinimize}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <Minimize2 className="h-4 w-4" />
                </button>
              </div>
              
              {isAuthenticated ? (
                <div className="space-y-2">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    👋 Hi {user?.name}! How can we help with your repairs today?
                  </p>
                  <div className="flex flex-wrap gap-1">
                    <button 
                      onClick={() => {
                        window.$chatwoot.setCustomAttributes({ 
                          inquiry_type: 'repair_status' 
                        });
                        handleToggleChat();
                      }}
                      className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                    >
                      Check Repair Status
                    </button>
                    <button 
                      onClick={() => {
                        window.$chatwoot.setCustomAttributes({ 
                          inquiry_type: 'new_booking' 
                        });
                        handleToggleChat();
                      }}
                      className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded hover:bg-green-100 transition-colors"
                    >
                      Book Repair
                    </button>
                    <button 
                      onClick={() => {
                        window.$chatwoot.setCustomAttributes({ 
                          inquiry_type: 'technical_support' 
                        });
                        handleToggleChat();
                      }}
                      className="text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded hover:bg-purple-100 transition-colors"
                    >
                      Technical Help
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Get instant help with device repairs, quotes, and technical support.
                  </p>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => {
                        window.$chatwoot.setCustomAttributes({ 
                          inquiry_type: 'general_inquiry',
                          user_status: 'guest'
                        });
                        handleToggleChat();
                      }}
                      className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                    >
                      Get Quote
                    </button>
                    <button 
                      onClick={() => {
                        window.$chatwoot.setCustomAttributes({ 
                          inquiry_type: 'pre_sales'
                        });
                        handleToggleChat();
                      }}
                      className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded hover:bg-green-100 transition-colors"
                    >
                      Ask Questions
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Chat Button */}
        <button
          onClick={isMinimized ? handleMinimize : handleToggleChat}
          className="relative bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all duration-200 hover:scale-105"
        >
          {isMinimized ? (
            <Maximize2 className="h-6 w-6" />
          ) : (
            <MessageSquare className="h-6 w-6" />
          )}
          
          {unreadCount > 0 && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}
        </button>
      </div>

      {/* Keyboard Shortcut Hint */}
      <div className={`fixed bottom-20 ${position === 'left' ? 'left-4' : 'right-4'} z-40`}>
        <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity">
          Press Ctrl+/ to open chat
        </div>
      </div>
    </>
  );
};

// Keyboard shortcut handler
export const ChatwootKeyboardShortcut: React.FC = () => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === '/') {
        event.preventDefault();
        if (window.$chatwoot) {
          window.$chatwoot.toggle();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return null;
};

export default ChatwootWidget;