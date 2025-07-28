'use client';

import React, { useState, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Icon } from '@/components/ui/Icon';

interface DiagnosticResult {
  confidence: number;
  category: string;
  issue: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  possibleCauses: string[];
  recommendedActions: string[];
  estimatedCost: {
    min: number;
    max: number;
    currency: string;
  };
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  repairTime: string;
  warranty: boolean;
}

interface AIDeviceDiagnosticsProps {
  deviceId?: string;
  deviceModel?: string;
  onDiagnosisComplete: (results: DiagnosticResult[]) => void;
  className?: string;
}

export function AIDeviceDiagnostics({
  deviceId,
  deviceModel,
  onDiagnosisComplete,
  className = ''
}: AIDeviceDiagnosticsProps) {
  const [symptoms, setSymptoms] = useState('');
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [currentStep, setCurrentStep] = useState<'input' | 'analyzing' | 'results'>('input');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Predefined symptom categories for quick selection
  const symptomCategories = [
    {
      name: 'Display Issues',
      symptoms: ['Screen flickering', 'No display', 'Cracked screen', 'Dead pixels', 'Bright/dark spots']
    },
    {
      name: 'Performance Issues',
      symptoms: ['Slow performance', 'Freezing', 'Random crashes', 'Overheating', 'Fan noise']
    },
    {
      name: 'Power Issues',
      symptoms: ['Won\'t turn on', 'Battery drains fast', 'Charging problems', 'Random shutdowns']
    },
    {
      name: 'Audio Issues',
      symptoms: ['No sound', 'Distorted audio', 'Microphone problems', 'Speaker crackling']
    },
    {
      name: 'Connectivity Issues',
      symptoms: ['WiFi problems', 'Bluetooth issues', 'USB ports not working', 'Ethernet problems']
    },
    {
      name: 'Input Issues',
      symptoms: ['Keyboard not working', 'Trackpad issues', 'Touch screen problems', 'Buttons stuck']
    }
  ];

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedImages(prev => [...prev, ...files]);
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const addSymptom = (symptom: string) => {
    if (!symptoms.includes(symptom)) {
      setSymptoms(prev => prev ? `${prev}, ${symptom}` : symptom);
    }
  };

  const analyzeDevice = async () => {
    if (!symptoms.trim()) {
      alert('Please describe the symptoms first');
      return;
    }

    setAnalyzing(true);
    setCurrentStep('analyzing');

    try {
      // Simulate AI analysis (in real implementation, this would call an AI service)
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Generate mock diagnostic results based on symptoms
      const mockResults = generateMockDiagnostics(symptoms, deviceModel);
      
      setResults(mockResults);
      setCurrentStep('results');
      onDiagnosisComplete(mockResults);

    } catch (error) {
      console.error('Diagnostic analysis failed:', error);
      alert('Analysis failed. Please try again.');
      setCurrentStep('input');
    } finally {
      setAnalyzing(false);
    }
  };

  const restartDiagnosis = () => {
    setSymptoms('');
    setUploadedImages([]);
    setResults([]);
    setCurrentStep('input');
  };

  if (currentStep === 'analyzing') {
    return (
      <Card className={`p-8 ${className}`}>
        <div className="text-center">
          <div className="relative mb-6">
            <div className="w-16 h-16 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <Icon name="cpu" className="w-8 h-8 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <h3 className="text-xl font-semibold mb-2">AI Diagnostic Analysis</h3>
          <p className="text-muted-foreground mb-4">
            Our AI is analyzing your device symptoms and uploaded images...
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-center">
              <Icon name="check" className="w-4 h-4 text-green-500 mr-2" />
              Processing symptom description
            </div>
            <div className="flex items-center justify-center">
              <Icon name="check" className="w-4 h-4 text-green-500 mr-2" />
              Analyzing device specifications
            </div>
            <div className="flex items-center justify-center animate-pulse">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
              Running diagnostic algorithms
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (currentStep === 'results') {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">AI Diagnostic Results</h3>
          <Button variant="ghost" onClick={restartDiagnosis}>
            <Icon name="refresh-ccw" className="w-4 h-4 mr-2" />
            New Diagnosis
          </Button>
        </div>

        <div className="space-y-4">
          {results.map((result, index) => (
            <DiagnosticResultCard key={index} result={result} />
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center mb-2">
            <Icon name="info" className="w-5 h-5 text-blue-500 mr-2" />
            <h4 className="font-medium text-blue-800">Next Steps</h4>
          </div>
          <p className="text-sm text-blue-600 mb-3">
            Based on our AI analysis, we recommend booking a professional diagnosis for accurate assessment.
          </p>
          <div className="flex gap-2">
            <Button size="sm">
              <Icon name="calendar" className="w-4 h-4 mr-2" />
              Book Repair
            </Button>
            <Button variant="ghost" size="sm">
              <Icon name="message-circle" className="w-4 h-4 mr-2" />
              Get Quote
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">AI-Powered Device Diagnostics</h3>
        <p className="text-muted-foreground">
          Describe your device issues and upload photos for instant AI analysis
        </p>
      </div>

      {/* Device Information */}
      {deviceModel && (
        <div className="mb-6 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Device Information</h4>
          <p className="text-sm text-muted-foreground">{deviceModel}</p>
        </div>
      )}

      {/* Quick Symptom Selection */}
      <div className="mb-6">
        <h4 className="font-medium mb-3">Common Issues (Click to add)</h4>
        <div className="space-y-3">
          {symptomCategories.map((category, categoryIndex) => (
            <div key={categoryIndex}>
              <h5 className="text-sm font-medium text-muted-foreground mb-2">
                {category.name}
              </h5>
              <div className="flex flex-wrap gap-2">
                {category.symptoms.map((symptom, symptomIndex) => (
                  <Button
                    key={symptomIndex}
                    variant="ghost"
                    size="sm"
                    onClick={() => addSymptom(symptom)}
                    className="text-xs h-8"
                  >
                    {symptom}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Symptom Description */}
      <div className="mb-6">
        <label className="text-sm font-medium mb-2 block">
          Describe the symptoms in detail
        </label>
        <Textarea
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          placeholder="Please describe what's happening with your device. Be as specific as possible about when the issue occurs, what triggers it, and any error messages you see..."
          rows={4}
          className="w-full"
        />
      </div>

      {/* Image Upload */}
      <div className="mb-6">
        <label className="text-sm font-medium mb-2 block">
          Upload photos of the issue (optional)
        </label>
        <div
          className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <Icon name="upload" className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Click to upload or drag and drop images
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            PNG, JPG up to 10MB each
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          className="hidden"
        />

        {/* Uploaded Images */}
        {uploadedImages.length > 0 && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            {uploadedImages.map((file, index) => (
              <div key={index} className="relative">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-20 object-cover rounded-lg"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 p-0 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Analysis Button */}
      <Button
        onClick={analyzeDevice}
        disabled={analyzing || !symptoms.trim()}
        className="w-full"
        size="lg"
      >
        {analyzing ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Analyzing...
          </>
        ) : (
          <>
            <Icon name="cpu" className="w-4 h-4 mr-2" />
            Start AI Diagnosis
          </>
        )}
      </Button>

      {/* Disclaimer */}
      <div className="mt-4 text-xs text-muted-foreground text-center">
        <p>
          AI diagnosis is for preliminary assessment only. Professional inspection 
          may be required for accurate diagnosis and repair recommendations.
        </p>
      </div>
    </Card>
  );
}

// Component for displaying individual diagnostic results
function DiagnosticResultCard({ result }: { result: DiagnosticResult }) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'emergency': return 'alert-triangle';
      case 'high': return 'clock';
      case 'medium': return 'calendar';
      default: return 'info';
    }
  };

  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-medium text-lg">{result.issue}</h4>
          <p className="text-sm text-muted-foreground">{result.category}</p>
        </div>
        <div className="text-right">
          <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${getSeverityColor(result.severity)}`}>
            {result.severity.toUpperCase()}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {Math.round(result.confidence)}% confidence
          </p>
        </div>
      </div>

      <p className="text-sm mb-4">{result.description}</p>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div>
          <h5 className="font-medium text-sm mb-2">Possible Causes:</h5>
          <ul className="text-sm space-y-1">
            {result.possibleCauses.map((cause, index) => (
              <li key={index} className="flex items-start">
                <Icon name="arrow-right" className="w-3 h-3 text-muted-foreground mr-2 mt-0.5 flex-shrink-0" />
                {cause}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h5 className="font-medium text-sm mb-2">Recommended Actions:</h5>
          <ul className="text-sm space-y-1">
            {result.recommendedActions.map((action, index) => (
              <li key={index} className="flex items-start">
                <Icon name="check" className="w-3 h-3 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                {action}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex justify-between items-center text-sm">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <Icon name="pound-sterling" className="w-4 h-4 text-primary mr-1" />
            <span>{result.estimatedCost.min}-{result.estimatedCost.max} {result.estimatedCost.currency}</span>
          </div>
          <div className="flex items-center">
            <Icon name={getUrgencyIcon(result.urgency)} className="w-4 h-4 text-muted-foreground mr-1" />
            <span>{result.repairTime}</span>
          </div>
        </div>
        {result.warranty && (
          <div className="flex items-center text-green-600">
            <Icon name="shield" className="w-4 h-4 mr-1" />
            <span>Warranty</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Mock function to generate diagnostic results (in real implementation, this would be replaced with AI service)
function generateMockDiagnostics(symptoms: string, deviceModel?: string): DiagnosticResult[] {
  const lowerSymptoms = symptoms.toLowerCase();
  const results: DiagnosticResult[] = [];

  // Screen-related issues
  if (lowerSymptoms.includes('screen') || lowerSymptoms.includes('display') || lowerSymptoms.includes('flicker')) {
    results.push({
      confidence: 85,
      category: 'Display Hardware',
      issue: 'Screen Connection Issue',
      severity: 'medium',
      description: 'Symptoms suggest a loose display cable or failing LCD panel connection.',
      possibleCauses: [
        'Loose display cable connection',
        'Damaged LCD connector',
        'Graphic card driver issues',
        'Physical damage to display assembly'
      ],
      recommendedActions: [
        'Professional cable reseating',
        'Display connector inspection',
        'Driver update verification',
        'Complete display diagnostics'
      ],
      estimatedCost: { min: 80, max: 250, currency: 'GBP' },
      urgency: 'medium',
      repairTime: '1-2 days',
      warranty: true
    });
  }

  // Performance issues
  if (lowerSymptoms.includes('slow') || lowerSymptoms.includes('freeze') || lowerSymptoms.includes('crash')) {
    results.push({
      confidence: 78,
      category: 'Performance',
      issue: 'System Performance Degradation',
      severity: 'medium',
      description: 'Multiple symptoms point to system-wide performance issues, likely software or thermal related.',
      possibleCauses: [
        'Insufficient available storage',
        'Background processes consuming resources',
        'Thermal throttling due to dust buildup',
        'Failing storage drive'
      ],
      recommendedActions: [
        'System cleanup and optimization',
        'Thermal cleaning service',
        'Storage drive health check',
        'Memory diagnostics'
      ],
      estimatedCost: { min: 60, max: 150, currency: 'GBP' },
      urgency: 'low',
      repairTime: 'Same day',
      warranty: false
    });
  }

  // Power issues
  if (lowerSymptoms.includes('power') || lowerSymptoms.includes('battery') || lowerSymptoms.includes('charging')) {
    results.push({
      confidence: 92,
      category: 'Power System',
      issue: 'Battery/Charging System Failure',
      severity: 'high',
      description: 'Critical power system component failure detected. Immediate service recommended.',
      possibleCauses: [
        'Battery cell degradation',
        'Charging port damage',
        'Power management IC failure',
        'Charging cable/adapter issues'
      ],
      recommendedActions: [
        'Battery replacement',
        'Charging port inspection',
        'Power adapter testing',
        'Complete power system diagnostics'
      ],
      estimatedCost: { min: 120, max: 300, currency: 'GBP' },
      urgency: 'high',
      repairTime: '2-3 days',
      warranty: true
    });
  }

  // Default result if no specific patterns match
  if (results.length === 0) {
    results.push({
      confidence: 65,
      category: 'General Hardware',
      issue: 'Hardware Diagnostic Required',
      severity: 'medium',
      description: 'Symptoms require professional diagnostic to identify the specific issue.',
      possibleCauses: [
        'Multiple potential hardware issues',
        'Intermittent component failure',
        'Software-hardware interaction problems'
      ],
      recommendedActions: [
        'Professional diagnostic service',
        'Component testing',
        'System health assessment'
      ],
      estimatedCost: { min: 40, max: 80, currency: 'GBP' },
      urgency: 'medium',
      repairTime: '1 day',
      warranty: false
    });
  }

  return results;
}