const express = require('express');
const router = express.Router();

// AI Documentation Service will be initialized on demand
let documentService;

// Middleware to ensure document service is initialized
router.use(async (req, res, next) => {
  try {
    if (!documentService) {
      const AIDocumentationService = require('../services/AIDocumentationService');
      documentService = new AIDocumentationService();
    }
    next();
  } catch (error) {
    req.logger?.error('AI Documentation service initialization failed:', error);
    res.status(500).json({ 
      error: 'AI Documentation service unavailable',
      message: 'Document service initialization failed'
    });
  }
});

// =========================
// AI DOCUMENT ROUTES
// =========================

// Get available document types
router.get('/types', async (req, res) => {
  try {
    const documentTypes = {
      diagnostic: {
        name: 'Diagnostic Reports',
        description: 'AI-generated device diagnostic reports',
        fields: ['device', 'issue', 'symptoms', 'tests_performed'],
        estimated_time: '5-10 seconds'
      },
      repair: {
        name: 'Repair Procedures',
        description: 'Step-by-step repair instructions',
        fields: ['device', 'repair_type', 'difficulty', 'tools_needed'],
        estimated_time: '10-15 seconds'
      },
      quality: {
        name: 'Quality Checklists',
        description: 'Quality control and testing checklists',
        fields: ['device', 'repair_completed', 'quality_standards'],
        estimated_time: '3-5 seconds'
      },
      customer: {
        name: 'Customer Summaries',
        description: 'Customer-friendly repair summaries',
        fields: ['customer', 'device', 'repair', 'outcome'],
        estimated_time: '5-8 seconds'
      },
      technical: {
        name: 'Technical Assessments',
        description: 'Detailed technical analysis reports',
        fields: ['device', 'technical_specs', 'analysis_type'],
        estimated_time: '15-20 seconds'
      },
      warranty: {
        name: 'Warranty Analysis',
        description: 'Warranty coverage and claim analysis',
        fields: ['device', 'purchase_date', 'warranty_type', 'claim_details'],
        estimated_time: '8-12 seconds'
      },
      cost: {
        name: 'Cost Breakdowns',
        description: 'Detailed repair cost analysis',
        fields: ['repair', 'parts', 'labor', 'additional_services'],
        estimated_time: '5-8 seconds'
      },
      parts: {
        name: 'Parts Recommendations',
        description: 'Recommended parts and alternatives',
        fields: ['device', 'required_parts', 'compatibility', 'sources'],
        estimated_time: '10-15 seconds'
      }
    };

    res.json({
      success: true,
      data: {
        document_types: documentTypes,
        total_types: Object.keys(documentTypes).length,
        ai_powered: true,
        average_generation_time: '8-12 seconds'
      },
      message: 'Document types retrieved successfully'
    });
  } catch (error) {
    req.logger?.error('Failed to get document types:', error);
    res.status(500).json({ 
      error: 'Failed to get document types',
      message: error.message 
    });
  }
});

// Generate AI document
router.post('/generate', async (req, res) => {
  try {
    const { type, data, options = {} } = req.body;
    
    if (!type || !data) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'Document type and data are required'
      });
    }

    const startTime = Date.now();
    
    // Generate document using AI Documentation Service
    let document;
    
    switch (type) {
      case 'diagnostic':
        document = await documentService.generateDiagnosticReport(data);
        break;
      case 'repair':
        document = await documentService.generateRepairProcedure(data);
        break;
      case 'quality':
        document = await documentService.generateQualityChecklist(data);
        break;
      case 'customer':
        document = await documentService.generateCustomerSummary(data);
        break;
      case 'technical':
        document = await documentService.generateTechnicalAssessment(data);
        break;
      case 'warranty':
        document = await documentService.generateWarrantyAnalysis(data);
        break;
      case 'cost':
        document = await documentService.generateCostBreakdown(data);
        break;
      case 'parts':
        document = await documentService.generatePartsRecommendation(data);
        break;
      default:
        return res.status(400).json({
          error: 'Unsupported document type',
          message: `Document type '${type}' is not supported`
        });
    }
    
    const generationTime = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        document,
        type,
        generation_time_ms: generationTime,
        generated_at: new Date().toISOString(),
        options
      },
      message: 'AI document generated successfully'
    });
  } catch (error) {
    req.logger?.error('Failed to generate AI document:', error);
    res.status(500).json({ 
      error: 'Failed to generate AI document',
      message: error.message 
    });
  }
});

// Preview document (shorter version)
router.post('/preview', async (req, res) => {
  try {
    const { type, data, options = {} } = req.body;
    
    if (!type || !data) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'Document type and data are required'
      });
    }

    // Generate preview using AI Documentation Service
    const preview = await documentService.previewDocument(type, data);

    res.json({
      success: true,
      data: {
        preview,
        type,
        preview_length: preview.length,
        full_generation_available: true
      },
      message: 'Document preview generated successfully'
    });
  } catch (error) {
    req.logger?.error('Failed to generate document preview:', error);
    res.status(500).json({ 
      error: 'Failed to generate document preview',
      message: error.message 
    });
  }
});

// Get document by ID (if stored)
router.get('/:documentId', async (req, res) => {
  try {
    const { documentId } = req.params;
    
    // In a real implementation, this would query a documents table
    // For now, return a mock response
    const document = {
      id: documentId,
      type: 'diagnostic',
      title: 'iPhone 12 Screen Diagnostic Report',
      content: 'Sample diagnostic content...',
      generated_at: '2025-07-25T10:30:00Z',
      status: 'completed'
    };

    res.json({
      success: true,
      data: document,
      message: 'Document retrieved successfully'
    });
  } catch (error) {
    req.logger?.error('Failed to retrieve document:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve document',
      message: error.message 
    });
  }
});

// Batch document generation
router.post('/batch', async (req, res) => {
  try {
    const { documents } = req.body;
    
    if (!Array.isArray(documents) || documents.length === 0) {
      return res.status(400).json({
        error: 'Invalid batch request',
        message: 'Documents array is required and must not be empty'
      });
    }

    if (documents.length > 10) {
      return res.status(400).json({
        error: 'Batch size limit exceeded',
        message: 'Maximum 10 documents per batch request'
      });
    }

    const startTime = Date.now();
    const results = [];

    for (const doc of documents) {
      try {
        const document = await documentService.generateDocument(doc.type, doc.data);
        results.push({
          success: true,
          type: doc.type,
          document,
          id: doc.id || `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        });
      } catch (error) {
        results.push({
          success: false,
          type: doc.type,
          error: error.message,
          id: doc.id || 'unknown'
        });
      }
    }

    const totalTime = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;

    res.json({
      success: true,
      data: {
        results,
        summary: {
          total: documents.length,
          successful: successCount,
          failed: documents.length - successCount,
          total_time_ms: totalTime,
          average_time_ms: Math.round(totalTime / documents.length)
        }
      },
      message: `Batch generation completed: ${successCount}/${documents.length} successful`
    });
  } catch (error) {
    req.logger?.error('Failed to process batch document generation:', error);
    res.status(500).json({ 
      error: 'Failed to process batch document generation',
      message: error.message 
    });
  }
});

module.exports = router;