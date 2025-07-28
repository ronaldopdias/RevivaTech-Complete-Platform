'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Wrench, BrainCircuit, AlertCircle, CheckCircle, TrendingUp, MessageCircle, Shield, Info } from 'lucide-react';
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
  repairProbability?: number;
  businessValue?: {
    accuracyScore: number;
    marketComparison: string;
    expectedSatisfaction: number;
  };
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

interface AIResponse {
  success: boolean;
  response: {
    message: string;
    confidence: number;
    nextQuestion: string;
    suggestedQuestions: string[];
    canProceedToDiagnostic: boolean;
  };
  deviceAnalysis: {
    deviceType: string;
    issue: string;
    confidence: number;
    originalText: string;
    analysisDetails: {
      deviceConfidence: number;
      issueConfidence: number;
    };
  };
  conversationFlow: {
    stage: string;
    nextQuestion: string;
    suggestedQuestions: string[];
  };
  timestamp: string;
}

interface DiagnosticAPIResult {
  success: boolean;
  diagnostic: DiagnosticResult;
  timestamp: string;
}

interface IntelligentRepairChatbotProps {
  onDiagnosticComplete?: (result: DiagnosticResult) => void;
  onBookingRequested?: (details: any) => void;
  className?: string;
}

export default function IntelligentRepairChatbotAPI({
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentDiagnostic, setCurrentDiagnostic] = useState<DiagnosticStep | null>(null);
  const [diagnosticData, setDiagnosticData] = useState<Record<string, any>>({});
  const [confidence, setConfidence] = useState(0);
  const [conversationContext, setConversationContext] = useState<any>({});
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // API Configuration
  const API_BASE_URL = 'http://localhost:3011/api';
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Real AI processing using backend API
  const processNaturalLanguage = async (input: string): Promise<ChatMessage[]> => {
    setIsProcessing(true);
    
    try {
      console.log('🤖 Sending message to AI API:', input);
      
      const response = await fetch(`${API_BASE_URL}/ai-chatbot/process-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          context: conversationContext,
          conversationHistory: messages.map(m => ({
            role: m.type === 'user' ? 'user' : 'assistant',
            content: m.content
          }))
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const aiResult: AIResponse = await response.json();
      
      if (!aiResult.success) {
        throw new Error('AI processing failed');
      }

      console.log('🤖 AI Response received:', aiResult);

      // Update conversation context with device analysis
      const updatedContext = {
        ...conversationContext,
        deviceType: aiResult.deviceAnalysis.deviceType,
        issue: aiResult.deviceAnalysis.issue,
        stage: aiResult.conversationFlow.stage
      };
      setConversationContext(updatedContext);
      
      // Update confidence
      setConfidence(aiResult.deviceAnalysis.confidence);

      const responses: ChatMessage[] = [];

      // Add AI response message
      responses.push({
        id: `ai_${Date.now()}`,
        content: aiResult.response.message,
        type: 'bot',
        timestamp: new Date()
      });

      // If we can proceed to diagnostic, ask if user wants to continue
      if (aiResult.response.canProceedToDiagnostic && aiResult.deviceAnalysis.deviceType !== 'unknown' && aiResult.deviceAnalysis.issue !== 'general') {
        // Generate diagnostic result automatically
        await generateDiagnosticFromAPI(aiResult.deviceAnalysis, responses);
      } else if (aiResult.response.nextQuestion) {
        // Add next question as a bot message
        responses.push({
          id: `question_${Date.now()}`,
          content: aiResult.response.nextQuestion,
          type: 'bot',
          timestamp: new Date()
        });
      }

      setIsProcessing(false);
      return responses;

    } catch (error) {
      console.error('❌ AI processing error:', error);
      setIsProcessing(false);
      
      return [{
        id: `error_${Date.now()}`,
        content: "I apologize, but I'm having trouble processing your request right now. Please try again or contact our support team.",
        type: 'bot',
        timestamp: new Date()
      }];
    }
  };

  // Generate diagnostic result using real API
  const generateDiagnosticFromAPI = async (deviceAnalysis: any, responses: ChatMessage[]) => {
    try {
      console.log('🔍 Generating diagnostic via API for:', deviceAnalysis);
      
      const diagnosticResponse = await fetch(`${API_BASE_URL}/ai-chatbot/generate-diagnostic`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceType: deviceAnalysis.deviceType,
          issue: deviceAnalysis.issue,
          symptoms: [deviceAnalysis.originalText],
          confidence: deviceAnalysis.confidence
        })
      });

      if (!diagnosticResponse.ok) {
        throw new Error(`Diagnostic API failed: ${diagnosticResponse.status}`);
      }

      const diagnosticResult: DiagnosticAPIResult = await diagnosticResponse.json();
      
      if (!diagnosticResult.success) {
        throw new Error('Diagnostic generation failed');
      }

      console.log('🔍 Diagnostic result received:', diagnosticResult);

      // Create diagnostic result message
      const resultMessage: ChatMessage = {
        id: `result_${Date.now()}`,
        content: "Based on my analysis, here's your comprehensive diagnostic report:",
        type: 'result',
        timestamp: new Date(),
        diagnosticResult: diagnosticResult.diagnostic
      };

      responses.push(resultMessage);

      // Call callback if provided
      if (onDiagnosticComplete) {
        onDiagnosticComplete(diagnosticResult.diagnostic);
      }

    } catch (error) {
      console.error('❌ Diagnostic generation error:', error);
      
      responses.push({
        id: `diagnostic_error_${Date.now()}`,
        content: "I was able to analyze your device issue, but I'm having trouble generating the full diagnostic report. Please try again or contact our support team.",
        type: 'bot',
        timestamp: new Date()
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isProcessing) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      content: inputValue,
      type: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Process with AI
    const responses = await processNaturalLanguage(inputValue);
    setMessages(prev => [...prev, ...responses]);
  };


  const handleSuggestedQuestion = (question: string) => {
    setInputValue(question);
    inputRef.current?.focus();
  };

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.type === 'user';
    
    return (
      <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser 
            ? 'bg-blue-500 text-white ml-4' 
            : 'bg-gray-50 text-gray-900 mr-4'
        }`}>
          {!isUser && (
            <div className="flex items-center gap-2 mb-2">
              <BrainCircuit className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-600">AI Assistant</span>
              {confidence > 0 && (
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                  {confidence}% confident
                </span>
              )}
            </div>
          )}
          
          <div className="text-sm leading-relaxed">
            {message.content}
          </div>
          
          {message.diagnosticResult && (
            <div className="mt-4 space-y-4">
              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-semibold text-gray-900 mb-2">Diagnostic Results</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-blue-900">Cost Estimate</span>
                    </div>
                    <div className="text-lg font-bold text-blue-900">
                      £{message.diagnosticResult.estimatedCost.min} - £{message.diagnosticResult.estimatedCost.max}
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      *Estimate only - final price may vary
                    </div>
                  </div>
                  
                  <div className="bg-teal-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Wrench className="w-4 h-4 text-teal-600" />
                      <span className="font-medium text-teal-900">Repair Time</span>
                    </div>
                    <div className="text-lg font-bold text-teal-900">
                      {message.diagnosticResult.estimatedTime}
                    </div>
                    <div className="text-xs text-teal-600 mt-1">
                      *Estimate based on typical cases
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-gray-900">Recommendations</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    {message.diagnosticResult.recommendations.map((rec, idx) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                    <span className="font-medium text-gray-900">Next Steps</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                    {message.diagnosticResult.nextSteps.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ol>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Button 
                    onClick={() => onBookingRequested && onBookingRequested(message.diagnosticResult)}
                    className="w-full bg-blue-500 hover:bg-blue-700 text-white"
                  >
                    Book Repair Appointment
                  </Button>
                  <div className="mt-2 text-xs text-gray-500 text-center">
                    Professional assessment required for final diagnosis
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="text-xs opacity-70 mt-2">
            {message.timestamp.toLocaleTimeString()}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-[700px] bg-white rounded-lg shadow-lg border border-blue-200 ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-teal-600 rounded-t-lg">
        <div className="flex items-center gap-3 p-4 text-white">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <BrainCircuit className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white">AI Repair Assistant</h3>
            <p className="text-sm text-white/90">
              {isProcessing ? 'Analyzing your device...' : 'Intelligent diagnostic support'}
            </p>
          </div>
          {confidence > 0 && (
            <div className="text-right">
              <div className="text-sm font-medium text-white">{confidence}%</div>
              <div className="text-xs text-white/80">Confidence</div>
            </div>
          )}
        </div>
        
        {/* Disclaimer Banner */}
        <div className="bg-white/10 backdrop-blur-sm px-4 py-2 border-t border-white/20">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-white/80" />
            <span className="text-xs text-white/90">
              AI estimates are preliminary. Final pricing and diagnosis require professional assessment.
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(renderMessage)}
        
        {isProcessing && (
          <div className="flex justify-start mb-4">
            <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-gray-50 text-gray-900 mr-4">
              <div className="flex items-center gap-2 mb-2">
                <BrainCircuit className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-600">AI Assistant</span>
              </div>
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span className="text-sm">Analyzing your device and generating recommendations...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200">
        <form onSubmit={handleSubmit} className="flex gap-2 p-4">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Describe your device issue..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              disabled={isProcessing}
            />
          </div>
          
          <Button
            type="submit"
            disabled={!inputValue.trim() || isProcessing}
            className="px-6 bg-blue-500 hover:bg-blue-700 text-white"
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </form>
        
        {/* Footer Disclaimers */}
        <div className="bg-gray-50 px-4 py-3 rounded-b-lg border-t border-gray-200">
          <div className="flex items-start gap-2 text-xs text-gray-600">
            <Shield className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p><strong>Important:</strong> AI responses are estimates only and may not reflect actual pricing, availability, or terms.</p>
              <p>All repairs subject to professional assessment and our full terms & conditions.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}