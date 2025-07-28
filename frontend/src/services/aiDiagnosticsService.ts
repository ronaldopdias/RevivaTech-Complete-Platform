/**
 * AI Diagnostics Service
 * 
 * Advanced AI-powered device diagnostic system that analyzes:
 * - Text descriptions of symptoms
 * - Uploaded images of device damage
 * - Device specifications and history
 * - Common failure patterns
 * 
 * Features:
 * - Multi-modal analysis (text + image)
 * - Confidence scoring
 * - Cost estimation
 * - Repair recommendations
 * - Urgency classification
 * - Historical data learning
 */

import { UploadedFile } from '@/components/ui/EnhancedFileUpload';

export interface DeviceInfo {
  id?: string;
  brand: string;
  model: string;
  year?: number;
  category: 'laptop' | 'desktop' | 'tablet' | 'phone' | 'console' | 'other';
  specifications?: {
    processor?: string;
    memory?: string;
    storage?: string;
    graphics?: string;
  };
  purchaseDate?: string;
  warrantyStatus?: 'active' | 'expired' | 'unknown';
}

export interface DiagnosticInput {
  deviceInfo: DeviceInfo;
  symptoms: string;
  images?: UploadedFile[];
  customerHistory?: RepairHistory[];
  urgencyLevel?: 'low' | 'medium' | 'high' | 'emergency';
  environmentalFactors?: {
    usage: 'light' | 'moderate' | 'heavy';
    environment: 'home' | 'office' | 'industrial' | 'outdoor';
    accidents: boolean;
    liquidDamage: boolean;
  };
}

export interface RepairHistory {
  date: string;
  issue: string;
  solution: string;
  cost: number;
  warranty: boolean;
}

export interface DiagnosticResult {
  id: string;
  confidence: number;
  category: string;
  issue: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  technicalDetails: string;
  possibleCauses: Array<{
    cause: string;
    probability: number;
    impact: string;
  }>;
  recommendedActions: Array<{
    action: string;
    priority: number;
    cost?: { min: number; max: number; currency: string };
    timeEstimate: string;
    skillLevel: 'basic' | 'intermediate' | 'professional';
  }>;
  estimatedCost: {
    parts: { min: number; max: number; currency: string };
    labor: { min: number; max: number; currency: string };
    total: { min: number; max: number; currency: string };
  };
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  repairTime: string;
  warranty: boolean;
  preventiveMeasures: string[];
  followUpActions: string[];
  riskFactors: string[];
  imageAnalysis?: ImageAnalysisResult[];
}

export interface ImageAnalysisResult {
  imageId: string;
  detectedIssues: Array<{
    type: string;
    confidence: number;
    boundingBox?: { x: number; y: number; width: number; height: number };
    description: string;
  }>;
  overallCondition: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  recommendations: string[];
}

export interface DiagnosticSession {
  sessionId: string;
  deviceInfo: DeviceInfo;
  startTime: string;
  endTime?: string;
  results: DiagnosticResult[];
  customerFeedback?: {
    accuracy: number;
    helpfulness: number;
    comments: string;
  };
  followUpRequired: boolean;
  bookingCreated: boolean;
}

class AIDeviceDiagnosticsService {
  private apiBaseUrl: string;
  private sessions: Map<string, DiagnosticSession> = new Map();

  constructor(apiBaseUrl: string = '/api/ai') {
    this.apiBaseUrl = apiBaseUrl;
  }

