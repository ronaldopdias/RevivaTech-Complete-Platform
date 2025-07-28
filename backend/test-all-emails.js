#!/usr/bin/env node

/**
 * Complete RevivaTech Email System Test
 * Tests all configured email accounts with the same password
 */

const nodemailer = require('nodemailer');
require('dotenv').config();

// Email accounts to test
const emailAccounts = [
  {
    name: 'Main Business',
    email: process.env.SMTP_USER,
    password: process.env.SMTP_PASS,
    purpose: 'General business communications',
    testSubject: '🏢 Main Business Email Test - RevivaTech'
  },
  {
    name: 'Customer Support',
    email: process.env.SUPPORT_EMAIL,
    password: process.env.SUPPORT_PASS,
    purpose: 'Customer service and support inquiries',
    testSubject: '🎧 Customer Support Email Test - RevivaTech'
  },
  {
    name: 'Repairs Department',
    email: process.env.REPAIRS_EMAIL,
    password: process.env.REPAIRS_PASS,
    purpose: 'Repair status updates and technical communications',
    testSubject: '🔧 Repairs Department Email Test - RevivaTech'
  },
  {
    name: 'No Reply (Automated)',
    email: process.env.NOREPLY_EMAIL,
    password: process.env.NOREPLY_PASS,
    purpose: 'Automated booking confirmations and notifications',
    testSubject: '🤖 Automated Email Test - RevivaTech'
  },
  {
    name: 'Quotes Department',
    email: process.env.QUOTES_EMAIL,
    password: process.env.QUOTES_PASS,
    purpose: 'Price quotes and repair estimates',
    testSubject: '💰 Quotes Department Email Test - RevivaTech'
  },
  {
    name: 'Admin',
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASS,
    purpose: 'Administrative notifications and system alerts',
    testSubject: '⚡ Admin Email Test - RevivaTech'
  }
];

async function testEmailAccount(account) {
  console.log(`\n🧪 Testing ${account.name} (${account.email})...`);
  
  // Create transporter for this account
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: account.email,
      pass: account.password
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    // Test SMTP connection
    console.log('   🔌 Testing SMTP connection...');
    await transporter.verify();
    console.log('   ✅ Connection successful!');

    // Send test email
    console.log('   📨 Sending test email...');
    const testEmail = {
      from: `RevivaTech <${account.email}>`,
      to: process.env.SMTP_USER, // Send to main email for testing
      subject: account.testSubject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #ADD8E6, #008080); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">✅ ${account.name}</h1>
            <p style="color: white; margin: 5px 0;">Email Configuration Test</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 25px; background: #f9f9f9;">
            <h2 style="color: #1A5266;">Email Account Details</h2>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Account:</strong> ${account.email}</p>
              <p><strong>Purpose:</strong> ${account.purpose}</p>
              <p><strong>Test Time:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Status:</strong> <span style="color: #008080; font-weight: bold;">✅ WORKING</span></p>
            </div>

            <div style="background: #e6f7ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1A5266; margin-top: 0;">📋 Account Ready For:</h3>
              <p style="color: #36454F; margin: 0;">${account.purpose}</p>
            </div>
            
            <div style="text-align: center; margin: 25px 0;">
              <a href="https://revivatech.co.uk" 
                 style="background: #008080; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
                🌐 Visit RevivaTech
              </a>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background: #36454F; color: white; padding: 20px; text-align: center;">
            <h3 style="margin: 0 0 10px 0; color: #ADD8E6;">RevivaTech</h3>
            <p style="margin: 0; font-size: 14px;">Professional Computer & Device Repairs</p>
          </div>
        </div>
      `,
      text: `
${account.name} Email Test - RevivaTech

Account: ${account.email}
Purpose: ${account.purpose}
Test Time: ${new Date().toLocaleString()}
Status: ✅ WORKING

This email account is ready for: ${account.purpose}

--
RevivaTech Computer Repairs
Professional Device Repair & Recovery Services
https://revivatech.co.uk
      `
    };

    const result = await transporter.sendMail(testEmail);
    console.log(`   ✅ Test email sent! Message ID: ${result.messageId}`);
    
    transporter.close();
    return { success: true, account: account.name, email: account.email };

  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    transporter.close();
    return { success: false, account: account.name, email: account.email, error: error.message };
  }
}

async function testAllEmails() {
  console.log('🎯 Testing All RevivaTech Email Accounts');
  console.log('==========================================\n');
  
  console.log('📧 Configuration Summary:');
  console.log(`   SMTP Host: ${process.env.SMTP_HOST}`);
  console.log(`   SMTP Port: ${process.env.SMTP_PORT}`);
  console.log(`   Password: ${process.env.SMTP_PASS}`);
  console.log(`   Total Accounts: ${emailAccounts.length}`);

  const results = [];
  
  // Test each account
  for (const account of emailAccounts) {
    const result = await testEmailAccount(account);
    results.push(result);
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Summary Report
  console.log('\n\n📊 FINAL RESULTS SUMMARY');
  console.log('========================\n');

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  successful.forEach(result => {
    console.log(`✅ ${result.account.padEnd(20)} (${result.email})`);
  });

  if (failed.length > 0) {
    console.log('\n❌ Failed Accounts:');
    failed.forEach(result => {
      console.log(`❌ ${result.account.padEnd(20)} (${result.email}) - ${result.error}`);
    });
  }

  console.log(`\n📈 Success Rate: ${successful.length}/${emailAccounts.length} (${Math.round((successful.length/emailAccounts.length)*100)}%)`);

  if (successful.length === emailAccounts.length) {
    console.log('\n🎉 ALL EMAIL ACCOUNTS WORKING PERFECTLY!');
    console.log('\n🚀 Your RevivaTech email system is fully operational:');
    console.log('   ✅ Customer communications ready');
    console.log('   ✅ Booking confirmations ready');
    console.log('   ✅ Repair status updates ready');
    console.log('   ✅ Price quotes ready');
    console.log('   ✅ Admin notifications ready');
    console.log('   ✅ Support system ready');
    console.log('\n💡 Next Steps:');
    console.log('   1. Check info@revivatech.co.uk inbox for all test emails');
    console.log('   2. Integrate email templates into booking system');
    console.log('   3. Configure automated email triggers');
    console.log('   4. Set up email signatures for each account');
  } else {
    console.log('\n⚠️  Some accounts need attention. Check the failed accounts above.');
  }

  console.log('\n📧 Email Account Summary:');
  console.log('========================');
  emailAccounts.forEach(account => {
    const status = results.find(r => r.email === account.email);
    console.log(`${status?.success ? '✅' : '❌'} ${account.email.padEnd(30)} - ${account.purpose}`);
  });
}

// Run the comprehensive test
testAllEmails().catch(console.error);