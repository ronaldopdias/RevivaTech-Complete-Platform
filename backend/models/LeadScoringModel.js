const tf = require('@tensorflow/tfjs-node');

class LeadScoringModel {
  constructor() {
    this.model = null;
    this.scaler = null;
    this.isReady = false;
    this.version = '1.0.0';
    this.accuracyTarget = 0.80;
    this.lastAccuracy = 0;
    
    // Feature weights based on repair business context
    this.featureWeights = {
      // Behavioral indicators (40% weight)
      pageViews: 0.15,
      timeOnSite: 0.10,
      servicePageVisits: 0.15,
      
      // Engagement signals (30% weight)
      formInteractions: 0.20,
      pricingPageViews: 0.10,
      
      // Demographic factors (20% weight)
      deviceAge: 0.08,
      deviceValue: 0.07,
      location: 0.05,
      
      // Urgency indicators (10% weight)
      repairUrgency: 0.05,
      previousCustomer: 0.05
    };
  }

  async initialize() {
    try {
      console.log('🎯 Initializing Lead Scoring Model...');
      
      // Try to load existing model
      try {
        this.model = await tf.loadLayersModel('file:///opt/webapps/revivatech/backend/models/saved/lead_scoring');
        console.log('📦 Loaded existing lead scoring model');
      } catch (error) {
        console.log('🔨 Creating new lead scoring model');
        await this.createModel();
      }

      // Initialize feature scaler
      this.initializeScaler();
      
      this.isReady = true;
      console.log('✅ Lead Scoring Model ready');
      
      return true;
    } catch (error) {
      console.error('❌ Lead Scoring Model initialization failed:', error);
      throw error;
    }
  }

