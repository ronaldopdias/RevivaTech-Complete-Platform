import { NextApiRequest, NextApiResponse } from 'next';
import { DiagnosticInput, DiagnosticResult } from '@/services/aiDiagnosticsService';

// Mock OpenAI/Claude integration for text analysis
interface AITextAnalysisResponse {
  extractedSymptoms: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  categories: string[];
  confidence: number;
  reasoning: string;
}

// Mock computer vision analysis
interface AIImageAnalysisResponse {
  detectedIssues: Array<{
    type: string;
    confidence: number;
    boundingBox?: { x: number; y: number; width: number; height: number };
    description: string;
  }>;
  overallCondition: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  recommendations: string[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const input: DiagnosticInput = req.body;

    // Validate input
    if (!input.symptoms || !input.deviceInfo) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: symptoms and deviceInfo'
      });
    }

    console.log(`AI Diagnostic request for ${input.deviceInfo.brand} ${input.deviceInfo.model}`);

    // Step 1: Analyze text symptoms
    const textAnalysis = await analyzeTextSymptoms(input.symptoms, input.deviceInfo);

    // Step 2: Analyze images if provided
    const imageAnalysis = input.images?.length 
      ? await analyzeImages(input.images, input.deviceInfo)
      : [];

    // Step 3: Generate comprehensive diagnostic results
    const diagnosticResults = await generateDiagnosticResults(
      textAnalysis,
      imageAnalysis,
      input
    );

    // Step 4: Apply confidence scoring and ranking
    const rankedResults = rankResultsByConfidence(diagnosticResults);

    // Log diagnostic for analytics
    console.log(`Generated ${rankedResults.length} diagnostic results with avg confidence: ${
      rankedResults.reduce((acc, r) => acc + r.confidence, 0) / rankedResults.length
    }`);

    res.status(200).json({
      success: true,
      results: rankedResults,
      metadata: {
        sessionId: `diag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        analysisTime: new Date().toISOString(),
        textAnalysis: {
          extractedSymptoms: textAnalysis.extractedSymptoms,
          categories: textAnalysis.categories,
          severity: textAnalysis.severity
        },
        imageAnalysis: imageAnalysis.map(img => ({
          detectedIssues: img.detectedIssues.length,
          condition: img.overallCondition
        }))
      }
    });

  } catch (error) {
    console.error('AI Diagnostic API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during diagnosis',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Analyze text symptoms using AI/NLP
 */
async function analyzeTextSymptoms(
  symptoms: string, 
  deviceInfo: any
): Promise<AITextAnalysisResponse> {
  // In production, this would call OpenAI, Claude, or another NLP service
  // For now, we'll use sophisticated pattern matching

  const lowerSymptoms = symptoms.toLowerCase();
  const words = lowerSymptoms.split(/\s+/);

  // Extract symptom keywords
  const symptomKeywords = extractRelevantKeywords(words);

  // Categorize symptoms
  const categories = categorizeSymptoms(symptomKeywords);

  // Assess severity based on keywords
  const severity = assessSeverity(lowerSymptoms);

  // Assess urgency
  const urgency = assessUrgency(lowerSymptoms);

  // Calculate confidence based on symptom clarity and specificity
  const confidence = calculateTextConfidence(symptoms, symptomKeywords, categories);

  // Generate reasoning
  const reasoning = generateReasoning(symptomKeywords, categories, severity);

  return {
    extractedSymptoms: symptomKeywords,
    severity,
    urgency,
    categories,
    confidence,
    reasoning
  };
}

/**
 * Extract relevant diagnostic keywords
 */
function extractRelevantKeywords(words: string[]): string[] {
  const relevantTerms = new Set([
    // Display issues
    'screen', 'display', 'monitor', 'flicker', 'flickering', 'dim', 'dark', 'bright', 
    'black', 'blue', 'white', 'crack', 'cracked', 'broken', 'shatter', 'dead', 'pixels',
    
    // Power issues
    'battery', 'power', 'charging', 'charge', 'charger', 'drain', 'draining',
    'shutdown', 'dead', 'turn', 'start', 'boot', 'won\'t',
    
    // Performance issues
    'slow', 'slowly', 'lag', 'lagging', 'freeze', 'freezing', 'frozen', 'hang', 'hanging',
    'crash', 'crashing', 'stuck', 'unresponsive', 'performance',
    
    // Thermal issues
    'hot', 'heat', 'heating', 'overheat', 'overheating', 'fan', 'noise', 'loud',
    'temperature', 'warm', 'burning', 'smell',
    
    // Input issues
    'keyboard', 'key', 'keys', 'mouse', 'trackpad', 'touchpad', 'click', 'clicking',
    'touch', 'button', 'buttons', 'stuck', 'sticky',
    
    // Audio issues
    'sound', 'audio', 'speaker', 'speakers', 'microphone', 'mic', 'volume',
    'quiet', 'loud', 'distorted', 'crackling', 'static',
    
    // Connectivity issues
    'wifi', 'wireless', 'internet', 'network', 'bluetooth', 'connection', 'connect',
    'disconnect', 'usb', 'port', 'ethernet',
    
    // Software issues
    'error', 'message', 'popup', 'virus', 'malware', 'update', 'install', 'program',
    'application', 'software', 'driver', 'windows', 'mac', 'linux'
  ]);

  return words.filter(word => 
    relevantTerms.has(word) || 
    Array.from(relevantTerms).some(term => word.includes(term) || term.includes(word))
  );
}

/**
 * Categorize symptoms into diagnostic categories
 */
function categorizeSymptoms(keywords: string[]): string[] {
  const categories = new Set<string>();

  const categoryMap = {
    display: [
      'screen', 'display', 'monitor', 'flicker', 'dim', 'bright', 'black', 'blue', 'white',
      'crack', 'broken', 'dead', 'pixels', 'shatter'
    ],
    power: [
      'battery', 'power', 'charging', 'charge', 'charger', 'drain', 'shutdown',
      'dead', 'turn', 'start', 'boot'
    ],
    performance: [
      'slow', 'lag', 'freeze', 'hang', 'crash', 'stuck', 'unresponsive', 'performance'
    ],
    thermal: [
      'hot', 'heat', 'overheat', 'fan', 'noise', 'loud', 'temperature', 'warm',
      'burning', 'smell'
    ],
    input: [
      'keyboard', 'key', 'mouse', 'trackpad', 'touchpad', 'click', 'touch',
      'button', 'stuck', 'sticky'
    ],
    connectivity: [
      'wifi', 'wireless', 'internet', 'network', 'bluetooth', 'connection',
      'connect', 'disconnect', 'usb', 'port', 'ethernet'
    ],
    audio: [
      'sound', 'audio', 'speaker', 'microphone', 'mic', 'volume', 'quiet',
      'loud', 'distorted', 'crackling', 'static'
    ],
    software: [
      'error', 'message', 'popup', 'virus', 'malware', 'update', 'install',
      'program', 'application', 'software', 'driver'
    ],
    storage: [
      'disk', 'drive', 'storage', 'memory', 'space', 'full', 'save', 'file'
    ]
  };

  for (const [category, terms] of Object.entries(categoryMap)) {
    if (terms.some(term => keywords.some(keyword => 
      keyword.includes(term) || term.includes(keyword)
    ))) {
      categories.add(category);
    }
  }

  // If no categories matched, default to general hardware
  if (categories.size === 0) {
    categories.add('hardware');
  }

  return Array.from(categories);
}

/**
 * Assess severity from symptom text
 */
function assessSeverity(symptoms: string): 'low' | 'medium' | 'high' | 'critical' {
  const criticalTerms = [
    'dead', 'completely broken', 'won\'t turn on', 'smoke', 'fire', 'burning',
    'explosion', 'completely dead', 'totally broken'
  ];

  const highTerms = [
    'freeze', 'freezing', 'shutdown', 'restart', 'blue screen', 'kernel panic',
    'crash', 'crashing', 'overheat', 'overheating', 'very hot'
  ];

  const mediumTerms = [
    'slow', 'lag', 'flicker', 'dim', 'quiet', 'stuck', 'hang', 'noise',
    'drain', 'draining', 'warm'
  ];

  if (criticalTerms.some(term => symptoms.includes(term))) return 'critical';
  if (highTerms.some(term => symptoms.includes(term))) return 'high';
  if (mediumTerms.some(term => symptoms.includes(term))) return 'medium';

  return 'low';
}

/**
 * Assess urgency from symptom text
 */
function assessUrgency(symptoms: string): 'low' | 'medium' | 'high' | 'emergency' {
  const emergencyTerms = ['smoke', 'fire', 'burning', 'explosion', 'sparks'];
  const highTerms = ['dead', 'won\'t turn on', 'completely broken', 'overheat'];
  const mediumTerms = ['freeze', 'crash', 'blue screen', 'shutdown'];

  if (emergencyTerms.some(term => symptoms.includes(term))) return 'emergency';
  if (highTerms.some(term => symptoms.includes(term))) return 'high';
  if (mediumTerms.some(term => symptoms.includes(term))) return 'medium';

  return 'low';
}

/**
 * Calculate confidence based on text analysis
 */
function calculateTextConfidence(
  symptoms: string,
  keywords: string[],
  categories: string[]
): number {
  let confidence = 0.5; // Base confidence

  // More detailed description increases confidence
  if (symptoms.length > 50) confidence += 0.1;
  if (symptoms.length > 100) confidence += 0.1;

  // More specific keywords increase confidence
  if (keywords.length > 3) confidence += 0.1;
  if (keywords.length > 6) confidence += 0.1;

  // Multiple categories suggest complex issue but good description
  if (categories.length > 1) confidence += 0.05;

  // Specific technical terms increase confidence
  const technicalTerms = ['driver', 'bios', 'firmware', 'kernel', 'registry'];
  if (technicalTerms.some(term => symptoms.toLowerCase().includes(term))) {
    confidence += 0.15;
  }

  return Math.min(0.95, confidence);
}

/**
 * Generate reasoning for the analysis
 */
function generateReasoning(
  keywords: string[],
  categories: string[],
  severity: string
): string {
  const reasons = [];

  if (keywords.length > 5) {
    reasons.push('Detailed symptom description provided');
  }

  if (categories.length > 1) {
    reasons.push(`Multiple system areas affected: ${categories.join(', ')}`);
  }

  if (severity === 'critical' || severity === 'high') {
    reasons.push('Severity indicators suggest urgent attention required');
  }

  if (keywords.some(k => ['screen', 'display', 'flicker'].includes(k))) {
    reasons.push('Display-related symptoms clearly described');
  }

  if (keywords.some(k => ['battery', 'power', 'charging'].includes(k))) {
    reasons.push('Power system issues identified');
  }

  return reasons.length > 0 
    ? reasons.join('. ') + '.'
    : 'Analysis based on symptom pattern matching.';
}

/**
 * Mock image analysis (would use computer vision in production)
 */
async function analyzeImages(
  images: any[],
  deviceInfo: any
): Promise<AIImageAnalysisResponse[]> {
  const results: AIImageAnalysisResponse[] = [];

  for (const image of images) {
    // Mock analysis based on filename and metadata
    const issues = [];
    const filename = image.originalName.toLowerCase();

    if (filename.includes('crack') || filename.includes('broken')) {
      issues.push({
        type: 'display',
        confidence: 0.95,
        description: 'Visible screen crack or physical damage detected',
        boundingBox: { x: 100, y: 150, width: 200, height: 100 }
      });
    }

    if (filename.includes('damage') || filename.includes('dent')) {
      issues.push({
        type: 'physical',
        confidence: 0.88,
        description: 'Physical damage to device casing visible'
      });
    }

    if (filename.includes('water') || filename.includes('liquid')) {
      issues.push({
        type: 'liquid',
        confidence: 0.82,
        description: 'Potential liquid damage indicators present'
      });
    }

    // Assess overall condition
    let condition: 'excellent' | 'good' | 'fair' | 'poor' | 'critical' = 'good';
    if (issues.length > 2) condition = 'critical';
    else if (issues.length > 1) condition = 'poor';
    else if (issues.length > 0) condition = 'fair';

    results.push({
      detectedIssues: issues,
      overallCondition: condition,
      recommendations: generateImageRecommendations(issues)
    });
  }

  return results;
}

/**
 * Generate recommendations based on detected issues
 */
function generateImageRecommendations(issues: any[]): string[] {
  const recommendations = [];

  if (issues.some(i => i.type === 'display')) {
    recommendations.push('Display replacement may be required');
    recommendations.push('Avoid applying pressure to screen area');
  }

  if (issues.some(i => i.type === 'physical')) {
    recommendations.push('Protective case recommended for future use');
    recommendations.push('Structural integrity assessment needed');
  }

  if (issues.some(i => i.type === 'liquid')) {
    recommendations.push('Immediate professional cleaning required');
    recommendations.push('Component corrosion assessment needed');
  }

  if (recommendations.length === 0) {
    recommendations.push('Regular maintenance and cleaning recommended');
  }

  return recommendations;
}

/**
 * Generate comprehensive diagnostic results
 */
async function generateDiagnosticResults(
  textAnalysis: AITextAnalysisResponse,
  imageAnalysis: AIImageAnalysisResponse[],
  input: DiagnosticInput
): Promise<DiagnosticResult[]> {
  const results: DiagnosticResult[] = [];

  // Generate results for each identified category
  for (const category of textAnalysis.categories) {
    const result = createDiagnosticResult(
      category,
      textAnalysis,
      imageAnalysis,
      input
    );
    results.push(result);
  }

  // Add image-specific results
  for (const imgAnalysis of imageAnalysis) {
    for (const issue of imgAnalysis.detectedIssues) {
      const imageResult = createImageBasedResult(issue, imgAnalysis, input);
      results.push(imageResult);
    }
  }

  return deduplicateResults(results);
}

/**
 * Create diagnostic result for a specific category
 */
function createDiagnosticResult(
  category: string,
  textAnalysis: AITextAnalysisResponse,
  imageAnalysis: AIImageAnalysisResponse[],
  input: DiagnosticInput
): DiagnosticResult {
  const templates = getDiagnosticTemplates();
  const template = templates[category] || templates.hardware;

  // Calculate costs based on device info
  const costs = calculateRepairCosts(category, input.deviceInfo);

  // Combine text and image confidence
  const baseConfidence = textAnalysis.confidence;
  const imageBoost = imageAnalysis.some(img => 
    img.detectedIssues.some(issue => issue.type === category)
  ) ? 0.15 : 0;

  return {
    id: `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    confidence: Math.min(0.95, baseConfidence + imageBoost),
    category: template.categoryName,
    issue: template.issueName,
    severity: textAnalysis.severity,
    description: template.description,
    technicalDetails: template.technicalDetails,
    possibleCauses: template.causes.map(cause => ({
      cause: cause.name,
      probability: cause.probability,
      impact: cause.impact
    })),
    recommendedActions: template.actions.map((action, index) => ({
      action: action.name,
      priority: index + 1,
      cost: action.cost,
      timeEstimate: action.timeEstimate,
      skillLevel: action.skillLevel
    })),
    estimatedCost: costs,
    urgency: textAnalysis.urgency,
    repairTime: template.repairTime,
    warranty: checkWarranty(category, input.deviceInfo),
    preventiveMeasures: template.preventiveMeasures,
    followUpActions: template.followUpActions,
    riskFactors: template.riskFactors,
    imageAnalysis: imageAnalysis.filter(img => 
      img.detectedIssues.some(issue => issue.type === category)
    )
  };
}

/**
 * Get diagnostic templates for different categories
 */
function getDiagnosticTemplates() {
  return {
    display: {
      categoryName: 'Display System',
      issueName: 'Display Malfunction',
      description: 'Issues detected with the display system including potential LCD, connection, or graphics problems.',
      technicalDetails: 'Display subsystem analysis indicates hardware or driver-related failure patterns.',
      causes: [
        { name: 'LCD panel failure', probability: 0.3, impact: 'Complete display replacement required' },
        { name: 'Display cable loose/damaged', probability: 0.4, impact: 'Cable reseating or replacement' },
        { name: 'Graphics driver corruption', probability: 0.2, impact: 'Driver update/reinstallation' },
        { name: 'Graphics hardware failure', probability: 0.1, impact: 'Motherboard repair/replacement' }
      ],
      actions: [
        { 
          name: 'Display connection inspection and reseating', 
          timeEstimate: '30-45 minutes',
          skillLevel: 'professional' as const,
          cost: { min: 40, max: 80, currency: 'GBP' }
        },
        { 
          name: 'LCD panel functionality testing', 
          timeEstimate: '1-2 hours',
          skillLevel: 'professional' as const,
          cost: { min: 60, max: 120, currency: 'GBP' }
        },
        { 
          name: 'Graphics driver verification and update', 
          timeEstimate: '20-30 minutes',
          skillLevel: 'intermediate' as const,
          cost: { min: 20, max: 40, currency: 'GBP' }
        }
      ],
      repairTime: '2-4 hours',
      preventiveMeasures: [
        'Avoid pressure on screen when closing laptop',
        'Use proper carrying case for protection',
        'Keep drivers updated regularly'
      ],
      followUpActions: [
        'Display calibration after repair',
        'Extended stress testing',
        'Color accuracy verification'
      ],
      riskFactors: [
        'Further damage if continued use with flickering',
        'Complete display failure possible',
        'Potential eye strain from flickering'
      ]
    },
    power: {
      categoryName: 'Power Management',
      issueName: 'Power System Failure',
      description: 'Critical power system components showing signs of failure or degradation affecting device operation.',
      technicalDetails: 'Power delivery subsystem analysis indicates battery, charging, or power regulation issues.',
      causes: [
        { name: 'Battery cell degradation/failure', probability: 0.5, impact: 'Battery replacement required' },
        { name: 'Charging circuit malfunction', probability: 0.3, impact: 'Charging board repair/replacement' },
        { name: 'Power adapter failure', probability: 0.15, impact: 'External adapter replacement' },
        { name: 'Motherboard power regulation failure', probability: 0.05, impact: 'Motherboard repair required' }
      ],
      actions: [
        { 
          name: 'Battery health assessment and testing', 
          timeEstimate: '45-60 minutes',
          skillLevel: 'professional' as const,
          cost: { min: 60, max: 100, currency: 'GBP' }
        },
        { 
          name: 'Charging system diagnostics', 
          timeEstimate: '1-1.5 hours',
          skillLevel: 'professional' as const,
          cost: { min: 80, max: 120, currency: 'GBP' }
        },
        { 
          name: 'Power adapter testing and verification', 
          timeEstimate: '15-20 minutes',
          skillLevel: 'basic' as const,
          cost: { min: 10, max: 20, currency: 'GBP' }
        }
      ],
      repairTime: '1-3 business days',
      preventiveMeasures: [
        'Avoid deep discharge cycles (below 20%)',
        'Use original manufacturer charger',
        'Maintain proper ventilation during charging'
      ],
      followUpActions: [
        'Battery calibration procedure',
        'Power management settings optimization',
        'Charging cycle monitoring'
      ],
      riskFactors: [
        'Complete power loss and data inaccessibility',
        'Potential data corruption during unexpected shutdowns',
        'Fire hazard if battery swells or overheats'
      ]
    },
    performance: {
      categoryName: 'System Performance',
      issueName: 'Performance Degradation',
      description: 'System-wide performance issues affecting normal operation and user experience.',
      technicalDetails: 'Performance analysis indicates resource bottlenecks, thermal issues, or software conflicts.',
      causes: [
        { name: 'Insufficient storage space', probability: 0.3, impact: 'Storage cleanup or upgrade needed' },
        { name: 'Background process overload', probability: 0.25, impact: 'Process optimization required' },
        { name: 'Thermal throttling', probability: 0.3, impact: 'Cooling system cleaning/repair' },
        { name: 'Failing storage drive', probability: 0.15, impact: 'Drive replacement necessary' }
      ],
      actions: [
        { 
          name: 'System optimization and cleanup', 
          timeEstimate: '1-2 hours',
          skillLevel: 'intermediate' as const,
          cost: { min: 60, max: 100, currency: 'GBP' }
        },
        { 
          name: 'Thermal system cleaning and maintenance', 
          timeEstimate: '2-3 hours',
          skillLevel: 'professional' as const,
          cost: { min: 80, max: 150, currency: 'GBP' }
        },
        { 
          name: 'Storage drive health assessment', 
          timeEstimate: '30-45 minutes',
          skillLevel: 'professional' as const,
          cost: { min: 40, max: 80, currency: 'GBP' }
        }
      ],
      repairTime: 'Same day - 2 business days',
      preventiveMeasures: [
        'Regular disk cleanup and defragmentation',
        'Keep 15-20% of storage space free',
        'Monitor and close unnecessary background processes',
        'Ensure proper ventilation around device'
      ],
      followUpActions: [
        'Performance monitoring for 1 week',
        'System optimization recommendations',
        'Preventive maintenance schedule'
      ],
      riskFactors: [
        'Potential data loss if drive failure occurs',
        'System instability and crashes',
        'Hardware damage from overheating'
      ]
    },
    hardware: {
      categoryName: 'General Hardware',
      issueName: 'Hardware Diagnostic Required',
      description: 'General hardware issues requiring professional diagnostic assessment for accurate identification.',
      technicalDetails: 'Symptoms suggest hardware-related problems requiring systematic component testing.',
      causes: [
        { name: 'Multiple potential component issues', probability: 0.4, impact: 'Comprehensive testing required' },
        { name: 'Intermittent component failure', probability: 0.3, impact: 'Extended monitoring needed' },
        { name: 'Component compatibility issues', probability: 0.2, impact: 'Configuration adjustment required' },
        { name: 'Manufacturing defect', probability: 0.1, impact: 'Warranty replacement possible' }
      ],
      actions: [
        { 
          name: 'Comprehensive hardware diagnostic', 
          timeEstimate: '2-4 hours',
          skillLevel: 'professional' as const,
          cost: { min: 80, max: 150, currency: 'GBP' }
        },
        { 
          name: 'Component isolation testing', 
          timeEstimate: '1-2 hours',
          skillLevel: 'professional' as const,
          cost: { min: 60, max: 120, currency: 'GBP' }
        },
        { 
          name: 'System stress testing', 
          timeEstimate: '3-6 hours',
          skillLevel: 'professional' as const,
          cost: { min: 100, max: 200, currency: 'GBP' }
        }
      ],
      repairTime: '1-2 business days',
      preventiveMeasures: [
        'Regular system maintenance',
        'Avoid physical shocks and drops',
        'Maintain clean environment',
        'Use surge protection'
      ],
      followUpActions: [
        'Detailed diagnostic report',
        'Repair recommendations with cost estimates',
        'Preventive maintenance plan'
      ],
      riskFactors: [
        'Potential for additional component failure',
        'Intermittent issues may worsen over time',
        'Possible data accessibility issues'
      ]
    }
  };
}

/**
 * Calculate repair costs based on category and device
 */
function calculateRepairCosts(category: string, deviceInfo: any) {
  const baseCosts = {
    display: { parts: [100, 300], labor: [80, 150] },
    power: { parts: [80, 250], labor: [60, 120] },
    performance: { parts: [0, 200], labor: [60, 150] },
    thermal: { parts: [20, 100], labor: [60, 120] },
    input: { parts: [40, 180], labor: [40, 100] },
    connectivity: { parts: [30, 120], labor: [60, 120] },
    audio: { parts: [50, 150], labor: [40, 100] },
    software: { parts: [0, 80], labor: [40, 120] },
    storage: { parts: [100, 500], labor: [60, 150] },
    hardware: { parts: [50, 300], labor: [80, 200] }
  };

  const costs = baseCosts[category as keyof typeof baseCosts] || baseCosts.hardware;
  
  // Adjust for device category
  const multipliers = {
    laptop: 1.0,
    desktop: 0.8,
    tablet: 1.2,
    phone: 1.1,
    console: 0.9
  };
  
  const multiplier = multipliers[deviceInfo.category as keyof typeof multipliers] || 1.0;
  
  const adjustedParts = [
    Math.round(costs.parts[0] * multiplier),
    Math.round(costs.parts[1] * multiplier)
  ];
  
  const adjustedLabor = [
    Math.round(costs.labor[0] * multiplier),
    Math.round(costs.labor[1] * multiplier)
  ];

  return {
    parts: { min: adjustedParts[0], max: adjustedParts[1], currency: 'GBP' },
    labor: { min: adjustedLabor[0], max: adjustedLabor[1], currency: 'GBP' },
    total: {
      min: adjustedParts[0] + adjustedLabor[0],
      max: adjustedParts[1] + adjustedLabor[1],
      currency: 'GBP'
    }
  };
}

/**
 * Create diagnostic result based on image analysis
 */
function createImageBasedResult(
  issue: any,
  imageAnalysis: AIImageAnalysisResponse,
  input: DiagnosticInput
): DiagnosticResult {
  return {
    id: `img_result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    confidence: issue.confidence,
    category: 'Visual Damage Assessment',
    issue: `Image-detected: ${issue.description}`,
    severity: imageAnalysis.overallCondition === 'critical' ? 'critical' :
              imageAnalysis.overallCondition === 'poor' ? 'high' :
              imageAnalysis.overallCondition === 'fair' ? 'medium' : 'low',
    description: `Visual analysis detected: ${issue.description}`,
    technicalDetails: `Computer vision analysis identified ${issue.type} issues with ${Math.round(issue.confidence * 100)}% confidence.`,
    possibleCauses: [
      { cause: 'Physical impact damage', probability: 0.6, impact: 'Component replacement likely required' },
      { cause: 'Manufacturing defect', probability: 0.2, impact: 'Warranty claim possible' },
      { cause: 'Wear and tear', probability: 0.2, impact: 'Normal replacement needed' }
    ],
    recommendedActions: imageAnalysis.recommendations.map((rec, index) => ({
      action: rec,
      priority: index + 1,
      timeEstimate: '1-2 hours',
      skillLevel: 'professional' as const
    })),
    estimatedCost: calculateRepairCosts(issue.type, input.deviceInfo),
    urgency: imageAnalysis.overallCondition === 'critical' ? 'high' : 'medium',
    repairTime: '1-3 business days',
    warranty: checkWarranty(issue.type, input.deviceInfo),
    preventiveMeasures: [
      'Use protective case',
      'Avoid drops and impacts',
      'Regular visual inspection'
    ],
    followUpActions: [
      'Component functionality testing',
      'Structural integrity assessment'
    ],
    riskFactors: [
      'Progressive damage possible',
      'Additional components may be affected'
    ]
  };
}

/**
 * Check warranty coverage
 */
function checkWarranty(category: string, deviceInfo: any): boolean {
  if (deviceInfo.warrantyStatus === 'active') return true;
  
  // Simple age-based warranty check
  if (deviceInfo.year) {
    const age = new Date().getFullYear() - deviceInfo.year;
    return age <= 1; // 1 year assumed warranty
  }
  
  return false;
}

/**
 * Remove duplicate results
 */
function deduplicateResults(results: DiagnosticResult[]): DiagnosticResult[] {
  const seen = new Set<string>();
  return results.filter(result => {
    const key = `${result.category}_${result.issue}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Rank results by confidence and severity
 */
function rankResultsByConfidence(results: DiagnosticResult[]): DiagnosticResult[] {
  return results.sort((a, b) => {
    // First sort by confidence (higher first)
    if (a.confidence !== b.confidence) {
      return b.confidence - a.confidence;
    }
    
    // Then by severity (critical first)
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    const aSeverity = severityOrder[a.severity];
    const bSeverity = severityOrder[b.severity];
    
    return bSeverity - aSeverity;
  });
}