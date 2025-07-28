'use client';

/**
 * AI Diagnostics Test Page
 * 
 * Comprehensive testing environment for the AI diagnostic system:
 * - Multi-modal analysis (text + images)
 * - Real device scenarios
 * - Confidence scoring
 * - Cost estimation
 * - Repair recommendations
 * - Visual feedback and analytics
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { EnhancedFileUpload, UploadedFile } from '@/components/ui/EnhancedFileUpload';
import { DiagnosticResult, DeviceInfo } from '@/services/aiDiagnosticsService';

interface TestScenario {
  id: string;
  name: string;
  deviceInfo: DeviceInfo;
  symptoms: string;
  expectedResults: string[];
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  description: string;
}

const TEST_SCENARIOS: TestScenario[] = [
  {
    id: 'macbook_screen_flicker',
    name: 'MacBook Screen Flickering',
    deviceInfo: {
      brand: 'Apple',
      model: 'MacBook Pro 16-inch 2023',
      year: 2023,
      category: 'laptop',
      specifications: {
        processor: 'M2 Pro',
        memory: '16GB',
        storage: '512GB SSD',
        graphics: 'Integrated M2 Pro'
      },
      warrantyStatus: 'active'
    },
    symptoms: 'The screen has been flickering intermittently, especially when opening and closing the laptop. Sometimes it goes completely black for a few seconds before coming back. The issue seems to get worse when the laptop is warm. I also notice some horizontal lines appearing occasionally.',
    expectedResults: ['Display', 'Thermal'],
    difficulty: 'medium',
    description: 'Common display cable or LCD panel issue with thermal component'
  },
  {
    id: 'gaming_pc_overheating',
    name: 'Gaming PC Overheating & Crashes',
    deviceInfo: {
      brand: 'Custom Build',
      model: 'Gaming Desktop',
      year: 2022,
      category: 'desktop',
      specifications: {
        processor: 'AMD Ryzen 7 5800X',
        memory: '32GB DDR4',
        storage: '1TB NVMe SSD',
        graphics: 'NVIDIA RTX 3080'
      },
      warrantyStatus: 'expired'
    },
    symptoms: 'PC gets extremely hot during gaming sessions and crashes after about 30 minutes. The fans are running at maximum speed and making a lot of noise. Sometimes I smell something burning. The case is very hot to touch and the performance drops significantly before it crashes.',
    expectedResults: ['Thermal', 'Performance'],
    difficulty: 'hard',
    description: 'Critical thermal management failure requiring immediate attention'
  },
  {
    id: 'iphone_battery_drain',
    name: 'iPhone Battery Rapid Drain',
    deviceInfo: {
      brand: 'Apple',
      model: 'iPhone 14 Pro',
      year: 2022,
      category: 'phone',
      specifications: {
        processor: 'A16 Bionic',
        memory: '6GB',
        storage: '256GB',
      },
      warrantyStatus: 'active'
    },
    symptoms: 'Battery drains from 100% to 20% in about 3 hours with normal usage. Phone gets warm during charging and the charging is very slow. Sometimes it shuts down randomly even when showing 30% battery.',
    expectedResults: ['Power', 'Thermal'],
    difficulty: 'easy',
    description: 'Battery degradation with potential charging circuit issues'
  },
  {
    id: 'laptop_mysterious_issue',
    name: 'Mysterious Laptop Problems',
    deviceInfo: {
      brand: 'Dell',
      model: 'XPS 13 9320',
      year: 2021,
      category: 'laptop',
      specifications: {
        processor: 'Intel i7-1185G7',
        memory: '16GB',
        storage: '512GB SSD',
        graphics: 'Intel Iris Xe'
      },
      warrantyStatus: 'expired'
    },
    symptoms: 'Random issues happening - sometimes keyboard doesn\'t work, WiFi disconnects frequently, USB ports stop working, and occasionally the screen goes black. No consistent pattern. Started after I spilled coffee near it last week.',
    expectedResults: ['Connectivity', 'Input', 'Power'],
    difficulty: 'expert',
    description: 'Complex liquid damage with multiple system failures'
  }
];

export default function AIDocumentedDiagnosticsTestPage() {
  const [selectedScenario, setSelectedScenario] = useState<TestScenario>(TEST_SCENARIOS[0]);
  const [customSymptoms, setCustomSymptoms] = useState('');
  const [customDevice, setCustomDevice] = useState<Partial<DeviceInfo>>({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    category: 'laptop'
  });
  const [uploadedImages, setUploadedImages] = useState<UploadedFile[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [analysisMetadata, setAnalysisMetadata] = useState<any>(null);
  const [testMode, setTestMode] = useState<'scenario' | 'custom'>('scenario');
  const [sessionStats, setSessionStats] = useState({
    totalAnalyses: 0,
    avgConfidence: 0,
    avgAnalysisTime: 0,
    successfulAnalyses: 0
  });

  const getCurrentInput = () => {
    if (testMode === 'scenario') {
      return {
        deviceInfo: selectedScenario.deviceInfo,
        symptoms: selectedScenario.symptoms,
        images: uploadedImages
      };
    } else {
      return {
        deviceInfo: customDevice as DeviceInfo,
        symptoms: customSymptoms,
        images: uploadedImages
      };
    }
  };

  const runDiagnosis = async () => {
    setAnalyzing(true);
    setResults([]);
    setAnalysisMetadata(null);

    const startTime = Date.now();
    const input = getCurrentInput();

    try {
      const response = await fetch('/api/ai/diagnose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      const data = await response.json();

      if (data.success) {
        setResults(data.results);
        setAnalysisMetadata(data.metadata);

        // Update session stats
        const analysisTime = Date.now() - startTime;
        const avgConfidence = data.results.reduce((acc: number, r: DiagnosticResult) => acc + r.confidence, 0) / data.results.length;

        setSessionStats(prev => ({
          totalAnalyses: prev.totalAnalyses + 1,
          avgConfidence: (prev.avgConfidence * prev.totalAnalyses + avgConfidence) / (prev.totalAnalyses + 1),
          avgAnalysisTime: (prev.avgAnalysisTime * prev.totalAnalyses + analysisTime) / (prev.totalAnalyses + 1),
          successfulAnalyses: prev.successfulAnalyses + 1
        }));

        console.log('AI Diagnosis completed:', {
          resultsCount: data.results.length,
          avgConfidence,
          analysisTime: `${analysisTime}ms`
        });
      } else {
        throw new Error(data.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Diagnosis failed:', error);
      alert(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setResults([]);
    setAnalysisMetadata(null);
    setUploadedImages([]);
    if (testMode === 'custom') {
      setCustomSymptoms('');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-orange-100 text-orange-800';
      case 'expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AI Diagnostics Test Laboratory
          </h1>
          <p className="text-gray-600 mb-4">
            Advanced AI-powered device diagnostic system with multi-modal analysis
          </p>
          
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="info">🤖 AI Analysis</Badge>
            <Badge variant="success">📷 Image Recognition</Badge>
            <Badge variant="warning">🔬 Multi-Modal</Badge>
            <Badge variant="secondary">📊 Confidence Scoring</Badge>
          </div>
        </div>

        {/* Session Statistics */}
        <Card className="p-4 mb-6 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-3">📊 Session Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{sessionStats.totalAnalyses}</div>
              <div className="text-sm text-blue-700">Total Analyses</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {sessionStats.avgConfidence > 0 ? `${Math.round(sessionStats.avgConfidence * 100)}%` : '0%'}
              </div>
              <div className="text-sm text-blue-700">Avg Confidence</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {sessionStats.avgAnalysisTime > 0 ? `${Math.round(sessionStats.avgAnalysisTime)}ms` : '0ms'}
              </div>
              <div className="text-sm text-blue-700">Avg Analysis Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {sessionStats.totalAnalyses > 0 ? Math.round((sessionStats.successfulAnalyses / sessionStats.totalAnalyses) * 100) : 0}%
              </div>
              <div className="text-sm text-blue-700">Success Rate</div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Test Mode Selection */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">🧪 Test Mode</h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setTestMode('scenario')}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    testMode === 'scenario'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-lg">Pre-built Scenarios</div>
                  <div className="text-sm text-gray-600">Test with realistic device problems</div>
                </button>
                <button
                  onClick={() => setTestMode('custom')}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    testMode === 'custom'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-lg">Custom Input</div>
                  <div className="text-sm text-gray-600">Enter your own device and symptoms</div>
                </button>
              </div>
            </Card>

            {/* Scenario Selection */}
            {testMode === 'scenario' && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">📋 Test Scenarios</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {TEST_SCENARIOS.map((scenario) => (
                    <button
                      key={scenario.id}
                      onClick={() => setSelectedScenario(scenario)}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        selectedScenario.id === scenario.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">{scenario.name}</div>
                        <Badge className={getDifficultyColor(scenario.difficulty)}>
                          {scenario.difficulty}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">{scenario.description}</div>
                      <div className="text-xs text-gray-500">
                        {scenario.deviceInfo.brand} {scenario.deviceInfo.model} ({scenario.deviceInfo.year})
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
            )}

            {/* Custom Device Input */}
            {testMode === 'custom' && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">🖥️ Device Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Brand</label>
                    <Input
                      value={customDevice.brand || ''}
                      onChange={(e) => setCustomDevice(prev => ({ ...prev, brand: e.target.value }))}
                      placeholder="Apple, Dell, HP, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Model</label>
                    <Input
                      value={customDevice.model || ''}
                      onChange={(e) => setCustomDevice(prev => ({ ...prev, model: e.target.value }))}
                      placeholder="MacBook Pro 16-inch 2023"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Year</label>
                    <Input
                      type="number"
                      value={customDevice.year || ''}
                      onChange={(e) => setCustomDevice(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                      placeholder="2023"
                      min="2010"
                      max={new Date().getFullYear()}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Category</label>
                    <select
                      value={customDevice.category || 'laptop'}
                      onChange={(e) => setCustomDevice(prev => ({ ...prev, category: e.target.value as any }))}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    >
                      <option value="laptop">Laptop</option>
                      <option value="desktop">Desktop</option>
                      <option value="tablet">Tablet</option>
                      <option value="phone">Phone</option>
                      <option value="console">Console</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </Card>
            )}

            {/* Symptoms Input */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                🔍 {testMode === 'scenario' ? 'Scenario Symptoms' : 'Describe Symptoms'}
              </h2>
              {testMode === 'scenario' ? (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 mb-2">Current Scenario:</div>
                  <div className="text-sm text-gray-600">{selectedScenario.symptoms}</div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Describe the device problems in detail
                  </label>
                  <Textarea
                    value={customSymptoms}
                    onChange={(e) => setCustomSymptoms(e.target.value)}
                    placeholder="Describe what's happening with your device. Be specific about symptoms, when they occur, error messages, etc."
                    rows={6}
                    className="w-full"
                  />
                </div>
              )}
            </Card>

            {/* Image Upload */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">📷 Visual Analysis</h2>
              <EnhancedFileUpload
                files={uploadedImages}
                onFilesChange={setUploadedImages}
                maxFiles={5}
                maxSizePerFile={10}
                acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
                category="damage"
                showCamera={true}
                showBatchOperations={false}
                allowReordering={false}
                className="mb-0"
              />
            </Card>

            {/* Analysis Controls */}
            <Card className="p-6">
              <div className="flex flex-wrap gap-4">
                <Button
                  onClick={runDiagnosis}
                  disabled={analyzing || (testMode === 'custom' && (!customSymptoms.trim() || !customDevice.brand || !customDevice.model))}
                  className="flex-1"
                  size="lg"
                >
                  {analyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      🤖 Start AI Diagnosis
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  onClick={resetAnalysis}
                  disabled={analyzing}
                >
                  🔄 Reset
                </Button>
              </div>
            </Card>
          </div>

          {/* Results Sidebar */}
          <div className="space-y-6">
            {/* Analysis Status */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">
                {analyzing ? '⏳ Analysis Status' : results.length > 0 ? '✅ Analysis Complete' : '🤖 Ready for Analysis'}
              </h3>
              
              {analyzing && (
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Processing symptoms
                  </div>
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Analyzing device specs
                  </div>
                  <div className="flex items-center text-sm animate-pulse">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                    Running AI models
                  </div>
                </div>
              )}

              {analysisMetadata && (
                <div className="space-y-2 text-sm">
                  <div><strong>Session:</strong> {analysisMetadata.sessionId.slice(-8)}</div>
                  <div><strong>Categories:</strong> {analysisMetadata.textAnalysis.categories.join(', ')}</div>
                  <div><strong>Severity:</strong> <Badge className={getSeverityColor(analysisMetadata.textAnalysis.severity)}>
                    {analysisMetadata.textAnalysis.severity}
                  </Badge></div>
                  <div><strong>Images:</strong> {uploadedImages.length} uploaded</div>
                </div>
              )}
            </Card>

            {/* Quick Analysis Stats */}
            {results.length > 0 && (
              <Card className="p-4 bg-green-50 border-green-200">
                <h3 className="font-semibold text-green-800 mb-3">📈 Analysis Results</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Issues Found:</span>
                    <span className="font-mono">{results.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Confidence:</span>
                    <span className="font-mono">
                      {Math.round(results.reduce((acc, r) => acc + r.confidence, 0) / results.length * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Est. Cost Range:</span>
                    <span className="font-mono">
                      £{Math.min(...results.map(r => r.estimatedCost.total.min))}-
                      £{Math.max(...results.map(r => r.estimatedCost.total.max))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Highest Priority:</span>
                    <Badge className={getSeverityColor(results[0]?.severity || 'low')}>
                      {results[0]?.severity || 'N/A'}
                    </Badge>
                  </div>
                </div>
              </Card>
            )}

            {/* AI Features */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">🔬 AI Capabilities</h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  Natural Language Processing
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Computer Vision Analysis
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                  Device Knowledge Base
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                  Confidence Scoring
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                  Cost Estimation
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                  Urgency Assessment
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Detailed Results */}
        {results.length > 0 && (
          <Card className="p-6 mt-6">
            <h2 className="text-2xl font-semibold mb-6">🔬 Detailed Diagnostic Results</h2>
            
            <div className="space-y-6">
              {results.map((result, index) => (
                <div key={result.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold">{result.issue}</h3>
                      <p className="text-gray-600">{result.category}</p>
                    </div>
                    <div className="text-right">
                      <Badge className={getSeverityColor(result.severity)}>
                        {result.severity.toUpperCase()}
                      </Badge>
                      <div className="text-sm text-gray-500 mt-1">
                        {Math.round(result.confidence * 100)}% confidence
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-4">{result.description}</p>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2">🔍 Possible Causes</h4>
                      <ul className="space-y-1">
                        {result.possibleCauses.map((cause, i) => (
                          <li key={i} className="text-sm">
                            <div className="flex items-start">
                              <span className="text-blue-500 mr-2">•</span>
                              <div>
                                <span className="font-medium">{cause.cause}</span>
                                <span className="text-gray-500 ml-2">
                                  ({Math.round(cause.probability * 100)}%)
                                </span>
                                <div className="text-xs text-gray-600">{cause.impact}</div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">🔧 Recommended Actions</h4>
                      <ul className="space-y-1">
                        {result.recommendedActions.map((action, i) => (
                          <li key={i} className="text-sm">
                            <div className="flex items-start">
                              <span className="text-green-500 mr-2">•</span>
                              <div>
                                <span className="font-medium">{action.action}</span>
                                <div className="text-xs text-gray-600">
                                  {action.timeEstimate} • {action.skillLevel} level
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="font-medium text-gray-700">Parts Cost</div>
                        <div className="text-lg font-semibold">
                          £{result.estimatedCost.parts.min}-{result.estimatedCost.parts.max}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-700">Labor Cost</div>
                        <div className="text-lg font-semibold">
                          £{result.estimatedCost.labor.min}-{result.estimatedCost.labor.max}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-700">Total Cost</div>
                        <div className="text-lg font-semibold text-blue-600">
                          £{result.estimatedCost.total.min}-{result.estimatedCost.total.max}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-700">Repair Time</div>
                        <div className="text-lg font-semibold">{result.repairTime}</div>
                      </div>
                    </div>
                  </div>

                  {result.warranty && (
                    <div className="mt-3 flex items-center text-green-600">
                      <span className="mr-2">🛡️</span>
                      <span className="text-sm font-medium">Warranty Coverage Available</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}