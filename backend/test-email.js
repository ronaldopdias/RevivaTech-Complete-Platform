#!/usr/bin/env node

/**
 * Email Configuration Test Script
 * Tests RevivaTech Zoho Mail Integration
 */

const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmailConfiguration() {
  console.log('🧪 Testing RevivaTech Email Configuration...\n');

  // Create transporter with Zoho Mail settings
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  console.log('📧 Email Configuration:');
  console.log(`   Host: ${process.env.SMTP_HOST}`);
  console.log(`   Port: ${process.env.SMTP_PORT}`);
  console.log(`   User: ${process.env.SMTP_USER}`);
  console.log(`   From: ${process.env.FROM_EMAIL}`);
  console.log('');

  try {
    // Test 1: Verify connection
    console.log('🔌 Testing SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!\n');

    // Test 2: Send test email
    console.log('📨 Sending test email...');
    const testMailOptions = {
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to: process.env.SMTP_USER, // Send to self for testing
      subject: '🧪 RevivaTech Email Configuration Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ADD8E6, #008080); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">RevivaTech</h1>
            <p style="color: white; margin: 5px 0;">Computer Repairs</p>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #1A5266;">✅ Email Configuration Test Successful!</h2>
            
            <p>Hello Ronaldo,</p>
            
            <p>This is a test email to confirm that your RevivaTech email system is working properly.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #008080; margin-top: 0;">Configuration Details:</h3>
              <ul style="color: #36454F;">
                <li><strong>SMTP Host:</strong> ${process.env.SMTP_HOST}</li>
                <li><strong>Port:</strong> ${process.env.SMTP_PORT}</li>
                <li><strong>From Email:</strong> ${process.env.FROM_EMAIL}</li>
                <li><strong>Test Time:</strong> ${new Date().toLocaleString()}</li>
              </ul>
            </div>
            
            <p>Your email system is ready for:</p>
            <ul style="color: #36454F;">
              <li>📋 Booking confirmations</li>
              <li>🔧 Repair status updates</li>
              <li>💰 Price quotes</li>
              <li>📞 Customer support</li>
              <li>📨 General communications</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://revivatech.co.uk" 
                 style="background: #ADD8E6; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block;">
                📱 Visit RevivaTech Website
              </a>
            </div>
            
            <p style="color: #4B5563; font-size: 14px; margin-top: 30px;">
              This is an automated test email. If you received this, your email configuration is working correctly.
            </p>
          </div>
          
          <div style="background: #36454F; color: white; padding: 20px; text-align: center; font-size: 14px;">
            <p style="margin: 0;">RevivaTech Computer Repairs</p>
            <p style="margin: 5px 0;">Professional Device Repair & Recovery Services</p>
            <p style="margin: 5px 0;">📧 info@revivatech.co.uk | 🌐 revivatech.co.uk</p>
          </div>
        </div>
      `,
      text: `
RevivaTech Email Configuration Test

Hello Ronaldo,

This is a test email to confirm that your RevivaTech email system is working properly.

Configuration Details:
- SMTP Host: ${process.env.SMTP_HOST}
- Port: ${process.env.SMTP_PORT}
- From Email: ${process.env.FROM_EMAIL}
- Test Time: ${new Date().toLocaleString()}

Your email system is ready for booking confirmations, repair updates, quotes, and customer support.

Visit: https://revivatech.co.uk

--
RevivaTech Computer Repairs
Professional Device Repair & Recovery Services
info@revivatech.co.uk | revivatech.co.uk
      `
    };

    const result = await transporter.sendMail(testMailOptions);
    console.log('✅ Test email sent successfully!');
    console.log(`   Message ID: ${result.messageId}`);
    console.log(`   Response: ${result.response}\n`);

    // Test 3: Test booking confirmation format
    console.log('📋 Testing booking confirmation email format...');
    const bookingTestEmail = {
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to: process.env.SMTP_USER,
      subject: '✅ Booking Confirmation - RevivaTech Repair #12345',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ADD8E6, #008080); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Booking Confirmed!</h1>
            <p style="color: white; margin: 5px 0;">Your repair has been scheduled</p>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #1A5266;">Repair Details</h2>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Booking ID:</strong> #12345</p>
              <p><strong>Device:</strong> MacBook Pro 16" M3 (2023)</p>
              <p><strong>Issue:</strong> Screen replacement</p>
              <p><strong>Estimated Cost:</strong> £280</p>
              <p><strong>Estimated Time:</strong> 2-3 business days</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://revivatech.co.uk/track-repair" 
                 style="background: #008080; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block;">
                📱 Track Your Repair
              </a>
            </div>
          </div>
        </div>
      `
    };

    const bookingResult = await transporter.sendMail(bookingTestEmail);
    console.log('✅ Booking confirmation test email sent!');
    console.log(`   Message ID: ${bookingResult.messageId}\n`);

    console.log('🎉 All email tests completed successfully!');
    console.log('');
    console.log('📋 Next Steps:');
    console.log('   1. Check your inbox for the test emails');
    console.log('   2. Verify they arrived and display correctly');
    console.log('   3. Update other email accounts (support, repairs, etc.) with similar passwords');
    console.log('   4. Configure booking system to use these email settings');
    console.log('');
    console.log('🔧 Your RevivaTech email system is ready for production!');

  } catch (error) {
    console.error('❌ Email test failed:');
    console.error(`   Error: ${error.message}`);
    console.error('');
    console.log('🔍 Troubleshooting:');
    console.log('   1. Verify the password is correct');
    console.log('   2. Check that info@revivatech.co.uk exists in Zoho');
    console.log('   3. Ensure SMTP is enabled for the account');
    console.log('   4. Try generating an app-specific password instead');
  }

  // Close transporter
  transporter.close();
}

// Run the test
testEmailConfiguration().catch(console.error);