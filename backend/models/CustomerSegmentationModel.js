const tf = require('@tensorflow/tfjs-node');

class CustomerSegmentationModel {
  constructor() {
    this.model = null;
    this.scaler = null;
    this.isReady = false;
    this.version = '1.0.0';
    this.targetSegments = { min: 8, max: 12 };
    this.segmentLabels = [
      'High-Value Loyalists',
      'Tech Enthusiasts', 
      'Budget-Conscious',
      'Emergency Seekers',
      'Business Customers',
      'Casual Users',
      'Price Shoppers',
      'Quality Seekers',
      'New Customers',
      'At-Risk Customers',
      'Seasonal Users',
      'Premium Service'
    ];
    
    // Customer behavior features for segmentation
    this.segmentationFeatures = {
      // Transaction behavior (40% weight)
      averageRepairValue: 0.15,
      serviceFrequency: 0.10,
      totalLifetimeValue: 0.15,
      
      // Engagement patterns (30% weight)
      websiteEngagement: 0.10,
      supportInteractions: 0.08,
      brandLoyalty: 0.12,
      
      // Demographics (20% weight)
      customerAge: 0.05,
      businessCustomer: 0.08,
      location: 0.07,
      
      // Preferences (10% weight)
      serviceSpeed: 0.03,
      pricesensitivity: 0.04,
      qualityFocus: 0.03
    };
  }

  async initialize() {
    try {
      console.log('🎭 Initializing Customer Segmentation Model...');
      
      // Try to load existing model
      try {
        this.model = await tf.loadLayersModel('file:///opt/webapps/revivatech/backend/models/saved/customer_segmentation');
        console.log('📦 Loaded existing customer segmentation model');
      } catch (error) {
        console.log('🔨 Creating new customer segmentation model');
        await this.createModel();
      }

      // Initialize feature scaler
      this.initializeScaler();
      
      this.isReady = true;
      console.log('✅ Customer Segmentation Model ready');
      
      return true;
    } catch (error) {
      console.error('❌ Customer Segmentation Model initialization failed:', error);
      throw error;
    }
  }

