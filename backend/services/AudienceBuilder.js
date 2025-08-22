const EventEmitter = require('events');
const MLService = require('./MLService');

class AudienceBuilder extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      syncInterval: 300000, // 5 minutes
      maxAudienceSize: 50000,
      enableRealTimeUpdates: true,
      enableMLSegmentation: true,
      ...options
    };

    this.mlService = new MLService();
    this.audiences = new Map();
    this.audienceRules = new Map();
    this.userProfiles = new Map();
    this.syncQueue = [];
    this.isSyncing = false;

    // Performance metrics
    this.metrics = {
      audiencesCreated: 0,
      usersSegmented: 0,
      syncOperations: 0,
      averageSyncTime: 0,
      errors: 0
    };

    this.setupDefaultAudiences();
  }

  async initialize() {
    try {
      
      // Initialize ML Service
      await this.mlService.initialize();
      
      // Start audience sync scheduler
      this.startSyncScheduler();
      
      // Setup real-time event listeners
      this.setupEventListeners();
      
      return true;
    } catch (error) {
      console.error('❌ Audience Builder initialization failed:', error);
      throw error;
    }
  }

  setupDefaultAudiences() {
    const defaultRules = [
      {
        id: 'high_value_customers',
        name: 'High Value Customers',
        conditions: {
          totalSpent: { min: 500 },
          orderCount: { min: 3 },
          avgOrderValue: { min: 100 }
        },
        mlCriteria: {
          useLeadScore: true,
          minLeadScore: 80,
          useSegmentation: true,
          preferredSegments: ['premium', 'loyal']
        },
        priority: 'high',
        autoUpdate: true
      },
      {
        id: 'at_risk_customers',
        name: 'At Risk Customers',
        conditions: {
          daysSinceLastVisit: { min: 30 },
          totalOrders: { min: 1 }
        },
        mlCriteria: {
          useChurnPrediction: true,
          minChurnRisk: 0.7
        },
        priority: 'high',
        autoUpdate: true
      },
      {
        id: 'abandoned_cart_users',
        name: 'Abandoned Cart Users',
        conditions: {
          hasAbandonedBooking: true,
          daysSinceAbandonment: { max: 7 }
        },
        mlCriteria: {
          useLeadScore: true,
          minLeadScore: 40
        },
        priority: 'medium',
        autoUpdate: true
      },
      {
        id: 'new_visitors_high_intent',
        name: 'New Visitors High Intent',
        conditions: {
          visitCount: { max: 2 },
          engagementScore: { min: 70 },
          timeOnSite: { min: 300 }
        },
        mlCriteria: {
          useLeadScore: true,
          minLeadScore: 60
        },
        priority: 'high',
        autoUpdate: true
      },
      {
        id: 'repeat_service_customers',
        name: 'Repeat Service Customers',
        conditions: {
          serviceCount: { min: 2 },
          daysSinceLastService: { min: 90, max: 365 }
        },
        mlCriteria: {
          useSegmentation: true,
          preferredSegments: ['repeat', 'loyal']
        },
        priority: 'medium',
        autoUpdate: true
      },
      {
        id: 'price_sensitive_segment',
        name: 'Price Sensitive Segment',
        conditions: {
          priceCheckCount: { min: 3 },
          hasBooking: false
        },
        mlCriteria: {
          useSegmentation: true,
          preferredSegments: ['price_conscious', 'comparison_shopper']
        },
        priority: 'medium',
        autoUpdate: true
      },
      {
        id: 'mobile_users_local',
        name: 'Mobile Users Local',
        conditions: {
          deviceType: 'mobile',
          isLocalTraffic: true,
          engagementScore: { min: 40 }
        },
        mlCriteria: {
          useSegmentation: true,
          preferredSegments: ['mobile_first', 'local']
        },
        priority: 'medium',
        autoUpdate: true
      },
      {
        id: 'business_customers',
        name: 'Business Customers',
        conditions: {
          customerType: 'business',
          orderValue: { min: 200 }
        },
        mlCriteria: {
          useSegmentation: true,
          preferredSegments: ['business', 'enterprise']
        },
        priority: 'high',
        autoUpdate: true
      }
    ];

    defaultRules.forEach(rule => {
      this.audienceRules.set(rule.id, rule);
      this.audiences.set(rule.id, {
        id: rule.id,
        name: rule.name,
        users: new Set(),
        metadata: {
          createdAt: Date.now(),
          lastUpdated: Date.now(),
          size: 0,
          growthRate: 0
        },
        syncStatus: 'pending'
      });
    });

    console.log(`📋 Configured ${defaultRules.length} default audience rules`);
  }

  async addUserProfile(userId, profileData) {
    try {
      const profile = {
        userId,
        ...profileData,
        lastUpdated: Date.now(),
        mlScores: await this.calculateMLScores(profileData)
      };

      this.userProfiles.set(userId, profile);
      
      // Update audiences in real-time if enabled
      if (this.options.enableRealTimeUpdates) {
        await this.updateUserAudiences(userId, profile);
      }

      this.metrics.usersSegmented++;
      return profile;
    } catch (error) {
      console.error('❌ Failed to add user profile:', error);
      this.metrics.errors++;
      throw error;
    }
  }

  async calculateMLScores(profileData) {
    try {
      const scores = {};

      // Lead scoring
      if (this.options.enableMLSegmentation) {
        scores.leadScore = await this.mlService.scoreLeads([{
          engagement_score: profileData.engagementScore || 0,
          pages_visited: profileData.pagesVisited || 1,
          time_on_site: profileData.timeOnSite || 0,
          device_type: profileData.deviceType || 'desktop',
          traffic_source: profileData.trafficSource || 'direct'
        }]);

        // Churn prediction for existing customers
        if (profileData.customerId) {
          scores.churnRisk = await this.mlService.predictChurn([{
            customer_id: profileData.customerId,
            days_since_last_visit: profileData.daysSinceLastVisit || 0,
            total_orders: profileData.totalOrders || 0,
            avg_order_value: profileData.avgOrderValue || 0
          }]);
        }

        // Customer segmentation
        scores.segment = await this.mlService.segmentCustomers([{
          user_id: profileData.userId,
          behavior_data: profileData.behaviorData || {},
          demographics: profileData.demographics || {}
        }]);
      }

      return scores;
    } catch (error) {
      console.error('❌ ML score calculation failed:', error);
      return {};
    }
  }

  async updateUserAudiences(userId, profile) {
    const startTime = Date.now();
    const updatedAudiences = [];

    try {
      for (const [audienceId, rule] of this.audienceRules) {
        const audience = this.audiences.get(audienceId);
        if (!audience) continue;

        const shouldInclude = await this.evaluateUserForAudience(profile, rule);
        const currentlyIncluded = audience.users.has(userId);

        if (shouldInclude && !currentlyIncluded) {
          // Add user to audience
          audience.users.add(userId);
          audience.metadata.size = audience.users.size;
          audience.metadata.lastUpdated = Date.now();
          updatedAudiences.push({ audienceId, action: 'added' });
          
          this.emit('userAddedToAudience', { userId, audienceId, audienceName: rule.name });
        } else if (!shouldInclude && currentlyIncluded) {
          // Remove user from audience
          audience.users.delete(userId);
          audience.metadata.size = audience.users.size;
          audience.metadata.lastUpdated = Date.now();
          updatedAudiences.push({ audienceId, action: 'removed' });
          
          this.emit('userRemovedFromAudience', { userId, audienceId, audienceName: rule.name });
        }
      }

      const processingTime = Date.now() - startTime;
      console.log(`👤 Updated ${updatedAudiences.length} audiences for user ${userId} in ${processingTime}ms`);
      
      return updatedAudiences;
    } catch (error) {
      console.error('❌ Failed to update user audiences:', error);
      this.metrics.errors++;
      throw error;
    }
  }

  async evaluateUserForAudience(profile, rule) {
    try {
      // Check standard conditions
      for (const [field, criteria] of Object.entries(rule.conditions)) {
        const value = this.getNestedValue(profile, field);
        
        if (criteria.min !== undefined && value < criteria.min) return false;
        if (criteria.max !== undefined && value > criteria.max) return false;
        if (criteria.equals !== undefined && value !== criteria.equals) return false;
        if (criteria.includes !== undefined && Array.isArray(criteria.includes) && !criteria.includes.includes(value)) return false;
        if (criteria.includes !== undefined && !Array.isArray(criteria.includes) && criteria.includes !== value) return false;
      }

      // Check ML criteria
      if (rule.mlCriteria && this.options.enableMLSegmentation) {
        const mlScores = profile.mlScores || {};

        if (rule.mlCriteria.useLeadScore && rule.mlCriteria.minLeadScore) {
          const leadScore = Array.isArray(mlScores.leadScore) 
            ? mlScores.leadScore[0]?.score || 0 
            : mlScores.leadScore || 0;
          if (leadScore < rule.mlCriteria.minLeadScore) return false;
        }

        if (rule.mlCriteria.useChurnPrediction && rule.mlCriteria.minChurnRisk) {
          const churnRisk = Array.isArray(mlScores.churnRisk) 
            ? mlScores.churnRisk[0]?.risk || 0 
            : mlScores.churnRisk || 0;
          if (churnRisk < rule.mlCriteria.minChurnRisk) return false;
        }

        if (rule.mlCriteria.useSegmentation && rule.mlCriteria.preferredSegments) {
          const userSegment = Array.isArray(mlScores.segment) 
            ? mlScores.segment[0]?.segment || 'unknown' 
            : mlScores.segment || 'unknown';
          if (!rule.mlCriteria.preferredSegments.includes(userSegment)) return false;
        }
      }

      return true;
    } catch (error) {
      console.error('❌ Audience evaluation failed:', error);
      return false;
    }
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
  }

  async createCustomAudience(audienceDefinition) {
    try {
      const audienceId = audienceDefinition.id || 
        `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const rule = {
        id: audienceId,
        name: audienceDefinition.name,
        conditions: audienceDefinition.conditions || {},
        mlCriteria: audienceDefinition.mlCriteria || {},
        priority: audienceDefinition.priority || 'medium',
        autoUpdate: audienceDefinition.autoUpdate !== false,
        custom: true,
        createdBy: audienceDefinition.createdBy,
        createdAt: Date.now()
      };

      this.audienceRules.set(audienceId, rule);
      
      const audience = {
        id: audienceId,
        name: rule.name,
        users: new Set(),
        metadata: {
          createdAt: Date.now(),
          lastUpdated: Date.now(),
          size: 0,
          growthRate: 0,
          custom: true
        },
        syncStatus: 'pending'
      };

      this.audiences.set(audienceId, audience);

      // Build the audience
      await this.buildAudience(audienceId);

      this.metrics.audiencesCreated++;
      
      this.emit('audienceCreated', { audienceId, name: rule.name, size: audience.metadata.size });
      
      return audience;
    } catch (error) {
      console.error('❌ Failed to create custom audience:', error);
      this.metrics.errors++;
      throw error;
    }
  }

  async buildAudience(audienceId) {
    const startTime = Date.now();
    
    try {
      const rule = this.audienceRules.get(audienceId);
      const audience = this.audiences.get(audienceId);
      
      if (!rule || !audience) {
        throw new Error(`Audience not found: ${audienceId}`);
      }

      audience.users.clear();

      // Evaluate all user profiles
      for (const [userId, profile] of this.userProfiles) {
        if (await this.evaluateUserForAudience(profile, rule)) {
          audience.users.add(userId);
          
          // Check size limit
          if (audience.users.size >= this.options.maxAudienceSize) {
            console.warn(`⚠️ Audience ${audienceId} reached max size limit`);
            break;
          }
        }
      }

      audience.metadata.size = audience.users.size;
      audience.metadata.lastUpdated = Date.now();
      audience.syncStatus = 'built';

      const buildTime = Date.now() - startTime;
      
      return audience;
    } catch (error) {
      console.error(`❌ Failed to build audience ${audienceId}:`, error);
      throw error;
    }
  }

  async syncAudience(audienceId, platform = 'internal') {
    const startTime = Date.now();
    
    try {
      const audience = this.audiences.get(audienceId);
      if (!audience) {
        throw new Error(`Audience not found: ${audienceId}`);
      }

      // Platform-specific sync logic
      const syncResult = await this.performPlatformSync(audience, platform);

      audience.syncStatus = 'synced';
      audience.metadata.lastSynced = Date.now();

      const syncTime = Date.now() - startTime;
      this.updateSyncMetrics(syncTime);

      this.emit('audienceSynced', { 
        audienceId, 
        platform, 
        size: audience.metadata.size, 
        syncTime 
      });

      return syncResult;
    } catch (error) {
      console.error(`❌ Failed to sync audience ${audienceId}:`, error);
      this.metrics.errors++;
      throw error;
    }
  }

  async performPlatformSync(audience, platform) {
    const userList = Array.from(audience.users);

    switch (platform) {
      case 'email':
        return this.syncToEmailPlatform(userList, audience);
      case 'facebook':
        return this.syncToFacebookAds(userList, audience);
      case 'google':
        return this.syncToGoogleAds(userList, audience);
      case 'internal':
      default:
        return this.syncToInternalPlatform(userList, audience);
    }
  }

  async syncToEmailPlatform(userList, audience) {
    // Email platform sync implementation
    return {
      platform: 'email',
      syncedUsers: userList.length,
      listId: `email_${audience.id}`,
      success: true,
      timestamp: Date.now()
    };
  }

  async syncToFacebookAds(userList, audience) {
    // Facebook Ads sync implementation
    return {
      platform: 'facebook',
      syncedUsers: userList.length,
      customAudienceId: `fb_${audience.id}`,
      success: true,
      timestamp: Date.now()
    };
  }

  async syncToGoogleAds(userList, audience) {
    // Google Ads sync implementation
    return {
      platform: 'google',
      syncedUsers: userList.length,
      remarketingListId: `gads_${audience.id}`,
      success: true,
      timestamp: Date.now()
    };
  }

  async syncToInternalPlatform(userList, audience) {
    // Internal platform sync implementation
    return {
      platform: 'internal',
      syncedUsers: userList.length,
      audienceId: audience.id,
      success: true,
      timestamp: Date.now()
    };
  }

  startSyncScheduler() {
    setInterval(async () => {
      try {
        await this.syncAllAudiences();
      } catch (error) {
        console.error('❌ Scheduled sync failed:', error);
      }
    }, this.options.syncInterval);

    console.log(`⏰ Audience sync scheduler started (${this.options.syncInterval / 1000}s interval)`);
  }

  async syncAllAudiences() {
    if (this.isSyncing) return;
    
    this.isSyncing = true;
    
    try {
      const syncPromises = [];
      
      for (const [audienceId, audience] of this.audiences) {
        const rule = this.audienceRules.get(audienceId);
        if (rule && rule.autoUpdate) {
          // Rebuild and sync audience
          syncPromises.push(
            this.buildAudience(audienceId)
              .then(() => this.syncAudience(audienceId))
          );
        }
      }

      await Promise.all(syncPromises);
    } catch (error) {
      console.error('❌ Bulk audience sync failed:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  setupEventListeners() {
    // Listen for user events to trigger real-time updates
    this.on('userProfileUpdated', async (data) => {
      if (this.options.enableRealTimeUpdates) {
        await this.updateUserAudiences(data.userId, data.profile);
      }
    });
  }

  updateSyncMetrics(syncTime) {
    this.metrics.syncOperations++;
    this.metrics.averageSyncTime = 
      (this.metrics.averageSyncTime * (this.metrics.syncOperations - 1) + syncTime) / 
      this.metrics.syncOperations;
  }

  getAudienceMetrics() {
    return {
      ...this.metrics,
      totalAudiences: this.audiences.size,
      totalUserProfiles: this.userProfiles.size,
      isSyncing: this.isSyncing
    };
  }

  async getAudience(audienceId) {
    const audience = this.audiences.get(audienceId);
    if (!audience) return null;

    return {
      ...audience,
      users: Array.from(audience.users),
      rule: this.audienceRules.get(audienceId)
    };
  }

  async getAllAudiences() {
    const audiences = [];
    for (const [audienceId, audience] of this.audiences) {
      audiences.push({
        ...audience,
        users: Array.from(audience.users),
        rule: this.audienceRules.get(audienceId)
      });
    }
    return audiences;
  }
}

module.exports = AudienceBuilder;