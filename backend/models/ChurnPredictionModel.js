const tf = require('@tensorflow/tfjs-node');

class ChurnPredictionModel {
  constructor() {
    this.model = null;
    this.scaler = null;
    this.isReady = false;
    this.version = '1.0.0';
    this.warningThreshold = 72; // hours
    this.churnThreshold = 0.7; // probability threshold
    
    // Time-based features for churn prediction
    this.timeFeatures = {
      // Service history (30% weight)
      daysSinceLastService: 0.15,
      serviceFrequency: 0.10,
      averageRepairCost: 0.05,
      
      // Engagement patterns (40% weight)
      daysSinceLastLogin: 0.20,
      websiteActivityDecline: 0.10,
      supportTicketFrequency: 0.10,
      
      // Satisfaction indicators (20% weight)
      lastSatisfactionScore: 0.10,
      complaintCount: 0.05,
      recommendationLikelihood: 0.05,
      
      // Business factors (10% weight)
      paymentDelays: 0.05,
      deviceAge: 0.03,
      competitorActivity: 0.02
    };
  }

  async initialize() {
    try {
      
      // Try to load existing model
      try {
        this.model = await tf.loadLayersModel('file:///opt/webapps/revivatech/backend/models/saved/churn_prediction');
      } catch (error) {
        await this.createModel();
      }

      // Initialize feature scaler
      this.initializeScaler();
      
      this.isReady = true;
      
      return true;
    } catch (error) {
      console.error('❌ Churn Prediction Model initialization failed:', error);
      throw error;
    }
  }

