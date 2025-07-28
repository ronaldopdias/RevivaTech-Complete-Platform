const EventEmitter = require('events');
const MLService = require('./MLService');
const AudienceBuilder = require('./AudienceBuilder');

class PersonalizationEngine extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      cacheTimeout: 300000, // 5 minutes
      maxPersonalizations: 10000,
      enableRealTimePersonalization: true,
      enableABTesting: true,
      defaultPersonalizationLevel: 'medium',
      ...options
    };

    this.mlService = new MLService();
    this.audienceBuilder = new AudienceBuilder();
    this.personalizations = new Map();
    this.userPersonalizations = new Map();
    this.contentVariants = new Map();
    this.abTests = new Map();
    
    // Performance metrics
    this.metrics = {
      personalizationsServed: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageResponseTime: 0,
      engagementLift: 0,
      conversionLift: 0,
      errors: 0
    };

    this.setupContentVariants();
    this.setupPersonalizationRules();
  }

  async initialize() {
    try {
      console.log('🎯 Initializing Personalization Engine...');
      
      // Initialize dependencies
      await this.mlService.initialize();
      await this.audienceBuilder.initialize();
      
      // Setup cache cleanup
      this.startCacheCleanup();
      
      // Setup A/B testing
      if (this.options.enableABTesting) {
        this.setupABTests();
      }
      
      console.log('✅ Personalization Engine initialized');
      return true;
    } catch (error) {
      console.error('❌ Personalization Engine initialization failed:', error);
      throw error;
    }
  }

  setupContentVariants() {
    const variants = [
      {
        id: 'hero_banner',
        name: 'Hero Banner',
        variants: {
          default: {
            headline: 'Professional Computer Repair Services',
            subheadline: 'Expert technicians, genuine parts, 90-day warranty',
            cta: 'Book Repair Now',
            image: '/images/hero-default.jpg'
          },
          business: {
            headline: 'Enterprise IT Solutions & Support',
            subheadline: 'Comprehensive business computer services with priority support',
            cta: 'Get Business Quote',
            image: '/images/hero-business.jpg'
          },
          urgent: {
            headline: 'Same-Day Computer Repair',
            subheadline: 'Fast, reliable repairs when you need them most',
            cta: 'Emergency Repair',
            image: '/images/hero-urgent.jpg'
          },
          budget: {
            headline: 'Affordable Computer Repair',
            subheadline: 'Quality repairs at competitive prices with flexible payment options',
            cta: 'See Pricing',
            image: '/images/hero-budget.jpg'
          },
          premium: {
            headline: 'Premium Computer Care Services',
            subheadline: 'White-glove service with certified Apple technicians',
            cta: 'Premium Service',
            image: '/images/hero-premium.jpg'
          }
        }
      },
      {
        id: 'service_recommendations',
        name: 'Service Recommendations',
        variants: {
          default: ['laptop-repair', 'data-recovery', 'virus-removal'],
          business: ['enterprise-support', 'bulk-repairs', 'it-consulting'],
          mobile: ['phone-repair', 'tablet-repair', 'screen-replacement'],
          gaming: ['gaming-pc-repair', 'console-repair', 'performance-optimization'],
          apple: ['macbook-repair', 'imac-repair', 'iphone-repair'],
          student: ['budget-repair', 'data-recovery', 'performance-boost']
        }
      },
      {
        id: 'pricing_display',
        name: 'Pricing Display',
        variants: {
          default: { showFullPricing: true, emphasizeWarranty: false },
          budget: { showFullPricing: true, emphasizeWarranty: false, highlightLowCost: true },
          premium: { showFullPricing: false, emphasizeWarranty: true, showPremiumBadge: true },
          business: { showFullPricing: false, showQuoteForm: true, emphasizeB2B: true }
        }
      },
      {
        id: 'testimonials',
        name: 'Customer Testimonials',
        variants: {
          default: 'general',
          business: 'business_customers',
          urgent: 'quick_turnaround',
          technical: 'complex_repairs',
          budget: 'value_for_money'
        }
      },
      {
        id: 'contact_method',
        name: 'Contact Method Priority',
        variants: {
          default: ['phone', 'form', 'chat'],
          mobile: ['chat', 'phone', 'form'],
          business: ['form', 'phone', 'chat'],
          urgent: ['phone', 'chat', 'form']
        }
      }
    ];

    variants.forEach(variant => {
      this.contentVariants.set(variant.id, variant);
    });

    console.log(`🎨 Configured ${variants.length} content variant groups`);
  }

  setupPersonalizationRules() {
    this.personalizationRules = {
      // Audience-based personalization
      audience: {
        'high_value_customers': {
          hero_banner: 'premium',
          service_recommendations: 'business',
          pricing_display: 'premium',
          testimonials: 'business',
          contact_method: 'business'
        },
        'at_risk_customers': {
          hero_banner: 'budget',
          service_recommendations: 'default',
          pricing_display: 'budget',
          testimonials: 'value_for_money',
          contact_method: 'default'
        },
        'abandoned_cart_users': {
          hero_banner: 'urgent',
          service_recommendations: 'default',
          pricing_display: 'default',
          testimonials: 'quick_turnaround',
          contact_method: 'urgent'
        },
        'business_customers': {
          hero_banner: 'business',
          service_recommendations: 'business',
          pricing_display: 'business',
          testimonials: 'business',
          contact_method: 'business'
        },
        'mobile_users_local': {
          hero_banner: 'urgent',
          service_recommendations: 'mobile',
          pricing_display: 'default',
          testimonials: 'general',
          contact_method: 'mobile'
        }
      },
      
      // Behavioral personalization
      behavior: {
        high_engagement: {
          pricing_display: 'premium',
          contact_method: 'phone'
        },
        price_sensitive: {
          hero_banner: 'budget',
          pricing_display: 'budget',
          testimonials: 'value_for_money'
        },
        repeat_visitor: {
          hero_banner: 'urgent',
          contact_method: 'chat'
        },
        mobile_device: {
          contact_method: 'mobile',
          service_recommendations: 'mobile'
        }
      },
      
      // Time-based personalization
      temporal: {
        business_hours: {
          contact_method: 'phone'
        },
        after_hours: {
          contact_method: 'form'
        },
        weekend: {
          hero_banner: 'urgent',
          contact_method: 'chat'
        }
      }
    };
  }

  async getPersonalization(userId, context = {}) {
    const startTime = Date.now();
    
    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(userId, context);
      const cached = this.personalizations.get(cacheKey);
      
      if (cached && (Date.now() - cached.timestamp) < this.options.cacheTimeout) {
        this.metrics.cacheHits++;
        return cached.personalization;
      }
      
      this.metrics.cacheMisses++;
      
      // Generate new personalization
      const personalization = await this.generatePersonalization(userId, context);
      
      // Cache the result
      this.personalizations.set(cacheKey, {
        personalization,
        timestamp: Date.now(),
        userId,
        context
      });
      
      // Clean up cache if needed
      if (this.personalizations.size > this.options.maxPersonalizations) {
        this.cleanupCache();
      }
      
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime);
      
      this.metrics.personalizationsServed++;
      
      this.emit('personalizationServed', {
        userId,
        personalization,
        responseTime,
        cached: false
      });
      
      return personalization;
    } catch (error) {
      console.error('❌ Personalization generation failed:', error);
      this.metrics.errors++;
      
      // Return default personalization
      return this.getDefaultPersonalization();
    }
  }

  async generatePersonalization(userId, context) {
    const personalization = {
      userId,
      timestamp: Date.now(),
      level: this.options.defaultPersonalizationLevel,
      variants: {},
      recommendations: {},
      metadata: {
        audiences: [],
        mlScores: {},
        behaviorProfile: {},
        abTests: {}
      }
    };

    // Get user profile and ML scores
    const userProfile = await this.getUserProfile(userId, context);
    personalization.metadata.behaviorProfile = userProfile.behavior || {};
    
    if (userProfile.mlScores) {
      personalization.metadata.mlScores = userProfile.mlScores;
    }

    // Get user audiences
    const userAudiences = await this.getUserAudiences(userId);
    personalization.metadata.audiences = userAudiences;

    // Apply audience-based personalization
    for (const audience of userAudiences) {
      const audienceRules = this.personalizationRules.audience[audience];
      if (audienceRules) {
        Object.assign(personalization.variants, audienceRules);
      }
    }

    // Apply behavioral personalization
    const behaviorRules = this.getBehaviorRules(userProfile.behavior || {});
    Object.assign(personalization.variants, behaviorRules);

    // Apply temporal personalization
    const temporalRules = this.getTemporalRules();
    Object.assign(personalization.variants, temporalRules);

    // Generate recommendations
    personalization.recommendations = await this.generateRecommendations(userProfile);

    // Apply A/B tests
    if (this.options.enableABTesting) {
      personalization.metadata.abTests = this.getABTestVariants(userId);
      this.applyABTestVariants(personalization, personalization.metadata.abTests);
    }

    // Determine personalization level
    personalization.level = this.calculatePersonalizationLevel(userProfile, userAudiences);

    return personalization;
  }

  async getUserProfile(userId, context) {
    // Try to get from audience builder first
    let profile = {};
    
    try {
      const audienceBuilder = this.audienceBuilder;
      if (audienceBuilder.userProfiles && audienceBuilder.userProfiles.has(userId)) {
        profile = audienceBuilder.userProfiles.get(userId);
      }
    } catch (error) {
      console.warn('⚠️ Could not retrieve user profile from audience builder');
    }

    // Merge with context data
    return {
      ...profile,
      ...context,
      userId,
      lastUpdated: Date.now()
    };
  }

  async getUserAudiences(userId) {
    try {
      const audiences = [];
      const allAudiences = await this.audienceBuilder.getAllAudiences();
      
      for (const audience of allAudiences) {
        if (audience.users.includes(userId)) {
          audiences.push(audience.id);
        }
      }
      
      return audiences;
    } catch (error) {
      console.warn('⚠️ Could not retrieve user audiences:', error);
      return [];
    }
  }

  getBehaviorRules(behavior) {
    const rules = {};
    
    if (behavior.engagementScore > 70) {
      Object.assign(rules, this.personalizationRules.behavior.high_engagement);
    }
    
    if (behavior.priceCheckCount >= 3) {
      Object.assign(rules, this.personalizationRules.behavior.price_sensitive);
    }
    
    if (behavior.visitCount >= 2) {
      Object.assign(rules, this.personalizationRules.behavior.repeat_visitor);
    }
    
    if (behavior.deviceType === 'mobile') {
      Object.assign(rules, this.personalizationRules.behavior.mobile_device);
    }
    
    return rules;
  }

  getTemporalRules() {
    const now = new Date();
    const hour = now.getHours();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;
    const isBusinessHours = hour >= 9 && hour <= 17 && !isWeekend;
    
    if (isWeekend) {
      return this.personalizationRules.temporal.weekend;
    } else if (isBusinessHours) {
      return this.personalizationRules.temporal.business_hours;
    } else {
      return this.personalizationRules.temporal.after_hours;
    }
  }

  async generateRecommendations(userProfile) {
    const recommendations = {
      services: [],
      content: [],
      offers: []
    };

    try {
      // Service recommendations based on ML scores
      if (userProfile.mlScores) {
        const leadScore = Array.isArray(userProfile.mlScores.leadScore) 
          ? userProfile.mlScores.leadScore[0]?.score || 0 
          : userProfile.mlScores.leadScore || 0;
        
        if (leadScore > 80) {
          recommendations.services = ['premium-diagnostics', 'express-repair', 'data-recovery'];
        } else if (leadScore > 60) {
          recommendations.services = ['standard-repair', 'virus-removal', 'hardware-upgrade'];
        } else {
          recommendations.services = ['basic-diagnostics', 'consultation', 'quote-request'];
        }
      }

      // Content recommendations
      if (userProfile.behavior) {
        if (userProfile.behavior.deviceType === 'mobile') {
          recommendations.content = ['mobile-repair-guide', 'screen-protection-tips'];
        } else {
          recommendations.content = ['computer-maintenance-guide', 'performance-tips'];
        }
      }

      // Offer recommendations
      const churnRisk = Array.isArray(userProfile.mlScores?.churnRisk) 
        ? userProfile.mlScores.churnRisk[0]?.risk || 0 
        : userProfile.mlScores?.churnRisk || 0;
      
      if (churnRisk > 0.7) {
        recommendations.offers = ['loyalty-discount', 'priority-support'];
      } else if (userProfile.behavior?.priceCheckCount >= 3) {
        recommendations.offers = ['first-time-discount', 'free-diagnostics'];
      }

    } catch (error) {
      console.warn('⚠️ Recommendation generation failed:', error);
    }

    return recommendations;
  }

  calculatePersonalizationLevel(userProfile, audiences) {
    let score = 0;
    
    // Base score from audiences
    score += audiences.length * 10;
    
    // Score from ML data availability
    if (userProfile.mlScores) {
      score += Object.keys(userProfile.mlScores).length * 15;
    }
    
    // Score from behavior data
    if (userProfile.behavior) {
      score += Object.keys(userProfile.behavior).length * 5;
    }
    
    // Determine level
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'basic';
  }

  setupABTests() {
    const tests = [
      {
        id: 'hero_cta_test',
        name: 'Hero CTA Button Text',
        variants: {
          control: 'Book Repair Now',
          variant_a: 'Get Free Quote',
          variant_b: 'Start Repair Process'
        },
        traffic: 0.33,
        active: true
      },
      {
        id: 'pricing_display_test',
        name: 'Pricing Display Format',
        variants: {
          control: 'table',
          variant_a: 'cards',
          variant_b: 'list'
        },
        traffic: 0.5,
        active: true
      }
    ];

    tests.forEach(test => {
      this.abTests.set(test.id, test);
    });

    console.log(`🧪 Configured ${tests.length} A/B tests`);
  }

  getABTestVariants(userId) {
    const variants = {};
    
    for (const [testId, test] of this.abTests) {
      if (!test.active) continue;
      
      // Deterministic assignment based on user ID
      const hash = this.hashUserId(userId + testId);
      const bucket = hash % 100;
      
      if (bucket < test.traffic * 100) {
        const variantKeys = Object.keys(test.variants);
        const variantIndex = hash % variantKeys.length;
        variants[testId] = variantKeys[variantIndex];
      }
    }
    
    return variants;
  }

  applyABTestVariants(personalization, abTestVariants) {
    // Apply A/B test overrides
    for (const [testId, variant] of Object.entries(abTestVariants)) {
      if (testId === 'hero_cta_test') {
        personalization.variants.hero_cta_text = variant;
      } else if (testId === 'pricing_display_test') {
        personalization.variants.pricing_format = variant;
      }
    }
  }

  hashUserId(input) {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  getDefaultPersonalization() {
    return {
      userId: 'anonymous',
      timestamp: Date.now(),
      level: 'basic',
      variants: {
        hero_banner: 'default',
        service_recommendations: 'default',
        pricing_display: 'default',
        testimonials: 'default',
        contact_method: 'default'
      },
      recommendations: {
        services: ['laptop-repair', 'data-recovery', 'virus-removal'],
        content: ['basic-guide'],
        offers: []
      },
      metadata: {
        audiences: [],
        mlScores: {},
        behaviorProfile: {},
        abTests: {}
      }
    };
  }

  generateCacheKey(userId, context) {
    const contextHash = this.hashUserId(JSON.stringify(context));
    return `${userId}_${contextHash}`;
  }

  startCacheCleanup() {
    setInterval(() => {
      this.cleanupCache();
    }, 60000); // Clean every minute
  }

  cleanupCache() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.personalizations) {
      if (now - entry.timestamp > this.options.cacheTimeout) {
        this.personalizations.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} expired personalization entries`);
    }
  }

  updateMetrics(responseTime) {
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * (this.metrics.personalizationsServed) + responseTime) / 
      (this.metrics.personalizationsServed + 1);
  }

  getMetrics() {
    return {
      ...this.metrics,
      cacheSize: this.personalizations.size,
      cacheHitRate: this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) || 0,
      contentVariants: this.contentVariants.size,
      activeABTests: Array.from(this.abTests.values()).filter(test => test.active).length
    };
  }

  async trackEngagement(userId, personalizationId, engagement) {
    try {
      // Track engagement for personalization effectiveness
      this.emit('engagementTracked', {
        userId,
        personalizationId,
        engagement,
        timestamp: Date.now()
      });

      // Update engagement lift metrics
      // This would integrate with analytics to measure lift
      
    } catch (error) {
      console.error('❌ Engagement tracking failed:', error);
    }
  }

  async getContentVariant(variantId, variantType = 'default') {
    const variant = this.contentVariants.get(variantId);
    if (!variant) return null;

    return variant.variants[variantType] || variant.variants.default;
  }
}

module.exports = PersonalizationEngine;