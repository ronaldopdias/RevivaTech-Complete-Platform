#!/usr/bin/env node

/**
 * Email Templates Seeder Script
 * Seeds existing file system templates into the database
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const pool = new Pool({
  host: 'localhost',
  port: 5435,
  database: 'revivatech',
  user: 'revivatech',
  password: 'revivatech_password'
});

// Template definitions
const templates = [
  {
    name: 'booking_confirmation',
    subject: '✅ Booking Confirmed - RevivaTech Repair Service',
    category: 'booking',
    template_type: 'transactional',
    html_file: 'booking-confirmation.html',
    text_file: 'booking-confirmation.txt',
    description: 'Sent when a customer booking is confirmed',
    variables: {
      greeting: 'string',
      user: { first_name: 'string' },
      company: { name: 'string', phone: 'string', email: 'string', support_hours: 'string', address: 'string' },
      booking: { id: 'string', service_type: 'string', appointment_date: 'string', urgency_level: 'string' },
      repair: { brand: 'string', model: 'string', issue: 'string', status: 'string', cost_estimate: 'number' },
      system: { unsubscribe_url: 'string', preferences_url: 'string', year: 'string', tracking_pixel: 'string' }
    }
  },
  {
    name: 'repair_quote',
    subject: '💰 Repair Quote {{quoteNumber}} - {{device}} Repair',
    category: 'booking',
    template_type: 'transactional',
    description: 'Professional repair quote email with detailed pricing',
    html_template: '', // Will be populated from JS template
    text_template: '', // Will be populated from JS template
    variables: {
      quoteNumber: 'string',
      customerName: 'string',
      customerEmail: 'string',
      device: 'string',
      model: 'string',
      issue: 'string',
      servicePrice: 'number',
      diagnosticPrice: 'number',
      validDays: 'number'
    }
  }
];

async function seedTemplates() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting email templates seeding...');
    
    // Check if tables exist
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('email_templates', 'email_template_versions')
    `;
    const tablesResult = await client.query(tablesQuery);
    console.log(`📋 Found ${tablesResult.rows.length} email template tables`);
    
    // Clear existing templates (development only)
    await client.query('DELETE FROM email_templates WHERE name LIKE $1', ['%']);
    console.log('🧹 Cleared existing templates');
    
    const templatesDir = path.join(__dirname, '..', 'templates');
    
    for (const templateDef of templates) {
      console.log(`\n📝 Processing template: ${templateDef.name}`);
      
      let htmlContent = '';
      let textContent = '';
      
      // Read HTML template if specified
      if (templateDef.html_file) {
        const htmlPath = path.join(templatesDir, templateDef.html_file);
        if (fs.existsSync(htmlPath)) {
          htmlContent = fs.readFileSync(htmlPath, 'utf8');
          console.log(`  ✅ Read HTML template: ${templateDef.html_file}`);
        } else {
          console.log(`  ⚠️  HTML file not found: ${templateDef.html_file}`);
        }
      }
      
      // Read text template if specified
      if (templateDef.text_file) {
        const textPath = path.join(templatesDir, templateDef.text_file);
        if (fs.existsSync(textPath)) {
          textContent = fs.readFileSync(textPath, 'utf8');
          console.log(`  ✅ Read text template: ${templateDef.text_file}`);
        } else {
          console.log(`  ⚠️  Text file not found: ${templateDef.text_file}`);
        }
      }
      
      // Handle JS template (quote email)
      if (templateDef.name === 'repair_quote') {
        const jsTemplatePath = path.join(templatesDir, 'quote-email-template.js');
        if (fs.existsSync(jsTemplatePath)) {
          // Extract template content from the JS file
          const jsContent = fs.readFileSync(jsTemplatePath, 'utf8');
          
          // Extract HTML template (between html: ` and `)
          const htmlMatch = jsContent.match(/html:\s*`([^`]+)`/s);
          if (htmlMatch) {
            htmlContent = htmlMatch[1].trim();
            console.log('  ✅ Extracted HTML from JS template');
          }
          
          // Extract text template (between text: ` and `)
          const textMatch = jsContent.match(/text:\s*`([^`]+)`/s);
          if (textMatch) {
            textContent = textMatch[1].trim();
            console.log('  ✅ Extracted text from JS template');
          }
        }
      }
      
      // Use provided template content if available
      if (templateDef.html_template) htmlContent = templateDef.html_template;
      if (templateDef.text_template) textContent = templateDef.text_template;
      
      // Insert template into database
      const insertQuery = `
        INSERT INTO email_templates (
          name, subject, html_template, text_template, 
          template_type, category, is_active, version,
          variables, created_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        RETURNING id
      `;
      
      const values = [
        templateDef.name,
        templateDef.subject,
        htmlContent,
        textContent,
        templateDef.template_type,
        templateDef.category,
        true, // is_active
        1, // version
        JSON.stringify(templateDef.variables || {}),
        1 // created_by (system user)
      ];
      
      const result = await client.query(insertQuery, values);
      const templateId = result.rows[0].id;
      
      console.log(`  ✅ Inserted template with ID: ${templateId}`);
      console.log(`     - HTML length: ${htmlContent.length} chars`);
      console.log(`     - Text length: ${textContent.length} chars`);
      console.log(`     - Variables: ${Object.keys(templateDef.variables || {}).length} defined`);
    }
    
    // Verify templates were inserted
    const countQuery = 'SELECT COUNT(*) FROM email_templates';
    const countResult = await client.query(countQuery);
    console.log(`\n✅ Seeding complete! Total templates: ${countResult.rows[0].count}`);
    
    // List all templates
    const listQuery = `
      SELECT id, name, subject, category, template_type, is_active 
      FROM email_templates 
      ORDER BY created_at DESC
    `;
    const listResult = await client.query(listQuery);
    
    console.log('\n📋 Email Templates Summary:');
    console.log('================================');
    listResult.rows.forEach(template => {
      console.log(`ID: ${template.id} | ${template.name} | ${template.category} | ${template.template_type}`);
      console.log(`   Subject: ${template.subject}`);
      console.log(`   Active: ${template.is_active ? '✅' : '❌'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error seeding templates:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run seeder if called directly
if (require.main === module) {
  seedTemplates()
    .then(() => {
      console.log('🌱 Email templates seeding completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedTemplates };