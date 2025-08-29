/**
 * Test Better Auth Schema Requirements
 * Check what fields Better Auth expects vs our Prisma schema
 */

const auth = require('./lib/better-auth-fixed');
const { prisma } = require('./lib/prisma');

async function testAuthSchema() {
  console.log('🔍 Better Auth Configuration Analysis...');
  
  // Check user fields configuration
  console.log('User additionalFields:', auth.options.user?.additionalFields || 'None configured');
  
  // Check if emailAndPassword is properly configured
  console.log('Email/Password config:', auth.options.emailAndPassword);
  
  // Test minimal user creation to see exact validation error
  console.log('\n📝 Testing minimal user creation...');
  
  try {
    // Try with just required fields
    const result = await auth.api.signUpEmail({
      email: "test@example.com",
      password: "TestPass123"
    });
    
    console.log('✅ Minimal user creation successful:', result);
    
  } catch (error) {
    console.error('❌ Minimal creation failed:', error.message);
    
    // Try to extract detailed validation info
    if (error.body?.details) {
      console.error('Validation details:', error.body.details);
    }
  }
  
  // Test database connectivity
  console.log('\n💾 Testing Prisma connection...');
  try {
    const userCount = await prisma.user.count();
    console.log('✅ Prisma connection working, user count:', userCount);
  } catch (error) {
    console.error('❌ Prisma connection failed:', error.message);
  }
}

testAuthSchema().catch(console.error);