  createModel() {
    // Neural network for lead scoring
    // Input features: 11 dimensions
    const model = tf.sequential({
      layers: [
        // Input layer
        tf.layers.dense({
          inputShape: [11],
          units: 64,
          activation: 'relu',
          kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
        }),
        
        // Hidden layers with dropout for regularization
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({
          units: 32,
          activation: 'relu',
          kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
        }),
        
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: 16,
          activation: 'relu'
        }),
        
        // Output layer: lead score (0-1)
        tf.layers.dense({
          units: 1,
          activation: 'sigmoid'
        })
      ]
    });

    // Compile with appropriate optimizer and loss
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });

    this.model = model;
    return model;
  }

  initializeScaler() {
    // Simple min-max scaler for feature normalization
    this.scaler = {
      pageViews: { min: 0, max: 100 },
      timeOnSite: { min: 0, max: 3600 }, // seconds
      servicePageVisits: { min: 0, max: 20 },
      formInteractions: { min: 0, max: 10 },
      pricingPageViews: { min: 0, max: 5 },
      deviceAge: { min: 0, max: 10 }, // years
      deviceValue: { min: 100, max: 3000 }, // GBP
      location: { min: 0, max: 1 }, // categorical: urban=1, rural=0
      repairUrgency: { min: 1, max: 5 }, // scale 1-5
      previousCustomer: { min: 0, max: 1 }, // boolean
      daysSinceLastVisit: { min: 0, max: 365 }
    };
  }

  async predict(leadData) {
    if (!this.isReady) {
      throw new Error('Lead scoring model not initialized');
    }

    try {
      // Handle both single lead and batch processing
      const leads = Array.isArray(leadData) ? leadData : [leadData];
      const features = leads.map(lead => this.extractFeatures(lead));
      
      // Normalize features
      const normalizedFeatures = features.map(feature => this.normalizeFeatures(feature));
      
      // Convert to tensor
      const inputTensor = tf.tensor2d(normalizedFeatures);
      
      // Get predictions
      const predictions = await this.model.predict(inputTensor);
      const scores = await predictions.data();
      
      // Cleanup tensors
      inputTensor.dispose();
      predictions.dispose();
      
      // Format results
      const results = leads.map((lead, index) => ({
        leadId: lead.id || `lead_${Date.now()}_${index}`,
        score: Math.round(scores[index] * 100), // Convert to 0-100 scale
        confidence: this.calculateConfidence(scores[index]),
        category: this.categorizeScore(scores[index]),
        factors: this.explainScore(features[index]),
        timestamp: new Date().toISOString()
      }));

      return Array.isArray(leadData) ? results : results[0];
    } catch (error) {
      console.error('❌ Lead scoring prediction failed:', error);
      throw error;
    }
  }

  extractFeatures(lead) {
    // Extract and validate features from lead data
    return [
      lead.pageViews || 0,
      lead.timeOnSite || 0,
      lead.servicePageVisits || 0,
      lead.formInteractions || 0,
      lead.pricingPageViews || 0,
      lead.deviceAge || 0,
      lead.deviceValue || 500,
      lead.isUrbanLocation ? 1 : 0,
      lead.repairUrgency || 3,
      lead.isPreviousCustomer ? 1 : 0,
      lead.daysSinceLastVisit || 0
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

  calculateConfidence(score) {
    // Confidence based on distance from decision boundary (0.5)
    const distance = Math.abs(score - 0.5);
    return Math.round(distance * 200); // Convert to 0-100%
  }

  categorizeScore(score) {
    if (score >= 0.8) return 'hot';
    if (score >= 0.6) return 'warm';
    if (score >= 0.4) return 'cold';
    return 'ice_cold';
  }

  explainScore(features) {
    const featureNames = [
      'pageViews', 'timeOnSite', 'servicePageVisits', 'formInteractions',
      'pricingPageViews', 'deviceAge', 'deviceValue', 'location',
      'repairUrgency', 'previousCustomer', 'daysSinceLastVisit'
    ];

    const weights = Object.values(this.featureWeights);
    const contributions = features.map((value, index) => ({
      feature: featureNames[index],
      value: value,
      weight: weights[index],
      contribution: value * weights[index]
    }));

    // Sort by contribution (highest first)
    return contributions
      .sort((a, b) => b.contribution - a.contribution)
      .slice(0, 5); // Top 5 factors
  }

  async train(trainingData) {
    try {
      console.log('🏋️ Training lead scoring model...');
      
      if (!trainingData || trainingData.length < 100) {
        console.warn('⚠️ Insufficient training data, using synthetic data');
        trainingData = this.generateSyntheticData(1000);
      }

      // Prepare training data
      const features = trainingData.map(lead => this.extractFeatures(lead));
      const labels = trainingData.map(lead => lead.converted ? 1 : 0);
      
      // Normalize features
      const normalizedFeatures = features.map(feature => this.normalizeFeatures(feature));
      
      // Convert to tensors
      const xs = tf.tensor2d(normalizedFeatures);
      const ys = tf.tensor2d(labels, [labels.length, 1]);
      
      // Split into training and validation sets
      const splitIndex = Math.floor(trainingData.length * 0.8);
      const xsTrain = xs.slice([0, 0], [splitIndex, -1]);
      const ysTrain = ys.slice([0, 0], [splitIndex, -1]);
      const xsVal = xs.slice([splitIndex, 0], [-1, -1]);
      const ysVal = ys.slice([splitIndex, 0], [-1, -1]);

      // Training parameters
      const epochs = 100;
      const batchSize = 32;
      
      // Train the model
      const history = await this.model.fit(xsTrain, ysTrain, {
        epochs,
        batchSize,
        validationData: [xsVal, ysVal],
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            if (epoch % 20 === 0) {
              console.log(`Epoch ${epoch}: accuracy=${logs.acc.toFixed(4)}, val_accuracy=${logs.val_acc.toFixed(4)}`);
            }
          }
        }
      });

      // Get final accuracy
      const finalAccuracy = history.history.val_acc[history.history.val_acc.length - 1];
      this.lastAccuracy = finalAccuracy;

      // Cleanup tensors
      xs.dispose();
      ys.dispose();
      xsTrain.dispose();
      ysTrain.dispose();
      xsVal.dispose();
      ysVal.dispose();

      // Save model
      await this.saveModel();

      console.log(`✅ Training completed - Accuracy: ${(finalAccuracy * 100).toFixed(2)}%`);
      
      return {
        accuracy: finalAccuracy,
        meetsTarget: finalAccuracy >= this.accuracyTarget,
        epochs: epochs,
        trainingSize: trainingData.length
      };
    } catch (error) {
      console.error('❌ Lead scoring training failed:', error);
      throw error;
    }
  }

  generateSyntheticData(count) {
    // Generate realistic synthetic training data
    const data = [];
    
    for (let i = 0; i < count; i++) {
      const lead = {
        id: `synthetic_${i}`,
        pageViews: Math.floor(Math.random() * 50) + 1,
        timeOnSite: Math.floor(Math.random() * 1800) + 30,
        servicePageVisits: Math.floor(Math.random() * 10),
        formInteractions: Math.floor(Math.random() * 5),
        pricingPageViews: Math.floor(Math.random() * 3),
        deviceAge: Math.floor(Math.random() * 8) + 1,
        deviceValue: Math.floor(Math.random() * 2000) + 200,
        isUrbanLocation: Math.random() > 0.3,
        repairUrgency: Math.floor(Math.random() * 5) + 1,
        isPreviousCustomer: Math.random() > 0.8,
        daysSinceLastVisit: Math.floor(Math.random() * 30)
      };
      
      // Calculate conversion probability based on features
      let conversionProb = 0;
      conversionProb += Math.min(lead.pageViews / 50, 1) * 0.2;
      conversionProb += Math.min(lead.timeOnSite / 1800, 1) * 0.15;
      conversionProb += Math.min(lead.servicePageVisits / 10, 1) * 0.25;
      conversionProb += Math.min(lead.formInteractions / 5, 1) * 0.3;
      conversionProb += lead.repairUrgency / 5 * 0.1;
      
      lead.converted = Math.random() < conversionProb;
      data.push(lead);
    }
    
    return data;
  }

  async saveModel() {
    try {
      const savePath = 'file:///opt/webapps/revivatech/backend/models/saved/lead_scoring';
      await this.model.save(savePath);
      console.log('💾 Lead scoring model saved');
    } catch (error) {
      console.warn('⚠️ Could not save model:', error.message);
    }
  }

  async getMetrics() {
    return {
      modelType: 'Lead Scoring',
      version: this.version,
      isReady: this.isReady,
      lastAccuracy: this.lastAccuracy,
      accuracyTarget: this.accuracyTarget,
      meetsTarget: this.lastAccuracy >= this.accuracyTarget,
      features: Object.keys(this.featureWeights).length,
      featureWeights: this.featureWeights,
      categories: ['hot', 'warm', 'cold', 'ice_cold'],
      lastUpdate: new Date().toISOString()
    };
  }

  dispose() {
    if (this.model) {
      this.model.dispose();
    }
  }
}

module.exports = LeadScoringModel;