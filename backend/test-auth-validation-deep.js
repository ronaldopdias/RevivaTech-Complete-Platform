/**
 * Deep Test of Better Auth Validation
 * Check what exactly is being validated
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

async function testDeepValidation() {
  console.log('🔍 Deep testing Better Auth validation...');
  
  const auth = betterAuth({
    database: prismaAdapter(prisma, {
      provider: "postgresql"
    }),
    secret: "deep-test-secret",
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false
    },
    trustHost: true
  });
  
  // Test if the method signature is correct by inspecting it
  console.log('🔧 Inspecting signUpEmail method...');
  const signUpMethod = auth.api.signUpEmail;
  
  // Check method properties
  console.log('Method name:', signUpMethod.name);
  console.log('Method length (params):', signUpMethod.length);
  console.log('Method toString:', signUpMethod.toString().substring(0, 200) + '...');
  
  // Try different ways to call it
  const testInputs = [
    // Standard object
    { email: "test1@example.com", password: "Test123" },
    
    // With additional context that might be expected
    { 
      body: { email: "test2@example.com", password: "Test123" }
    },
    
    // Try as if it's an HTTP request
    {
      email: "test3@example.com", 
      password: "Test123"
    }
  ];
  
  for (let i = 0; i < testInputs.length; i++) {
    console.log(`\n🔧 Test input ${i + 1}:`, JSON.stringify(testInputs[i]));
    
    try {
      const result = await signUpMethod(testInputs[i]);
      console.log('✅ Success with input', i + 1, ':', result);
      break; // If one works, we found the right format
      
    } catch (error) {
      console.error('❌ Failed with input', i + 1, ':', error.message);
      
      if (error.body) {
        console.error('Error body:', error.body);
      }
    }
  }
  
  await prisma.$disconnect();
}

testDeepValidation().catch(console.error);