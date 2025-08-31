/**
 * Better Auth Configuration - Official Documentation Approach
 * Based on Better Auth 1.3.7 official examples
 * Configured for existing bcrypt password compatibility
 */

const { betterAuth } = require("better-auth");
const { prismaAdapter } = require("better-auth/adapters/prisma");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
// Better Auth v1.3.7 uses socialProviders configuration object

// Initialize Prisma Client with debugging
console.log('🔄 Initializing Prisma client for Better Auth...');
// Use internal Docker network address for database connection
const dbUrl = `postgresql://${process.env.DB_USER || 'revivatech'}:${process.env.DB_PASSWORD || 'revivatech_password'}@${process.env.DB_HOST || 'revivatech_database'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'revivatech'}?schema=public`;
console.log('🔗 Database URL (masked):', dbUrl.replace(/password=[^&]+/g, 'password=***'));

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl
    }
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// Test database connection
prisma.$connect()
  .then(() => {
    console.log('✅ Better Auth Prisma connection established successfully');
  })
  .catch((error) => {
    console.error('❌ Better Auth Prisma connection failed:', error.message);
  });

/**
 * Better Auth Configuration - Environment Variable Debug
 */
console.log('🔧 Better Auth Environment Variables Check:');
console.log('- GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'SET' : 'MISSING');
console.log('- GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'MISSING');
console.log('- BETTER_AUTH_SECRET:', process.env.BETTER_AUTH_SECRET ? 'SET' : 'USING FALLBACK');
console.log('- JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'MISSING');
console.log('- NODE_ENV:', process.env.NODE_ENV);

/**
 * Better Auth Configuration
 * Following official documentation exactly
 */
const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
    // Configure field selection to include additional fields
    modelMapping: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
          // Include our additional fields
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          isVerified: true,
          // Include Google OAuth fields
          googleId: true,
          profilePicture: true,
          locale: true,
          domain: true,
          // Include progressive registration fields
          registrationStatus: true,
          profileCompletedAt: true,
          // Include password field for authentication
          password: true
        }
      }
    }
  }),
  
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    password: {
      hash: async (password) => {
        // Use bcrypt for new passwords to maintain consistency
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        console.log('🔐 Hashing new password with bcrypt');
        return hashedPassword;
      },
      verify: async ({ hash, password }) => {
        // Handle bcrypt password verification for existing and new users
        try {
          if (!hash) {
            console.log('🔐 Password verification failed: hash is undefined');
            return false;
          }
          
          const isValid = await bcrypt.compare(password, hash);
          console.log('🔐 BCrypt password verification result:', isValid);
          return isValid;
        } catch (error) {
          console.log('🔐 Password verification error:', error.message);
          return false;
        }
      }
    }
  },
  
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
  },
  
  secret: process.env.BETTER_AUTH_SECRET || process.env.JWT_SECRET || "demo-secret-key",
  
  // Set base path for API endpoints
  basePath: "/api/auth",
  
  // Dynamic base URL for OAuth redirects
  baseURL: (() => {
    if (process.env.BETTER_AUTH_BASE_URL) return process.env.BETTER_AUTH_BASE_URL;
    if (process.env.NODE_ENV === 'production') return 'https://revivatech.co.uk/api/auth';
    
    // Development URL - always use localhost, never container hostname
    const port = process.env.PORT || 3011;
    return `http://localhost:${port}/api/auth`;
  })(),
  
  // CORS and origin configuration for cross-origin development
  trustHost: true,
  trustedOrigins: [
    'http://localhost:3010',
    'http://localhost:3000', 
    'http://192.168.1.199:3010',
    // Removed hardcoded Tailscale IP for security
    'https://revivatech.co.uk',
    'https://www.revivatech.co.uk',
    'https://revivatech.com.br',
    'https://www.revivatech.com.br'
  ],
  
  // Advanced configuration for cross-origin cookie handling
  advanced: {
    cookiePrefix: "revivatech",
    useSecureCookies: process.env.NODE_ENV === "production",
    cookie: {
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
      domain: process.env.COOKIE_DOMAIN || undefined,
      path: "/",
      httpOnly: true
    }
  },
  
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      accessType: "offline", 
      prompt: "select_account consent",
      // Redirect to frontend after successful OAuth
      redirectURI: process.env.NODE_ENV === 'production' 
        ? 'https://revivatech.co.uk/api/auth/callback/google'
        : 'http://localhost:3011/api/auth/callback/google',
    }
  },
  
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'CUSTOMER',
      },
      firstName: {
        type: 'string',
        required: true,
      },
      lastName: {
        type: 'string',
        required: true,
      },
      // Google OAuth additional fields
      googleId: {
        type: 'string',
        required: false,
      },
      profilePicture: {
        type: 'string',
        required: false,
      },
      locale: {
        type: 'string',
        required: false,
      },
      domain: {
        type: 'string',
        required: false,
      },
      // Progressive registration fields
      registrationStatus: {
        type: 'string',
        required: false,
        defaultValue: 'COMPLETE',
      },
      profileCompletedAt: {
        type: 'string', // Date stored as ISO string
        required: false,
      }
    },
    // Ensure additional fields are included in responses
    modelName: "User"
  },
  
  hooks: {
    user: {
      create: {
        before: async (user, context) => {
          console.log('🔧 Better Auth user creation hook - BEFORE');
          console.log('🔧 User data received:', JSON.stringify(user, null, 2));
          console.log('🔧 Context:', JSON.stringify(context, null, 2));
          
          try {
            // Handle Better Auth required fields and Prisma schema compatibility
            const transformedUser = {
              ...user,
              // firstName and lastName are now required - validate they exist
              firstName: user.firstName || (user.name ? user.name.split(' ')[0] : 'User'),
              lastName: user.lastName || (user.name ? user.name.split(' ')[1] || '' : ''),
              role: user.role || 'CUSTOMER'
            };
            
            console.log('🔧 Initial transformed user:', JSON.stringify(transformedUser, null, 2));

          // Handle Google OAuth specific data
          if (context && context.socialProvider === 'google' && context.profile) {
            const googleProfile = context.profile;
            
            // Extract Google-specific fields
            transformedUser.googleId = googleProfile.sub || googleProfile.id;
            transformedUser.profilePicture = googleProfile.picture;
            transformedUser.locale = googleProfile.locale;
            transformedUser.domain = googleProfile.hd; // Google Workspace domain
            
            // Use Google profile data for names if available
            if (googleProfile.given_name) {
              transformedUser.firstName = googleProfile.given_name;
            }
            if (googleProfile.family_name) {
              transformedUser.lastName = googleProfile.family_name;
            }
            
            // Progressive registration: Google OAuth users need profile completion
            // if they don't provide a phone number
            if (!transformedUser.phone) {
              transformedUser.registrationStatus = 'PENDING_PROFILE_COMPLETION';
              console.log('🔄 Google OAuth user requires profile completion (missing phone)');
            } else {
              transformedUser.registrationStatus = 'COMPLETE';
              transformedUser.profileCompletedAt = new Date().toISOString();
            }
            
            console.log('🔧 Enhanced user data with Google OAuth:', {
              email: transformedUser.email,
              firstName: transformedUser.firstName,
              lastName: transformedUser.lastName,
              googleId: transformedUser.googleId,
              profilePicture: transformedUser.profilePicture,
              locale: transformedUser.locale,
              domain: transformedUser.domain,
              role: transformedUser.role,
              registrationStatus: transformedUser.registrationStatus
            });
          } else {
            // Regular registration users should be complete
            transformedUser.registrationStatus = 'COMPLETE';
            transformedUser.profileCompletedAt = new Date().toISOString();
            
            console.log('🔧 Transformed user data for creation:', {
              email: transformedUser.email,
              firstName: transformedUser.firstName,
              lastName: transformedUser.lastName,
              role: transformedUser.role,
              registrationStatus: transformedUser.registrationStatus
            });
          }
          
          console.log('🔧 Final transformed user for creation:', JSON.stringify(transformedUser, null, 2));
          return transformedUser;
          
          } catch (error) {
            console.error('❌ Error in user creation hook:', error.message);
            console.error('❌ Error stack:', error.stack);
            console.error('❌ User data that caused error:', JSON.stringify(user, null, 2));
            console.error('❌ Context that caused error:', JSON.stringify(context, null, 2));
            throw error;
          }
        }
      }
    },
    session: {
      create: {
        after: async ({ session, user }) => {
          // Enhance user object with additional fields from database
          if (user && user.id) {
            const fullUser = await prisma.user.findUnique({
              where: { id: user.id },
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                isActive: true,
                isVerified: true,
                emailVerified: true,
                // Include Google OAuth fields in session
                googleId: true,
                profilePicture: true,
                locale: true,
                domain: true,
                // Include progressive registration fields in session
                registrationStatus: true,
                profileCompletedAt: true,
                createdAt: true,
                updatedAt: true
              }
            });
            
            if (fullUser) {
              // Return enhanced user data including Google OAuth fields
              return {
                session,
                user: {
                  ...user,
                  firstName: fullUser.firstName,
                  lastName: fullUser.lastName,
                  role: fullUser.role,
                  isActive: fullUser.isActive,
                  isVerified: fullUser.isVerified,
                  // Include Google OAuth data in session
                  googleId: fullUser.googleId,
                  profilePicture: fullUser.profilePicture,
                  locale: fullUser.locale,
                  domain: fullUser.domain,
                  // Include progressive registration data in session
                  registrationStatus: fullUser.registrationStatus,
                  profileCompletedAt: fullUser.profileCompletedAt
                }
              };
            }
          }
          
          return { session, user };
        }
      }
    }
  },

});

// Debug: Check what routes Better Auth exposes
console.log('🔧 Better Auth initialization complete');
console.log('🔧 Better Auth handler type:', typeof auth.handler);
console.log('🔧 Better Auth object keys:', Object.keys(auth));

// Test if Better Auth has a route listing capability
if (auth.api) {
  console.log('🔧 Better Auth API routes:', Object.keys(auth.api));
} else {
  console.log('🔧 Better Auth API routes: No api property found');
}

module.exports = auth;