// Backup Codes Management System
// Provides secure backup codes for 2FA recovery

import * as crypto from 'crypto';

// Backup codes configuration
export const BACKUP_CODES_CONFIG = {
  count: 10,
  length: 8,
  format: 'hex', // 'hex' or 'base36'
  minRemaining: 3, // Show warning when fewer than this many codes remain
};

export interface BackupCode {
  id: string;
  code: string;
  used: boolean;
  usedAt?: Date;
  usedFrom?: string; // IP address where code was used
}

export interface BackupCodesData {
  codes: BackupCode[];
  generatedAt: Date;
  version: number;
}

class BackupCodesService {
  // Generate a new set of backup codes
  generateBackupCodes(count = BACKUP_CODES_CONFIG.count): BackupCode[] {
    const codes: BackupCode[] = [];
    
    for (let i = 0; i < count; i++) {
      const code = this.generateSingleCode();
      codes.push({
        id: crypto.randomUUID(),
        code,
        used: false,
      });
    }
    
    return codes;
  }

  // Generate a single backup code
  private generateSingleCode(): string {
    const bytes = crypto.randomBytes(BACKUP_CODES_CONFIG.length / 2);
    
    if (BACKUP_CODES_CONFIG.format === 'hex') {
      return bytes.toString('hex').toUpperCase();
    } else {
      // Base36 format (alphanumeric)
      const num = BigInt('0x' + bytes.toString('hex'));
      return num.toString(36).toUpperCase().padStart(BACKUP_CODES_CONFIG.length, '0');
    }
  }

  // Validate backup code format
  validateCodeFormat(code: string): boolean {
    const cleanCode = this.cleanCode(code);
    
    if (BACKUP_CODES_CONFIG.format === 'hex') {
      return /^[A-Fa-f0-9]{8}$/.test(cleanCode);
    } else {
      return /^[A-Za-z0-9]{8}$/.test(cleanCode);
    }
  }

  // Clean user input
  cleanCode(input: string): string {
    return input.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  }

  // Verify backup code against stored codes
  verifyBackupCode(inputCode: string, storedCodes: BackupCode[]): {
    valid: boolean;
    codeId?: string;
    remainingCodes: number;
  } {
    const cleanInput = this.cleanCode(inputCode);
    
    if (!this.validateCodeFormat(cleanInput)) {
      return {
        valid: false,
        remainingCodes: this.getRemainingCodesCount(storedCodes),
      };
    }

    // Find matching unused code
    const matchingCode = storedCodes.find(
      code => !code.used && code.code === cleanInput
    );

    if (matchingCode) {
      return {
        valid: true,
        codeId: matchingCode.id,
        remainingCodes: this.getRemainingCodesCount(storedCodes) - 1, // -1 because this code will be used
      };
    }

    return {
      valid: false,
      remainingCodes: this.getRemainingCodesCount(storedCodes),
    };
  }

  // Mark a backup code as used
  markCodeAsUsed(
    codes: BackupCode[], 
    codeId: string, 
    ipAddress?: string
  ): BackupCode[] {
    return codes.map(code => {
      if (code.id === codeId) {
        return {
          ...code,
          used: true,
          usedAt: new Date(),
          usedFrom: ipAddress,
        };
      }
      return code;
    });
  }

  // Get count of remaining (unused) codes
  getRemainingCodesCount(codes: BackupCode[]): number {
    return codes.filter(code => !code.used).length;
  }

  // Check if backup codes are running low
  shouldShowLowCodesWarning(codes: BackupCode[]): boolean {
    const remaining = this.getRemainingCodesCount(codes);
    return remaining <= BACKUP_CODES_CONFIG.minRemaining;
  }

  // Format codes for display (grouped with spaces)
  formatCodesForDisplay(codes: BackupCode[]): string[] {
    return codes
      .filter(code => !code.used)
      .map(code => this.formatSingleCode(code.code));
  }

  // Format single code for display
  formatSingleCode(code: string): string {
    // Add spaces every 4 characters for readability
    return code.replace(/(.{4})/g, '$1 ').trim();
  }

  // Generate printable backup codes document
  generatePrintableDocument(codes: BackupCode[], userEmail: string): {
    title: string;
    content: string;
    footer: string;
  } {
    const formattedCodes = this.formatCodesForDisplay(codes);
    const generatedAt = new Date().toLocaleString();
    
    return {
      title: 'RevivaTech - Two-Factor Authentication Backup Codes',
      content: `
Account: ${userEmail}
Generated: ${generatedAt}

BACKUP CODES:
${formattedCodes.map((code, index) => `${(index + 1).toString().padStart(2, '0')}. ${code}`).join('\n')}

IMPORTANT INSTRUCTIONS:
• Each backup code can only be used once
• Store these codes in a secure location
• Use these codes if you lose access to your authenticator app
• Generate new codes if you suspect these have been compromised
• Contact support if you lose both your authenticator and backup codes
      `,
      footer: `
Generated on ${generatedAt} for ${userEmail}
These codes are confidential - do not share them with anyone.
      `,
    };
  }

