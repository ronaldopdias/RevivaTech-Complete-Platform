/**
 * Test Better Auth with Correct Format
 * Use the body format and stronger password
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

async function testCorrectFormat() {
  console.log('🔧 Testing Better Auth with correct format...');
  
  const auth = betterAuth({
    database: prismaAdapter(prisma, {
      provider: "postgresql"
    }),
    secret: "correct-format-secret",
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false
    },
    trustHost: true
  });
  
  try {
    // Use the correct format with body wrapper and stronger password
    const result = await auth.api.signUpEmail({
      body: {
        email: "admin@revivatech.co.uk",
        password: "AdminPass123456!", // Stronger password
        firstName: "Admin",
        lastName: "User"
      }
    });
    
    console.log('✅ User creation successful!');
    console.log('User ID:', result.user?.id);
    console.log('Email:', result.user?.email);
    console.log('Full user object keys:', Object.keys(result.user || {}));
    
  } catch (error) {
    console.error('❌ User creation failed:', error.message);
    
    if (error.body) {
      console.error('Error body:', error.body);
    }
    
    // If it's still a validation error, let's try without the firstName/lastName
    if (error.body?.code === 'VALIDATION_ERROR') {
      console.log('\n🔧 Trying without firstName/lastName...');
      
      try {
        const result = await auth.api.signUpEmail({
          body: {
            email: "admin2@revivatech.co.uk", 
            password: "AdminPass123456!"
          }
        });
        
        console.log('✅ Minimal user creation successful!');
        console.log('User ID:', result.user?.id);
        
      } catch (error2) {
        console.error('❌ Even minimal creation failed:', error2.message);
        if (error2.body) {
          console.error('Error body:', error2.body);
        }
      }
    }
  }
  
  await prisma.$disconnect();
}

testCorrectFormat().catch(console.error);