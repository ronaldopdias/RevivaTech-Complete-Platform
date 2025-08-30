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

// Initialize Prisma Client
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || `postgresql://revivatech:revivatech_password@revivatech_database:5432/revivatech`
    }
  }
});

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
  
  // Set base URL for OAuth redirects (hardcoded since env var not loading)
  baseURL: "http://localhost:3011/api/auth",
  
  // CORS and origin configuration for cross-origin development
  trustHost: true,
  trustedOrigins: [
    'http://localhost:3010',
    'http://localhost:3000', 
    'http://192.168.1.199:3010',
    'http://100.122.130.67:3010',
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
      }
    },
    // Ensure additional fields are included in responses
    modelName: "User"
  },
  
  hooks: {
    user: {
      create: {
        before: async (user) => {
          // Handle Better Auth required fields and Prisma schema compatibility
          const transformedUser = {
            ...user,
            // firstName and lastName are now required - validate they exist
            firstName: user.firstName || (user.name ? user.name.split(' ')[0] : 'User'),
            lastName: user.lastName || (user.name ? user.name.split(' ')[1] || '' : ''),
            role: user.role || 'CUSTOMER'
          };
          
          console.log('🔧 Transformed user data for creation:', {
            email: transformedUser.email,
            firstName: transformedUser.firstName,
            lastName: transformedUser.lastName,
            role: transformedUser.role
          });
          
          return transformedUser;
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
                createdAt: true,
                updatedAt: true
              }
            });
            
            if (fullUser) {
              // Return enhanced user data
              return {
                session,
                user: {
                  ...user,
                  firstName: fullUser.firstName,
                  lastName: fullUser.lastName,
                  role: fullUser.role,
                  isActive: fullUser.isActive,
                  isVerified: fullUser.isVerified
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

module.exports = auth;