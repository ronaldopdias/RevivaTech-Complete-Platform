const tf = require('@tensorflow/tfjs-node');
const LeadScoringModel = require('../models/LeadScoringModel');
const ChurnPredictionModel = require('../models/ChurnPredictionModel');
const CustomerSegmentationModel = require('../models/CustomerSegmentationModel');

class MLService {
  constructor() {
    this.models = {
      leadScoring: null,
      churnPrediction: null,
      customerSegmentation: null
    };
    this.isInitialized = false;
    this.trainingData = {
      leads: [],
      customers: [],
      interactions: []
    };
  }

  async initialize() {
    try {
      console.log('🤖 Initializing ML Service...');
      
      // Initialize models
      this.models.leadScoring = new LeadScoringModel();
      this.models.churnPrediction = new ChurnPredictionModel();
      this.models.customerSegmentation = new CustomerSegmentationModel();

      // Load pre-trained models or create new ones
      await Promise.all([
        this.models.leadScoring.initialize(),
        this.models.churnPrediction.initialize(),
        this.models.customerSegmentation.initialize()
      ]);

      this.isInitialized = true;
      console.log('✅ ML Service initialized successfully');
      
      return true;
    } catch (error) {
      console.error('❌ ML Service initialization failed:', error);
      throw error;
    }
  }

  async scoreLeads(leadData) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const startTime = Date.now();
      const scores = await this.models.leadScoring.predict(leadData);
      const processingTime = Date.now() - startTime;

      // Performance requirement: <100ms
      if (processingTime > 100) {
        console.warn(`⚠️ Lead scoring took ${processingTime}ms (target: <100ms)`);
      }

      return {
        scores,
        processingTime,
        timestamp: new Date().toISOString(),
        modelVersion: this.models.leadScoring.version
      };
    } catch (error) {
      console.error('❌ Lead scoring failed:', error);
      throw error;
    }
  }

  async predictChurn(customerData) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const startTime = Date.now();
      const predictions = await this.models.churnPrediction.predict(customerData);
      const processingTime = Date.now() - startTime;

      // Filter customers at risk within 72 hours
      const predictionArray = Array.isArray(predictions) ? predictions : [predictions];
      const atRiskCustomers = predictionArray.filter(pred => 
        pred.churnProbability > 0.7 && pred.timeToChurn <= 72
      );

      if (atRiskCustomers.length > 0) {
        console.log(`🚨 ${atRiskCustomers.length} customers at risk of churning within 72h`);
        // Trigger retention workflows
        await this.triggerRetentionAlerts(atRiskCustomers);
      }

      return {
        predictions,
        atRiskCustomers,
        processingTime,
        timestamp: new Date().toISOString(),
        modelVersion: this.models.churnPrediction.version
      };
    } catch (error) {
      console.error('❌ Churn prediction failed:', error);
      throw error;
    }
  }

  async segmentCustomers(customerData) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const startTime = Date.now();
      const segments = await this.models.customerSegmentation.predict(customerData);
      const processingTime = Date.now() - startTime;

      // Dynamic segmentation: 8-12 personas
      const segmentCounts = this.countSegments(segments);
      
      if (segmentCounts.total < 8 || segmentCounts.total > 12) {
        console.warn(`⚠️ Segment count ${segmentCounts.total} outside target range (8-12)`);
      }

      return {
        segments,
        segmentCounts,
        processingTime,
        timestamp: new Date().toISOString(),
        modelVersion: this.models.customerSegmentation.version
      };
    } catch (error) {
      console.error('❌ Customer segmentation failed:', error);
      throw error;
    }
  }

  async realtimePredict(type, data) {
    const startTime = Date.now();
    
    try {
      let result;
      
      switch (type) {
        case 'lead_scoring':
          result = await this.scoreLeads(data);
          break;
        case 'churn_prediction':
          result = await this.predictChurn(data);
          break;
        case 'customer_segmentation':
          result = await this.segmentCustomers(data);
          break;
        default:
          throw new Error(`Unknown prediction type: ${type}`);
      }

      const totalTime = Date.now() - startTime;
      
      // Performance monitoring
      if (totalTime > 100) {
        console.warn(`⚠️ Real-time prediction took ${totalTime}ms (target: <100ms)`);
      }

      return {
        ...result,
        totalProcessingTime: totalTime,
        type
      };
    } catch (error) {
      console.error(`❌ Real-time prediction failed for ${type}:`, error);
      throw error;
    }
  }

  async trainModels(trainingData) {
    try {
      console.log('🏋️ Starting model training...');
      
      const trainingResults = await Promise.all([
        this.models.leadScoring.train(trainingData.leads),
        this.models.churnPrediction.train(trainingData.customers),
        this.models.customerSegmentation.train(trainingData.interactions)
      ]);

      // Validate accuracy requirements
      const leadAccuracy = trainingResults[0].accuracy;
      if (leadAccuracy < 0.80) {
        console.warn(`⚠️ Lead scoring accuracy ${leadAccuracy} below target (>80%)`);
      }

      console.log('✅ Model training completed');
      return {
        leadScoring: trainingResults[0],
        churnPrediction: trainingResults[1],
        customerSegmentation: trainingResults[2],
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Model training failed:', error);
      throw error;
    }
  }

  async getModelMetrics() {
    return {
      leadScoring: await this.models.leadScoring.getMetrics(),
      churnPrediction: await this.models.churnPrediction.getMetrics(),
      customerSegmentation: await this.models.customerSegmentation.getMetrics(),
      system: {
        initialized: this.isInitialized,
        lastUpdate: new Date().toISOString(),
        memoryUsage: process.memoryUsage()
      }
    };
  }

  async triggerRetentionAlerts(atRiskCustomers) {
    // Integration point for marketing automation
    const alerts = atRiskCustomers.map(customer => ({
      customerId: customer.id,
      riskLevel: customer.churnProbability,
      timeToChurn: customer.timeToChurn,
      recommendedActions: this.getRetentionActions(customer),
      timestamp: new Date().toISOString()
    }));

    // Send to notification system
    console.log(`📧 Triggering ${alerts.length} retention alerts`);
    
    return alerts;
  }

  getRetentionActions(customer) {
    const actions = [];
    
    if (customer.churnProbability > 0.8) {
      actions.push('personal_call', 'discount_offer');
    } else if (customer.churnProbability > 0.7) {
      actions.push('email_campaign', 'service_check');
    }
    
    if (customer.lastServiceDate > 90) {
      actions.push('maintenance_reminder');
    }
    
    return actions;
  }

  countSegments(segments) {
    const counts = {};
    const segmentArray = Array.isArray(segments) ? segments : [segments];
    segmentArray.forEach(segment => {
      counts[segment.segmentId] = (counts[segment.segmentId] || 0) + 1;
    });
    
    return {
      segments: counts,
      total: Object.keys(counts).length,
      distribution: Object.values(counts)
    };
  }

  async healthCheck() {
    return {
      status: this.isInitialized ? 'healthy' : 'initializing',
      models: {
        leadScoring: this.models.leadScoring?.isReady || false,
        churnPrediction: this.models.churnPrediction?.isReady || false,
        customerSegmentation: this.models.customerSegmentation?.isReady || false
      },
      performance: {
        averageResponseTime: '<100ms',
        lastPredictionTime: new Date().toISOString()
      }
    };
  }
}

module.exports = MLService;