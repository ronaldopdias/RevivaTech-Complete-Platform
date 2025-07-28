import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/services/emailService';

// POST /api/notifications/email/status-update
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['to', 'statusData'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.to)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Validate status data structure
    const { statusData } = body;
    if (!statusData.customerName || !statusData.bookingReference || !statusData.currentStatus) {
      return NextResponse.json(
        { error: 'Invalid status data structure' },
        { status: 400 }
      );
    }

    console.log(`📧 Sending status update email to: ${body.to} for booking: ${statusData.bookingReference} - Status: ${statusData.currentStatus}`);

    // Create subject based on status
    const statusSubjects = {
      'received': 'Device Received - Diagnostic Starting',
      'diagnosing': 'Diagnostic in Progress',
      'quote-ready': 'Repair Quote Ready for Your Approval',
      'approved': 'Repair Approved - Work Starting',
      'in-progress': 'Repair in Progress',
      'testing': 'Repair Complete - Quality Testing',
      'completed': 'Repair Completed - Ready for Collection',
      'collected': 'Device Collected - Thank You!',
      'on-hold': 'Repair On Hold - Action Required'
    };

    const subject = statusSubjects[statusData.currentStatus as keyof typeof statusSubjects] 
      || `Repair Status Update - ${statusData.bookingReference}`;

    // Queue email for sending
    const emailId = await emailService.queueEmail({
      to: body.to,
      subject: subject,
      template: 'repair-status-update',
      data: statusData
    });

    return NextResponse.json({
      success: true,
      emailId,
      message: 'Status update email queued for delivery',
      bookingReference: statusData.bookingReference,
      status: statusData.currentStatus
    });

  } catch (error) {
    console.error('Status update email API error:', error);
    return NextResponse.json(
      { error: 'Failed to queue status update email' },
      { status: 500 }
    );
  }
}

// Example of expected request body:
/*
{
  "to": "customer@example.com",
  "statusData": {
    "customerName": "John Smith",
    "bookingReference": "RT-2025-001234",
    "currentStatus": "in-progress",
    "statusMessage": "Our technician has started working on your MacBook Pro screen replacement.",
    "device": {
      "brand": "Apple",
      "model": "MacBook Pro 2023"
    },
    "technician": {
      "name": "Marcus Thompson",
      "specialization": "Apple Certified Technician"
    },
    "progress": {
      "percentage": 60,
      "estimatedCompletion": "2025-07-16T16:00:00Z"
    },
    "updates": [
      {
        "timestamp": "2025-07-15T09:00:00Z",
        "status": "received",
        "message": "Device received and initial assessment completed"
      },
      {
        "timestamp": "2025-07-15T10:30:00Z",
        "status": "diagnosing",
        "message": "Diagnostic testing in progress"
      },
      {
        "timestamp": "2025-07-15T14:00:00Z",
        "status": "in-progress",
        "message": "Screen replacement work has begun"
      }
    ],
    "nextSteps": [
      "Quality testing will be performed once repair is complete",
      "You will be notified when your device is ready for collection",
      "Collection is available Monday-Friday 9AM-6PM"
    ]
  }
}
*/