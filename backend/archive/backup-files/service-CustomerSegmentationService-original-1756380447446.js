/**
 * Customer Segmentation Service
 * ML-based customer clustering and behavioral segmentation
 * Part of Phase 8 R1.2 implementation
 */

const { Pool } = require('pg');
const Redis = require('redis');

/**
 * Customer Segmentation Service
 * Advanced ML-based customer clustering and behavioral analysis
 */
class CustomerSegmentationService {
  constructor() {
    // Initialize PostgreSQL connection
    this.db = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5435,
      database: process.env.DB_NAME || 'revivatech',
      user: process.env.DB_USER || 'revivatech',
      password: process.env.DB_PASSWORD || 'revivatech_password',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Initialize Redis connection for caching
    const redisConfig = {
      url: process.env.REDIS_URL || process.env.REDIS_INTERNAL_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`
    };
    this.redis = Redis.createClient(redisConfig);

    this.redis.on('error', (err) => console.error('Redis Client Error', err));
    this.redis.connect();

    // Segmentation models and algorithms
    this.segmentationModels = {
      rfm: this.rfmSegmentation.bind(this),
      behavioral: this.behavioralSegmentation.bind(this),
      engagement: this.engagementSegmentation.bind(this),
      lifecycle: this.lifecycleSegmentation.bind(this),
      value: this.valueSegmentation.bind(this),
      kmeans: this.kmeansSegmentation.bind(this)
    };

    // Segment definitions
    this.segmentDefinitions = {
      'Champion': {
        description: 'High-value customers with recent and frequent purchases',
        characteristics: ['High RFM score', 'High engagement', 'Recent activity'],
        recommendations: ['VIP treatment', 'Exclusive offers', 'Loyalty rewards'],
        priority: 'high'
      },
      'Loyal Customer': {
        description: 'Consistent customers with good purchase history',
        characteristics: ['Regular purchases', 'Good engagement', 'Brand loyalty'],
        recommendations: ['Retention campaigns', 'Cross-sell opportunities', 'Referral programs'],
        priority: 'high'
      },
      'Potential Loyalist': {
        description: 'Recent customers with high potential for loyalty',
        characteristics: ['Recent purchases', 'High engagement', 'Growing spend'],
        recommendations: ['Nurture campaigns', 'Onboarding programs', 'Engagement incentives'],
        priority: 'medium'
      },
      'New Customer': {
        description: 'Recently acquired customers',
        characteristics: ['First-time buyers', 'Recent signup', 'Learning behavior'],
        recommendations: ['Welcome series', 'Education content', 'Support resources'],
        priority: 'medium'
      },
      'Promising': {
        description: 'Customers showing positive signals',
        characteristics: ['Increasing activity', 'Good engagement', 'Potential for growth'],
        recommendations: ['Engagement campaigns', 'Product recommendations', 'Incentives'],
        priority: 'medium'
      },
      'Need Attention': {
        description: 'Customers requiring immediate attention',
        characteristics: ['Declining activity', 'Low engagement', 'At-risk'],
        recommendations: ['Re-engagement campaigns', 'Special offers', 'Personal outreach'],
        priority: 'high'
      },
      'About to Sleep': {
        description: 'Customers showing early churn signals',
        characteristics: ['Decreasing activity', 'Low recent engagement', 'Churn risk'],
        recommendations: ['Win-back campaigns', 'Survey for feedback', 'Incentives'],
        priority: 'high'
      },
      'Cannot Lose': {
        description: 'High-value customers at risk of churning',
        characteristics: ['High historical value', 'Low recent activity', 'Churn risk'],
        recommendations: ['Immediate intervention', 'VIP support', 'Personalized offers'],
        priority: 'critical'
      },
      'Hibernating': {
        description: 'Inactive customers with potential',
        characteristics: ['Low activity', 'Past purchases', 'Long dormancy'],
        recommendations: ['Reactivation campaigns', 'New product announcements', 'Incentives'],
        priority: 'low'
      },
      'Lost': {
        description: 'Customers who have likely churned',
        characteristics: ['No recent activity', 'Very low engagement', 'Churned'],
        recommendations: ['Win-back campaigns', 'Feedback surveys', 'Last-chance offers'],
        priority: 'low'
      }
    };
  }

  /**
   * Segment all customers using multiple algorithms
   */
  async segmentAllCustomers() {
    try {
      console.log('Starting customer segmentation process...');
      
      // Get all customer profiles
      const customers = await this.getAllCustomerProfiles();
      
      if (customers.length === 0) {
        console.log('No customers to segment');
        return { success: true, segmented: 0 };
      }

      console.log(`Segmenting ${customers.length} customers...`);

      // Run multiple segmentation algorithms
      const results = await Promise.all([
        this.segmentationModels.rfm(customers),
        this.segmentationModels.behavioral(customers),
        this.segmentationModels.engagement(customers),
        this.segmentationModels.lifecycle(customers),
        this.segmentationModels.value(customers)
      ]);

      // Combine results with weighted scoring
      const combinedSegments = this.combineSegmentationResults(customers, results);

      // Update customer profiles with new segments
      await this.updateCustomerSegments(combinedSegments);

      // Calculate segment statistics
      const segmentStats = this.calculateSegmentStatistics(combinedSegments);

      // Cache results
      await this.cacheSegmentationResults(segmentStats);

      console.log('Customer segmentation completed successfully');
      
      return {
        success: true,
        segmented: combinedSegments.length,
        segments: segmentStats,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error in customer segmentation:', error);
      throw error;
    }
  }

  /**
   * RFM (Recency, Frequency, Monetary) Segmentation
   */
  async rfmSegmentation(customers) {
    console.log('Running RFM segmentation...');
    
    const rfmScores = customers.map(customer => {
      const recency = this.calculateRecencyScore(customer);
      const frequency = this.calculateFrequencyScore(customer);
      const monetary = this.calculateMonetaryScore(customer);
      
      return {
        fingerprint: customer.user_fingerprint,
        recency,
        frequency,
        monetary,
        rfm_score: (recency + frequency + monetary) / 3
      };
    });

    // Sort by RFM score
    rfmScores.sort((a, b) => b.rfm_score - a.rfm_score);

    // Segment based on RFM scores
    const segments = rfmScores.map(score => {
      let segment = 'Lost';
      
      if (score.rfm_score >= 8) {
        segment = 'Champion';
      } else if (score.rfm_score >= 6) {
        segment = 'Loyal Customer';
      } else if (score.rfm_score >= 5) {
        segment = 'Potential Loyalist';
      } else if (score.rfm_score >= 4) {
        segment = 'Promising';
      } else if (score.rfm_score >= 3) {
        segment = 'Need Attention';
      } else if (score.rfm_score >= 2) {
        segment = 'About to Sleep';
      } else if (score.rfm_score >= 1) {
        segment = 'Hibernating';
      }

      return {
        fingerprint: score.fingerprint,
        segment,
        confidence: this.calculateConfidence(score),
        algorithm: 'rfm',
        scores: {
          recency: score.recency,
          frequency: score.frequency,
          monetary: score.monetary,
          total: score.rfm_score
        }
      };
    });

    return segments;
  }

  /**
   * Behavioral Segmentation based on user actions
   */
  async behavioralSegmentation(customers) {
    console.log('Running behavioral segmentation...');
    
    const behavioralScores = await Promise.all(
      customers.map(async customer => {
        const behaviors = await this.getBehavioralFeatures(customer.user_fingerprint);
        
        return {
          fingerprint: customer.user_fingerprint,
          behaviors,
          score: this.calculateBehavioralScore(behaviors)
        };
      })
    );

    // Segment based on behavioral patterns
    const segments = behavioralScores.map(score => {
      let segment = 'Lost';
      
      if (score.behaviors.service_interactions >= 5 && score.behaviors.price_checks >= 3) {
        segment = 'Champion';
      } else if (score.behaviors.booking_completions >= 2) {
        segment = 'Loyal Customer';
      } else if (score.behaviors.booking_starts >= 1 && score.behaviors.engagement_events >= 10) {
        segment = 'Potential Loyalist';
      } else if (score.behaviors.session_count >= 3 && score.behaviors.page_views >= 10) {
        segment = 'Promising';
      } else if (score.behaviors.engagement_events >= 5) {
        segment = 'Need Attention';
      } else if (score.behaviors.page_views >= 3) {
        segment = 'About to Sleep';
      } else if (score.behaviors.session_count >= 1) {
        segment = 'Hibernating';
      }

      return {
        fingerprint: score.fingerprint,
        segment,
        confidence: this.calculateBehavioralConfidence(score.behaviors),
        algorithm: 'behavioral',
        scores: {
          behavioral_score: score.score,
          behaviors: score.behaviors
        }
      };
    });

    return segments;
  }

  /**
   * Engagement-based Segmentation
   */
  async engagementSegmentation(customers) {
    console.log('Running engagement segmentation...');
    
    const segments = customers.map(customer => {
      const engagementScore = customer.engagement_score || 0;
      const sessionDuration = customer.avg_session_duration_seconds || 0;
      const pageViews = customer.total_page_views || 0;
      
      let segment = 'Lost';
      
      if (engagementScore >= 80 && sessionDuration >= 300) {
        segment = 'Champion';
      } else if (engagementScore >= 60 && sessionDuration >= 180) {
        segment = 'Loyal Customer';
      } else if (engagementScore >= 50 && pageViews >= 5) {
        segment = 'Potential Loyalist';
      } else if (engagementScore >= 40) {
        segment = 'New Customer';
      } else if (engagementScore >= 30) {
        segment = 'Promising';
      } else if (engagementScore >= 20) {
        segment = 'Need Attention';
      } else if (engagementScore >= 10) {
        segment = 'About to Sleep';
      } else if (engagementScore > 0) {
        segment = 'Hibernating';
      }

      return {
        fingerprint: customer.user_fingerprint,
        segment,
        confidence: Math.min(1, engagementScore / 100),
        algorithm: 'engagement',
        scores: {
          engagement_score: engagementScore,
          session_duration: sessionDuration,
          page_views: pageViews
        }
      };
    });

    return segments;
  }

  /**
   * Lifecycle Segmentation
   */
  async lifecycleSegmentation(customers) {
    console.log('Running lifecycle segmentation...');
    
    const now = new Date();
    
    const segments = customers.map(customer => {
      const firstSeen = new Date(customer.first_seen_at);
      const lastSeen = new Date(customer.last_seen_at);
      const daysSinceFirst = Math.floor((now - firstSeen) / (1000 * 60 * 60 * 24));
      const daysSinceLast = Math.floor((now - lastSeen) / (1000 * 60 * 60 * 24));
      const totalBookings = customer.total_bookings || 0;
      
      let segment = 'Lost';
      
      if (daysSinceFirst <= 7) {
        segment = 'New Customer';
      } else if (totalBookings >= 3 && daysSinceLast <= 30) {
        segment = 'Champion';
      } else if (totalBookings >= 2 && daysSinceLast <= 60) {
        segment = 'Loyal Customer';
      } else if (totalBookings >= 1 && daysSinceLast <= 90) {
        segment = 'Potential Loyalist';
      } else if (daysSinceLast <= 30) {
        segment = 'Promising';
      } else if (daysSinceLast <= 60) {
        segment = 'Need Attention';
      } else if (daysSinceLast <= 120) {
        segment = 'About to Sleep';
      } else if (daysSinceLast <= 180) {
        segment = 'Hibernating';
      }

      return {
        fingerprint: customer.user_fingerprint,
        segment,
        confidence: this.calculateLifecycleConfidence(daysSinceFirst, daysSinceLast, totalBookings),
        algorithm: 'lifecycle',
        scores: {
          days_since_first: daysSinceFirst,
          days_since_last: daysSinceLast,
          total_bookings: totalBookings
        }
      };
    });

    return segments;
  }

  /**
   * Value-based Segmentation
   */
  async valueSegmentation(customers) {
    console.log('Running value segmentation...');
    
    // Calculate value percentiles
    const values = customers.map(c => c.total_booking_value || 0);
    const sortedValues = values.sort((a, b) => b - a);
    const p90 = sortedValues[Math.floor(sortedValues.length * 0.1)];
    const p75 = sortedValues[Math.floor(sortedValues.length * 0.25)];
    const p50 = sortedValues[Math.floor(sortedValues.length * 0.5)];
    const p25 = sortedValues[Math.floor(sortedValues.length * 0.75)];

    const segments = customers.map(customer => {
      const value = customer.total_booking_value || 0;
      const leadScore = customer.lead_score || 0;
      
      let segment = 'Lost';
      
      if (value >= p90) {
        segment = leadScore >= 70 ? 'Champion' : 'Cannot Lose';
      } else if (value >= p75) {
        segment = leadScore >= 60 ? 'Loyal Customer' : 'Need Attention';
      } else if (value >= p50) {
        segment = leadScore >= 50 ? 'Potential Loyalist' : 'About to Sleep';
      } else if (value >= p25) {
        segment = leadScore >= 40 ? 'Promising' : 'Hibernating';
      } else if (value > 0) {
        segment = 'New Customer';
      }

      return {
        fingerprint: customer.user_fingerprint,
        segment,
        confidence: this.calculateValueConfidence(value, p90, leadScore),
        algorithm: 'value',
        scores: {
          total_value: value,
          lead_score: leadScore,
          value_percentile: this.calculatePercentile(value, sortedValues)
        }
      };
    });

    return segments;
  }

  /**
   * K-means clustering segmentation (simplified implementation)
   */
  async kmeansSegmentation(customers) {
    console.log('Running K-means segmentation...');
    
    // Prepare feature matrix
    const features = customers.map(customer => [
      customer.engagement_score || 0,
      customer.lead_score || 0,
      customer.total_booking_value || 0,
      customer.total_sessions || 0,
      customer.avg_session_duration_seconds || 0,
      customer.days_since_last_visit || 0
    ]);

    // Normalize features
    const normalizedFeatures = this.normalizeFeatures(features);

    // Simple K-means implementation (k=5)
    const clusters = await this.performKMeans(normalizedFeatures, 5);

    // Map clusters to segments
    const segments = customers.map((customer, index) => {
      const cluster = clusters[index];
      const segment = this.mapClusterToSegment(cluster, customer);
      
      return {
        fingerprint: customer.user_fingerprint,
        segment,
        confidence: 0.7, // Fixed confidence for K-means
        algorithm: 'kmeans',
        scores: {
          cluster_id: cluster,
          features: normalizedFeatures[index]
        }
      };
    });

    return segments;
  }

  /**
   * Combine results from multiple segmentation algorithms
   */
  combineSegmentationResults(customers, results) {
    console.log('Combining segmentation results...');
    
    const combined = customers.map(customer => {
      const fingerprint = customer.user_fingerprint;
      
      // Get results from all algorithms
      const algorithmResults = results.map(result => 
        result.find(r => r.fingerprint === fingerprint)
      ).filter(Boolean);

      // Weight different algorithms
      const weights = {
        rfm: 0.3,
        behavioral: 0.25,
        engagement: 0.2,
        lifecycle: 0.15,
        value: 0.1
      };

      // Calculate weighted segment scores
      const segmentScores = {};
      
      algorithmResults.forEach(result => {
        const weight = weights[result.algorithm] || 0.1;
        const confidence = result.confidence || 0.5;
        const score = weight * confidence;
        
        if (!segmentScores[result.segment]) {
          segmentScores[result.segment] = 0;
        }
        segmentScores[result.segment] += score;
      });

      // Find highest scoring segment
      const finalSegment = Object.entries(segmentScores)
        .sort(([,a], [,b]) => b - a)[0];

      return {
        fingerprint,
        segment: finalSegment[0],
        confidence: finalSegment[1],
        algorithm_results: algorithmResults,
        combined_score: finalSegment[1]
      };
    });

    return combined;
  }

  /**
   * Update customer segments in database
   */
  async updateCustomerSegments(segments) {
    console.log('Updating customer segments in database...');
    
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');
      
      for (const segment of segments) {
        await client.query(`
          UPDATE user_behavior_profiles 
          SET 
            customer_segment = $1,
            segmentation_confidence = $2,
            segmentation_algorithm = $3,
            segmentation_updated_at = NOW(),
            last_updated_at = NOW()
          WHERE user_fingerprint = $4
        `, [
          segment.segment,
          segment.confidence,
          'combined',
          segment.fingerprint
        ]);
      }
      
      await client.query('COMMIT');
      console.log(`Updated ${segments.length} customer segments`);
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Calculate segment statistics
   */
  calculateSegmentStatistics(segments) {
    const stats = {};
    
    segments.forEach(segment => {
      if (!stats[segment.segment]) {
        stats[segment.segment] = {
          count: 0,
          confidence_avg: 0,
          confidence_sum: 0,
          definition: this.segmentDefinitions[segment.segment] || {},
          customers: []
        };
      }
      
      stats[segment.segment].count++;
      stats[segment.segment].confidence_sum += segment.confidence;
      stats[segment.segment].customers.push(segment.fingerprint);
    });
    
    // Calculate averages
    Object.keys(stats).forEach(segment => {
      stats[segment].confidence_avg = stats[segment].confidence_sum / stats[segment].count;
      stats[segment].percentage = (stats[segment].count / segments.length) * 100;
    });
    
    return stats;
  }

  /**
   * Cache segmentation results
   */
  async cacheSegmentationResults(stats) {
    try {
      await this.redis.setEx(
        'customer_segments',
        3600, // 1 hour
        JSON.stringify({
          stats,
          timestamp: new Date().toISOString(),
          total_customers: Object.values(stats).reduce((sum, s) => sum + s.count, 0)
        })
      );
    } catch (error) {
      console.error('Error caching segmentation results:', error);
    }
  }

  /**
   * Get segment recommendations for a customer
   */
  async getSegmentRecommendations(fingerprint) {
    try {
      const result = await this.db.query(
        'SELECT customer_segment, segmentation_confidence FROM user_behavior_profiles WHERE user_fingerprint = $1',
        [fingerprint]
      );
      
      if (result.rows.length === 0) {
        return { error: 'Customer not found' };
      }
      
      const segment = result.rows[0].customer_segment;
      const confidence = result.rows[0].segmentation_confidence;
      const definition = this.segmentDefinitions[segment] || {};
      
      return {
        segment,
        confidence,
        definition,
        recommendations: definition.recommendations || [],
        priority: definition.priority || 'low'
      };
    } catch (error) {
      console.error('Error getting segment recommendations:', error);
      throw error;
    }
  }

  /**
   * Utility functions
   */
  async getAllCustomerProfiles() {
    const result = await this.db.query(`
      SELECT 
        user_fingerprint,
        engagement_score,
        lead_score,
        total_booking_value,
        total_bookings,
        total_sessions,
        avg_session_duration_seconds,
        total_page_views,
        days_since_last_visit,
        first_seen_at,
        last_seen_at,
        churn_risk_score,
        conversion_probability
      FROM user_behavior_profiles
      WHERE last_seen_at >= NOW() - INTERVAL '1 year'
    `);
    
    return result.rows;
  }

  async getBehavioralFeatures(fingerprint) {
    const result = await this.db.query(`
      SELECT 
        COUNT(*) as total_events,
        COUNT(DISTINCT session_id) as session_count,
        COUNT(CASE WHEN event_type = 'page_view' THEN 1 END) as page_views,
        COUNT(CASE WHEN event_type = 'service_interest' THEN 1 END) as service_interactions,
        COUNT(CASE WHEN event_type = 'price_check' THEN 1 END) as price_checks,
        COUNT(CASE WHEN event_type = 'booking_started' THEN 1 END) as booking_starts,
        COUNT(CASE WHEN event_type = 'booking_completed' THEN 1 END) as booking_completions,
        COUNT(CASE WHEN event_type IN ('click', 'scroll_depth', 'form_interaction') THEN 1 END) as engagement_events
      FROM analytics_events
      WHERE user_fingerprint = $1 AND created_at >= NOW() - INTERVAL '90 days'
    `, [fingerprint]);
    
    return result.rows[0] || {};
  }

  calculateRecencyScore(customer) {
    const daysSinceLast = customer.days_since_last_visit || 0;
    if (daysSinceLast <= 7) return 10;
    if (daysSinceLast <= 30) return 8;
    if (daysSinceLast <= 90) return 6;
    if (daysSinceLast <= 180) return 4;
    if (daysSinceLast <= 365) return 2;
    return 1;
  }

  calculateFrequencyScore(customer) {
    const sessions = customer.total_sessions || 0;
    if (sessions >= 20) return 10;
    if (sessions >= 10) return 8;
    if (sessions >= 5) return 6;
    if (sessions >= 3) return 4;
    if (sessions >= 1) return 2;
    return 1;
  }

  calculateMonetaryScore(customer) {
    const value = customer.total_booking_value || 0;
    if (value >= 1000) return 10;
    if (value >= 500) return 8;
    if (value >= 200) return 6;
    if (value >= 100) return 4;
    if (value > 0) return 2;
    return 1;
  }

  calculateConfidence(score) {
    return Math.min(1, score.rfm_score / 10);
  }

  calculateBehavioralScore(behaviors) {
    const weights = {
      service_interactions: 0.3,
      booking_completions: 0.25,
      booking_starts: 0.2,
      price_checks: 0.15,
      engagement_events: 0.1
    };
    
    let score = 0;
    Object.entries(weights).forEach(([key, weight]) => {
      score += (behaviors[key] || 0) * weight;
    });
    
    return Math.min(10, score);
  }

  calculateBehavioralConfidence(behaviors) {
    const totalEvents = Object.values(behaviors).reduce((sum, val) => sum + (val || 0), 0);
    return Math.min(1, totalEvents / 50); // Confidence based on data volume
  }

  calculateLifecycleConfidence(daysSinceFirst, daysSinceLast, totalBookings) {
    let confidence = 0.5;
    
    if (daysSinceFirst > 30) confidence += 0.2; // More data = higher confidence
    if (totalBookings > 0) confidence += 0.2; // Purchase history = higher confidence
    if (daysSinceLast <= 30) confidence += 0.1; // Recent activity = higher confidence
    
    return Math.min(1, confidence);
  }

  calculateValueConfidence(value, p90, leadScore) {
    let confidence = 0.4;
    
    if (value > 0) confidence += 0.3; // Has purchase history
    if (value >= p90) confidence += 0.2; // High value customer
    if (leadScore >= 70) confidence += 0.1; // High lead score
    
    return Math.min(1, confidence);
  }

  calculatePercentile(value, sortedValues) {
    const index = sortedValues.indexOf(value);
    return index === -1 ? 0 : ((sortedValues.length - index) / sortedValues.length) * 100;
  }

  normalizeFeatures(features) {
    const means = [];
    const stds = [];
    
    // Calculate means and standard deviations
    for (let i = 0; i < features[0].length; i++) {
      const column = features.map(row => row[i]);
      const mean = column.reduce((sum, val) => sum + val, 0) / column.length;
      const std = Math.sqrt(column.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / column.length);
      means.push(mean);
      stds.push(std || 1); // Avoid division by zero
    }
    
    // Normalize features
    return features.map(row => 
      row.map((val, i) => (val - means[i]) / stds[i])
    );
  }

  async performKMeans(features, k) {
    // Simplified K-means implementation
    const n = features.length;
    const d = features[0].length;
    
    // Initialize centroids randomly
    let centroids = [];
    for (let i = 0; i < k; i++) {
      centroids.push(features[Math.floor(Math.random() * n)]);
    }
    
    let clusters = new Array(n);
    let converged = false;
    let iterations = 0;
    
    while (!converged && iterations < 100) {
      // Assign points to nearest centroid
      for (let i = 0; i < n; i++) {
        let minDistance = Infinity;
        let closestCentroid = 0;
        
        for (let j = 0; j < k; j++) {
          const distance = this.euclideanDistance(features[i], centroids[j]);
          if (distance < minDistance) {
            minDistance = distance;
            closestCentroid = j;
          }
        }
        
        clusters[i] = closestCentroid;
      }
      
      // Update centroids
      const newCentroids = [];
      for (let i = 0; i < k; i++) {
        const clusterPoints = features.filter((_, index) => clusters[index] === i);
        if (clusterPoints.length > 0) {
          const centroid = new Array(d).fill(0);
          for (let j = 0; j < d; j++) {
            centroid[j] = clusterPoints.reduce((sum, point) => sum + point[j], 0) / clusterPoints.length;
          }
          newCentroids.push(centroid);
        } else {
          newCentroids.push(centroids[i]); // Keep old centroid if no points
        }
      }
      
      // Check for convergence
      converged = true;
      for (let i = 0; i < k; i++) {
        if (this.euclideanDistance(centroids[i], newCentroids[i]) > 0.001) {
          converged = false;
          break;
        }
      }
      
      centroids = newCentroids;
      iterations++;
    }
    
    return clusters;
  }

  euclideanDistance(point1, point2) {
    return Math.sqrt(
      point1.reduce((sum, val, i) => sum + Math.pow(val - point2[i], 2), 0)
    );
  }

  mapClusterToSegment(cluster, customer) {
    // Simple mapping based on cluster characteristics
    const segmentMap = {
      0: 'Champion',
      1: 'Loyal Customer',
      2: 'Potential Loyalist',
      3: 'Need Attention',
      4: 'Lost'
    };
    
    return segmentMap[cluster] || 'Unknown';
  }

  /**
   * Get cached segmentation results
   */
  async getCachedSegmentationResults() {
    try {
      const cached = await this.redis.get('customer_segments');
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Error getting cached segmentation results:', error);
      return null;
    }
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    await this.redis.quit();
    await this.db.end();
  }
}

module.exports = CustomerSegmentationService;