import { baseLayout } from './base-layout';

export interface PasswordResetData {
  userName: string;
  resetLink: string;
  expirationTime: string;
  ipAddress?: string;
  browserInfo?: string;
}

export const render = (data: PasswordResetData): string => {
  const content = `
    <h2>Password Reset Request 🔐</h2>
    <p>Hi ${data.userName},</p>
    <p>We received a request to reset the password for your RevivaTech account. If you didn't make this request, you can safely ignore this email.</p>
    
    <div style="text-align: center; margin: 40px 0;">
        <a href="${data.resetLink}" class="button" style="padding: 18px 40px; font-size: 18px;">
            Reset Password
        </a>
    </div>
    
    <div class="info-box">
        <h3>Important Security Information</h3>
        <p>• This link will expire in ${data.expirationTime}</p>
        <p>• You can only use this link once</p>
        <p>• If you didn't request this, please contact us immediately</p>
        ${data.ipAddress ? `<p>• Request made from IP: ${data.ipAddress}</p>` : ''}
        ${data.browserInfo ? `<p>• Browser: ${data.browserInfo}</p>` : ''}
    </div>
    
    <h3>Having trouble?</h3>
    <p>If the button above doesn't work, copy and paste this link into your browser:</p>
    <p style="background-color: #F9FAFB; padding: 15px; border-radius: 8px; word-break: break-all; font-family: monospace; font-size: 14px;">
        ${data.resetLink}
    </p>
    
    <div style="margin-top: 40px; padding: 20px; background-color: #FFF3CD; border-radius: 8px;">
        <p style="margin: 0; color: #856404;">
            <strong>⚠️ Security Tip:</strong> Never share your password reset link with anyone. 
            RevivaTech staff will never ask for your password or reset link.
        </p>
    </div>
    
    <p style="margin-top: 30px; font-size: 14px; color: #8E8E93;">
        If you continue to have problems accessing your account, please contact our support team at 
        support@revivatech.co.uk
    </p>
  `;
  
  const footerContent = `
    <p style="font-size: 14px; color: #8E8E93;">
        This is an automated security email from RevivaTech.<br>
        Please do not reply to this email.
    </p>
    <p style="margin-top: 20px;">
        <a href="https://revivatech.co.uk/security" style="color: #007AFF; font-size: 14px;">
            Learn more about account security
        </a>
    </p>
  `;
  
  return baseLayout(content, footerContent);
};