  createModel() {
    // Autoencoder + K-means hybrid approach for customer segmentation
    
    // Encoder part (dimensionality reduction)
    const encoder = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [13], // 13 behavioral features
          units: 64,
          activation: 'relu',
          name: 'encoder_layer1'
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: 32,
          activation: 'relu',
          name: 'encoder_layer2'
        }),
        tf.layers.dense({
          units: 16,
          activation: 'relu',
          name: 'bottleneck'
        })
      ]
    });

    // Decoder part (reconstruction)
    const decoder = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [16],
          units: 32,
          activation: 'relu',
          name: 'decoder_layer1'
        }),
        tf.layers.dense({
          units: 64,
          activation: 'relu',
          name: 'decoder_layer2'
        }),
        tf.layers.dense({
          units: 13,
          activation: 'sigmoid',
          name: 'decoder_output'
        })
      ]
    });

    // Full autoencoder
    const autoencoder = tf.sequential();
    encoder.layers.forEach(layer => autoencoder.add(layer));
    decoder.layers.forEach(layer => autoencoder.add(layer));

    // Compile autoencoder
    autoencoder.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError'
    });

    this.model = autoencoder;
    this.encoder = encoder;
    
    return autoencoder;
  }

  initializeScaler() {
    this.scaler = {
      averageRepairValue: { min: 50, max: 2000 },
      serviceFrequency: { min: 0, max: 24 }, // services per year
      totalLifetimeValue: { min: 0, max: 10000 },
      websiteEngagement: { min: 0, max: 100 }, // engagement score
      supportInteractions: { min: 0, max: 50 },
      brandLoyalty: { min: 0, max: 100 }, // loyalty score
      customerAge: { min: 18, max: 80 },
      businessCustomer: { min: 0, max: 1 }, // boolean
      location: { min: 0, max: 1 }, // urban=1, rural=0
      serviceSpeed: { min: 1, max: 5 }, // preference scale
      priceSensitivity: { min: 1, max: 5 }, // scale
      qualityFocus: { min: 1, max: 5 }, // scale
      tenure: { min: 0, max: 120 } // months as customer
    };
  }

  async predict(customerData) {
    if (!this.isReady) {
      throw new Error('Customer segmentation model not initialized');
    }

    try {
      // Handle both single customer and batch processing
      const customers = Array.isArray(customerData) ? customerData : [customerData];
      const features = customers.map(customer => this.extractFeatures(customer));
      
      // Normalize features
      const normalizedFeatures = features.map(feature => this.normalizeFeatures(feature));
      
      // Get encoded representations (lower dimensional)
      const inputTensor = tf.tensor2d(normalizedFeatures);
      const encodedTensor = this.encoder.predict(inputTensor);
      const encodedData = await encodedTensor.data();
      
      // Perform K-means clustering on encoded features
      const clusters = await this.performKMeansClustering(encodedData, customers.length);
      
      // Cleanup tensors
      inputTensor.dispose();
      encodedTensor.dispose();
      
      // Format results with segment characteristics
      const results = customers.map((customer, index) => {
        const segmentId = clusters[index];
        const segmentProfile = this.getSegmentProfile(features[index], segmentId);
        
        return {
          customerId: customer.id || `customer_${Date.now()}_${index}`,
          segmentId: segmentId,
          segmentName: this.segmentLabels[segmentId] || `Segment ${segmentId}`,
          segmentProfile: segmentProfile,
          characteristics: this.getCustomerCharacteristics(features[index]),
          marketingPersona: this.getMarketingPersona(segmentId),
          recommendedStrategy: this.getSegmentStrategy(segmentId),
          timestamp: new Date().toISOString()
        };
      });

      return Array.isArray(customerData) ? results : results[0];
    } catch (error) {
      console.error('❌ Customer segmentation prediction failed:', error);
      throw error;
    }
  }

  async performKMeansClustering(encodedData, numCustomers) {
    // Simple K-means implementation for clustering
    const k = Math.min(this.targetSegments.max, Math.max(this.targetSegments.min, Math.ceil(numCustomers / 50)));
    const features = 16; // encoded feature dimension
    
    // Reshape encoded data
    const dataPoints = [];
    for (let i = 0; i < numCustomers; i++) {
      const point = [];
      for (let j = 0; j < features; j++) {
        point.push(encodedData[i * features + j]);
      }
      dataPoints.push(point);
    }
    
    // Initialize centroids randomly
    const centroids = [];
    for (let i = 0; i < k; i++) {
      const centroid = [];
      for (let j = 0; j < features; j++) {
        centroid.push(Math.random());
      }
      centroids.push(centroid);
    }
    
    // K-means iterations
    let assignments = new Array(numCustomers).fill(0);
    const maxIterations = 100;
    
    for (let iter = 0; iter < maxIterations; iter++) {
      // Assign points to nearest centroid
      const newAssignments = dataPoints.map(point => {
        let minDistance = Infinity;
        let assignment = 0;
        
        centroids.forEach((centroid, idx) => {
          const distance = this.euclideanDistance(point, centroid);
          if (distance < minDistance) {
            minDistance = distance;
            assignment = idx;
          }
        });
        
        return assignment;
      });
      
      // Check convergence
      if (JSON.stringify(assignments) === JSON.stringify(newAssignments)) {
        break;
      }
      assignments = newAssignments;
      
      // Update centroids
      for (let i = 0; i < k; i++) {
        const clusterPoints = dataPoints.filter((_, idx) => assignments[idx] === i);
        if (clusterPoints.length > 0) {
          for (let j = 0; j < features; j++) {
            centroids[i][j] = clusterPoints.reduce((sum, point) => sum + point[j], 0) / clusterPoints.length;
          }
        }
      }
    }
    
    return assignments;
  }

  euclideanDistance(point1, point2) {
    return Math.sqrt(
      point1.reduce((sum, val, idx) => sum + Math.pow(val - point2[idx], 2), 0)
    );
  }

  extractFeatures(customer) {
    return [
      customer.averageRepairValue || 200,
      customer.serviceFrequency || 2,
      customer.totalLifetimeValue || 500,
      customer.websiteEngagement || 50,
      customer.supportInteractions || 1,
      customer.brandLoyalty || 70,
      customer.age || 35,
      customer.isBusinessCustomer ? 1 : 0,
      customer.isUrbanLocation ? 1 : 0,
      customer.serviceSpeedPreference || 3,
      customer.priceSensitivity || 3,
      customer.qualityFocus || 4,
      customer.tenureMonths || 12
    ];
  }

  normalizeFeatures(features) {
    const featureNames = Object.keys(this.scaler);
    return features.map((value, index) => {
      const featureName = featureNames[index];
      const { min, max } = this.scaler[featureName];
      return Math.max(0, Math.min(1, (value - min) / (max - min)));
    });
  }

  getSegmentProfile(features, segmentId) {
    const featureNames = [
      'averageRepairValue', 'serviceFrequency', 'totalLifetimeValue',
      'websiteEngagement', 'supportInteractions', 'brandLoyalty',
      'customerAge', 'businessCustomer', 'location',
      'serviceSpeed', 'priceSensitivity', 'qualityFocus', 'tenure'
    ];

    const profile = {};
    features.forEach((value, index) => {
      profile[featureNames[index]] = value;
    });

    // Add segment-specific insights
    profile.primaryDrivers = this.getSegmentDrivers(segmentId);
    profile.valueProposition = this.getValueProposition(segmentId);
    
    return profile;
  }

  getCustomerCharacteristics(features) {
    const characteristics = [];
    
    // High value
    if (features[2] > 0.7) characteristics.push('high_value');
    
    // Frequent user
    if (features[1] > 0.6) characteristics.push('frequent_user');
    
    // Price sensitive
    if (features[10] > 0.7) characteristics.push('price_sensitive');
    
    // Quality focused
    if (features[11] > 0.7) characteristics.push('quality_focused');
    
    // Business customer
    if (features[7] === 1) characteristics.push('business_customer');
    
    // High engagement
    if (features[3] > 0.6) characteristics.push('highly_engaged');
    
    // Loyal customer
    if (features[5] > 0.8) characteristics.push('brand_loyal');
    
    return characteristics;
  }

  getSegmentDrivers(segmentId) {
    const drivers = {
      0: ['high_value', 'brand_loyalty', 'service_quality'],
      1: ['latest_technology', 'innovation', 'premium_service'],
      2: ['price_sensitivity', 'value_for_money', 'basic_service'],
      3: ['urgency', 'convenience', 'fast_turnaround'],
      4: ['reliability', 'business_continuity', 'professional_service'],
      5: ['simplicity', 'basic_needs', 'occasional_use'],
      6: ['lowest_price', 'cost_comparison', 'budget_constraints'],
      7: ['premium_quality', 'craftsmanship', 'attention_to_detail'],
      8: ['onboarding', 'education', 'trust_building'],
      9: ['retention', 'win_back', 'relationship_recovery'],
      10: ['seasonal_patterns', 'specific_timing', 'periodic_needs'],
      11: ['luxury_experience', 'white_glove_service', 'exclusivity']
    };
    
    return drivers[segmentId] || ['general_service', 'standard_quality'];
  }

  getValueProposition(segmentId) {
    const propositions = {
      0: 'Exclusive benefits and premium service for our most valued customers',
      1: 'Cutting-edge solutions and latest technology for tech-forward users',
      2: 'Best value repairs with transparent pricing and reliable service',
      3: 'Fast, efficient service when you need it most',
      4: 'Professional, reliable service designed for business continuity',
      5: 'Simple, straightforward repairs for everyday needs',
      6: 'Competitive pricing without compromising on quality',
      7: 'Premium craftsmanship and attention to detail',
      8: 'Welcoming service and expert guidance for new customers',
      9: 'Renewed commitment to excellence and customer satisfaction',
      10: 'Flexible service options that fit your schedule',
      11: 'Luxury repair experience with white-glove service'
    };
    
    return propositions[segmentId] || 'Quality repair service tailored to your needs';
  }

  getMarketingPersona(segmentId) {
    const personas = {
      0: { name: 'VIP Champion', communication: 'Personal, exclusive', channels: ['phone', 'email', 'in-person'] },
      1: { name: 'Tech Pioneer', communication: 'Technical, innovative', channels: ['social', 'blog', 'newsletter'] },
      2: { name: 'Value Hunter', communication: 'Price-focused, clear', channels: ['email', 'sms', 'website'] },
      3: { name: 'Crisis Solver', communication: 'Urgent, empathetic', channels: ['phone', 'sms', 'chat'] },
      4: { name: 'Business Pro', communication: 'Professional, efficient', channels: ['email', 'portal', 'phone'] },
      5: { name: 'Simple Simon', communication: 'Clear, straightforward', channels: ['phone', 'email'] },
      6: { name: 'Budget Buyer', communication: 'Price-focused', channels: ['comparison sites', 'email'] },
      7: { name: 'Quality Seeker', communication: 'Detail-oriented', channels: ['reviews', 'testimonials', 'phone'] },
      8: { name: 'Fresh Start', communication: 'Educational, welcoming', channels: ['tutorial', 'chat', 'guide'] },
      9: { name: 'Win-Back', communication: 'Apologetic, value-driven', channels: ['personal call', 'email'] },
      10: { name: 'Seasonal User', communication: 'Timely, relevant', channels: ['email', 'calendar'] },
      11: { name: 'Premium Elite', communication: 'Exclusive, luxury', channels: ['concierge', 'personal'] }
    };
    
    return personas[segmentId] || { name: 'Standard Customer', communication: 'Friendly, helpful', channels: ['email', 'phone'] };
  }

  getSegmentStrategy(segmentId) {
    const strategies = {
      0: { retention: 'high', acquisition: 'referral', pricing: 'premium' },
      1: { retention: 'medium', acquisition: 'content_marketing', pricing: 'value_based' },
      2: { retention: 'price_based', acquisition: 'competitive_pricing', pricing: 'cost_plus' },
      3: { retention: 'service_speed', acquisition: 'emergency_marketing', pricing: 'premium_urgent' },
      4: { retention: 'reliability', acquisition: 'b2b_sales', pricing: 'contract_based' },
      5: { retention: 'simplicity', acquisition: 'word_of_mouth', pricing: 'standard' },
      6: { retention: 'loyalty_program', acquisition: 'price_comparison', pricing: 'competitive' },
      7: { retention: 'quality_assurance', acquisition: 'reputation_marketing', pricing: 'premium' },
      8: { retention: 'onboarding', acquisition: 'new_customer_offers', pricing: 'introductory' },
      9: { retention: 'win_back_campaigns', acquisition: 'referral_incentives', pricing: 'retention_discount' },
      10: { retention: 'seasonal_reminders', acquisition: 'seasonal_marketing', pricing: 'seasonal_pricing' },
      11: { retention: 'concierge_service', acquisition: 'luxury_partnerships', pricing: 'luxury_premium' }
    };
    
    return strategies[segmentId] || { retention: 'standard', acquisition: 'general', pricing: 'market_rate' };
  }

  async train(trainingData) {
    try {
      console.log('🏋️ Training customer segmentation model...');
      
      if (!trainingData || trainingData.length < 100) {
        console.warn('⚠️ Insufficient training data, using synthetic data');
        trainingData = this.generateSyntheticData(1000);
      }

      // Prepare training data for autoencoder
      const features = trainingData.map(customer => this.extractFeatures(customer));
      const normalizedFeatures = features.map(feature => this.normalizeFeatures(feature));
      
      // Convert to tensors
      const xs = tf.tensor2d(normalizedFeatures);
      
      // For autoencoder, input and output are the same (unsupervised)
      const ys = xs.clone();
      
      // Split into training and validation sets
      const splitIndex = Math.floor(trainingData.length * 0.8);
      const xsTrain = xs.slice([0, 0], [splitIndex, -1]);
      const ysTrain = ys.slice([0, 0], [splitIndex, -1]);
      const xsVal = xs.slice([splitIndex, 0], [-1, -1]);
      const ysVal = ys.slice([splitIndex, 0], [-1, -1]);

      // Training parameters
      const epochs = 200;
      const batchSize = 64;
      
      // Train the autoencoder
      const history = await this.model.fit(xsTrain, ysTrain, {
        epochs,
        batchSize,
        validationData: [xsVal, ysVal],
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            if (epoch % 40 === 0) {
              console.log(`Epoch ${epoch}: loss=${logs.loss.toFixed(4)}, val_loss=${logs.val_loss.toFixed(4)}`);
            }
          }
        }
      });

      // Cleanup tensors
      xs.dispose();
      ys.dispose();
      xsTrain.dispose();
      ysTrain.dispose();
      xsVal.dispose();
      ysVal.dispose();

      // Save model
      await this.saveModel();

      const finalLoss = history.history.val_loss[history.history.val_loss.length - 1];
      console.log(`✅ Customer segmentation training completed - Loss: ${finalLoss.toFixed(4)}`);
      
      return {
        loss: finalLoss,
        epochs: epochs,
        trainingSize: trainingData.length,
        targetSegments: this.targetSegments
      };
    } catch (error) {
      console.error('❌ Customer segmentation training failed:', error);
      throw error;
    }
  }

  generateSyntheticData(count) {
    const data = [];
    
    for (let i = 0; i < count; i++) {
      const customer = {
        id: `synthetic_customer_seg_${i}`,
        averageRepairValue: Math.floor(Math.random() * 1500) + 100,
        serviceFrequency: Math.floor(Math.random() * 12) + 1,
        totalLifetimeValue: Math.floor(Math.random() * 8000) + 200,
        websiteEngagement: Math.floor(Math.random() * 100),
        supportInteractions: Math.floor(Math.random() * 20),
        brandLoyalty: Math.floor(Math.random() * 100),
        age: Math.floor(Math.random() * 50) + 25,
        isBusinessCustomer: Math.random() > 0.7,
        isUrbanLocation: Math.random() > 0.4,
        serviceSpeedPreference: Math.floor(Math.random() * 5) + 1,
        priceSensitivity: Math.floor(Math.random() * 5) + 1,
        qualityFocus: Math.floor(Math.random() * 5) + 1,
        tenureMonths: Math.floor(Math.random() * 60) + 1
      };
      
      data.push(customer);
    }
    
    return data;
  }

  async saveModel() {
    try {
      const savePath = 'file:///opt/webapps/revivatech/backend/models/saved/customer_segmentation';
      await this.model.save(savePath);
      console.log('💾 Customer segmentation model saved');
    } catch (error) {
      console.warn('⚠️ Could not save segmentation model:', error.message);
    }
  }

  async getMetrics() {
    return {
      modelType: 'Customer Segmentation',
      version: this.version,
      isReady: this.isReady,
      targetSegments: this.targetSegments,
      availableSegments: this.segmentLabels.length,
      segmentLabels: this.segmentLabels,
      features: Object.keys(this.segmentationFeatures).length,
      featureWeights: this.segmentationFeatures,
      clusteringMethod: 'Autoencoder + K-means',
      lastUpdate: new Date().toISOString()
    };
  }

  dispose() {
    if (this.model) {
      this.model.dispose();
    }
    if (this.encoder) {
      this.encoder.dispose();
    }
  }
}

module.exports = CustomerSegmentationModel;