  /**
   * Start a new diagnostic session
   */
  async startDiagnosticSession(deviceInfo: DeviceInfo): Promise<string> {
    const sessionId = `diag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: DiagnosticSession = {
      sessionId,
      deviceInfo,
      startTime: new Date().toISOString(),
      results: [],
      followUpRequired: false,
      bookingCreated: false,
    };

    this.sessions.set(sessionId, session);
    
    // Log session start for analytics
    this.logAnalyticsEvent('diagnostic_session_started', {
      sessionId,
      deviceBrand: deviceInfo.brand,
      deviceModel: deviceInfo.model,
      deviceCategory: deviceInfo.category,
    });

    return sessionId;
  }

  /**
   * Perform comprehensive AI diagnostic analysis
   */
  async performDiagnosis(
    sessionId: string,
    input: DiagnosticInput
  ): Promise<DiagnosticResult[]> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Invalid session ID');
    }

    try {
      // Step 1: Analyze text symptoms
      const textAnalysis = await this.analyzeTextSymptoms(input.symptoms, input.deviceInfo);
      
      // Step 2: Analyze uploaded images (if any)
      const imageAnalysis = input.images?.length 
        ? await this.analyzeImages(input.images, input.deviceInfo)
        : [];

      // Step 3: Cross-reference with device knowledge base
      const knowledgeBaseResults = await this.queryKnowledgeBase(
        input.deviceInfo,
        input.symptoms,
        input.customerHistory
      );

      // Step 4: Generate comprehensive diagnostic results
      const results = await this.generateDiagnosticResults(
        textAnalysis,
        imageAnalysis,
        knowledgeBaseResults,
        input
      );

      // Step 5: Apply machine learning confidence adjustments
      const enhancedResults = await this.enhanceWithMLConfidence(results, input);

      // Update session
      session.results = enhancedResults;
      session.endTime = new Date().toISOString();

      // Log diagnostic completion
      this.logAnalyticsEvent('diagnostic_completed', {
        sessionId,
        resultsCount: enhancedResults.length,
        avgConfidence: enhancedResults.reduce((acc, r) => acc + r.confidence, 0) / enhancedResults.length,
        highestSeverity: this.getHighestSeverity(enhancedResults),
      });

      return enhancedResults;

    } catch (error) {
      console.error('Diagnostic analysis failed:', error);
      
      // Log error for monitoring
      this.logAnalyticsEvent('diagnostic_error', {
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw new Error('Diagnostic analysis failed. Please try again.');
    }
  }

  /**
   * Analyze text symptoms using NLP
   */
  private async analyzeTextSymptoms(symptoms: string, deviceInfo: DeviceInfo) {
    // In a real implementation, this would call an NLP service
    // For now, we'll use pattern matching and keyword analysis
    
    const symptomKeywords = this.extractSymptomKeywords(symptoms);
    const devicePatterns = this.getDeviceSpecificPatterns(deviceInfo);
    
    return {
      extractedSymptoms: symptomKeywords,
      severity: this.assessSeverityFromText(symptoms),
      urgency: this.assessUrgencyFromText(symptoms),
      categories: this.categorizeSymptoms(symptomKeywords),
      deviceSpecificFactors: devicePatterns,
    };
  }

  /**
   * Analyze uploaded images for visible damage
   */
  private async analyzeImages(images: UploadedFile[], deviceInfo: DeviceInfo): Promise<ImageAnalysisResult[]> {
    const results: ImageAnalysisResult[] = [];

    for (const image of images) {
      try {
        // In a real implementation, this would use computer vision API
        // For now, we'll simulate image analysis based on file properties
        
        const analysis: ImageAnalysisResult = {
          imageId: image.id,
          detectedIssues: await this.mockImageAnalysis(image, deviceInfo),
          overallCondition: this.assessImageCondition(image),
          recommendations: this.generateImageRecommendations(image),
        };

        results.push(analysis);
      } catch (error) {
        console.warn(`Failed to analyze image ${image.id}:`, error);
      }
    }

    return results;
  }

  /**
   * Query device-specific knowledge base
   */
  private async queryKnowledgeBase(
    deviceInfo: DeviceInfo,
    symptoms: string,
    history?: RepairHistory[]
  ) {
    // Simulate knowledge base query
    const commonIssues = this.getCommonIssuesForDevice(deviceInfo);
    const historicalPatterns = this.analyzeHistoricalPatterns(history);
    
    return {
      commonIssues,
      historicalPatterns,
      deviceSpecificGuidance: this.getDeviceSpecificGuidance(deviceInfo),
      warrantyConsiderations: this.checkWarrantyImplications(deviceInfo),
    };
  }

  /**
   * Generate comprehensive diagnostic results
   */
  private async generateDiagnosticResults(
    textAnalysis: any,
    imageAnalysis: ImageAnalysisResult[],
    knowledgeBase: any,
    input: DiagnosticInput
  ): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];

    // Generate results based on text analysis
    for (const category of textAnalysis.categories) {
      const result = this.createDiagnosticResult(
        category,
        textAnalysis,
        imageAnalysis,
        knowledgeBase,
        input
      );
      results.push(result);
    }

    // Add image-specific results
    for (const imageResult of imageAnalysis) {
      if (imageResult.detectedIssues.length > 0) {
        const imageBasedResult = this.createImageBasedDiagnosticResult(
          imageResult,
          input
        );
        results.push(imageBasedResult);
      }
    }

    // Merge and deduplicate similar results
    return this.mergeSimilarResults(results);
  }

  /**
   * Enhance results with machine learning confidence
   */
  private async enhanceWithMLConfidence(
    results: DiagnosticResult[],
    input: DiagnosticInput
  ): Promise<DiagnosticResult[]> {
    // Apply ML confidence adjustments based on:
    // - Device age and model reliability
    // - Symptom clarity and specificity
    // - Image quality and content
    // - Historical accuracy of similar cases

    return results.map(result => ({
      ...result,
      confidence: this.adjustConfidenceWithML(result, input),
    }));
  }

  /**
   * Extract keywords from symptom description
   */
  private extractSymptomKeywords(symptoms: string): string[] {
    const keywords = symptoms.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);

    const relevantKeywords = keywords.filter(keyword =>
      this.isRelevantSymptomKeyword(keyword)
    );

    return [...new Set(relevantKeywords)];
  }

  /**
   * Check if a keyword is relevant to diagnostics
   */
  private isRelevantSymptomKeyword(keyword: string): boolean {
    const symptomTerms = [
      'screen', 'display', 'battery', 'power', 'charging', 'slow', 'fast',
      'hot', 'cold', 'noise', 'sound', 'crack', 'broken', 'dead', 'freeze',
      'crash', 'blue', 'black', 'white', 'flicker', 'dim', 'bright',
      'keyboard', 'mouse', 'trackpad', 'wifi', 'bluetooth', 'usb', 'port',
      'fan', 'overheat', 'shutdown', 'restart', 'boot', 'start', 'turn',
      'install', 'update', 'error', 'message', 'popup', 'virus', 'malware'
    ];

    return symptomTerms.some(term => keyword.includes(term) || term.includes(keyword));
  }

  /**
   * Categorize symptoms into diagnostic categories
   */
  private categorizeSymptoms(keywords: string[]): string[] {
    const categories = new Set<string>();

    const categoryMap = {
      display: ['screen', 'display', 'monitor', 'flicker', 'dim', 'bright', 'black', 'blue'],
      power: ['battery', 'power', 'charging', 'charge', 'dead', 'drain', 'shutdown'],
      performance: ['slow', 'freeze', 'crash', 'lag', 'hang', 'stuck'],
      thermal: ['hot', 'overheat', 'fan', 'noise', 'temperature'],
      input: ['keyboard', 'mouse', 'trackpad', 'key', 'click', 'touch'],
      connectivity: ['wifi', 'bluetooth', 'internet', 'network', 'connection'],
      audio: ['sound', 'speaker', 'microphone', 'audio', 'volume'],
      storage: ['disk', 'drive', 'storage', 'memory', 'space'],
      software: ['error', 'update', 'install', 'virus', 'malware', 'popup'],
    };

    for (const [category, terms] of Object.entries(categoryMap)) {
      if (terms.some(term => keywords.some(keyword => keyword.includes(term)))) {
        categories.add(category);
      }
    }

    return Array.from(categories);
  }

  /**
   * Create a diagnostic result for a category
   */
  private createDiagnosticResult(
    category: string,
    textAnalysis: any,
    imageAnalysis: ImageAnalysisResult[],
    knowledgeBase: any,
    input: DiagnosticInput
  ): DiagnosticResult {
    const resultId = `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Get category-specific templates and data
    const template = this.getDiagnosticTemplate(category, input.deviceInfo);
    
    return {
      id: resultId,
      confidence: this.calculateBaseConfidence(category, textAnalysis, imageAnalysis),
      category: template.category,
      issue: template.issue,
      severity: this.determineSeverity(category, textAnalysis, imageAnalysis),
      description: template.description,
      technicalDetails: template.technicalDetails,
      possibleCauses: template.possibleCauses,
      recommendedActions: template.recommendedActions,
      estimatedCost: this.calculateCosts(category, input.deviceInfo),
      urgency: this.determineUrgency(category, textAnalysis),
      repairTime: template.repairTime,
      warranty: this.checkWarrantyCoverage(category, input.deviceInfo),
      preventiveMeasures: template.preventiveMeasures,
      followUpActions: template.followUpActions,
      riskFactors: template.riskFactors,
      imageAnalysis: imageAnalysis.filter(img => 
        img.detectedIssues.some(issue => issue.type === category)
      ),
    };
  }

