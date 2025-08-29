/**
 * Create Official Users Through Better Auth API
 * No bypasses, no manual database manipulation
 */

const auth = require('./lib/better-auth-fixed');
const { prisma } = require('./lib/prisma');

async function createOfficialUsers() {
  console.log('🔧 Creating users through official Better Auth API...');
  
  const users = [
    {
      email: "admin@revivatech.co.uk",
      password: "AdminPass123!",
      firstName: "Admin",
      lastName: "User",
      role: "SUPER_ADMIN"
    },
    {
      email: "tech@revivatech.co.uk", 
      password: "TechPass123!",
      firstName: "Tech",
      lastName: "User",
      role: "TECHNICIAN"
    },
    {
      email: "support@revivatech.co.uk",
      password: "SupportPass123!",
      firstName: "Support", 
      lastName: "User",
      role: "ADMIN"
    },
    {
      email: "customer@example.com",
      password: "CustomerPass123!",
      firstName: "Test",
      lastName: "Customer", 
      role: "CUSTOMER"
    }
  ];
  
  const createdUsers = [];
  
  for (const userData of users) {
    try {
      console.log(`\n🔧 Creating ${userData.role}: ${userData.email}`);
      
      const result = await auth.api.signUpEmail({
        body: {
          email: userData.email,
          password: userData.password,
          firstName: userData.firstName,
          lastName: userData.lastName
        }
      });
      
      console.log(`✅ User created: ${result.user?.id}`);
      
      // Update role after creation if needed
      if (userData.role !== 'CUSTOMER') {
        try {
          await prisma.user.update({
            where: { id: result.user.id },
            data: { role: userData.role }
          });
          console.log(`✅ Role updated to ${userData.role}`);
        } catch (roleError) {
          console.error(`❌ Failed to update role: ${roleError.message}`);
        }
      }
      
      createdUsers.push({
        id: result.user?.id,
        email: userData.email,
        role: userData.role,
        firstName: userData.firstName,
        lastName: userData.lastName
      });
      
    } catch (error) {
      console.error(`❌ Failed to create ${userData.email}:`, error.message);
      
      if (error.body?.code === 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL') {
        console.log(`ℹ️  User ${userData.email} already exists - skipping`);
      }
    }
  }
  
  console.log('\n📋 Summary of created users:');
  console.table(createdUsers);
  
  // Test database query to verify users
  console.log('\n🔍 Verifying users in database...');
  const dbUsers = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  });
  
  console.log('Users in database:', dbUsers.length);
  console.table(dbUsers);
  
  await prisma.$disconnect();
  
  console.log('\n🎉 Official user creation completed!');
}

createOfficialUsers().catch(console.error);