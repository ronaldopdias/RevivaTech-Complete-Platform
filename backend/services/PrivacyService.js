const crypto = require('crypto');
const { Pool } = require('pg');
const Redis = require('redis');

class PrivacyService {
  constructor() {
    this.db = new Pool({
      user: process.env.DB_USER || 'revivatech',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'revivatech',
      password: process.env.DB_PASSWORD || 'revivatech_password',
      port: process.env.DB_PORT || 5435,
    });

    this.redis = Redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6383
    });

    this.initializeDatabase();
  }

  async initializeDatabase() {
    try {
      // Create consent audit table
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS consent_audit (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR(255),
          session_id VARCHAR(255),
          ip_address INET,
          user_agent TEXT,
          consent_data JSONB NOT NULL,
          action_type VARCHAR(50) NOT NULL, -- 'granted', 'updated', 'revoked'
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          geo_location VARCHAR(10),
          version VARCHAR(20),
          legal_basis VARCHAR(50),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create data retention policies table
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS data_retention_policies (
          id SERIAL PRIMARY KEY,
          data_type VARCHAR(100) NOT NULL,
          retention_period_days INTEGER NOT NULL,
          legal_basis VARCHAR(100),
          description TEXT,
          auto_delete BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create user data requests table (for GDPR/CCPA requests)
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS user_data_requests (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR(255),
          email VARCHAR(255),
          request_type VARCHAR(50) NOT NULL, -- 'access', 'deletion', 'portability', 'rectification'
          status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'rejected'
          request_data JSONB,
          response_data JSONB,
          verification_token VARCHAR(255),
          verified_at TIMESTAMP WITH TIME ZONE,
          completed_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Insert default retention policies
      await this.db.query(`
        INSERT INTO data_retention_policies (data_type, retention_period_days, legal_basis, description)
        VALUES 
          ('service_records', 2555, 'Legal obligation', 'Service records kept for 7 years for warranty and legal compliance'),
          ('financial_records', 2190, 'Legal obligation', 'Financial records kept for 6 years as required by UK tax law'),
          ('marketing_data', 365, 'Consent', 'Marketing data kept for 1 year or until consent withdrawn'),
          ('analytics_data', 790, 'Legitimate interest', 'Analytics data kept for 26 months'),
          ('cctv_footage', 30, 'Legitimate interest', 'CCTV footage kept for 30 days unless required for investigation'),
          ('session_data', 30, 'Legitimate interest', 'Session data kept for 30 days'),
          ('audit_logs', 2555, 'Legal obligation', 'Audit logs kept for 7 years for compliance')
        ON CONFLICT DO NOTHING
      `);

      console.log('Privacy service database initialized successfully');
    } catch (error) {
      console.error('Error initializing privacy service database:', error);
    }
  }

  // Record consent action
  async recordConsent(consentData) {
    try {
      const {
        userId,
        sessionId,
        ipAddress,
        userAgent,
        preferences,
        actionType,
        geoLocation,
        version,
        legalBasis = 'consent'
      } = consentData;

      // Hash IP address for privacy
      const hashedIp = crypto.createHash('sha256').update(ipAddress || '').digest('hex');

      const result = await this.db.query(`
        INSERT INTO consent_audit (
          user_id, session_id, ip_address, user_agent, consent_data, 
          action_type, geo_location, version, legal_basis
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, timestamp
      `, [
        userId,
        sessionId,
        hashedIp,
        userAgent,
        JSON.stringify(preferences),
        actionType,
        geoLocation,
        version,
        legalBasis
      ]);

      // Cache current consent for quick access
      if (userId) {
        await this.redis.setex(
          `consent:${userId}`,
          3600, // 1 hour cache
          JSON.stringify({
            preferences,
            timestamp: result.rows[0].timestamp,
            version
          })
        );
      }

      return result.rows[0];
    } catch (error) {
      console.error('Error recording consent:', error);
      throw error;
    }
  }

  // Get user consent status
  async getUserConsent(userId) {
    try {
      // Try cache first
      const cached = await this.redis.get(`consent:${userId}`);
      if (cached) {
        return JSON.parse(cached);
      }

      // Query database
      const result = await this.db.query(`
        SELECT consent_data, timestamp, version
        FROM consent_audit 
        WHERE user_id = $1 
        ORDER BY timestamp DESC 
        LIMIT 1
      `, [userId]);

      if (result.rows.length > 0) {
        const consent = {
          preferences: result.rows[0].consent_data,
          timestamp: result.rows[0].timestamp,
          version: result.rows[0].version
        };

        // Cache for future requests
        await this.redis.setex(`consent:${userId}`, 3600, JSON.stringify(consent));

        return consent;
      }

      return null;
    } catch (error) {
      console.error('Error getting user consent:', error);
      throw error;
    }
  }

  // Check if user has specific consent
  async hasConsent(userId, consentType) {
    try {
      const consent = await this.getUserConsent(userId);
      return consent && consent.preferences[consentType] === true;
    } catch (error) {
      console.error('Error checking consent:', error);
      return false;
    }
  }

  // Create data request (GDPR/CCPA)
  async createDataRequest(requestData) {
    try {
      const {
        userId,
        email,
        requestType,
        additionalData = {}
      } = requestData;

      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');

      const result = await this.db.query(`
        INSERT INTO user_data_requests (
          user_id, email, request_type, request_data, verification_token
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING id, verification_token
      `, [
        userId,
        email,
        requestType,
        JSON.stringify(additionalData),
        verificationToken
      ]);

      // Send verification email (would integrate with email service)
      await this.sendVerificationEmail(email, verificationToken, requestType);

      return result.rows[0];
    } catch (error) {
      console.error('Error creating data request:', error);
      throw error;
    }
  }

  // Verify data request
  async verifyDataRequest(token) {
    try {
      const result = await this.db.query(`
        UPDATE user_data_requests 
        SET verified_at = CURRENT_TIMESTAMP, status = 'processing'
        WHERE verification_token = $1 AND verified_at IS NULL
        RETURNING id, request_type, email
      `, [token]);

      if (result.rows.length > 0) {
        const request = result.rows[0];
        
        // Process the request based on type
        await this.processDataRequest(request.id, request.request_type);
        
        return request;
      }

      return null;
    } catch (error) {
      console.error('Error verifying data request:', error);
      throw error;
    }
  }

  // Process data request
  async processDataRequest(requestId, requestType) {
    try {
      switch (requestType) {
        case 'access':
          await this.processAccessRequest(requestId);
          break;
        case 'deletion':
          await this.processDeletionRequest(requestId);
          break;
        case 'portability':
          await this.processPortabilityRequest(requestId);
          break;
        case 'rectification':
          await this.processRectificationRequest(requestId);
          break;
        default:
          throw new Error(`Unknown request type: ${requestType}`);
      }
    } catch (error) {
      console.error('Error processing data request:', error);
      
      // Mark request as failed
      await this.db.query(`
        UPDATE user_data_requests 
        SET status = 'rejected', response_data = $1
        WHERE id = $2
      `, [JSON.stringify({ error: error.message }), requestId]);
    }
  }

  // Process access request (GDPR Article 15)
  async processAccessRequest(requestId) {
    try {
      const request = await this.db.query(`
        SELECT user_id, email FROM user_data_requests WHERE id = $1
      `, [requestId]);

      if (request.rows.length === 0) return;

      const userId = request.rows[0].user_id;
      const email = request.rows[0].email;

      // Collect all user data
      const userData = await this.collectUserData(userId, email);

      // Update request with response
      await this.db.query(`
        UPDATE user_data_requests 
        SET status = 'completed', response_data = $1, completed_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [JSON.stringify(userData), requestId]);

      // Send data to user (would integrate with email service)
      await this.sendUserData(email, userData);
    } catch (error) {
      console.error('Error processing access request:', error);
      throw error;
    }
  }

  // Process deletion request (GDPR Article 17)
  async processDeletionRequest(requestId) {
    try {
      const request = await this.db.query(`
        SELECT user_id, email FROM user_data_requests WHERE id = $1
      `, [requestId]);

      if (request.rows.length === 0) return;

      const userId = request.rows[0].user_id;
      const email = request.rows[0].email;

      // Perform data deletion (with exceptions for legal obligations)
      await this.deleteUserData(userId, email);

      // Update request status
      await this.db.query(`
        UPDATE user_data_requests 
        SET status = 'completed', completed_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [requestId]);
    } catch (error) {
      console.error('Error processing deletion request:', error);
      throw error;
    }
  }

  // Collect all user data for access request
  async collectUserData(userId, email) {
    try {
      const userData = {
        personal_information: {},
        service_records: [],
        consent_history: [],
        analytics_data: {},
        marketing_data: {},
        collection_timestamp: new Date().toISOString()
      };

      // Get consent history
      const consentHistory = await this.db.query(`
        SELECT consent_data, action_type, timestamp, geo_location, version
        FROM consent_audit 
        WHERE user_id = $1 OR user_id = $2
        ORDER BY timestamp DESC
      `, [userId, email]);

      userData.consent_history = consentHistory.rows;

      // Add other data collection logic here...
      
      return userData;
    } catch (error) {
      console.error('Error collecting user data:', error);
      throw error;
    }
  }

  // Delete user data with legal exceptions
  async deleteUserData(userId, email) {
    try {
      // Delete data that can be deleted (respect legal obligations)
      const deletableTables = [
        'marketing_preferences',
        'analytics_sessions',
        'user_preferences',
        'newsletter_subscriptions'
      ];

      for (const table of deletableTables) {
        try {
          await this.db.query(`
            DELETE FROM ${table} 
            WHERE user_id = $1 OR email = $2
          `, [userId, email]);
        } catch (error) {
          console.warn(`Error deleting from ${table}:`, error);
        }
      }

      // Anonymize data that must be retained
      const anonymizeTables = [
        'service_records',
        'financial_records',
        'audit_logs'
      ];

      for (const table of anonymizeTables) {
        try {
          await this.db.query(`
            UPDATE ${table} 
            SET user_id = 'anonymized_' || id, 
                email = 'anonymized@example.com',
                personal_data = NULL
            WHERE user_id = $1 OR email = $2
          `, [userId, email]);
        } catch (error) {
          console.warn(`Error anonymizing ${table}:`, error);
        }
      }

      // Clear Redis cache
      await this.redis.del(`consent:${userId}`);
    } catch (error) {
      console.error('Error deleting user data:', error);
      throw error;
    }
  }

  // Auto-delete expired data based on retention policies
  async cleanupExpiredData() {
    try {
      const policies = await this.db.query(`
        SELECT data_type, retention_period_days 
        FROM data_retention_policies 
        WHERE auto_delete = true
      `);

      for (const policy of policies.rows) {
        const retentionDate = new Date();
        retentionDate.setDate(retentionDate.getDate() - policy.retention_period_days);

        // This would need to be customized based on your actual table structure
        console.log(`Cleaning up ${policy.data_type} data older than ${retentionDate}`);
        
        // Example cleanup logic would go here
      }
    } catch (error) {
      console.error('Error cleaning up expired data:', error);
    }
  }

  // Placeholder for email integration
  async sendVerificationEmail(email, token, requestType) {
    // Would integrate with your email service
    console.log(`Sending verification email to ${email} for ${requestType} request`);
    console.log(`Verification link: ${process.env.BASE_URL}/verify-data-request/${token}`);
  }

  async sendUserData(email, userData) {
    // Would integrate with your email service to send user data
    console.log(`Sending user data to ${email}`);
  }

  // Get privacy dashboard data
  async getPrivacyDashboard(userId) {
    try {
      const consent = await this.getUserConsent(userId);
      
      const recentActivity = await this.db.query(`
        SELECT action_type, timestamp, geo_location
        FROM consent_audit 
        WHERE user_id = $1 
        ORDER BY timestamp DESC 
        LIMIT 10
      `, [userId]);

      const dataRequests = await this.db.query(`
        SELECT request_type, status, created_at, completed_at
        FROM user_data_requests 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT 5
      `, [userId]);

      return {
        current_consent: consent,
        recent_activity: recentActivity.rows,
        data_requests: dataRequests.rows,
        retention_policies: await this.getRetentionPolicies()
      };
    } catch (error) {
      console.error('Error getting privacy dashboard:', error);
      throw error;
    }
  }

  async getRetentionPolicies() {
    try {
      const result = await this.db.query(`
        SELECT data_type, retention_period_days, legal_basis, description
        FROM data_retention_policies 
        ORDER BY data_type
      `);
      return result.rows;
    } catch (error) {
      console.error('Error getting retention policies:', error);
      return [];
    }
  }
}

module.exports = PrivacyService;