  /**
   * Get diagnostic template for category
   */
  private getDiagnosticTemplate(category: string, deviceInfo: DeviceInfo) {
    const templates = {
      display: {
        category: 'Display Hardware',
        issue: 'Display System Malfunction',
        description: 'Issues detected with the display system including potential LCD, LED, or connection problems.',
        technicalDetails: 'Display subsystem showing signs of hardware or connection failure.',
        possibleCauses: [
          { cause: 'LCD panel failure', probability: 0.3, impact: 'Complete display replacement required' },
          { cause: 'Display cable connection issue', probability: 0.4, impact: 'Cable reseating or replacement' },
          { cause: 'Graphics driver corruption', probability: 0.2, impact: 'Driver reinstallation needed' },
          { cause: 'Motherboard graphics issue', probability: 0.1, impact: 'Motherboard repair required' },
        ],
        recommendedActions: [
          { action: 'Display cable inspection and reseating', priority: 1, timeEstimate: '30 minutes', skillLevel: 'professional' as const },
          { action: 'LCD panel functionality test', priority: 2, timeEstimate: '1 hour', skillLevel: 'professional' as const },
          { action: 'Graphics driver verification', priority: 3, timeEstimate: '20 minutes', skillLevel: 'intermediate' as const },
        ],
        repairTime: '2-4 hours',
        preventiveMeasures: [
          'Avoid pressure on screen',
          'Use proper carrying case',
          'Regular driver updates',
        ],
        followUpActions: [
          'Display calibration after repair',
          'Extended testing period',
        ],
        riskFactors: [
          'Further damage if continued use',
          'Potential data loss if system crashes',
        ],
      },
      power: {
        category: 'Power Management',
        issue: 'Power System Failure',
        description: 'Critical power system components showing signs of failure or degradation.',
        technicalDetails: 'Power delivery system experiencing operational anomalies.',
        possibleCauses: [
          { cause: 'Battery cell degradation', probability: 0.5, impact: 'Battery replacement required' },
          { cause: 'Charging circuit failure', probability: 0.3, impact: 'Charging board repair/replacement' },
          { cause: 'Power adapter malfunction', probability: 0.15, impact: 'Adapter replacement needed' },
          { cause: 'Motherboard power regulation issue', probability: 0.05, impact: 'Motherboard repair required' },
        ],
        recommendedActions: [
          { action: 'Battery health assessment', priority: 1, timeEstimate: '45 minutes', skillLevel: 'professional' as const },
          { action: 'Charging system diagnostics', priority: 2, timeEstimate: '1 hour', skillLevel: 'professional' as const },
          { action: 'Power adapter testing', priority: 3, timeEstimate: '15 minutes', skillLevel: 'basic' as const },
        ],
        repairTime: '1-3 days',
        preventiveMeasures: [
          'Avoid deep discharge cycles',
          'Use original charger',
          'Maintain proper ventilation',
        ],
        followUpActions: [
          'Battery calibration',
          'Power management optimization',
        ],
        riskFactors: [
          'Complete power loss',
          'Potential data corruption',
          'Fire hazard if swollen battery',
        ],
      },
      // Add more templates for other categories...
    };

    return templates[category as keyof typeof templates] || templates.display;
  }

