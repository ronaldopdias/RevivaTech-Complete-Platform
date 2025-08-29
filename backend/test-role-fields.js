/**
 * Test Role Fields in Better Auth Response
 * Check if user roles and additional fields are now returned
 */

const auth = require('./lib/better-auth-fixed');

async function testRoleFields() {
  console.log('🔧 Testing role fields in Better Auth response...');
  
  try {
    // Test admin sign-in
    const adminResult = await auth.api.signInEmail({
      body: {
        email: "admin@revivatech.co.uk",
        password: "AdminPass123!"
      }
    });
    
    console.log('Admin sign-in result:');
    console.log('User object keys:', Object.keys(adminResult.user || {}));
    console.log('User data:', {
      id: adminResult.user?.id,
      email: adminResult.user?.email,
      firstName: adminResult.user?.firstName,
      lastName: adminResult.user?.lastName,
      role: adminResult.user?.role,
      name: adminResult.user?.name
    });
    
    // Test technician sign-in
    console.log('\nTechnician sign-in result:');
    const techResult = await auth.api.signInEmail({
      body: {
        email: "tech@revivatech.co.uk",
        password: "TechPass123!"
      }
    });
    
    console.log('User data:', {
      id: techResult.user?.id,
      email: techResult.user?.email,
      firstName: techResult.user?.firstName,
      lastName: techResult.user?.lastName,
      role: techResult.user?.role
    });
    
  } catch (error) {
    console.error('❌ Role field test failed:', error.message);
  }
}

testRoleFields().catch(console.error);