  // Export backup codes data for storage
  exportBackupCodesData(codes: BackupCode[]): BackupCodesData {
    return {
      codes,
      generatedAt: new Date(),
      version: 1,
    };
  }

  // Import and validate backup codes data
  importBackupCodesData(data: any): BackupCodesData | null {
    try {
      if (!data || typeof data !== 'object') {
        return null;
      }

      const { codes, generatedAt, version } = data;

      if (!Array.isArray(codes) || !generatedAt || !version) {
        return null;
      }

      // Validate code structure
      const validCodes = codes.every(code => 
        typeof code === 'object' &&
        typeof code.id === 'string' &&
        typeof code.code === 'string' &&
        typeof code.used === 'boolean' &&
        this.validateCodeFormat(code.code)
      );

      if (!validCodes) {
        return null;
      }

      return {
        codes,
        generatedAt: new Date(generatedAt),
        version,
      };
    } catch (error) {
      console.error('Error importing backup codes data:', error);
      return null;
    }
  }

  // Regenerate used codes (keep unused ones)
  regenerateUsedCodes(existingCodes: BackupCode[]): BackupCode[] {
    const unusedCodes = existingCodes.filter(code => !code.used);
    const usedCount = existingCodes.length - unusedCodes.length;
    
    if (usedCount === 0) {
      return existingCodes; // No used codes to regenerate
    }

    // Generate new codes to replace used ones
    const newCodes = this.generateBackupCodes(usedCount);
    
    return [...unusedCodes, ...newCodes];
  }

  // Get usage statistics
  getUsageStatistics(codes: BackupCode[]): {
    total: number;
    used: number;
    remaining: number;
    usagePercentage: number;
    lastUsed?: Date;
  } {
    const total = codes.length;
    const used = codes.filter(code => code.used).length;
    const remaining = total - used;
    const usagePercentage = (used / total) * 100;
    
    // Find most recent usage
    const usedCodes = codes.filter(code => code.used && code.usedAt);
    const lastUsed = usedCodes.length > 0 
      ? new Date(Math.max(...usedCodes.map(code => code.usedAt!.getTime())))
      : undefined;

    return {
      total,
      used,
      remaining,
      usagePercentage,
      lastUsed,
    };
  }

  // Security analysis
  performSecurityAnalysis(codes: BackupCode[]): {
    status: 'secure' | 'warning' | 'critical';
    issues: string[];
    recommendations: string[];
  } {
    const stats = this.getUsageStatistics(codes);
    const issues: string[] = [];
    const recommendations: string[] = [];
    let status: 'secure' | 'warning' | 'critical' = 'secure';

    // Check remaining codes
    if (stats.remaining === 0) {
      status = 'critical';
      issues.push('No backup codes remaining');
      recommendations.push('Generate new backup codes immediately');
    } else if (stats.remaining <= BACKUP_CODES_CONFIG.minRemaining) {
      status = 'warning';
      issues.push(`Only ${stats.remaining} backup codes remaining`);
      recommendations.push('Consider generating new backup codes');
    }

    // Check for old codes
    const oldThreshold = 90 * 24 * 60 * 60 * 1000; // 90 days
    const hasOldCodes = codes.some(code => {
      const codeAge = Date.now() - new Date(code.usedAt || 0).getTime();
      return codeAge > oldThreshold;
    });

    if (hasOldCodes) {
      if (status === 'secure') status = 'warning';
      issues.push('Some backup codes are older than 90 days');
      recommendations.push('Consider regenerating backup codes periodically');
    }

    return { status, issues, recommendations };
  }
}

// Export singleton instance
export const backupCodesService = new BackupCodesService();

// Export utilities
export const backupCodesUtils = {
  // Download backup codes as text file
  downloadAsTextFile: (codes: BackupCode[], userEmail: string): void => {
    const document = backupCodesService.generatePrintableDocument(codes, userEmail);
    const content = `${document.title}\n\n${document.content}\n\n${document.footer}`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `revivatech-backup-codes-${Date.now()}.txt`;
    link.click();
    
    URL.revokeObjectURL(url);
  },

  // Copy backup codes to clipboard
  copyToClipboard: (codes: BackupCode[]): Promise<boolean> => {
    const formattedCodes = backupCodesService.formatCodesForDisplay(codes);
    const text = formattedCodes.join('\n');
    
    return navigator.clipboard.writeText(text)
      .then(() => true)
      .catch(() => false);
  },

  // Print backup codes
  printBackupCodes: (codes: BackupCode[], userEmail: string): void => {
    const document = backupCodesService.generatePrintableDocument(codes, userEmail);
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${document.title}</title>
            <style>
              body { font-family: monospace; line-height: 1.6; }
              .header { text-align: center; margin-bottom: 30px; }
              .codes { margin: 20px 0; }
              .footer { margin-top: 30px; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${document.title}</h1>
            </div>
            <div class="codes">
              <pre>${document.content}</pre>
            </div>
            <div class="footer">
              <pre>${document.footer}</pre>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
    }
  },
};

export default backupCodesService;