  /**
   * Calculate estimated costs
   */
  private calculateCosts(category: string, deviceInfo: DeviceInfo) {
    const baseCosts = {
      display: { parts: [80, 250], labor: [60, 120] },
      power: { parts: [120, 300], labor: [80, 150] },
      performance: { parts: [0, 100], labor: [60, 120] },
      thermal: { parts: [20, 80], labor: [40, 100] },
      input: { parts: [30, 150], labor: [40, 80] },
      connectivity: { parts: [20, 100], labor: [60, 120] },
      audio: { parts: [40, 120], labor: [40, 80] },
      storage: { parts: [80, 400], labor: [60, 120] },
      software: { parts: [0, 50], labor: [40, 100] },
    };

    const costs = baseCosts[category as keyof typeof baseCosts] || baseCosts.display;
    
    // Adjust costs based on device age and category
    const ageMultiplier = this.getAgeMultiplier(deviceInfo);
    const categoryMultiplier = this.getCategoryMultiplier(deviceInfo.category);

    const adjustedParts = [
      Math.round(costs.parts[0] * ageMultiplier * categoryMultiplier),
      Math.round(costs.parts[1] * ageMultiplier * categoryMultiplier),
    ];
    
    const adjustedLabor = [
      Math.round(costs.labor[0] * categoryMultiplier),
      Math.round(costs.labor[1] * categoryMultiplier),
    ];

    return {
      parts: { min: adjustedParts[0], max: adjustedParts[1], currency: 'GBP' },
      labor: { min: adjustedLabor[0], max: adjustedLabor[1], currency: 'GBP' },
      total: {
        min: adjustedParts[0] + adjustedLabor[0],
        max: adjustedParts[1] + adjustedLabor[1],
        currency: 'GBP',
      },
    };
  }

