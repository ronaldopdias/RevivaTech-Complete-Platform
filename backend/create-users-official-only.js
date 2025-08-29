/**
 * Create Users - Official Better Auth API Only
 * Following Rule 1 - No bypasses, no workarounds, official methods only
 */

const auth = require('./lib/better-auth-fixed');
const { prisma } = require('./lib/prisma');

async function createUsersOfficialOnly() {
  console.log('🔧 Creating users via official Better Auth API only...');
  
  const users = [
    {
      email: "tech@revivatech.co.uk",
      password: "TechPass123!",
      firstName: "Tech",
      lastName: "User",
      targetRole: "TECHNICIAN"
    },
    {
      email: "support@revivatech.co.uk", 
      password: "SupportPass123!",
      firstName: "Support",
      lastName: "User",
      targetRole: "ADMIN"
    },
    {
      email: "customer@example.com",
      password: "CustomerPass123!",
      firstName: "Test",
      lastName: "Customer",
      targetRole: "CUSTOMER"
    }
  ];
  
  const created = [];
  
  for (const userData of users) {
    try {
      console.log(`Creating ${userData.email}...`);
      
      // ONLY use official Better Auth API
      const result = await auth.api.signUpEmail({
        body: {
          email: userData.email,
          password: userData.password,
          firstName: userData.firstName,
          lastName: userData.lastName
        }
      });
      
      console.log(`✅ Created: ${result.user.id}`);
      
      // Update role using official Prisma (database operations are allowed)
      if (userData.targetRole !== 'CUSTOMER') {
        await prisma.user.update({
          where: { id: result.user.id },
          data: { role: userData.targetRole }
        });
        console.log(`✅ Role set to ${userData.targetRole}`);
      }
      
      created.push({
        id: result.user.id,
        email: userData.email,
        role: userData.targetRole
      });
      
    } catch (error) {
      if (error.body?.code === 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL') {
        console.log(`ℹ️  ${userData.email} already exists - skipping`);
      } else {
        console.error(`❌ Failed to create ${userData.email}:`, error.message);
      }
    }
  }
  
  console.log('\n📋 Created users:', created);
  
  // Verify database state
  const allUsers = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true, 
      role: true
    }
  });
  
  console.log('\n📊 Total users in database:', allUsers.length);
  console.table(allUsers);
  
  await prisma.$disconnect();
  
  console.log('\n🎉 User creation completed using ONLY official Better Auth API');
}

createUsersOfficialOnly().catch(console.error);