/**
 * Test Better Auth Prisma Adapter Configuration
 * Check if we need custom field mappings
 */

const { betterAuth } = require("better-auth");
const { prismaAdapter } = require("better-auth/adapters/prisma");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://revivatech:revivatech_password@revivatech_database:5432/revivatech"
    }
  },
  log: ['error'] // Only errors for cleaner output
});

async function testPrismaAdapterConfig() {
  console.log('🔧 Testing Prisma adapter configuration...');
  
  // Try with custom field mapping for the adapter
  const auth = betterAuth({
    database: prismaAdapter(prisma, {
      provider: "postgresql",
      // Check if we can specify custom table/field mappings
      modelMapping: {
        // Try to map Better Auth fields to our schema
        Account: {
          accountId: "providerAccountId",
          providerId: "provider"
        }
      }
    }),
    secret: "adapter-test-secret",
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false
    },
    trustHost: true
  });
  
  try {
    const result = await auth.api.signUpEmail({
      body: {
        email: "adapter@example.com",
        password: "AdapterPass123456!"
      }
    });
    
    console.log('✅ User creation successful with mapping!');
    console.log('User ID:', result.user?.id);
    
  } catch (error) {
    console.error('❌ User creation failed with mapping:', error.message);
    
    // Try without custom mapping but with debug
    console.log('\n🔧 Testing without custom mapping...');
    
    const authNoMapping = betterAuth({
      database: prismaAdapter(prisma, {
        provider: "postgresql"
      }),
      secret: "no-mapping-secret",
      emailAndPassword: {
        enabled: true,
        requireEmailVerification: false
      },
      trustHost: true
    });
    
    try {
      const result2 = await authNoMapping.api.signUpEmail({
        body: {
          email: "nomapping@example.com",
          password: "NoMappingPass123456!"
        }
      });
      
      console.log('✅ User creation successful without mapping!');
      console.log('User ID:', result2.user?.id);
      
    } catch (error2) {
      console.error('❌ User creation failed without mapping:', error2.message);
      console.error('This suggests the field mapping is the issue');
    }
  }
  
  await prisma.$disconnect();
}

testPrismaAdapterConfig().catch(console.error);