  /**
   * Mock image analysis (would be replaced with computer vision)
   */
  private async mockImageAnalysis(image: UploadedFile, deviceInfo: DeviceInfo) {
    // Simulate AI image analysis based on file name and type
    const issues = [];
    
    if (image.originalName.toLowerCase().includes('crack')) {
      issues.push({
        type: 'display',
        confidence: 0.95,
        description: 'Visible screen crack detected',
      });
    }
    
    if (image.originalName.toLowerCase().includes('damage')) {
      issues.push({
        type: 'physical',
        confidence: 0.85,
        description: 'Physical damage visible',
      });
    }

    return issues;
  }

  /**
   * Utility methods
   */
  private getAgeMultiplier(deviceInfo: DeviceInfo): number {
    if (!deviceInfo.year) return 1;
    const age = new Date().getFullYear() - deviceInfo.year;
    return Math.max(0.7, 1 - (age * 0.1));
  }

  private getCategoryMultiplier(category: string): number {
    const multipliers = {
      laptop: 1.0,
      desktop: 0.8,
      tablet: 1.2,
      phone: 1.1,
      console: 0.9,
      other: 1.0,
    };
    return multipliers[category as keyof typeof multipliers] || 1.0;
  }

  private calculateBaseConfidence(category: string, textAnalysis: any, imageAnalysis: ImageAnalysisResult[]): number {
    let confidence = 0.6; // Base confidence
    
    // Increase confidence based on symptom specificity
    if (textAnalysis.extractedSymptoms.length > 3) confidence += 0.1;
    
    // Increase confidence if images support the diagnosis
    if (imageAnalysis.some(img => img.detectedIssues.some(issue => issue.type === category))) {
      confidence += 0.2;
    }
    
    return Math.min(0.95, confidence);
  }

  private assessSeverityFromText(symptoms: string): 'low' | 'medium' | 'high' | 'critical' {
    const criticalTerms = ['dead', 'broken', 'crashed', 'smoke', 'fire', 'burning'];
    const highTerms = ['freeze', 'shutdown', 'restart', 'blue screen', 'kernel panic'];
    const mediumTerms = ['slow', 'lag', 'flicker', 'dim', 'quiet'];
    
    const lowerSymptoms = symptoms.toLowerCase();
    
    if (criticalTerms.some(term => lowerSymptoms.includes(term))) return 'critical';
    if (highTerms.some(term => lowerSymptoms.includes(term))) return 'high';
    if (mediumTerms.some(term => lowerSymptoms.includes(term))) return 'medium';
    
    return 'low';
  }

  private assessUrgencyFromText(symptoms: string): 'low' | 'medium' | 'high' | 'emergency' {
    const emergencyTerms = ['smoke', 'fire', 'burning', 'explosion'];
    const highTerms = ['dead', 'won\'t turn on', 'completely broken'];
    const mediumTerms = ['freeze', 'crash', 'blue screen'];
    
    const lowerSymptoms = symptoms.toLowerCase();
    
    if (emergencyTerms.some(term => lowerSymptoms.includes(term))) return 'emergency';
    if (highTerms.some(term => lowerSymptoms.includes(term))) return 'high';
    if (mediumTerms.some(term => lowerSymptoms.includes(term))) return 'medium';
    
    return 'low';
  }

  private determineSeverity(category: string, textAnalysis: any, imageAnalysis: ImageAnalysisResult[]): 'low' | 'medium' | 'high' | 'critical' {
    // Combine text and image analysis to determine severity
    const textSeverity = textAnalysis.severity;
    const imageSeverity = imageAnalysis.length > 0 ? 'medium' : 'low';
    
    // Return the higher severity
    const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 };
    const maxSeverity = Math.max(
      severityLevels[textSeverity],
      severityLevels[imageSeverity as keyof typeof severityLevels]
    );
    
