const { Pool } = require('pg');
const Redis = require('redis');
const cron = require('node-cron');

class DataRetentionService {
  constructor() {
    this.db = new Pool({
      user: process.env.DB_USER || 'revivatech',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'revivatech',
      password: process.env.DB_PASSWORD || 'revivatech_password',
      port: process.env.DB_PORT || 5435,
    });

    this.redis = Redis.createClient({
      url: process.env.REDIS_URL || process.env.REDIS_INTERNAL_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`
    });

    this.retentionPolicies = new Map();
    this.scheduledJobs = new Map();
    
    this.initializeRetentionPolicies();
    this.scheduleCleanupJobs();
  }

  async initializeRetentionPolicies() {
    try {
      // Default retention policies based on GDPR and business requirements
      const defaultPolicies = [
        {
          dataType: 'user_sessions',
          retentionDays: 30,
          legalBasis: 'legitimate_interest',
          description: 'User session data for security and analytics',
          autoDelete: true,
          anonymizeAfter: 7
        },
        {
          dataType: 'service_records',
          retentionDays: 2555, // 7 years
          legalBasis: 'legal_obligation',
          description: 'Service records for warranty and legal compliance',
          autoDelete: false,
          anonymizeAfter: 365
        },
        {
          dataType: 'financial_records',
          retentionDays: 2190, // 6 years
          legalBasis: 'legal_obligation',
          description: 'Financial records as required by UK tax law',
          autoDelete: false,
          anonymizeAfter: 1095
        },
        {
          dataType: 'marketing_consents',
          retentionDays: 365,
          legalBasis: 'consent',
          description: 'Marketing consent data until withdrawal',
          autoDelete: true,
          anonymizeAfter: 30
        },
        {
          dataType: 'analytics_data',
          retentionDays: 790, // 26 months
          legalBasis: 'legitimate_interest',
          description: 'Website analytics and usage data',
          autoDelete: true,
          anonymizeAfter: 90
        },
        {
          dataType: 'cctv_footage',
          retentionDays: 30,
          legalBasis: 'legitimate_interest',
          description: 'CCTV footage for security purposes',
          autoDelete: true,
          anonymizeAfter: null
        },
        {
          dataType: 'customer_communications',
          retentionDays: 1095, // 3 years
          legalBasis: 'legitimate_interest',
          description: 'Customer service communications',
          autoDelete: false,
          anonymizeAfter: 365
        },
        {
          dataType: 'device_diagnostics',
          retentionDays: 90,
          legalBasis: 'legitimate_interest',
          description: 'Device diagnostic data for service improvement',
          autoDelete: true,
          anonymizeAfter: 30
        },
        {
          dataType: 'consent_records',
          retentionDays: 2555, // 7 years
          legalBasis: 'legal_obligation',
          description: 'Consent records for compliance audit',
          autoDelete: false,
          anonymizeAfter: 1095
        },
        {
          dataType: 'website_logs',
          retentionDays: 90,
          legalBasis: 'legitimate_interest',
          description: 'Website access logs for security',
          autoDelete: true,
          anonymizeAfter: 30
        }
      ];

      // Load policies into memory
      for (const policy of defaultPolicies) {
        this.retentionPolicies.set(policy.dataType, policy);
      }

      // Sync with database
      await this.syncPoliciesWithDatabase();
      
      console.log('Data retention policies initialized successfully');
    } catch (error) {
      console.error('Error initializing retention policies:', error);
    }
  }

  async syncPoliciesWithDatabase() {
    try {
      for (const [dataType, policy] of this.retentionPolicies) {
        await this.db.query(`
          INSERT INTO data_retention_policies (
            data_type, retention_period_days, legal_basis, description, 
            auto_delete, anonymize_after_days
          ) VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (data_type) DO UPDATE SET
            retention_period_days = EXCLUDED.retention_period_days,
            legal_basis = EXCLUDED.legal_basis,
            description = EXCLUDED.description,
            auto_delete = EXCLUDED.auto_delete,
            anonymize_after_days = EXCLUDED.anonymize_after_days,
            updated_at = CURRENT_TIMESTAMP
        `, [
          dataType,
          policy.retentionDays,
          policy.legalBasis,
          policy.description,
          policy.autoDelete,
          policy.anonymizeAfter
        ]);
      }
    } catch (error) {
      console.error('Error syncing policies with database:', error);
    }
  }

  scheduleCleanupJobs() {
    // Run cleanup daily at 2 AM
    cron.schedule('0 2 * * *', () => {
      this.runRetentionCleanup();
    });

    // Run anonymization weekly on Sundays at 3 AM
    cron.schedule('0 3 * * 0', () => {
      this.runAnonymizationProcess();
    });

    // Health check hourly
    cron.schedule('0 * * * *', () => {
      this.healthCheck();
    });

    console.log('Data retention cleanup jobs scheduled');
  }

  async runRetentionCleanup() {
    console.log('Starting scheduled data retention cleanup...');
    
    try {
      const results = [];
      
      for (const [dataType, policy] of this.retentionPolicies) {
        if (policy.autoDelete) {
          const result = await this.cleanupDataType(dataType, policy);
          results.push(result);
        }
      }

      // Log cleanup results
      await this.logCleanupResults(results);
      
      console.log('Data retention cleanup completed:', results);
    } catch (error) {
      console.error('Error during retention cleanup:', error);
      await this.logCleanupError(error);
    }
  }

  async cleanupDataType(dataType, policy) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - policy.retentionDays);

    let deletedCount = 0;
    let error = null;

    try {
      switch (dataType) {
        case 'user_sessions':
          deletedCount = await this.cleanupUserSessions(cutoffDate);
          break;
        case 'marketing_consents':
          deletedCount = await this.cleanupMarketingConsents(cutoffDate);
          break;
        case 'analytics_data':
          deletedCount = await this.cleanupAnalyticsData(cutoffDate);
          break;
        case 'cctv_footage':
          deletedCount = await this.cleanupCCTVFootage(cutoffDate);
          break;
        case 'device_diagnostics':
          deletedCount = await this.cleanupDeviceDiagnostics(cutoffDate);
          break;
        case 'website_logs':
          deletedCount = await this.cleanupWebsiteLogs(cutoffDate);
          break;
        default:
          console.warn(`No cleanup method defined for data type: ${dataType}`);
      }
    } catch (err) {
      error = err.message;
      console.error(`Error cleaning up ${dataType}:`, err);
    }

    return {
      dataType,
      deletedCount,
      cutoffDate: cutoffDate.toISOString(),
      error
    };
  }

  async cleanupUserSessions(cutoffDate) {
    const result = await this.db.query(`
      DELETE FROM user_sessions 
      WHERE created_at < $1 AND (last_activity < $2 OR last_activity IS NULL)
      RETURNING id
    `, [cutoffDate, cutoffDate]);

    return result.rowCount;
  }

  async cleanupMarketingConsents(cutoffDate) {
    // Delete withdrawn consents older than retention period
    const result = await this.db.query(`
      DELETE FROM marketing_consents 
      WHERE consent_withdrawn = true AND updated_at < $1
      RETURNING id
    `, [cutoffDate]);

    return result.rowCount;
  }

  async cleanupAnalyticsData(cutoffDate) {
    const result = await this.db.query(`
      DELETE FROM analytics_events 
      WHERE created_at < $1
      RETURNING id
    `, [cutoffDate]);

    // Also cleanup Redis analytics cache
    const keys = await this.redis.keys('analytics:*');
    let redisDeleted = 0;
    
    for (const key of keys) {
      const ttl = await this.redis.ttl(key);
      if (ttl > 0) {
        const age = Date.now() - (await this.redis.get(key + ':timestamp') || 0);
        if (age > cutoffDate.getTime()) {
          await this.redis.del(key);
          redisDeleted++;
        }
      }
    }

    return result.rowCount + redisDeleted;
  }

  async cleanupCCTVFootage(cutoffDate) {
    // This would typically interact with a file storage system
    // For now, we'll just log the cleanup
    console.log(`CCTV footage cleanup required for files older than ${cutoffDate}`);
    return 0; // Placeholder
  }

  async cleanupDeviceDiagnostics(cutoffDate) {
    const result = await this.db.query(`
      DELETE FROM device_diagnostics 
      WHERE created_at < $1
      RETURNING id
    `, [cutoffDate]);

    return result.rowCount;
  }

  async cleanupWebsiteLogs(cutoffDate) {
    const result = await this.db.query(`
      DELETE FROM website_access_logs 
      WHERE created_at < $1
      RETURNING id
    `, [cutoffDate]);

    return result.rowCount;
  }

  async runAnonymizationProcess() {
    console.log('Starting data anonymization process...');
    
    try {
      for (const [dataType, policy] of this.retentionPolicies) {
        if (policy.anonymizeAfter) {
          await this.anonymizeDataType(dataType, policy);
        }
      }
    } catch (error) {
      console.error('Error during anonymization process:', error);
    }
  }

  async anonymizeDataType(dataType, policy) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - policy.anonymizeAfter);

    try {
      switch (dataType) {
        case 'service_records':
          await this.anonymizeServiceRecords(cutoffDate);
          break;
        case 'financial_records':
          await this.anonymizeFinancialRecords(cutoffDate);
          break;
        case 'customer_communications':
          await this.anonymizeCustomerCommunications(cutoffDate);
          break;
        case 'consent_records':
          await this.anonymizeConsentRecords(cutoffDate);
          break;
        default:
          console.warn(`No anonymization method defined for data type: ${dataType}`);
      }
    } catch (error) {
      console.error(`Error anonymizing ${dataType}:`, error);
    }
  }

  async anonymizeServiceRecords(cutoffDate) {
    await this.db.query(`
      UPDATE service_records 
      SET 
        customer_name = 'ANONYMIZED',
        customer_email = 'anonymized@example.com',
        customer_phone = NULL,
        customer_address = NULL,
        device_serial = 'ANONYMIZED',
        personal_notes = NULL
      WHERE created_at < $1 AND customer_name != 'ANONYMIZED'
    `, [cutoffDate]);
  }

  async anonymizeFinancialRecords(cutoffDate) {
    await this.db.query(`
      UPDATE financial_records 
      SET 
        customer_name = 'ANONYMIZED',
        customer_email = 'anonymized@example.com',
        billing_address = NULL,
        payment_method_details = NULL
      WHERE created_at < $1 AND customer_name != 'ANONYMIZED'
    `, [cutoffDate]);
  }

  async anonymizeCustomerCommunications(cutoffDate) {
    await this.db.query(`
      UPDATE customer_communications 
      SET 
        customer_name = 'ANONYMIZED',
        customer_email = 'anonymized@example.com',
        message_content = 'Message content anonymized for privacy',
        personal_identifiers = NULL
      WHERE created_at < $1 AND customer_name != 'ANONYMIZED'
    `, [cutoffDate]);
  }

  async anonymizeConsentRecords(cutoffDate) {
    await this.db.query(`
      UPDATE consent_audit 
      SET 
        ip_address = '0.0.0.0',
        user_agent = 'ANONYMIZED',
        session_id = 'ANONYMIZED'
      WHERE timestamp < $1 AND ip_address != '0.0.0.0'
    `, [cutoffDate]);
  }

  async logCleanupResults(results) {
    try {
      await this.db.query(`
        INSERT INTO retention_cleanup_logs (
          cleanup_date, results, total_deleted, errors_count
        ) VALUES ($1, $2, $3, $4)
      `, [
        new Date(),
        JSON.stringify(results),
        results.reduce((sum, r) => sum + (r.deletedCount || 0), 0),
        results.filter(r => r.error).length
      ]);
    } catch (error) {
      console.error('Error logging cleanup results:', error);
    }
  }

  async logCleanupError(error) {
    try {
      await this.db.query(`
        INSERT INTO retention_cleanup_logs (
          cleanup_date, error_message, results
        ) VALUES ($1, $2, $3)
      `, [
        new Date(),
        error.message,
        JSON.stringify({ error: true, message: error.message })
      ]);
    } catch (err) {
      console.error('Error logging cleanup error:', err);
    }
  }

  async healthCheck() {
    try {
      // Check database connection
      await this.db.query('SELECT 1');
      
      // Check Redis connection
      await this.redis.ping();
      
      // Check for any stale data that should have been cleaned up
      const staleDataCheck = await this.checkForStaleData();
      
      if (staleDataCheck.hasStaleData) {
        console.warn('Stale data detected:', staleDataCheck.details);
      }
      
      return { healthy: true, staleDataWarning: staleDataCheck.hasStaleData };
    } catch (error) {
      console.error('Data retention service health check failed:', error);
      return { healthy: false, error: error.message };
    }
  }

  async checkForStaleData() {
    const checks = [];
    
    try {
      // Check for old session data
      const oldSessions = await this.db.query(`
        SELECT COUNT(*) as count 
        FROM user_sessions 
        WHERE created_at < NOW() - INTERVAL '35 days'
      `);
      
      if (oldSessions.rows[0].count > 0) {
        checks.push({
          dataType: 'user_sessions',
          staleCount: oldSessions.rows[0].count,
          reason: 'Sessions older than 35 days found'
        });
      }

      // Check for old analytics data
      const oldAnalytics = await this.db.query(`
        SELECT COUNT(*) as count 
        FROM analytics_events 
        WHERE created_at < NOW() - INTERVAL '800 days'
      `);
      
      if (oldAnalytics.rows[0].count > 0) {
        checks.push({
          dataType: 'analytics_data',
          staleCount: oldAnalytics.rows[0].count,
          reason: 'Analytics data older than 800 days found'
        });
      }

      return {
        hasStaleData: checks.length > 0,
        details: checks
      };
    } catch (error) {
      console.error('Error checking for stale data:', error);
      return { hasStaleData: false, error: error.message };
    }
  }

  // API methods for external access
  async getRetentionPolicies() {
    try {
      const result = await this.db.query(`
        SELECT data_type, retention_period_days, legal_basis, description, 
               auto_delete, anonymize_after_days, created_at, updated_at
        FROM data_retention_policies 
        ORDER BY data_type
      `);
      
      return result.rows;
    } catch (error) {
      console.error('Error getting retention policies:', error);
      throw error;
    }
  }

  async updateRetentionPolicy(dataType, updates) {
    try {
      const result = await this.db.query(`
        UPDATE data_retention_policies 
        SET 
          retention_period_days = COALESCE($2, retention_period_days),
          legal_basis = COALESCE($3, legal_basis),
          description = COALESCE($4, description),
          auto_delete = COALESCE($5, auto_delete),
          anonymize_after_days = COALESCE($6, anonymize_after_days),
          updated_at = CURRENT_TIMESTAMP
        WHERE data_type = $1
        RETURNING *
      `, [
        dataType,
        updates.retentionDays,
        updates.legalBasis,
        updates.description,
        updates.autoDelete,
        updates.anonymizeAfter
      ]);

      if (result.rowCount > 0) {
        // Update in-memory cache
        const policy = this.retentionPolicies.get(dataType);
        if (policy) {
          Object.assign(policy, updates);
        }
        
        return result.rows[0];
      }
      
      return null;
    } catch (error) {
      console.error('Error updating retention policy:', error);
      throw error;
    }
  }

  async getCleanupHistory(limit = 10) {
    try {
      const result = await this.db.query(`
        SELECT cleanup_date, results, total_deleted, errors_count, error_message
        FROM retention_cleanup_logs 
        ORDER BY cleanup_date DESC 
        LIMIT $1
      `, [limit]);
      
      return result.rows;
    } catch (error) {
      console.error('Error getting cleanup history:', error);
      throw error;
    }
  }

  async requestDataDeletion(userId, dataTypes = []) {
    try {
      // If no specific data types provided, delete all user data
      if (dataTypes.length === 0) {
        dataTypes = Array.from(this.retentionPolicies.keys());
      }
      
      const results = [];
      
      for (const dataType of dataTypes) {
        const policy = this.retentionPolicies.get(dataType);
        if (policy && policy.legalBasis === 'consent') {
          // Only delete data with consent legal basis immediately
          const result = await this.deleteUserDataByType(userId, dataType);
          results.push(result);
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error requesting data deletion:', error);
      throw error;
    }
  }

  async deleteUserDataByType(userId, dataType) {
    try {
      let deletedCount = 0;
      
      // This would need to be expanded based on your actual data structure
      const tableMappings = {
        'user_sessions': 'user_sessions',
        'marketing_consents': 'marketing_consents',
        'analytics_data': 'analytics_events',
        'device_diagnostics': 'device_diagnostics'
      };
      
      const tableName = tableMappings[dataType];
      if (tableName) {
        const result = await this.db.query(`
          DELETE FROM ${tableName} 
          WHERE user_id = $1
          RETURNING id
        `, [userId]);
        
        deletedCount = result.rowCount;
      }
      
      return {
        dataType,
        deletedCount,
        success: true
      };
    } catch (error) {
      console.error(`Error deleting user data for type ${dataType}:`, error);
      return {
        dataType,
        deletedCount: 0,
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = DataRetentionService;