  createModel() {
    // LSTM-based model for time series churn prediction
    const model = tf.sequential({
      layers: [
        // Input layer for sequential data
        tf.layers.dense({
          inputShape: [12], // 12 time-based features
          units: 128,
          activation: 'relu'
        }),
        
        // Dropout for regularization
        tf.layers.dropout({ rate: 0.3 }),
        
        // Hidden layers
        tf.layers.dense({
          units: 64,
          activation: 'relu',
          kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
        }),
        
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: 32,
          activation: 'relu'
        }),
        
        tf.layers.dense({
          units: 16,
          activation: 'relu'
        }),
        
        // Output layer: [churn_probability, time_to_churn]
        tf.layers.dense({
          units: 2,
          activation: 'sigmoid'
        })
      ]
    });

    // Compile with custom loss for multi-output
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['accuracy']
    });

    this.model = model;
    return model;
  }

  initializeScaler() {
    // Feature scaling ranges
    this.scaler = {
      daysSinceLastService: { min: 0, max: 365 },
      serviceFrequency: { min: 0, max: 12 }, // services per year
      averageRepairCost: { min: 0, max: 1000 },
      daysSinceLastLogin: { min: 0, max: 180 },
      websiteActivityDecline: { min: 0, max: 100 }, // percentage
      supportTicketFrequency: { min: 0, max: 10 },
      lastSatisfactionScore: { min: 1, max: 5 },
      complaintCount: { min: 0, max: 20 },
      recommendationLikelihood: { min: 0, max: 10 },
      paymentDelays: { min: 0, max: 10 },
      deviceAge: { min: 0, max: 10 },
      competitorActivity: { min: 0, max: 100 } // activity score
    };
  }

  async predict(customerData) {
    if (!this.isReady) {
      throw new Error('Churn prediction model not initialized');
    }

    try {
      // Handle both single customer and batch processing
      const customers = Array.isArray(customerData) ? customerData : [customerData];
      const features = customers.map(customer => this.extractFeatures(customer));
      
      // Normalize features
      const normalizedFeatures = features.map(feature => this.normalizeFeatures(feature));
      
      // Convert to tensor
      const inputTensor = tf.tensor2d(normalizedFeatures);
      
      // Get predictions
      const predictions = await this.model.predict(inputTensor);
      const predictionData = await predictions.data();
      
      // Cleanup tensors
      inputTensor.dispose();
      predictions.dispose();
      
      // Format results
      const results = customers.map((customer, index) => {
        const churnProb = predictionData[index * 2];
        const timeToChurn = predictionData[index * 2 + 1] * 365; // Convert to days
        
        return {
          customerId: customer.id || `customer_${Date.now()}_${index}`,
          churnProbability: Math.round(churnProb * 100) / 100,
          timeToChurn: Math.round(timeToChurn),
          riskLevel: this.calculateRiskLevel(churnProb, timeToChurn),
          isAtRisk: churnProb >= this.churnThreshold && timeToChurn <= this.warningThreshold,
          factors: this.explainChurnRisk(features[index]),
          recommendedActions: this.getRetentionRecommendations(churnProb, timeToChurn),
          timestamp: new Date().toISOString()
        };
      });

      return Array.isArray(customerData) ? results : results[0];
    } catch (error) {
      console.error('❌ Churn prediction failed:', error);
      throw error;
    }
  }

  extractFeatures(customer) {
    const now = new Date();
    const lastService = new Date(customer.lastServiceDate || now);
    const lastLogin = new Date(customer.lastLoginDate || now);
    
    return [
      Math.floor((now - lastService) / (1000 * 60 * 60 * 24)), // daysSinceLastService
      customer.serviceFrequency || 0,
      customer.averageRepairCost || 0,
      Math.floor((now - lastLogin) / (1000 * 60 * 60 * 24)), // daysSinceLastLogin
      customer.websiteActivityDecline || 0,
      customer.supportTicketCount || 0,
      customer.lastSatisfactionScore || 3,
      customer.complaintCount || 0,
      customer.npsScore || 5,
      customer.paymentDelayCount || 0,
      this.calculateDeviceAge(customer.devices) || 2,
      customer.competitorActivityScore || 0
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

  calculateDeviceAge(devices) {
    if (!devices || devices.length === 0) return 2;
    
    const avgAge = devices.reduce((sum, device) => {
      const deviceYear = device.year || new Date().getFullYear() - 2;
      return sum + (new Date().getFullYear() - deviceYear);
    }, 0) / devices.length;
    
    return avgAge;
  }

  calculateRiskLevel(churnProb, timeToChurn) {
    if (churnProb >= 0.8 && timeToChurn <= 30) return 'critical';
    if (churnProb >= 0.7 && timeToChurn <= 72) return 'high';
    if (churnProb >= 0.5 && timeToChurn <= 168) return 'medium';
    if (churnProb >= 0.3) return 'low';
    return 'minimal';
  }

  explainChurnRisk(features) {
    const featureNames = [
      'daysSinceLastService', 'serviceFrequency', 'averageRepairCost',
      'daysSinceLastLogin', 'websiteActivityDecline', 'supportTicketFrequency',
      'lastSatisfactionScore', 'complaintCount', 'recommendationLikelihood',
      'paymentDelays', 'deviceAge', 'competitorActivity'
    ];

    const weights = Object.values(this.timeFeatures);
    const contributions = features.map((value, index) => ({
      factor: featureNames[index],
      value: value,
      weight: weights[index],
      riskContribution: value * weights[index]
    }));

    // Sort by risk contribution (highest first)
    return contributions
      .sort((a, b) => b.riskContribution - a.riskContribution)
      .slice(0, 5); // Top 5 risk factors
  }

  getRetentionRecommendations(churnProb, timeToChurn) {
    const recommendations = [];
    
    if (churnProb >= 0.8) {
      recommendations.push({
        action: 'immediate_personal_call',
        priority: 'critical',
        timing: 'within 24 hours'
      });
      recommendations.push({
        action: 'loyalty_discount_offer',
        priority: 'high',
        timing: 'within 48 hours'
      });
    }
    
    if (churnProb >= 0.7 && timeToChurn <= 72) {
      recommendations.push({
        action: 'proactive_service_check',
        priority: 'high',
        timing: 'within 72 hours'
      });
      recommendations.push({
        action: 'personalized_email_campaign',
        priority: 'medium',
        timing: 'within 1 week'
      });
    }
    
    if (timeToChurn <= 168) { // 1 week
      recommendations.push({
        action: 'satisfaction_survey',
        priority: 'medium',
        timing: 'within 3 days'
      });
    }
    
    return recommendations;
  }

  async train(trainingData) {
    try {
      
      if (!trainingData || trainingData.length < 100) {
        console.warn('⚠️ Insufficient training data, using synthetic data');
        trainingData = this.generateSyntheticData(1000);
      }

      // Prepare training data
      const features = trainingData.map(customer => this.extractFeatures(customer));
      const labels = trainingData.map(customer => [
        customer.didChurn ? 1 : 0,
        customer.timeToChurn ? customer.timeToChurn / 365 : 0.5 // normalized to 0-1
      ]);
      
      // Normalize features
      const normalizedFeatures = features.map(feature => this.normalizeFeatures(feature));
      
      // Convert to tensors
      const xs = tf.tensor2d(normalizedFeatures);
      const ys = tf.tensor2d(labels);
      
      // Split into training and validation sets
      const splitIndex = Math.floor(trainingData.length * 0.8);
      const xsTrain = xs.slice([0, 0], [splitIndex, -1]);
      const ysTrain = ys.slice([0, 0], [splitIndex, -1]);
      const xsVal = xs.slice([splitIndex, 0], [-1, -1]);
      const ysVal = ys.slice([splitIndex, 0], [-1, -1]);

      // Training parameters
      const epochs = 150;
      const batchSize = 32;
      
      // Train the model
      const history = await this.model.fit(xsTrain, ysTrain, {
        epochs,
        batchSize,
        validationData: [xsVal, ysVal],
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            if (epoch % 30 === 0) {
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
      
      return {
        loss: finalLoss,
        epochs: epochs,
        trainingSize: trainingData.length,
        warningThreshold: this.warningThreshold
      };
    } catch (error) {
      console.error('❌ Churn prediction training failed:', error);
      throw error;
    }
  }

  generateSyntheticData(count) {
    const data = [];
    
    for (let i = 0; i < count; i++) {
      const customer = {
        id: `synthetic_customer_${i}`,
        lastServiceDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        lastLoginDate: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000),
        serviceFrequency: Math.floor(Math.random() * 8) + 1,
        averageRepairCost: Math.floor(Math.random() * 500) + 100,
        websiteActivityDecline: Math.floor(Math.random() * 80),
        supportTicketCount: Math.floor(Math.random() * 5),
        lastSatisfactionScore: Math.floor(Math.random() * 5) + 1,
        complaintCount: Math.floor(Math.random() * 3),
        npsScore: Math.floor(Math.random() * 11),
        paymentDelayCount: Math.floor(Math.random() * 3),
        devices: [{ year: 2020 + Math.floor(Math.random() * 5) }],
        competitorActivityScore: Math.floor(Math.random() * 50)
      };
      
      // Calculate churn probability based on features
      let churnProb = 0;
      const daysSinceService = (Date.now() - customer.lastServiceDate) / (1000 * 60 * 60 * 24);
      const daysSinceLogin = (Date.now() - customer.lastLoginDate) / (1000 * 60 * 60 * 24);
      
      churnProb += Math.min(daysSinceService / 180, 1) * 0.3;
      churnProb += Math.min(daysSinceLogin / 90, 1) * 0.2;
      churnProb += (5 - customer.lastSatisfactionScore) / 5 * 0.2;
      churnProb += customer.websiteActivityDecline / 100 * 0.15;
      churnProb += customer.complaintCount / 5 * 0.15;
      
      customer.didChurn = Math.random() < churnProb;
      customer.timeToChurn = customer.didChurn ? Math.random() * 180 : Math.random() * 365 + 180;
      
      data.push(customer);
    }
    
    return data;
  }

  async saveModel() {
    try {
      const savePath = 'file:///opt/webapps/revivatech/backend/models/saved/churn_prediction';
      await this.model.save(savePath);
    } catch (error) {
      console.warn('⚠️ Could not save churn model:', error.message);
    }
  }

  async getMetrics() {
    return {
      modelType: 'Churn Prediction',
      version: this.version,
      isReady: this.isReady,
      warningThreshold: `${this.warningThreshold} hours`,
      churnThreshold: this.churnThreshold,
      features: Object.keys(this.timeFeatures).length,
      riskLevels: ['minimal', 'low', 'medium', 'high', 'critical'],
      featureWeights: this.timeFeatures,
      lastUpdate: new Date().toISOString()
    };
  }

  dispose() {
    if (this.model) {
      this.model.dispose();
    }
  }
}

module.exports = ChurnPredictionModel;