    return Object.entries(severityLevels).find(([_, level]) => level === maxSeverity)?.[0] as any || 'low';
  }

  private determineUrgency(category: string, textAnalysis: any): 'low' | 'medium' | 'high' | 'emergency' {
    return textAnalysis.urgency;
  }

  private checkWarrantyCoverage(category: string, deviceInfo: DeviceInfo): boolean {
    // Simple warranty check - in real implementation would check warranty database
    if (deviceInfo.warrantyStatus === 'active') return true;
    if (deviceInfo.year && new Date().getFullYear() - deviceInfo.year < 2) return true;
    return false;
  }

  private getCommonIssuesForDevice(deviceInfo: DeviceInfo) {
    // Mock common issues - would come from knowledge base
    return [`Common ${deviceInfo.brand} ${deviceInfo.model} issues`];
  }

  private analyzeHistoricalPatterns(history?: RepairHistory[]) {
    if (!history?.length) return { patterns: [], recommendations: [] };
    
    return {
      patterns: ['Pattern analysis based on repair history'],
      recommendations: ['Recommendations based on previous repairs'],
    };
  }

  private getDeviceSpecificGuidance(deviceInfo: DeviceInfo) {
    return `Specific guidance for ${deviceInfo.brand} ${deviceInfo.model}`;
  }

  private checkWarrantyImplications(deviceInfo: DeviceInfo) {
    return {
      status: deviceInfo.warrantyStatus || 'unknown',
      implications: 'Warranty considerations for this repair',
    };
  }

  private getDeviceSpecificPatterns(deviceInfo: DeviceInfo) {
    return {
      commonFailures: [`Common failures for ${deviceInfo.model}`],
      knownIssues: [`Known issues for ${deviceInfo.brand} devices`],
    };
  }

  private assessImageCondition(image: UploadedFile): 'excellent' | 'good' | 'fair' | 'poor' | 'critical' {
    // Mock assessment - would use computer vision
    return 'fair';
  }

  private generateImageRecommendations(image: UploadedFile): string[] {
    return ['Image-based recommendations'];
  }

  private createImageBasedDiagnosticResult(imageResult: ImageAnalysisResult, input: DiagnosticInput): DiagnosticResult {
    // Create a diagnostic result based primarily on image analysis
    return this.createDiagnosticResult('display', {}, [imageResult], {}, input);
  }

  private mergeSimilarResults(results: DiagnosticResult[]): DiagnosticResult[] {
    // Simple deduplication - in real implementation would use sophisticated merging
    const unique = new Map<string, DiagnosticResult>();
    
    results.forEach(result => {
      const key = `${result.category}_${result.issue}`;
      if (!unique.has(key) || unique.get(key)!.confidence < result.confidence) {
        unique.set(key, result);
      }
    });
    
    return Array.from(unique.values());
  }

  private adjustConfidenceWithML(result: DiagnosticResult, input: DiagnosticInput): number {
    // Apply ML-based confidence adjustments
    let adjustedConfidence = result.confidence;
    
    // Adjust based on device age
    if (input.deviceInfo.year && new Date().getFullYear() - input.deviceInfo.year > 5) {
      adjustedConfidence *= 0.9; // Older devices are harder to diagnose
    }
    
    // Adjust based on symptom clarity
    if (input.symptoms.length > 100) {
      adjustedConfidence *= 1.1; // More detailed descriptions increase confidence
    }
    
    return Math.min(0.95, Math.max(0.1, adjustedConfidence));
  }

  private getHighestSeverity(results: DiagnosticResult[]): string {
    const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 };
    const maxLevel = Math.max(...results.map(r => severityLevels[r.severity]));
    return Object.entries(severityLevels).find(([_, level]) => level === maxLevel)?.[0] || 'low';
  }

  private logAnalyticsEvent(event: string, data: any): void {
    // Log analytics events for monitoring and improvement
    console.log(`[AI Diagnostics] ${event}:`, data);
    
    // In real implementation, would send to analytics service
    // this.analyticsService.track(event, data);
  }

  /**
   * Get diagnostic session
   */
  getSession(sessionId: string): DiagnosticSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Submit customer feedback
   */
  async submitFeedback(
    sessionId: string,
    feedback: { accuracy: number; helpfulness: number; comments: string }
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.customerFeedback = feedback;
      
      this.logAnalyticsEvent('feedback_submitted', {
        sessionId,
        accuracy: feedback.accuracy,
        helpfulness: feedback.helpfulness,
      });
    }
  }
}

// Export singleton instance
export const aiDiagnosticsService = new AIDeviceDiagnosticsService();
export default aiDiagnosticsService;