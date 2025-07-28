import { baseLayout } from './base-layout';

export interface EmailVerificationData {
  firstName: string;
  email: string;
  verificationUrl: string;
  verificationCode?: string;
  expiresIn?: string;
}

export function render(data: EmailVerificationData): string {
  const { firstName, email, verificationUrl, verificationCode, expiresIn = '24 hours' } = data;
  
  const content = `
    <div class="header-section">
      <h1>📧 Email Verification Required</h1>
      <p class="header-subtitle">Please verify your email address to complete registration</p>
    </div>
    
    <div class="content-section">
      <h2>Hi ${firstName},</h2>
      
      <p>Thank you for creating an account with RevivaTech! To complete your registration and start using our services, we need to verify your email address.</p>
      
      <div class="highlight-box">
        <h3>🔐 Account Details</h3>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Verification expires:</strong> ${expiresIn}</p>
        ${verificationCode ? `<p><strong>Verification Code:</strong> <code class="verification-code">${verificationCode}</code></p>` : ''}
      </div>
      
      <div class="action-section">
        <h3>✅ Verify Your Email</h3>
        <p>Click the button below to verify your email address and activate your account:</p>
        
        <div class="button-container">
          <a href="${verificationUrl}" class="primary-button">Verify Email Address</a>
        </div>
        
        <p class="small-text">If the button doesn't work, copy and paste this link into your browser:</p>
        <p class="verification-link">${verificationUrl}</p>
      </div>
      
      <div class="info-section">
        <h3>🛡️ Why do we verify emails?</h3>
        <ul>
          <li><strong>Security:</strong> Protects your account from unauthorized access</li>
          <li><strong>Communication:</strong> Ensures you receive important booking updates</li>
          <li><strong>Recovery:</strong> Allows password reset and account recovery</li>
          <li><strong>Service Quality:</strong> Helps us provide better customer support</li>
        </ul>
      </div>
      
      <div class="next-steps">
        <h3>🎯 What's Next?</h3>
        <div class="steps-grid">
          <div class="step">
            <div class="step-number">1</div>
            <div class="step-content">
              <strong>Verify Email</strong>
              <span>Click the verification link above</span>
            </div>
          </div>
          <div class="step">
            <div class="step-number">2</div>
            <div class="step-content">
              <strong>Complete Profile</strong>
              <span>Add additional details if needed</span>
            </div>
          </div>
          <div class="step">
            <div class="step-number">3</div>
            <div class="step-content">
              <strong>Book Repair</strong>
              <span>Start using our repair services</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="help-section">
        <h3>❓ Need Help?</h3>
        <p>If you're having trouble with email verification or didn't request this account:</p>
        <ul>
          <li><strong>Contact Support:</strong> <a href="mailto:support@revivatech.co.uk">support@revivatech.co.uk</a></li>
          <li><strong>Phone:</strong> +44 207 123 4567</li>
          <li><strong>WhatsApp:</strong> +44 7700 900 123</li>
        </ul>
        
        <p class="security-note">
          🔒 <strong>Security Note:</strong> This verification link is unique to your account and expires in ${expiresIn}. 
          If you didn't create this account, please ignore this email or contact our support team.
        </p>
      </div>
    </div>
  `;

  return baseLayout(content);
}

export default { render };