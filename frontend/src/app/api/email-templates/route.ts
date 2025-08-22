import { NextRequest, NextResponse } from 'next/server';

const BACKEND_BASE_URL = process.env.BACKEND_URL || 'http://revivatech_backend:3011';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const queryParams = url.searchParams.toString();
    const backendUrl = `${BACKEND_BASE_URL}/api/email-templates${queryParams ? `?${queryParams}` : ''}`;
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Email templates API proxy error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch email templates',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const backendUrl = `${BACKEND_BASE_URL}/api/email-templates`;
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Email templates API proxy error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create email template',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const url = new URL(request.url);
    const templateId = url.searchParams.get('id');
    
    if (!templateId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Template ID required',
          message: 'Template ID must be provided in query parameters'
        },
        { status: 400 }
      );
    }
    
    const backendUrl = `${BACKEND_BASE_URL}/api/email-templates/${templateId}`;
    
    const response = await fetch(backendUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Email templates API proxy error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update email template',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const templateId = url.searchParams.get('id');
    const softDelete = url.searchParams.get('soft_delete') || 'true';
    
    if (!templateId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Template ID required',
          message: 'Template ID must be provided in query parameters'
        },
        { status: 400 }
      );
    }
    
    const backendUrl = `${BACKEND_BASE_URL}/api/email-templates/${templateId}?soft_delete=${softDelete}`;
    
    const response = await fetch(backendUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Email templates API proxy error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete email template',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}