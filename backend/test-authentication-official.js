/**
 * Test Authentication - Official Better Auth API Only
 * Following Rule 1 - Verify integration without bypasses
 */

const auth = require('./lib/better-auth-fixed');
const { prisma } = require('./lib/prisma');

async function testAuthenticationOfficial() {
  console.log('🔧 Testing authentication with official Better Auth API...');
  
  const testUsers = [
    { email: "admin@revivatech.co.uk", password: "AdminPass123!", expectedRole: "SUPER_ADMIN" },
    { email: "tech@revivatech.co.uk", password: "TechPass123!", expectedRole: "TECHNICIAN" },
    { email: "support@revivatech.co.uk", password: "SupportPass123!", expectedRole: "ADMIN" },
    { email: "customer@example.com", password: "CustomerPass123!", expectedRole: "CUSTOMER" }
  ];
  
  console.log('\n📋 Authentication Test Results:');
  console.log('=' .repeat(60));
  
  for (const user of testUsers) {
    try {
      // Use ONLY official Better Auth API
      const result = await auth.api.signInEmail({
        body: {
          email: user.email,
          password: user.password
        }
      });
      
      console.log(`✅ ${user.email}: Authentication successful`);
      console.log(`   User ID: ${result.user.id}`);
      
      // Get role from database (since Better Auth may not return it)
      const dbUser = await prisma.user.findUnique({
        where: { id: result.user.id },
        select: { role: true }
      });
      
      console.log(`   Role: ${dbUser.role}`);
      
      if (dbUser.role === user.expectedRole) {
        console.log(`   ✅ Role correct: ${dbUser.role}`);
      } else {
        console.log(`   ⚠️  Role mismatch: expected ${user.expectedRole}, got ${dbUser.role}`);
      }
      
    } catch (error) {
      console.log(`❌ ${user.email}: Authentication failed`);
      console.log(`   Error: ${error.message}`);
    }
    
    console.log('');
  }
  
  // Verify database integrity  
  console.log('📊 Database Integrity Check:');
  
  const userCount = await prisma.user.count();
  const accountCount = await prisma.account.count();
  
  console.log(`Users: ${userCount}`);
  console.log(`Accounts: ${accountCount}`);
  
  if (userCount === accountCount) {
    console.log('✅ User-Account relationship integrity maintained');
  } else {
    console.log('⚠️  User-Account count mismatch');
  }
  
  await prisma.$disconnect();
  
  console.log('\n🎉 Authentication testing completed using ONLY official methods');
}

testAuthenticationOfficial().catch(console.error);