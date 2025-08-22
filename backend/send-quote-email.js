#!/usr/bin/env node

/**
 * Send Professional Repair Quote Email
 * From: quotes@revivatech.co.uk
 * To: ronaldodiasp@gmail.com
 */

const nodemailer = require('nodemailer');
require('dotenv').config();

async function sendRepairQuote() {
  console.log('💰 Sending Professional Repair Quote Email...\n');

  // Create transporter with quotes@revivatech.co.uk
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.QUOTES_EMAIL,
      pass: process.env.QUOTES_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  console.log('📧 Quote Email Configuration:');
  console.log(`   From: ${process.env.QUOTES_EMAIL}`);
  console.log(`   To: ronaldodiasp@gmail.com`);
  console.log(`   SMTP Host: ${process.env.SMTP_HOST}`);
  console.log('');

  try {
    // Verify connection
    console.log('🔌 Testing SMTP connection...');
    await transporter.verify();

    // Generate quote number
    const quoteNumber = `REV-${Date.now().toString().slice(-6)}`;
    const quoteDate = new Date();
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 7); // Valid for 7 days

    console.log('📋 Sending repair quote email...');
    const quoteEmail = {
      from: `RevivaTech Quotes <${process.env.QUOTES_EMAIL}>`,
      to: 'ronaldodiasp@gmail.com',
      replyTo: process.env.SUPPORT_EMAIL,
      subject: `💰 Repair Quote ${quoteNumber} - MacBook Pro Screen Replacement`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; border: 1px solid #e0e0e0;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #ADD8E6, #008080); padding: 25px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">💰 Repair Quote</h1>
            <p style="color: white; margin: 8px 0 0 0; font-size: 16px;">Professional Device Repair Estimate</p>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 30px; background: #f9f9f9;">
            <p style="font-size: 16px; color: #36454F; margin-bottom: 25px;">
              Dear <strong>Ronaldo</strong>,
            </p>
            
            <p style="color: #36454F; line-height: 1.6; margin-bottom: 25px;">
              Thank you for considering RevivaTech for your device repair needs. We've prepared a detailed quote for your MacBook Pro repair based on our professional assessment.
            </p>

            <!-- Quote Details Card -->
            <div style="background: white; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #008080;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="color: #1A5266; margin: 0; font-size: 22px;">📋 Quote Details</h2>
                <div style="text-align: right;">
                  <div style="color: #4B5563; font-size: 14px;">Quote #${quoteNumber}</div>
                  <div style="color: #4B5563; font-size: 14px;">${quoteDate.toLocaleDateString('en-GB')}</div>
                </div>
              </div>
              
              <!-- Customer & Device Info -->
              <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                  <div>
                    <h4 style="color: #1A5266; margin: 0 0 10px 0;">Customer Information</h4>
                    <p style="margin: 5px 0; color: #36454F;"><strong>Name:</strong> Ronaldo Dias</p>
                    <p style="margin: 5px 0; color: #36454F;"><strong>Email:</strong> ronaldodiasp@gmail.com</p>
                    <p style="margin: 5px 0; color: #36454F;"><strong>Contact:</strong> Available via email</p>
                  </div>
                  <div>
                    <h4 style="color: #1A5266; margin: 0 0 10px 0;">Device Information</h4>
                    <p style="margin: 5px 0; color: #36454F;"><strong>Device:</strong> MacBook Pro 16"</p>
                    <p style="margin: 5px 0; color: #36454F;"><strong>Model:</strong> M3 (2023)</p>
                    <p style="margin: 5px 0; color: #36454F;"><strong>Issue:</strong> Screen replacement needed</p>
                  </div>
                </div>
              </div>

              <!-- Repair Services Table -->
              <div style="margin: 25px 0;">
                <h3 style="color: #1A5266; margin-bottom: 15px;">🔧 Repair Services</h3>
                <table style="width: 100%; border-collapse: collapse; background: white;">
                  <thead>
                    <tr style="background: #f1f5f9;">
                      <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e2e8f0; color: #1A5266; font-weight: 600;">Service</th>
                      <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e2e8f0; color: #1A5266; font-weight: 600;">Time</th>
                      <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e2e8f0; color: #1A5266; font-weight: 600;">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style="padding: 15px 12px; border-bottom: 1px solid #f1f5f9;">
                        <div>
                          <strong style="color: #36454F;">MacBook Pro 16" Screen Replacement</strong><br>
                          <small style="color: #64748b;">• Original quality Retina display</small><br>
                          <small style="color: #64748b;">• Professional installation</small><br>
                          <small style="color: #64748b;">• Pre-repair diagnostics included</small>
                        </div>
                      </td>
                      <td style="padding: 15px 12px; text-align: center; border-bottom: 1px solid #f1f5f9; color: #36454F;">2-3 days</td>
                      <td style="padding: 15px 12px; text-align: right; border-bottom: 1px solid #f1f5f9; color: #36454F; font-weight: 600;">£295.00</td>
                    </tr>
                    <tr>
                      <td style="padding: 15px 12px; border-bottom: 1px solid #f1f5f9;">
                        <div>
                          <strong style="color: #36454F;">Comprehensive Device Testing</strong><br>
                          <small style="color: #64748b;">• Full system diagnostics</small><br>
                          <small style="color: #64748b;">• Performance optimization</small><br>
                          <small style="color: #64748b;">• Quality assurance testing</small>
                        </div>
                      </td>
                      <td style="padding: 15px 12px; text-align: center; border-bottom: 1px solid #f1f5f9; color: #36454F;">Included</td>
                      <td style="padding: 15px 12px; text-align: right; border-bottom: 1px solid #f1f5f9; color: #36454F; font-weight: 600;">£25.00</td>
                    </tr>
                    <tr style="background: #f8f9fa;">
                      <td style="padding: 15px 12px; font-weight: 600; color: #1A5266;">Subtotal</td>
                      <td style="padding: 15px 12px;"></td>
                      <td style="padding: 15px 12px; text-align: right; font-weight: 600; color: #1A5266;">£320.00</td>
                    </tr>
                    <tr style="background: #f1f5f9;">
                      <td style="padding: 15px 12px; font-weight: 600; color: #1A5266;">VAT (20%)</td>
                      <td style="padding: 15px 12px;"></td>
                      <td style="padding: 15px 12px; text-align: right; font-weight: 600; color: #1A5266;">£64.00</td>
                    </tr>
                    <tr style="background: #008080; color: white;">
                      <td style="padding: 20px 12px; font-weight: bold; font-size: 18px;">TOTAL</td>
                      <td style="padding: 20px 12px;"></td>
                      <td style="padding: 20px 12px; text-align: right; font-weight: bold; font-size: 20px;">£384.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Important Information -->
              <div style="background: #e6f7ff; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <h3 style="color: #1A5266; margin-top: 0;">ℹ️ Important Information</h3>
                <ul style="color: #36454F; line-height: 1.8; margin: 10px 0; padding-left: 20px;">
                  <li><strong>Quote Valid Until:</strong> ${validUntil.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</li>
                  <li><strong>Repair Time:</strong> 2-3 business days from confirmation</li>
                  <li><strong>Warranty:</strong> 12 months on parts and labor</li>
                  <li><strong>Payment:</strong> Due upon completion of repair</li>
                  <li><strong>Genuine Parts:</strong> We use only original or certified equivalent parts</li>
                </ul>
              </div>

              <!-- What's Included -->
              <div style="background: #f0f9f0; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <h3 style="color: #1A5266; margin-top: 0;">✅ What's Included</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; color: #36454F;">
                  <div>• Professional diagnosis</div>
                  <div>• High-quality replacement parts</div>
                  <div>• Expert installation</div>
                  <div>• 12-month warranty</div>
                  <div>• Quality testing</div>
                  <div>• Free pickup/delivery*</div>
                </div>
                <p style="color: #64748b; font-size: 12px; margin: 15px 0 0 0;">*Within 5 miles of our location</p>
              </div>
            </div>

            <!-- Action Buttons -->
            <div style="text-align: center; margin: 35px 0;">
              <a href="https://revivatech.co.uk/book-repair?quote=${quoteNumber}" 
                 style="background: #008080; color: white; padding: 16px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; margin-right: 15px;">
                ✅ Accept Quote & Book Repair
              </a>
              <a href="mailto:quotes@revivatech.co.uk?subject=Quote%20${quoteNumber}%20-%20Question" 
                 style="background: #ADD8E6; color: #1A5266; padding: 16px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px;">
                💬 Ask Questions
              </a>
            </div>

            <!-- Contact Information -->
            <div style="background: white; padding: 25px; border-radius: 8px; margin: 25px 0; text-align: center; border: 2px solid #ADD8E6;">
              <h3 style="color: #1A5266; margin-top: 0;">📞 Questions About This Quote?</h3>
              
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0;">
                <div>
                  <div style="color: #008080; font-weight: 600; margin-bottom: 5px;">📧 Email</div>
                  <a href="mailto:quotes@revivatech.co.uk" style="color: #36454F; text-decoration: none;">quotes@revivatech.co.uk</a>
                </div>
                <div>
                  <div style="color: #008080; font-weight: 600; margin-bottom: 5px;">📱 Phone</div>
                  <a href="tel:+441234567890" style="color: #36454F; text-decoration: none;">+44 123 456 7890</a>
                </div>
                <div>
                  <div style="color: #008080; font-weight: 600; margin-bottom: 5px;">⏰ Hours</div>
                  <div style="color: #36454F;">Mon-Fri 9AM-6PM<br>Sat 10AM-4PM</div>
                </div>
              </div>
            </div>

            <p style="color: #4B5563; font-size: 14px; line-height: 1.6; margin-top: 30px;">
              This quote is valid for 7 days from the date above. Prices may vary if additional issues are discovered during repair. 
              We'll always contact you before proceeding with any additional work.
            </p>

            <p style="color: #36454F; line-height: 1.6; margin-top: 20px;">
              Thank you for choosing RevivaTech. We look forward to restoring your MacBook Pro to perfect working condition!
            </p>

            <p style="color: #36454F; margin-top: 25px;">
              Best regards,<br>
              <strong>Ronaldo Dias</strong><br>
              <em>RevivaTech Computer Repairs</em>
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background: #36454F; color: white; padding: 25px; text-align: center;">
            <h3 style="margin: 0 0 15px 0; color: #ADD8E6;">RevivaTech</h3>
            <p style="margin: 5px 0; font-size: 14px;">Professional Computer & Device Repairs</p>
            
            <div style="margin: 20px 0; padding-top: 15px; border-top: 1px solid #4B5563;">
              <a href="https://revivatech.co.uk" style="color: #ADD8E6; text-decoration: none; margin: 0 15px;">🌐 Website</a>
              <a href="mailto:info@revivatech.co.uk" style="color: #ADD8E6; text-decoration: none; margin: 0 15px;">📧 Email</a>
              <a href="https://revivatech.co.uk/book-repair" style="color: #ADD8E6; text-decoration: none; margin: 0 15px;">📱 Book Repair</a>
            </div>
            
            <p style="margin: 15px 0 5px 0; font-size: 12px; color: #D1D5DB;">
              © 2025 RevivaTech Computer Repairs. All rights reserved.
            </p>
            <p style="margin: 0; font-size: 11px; color: #9CA3AF;">
              Quote Reference: ${quoteNumber} | Generated: ${quoteDate.toLocaleString()}
            </p>
          </div>
        </div>
      `,
      text: `
REPAIR QUOTE - RevivaTech Computer Repairs
==========================================

Quote #: ${quoteNumber}
Date: ${quoteDate.toLocaleDateString('en-GB')}
Valid Until: ${validUntil.toLocaleDateString('en-GB')}

Dear Ronaldo,

Thank you for considering RevivaTech for your device repair needs. Here's your detailed repair quote:

CUSTOMER INFORMATION:
Name: Ronaldo Dias
Email: ronaldodiasp@gmail.com

DEVICE INFORMATION:
Device: MacBook Pro 16" M3 (2023)
Issue: Screen replacement needed

REPAIR SERVICES:
================
MacBook Pro 16" Screen Replacement         £295.00
- Original quality Retina display
- Professional installation
- Pre-repair diagnostics included

Comprehensive Device Testing                £25.00
- Full system diagnostics
- Performance optimization
- Quality assurance testing

Subtotal:                                   £320.00
VAT (20%):                                  £64.00
-------------------------------------------------
TOTAL:                                      £384.00

IMPORTANT INFORMATION:
======================
• Quote Valid Until: ${validUntil.toLocaleDateString('en-GB')}
• Repair Time: 2-3 business days from confirmation
• Warranty: 12 months on parts and labor
• Payment: Due upon completion of repair
• Genuine Parts: We use only original or certified equivalent parts

WHAT'S INCLUDED:
================
✓ Professional diagnosis
✓ High-quality replacement parts
✓ Expert installation
✓ 12-month warranty
✓ Quality testing
✓ Free pickup/delivery (within 5 miles)

TO ACCEPT THIS QUOTE:
=====================
Web: https://revivatech.co.uk/book-repair?quote=${quoteNumber}
Email: quotes@revivatech.co.uk
Phone: +44 123 456 7890

CONTACT INFORMATION:
====================
Email: quotes@revivatech.co.uk
Phone: +44 123 456 7890
Hours: Mon-Fri 9AM-6PM, Sat 10AM-4PM

This quote is valid for 7 days. Prices may vary if additional issues are discovered during repair. We'll always contact you before proceeding with additional work.

Thank you for choosing RevivaTech!

Best regards,
Ronaldo Dias
RevivaTech Computer Repairs

--
RevivaTech Computer Repairs
Professional Device Repair & Recovery Services
https://revivatech.co.uk

Quote Reference: ${quoteNumber}
Generated: ${quoteDate.toLocaleString()}
      `
    };

    const result = await transporter.sendMail(quoteEmail);
    console.log(`   Message ID: ${result.messageId}`);
    console.log(`   Response: ${result.response}`);
    console.log(`   Quote Number: ${quoteNumber}`);
    console.log('\n📧 Email Details:');
    console.log(`   From: ${process.env.QUOTES_EMAIL}`);
    console.log(`   To: ronaldodiasp@gmail.com`);
    console.log(`   Subject: 💰 Repair Quote ${quoteNumber} - MacBook Pro Screen Replacement`);
    console.log('\n💰 Quote Summary:');
    console.log(`   Device: MacBook Pro 16" M3 (2023)`);
    console.log(`   Service: Screen Replacement`);
    console.log(`   Total Cost: £384.00 (inc. VAT)`);
    console.log(`   Valid Until: ${validUntil.toLocaleDateString('en-GB')}`);
    console.log('\n🎉 Professional repair quote sent successfully!');

  } catch (error) {
    console.error('❌ Failed to send quote email:');
    console.error(`   Error: ${error.message}`);
  }

  transporter.close();
}

// Send the quote
sendRepairQuote().catch(console.error);