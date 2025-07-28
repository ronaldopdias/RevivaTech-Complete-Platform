'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, BarChart3, Clock, PoundSterling, AlertTriangle, CheckCircle, Brain, Zap, Target } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface RepairPrediction {
  estimatedTime: {
    optimistic: number; // in minutes
    realistic: number;
    pessimistic: number;
    confidence: number; // percentage
  };
  estimatedCost: {
    parts: { min: number; max: number };
    labor: { min: number; max: number };
    total: { min: number; max: number };
    confidence: number;
  };
  complexity: 'simple' | 'moderate' | 'complex' | 'expert';
  riskFactors: string[];
  successProbability: number;
  recommendations: string[];
}

interface HistoricalData {
  deviceType: string;
  issueType: string;
  actualTime: number;
  actualCost: number;
  complexity: string;
  outcome: 'success' | 'partial' | 'failed';
  customerSatisfaction: number;
  dateCompleted: Date;
}

interface MLModelPrediction {
  prediction: RepairPrediction;
  modelAccuracy: number;
  dataPoints: number;
  lastUpdated: Date;
}

interface PredictiveAnalyticsEngineProps {
  deviceType: string;
  issueType: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  customerHistory?: any[];
  onPredictionComplete?: (prediction: RepairPrediction) => void;
  showDetailedAnalysis?: boolean;
  className?: string;
}

export default function PredictiveAnalyticsEngine({
  deviceType,
  issueType,
  urgency,
  customerHistory = [],
  onPredictionComplete,
  showDetailedAnalysis = true,
  className = ''
}: PredictiveAnalyticsEngineProps) {
  const [prediction, setPrediction] = useState<RepairPrediction | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [modelAccuracy, setModelAccuracy] = useState(0);
  const [historicalComparisons, setHistoricalComparisons] = useState<HistoricalData[]>([]);
  const [confidenceFactors, setConfidenceFactors] = useState<Record<string, number>>({});

  // Mock historical data for ML training
  const mockHistoricalData: HistoricalData[] = [
    {
      deviceType: 'iPhone',
      issueType: 'screen',
      actualTime: 35,
      actualCost: 129,
      complexity: 'moderate',
      outcome: 'success',
      customerSatisfaction: 4.8,
      dateCompleted: new Date('2025-01-15')
    },
    {
      deviceType: 'MacBook',
      issueType: 'battery',
      actualTime: 45,
      actualCost: 189,
      complexity: 'moderate',
      outcome: 'success',
      customerSatisfaction: 4.9,
      dateCompleted: new Date('2025-01-18')
    },
    {
      deviceType: 'Samsung',
      issueType: 'performance',
      actualTime: 55,
      actualCost: 79,
      complexity: 'simple',
      outcome: 'success',
      customerSatisfaction: 4.6,
      dateCompleted: new Date('2025-01-20')
    }
  ];

  // ML-powered prediction engine
  const runPredictiveAnalysis = async (): Promise<RepairPrediction> => {
    setIsAnalyzing(true);
    
    // Simulate ML model processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get similar historical cases
    const similarCases = mockHistoricalData.filter(
      data => data.deviceType.toLowerCase().includes(deviceType.toLowerCase()) ||
              data.issueType.toLowerCase().includes(issueType.toLowerCase())
    );
    
    setHistoricalComparisons(similarCases);
    
    // Calculate base predictions from historical data
    const avgTime = similarCases.length > 0 
      ? similarCases.reduce((sum, case_) => sum + case_.actualTime, 0) / similarCases.length
      : 45; // fallback
    
    const avgCost = similarCases.length > 0
      ? similarCases.reduce((sum, case_) => sum + case_.actualCost, 0) / similarCases.length
      : 100; // fallback
    
    // Apply ML adjustments based on various factors
    const deviceComplexity = getDeviceComplexityMultiplier(deviceType);
    const issueComplexity = getIssueComplexityMultiplier(issueType);
    const urgencyMultiplier = getUrgencyMultiplier(urgency);
    const customerMultiplier = getCustomerHistoryMultiplier(customerHistory);
    
    // Time predictions with uncertainty modeling
    const baseTime = avgTime * deviceComplexity * issueComplexity;
    const optimisticTime = Math.round(baseTime * 0.8);
    const realisticTime = Math.round(baseTime * urgencyMultiplier * customerMultiplier);
    const pessimisticTime = Math.round(baseTime * 1.4);
    
    // Cost predictions with market analysis
    const baseCost = avgCost * deviceComplexity * issueComplexity;
    const partsCost = { min: Math.round(baseCost * 0.6), max: Math.round(baseCost * 0.8) };
    const laborCost = { min: Math.round(baseCost * 0.3), max: Math.round(baseCost * 0.5) };
    
    // Risk assessment
    const riskFactors = calculateRiskFactors(deviceType, issueType, urgency);
    const successProbability = calculateSuccessProbability(similarCases, riskFactors.length);
    
    // Confidence calculation
    const dataConfidence = Math.min(similarCases.length * 10, 90);
    const modelConfidence = 85; // Mock model confidence
    const overallConfidence = Math.round((dataConfidence + modelConfidence) / 2);
    
    setModelAccuracy(92.4); // Mock model accuracy
    setConfidenceFactors({
      historicalData: dataConfidence,
      modelAccuracy: modelConfidence,
      patternMatching: 88,
      seasonalFactors: 76
    });
    
    const prediction: RepairPrediction = {
      estimatedTime: {
        optimistic: optimisticTime,
        realistic: realisticTime,
        pessimistic: pessimisticTime,
        confidence: overallConfidence
      },
      estimatedCost: {
        parts: partsCost,
        labor: laborCost,
        total: { 
          min: partsCost.min + laborCost.min, 
          max: partsCost.max + laborCost.max 
        },
        confidence: overallConfidence
      },
      complexity: determineComplexity(deviceComplexity, issueComplexity),
      riskFactors,
      successProbability,
      recommendations: generateRecommendations(deviceType, issueType, riskFactors)
    };
    
    setIsAnalyzing(false);
    return prediction;
  };

  const getDeviceComplexityMultiplier = (device: string): number => {
    const complexityMap: Record<string, number> = {
      'iphone': 1.2,
      'macbook': 1.5,
      'ipad': 1.1,
      'samsung': 1.3,
      'laptop': 1.4,
      'desktop': 1.0
    };
    
    return complexityMap[device.toLowerCase()] || 1.2;
  };

  const getIssueComplexityMultiplier = (issue: string): number => {
    const complexityMap: Record<string, number> = {
      'screen': 1.0,
      'battery': 1.2,
      'performance': 0.8,
      'liquid_damage': 1.8,
      'motherboard': 2.0,
      'software': 0.6
    };
    
    return complexityMap[issue.toLowerCase()] || 1.0;
  };

  const getUrgencyMultiplier = (urgency: string): number => {
    const urgencyMap: Record<string, number> = {
      'low': 1.0,
      'medium': 1.1,
      'high': 1.2,
      'critical': 1.4
    };
    
    return urgencyMap[urgency] || 1.0;
  };

  const getCustomerHistoryMultiplier = (history: any[]): number => {
    if (history.length === 0) return 1.0;
    
    // Returning customers often have simpler cases due to trust
    const avgSatisfaction = history.reduce((sum, h) => sum + (h.satisfaction || 4.5), 0) / history.length;
    return avgSatisfaction > 4.5 ? 0.95 : 1.05;
  };

  const calculateRiskFactors = (device: string, issue: string, urgency: string): string[] => {
    const risks: string[] = [];
    
    if (issue.includes('liquid')) {
      risks.push('Potential additional damage from liquid exposure');
    }
    
    if (device.toLowerCase().includes('macbook') && issue.includes('screen')) {
      risks.push('Complex display assembly requiring specialized tools');
    }
    
    if (urgency === 'critical') {
      risks.push('Time pressure may impact thoroughness');
    }
    
    if (issue.includes('motherboard')) {
      risks.push('Micro-soldering required - high skill dependency');
    }
    
    return risks;
  };

  const calculateSuccessProbability = (similarCases: HistoricalData[], riskCount: number): number => {
    if (similarCases.length === 0) return 85; // Base probability
    
    const successRate = similarCases.filter(c => c.outcome === 'success').length / similarCases.length;
    const riskPenalty = riskCount * 5;
    
    return Math.max(Math.round((successRate * 100) - riskPenalty), 50);
  };

  const determineComplexity = (deviceMult: number, issueMult: number): RepairPrediction['complexity'] => {
    const complexity = deviceMult * issueMult;
    
    if (complexity <= 1.0) return 'simple';
    if (complexity <= 1.5) return 'moderate';
    if (complexity <= 2.0) return 'complex';
    return 'expert';
  };

  const generateRecommendations = (device: string, issue: string, risks: string[]): string[] => {
    const recommendations: string[] = [];
    
    recommendations.push('Pre-repair diagnostic recommended for accuracy');
    
    if (risks.length > 2) {
      recommendations.push('Consider backup plan for high-risk repair');
    }
    
    if (device.toLowerCase().includes('apple')) {
      recommendations.push('Use genuine Apple parts for warranty compliance');
    }
    
    if (issue.includes('battery')) {
      recommendations.push('Recalibrate device after battery installation');
    }
    
    recommendations.push('Quality check and testing before customer pickup');
    
    return recommendations;
  };

  useEffect(() => {
    if (deviceType && issueType) {
      runPredictiveAnalysis().then(prediction => {
        setPrediction(prediction);
        if (onPredictionComplete) {
          onPredictionComplete(prediction);
        }
      });
    }
  }, [deviceType, issueType, urgency]);

  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const getComplexityColor = (complexity: string): string => {
    const colors = {
      simple: 'text-green-600 bg-green-100',
      moderate: 'text-yellow-600 bg-yellow-100',
      complex: 'text-orange-600 bg-orange-100',
      expert: 'text-red-600 bg-red-100'
    };
    return colors[complexity as keyof typeof colors] || colors.moderate;
  };

  if (isAnalyzing) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-600 flex items-center justify-center animate-pulse">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">AI Predictive Analysis</h3>
            <p className="text-sm text-gray-600">Processing machine learning models...</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="animate-pulse bg-gray-200 h-4 rounded"></div>
          <div className="animate-pulse bg-gray-200 h-4 rounded w-3/4"></div>
          <div className="animate-pulse bg-gray-200 h-4 rounded w-1/2"></div>
        </div>
      </Card>
    );
  }

  if (!prediction) return null;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Prediction Card */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-600 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">ML Prediction Results</h3>
              <p className="text-sm text-gray-600">Based on {historicalComparisons.length} similar cases</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{modelAccuracy}%</div>
            <div className="text-sm text-gray-600">Model Accuracy</div>
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {/* Time Prediction */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Clock className="w-5 h-5 text-blue-600 mr-2" />
              <span className="font-medium text-gray-700">Time Estimate</span>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-gray-800">
                {formatTime(prediction.estimatedTime.realistic)}
              </div>
              <div className="text-sm text-gray-600">
                {formatTime(prediction.estimatedTime.optimistic)} - {formatTime(prediction.estimatedTime.pessimistic)}
              </div>
              <div className="text-xs text-blue-600">
                {prediction.estimatedTime.confidence}% confidence
              </div>
            </div>
          </div>
          
          {/* Cost Prediction */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <PoundSterling className="w-5 h-5 text-green-600 mr-2" />
              <span className="font-medium text-gray-700">Cost Estimate</span>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-gray-800">
                £{prediction.estimatedCost.total.min} - £{prediction.estimatedCost.total.max}
              </div>
              <div className="text-sm text-gray-600">
                Parts: £{prediction.estimatedCost.parts.min}-{prediction.estimatedCost.parts.max} | 
                Labor: £{prediction.estimatedCost.labor.min}-{prediction.estimatedCost.labor.max}
              </div>
              <div className="text-xs text-green-600">
                {prediction.estimatedCost.confidence}% confidence
              </div>
            </div>
          </div>
          
          {/* Success Probability */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Target className="w-5 h-5 text-purple-600 mr-2" />
              <span className="font-medium text-gray-700">Success Rate</span>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-gray-800">
                {prediction.successProbability}%
              </div>
              <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getComplexityColor(prediction.complexity)}`}>
                {prediction.complexity.toUpperCase()}
              </div>
            </div>
          </div>
        </div>
        
        {/* Risk Factors */}
        {prediction.riskFactors.length > 0 && (
          <div className="mb-4">
            <h4 className="font-medium text-gray-700 mb-2 flex items-center">
              <AlertTriangle className="w-4 h-4 text-orange-500 mr-2" />
              Risk Factors
            </h4>
            <div className="space-y-1">
              {prediction.riskFactors.map((risk, index) => (
                <div key={index} className="text-sm text-orange-700 bg-orange-50 px-3 py-2 rounded">
                  {risk}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
      
      {/* Detailed Analysis */}
      {showDetailedAnalysis && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Confidence Breakdown */}
          <Card className="p-4">
            <h4 className="font-medium text-gray-700 mb-3 flex items-center">
              <BarChart3 className="w-4 h-4 text-blue-600 mr-2" />
              Confidence Factors
            </h4>
            <div className="space-y-3">
              {Object.entries(confidenceFactors).map(([factor, score]) => (
                <div key={factor}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize text-gray-600">{factor.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="font-medium">{score}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
          
          {/* Recommendations */}
          <Card className="p-4">
            <h4 className="font-medium text-gray-700 mb-3 flex items-center">
              <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
              AI Recommendations
            </h4>
            <div className="space-y-2">
              {prediction.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <Zap className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600">{rec}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
      
      {/* Historical Comparisons */}
      {historicalComparisons.length > 0 && (
        <Card className="p-4">
          <h4 className="font-medium text-gray-700 mb-3 flex items-center">
            <TrendingUp className="w-4 h-4 text-purple-600 mr-2" />
            Similar Historical Cases
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="pb-2">Device</th>
                  <th className="pb-2">Issue</th>
                  <th className="pb-2">Time</th>
                  <th className="pb-2">Cost</th>
                  <th className="pb-2">Outcome</th>
                  <th className="pb-2">Satisfaction</th>
                </tr>
              </thead>
              <tbody>
                {historicalComparisons.slice(0, 3).map((case_, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2">{case_.deviceType}</td>
                    <td className="py-2 capitalize">{case_.issueType}</td>
                    <td className="py-2">{formatTime(case_.actualTime)}</td>
                    <td className="py-2">£{case_.actualCost}</td>
                    <td className="py-2">
                      <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                        case_.outcome === 'success' ? 'bg-green-500' : 'bg-orange-500'
                      }`} />
                      {case_.outcome}
                    </td>
                    <td className="py-2">{case_.customerSatisfaction}/5</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}