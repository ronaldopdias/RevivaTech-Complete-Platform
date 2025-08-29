/**
 * Test Better Auth Field Configuration
 * Check different ways to configure user fields
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

// Test with minimal configuration first
const authMinimal = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql"
  }),
  
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  
  secret: "test-secret",
  basePath: "/api/auth",
  trustHost: true
});

async function testMinimalAuth() {
  console.log('🔧 Testing minimal Better Auth configuration...');
  
  try {
    const result = await authMinimal.api.signUpEmail({
      email: "minimal@example.com",
      password: "MinimalPass123"
    });
    
    console.log('✅ Minimal auth successful:', result.user?.id);
    return true;
    
  } catch (error) {
    console.error('❌ Minimal auth failed:', error.message);
    
    if (error.body) {
      console.error('Error body:', error.body);
    }
    
    return false;
  }
}

async function testFieldConfiguration() {
  // If minimal works, test with field configuration
  const minimalWorked = await testMinimalAuth();
  
  if (!minimalWorked) {
    console.log('❌ Minimal auth failed, stopping tests');
    return;
  }
  
  console.log('\n🔧 Testing with field configuration...');
  
  // Test with additionalFields
  const authWithFields = betterAuth({
    database: prismaAdapter(prisma, {
      provider: "postgresql"
    }),
    
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    
    secret: "test-secret",
    basePath: "/api/auth", 
    trustHost: true,
    
    user: {
      additionalFields: {
        firstName: {
          type: 'string',
          required: false, // Make it optional first
        },
        lastName: {
          type: 'string', 
          required: false, // Make it optional first
        },
        role: {
          type: 'string',
          required: false,
          defaultValue: 'CUSTOMER',
        }
      }
    }
  });
  
  try {
    const result = await authWithFields.api.signUpEmail({
      email: "withfields@example.com",
      password: "WithFieldsPass123",
      firstName: "With",
      lastName: "Fields"
    });
    
    console.log('✅ Auth with fields successful:', result.user?.id);
    
  } catch (error) {
    console.error('❌ Auth with fields failed:', error.message);
    
    if (error.body) {
      console.error('Error body:', error.body);
    }
  }
}

testFieldConfiguration().catch(console.error).finally(() => {
  prisma.$disconnect();
});