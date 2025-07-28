const PrivacyService = require('../services/PrivacyService');

class PrivacyMiddleware {
  constructor() {
    this.privacyService = new PrivacyService();
  }

  // Middleware to check consent before processing analytics
  checkAnalyticsConsent() {
    return async (req, res, next) => {
      try {
        const userId = req.user?.id || req.session?.id;
        const hasConsent = await this.privacyService.hasConsent(userId, 'analytics');
        
        if (!hasConsent) {
          return res.status(403).json({
            error: 'Analytics consent required',
            code: 'ANALYTICS_CONSENT_REQUIRED'
          });
        }
        
        next();
      } catch (error) {
        console.error('Error checking analytics consent:', error);
        next(error);
      }
    };
  }

  // Middleware to check consent before processing marketing data
  checkMarketingConsent() {
    return async (req, res, next) => {
      try {
        const userId = req.user?.id || req.session?.id;
        const hasConsent = await this.privacyService.hasConsent(userId, 'marketing');
        
        if (!hasConsent) {
          return res.status(403).json({
            error: 'Marketing consent required',
            code: 'MARKETING_CONSENT_REQUIRED'
          });
        }
        
        next();
      } catch (error) {
        console.error('Error checking marketing consent:', error);
        next(error);
      }
    };
  }

  // Middleware to check consent before processing personalization
  checkPersonalizationConsent() {
    return async (req, res, next) => {
      try {
        const userId = req.user?.id || req.session?.id;
        const hasConsent = await this.privacyService.hasConsent(userId, 'personalization');
        
        if (!hasConsent) {
          return res.status(403).json({
            error: 'Personalization consent required',
            code: 'PERSONALIZATION_CONSENT_REQUIRED'
          });
        }
        
        next();
      } catch (error) {
        console.error('Error checking personalization consent:', error);
        next(error);
      }
    };
  }

  // Middleware to check consent before processing functional cookies
  checkFunctionalConsent() {
    return async (req, res, next) => {
      try {
        const userId = req.user?.id || req.session?.id;
        const hasConsent = await this.privacyService.hasConsent(userId, 'functional');
        
        if (!hasConsent) {
          return res.status(403).json({
            error: 'Functional consent required',
            code: 'FUNCTIONAL_CONSENT_REQUIRED'
          });
        }
        
        next();
      } catch (error) {
        console.error('Error checking functional consent:', error);
        next(error);
      }
    };
  }

  // Middleware to validate consent data
  validateConsentData() {
    return (req, res, next) => {
      const { preferences, version } = req.body;
      
      if (!preferences || typeof preferences !== 'object') {
        return res.status(400).json({
          error: 'Invalid consent preferences',
          code: 'INVALID_CONSENT_PREFERENCES'
        });
      }
      
      // Validate required fields
      const requiredFields = ['necessary', 'analytics', 'marketing', 'personalization', 'functional'];
      for (const field of requiredFields) {
        if (typeof preferences[field] !== 'boolean') {
          return res.status(400).json({
            error: `Invalid consent preference for ${field}`,
            code: 'INVALID_CONSENT_FIELD'
          });
        }
      }
      
      // Necessary consent must always be true
      if (!preferences.necessary) {
        return res.status(400).json({
          error: 'Necessary consent cannot be false',
          code: 'NECESSARY_CONSENT_REQUIRED'
        });
      }
      
      if (!version || typeof version !== 'string') {
        return res.status(400).json({
          error: 'Consent version is required',
          code: 'CONSENT_VERSION_REQUIRED'
        });
      }
      
      next();
    };
  }

  // Middleware to log consent actions
  logConsentAction() {
    return async (req, res, next) => {
      try {
        const userId = req.user?.id || req.session?.id;
        const sessionId = req.session?.id || req.sessionID;
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('User-Agent');
        
        // Determine geo location (simple implementation)
        const geoLocation = this.getGeoLocation(req);
        
        const consentData = {
          userId,
          sessionId,
          ipAddress,
          userAgent,
          preferences: req.body.preferences,
          actionType: req.body.actionType || 'granted',
          geoLocation,
          version: req.body.version || '1.0'
        };
        
        await this.privacyService.recordConsent(consentData);
        
        next();
      } catch (error) {
        console.error('Error logging consent action:', error);
        next(error);
      }
    };
  }

  // Middleware to handle GDPR/CCPA data requests
  validateDataRequest() {
    return (req, res, next) => {
      const { email, requestType } = req.body;
      
      if (!email || !this.isValidEmail(email)) {
        return res.status(400).json({
          error: 'Valid email address is required',
          code: 'INVALID_EMAIL'
        });
      }
      
      const validRequestTypes = ['access', 'deletion', 'portability', 'rectification'];
      if (!requestType || !validRequestTypes.includes(requestType)) {
        return res.status(400).json({
          error: 'Invalid request type',
          code: 'INVALID_REQUEST_TYPE',
          validTypes: validRequestTypes
        });
      }
      
      next();
    };
  }

