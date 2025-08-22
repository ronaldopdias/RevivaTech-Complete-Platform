import { emailService } from './emailService';

export interface VerificationEmailOptions {
  email: string;
  firstName: string;
  userId?: string;
  callbackUrl?: string;
  expiresIn?: number; // in hours
}

export interface VerificationResult {
  success: boolean;
  error?: string;
  verificationId?: string;
  emailId?: string;
  expiresAt?: Date;
}

class EmailVerificationService {
  private readonly defaultExpiresIn = 24; // 24 hours
  private readonly baseUrl = process.env.BETTER_AUTH_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010';

  /**
   * Send email verification to user
   */
  async sendVerificationEmail(options: VerificationEmailOptions): Promise<VerificationResult> {
    try {
      const {
        email,
        firstName,
        userId,
        callbackUrl = '/auth/verify-success',
        expiresIn = this.defaultExpiresIn
      } = options;

      // Generate verification token (in production, this would be stored in database)
      const verificationToken = this.generateVerificationToken(email, userId);
      const verificationCode = this.generateVerificationCode();
      
      // Calculate expiration
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expiresIn);

      // Build verification URL
      const verificationUrl = this.buildVerificationUrl(verificationToken, callbackUrl);

      // Send verification email
      const response = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          firstName,
          verificationUrl,
          verificationCode,
          expiresIn: `${expiresIn} hours`
        })
      });

      const result = await response.json();

      if (result.success) {
        // In production, store verification token in database with expiration
        this.storeVerificationToken(verificationToken, {
          email,
          userId,
          expiresAt,
          used: false
        });

        return {
          success: true,
          verificationId: verificationToken,
          emailId: result.emailId,
          expiresAt
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to send verification email'
        };
      }

    } catch (error) {
      console.error('Email verification service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Verify email verification token
   */
  async verifyEmailToken(token: string): Promise<{ valid: boolean; email?: string; userId?: string; error?: string }> {
    try {
      // In production, check token against database
      const tokenData = this.getStoredVerificationToken(token);
      
      if (!tokenData) {
        return {
          valid: false,
          error: 'Invalid or expired verification token'
        };
      }

      if (tokenData.used) {
        return {
          valid: false,
          error: 'Verification token has already been used'
        };
      }

      if (new Date() > tokenData.expiresAt) {
        return {
          valid: false,
          error: 'Verification token has expired'
        };
      }

      // Mark token as used
      this.markTokenAsUsed(token);

      return {
        valid: true,
        email: tokenData.email,
        userId: tokenData.userId
      };

    } catch (error) {
      console.error('Token verification error:', error);
      return {
        valid: false,
        error: 'Token verification failed'
      };
    }
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(email: string): Promise<VerificationResult> {
    try {
      // In production, look up user by email from database
      const userData = this.getUserByEmail(email);
      
      if (!userData) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Check if user is already verified
      if (userData.emailVerified) {
        return {
          success: false,
          error: 'Email is already verified'
        };
      }

      // Send new verification email
      return await this.sendVerificationEmail({
        email: userData.email,
        firstName: userData.firstName,
        userId: userData.id
      });

    } catch (error) {
      console.error('Resend verification error:', error);
      return {
        success: false,
        error: 'Failed to resend verification email'
      };
    }
  }

  /**
   * Check if email is verified
   */
  async isEmailVerified(email: string): Promise<boolean> {
    try {
      // In production, check database
      const userData = this.getUserByEmail(email);
      return userData?.emailVerified || false;
    } catch (error) {
      console.error('Email verification check error:', error);
      return false;
    }
  }

  /**
   * Mark email as verified in database
   */
  async markEmailAsVerified(email: string, userId?: string): Promise<boolean> {
    try {
      // In production, update user record in database
      
      // Update user verification status
      // await userRepository.updateEmailVerification(email, true);
      
      return true;
    } catch (error) {
      console.error('Mark email verified error:', error);
      return false;
    }
  }

  // Private helper methods

  private generateVerificationToken(email: string, userId?: string): string {
    // In production, use crypto.randomBytes or similar
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    return `verify_${timestamp}_${random}_${Buffer.from(email).toString('base64')}`;
  }

  private generateVerificationCode(): string {
    // Generate 6-digit verification code
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private buildVerificationUrl(token: string, callbackUrl: string): string {
    const params = new URLSearchParams({
      token,
      redirect: callbackUrl
    });
    return `${this.baseUrl}/auth/verify-email?${params.toString()}`;
  }

  // Mock storage methods (replace with database in production)
  private verificationTokens = new Map<string, any>();

  private storeVerificationToken(token: string, data: any): void {
    this.verificationTokens.set(token, data);
    
    // Auto-cleanup expired tokens
    setTimeout(() => {
      this.verificationTokens.delete(token);
    }, data.expiresAt.getTime() - Date.now());
  }

  private getStoredVerificationToken(token: string): any {
    return this.verificationTokens.get(token);
  }

  private markTokenAsUsed(token: string): void {
    const tokenData = this.verificationTokens.get(token);
    if (tokenData) {
      tokenData.used = true;
      this.verificationTokens.set(token, tokenData);
    }
  }

  private getUserByEmail(email: string): any {
    // Mock user data - replace with database lookup
    return {
      id: 'user_' + Date.now(),
      email,
      firstName: 'Test User',
      emailVerified: false
    };
  }
}

// Export singleton instance
export const emailVerificationService = new EmailVerificationService();
export default emailVerificationService;