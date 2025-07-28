'use client';

import React, { useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';

interface ChatAuthConfig {
  enableSSO?: boolean;
  jwtSecret?: string;
  customIdentifierKey?: string;
  syncUserData?: boolean;
  autoCreateContacts?: boolean;
}

interface ChatAuthenticationProps {
  config?: ChatAuthConfig;
  onAuthSuccess?: (user: any) => void;
  onAuthError?: (error: any) => void;
}

// JWT token generation for Chatwoot SSO
const generateJWTToken = (user: any, secret: string): string => {
  // In a real implementation, this would be done server-side
  // This is a simplified client-side version for demo purposes
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const payload = {
    identifier: user.id || user.email,
    name: user.name,
    email: user.email,
    avatar_url: user.avatar || '',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours
  };

  // Note: In production, JWT should be generated server-side
  return btoa(JSON.stringify(header)) + '.' + btoa(JSON.stringify(payload)) + '.signature';
};

export const ChatAuthentication: React.FC<ChatAuthenticationProps> = ({
  config = {},
  onAuthSuccess,
  onAuthError
}) => {
  const { user, isAuthenticated, authToken } = useAuth();

  const {
    enableSSO = true,
    jwtSecret = process.env.NEXT_PUBLIC_CHATWOOT_JWT_SECRET || '',
    customIdentifierKey = 'email',
    syncUserData = true,
    autoCreateContacts = true
  } = config;

  // Auto-authenticate user when they log in
  useEffect(() => {
    if (!isAuthenticated || !user || !window.$chatwoot) return;

    try {
      // Set user identity in Chatwoot
      const userIdentifier = user[customIdentifierKey as keyof typeof user] || user.email || user.id;
      
      const userData = {
        identifier: userIdentifier,
        name: user.name || '',
        email: user.email || '',
        avatar_url: user.avatar || '',
        phone_number: user.phone || ''
      };

      // Generate JWT for SSO if enabled
      if (enableSSO && jwtSecret) {
        const jwtToken = generateJWTToken(user, jwtSecret);
        userData.identifier_hash = jwtToken;
      }

      // Set user in Chatwoot
      window.$chatwoot.setUser(userIdentifier, userData);

      // Set custom attributes for better context
      const customAttributes = {
        user_type: user.role || 'customer',
        account_status: user.status || 'active',
        registration_date: user.createdAt || new Date().toISOString(),
        last_login: new Date().toISOString(),
        total_repairs: user.totalRepairs || 0,
        total_spent: user.totalSpent || 0,
        preferred_contact: user.preferredContact || 'email',
        auth_method: 'web_app',
        session_id: authToken ? btoa(authToken).slice(0, 10) : undefined
      };

      // Add repair-specific context if available
      if (user.activeRepairs?.length > 0) {
        customAttributes.active_repairs = user.activeRepairs.length;
        customAttributes.latest_repair_id = user.activeRepairs[0].id;
        customAttributes.latest_repair_status = user.activeRepairs[0].status;
      }

      window.$chatwoot.setCustomAttributes(customAttributes);

      // Set locale if available
      if (user.locale) {
        window.$chatwoot.setLocale(user.locale);
      }

      console.log('Chat authentication successful for user:', userIdentifier);
      onAuthSuccess?.(userData);

    } catch (error) {
      console.error('Chat authentication failed:', error);
      onAuthError?.(error);
    }
  }, [isAuthenticated, user, authToken, enableSSO, jwtSecret, customIdentifierKey, onAuthSuccess, onAuthError]);

  // Handle user logout
  useEffect(() => {
    if (!isAuthenticated && window.$chatwoot) {
      // Reset user session in Chatwoot
      window.$chatwoot.reset();
      
      // Set as anonymous user
      window.$chatwoot.setCustomAttributes({
        user_type: 'anonymous',
        auth_method: 'guest',
        session_start: new Date().toISOString()
      });
    }
  }, [isAuthenticated]);

  // Set up conversation context based on current page
  useEffect(() => {
    if (!window.$chatwoot) return;

    const path = window.location.pathname;
    const contextAttributes: Record<string, any> = {
      current_page: path,
      page_title: document.title,
      timestamp: new Date().toISOString()
    };

    // Add context based on current page
    if (path.includes('/dashboard')) {
      contextAttributes.context = 'customer_dashboard';
      contextAttributes.intent = 'support_existing_repair';
    } else if (path.includes('/book')) {
      contextAttributes.context = 'booking_flow';
      contextAttributes.intent = 'new_repair_booking';
    } else if (path.includes('/repair')) {
      contextAttributes.context = 'repair_services';
      contextAttributes.intent = 'repair_information';
    } else if (path.includes('/about') || path.includes('/contact')) {
      contextAttributes.context = 'company_info';
      contextAttributes.intent = 'general_inquiry';
    } else {
      contextAttributes.context = 'website_navigation';
      contextAttributes.intent = 'general_browsing';
    }

    window.$chatwoot.setCustomAttributes(contextAttributes);
  }, []);

  // This component doesn't render anything visible
  return null;
};

// Hook for chat authentication status
export const useChatAuth = () => {
  const { user, isAuthenticated } = useAuth();
  const [isChatAuthenticated, setIsChatAuthenticated] = React.useState(false);
  const [chatUser, setChatUser] = React.useState<any>(null);

  useEffect(() => {
    if (!window.$chatwoot) return;

    // Listen for Chatwoot events
    const handleChatwootReady = () => {
      if (isAuthenticated && user) {
        setIsChatAuthenticated(true);
        setChatUser(user);
      }
    };

    const handleChatwootReset = () => {
      setIsChatAuthenticated(false);
      setChatUser(null);
    };

    window.addEventListener('chatwoot:ready', handleChatwootReady);
    window.addEventListener('chatwoot:reset', handleChatwootReset);

    return () => {
      window.removeEventListener('chatwoot:ready', handleChatwootReady);
      window.removeEventListener('chatwoot:reset', handleChatwootReset);
    };
  }, [isAuthenticated, user]);

  const updateChatContext = (context: Record<string, any>) => {
    if (window.$chatwoot) {
      window.$chatwoot.setCustomAttributes(context);
    }
  };

  const sendChatMessage = (message: string) => {
    if (window.$chatwoot) {
      window.$chatwoot.toggle('open');
      // Note: Direct message sending might not be available in all Chatwoot versions
      // This would typically be handled through the widget interface
    }
  };

  return {
    isChatAuthenticated,
    chatUser,
    updateChatContext,
    sendChatMessage
  };
};

export default ChatAuthentication;