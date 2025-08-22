import { NextRequest, NextResponse } from 'next/server';

const BACKEND_BASE_URL = process.env.BACKEND_URL || 'http://revivatech_backend:3011';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('id');
    
    if (!templateId) {
      return new NextResponse(
        '<html><body><div style="padding: 20px; font-family: Arial, sans-serif;"><h2>Error</h2><p>Template ID is required</p></div></body></html>',
        {
          status: 400,
          headers: { 'Content-Type': 'text/html' }
        }
      );
    }
    
    // Default sample variables for preview
    const sampleVariables = {
      customer_name: 'John Doe',
      device: 'iPhone 14 Pro',
      booking_id: 'B12345',
      repair_cost: '125.00',
      quote_total_price: '125.00',
      company_name: 'RevivaTech',
      technician_name: 'Mike Johnson',
      estimated_completion: '2-3 business days'
    };
    
    const backendUrl = `${BACKEND_BASE_URL}/api/email-templates/${templateId}/preview`;
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ variables: sampleVariables }),
    });

    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.success || !data.data || !data.data.preview) {
      throw new Error('Invalid preview data received from backend');
    }

    const { preview } = data.data;
    const htmlContent = preview.html || '<p>No HTML content available</p>';
    
    // Return HTML content suitable for iframe display
    const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Template Preview</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            background-color: #f5f5f5;
        }
        .preview-container {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            max-width: 600px;
            margin: 0 auto;
        }
        .preview-header {
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 15px;
            margin-bottom: 20px;
        }
        .preview-subject {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 8px;
        }
        .preview-meta {
            font-size: 12px;
            color: #6b7280;
        }
        .preview-content {
            min-height: 200px;
        }
    </style>
</head>
<body>
    <div class="preview-container">
        <div class="preview-header">
            <div class="preview-subject">Subject: ${preview.subject || 'No subject'}</div>
            <div class="preview-meta">Template: ${data.data.template_name || 'Unknown'}</div>
        </div>
        <div class="preview-content">
            ${htmlContent}
        </div>
    </div>
</body>
</html>`;
    
    return new NextResponse(fullHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch (error) {
    console.error('Email template preview GET error:', error);
    
    const errorHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview Error</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #fee2e2;
            color: #991b1b;
        }
        .error-container {
            background: white;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #ef4444;
            margin: 20px auto;
            max-width: 500px;
        }
        .error-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 10px;
        }
        .error-message {
            font-size: 14px;
            line-height: 1.5;
        }
    </style>
</head>
<body>
    <div class="error-container">
        <div class="error-title">Preview Error</div>
        <div class="error-message">
            Failed to load email template preview.<br>
            ${error instanceof Error ? error.message : 'Unknown error occurred'}
        </div>
    </div>
</body>
</html>`;
    
    return new NextResponse(errorHtml, {
      status: 500,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}