/**
 * Test Absolutely Basic Better Auth Configuration
 * Strip down to bare minimum to identify the core issue
 */

const { betterAuth } = require("better-auth");
const { prismaAdapter } = require("better-auth/adapters/prisma");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://revivatech:revivatech_password@revivatech_database:5432/revivatech"
    }
  }
});

async function testBasicAuth() {
  console.log('🔧 Testing absolutely basic Better Auth...');
  
  try {
    // Most basic possible configuration
    const auth = betterAuth({
      database: prismaAdapter(prisma, {
        provider: "postgresql"
      }),
      secret: "basic-secret",
      emailAndPassword: {
        enabled: true
      }
    });
    
    console.log('✅ Auth instance created');
    console.log('Available API methods:', Object.keys(auth.api));
    
    // Test the signUpEmail method exists
    console.log('signUpEmail method type:', typeof auth.api.signUpEmail);
    
    // Try to call it
    console.log('🔧 Attempting user creation...');
    const result = await auth.api.signUpEmail({
      email: "basic@example.com",
      password: "BasicPass123"
    });
    
    console.log('✅ Basic user creation successful!');
    console.log('Result:', result);
    
  } catch (error) {
    console.error('❌ Basic auth failed:');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Stack trace:', error.stack);
    
    if (error.body) {
      console.error('Error body:', error.body);
    }
    
    if (error.cause) {
      console.error('Error cause:', error.cause);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testBasicAuth().catch(console.error);