'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Loader2, Wrench, BrainCircuit, AlertCircle, CheckCircle, TrendingUp, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface DiagnosticStep {
  id: string;
  question: string;
  type: 'text' | 'choice' | 'image' | 'audio';
  options?: string[];
  required: boolean;
  followUp?: string[];
}

interface DiagnosticResult {
  issue: string;
  confidence: number;
  estimatedTime: string;
  estimatedCost: { min: number; max: number };
  urgency: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
  nextSteps: string[];
  warranty?: string;
  partsNeeded?: string[];
}

interface ChatMessage {
  id: string;
  content: string;
  type: 'user' | 'bot' | 'diagnostic' | 'result';
  timestamp: Date;
  diagnosticStep?: DiagnosticStep;
  diagnosticResult?: DiagnosticResult;
  isTyping?: boolean;
}

interface IntelligentRepairChatbotProps {
  onDiagnosticComplete?: (result: DiagnosticResult) => void;
  onBookingRequested?: (details: any) => void;
  className?: string;
}

export default function IntelligentRepairChatbot({
  onDiagnosticComplete,
  onBookingRequested,
  className = ''
}: IntelligentRepairChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: "Hi! I'm your AI repair diagnostic assistant. I can help identify device issues, estimate repair costs, and guide you through the process. What device are you having trouble with?",
      type: 'bot',
      timestamp: new Date()
    }
  ]);
  
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentDiagnostic, setCurrentDiagnostic] = useState<DiagnosticStep | null>(null);
  const [diagnosticData, setDiagnosticData] = useState<Record<string, any>>({});
  const [confidence, setConfidence] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock AI processing with realistic diagnostic flow
  const processNaturalLanguage = async (input: string): Promise<ChatMessage[]> => {
    setIsProcessing(true);
    
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const responses: ChatMessage[] = [];
    
    // Device detection logic
    const deviceKeywords = {
      'iphone': { type: 'smartphone', brand: 'apple' },
      'samsung': { type: 'smartphone', brand: 'samsung' },
      'macbook': { type: 'laptop', brand: 'apple' },
      'laptop': { type: 'laptop', brand: 'generic' },
      'ipad': { type: 'tablet', brand: 'apple' },
      'computer': { type: 'desktop', brand: 'generic' }
    };
    
    const issueKeywords = {
      'cracked': 'screen',
      'broken': 'hardware',
      'slow': 'performance',
      'battery': 'battery',
      'water': 'liquid_damage',
      'overheating': 'thermal',
      'virus': 'software',
      'frozen': 'software'
    };
    
    const inputLower = input.toLowerCase();
    let detectedDevice = null;
    let detectedIssue = null;
    
    for (const [keyword, device] of Object.entries(deviceKeywords)) {
      if (inputLower.includes(keyword)) {
        detectedDevice = device;
        break;
      }
    }
    
    for (const [keyword, issue] of Object.entries(issueKeywords)) {
      if (inputLower.includes(keyword)) {
        detectedIssue = issue;
        break;
      }
    }
    
    if (detectedDevice && detectedIssue) {
      // Start diagnostic flow
      const diagnosticStep: DiagnosticStep = {
        id: '1',
        question: generateDiagnosticQuestion(detectedDevice, detectedIssue),
        type: 'choice',
        options: generateDiagnosticOptions(detectedDevice, detectedIssue),
        required: true
      };
      
      setCurrentDiagnostic(diagnosticStep);
      setDiagnosticData({ device: detectedDevice, issue: detectedIssue });
      
      responses.push({
        id: Date.now().toString(),
        content: `I understand you're having ${detectedIssue} issues with your ${detectedDevice.brand} ${detectedDevice.type}. Let me run a diagnostic to help identify the exact problem and provide an accurate estimate.`,
        type: 'bot',
        timestamp: new Date()
      });
      
      responses.push({
        id: (Date.now() + 1).toString(),
        content: '',
        type: 'diagnostic',
        timestamp: new Date(),
        diagnosticStep
      });
      
    } else if (detectedDevice) {
      responses.push({
        id: Date.now().toString(),
        content: `Great! I can help with your ${detectedDevice.brand} ${detectedDevice.type}. Can you describe what specific problem you're experiencing? For example, is it a screen issue, performance problem, battery concern, or something else?`,
        type: 'bot',
        timestamp: new Date()
      });
    } else {
      responses.push({
        id: Date.now().toString(),
        content: "I can help with various devices including iPhones, iPads, MacBooks, Samsung phones, laptops, and desktop computers. Could you tell me what specific device you need help with?",
        type: 'bot',
        timestamp: new Date()
      });
    }
    
    setIsProcessing(false);
    return responses;
  };

  const generateDiagnosticQuestion = (device: any, issue: string): string => {
    const questions = {
      screen: "How did the screen damage occur?",
      battery: "How long does your battery typically last now?",
      performance: "When did you first notice the device becoming slow?",
      liquid_damage: "What type of liquid came into contact with the device?",
      thermal: "When does the device typically overheat?",
      software: "What symptoms are you experiencing?"
    };
    
    return questions[issue as keyof typeof questions] || "Can you provide more details about the issue?";
  };

  const generateDiagnosticOptions = (device: any, issue: string): string[] => {
    const options = {
      screen: ["Dropped on hard surface", "Impact damage", "Pressure damage", "Unknown cause"],
      battery: ["Less than 2 hours", "2-4 hours", "4-6 hours", "Drains very quickly"],
      performance: ["Last few days", "Last few weeks", "Last few months", "Gradually over time"],
      liquid_damage: ["Water", "Coffee/Tea", "Other liquid", "Not sure"],
      thermal: ["During charging", "During use", "All the time", "Specific apps"],
      software: ["Crashes frequently", "Frozen screen", "Error messages", "Won't turn on"]
    };
    
    return options[issue as keyof typeof options] || ["Yes", "No", "Not sure"];
  };

  const processDiagnosticResponse = async (response: string): Promise<void> => {
    setIsProcessing(true);
    
    // Update diagnostic data
    const updatedData = { ...diagnosticData, currentResponse: response };
    setDiagnosticData(updatedData);
    
    // Calculate confidence based on responses
    const newConfidence = Math.min(confidence + 25, 95);
    setConfidence(newConfidence);
    
    // Simulate diagnostic processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate final diagnostic result
    const result: DiagnosticResult = generateDiagnosticResult(updatedData, newConfidence);
    
    const resultMessage: ChatMessage = {
      id: Date.now().toString(),
      content: '',
      type: 'result',
      timestamp: new Date(),
      diagnosticResult: result
    };
    
    setMessages(prev => [...prev, resultMessage]);
    setCurrentDiagnostic(null);
    setIsProcessing(false);
    
    if (onDiagnosticComplete) {
      onDiagnosticComplete(result);
    }
  };

  const generateDiagnosticResult = (data: any, confidence: number): DiagnosticResult => {
    // Mock diagnostic logic - in real implementation, this would use ML models
    const issues = {
      screen: {
        issue: "Screen Assembly Replacement Required",
        time: "30-45 minutes",
        cost: { min: 89, max: 149 },
        urgency: "medium" as const,
        recommendations: [
          "Avoid using the device to prevent glass fragments",
          "Backup your data immediately",
          "Consider screen protector for future protection"
        ],
        nextSteps: [
          "Book a repair appointment",
          "Bring device and charger",
          "Data backup recommended"
        ],
        warranty: "6 months parts and labor",
        partsNeeded: ["Screen Assembly", "Adhesive Kit"]
      },
      battery: {
        issue: "Battery Replacement Recommended",
        time: "25-35 minutes",
        cost: { min: 59, max: 89 },
        urgency: "medium" as const,
        recommendations: [
          "Replace battery before complete failure",
          "Use original charger only",
          "Avoid extreme temperatures"
        ],
        nextSteps: [
          "Schedule battery replacement",
          "Backup device data",
          "Bring original charger"
        ],
        warranty: "12 months battery warranty",
        partsNeeded: ["Original Battery", "Adhesive Strips"]
      },
      performance: {
        issue: "Software Optimization and Cleanup",
        time: "45-60 minutes",
        cost: { min: 39, max: 69 },
        urgency: "low" as const,
        recommendations: [
          "Regular software updates",
          "Storage cleanup maintenance",
          "Remove unused applications"
        ],
        nextSteps: [
          "Book software service",
          "List problematic apps",
          "Prepare for data backup"
        ],
        warranty: "30 days service guarantee",
        partsNeeded: []
      }
    };
    
    const issueType = data.issue || 'performance';
    const baseResult = issues[issueType as keyof typeof issues] || issues.performance;
    
    return {
      ...baseResult,
      confidence,
      estimatedCost: {
        min: Math.round(baseResult.cost.min * (confidence / 100)),
        max: Math.round(baseResult.cost.max * (confidence / 100))
      }
    };
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputValue,
      type: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    
    if (currentDiagnostic) {
      await processDiagnosticResponse(inputValue);
    } else {
      const responses = await processNaturalLanguage(inputValue);
      setMessages(prev => [...prev, ...responses]);
    }
  };

  const handleDiagnosticChoice = async (choice: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: choice,
      type: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    await processDiagnosticResponse(choice);
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      setIsListening(false);
    } else {
      setIsListening(true);
      // Mock voice recognition - would integrate with Web Speech API
      setTimeout(() => {
        setInputValue("My MacBook screen is cracked");
        setIsListening(false);
      }, 3000);
    }
  };

  const renderMessage = (message: ChatMessage) => {
    if (message.type === 'diagnostic' && message.diagnosticStep) {
      return (
        <div className="mb-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <BrainCircuit className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                <div className="flex items-center space-x-2 mb-3">
                  <Wrench className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-800">AI Diagnostic</span>
                  <div className="flex-1 bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${confidence}%` }}
                    />
                  </div>
                  <span className="text-sm text-blue-600">{confidence}%</span>
                </div>
                
                <p className="text-gray-700 mb-3">{message.diagnosticStep.question}</p>
                
                <div className="space-y-2">
                  {message.diagnosticStep.options?.map((option, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-start text-left"
                      onClick={() => handleDiagnosticChoice(option)}
                      disabled={isProcessing}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      );
    }
    
    if (message.type === 'result' && message.diagnosticResult) {
      const result = message.diagnosticResult;
      const urgencyColors = {
        low: 'text-green-600 bg-green-100',
        medium: 'text-yellow-600 bg-yellow-100',
        high: 'text-orange-600 bg-orange-100',
        critical: 'text-red-600 bg-red-100'
      };
      
      return (
        <div className="mb-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-blue-600 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <Card className="p-6 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Diagnostic Complete</h3>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${urgencyColors[result.urgency]}`}>
                    {result.urgency.toUpperCase()} PRIORITY
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Identified Issue</h4>
                    <p className="text-gray-600">{result.issue}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Confidence Level</h4>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${result.confidence}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{result.confidence}%</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Estimated Time</h4>
                    <p className="text-gray-600">{result.estimatedTime}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Estimated Cost</h4>
                    <p className="text-gray-600">£{result.estimatedCost.min} - £{result.estimatedCost.max}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Recommendations</h4>
                    <ul className="space-y-1">
                      {result.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="flex space-x-3 pt-4 border-t">
                    <Button 
                      variant="primary" 
                      className="flex-1"
                      onClick={() => onBookingRequested && onBookingRequested(result)}
                    >
                      Book Repair
                    </Button>
                    <Button variant="outline" className="flex-1">
                      Get Second Opinion
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="mb-4">
        <div className={`flex items-start space-x-3 ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            message.type === 'user' 
              ? 'bg-blue-600' 
              : 'bg-gradient-to-r from-purple-500 to-blue-600'
          }`}>
            {message.type === 'user' ? (
              <span className="text-white text-sm font-medium">You</span>
            ) : (
              <BrainCircuit className="w-4 h-4 text-white" />
            )}
          </div>
          <div className={`flex-1 ${message.type === 'user' ? 'text-right' : ''}`}>
            <Card className={`p-3 ${
              message.type === 'user' 
                ? 'bg-blue-600 text-white ml-12' 
                : 'bg-white border-gray-200 mr-12'
            }`}>
              {message.isTyping ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AI is thinking...</span>
                </div>
              ) : (
                <p className="text-sm">{message.content}</p>
              )}
            </Card>
            <p className={`text-xs text-gray-500 mt-1 ${message.type === 'user' ? 'text-right' : ''}`}>
              {message.timestamp.toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Focus input after diagnostic completion
    if (!currentDiagnostic && !isProcessing) {
      inputRef.current?.focus();
    }
  }, [currentDiagnostic, isProcessing]);

  return (
    <Card className={`flex flex-col h-[600px] ${className}`}>
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-lg">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold">AI Repair Assistant</h3>
            <p className="text-sm opacity-90">Intelligent diagnostic and repair guidance</p>
          </div>
          <div className="flex-1" />
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">Advanced AI</span>
          </div>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(renderMessage)}
        {isProcessing && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-600 flex items-center justify-center">
              <BrainCircuit className="w-4 h-4 text-white" />
            </div>
            <Card className="p-3 bg-white border-gray-200 mr-12">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span className="text-sm text-gray-600">AI is analyzing...</span>
              </div>
            </Card>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      {!currentDiagnostic && (
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Describe your device issue or ask a question..."
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isProcessing}
              />
              <button
                onClick={toggleVoiceInput}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded ${
                  isListening ? 'text-red-500' : 'text-gray-400 hover:text-gray-600'
                }`}
                disabled={isProcessing}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>
            <Button 
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isProcessing}
              className="px-6"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            AI-powered diagnostic assistant • Supports voice input • Instant analysis
          </p>
        </div>
      )}
    </Card>
  );
}