  // Middleware to rate limit privacy requests
  rateLimitPrivacyRequests() {
    const requestCounts = new Map();
    
    return (req, res, next) => {
      const identifier = req.ip || req.connection.remoteAddress;
      const now = Date.now();
      const windowMs = 60 * 60 * 1000; // 1 hour
      const maxRequests = 5; // Max 5 requests per hour
      
      if (!requestCounts.has(identifier)) {
        requestCounts.set(identifier, []);
      }
      
      const userRequests = requestCounts.get(identifier);
      
      // Remove old requests outside the window
      const recentRequests = userRequests.filter(time => now - time < windowMs);
      
      if (recentRequests.length >= maxRequests) {
        return res.status(429).json({
          error: 'Too many privacy requests',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil(windowMs / 1000)
        });
      }
      
      recentRequests.push(now);
      requestCounts.set(identifier, recentRequests);
      
      next();
    };
  }

  // Middleware to add privacy headers
  addPrivacyHeaders() {
    return (req, res, next) => {
      // Add security headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      
      // Add privacy-specific headers
      res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), browsing-topics=()');
      
      next();
    };
  }

  // Middleware to handle Do Not Track
  handleDoNotTrack() {
    return (req, res, next) => {
      const dnt = req.get('DNT');
      if (dnt === '1') {
        req.doNotTrack = true;
        // Override consent for tracking
        req.body.preferences = {
          necessary: true,
          analytics: false,
          marketing: false,
          personalization: false,
          functional: false
        };
      }
      next();
    };
  }

  // Middleware to handle Global Privacy Control
  handleGlobalPrivacyControl() {
    return (req, res, next) => {
      const gpc = req.get('Sec-GPC');
      if (gpc === '1') {
        req.globalPrivacyControl = true;
        // Override consent for sale/sharing of data
        if (req.body.preferences) {
          req.body.preferences.marketing = false;
          req.body.preferences.personalization = false;
        }
      }
      next();
    };
  }

  // Utility methods
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  getGeoLocation(req) {
    // Simple geo detection based on headers
    const cfCountry = req.get('CF-IPCountry');
    const xForwardedFor = req.get('X-Forwarded-For');
    
    if (cfCountry) {
      return cfCountry;
    }
    
    // Fallback to timezone-based detection
    const timezone = req.get('X-Timezone');
    if (timezone) {
      if (timezone.startsWith('Europe/')) return 'EU';
      if (timezone.includes('Los_Angeles') || timezone.includes('Pacific')) return 'US-CA';
      if (timezone.startsWith('America/')) return 'US';
    }
    
    return 'UNKNOWN';
  }

  // Express route handlers
  getRoutes() {
    return {
      // Save consent
      saveConsent: [
        this.addPrivacyHeaders(),
        this.handleDoNotTrack(),
        this.handleGlobalPrivacyControl(),
        this.validateConsentData(),
        this.logConsentAction(),
        async (req, res) => {
          try {
            res.json({
              success: true,
              message: 'Consent saved successfully'
            });
          } catch (error) {
            console.error('Error saving consent:', error);
            res.status(500).json({
              error: 'Failed to save consent',
              code: 'CONSENT_SAVE_ERROR'
            });
          }
        }
      ],

      // Revoke consent
      revokeConsent: [
        this.addPrivacyHeaders(),
        async (req, res) => {
          try {
            const userId = req.user?.id || req.session?.id;
            const sessionId = req.session?.id || req.sessionID;
            const ipAddress = req.ip || req.connection.remoteAddress;
            const userAgent = req.get('User-Agent');
            
            await this.privacyService.recordConsent({
              userId,
              sessionId,
              ipAddress,
              userAgent,
              preferences: {
                necessary: true,
                analytics: false,
                marketing: false,
                personalization: false,
                functional: false
              },
              actionType: 'revoked',
              geoLocation: this.getGeoLocation(req),
              version: '1.0'
            });
            
            res.json({
              success: true,
              message: 'Consent revoked successfully'
            });
          } catch (error) {
            console.error('Error revoking consent:', error);
            res.status(500).json({
              error: 'Failed to revoke consent',
              code: 'CONSENT_REVOKE_ERROR'
            });
          }
        }
      ],

      // Create data request
      createDataRequest: [
        this.addPrivacyHeaders(),
        this.rateLimitPrivacyRequests(),
        this.validateDataRequest(),
        async (req, res) => {
          try {
            const result = await this.privacyService.createDataRequest(req.body);
            res.json({
              success: true,
              requestId: result.id,
              message: 'Data request created. Please check your email for verification.'
            });
          } catch (error) {
            console.error('Error creating data request:', error);
            res.status(500).json({
              error: 'Failed to create data request',
              code: 'DATA_REQUEST_ERROR'
            });
          }
        }
      ],

      // Get privacy dashboard
      getPrivacyDashboard: [
        this.addPrivacyHeaders(),
        async (req, res) => {
          try {
            const userId = req.user?.id || req.session?.id;
            const dashboard = await this.privacyService.getPrivacyDashboard(userId);
            res.json(dashboard);
          } catch (error) {
            console.error('Error getting privacy dashboard:', error);
            res.status(500).json({
              error: 'Failed to get privacy dashboard',
              code: 'PRIVACY_DASHBOARD_ERROR'
            });
          }
        }
      ]
    };
  }
}

module.exports = PrivacyMiddleware;