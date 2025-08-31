/**
 * Better Auth Schema Validation Script
 * Validates database schema matches Better Auth requirements
 * As required by PRD Phase 7.1
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['error', 'warn'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL || `postgresql://revivatech:revivatech_password@localhost:5435/revivatech`
    }
  }
});

async function validateSchema() {
  console.log('🔍 Validating Better Auth Schema...\n');
  
  let validationResults = [];
  
  // Check Account table
  try {
    const accountColumns = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'account' 
      ORDER BY ordinal_position
    `;
    
    const requiredFields = ['id', 'accountId', 'providerId', 'userId'];
    const hasRequiredFields = requiredFields.every(field => 
      accountColumns.some(col => col.column_name === field)
    );
    
    console.log(`✅ Account table: ${hasRequiredFields ? 'VALID' : 'INVALID'}`);
    console.log(`   Columns: ${accountColumns.map(c => c.column_name).join(', ')}`);
    validationResults.push({ table: 'account', valid: hasRequiredFields });
    
  } catch (error) {
    console.log('❌ Account table: MISSING');
    console.log('   Error:', error.message);
    validationResults.push({ table: 'account', valid: false, error: error.message });
  }
  
  console.log('');
  
  // Check Session table
  try {
    const sessionColumns = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'session' 
      ORDER BY ordinal_position
    `;
    
    const requiredFields = ['id', 'token', 'userId', 'expiresAt'];
    const hasRequiredFields = requiredFields.every(field => 
      sessionColumns.some(col => col.column_name === field)
    );
    
    console.log(`✅ Session table: ${hasRequiredFields ? 'VALID' : 'INVALID'}`);
    console.log(`   Columns: ${sessionColumns.map(c => c.column_name).join(', ')}`);
    validationResults.push({ table: 'session', valid: hasRequiredFields });
    
  } catch (error) {
    console.log('❌ Session table: MISSING');
    console.log('   Error:', error.message);
    validationResults.push({ table: 'session', valid: false, error: error.message });
  }
  
  console.log('');
  
  // Check Verification table
  try {
    const verificationColumns = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'verification' 
      ORDER BY ordinal_position
    `;
    
    const requiredFields = ['id', 'identifier', 'value', 'expiresAt'];
    const hasRequiredFields = requiredFields.every(field => 
      verificationColumns.some(col => col.column_name === field)
    );
    
    console.log(`✅ Verification table: ${hasRequiredFields ? 'VALID' : 'INVALID'}`);
    console.log(`   Columns: ${verificationColumns.map(c => c.column_name).join(', ')}`);
    validationResults.push({ table: 'verification', valid: hasRequiredFields });
    
  } catch (error) {
    console.log('❌ Verification table: MISSING');
    console.log('   Error:', error.message);
    validationResults.push({ table: 'verification', valid: false, error: error.message });
  }
  
  console.log('');
  
  // Check Customers table (user equivalent)
  try {
    const customerColumns = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'customers' 
      ORDER BY ordinal_position
    `;
    
    const requiredFields = ['id', 'email'];
    const hasRequiredFields = requiredFields.every(field => 
      customerColumns.some(col => col.column_name === field)
    );
    
    console.log(`✅ Customers table: ${hasRequiredFields ? 'VALID' : 'INVALID'}`);
    console.log(`   Total columns: ${customerColumns.length}`);
    validationResults.push({ table: 'customers', valid: hasRequiredFields });
    
  } catch (error) {
    console.log('❌ Customers table: MISSING');
    console.log('   Error:', error.message);
    validationResults.push({ table: 'customers', valid: false, error: error.message });
  }
  
  console.log('');
  console.log('📋 VALIDATION SUMMARY:');
  console.log('======================');
  
  const validTables = validationResults.filter(r => r.valid).length;
  const totalTables = validationResults.length;
  
  console.log(`Valid tables: ${validTables}/${totalTables}`);
  console.log(`Overall status: ${validTables === totalTables ? '✅ PASSED' : '❌ FAILED'}`);
  
  if (validTables !== totalTables) {
    console.log('\n⚠️ ISSUES FOUND:');
    validationResults.filter(r => !r.valid).forEach(result => {
      console.log(`  - ${result.table}: ${result.error || 'Missing required fields'}`);
    });
    console.log('\n💡 Run migration script to fix schema issues.');
  }
  
  await prisma.$disconnect();
  process.exit(validTables === totalTables ? 0 : 1);
}

// Run validation
validateSchema().catch(error => {
  console.error('❌ Validation script error:', error);
  process.exit(1);
});