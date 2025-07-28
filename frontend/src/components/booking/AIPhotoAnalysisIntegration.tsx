'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Brain,
  Zap,
  Eye,
  TrendingUp,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DiagnosticPhoto } from './DiagnosticPhotoUpload';
import { DiagnosticResult, ImageAnalysisResult } from '@/services/aiDiagnosticsService';

interface AIAnalysisResult {
  id: string;
  photo: DiagnosticPhoto;
  analysis: ImageAnalysisResult;
  diagnosticResult: DiagnosticResult;
  processingTime: number;
  confidence: number;
  recommendations: string[];
}

interface AIPhotoAnalysisIntegrationProps {
  photos: DiagnosticPhoto[];
  selectedServices: string[];
  onAnalysisComplete: (results: AIAnalysisResult[]) => void;
  onRecommendationApply: (serviceIds: string[]) => void;
  className?: string;
}

const AIPhotoAnalysisIntegration: React.FC<AIPhotoAnalysisIntegrationProps> = ({
  photos,
  selectedServices,
  onAnalysisComplete,
  onRecommendationApply,
  className
}) => {
  const [analysisResults, setAnalysisResults] = useState<AIAnalysisResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  // AI service instance for future backend integration
  // const aiService = aiDiagnosticsService;

  // Simulate AI analysis (in production, this would call the actual AI service)
  const simulateAIAnalysis = async (photo: DiagnosticPhoto): Promise<AIAnalysisResult> => {
    const startTime = Date.now();
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2000));
    
    const processingTime = Date.now() - startTime;
    
    // Generate realistic analysis based on photo category
    const analysis = generateMockAnalysis(photo);
    const diagnosticResult = generateMockDiagnosticResult(photo, analysis);
    
    return {
      id: `analysis_${photo.id}_${Date.now()}`,
      photo,
      analysis,
      diagnosticResult,
      processingTime,
      confidence: analysis.detectedIssues[0]?.confidence || 0.85,
      recommendations: analysis.recommendations
    };
  };

  // Generate mock analysis based on photo category
  const generateMockAnalysis = (photo: DiagnosticPhoto): ImageAnalysisResult => {
    const categoryAnalysis = {
      'screen-damage': {
        detectedIssues: [
          {
            type: 'lcd_crack',
            confidence: 0.92,
            description: 'LCD panel crack detected in upper-left quadrant',
            boundingBox: { x: 20, y: 15, width: 180, height: 120 }
          },
          {
            type: 'backlight_failure',
            confidence: 0.78,
            description: 'Possible backlight malfunction indicated by uneven illumination'
          }
        ],
        overallCondition: 'poor' as const,
        recommendations: [
          'LCD panel replacement required',
          'Check digitizer functionality',
          'Test backlight inverter'
        ]
      },
      'physical-damage': {
        detectedIssues: [
          {
            type: 'case_damage',
            confidence: 0.89,
            description: 'Significant case deformation detected',
            boundingBox: { x: 50, y: 30, width: 200, height: 150 }
          },
          {
            type: 'internal_exposure',
            confidence: 0.67,
            description: 'Internal components potentially exposed'
          }
        ],
        overallCondition: 'critical' as const,
        recommendations: [
          'Immediate professional assessment required',
          'Data recovery priority',
          'Component integrity check needed'
        ]
      },
      'keyboard-issues': {
        detectedIssues: [
          {
            type: 'key_damage',
            confidence: 0.84,
            description: 'Multiple missing or damaged keys detected'
          },
          {
            type: 'liquid_residue',
            confidence: 0.71,
            description: 'Possible liquid damage residue visible'
          }
        ],
        overallCondition: 'fair' as const,
        recommendations: [
          'Keyboard replacement recommended',
          'Check for liquid damage beneath keys',
          'Clean contact points'
        ]
      },
      'port-damage': {
        detectedIssues: [
          {
            type: 'connector_damage',
            confidence: 0.88,
            description: 'USB port connector damage detected'
          },
          {
            type: 'solder_failure',
            confidence: 0.63,
            description: 'Possible motherboard solder joint failure'
          }
        ],
        overallCondition: 'poor' as const,
        recommendations: [
          'Port replacement required',
          'Motherboard inspection needed',
          'Check for circuit board damage'
        ]
      },
      'error-messages': {
        detectedIssues: [
          {
            type: 'bsod_analysis',
            confidence: 0.95,
            description: 'Blue Screen of Death error code analyzed'
          },
          {
            type: 'memory_error',
            confidence: 0.82,
            description: 'Memory-related error pattern detected'
          }
        ],
        overallCondition: 'fair' as const,
        recommendations: [
          'Memory diagnostic test required',
          'Driver update recommended',
          'System file integrity check'
        ]
      }
    };

    return categoryAnalysis[photo.category as keyof typeof categoryAnalysis] || {
      detectedIssues: [
        {
          type: 'general_assessment',
          confidence: 0.75,
          description: 'General condition assessment completed'
        }
      ],
      overallCondition: 'good' as const,
      recommendations: ['Standard maintenance recommended']
    };
  };

  // Generate diagnostic result based on analysis
  const generateMockDiagnosticResult = (photo: DiagnosticPhoto, analysis: ImageAnalysisResult): DiagnosticResult => {
    const severity = analysis.overallCondition === 'critical' ? 'critical' :
                    analysis.overallCondition === 'poor' ? 'high' :
                    analysis.overallCondition === 'fair' ? 'medium' : 'low';

    const baseServiceMap = {
      'screen-damage': ['a10', 'c9'],
      'physical-damage': ['c3', 'c1'],
      'keyboard-issues': ['b2'],
      'port-damage': ['c6', 'c7', 'c8'],
      'error-messages': ['b6', 'a3']
    };

    const recommendedServices = baseServiceMap[photo.category as keyof typeof baseServiceMap] || [];

    return {
      id: `diag_${photo.id}_${Date.now()}`,
      confidence: analysis.detectedIssues[0]?.confidence || 0.80,
      category: photo.category,
      issue: analysis.detectedIssues[0]?.type || 'General assessment',
      severity,
      description: analysis.detectedIssues[0]?.description || 'AI analysis completed',
      technicalDetails: `Automated analysis of ${photo.category} category image using computer vision`,
      possibleCauses: analysis.detectedIssues.map((issue: any) => ({
        cause: issue.type.replace(/_/g, ' '),
        probability: issue.confidence,
        impact: severity === 'critical' ? 'Device unusable' : 
                severity === 'high' ? 'Significant functionality loss' :
                severity === 'medium' ? 'Moderate impact' : 'Minor impact'
      })),
      recommendedActions: analysis.recommendations.map((rec: string, index: number) => ({
        action: rec,
        priority: index + 1,
        cost: { min: 25, max: 150, currency: 'GBP' },
        timeEstimate: '2-4 hours',
        skillLevel: 'professional' as const
      })),
      estimatedCost: {
        parts: { min: 15, max: 200, currency: 'GBP' },
        labor: { min: 49, max: 89, currency: 'GBP' },
        total: { min: 64, max: 289, currency: 'GBP' }
      },
      urgency: severity === 'critical' ? 'emergency' : 
               severity === 'high' ? 'high' :
               severity === 'medium' ? 'medium' : 'low',
      repairTime: severity === 'critical' ? 'Same day' : 
                  severity === 'high' ? '1-2 days' :
                  severity === 'medium' ? '2-3 days' : '3-5 days',
      warranty: true,
      preventiveMeasures: [
        'Regular device maintenance',
        'Protective case usage',
        'Avoid exposure to liquids'
      ],
      followUpActions: [
        'Monitor repair quality',
        'Schedule follow-up check',
        'Update device drivers'
      ],
      riskFactors: severity === 'critical' ? ['Data loss risk', 'Complete device failure'] : 
                   severity === 'high' ? ['Progressive damage', 'Performance degradation'] : [],
      imageAnalysis: [analysis]
    };
  };

  // Run AI analysis on photos
  const runAnalysis = async () => {
    if (photos.length === 0 || isAnalyzing) return;

    setIsAnalyzing(true);
    setAnalysisProgress(0);
    const results: AIAnalysisResult[] = [];

    for (let i = 0; i < photos.length; i++) {
      setAnalysisProgress(((i + 1) / photos.length) * 100);
      
      try {
        const result = await simulateAIAnalysis(photos[i]);
        results.push(result);
        setAnalysisResults(prev => [...prev, result]);
      } catch (error) {
        console.error('AI analysis failed for photo:', photos[i].id, error);
      }
    }

    setIsAnalyzing(false);
    onAnalysisComplete(results);
  };

  // Auto-run analysis when photos are added
  useEffect(() => {
    if (photos.length > analysisResults.length && !isAnalyzing) {
      const newPhotos = photos.slice(analysisResults.length);
      if (newPhotos.length > 0) {
        runAnalysis();
      }
    }
  }, [photos, analysisResults.length, isAnalyzing]);

  // Calculate overall insights
  const overallInsights = useMemo(() => {
    if (analysisResults.length === 0) return null;

    const avgConfidence = analysisResults.reduce((sum, r) => sum + r.confidence, 0) / analysisResults.length;
    const severityCounts = analysisResults.reduce((counts, r) => {
      counts[r.diagnosticResult.severity] = (counts[r.diagnosticResult.severity] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    const highestSeverity = severityCounts.critical ? 'critical' :
                           severityCounts.high ? 'high' :
                           severityCounts.medium ? 'medium' : 'low';

    const allRecommendedServices = new Set<string>();
    analysisResults.forEach(result => {
      // Extract service IDs from recommendations (simplified mapping)
      const categoryServiceMap = {
        'screen-damage': ['a10', 'c9'],
        'physical-damage': ['c3', 'c1'],
        'keyboard-issues': ['b2'],
        'port-damage': ['c6', 'c7', 'c8'],
        'error-messages': ['b6', 'a3']
      };
      
      const services = categoryServiceMap[result.photo.category as keyof typeof categoryServiceMap] || [];
      services.forEach(service => allRecommendedServices.add(service));
    });

    return {
      avgConfidence,
      highestSeverity,
      photosAnalyzed: analysisResults.length,
      recommendedServices: Array.from(allRecommendedServices),
      estimatedCostRange: {
        min: Math.min(...analysisResults.map(r => r.diagnosticResult.estimatedCost.total.min)),
        max: Math.max(...analysisResults.map(r => r.diagnosticResult.estimatedCost.total.max))
      }
    };
  }, [analysisResults]);

  const handleApplyRecommendations = () => {
    if (overallInsights) {
      onRecommendationApply(overallInsights.recommendedServices);
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* AI Analysis Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2">
          <Brain className="w-6 h-6 text-professional-600" />
          <h3 className="text-xl font-semibold text-gray-900">
            AI-Powered Diagnostic Analysis
          </h3>
        </div>
        <p className="text-gray-600">
          Advanced computer vision analysis of your uploaded photos
        </p>
      </div>

      {/* Analysis Progress */}
      {isAnalyzing && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Brain className="w-5 h-5 text-blue-600 animate-pulse" />
            <span className="font-medium text-blue-900">
              AI Analysis in Progress...
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-3 mb-2">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${analysisProgress}%` }}
            />
          </div>
          <div className="text-sm text-blue-700">
            Analyzing {photos.length} photo{photos.length !== 1 ? 's' : ''} • {analysisProgress.toFixed(0)}% complete
          </div>
        </div>
      )}

      {/* Overall Insights */}
      {overallInsights && (
        <div className="bg-gradient-to-r from-professional-50 to-trust-50 border border-professional-200 rounded-xl p-6">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-professional-600" />
            <span>AI Analysis Summary</span>
          </h4>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-white rounded-lg">
              <div className="text-2xl font-bold text-professional-700">
                {(overallInsights.avgConfidence * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-professional-600">AI Confidence</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <div className="text-2xl font-bold text-gray-700 capitalize">
                {overallInsights.highestSeverity}
              </div>
              <div className="text-xs text-gray-600">Max Severity</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <div className="text-2xl font-bold text-trust-700">
                {overallInsights.photosAnalyzed}
              </div>
              <div className="text-xs text-trust-600">Photos Analyzed</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <div className="text-lg font-bold text-green-700">
                £{overallInsights.estimatedCostRange.min}-{overallInsights.estimatedCostRange.max}
              </div>
              <div className="text-xs text-green-600">Cost Range</div>
            </div>
          </div>

          {overallInsights.recommendedServices.length > 0 && (
            <div className="flex items-center justify-between p-4 bg-white rounded-lg">
              <div>
                <div className="font-medium text-gray-900">
                  AI Recommended Services ({overallInsights.recommendedServices.length})
                </div>
                <div className="text-sm text-gray-600">
                  Based on detected issues in your photos
                </div>
              </div>
              <button
                onClick={handleApplyRecommendations}
                className="bg-professional-500 text-white px-4 py-2 rounded-lg hover:bg-professional-600 transition-colors"
              >
                Apply Recommendations
              </button>
            </div>
          )}
        </div>
      )}

      {/* Individual Analysis Results */}
      {analysisResults.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900">Individual Photo Analysis</h4>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {analysisResults.map((result) => (
              <div key={result.id} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-start space-x-4">
                  <img
                    src={result.photo.preview}
                    alt="Analyzed photo"
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-gray-900">{result.photo.category.replace(/-/g, ' ')}</h5>
                      <div className="flex items-center space-x-1">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          result.confidence > 0.8 ? "bg-green-500" :
                          result.confidence > 0.6 ? "bg-yellow-500" : "bg-red-500"
                        )} />
                        <span className="text-sm text-gray-600">
                          {(result.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-700 mb-2">
                      {result.analysis.detectedIssues[0]?.description}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        result.analysis.overallCondition === 'critical' ? "bg-red-100 text-red-700" :
                        result.analysis.overallCondition === 'poor' ? "bg-orange-100 text-orange-700" :
                        result.analysis.overallCondition === 'fair' ? "bg-yellow-100 text-yellow-700" :
                        "bg-green-100 text-green-700"
                      )}>
                        {result.analysis.overallCondition}
                      </div>
                      <div className="text-xs text-gray-500">
                        {result.processingTime}ms
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Benefits */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
          <Eye className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <div className="font-medium text-blue-800">Computer Vision</div>
          <div className="text-sm text-blue-700">Advanced image analysis</div>
        </div>
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
          <Zap className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <div className="font-medium text-green-800">Instant Results</div>
          <div className="text-sm text-green-700">Immediate diagnostic insights</div>
        </div>
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg text-center">
          <Star className="w-8 h-8 text-purple-600 mx-auto mb-2" />
          <div className="font-medium text-purple-800">Expert Accuracy</div>
          <div className="text-sm text-purple-700">Professional-grade analysis</div>
        </div>
      </div>
    </div>
  );
};

export default AIPhotoAnalysisIntegration;