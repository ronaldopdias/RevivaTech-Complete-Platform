/**
 * Test Better Auth Connection
 * Simple test to verify Better Auth + Prisma configuration
 */

const { PrismaClient } = require("@prisma/client");

async function testBetterAuthConnection() {
  console.log('🔍 Testing Better Auth + Prisma configuration...');
  
  try {
    // Test 1: Prisma Connection
    console.log('\n1. Testing Prisma connection...');
    const prisma = new PrismaClient({
      log: ['error', 'warn'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL || `postgresql://revivatech:revivatech_password@revivatech_database:5432/revivatech`
        }
      }
    });

    await prisma.$connect();
    console.log('✅ Prisma connection successful');

    // Test 2: Check User table exists
    console.log('\n2. Testing User table access...');
    const userCount = await prisma.user.count();
    console.log(`✅ User table accessible. Count: ${userCount}`);

    // Test 3: Check Better Auth tables exist
    console.log('\n3. Testing Better Auth tables...');
    const accountCount = await prisma.account.count();
    const sessionCount = await prisma.session.count();
    console.log(`✅ Account table: ${accountCount} records`);
    console.log(`✅ Session table: ${sessionCount} records`);

    await prisma.$disconnect();

    // Test 4: Better Auth Configuration Loading
    console.log('\n4. Testing Better Auth configuration...');
    const auth = require('./lib/better-auth-clean');
    console.log('✅ Better Auth configuration loaded successfully');
    console.log('Auth instance type:', typeof auth);

    console.log('\n🎉 All tests passed! Better Auth + Prisma is configured correctly.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testBetterAuthConnection();