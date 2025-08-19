const { Pool } = require('pg');
const Redis = require('redis');
const crypto = require('crypto');
const { EventEmitter } = require('events');

class PrivacyAuditService extends EventEmitter {
  constructor() {
    super();
    
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

    this.initializeAuditSystem();
  }

  async initializeAuditSystem() {
    try {
      // Create audit tables
      await this.createAuditTables();
      
      // Initialize audit event listeners
      this.setupAuditEventListeners();
      
      console.log('Privacy audit system initialized successfully');
    } catch (error) {
      console.error('Error initializing privacy audit system:', error);
    }
  }

  async createAuditTables() {
    try {
      // Main audit log table
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS privacy_audit_log (
          id SERIAL PRIMARY KEY,
          event_type VARCHAR(100) NOT NULL,
          user_id VARCHAR(255),
          session_id VARCHAR(255),
          ip_address_hash VARCHAR(64),
          user_agent_hash VARCHAR(64),
          event_data JSONB NOT NULL,
          legal_basis VARCHAR(50),
          processing_purpose VARCHAR(200),
          data_subject_rights VARCHAR(100),
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          compliance_status VARCHAR(20) DEFAULT 'compliant',
          retention_until DATE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          INDEX (user_id),
          INDEX (event_type),
          INDEX (timestamp),
          INDEX (legal_basis)
        )
      `);

      // Data processing activities log
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS data_processing_log (
          id SERIAL PRIMARY KEY,
          processing_activity VARCHAR(100) NOT NULL,
          data_categories TEXT[],
          processing_purposes TEXT[],
          legal_basis VARCHAR(50),
          data_subjects VARCHAR(100),
          data_recipients TEXT[],
          third_country_transfers BOOLEAN DEFAULT false,
          safeguards_applied TEXT[],
          retention_period VARCHAR(100),
          data_volume_estimate VARCHAR(50),
          risk_assessment JSONB,
          security_measures TEXT[],
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Consent audit table (enhanced)
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS consent_audit_detailed (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR(255),
          consent_id VARCHAR(255),
          consent_type VARCHAR(50),
          consent_status VARCHAR(20),
          consent_mechanism VARCHAR(50),
          consent_evidence JSONB,
          processing_purposes TEXT[],
          data_categories TEXT[],
          withdrawal_mechanism VARCHAR(50),
          consent_expiry DATE,
          renewal_required BOOLEAN DEFAULT false,
          ip_address_hash VARCHAR(64),
          user_agent_hash VARCHAR(64),
          geo_location VARCHAR(10),
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          withdrawn_at TIMESTAMP WITH TIME ZONE,
          withdrawn_reason VARCHAR(200),
          INDEX (user_id),
          INDEX (consent_type),
          INDEX (timestamp)
        )
      `);

      // Data breach incidents
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS data_breach_incidents (
          id SERIAL PRIMARY KEY,
          incident_id VARCHAR(100) UNIQUE,
          breach_type VARCHAR(50),
          discovery_date TIMESTAMP WITH TIME ZONE,
          breach_date TIMESTAMP WITH TIME ZONE,
          data_categories_affected TEXT[],
          affected_data_subjects_count INTEGER,
          likely_consequences TEXT,
          measures_taken TEXT[],
          authority_notified BOOLEAN DEFAULT false,
          authority_notification_date TIMESTAMP WITH TIME ZONE,
          data_subjects_notified BOOLEAN DEFAULT false,
          data_subjects_notification_date TIMESTAMP WITH TIME ZONE,
          severity_level VARCHAR(20),
          status VARCHAR(20) DEFAULT 'investigating',
          incident_details JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Data subject rights requests audit
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS data_rights_requests_audit (
          id SERIAL PRIMARY KEY,
          request_id VARCHAR(100),
          user_id VARCHAR(255),
          request_type VARCHAR(50),
          request_channel VARCHAR(50),
          verification_method VARCHAR(50),
          verification_status VARCHAR(20),
          processing_time_hours INTEGER,
          response_method VARCHAR(50),
          response_format VARCHAR(50),
          data_provided JSONB,
          partial_response BOOLEAN DEFAULT false,
          partial_response_reason TEXT,
          third_party_involved BOOLEAN DEFAULT false,
          third_party_details JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          responded_at TIMESTAMP WITH TIME ZONE,
          INDEX (request_id),
          INDEX (user_id),
          INDEX (request_type)
        )
      `);

      // Privacy impact assessments
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS privacy_impact_assessments (
          id SERIAL PRIMARY KEY,
          assessment_id VARCHAR(100) UNIQUE,
          processing_activity VARCHAR(200),
          assessment_date DATE,
          assessor_name VARCHAR(100),
          data_categories TEXT[],
          data_subjects TEXT[],
          processing_purposes TEXT[],
          legal_basis VARCHAR(50),
          necessity_proportionality JSONB,
          risks_identified JSONB,
          mitigation_measures JSONB,
          residual_risks JSONB,
          consultation_required BOOLEAN DEFAULT false,
          consultation_details TEXT,
          approval_status VARCHAR(20) DEFAULT 'pending',
          approved_by VARCHAR(100),
          approved_at TIMESTAMP WITH TIME ZONE,
          review_date DATE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Compliance monitoring
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS compliance_monitoring (
          id SERIAL PRIMARY KEY,
          monitoring_date DATE,
          compliance_area VARCHAR(100),
          check_type VARCHAR(50),
          check_result VARCHAR(20),
          findings JSONB,
          recommendations JSONB,
          action_items JSONB,
          next_review_date DATE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);

      console.log('Privacy audit tables created successfully');
    } catch (error) {
      console.error('Error creating audit tables:', error);
    }
  }

  setupAuditEventListeners() {
    // Listen for consent events
    this.on('consent-granted', (data) => this.logConsentEvent(data));
    this.on('consent-updated', (data) => this.logConsentEvent(data));
    this.on('consent-withdrawn', (data) => this.logConsentEvent(data));
    
    // Listen for data processing events
    this.on('data-processed', (data) => this.logDataProcessing(data));
    this.on('data-accessed', (data) => this.logDataAccess(data));
    this.on('data-deleted', (data) => this.logDataDeletion(data));
    
    // Listen for data rights requests
    this.on('rights-request-received', (data) => this.logRightsRequest(data));
    this.on('rights-request-processed', (data) => this.logRightsRequest(data));
    
    // Listen for security events
    this.on('data-breach-detected', (data) => this.logDataBreach(data));
    this.on('unauthorized-access', (data) => this.logSecurityEvent(data));
  }

  // Generate hash for PII to maintain privacy in audit logs
  generateHash(data) {
    return crypto.createHash('sha256').update(data || '').digest('hex');
  }

  // Log consent events
  async logConsentEvent(data) {
    try {
      const {
        userId,
        sessionId,
        ipAddress,
        userAgent,
        consentType,
        consentStatus,
        consentMechanism,
        consentEvidence,
        processingPurposes,
        dataCategories,
        geoLocation
      } = data;

      // Log to privacy audit log
      await this.db.query(`
        INSERT INTO privacy_audit_log (
          event_type, user_id, session_id, ip_address_hash, user_agent_hash,
          event_data, legal_basis, processing_purpose, data_subject_rights
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        `consent-${consentStatus}`,
        userId,
        sessionId,
        this.generateHash(ipAddress),
        this.generateHash(userAgent),
        JSON.stringify({
          consentType,
          consentStatus,
          consentMechanism,
          consentEvidence,
          processingPurposes,
          dataCategories,
          geoLocation
        }),
        'consent',
        processingPurposes?.join(', ') || 'website_functionality',
        'consent_management'
      ]);

      // Log to detailed consent audit
      await this.db.query(`
        INSERT INTO consent_audit_detailed (
          user_id, consent_type, consent_status, consent_mechanism,
          consent_evidence, processing_purposes, data_categories,
          ip_address_hash, user_agent_hash, geo_location
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        userId,
        consentType,
        consentStatus,
        consentMechanism,
        JSON.stringify(consentEvidence),
        processingPurposes || [],
        dataCategories || [],
        this.generateHash(ipAddress),
        this.generateHash(userAgent),
        geoLocation
      ]);

      // Cache for quick access
      await this.redis.setex(
        `audit:consent:${userId}:${consentType}`,
        3600,
        JSON.stringify({ consentStatus, timestamp: new Date().toISOString() })
      );

    } catch (error) {
      console.error('Error logging consent event:', error);
    }
  }

  // Log data processing activities
  async logDataProcessing(data) {
    try {
      const {
        userId,
        sessionId,
        processingActivity,
        dataCategories,
        processingPurposes,
        legalBasis,
        dataVolume,
        processingLocation,
        thirdPartyInvolved
      } = data;

      await this.db.query(`
        INSERT INTO privacy_audit_log (
          event_type, user_id, session_id, event_data, legal_basis, processing_purpose
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        'data-processing',
        userId,
        sessionId,
        JSON.stringify({
          processingActivity,
          dataCategories,
          processingPurposes,
          dataVolume,
          processingLocation,
          thirdPartyInvolved
        }),
        legalBasis,
        processingPurposes?.join(', ')
      ]);

    } catch (error) {
      console.error('Error logging data processing:', error);
    }
  }

  // Log data access events
  async logDataAccess(data) {
    try {
      const {
        userId,
        sessionId,
        ipAddress,
        userAgent,
        dataAccessed,
        accessPurpose,
        accessMethod,
        dataVolume
      } = data;

      await this.db.query(`
        INSERT INTO privacy_audit_log (
          event_type, user_id, session_id, ip_address_hash, user_agent_hash,
          event_data, processing_purpose
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        'data-access',
        userId,
        sessionId,
        this.generateHash(ipAddress),
        this.generateHash(userAgent),
        JSON.stringify({
          dataAccessed,
          accessPurpose,
          accessMethod,
          dataVolume
        }),
        accessPurpose
      ]);

    } catch (error) {
      console.error('Error logging data access:', error);
    }
  }

  // Log data deletion events
  async logDataDeletion(data) {
    try {
      const {
        userId,
        sessionId,
        deletionReason,
        dataCategories,
        deletionMethod,
        dataVolume,
        retentionOverride
      } = data;

      await this.db.query(`
        INSERT INTO privacy_audit_log (
          event_type, user_id, session_id, event_data, data_subject_rights
        ) VALUES ($1, $2, $3, $4, $5)
      `, [
        'data-deletion',
        userId,
        sessionId,
        JSON.stringify({
          deletionReason,
          dataCategories,
          deletionMethod,
          dataVolume,
          retentionOverride
        }),
        'right_to_erasure'
      ]);

    } catch (error) {
      console.error('Error logging data deletion:', error);
    }
  }

  // Log data rights requests
  async logRightsRequest(data) {
    try {
      const {
        requestId,
        userId,
        requestType,
        requestChannel,
        verificationMethod,
        verificationStatus,
        processingTimeHours,
        responseMethod,
        dataProvided,
        partialResponse,
        thirdPartyInvolved
      } = data;

      await this.db.query(`
        INSERT INTO data_rights_requests_audit (
          request_id, user_id, request_type, request_channel, verification_method,
          verification_status, processing_time_hours, response_method,
          data_provided, partial_response, third_party_involved
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        requestId,
        userId,
        requestType,
        requestChannel,
        verificationMethod,
        verificationStatus,
        processingTimeHours,
        responseMethod,
        JSON.stringify(dataProvided),
        partialResponse,
        thirdPartyInvolved
      ]);

    } catch (error) {
      console.error('Error logging rights request:', error);
    }
  }

  // Log data breach incidents
  async logDataBreach(data) {
    try {
      const {
        incidentId,
        breachType,
        discoveryDate,
        breachDate,
        dataCategoriesAffected,
        affectedDataSubjectsCount,
        likelyConsequences,
        measuresTaken,
        severityLevel
      } = data;

      await this.db.query(`
        INSERT INTO data_breach_incidents (
          incident_id, breach_type, discovery_date, breach_date,
          data_categories_affected, affected_data_subjects_count,
          likely_consequences, measures_taken, severity_level
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        incidentId,
        breachType,
        discoveryDate,
        breachDate,
        dataCategoriesAffected,
        affectedDataSubjectsCount,
        likelyConsequences,
        measuresTaken,
        severityLevel
      ]);

      // Alert for high severity breaches
      if (severityLevel === 'high') {
        await this.sendBreachAlert(data);
      }

    } catch (error) {
      console.error('Error logging data breach:', error);
    }
  }

  // Log security events
  async logSecurityEvent(data) {
    try {
      const {
        eventType,
        userId,
        sessionId,
        ipAddress,
        userAgent,
        eventDetails,
        riskLevel
      } = data;

      await this.db.query(`
        INSERT INTO privacy_audit_log (
          event_type, user_id, session_id, ip_address_hash, user_agent_hash,
          event_data, compliance_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        `security-${eventType}`,
        userId,
        sessionId,
        this.generateHash(ipAddress),
        this.generateHash(userAgent),
        JSON.stringify(eventDetails),
        riskLevel === 'high' ? 'flagged' : 'compliant'
      ]);

    } catch (error) {
      console.error('Error logging security event:', error);
    }
  }

  // Generate audit reports
  async generateAuditReport(reportType, dateRange) {
    try {
      const { startDate, endDate } = dateRange;
      
      switch (reportType) {
        case 'consent-activity':
          return await this.generateConsentActivityReport(startDate, endDate);
        case 'data-processing':
          return await this.generateDataProcessingReport(startDate, endDate);
        case 'rights-requests':
          return await this.generateRightsRequestsReport(startDate, endDate);
        case 'compliance-overview':
          return await this.generateComplianceOverviewReport(startDate, endDate);
        default:
          throw new Error(`Unknown report type: ${reportType}`);
      }
    } catch (error) {
      console.error('Error generating audit report:', error);
      throw error;
    }
  }

  async generateConsentActivityReport(startDate, endDate) {
    const consentStats = await this.db.query(`
      SELECT 
        consent_type,
        consent_status,
        COUNT(*) as count,
        DATE_TRUNC('day', timestamp) as date
      FROM consent_audit_detailed
      WHERE timestamp >= $1 AND timestamp <= $2
      GROUP BY consent_type, consent_status, DATE_TRUNC('day', timestamp)
      ORDER BY date DESC
    `, [startDate, endDate]);

    const totalConsents = await this.db.query(`
      SELECT COUNT(*) as total
      FROM consent_audit_detailed
      WHERE timestamp >= $1 AND timestamp <= $2
    `, [startDate, endDate]);

    return {
      reportType: 'consent-activity',
      dateRange: { startDate, endDate },
      summary: {
        totalConsentEvents: totalConsents.rows[0].total,
        dailyBreakdown: consentStats.rows
      }
    };
  }

  async generateDataProcessingReport(startDate, endDate) {
    const processingStats = await this.db.query(`
      SELECT 
        processing_purpose,
        legal_basis,
        COUNT(*) as count
      FROM privacy_audit_log
      WHERE event_type = 'data-processing'
        AND timestamp >= $1 AND timestamp <= $2
      GROUP BY processing_purpose, legal_basis
      ORDER BY count DESC
    `, [startDate, endDate]);

    return {
      reportType: 'data-processing',
      dateRange: { startDate, endDate },
      summary: {
        processingActivities: processingStats.rows
      }
    };
  }

  async generateRightsRequestsReport(startDate, endDate) {
    const requestStats = await this.db.query(`
      SELECT 
        request_type,
        verification_status,
        AVG(processing_time_hours) as avg_processing_time,
        COUNT(*) as count
      FROM data_rights_requests_audit
      WHERE created_at >= $1 AND created_at <= $2
      GROUP BY request_type, verification_status
      ORDER BY count DESC
    `, [startDate, endDate]);

    return {
      reportType: 'rights-requests',
      dateRange: { startDate, endDate },
      summary: {
        requestBreakdown: requestStats.rows
      }
    };
  }

  async generateComplianceOverviewReport(startDate, endDate) {
    const overallStats = await this.db.query(`
      SELECT 
        compliance_status,
        COUNT(*) as count
      FROM privacy_audit_log
      WHERE timestamp >= $1 AND timestamp <= $2
      GROUP BY compliance_status
    `, [startDate, endDate]);

    const breachIncidents = await this.db.query(`
      SELECT COUNT(*) as count
      FROM data_breach_incidents
      WHERE discovery_date >= $1 AND discovery_date <= $2
    `, [startDate, endDate]);

    return {
      reportType: 'compliance-overview',
      dateRange: { startDate, endDate },
      summary: {
        complianceStatus: overallStats.rows,
        breachIncidents: breachIncidents.rows[0].count
      }
    };
  }

  // Send breach alert (placeholder for email/notification system)
  async sendBreachAlert(breachData) {
    // This would integrate with your notification system
    console.log('HIGH SEVERITY BREACH DETECTED:', breachData);
    // Example: send email to DPO, notify regulatory authorities if required
  }

  // API endpoints for audit data
  async getAuditLogs(filters = {}) {
    try {
      const { userId, eventType, startDate, endDate, limit = 100 } = filters;
      
      let query = `
        SELECT id, event_type, user_id, event_data, legal_basis, 
               processing_purpose, timestamp, compliance_status
        FROM privacy_audit_log
        WHERE 1=1
      `;
      
      const params = [];
      let paramIndex = 1;
      
      if (userId) {
        query += ` AND user_id = $${paramIndex++}`;
        params.push(userId);
      }
      
      if (eventType) {
        query += ` AND event_type = $${paramIndex++}`;
        params.push(eventType);
      }
      
      if (startDate) {
        query += ` AND timestamp >= $${paramIndex++}`;
        params.push(startDate);
      }
      
      if (endDate) {
        query += ` AND timestamp <= $${paramIndex++}`;
        params.push(endDate);
      }
      
      query += ` ORDER BY timestamp DESC LIMIT $${paramIndex}`;
      params.push(limit);
      
      const result = await this.db.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error getting audit logs:', error);
      throw error;
    }
  }

  async getComplianceStatus() {
    try {
      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);
      
      const stats = await this.db.query(`
        SELECT 
          compliance_status,
          COUNT(*) as count,
          COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
        FROM privacy_audit_log
        WHERE timestamp >= $1
        GROUP BY compliance_status
      `, [last30Days]);
      
      return stats.rows;
    } catch (error) {
      console.error('Error getting compliance status:', error);
      throw error;
    }
  }
}

module.exports = PrivacyAuditService;