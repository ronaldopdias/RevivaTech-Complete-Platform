import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/better-auth-server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    // Only allow setting up admin@revivatech.co.uk
    if (email !== 'admin@revivatech.co.uk') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Use Better Auth API to create/update the account
    try {
      // Use Better Auth's signUp endpoint to reset the password
      const result = await auth.api.signUpEmail({
        email: email,
        password: password,
        name: "Admin User",
        firstName: "Admin", 
        lastName: "User",
        role: "SUPER_ADMIN"
      });
      
      console.log('Admin setup result:', result);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Admin password set successfully' 
      });
      
    } catch (signUpError: any) {
      // If user already exists, try to update the password directly in database
      console.log('SignUp failed, trying direct database update:', signUpError.message);
      
      // Direct database update approach using Better Auth's database connection
      const { Pool } = require('pg');
      const crypto = require('crypto');
      
      const pool = new Pool({
        connectionString: process.env.BETTER_AUTH_DATABASE_URL || process.env.DATABASE_URL || 'postgresql://revivatech:revivatech_password@revivatech_database:5432/revivatech'
      });
      
      // Generate salt and hash password (simplified approach)
      const salt = crypto.randomBytes(32).toString('hex');
      const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha256').toString('hex');
      const hashedPassword = `${salt}:${hash}`;
      
      // Update the account password
      await pool.query(
        'UPDATE account SET password = $1 WHERE "userId" = (SELECT id FROM "user" WHERE email = $2)',
        [hashedPassword, email]
      );
      
      await pool.end();
      
      return NextResponse.json({ 
        success: true, 
        message: 'Admin password updated successfully' 
      });
    }

  } catch (error) {
    console.error('Setup admin error:', error);
    return NextResponse.json({ 
      error: 'Failed to setup admin', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}