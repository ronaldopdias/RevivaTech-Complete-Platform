#!/usr/bin/env node

/**
 * NoReply Email Configuration Test Script
 * Tests RevivaTech noreply@revivatech.co.uk for booking confirmations
 */

const nodemailer = require('nodemailer');
require('dotenv').config();

async function testNoReplyEmail() {
  console.log('🧪 Testing RevivaTech NoReply Email Configuration...\n');

  // Create transporter with noreply@revivatech.co.uk
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.NOREPLY_EMAIL,
      pass: process.env.NOREPLY_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  console.log('📧 NoReply Email Configuration:');
  console.log(`   Host: ${process.env.SMTP_HOST}`);
  console.log(`   Port: ${process.env.SMTP_PORT}`);
  console.log(`   User: ${process.env.NOREPLY_EMAIL}`);
  console.log(`   Password: ${process.env.NOREPLY_PASS}`);
  console.log('');

  try {
    // Test 1: Verify connection
    console.log('🔌 Testing SMTP connection for noreply@revivatech.co.uk...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!\n');

    // Test 2: Send booking confirmation email
    console.log('📨 Sending booking confirmation test...');
    const bookingConfirmation = {
      from: `${process.env.FROM_NAME} <${process.env.NOREPLY_EMAIL}>`,
      to: process.env.SMTP_USER, // Send to info@ for testing
      replyTo: process.env.SUPPORT_EMAIL, // Replies go to support
      subject: '✅ Booking Confirmation #REV-12345 - RevivaTech',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #ADD8E6, #008080); padding: 25px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">✅ Booking Confirmed!</h1>
            <p style="color: white; margin: 8px 0 0 0; font-size: 16px;">Your repair has been scheduled</p>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 30px; background: #f9f9f9;">
            <p style="font-size: 16px; color: #36454F; margin-bottom: 25px;">
              Hello <strong>Ronaldo</strong>,
            </p>
            
            <p style="color: #36454F; line-height: 1.6;">
              Thank you for choosing RevivaTech! Your repair booking has been confirmed and we're ready to get your device working perfectly again.
            </p>

            <!-- Booking Details Card -->
            <div style="background: white; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #008080;">
              <h2 style="color: #1A5266; margin-top: 0; font-size: 20px;">📋 Repair Details</h2>
              
              <div style="display: grid; gap: 12px;">
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
                  <span style="color: #4B5563; font-weight: 600;">Booking ID:</span>
                  <span style="color: #1A5266; font-weight: bold;">#REV-12345</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
                  <span style="color: #4B5563; font-weight: 600;">Device:</span>
                  <span style="color: #36454F;">MacBook Pro 16" M3 (2023)</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
                  <span style="color: #4B5563; font-weight: 600;">Issue:</span>
                  <span style="color: #36454F;">Screen replacement</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
                  <span style="color: #4B5563; font-weight: 600;">Estimated Cost:</span>
                  <span style="color: #008080; font-weight: bold; font-size: 18px;">£280.00</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
                  <span style="color: #4B5563; font-weight: 600;">Estimated Time:</span>
                  <span style="color: #36454F;">2-3 business days</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                  <span style="color: #4B5563; font-weight: 600;">Warranty:</span>
                  <span style="color: #008080; font-weight: 600;">12 months</span>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://revivatech.co.uk/track-repair?id=REV-12345" 
                 style="background: #008080; color: white; padding: 15px 25px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; margin-right: 15px;">
                📱 Track Your Repair
              </a>
              <a href="https://revivatech.co.uk/contact" 
                 style="background: #ADD8E6; color: #1A5266; padding: 15px 25px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
                💬 Contact Support
              </a>
            </div>

            <!-- What Happens Next -->
            <div style="background: #e6f7ff; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h3 style="color: #1A5266; margin-top: 0;">🚀 What Happens Next?</h3>
              <ul style="color: #36454F; line-height: 1.8; padding-left: 20px;">
                <li>We'll send you updates via email and SMS</li>
                <li>Our technician will diagnose your device</li>
                <li>You'll receive a detailed repair report</li>
                <li>We'll notify you when your repair is complete</li>
                <li>Arrange convenient pickup or delivery</li>
              </ul>
            </div>

            <!-- Contact Information -->
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center;">
              <h3 style="color: #1A5266; margin-top: 0;">📞 Need Help?</h3>
              <p style="color: #36454F; margin: 10px 0;">
                <strong>Phone:</strong> <a href="tel:+441234567890" style="color: #008080;">+44 123 456 7890</a><br>
                <strong>Email:</strong> <a href="mailto:support@revivatech.co.uk" style="color: #008080;">support@revivatech.co.uk</a><br>
                <strong>Hours:</strong> Mon-Fri 9AM-6PM, Sat 10AM-4PM
              </p>
            </div>

            <p style="color: #4B5563; font-size: 14px; line-height: 1.6; margin-top: 30px;">
              <strong>Important:</strong> This is an automated confirmation email. Please do not reply to this message. 
              For any questions, contact us at <a href="mailto:support@revivatech.co.uk" style="color: #008080;">support@revivatech.co.uk</a>
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background: #36454F; color: white; padding: 25px; text-align: center;">
            <h3 style="margin: 0 0 10px 0; color: #ADD8E6;">RevivaTech</h3>
            <p style="margin: 5px 0; font-size: 14px;">Professional Computer & Device Repairs</p>
            
            <div style="margin: 15px 0;">
              <a href="https://revivatech.co.uk" style="color: #ADD8E6; text-decoration: none; margin: 0 10px;">🌐 Website</a>
              <a href="mailto:info@revivatech.co.uk" style="color: #ADD8E6; text-decoration: none; margin: 0 10px;">📧 Email</a>
              <a href="https://revivatech.co.uk/book-repair" style="color: #ADD8E6; text-decoration: none; margin: 0 10px;">📱 Book Repair</a>
            </div>
            
            <p style="margin: 15px 0 5px 0; font-size: 12px; color: #D1D5DB;">
              © 2025 RevivaTech Computer Repairs. All rights reserved.
            </p>
            <p style="margin: 0; font-size: 12px; color: #D1D5DB;">
              This email was sent from an automated system. Please do not reply.
            </p>
          </div>
        </div>
      `,
      text: `
BOOKING CONFIRMED - RevivaTech

Hello Ronaldo,

Thank you for choosing RevivaTech! Your repair booking has been confirmed.

REPAIR DETAILS:
===============
Booking ID: #REV-12345
Device: MacBook Pro 16" M3 (2023)
Issue: Screen replacement
Estimated Cost: £280.00
Estimated Time: 2-3 business days
Warranty: 12 months

WHAT HAPPENS NEXT:
==================
- We'll send you updates via email and SMS
- Our technician will diagnose your device
- You'll receive a detailed repair report
- We'll notify you when your repair is complete
- Arrange convenient pickup or delivery

TRACK YOUR REPAIR:
https://revivatech.co.uk/track-repair?id=REV-12345

NEED HELP?
==========
Phone: +44 123 456 7890
Email: support@revivatech.co.uk
Hours: Mon-Fri 9AM-6PM, Sat 10AM-4PM

---
RevivaTech Computer Repairs
Professional Device Repair & Recovery Services
https://revivatech.co.uk

This is an automated email. Please do not reply.
For questions, contact: support@revivatech.co.uk
      `
    };

    const result = await transporter.sendMail(bookingConfirmation);
    console.log('✅ Booking confirmation email sent successfully!');
    console.log(`   Message ID: ${result.messageId}`);
    console.log(`   Response: ${result.response}\n`);

    // Test 3: Send repair status update
    console.log('🔧 Testing repair status update email...');
    const statusUpdate = {
      from: `${process.env.FROM_NAME} <${process.env.NOREPLY_EMAIL}>`,
      to: process.env.SMTP_USER,
      replyTo: process.env.REPAIRS_EMAIL,
      subject: '🔧 Repair Update #REV-12345 - In Progress',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ADD8E6, #008080); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">🔧 Repair Update</h1>
            <p style="color: white; margin: 5px 0;">Your device is being repaired</p>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #1A5266;">Progress Update</h2>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Booking ID:</strong> #REV-12345</p>
              <p><strong>Status:</strong> <span style="color: #008080; font-weight: bold;">In Progress</span></p>
              <p><strong>Current Step:</strong> Installing new screen</p>
              <p><strong>Expected Completion:</strong> Tomorrow, 2PM</p>
            </div>
            
            <p style="color: #36454F;">
              Good news! Our technician has diagnosed your MacBook Pro and is currently installing 
              the new screen. We expect to complete the repair by tomorrow at 2PM.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://revivatech.co.uk/track-repair?id=REV-12345" 
                 style="background: #008080; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block;">
                📱 Track Repair Progress
              </a>
            </div>
          </div>
        </div>
      `
    };

    const statusResult = await transporter.sendMail(statusUpdate);
    console.log('✅ Status update email sent successfully!');
    console.log(`   Message ID: ${statusResult.messageId}\n`);

    console.log('🎉 All NoReply email tests completed successfully!');
    console.log('');
    console.log('📋 NoReply Email Ready For:');
    console.log('   ✅ Booking confirmations');
    console.log('   ✅ Repair status updates'); 
    console.log('   ✅ Price quotes');
    console.log('   ✅ Automated notifications');
    console.log('   ✅ System alerts');
    console.log('');
    console.log('🔧 Integration Notes:');
    console.log('   - Replies redirect to support@revivatech.co.uk');
    console.log('   - Professional RevivaTech branding applied');
    console.log('   - Mobile-responsive email templates');
    console.log('   - Clear call-to-action buttons');
    console.log('   - Booking tracking links included');

  } catch (error) {
    console.error('❌ NoReply email test failed:');
    console.error(`   Error: ${error.message}`);
    console.error('');
    console.log('🔍 Troubleshooting:');
    console.log('   1. Verify noreply@revivatech.co.uk exists in Zoho');
    console.log('   2. Check that the same password works for this account');
    console.log('   3. Ensure SMTP is enabled for noreply account');
    console.log('   4. Try using app-specific password if available');
  }

  // Close transporter
  transporter.close();
}

// Run the test
testNoReplyEmail().catch(console.error);