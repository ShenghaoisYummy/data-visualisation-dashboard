import { db } from '@/lib/database';
import { InvitationCode } from '@/generated/prisma';

export interface CodeValidationResult {
  valid: boolean;
  reason?: string;
  codeData?: InvitationCode;
}

export class InvitationCodeService {
  /**
   * Generate secure random invitation codes
   * @param prefix Optional prefix for the code (e.g., "STORE01")
   * @returns Generated invitation code
   */
  static generateCode(prefix?: string): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const result = prefix ? `${prefix}_${timestamp}${random}` : `STAFF_${timestamp}${random}`;
    return result.toUpperCase();
  }

  /**
   * Validate invitation code with comprehensive checks
   * @param code The invitation code to validate
   * @returns Validation result with details
   */
  static async validateCode(code: string): Promise<CodeValidationResult> {
    try {
      const inviteCode = await db.invitationCode.findFirst({
        where: {
          code: code.trim().toUpperCase(),
          isActive: true,
          expiresAt: { gt: new Date() },
          currentUses: { lt: db.invitationCode.fields.maxUses }
        }
      });

      if (!inviteCode) {
        // Check specific reasons for rejection
        const existingCode = await db.invitationCode.findFirst({
          where: { code: code.trim().toUpperCase() }
        });

        if (!existingCode) {
          return { valid: false, reason: 'Invalid invitation code' };
        }

        if (!existingCode.isActive) {
          return { valid: false, reason: 'Invitation code has been deactivated' };
        }

        if (existingCode.expiresAt <= new Date()) {
          return { valid: false, reason: 'Invitation code has expired' };
        }

        if (existingCode.currentUses >= existingCode.maxUses) {
          return { valid: false, reason: 'Invitation code has reached maximum uses' };
        }

        return { valid: false, reason: 'Invitation code is no longer valid' };
      }

      return { valid: true, codeData: inviteCode };
    } catch (error) {
      console.error('Error validating invitation code:', error);
      return { valid: false, reason: 'Error validating invitation code' };
    }
  }

  /**
   * Use an invitation code (increment usage count)
   * @param codeId The ID of the invitation code
   * @param userEmail Email of user who used the code
   */
  static async useCode(codeId: string, userEmail: string): Promise<void> {
    try {
      await db.invitationCode.update({
        where: { id: codeId },
        data: { currentUses: { increment: 1 } }
      });
    } catch (error) {
      console.error('Error using invitation code:', error);
      throw new Error('Failed to update invitation code usage');
    }
  }

  /**
   * Create a new invitation code
   * @param data Code creation parameters
   * @returns Created invitation code
   */
  static async createCode(data: {
    department?: string;
    maxUses?: number;
    expiresAt: Date;
    description?: string;
    createdBy: string;
    prefix?: string;
  }): Promise<InvitationCode> {
    try {
      const code = this.generateCode(data.prefix);
      
      return await db.invitationCode.create({
        data: {
          code,
          maxUses: data.maxUses || 10,
          expiresAt: data.expiresAt,
          department: data.department,
          description: data.description,
          createdBy: data.createdBy,
        }
      });
    } catch (error) {
      console.error('Error creating invitation code:', error);
      throw new Error('Failed to create invitation code');
    }
  }

  /**
   * Deactivate an invitation code immediately
   * @param codeId The ID of the code to deactivate
   */
  static async deactivateCode(codeId: string): Promise<void> {
    try {
      await db.invitationCode.update({
        where: { id: codeId },
        data: { isActive: false }
      });
    } catch (error) {
      console.error('Error deactivating invitation code:', error);
      throw new Error('Failed to deactivate invitation code');
    }
  }

  /**
   * Get all invitation codes with usage statistics
   * @param activeOnly Whether to return only active codes
   * @returns List of invitation codes
   */
  static async getCodes(activeOnly: boolean = false): Promise<InvitationCode[]> {
    try {
      return await db.invitationCode.findMany({
        where: activeOnly ? { isActive: true } : {},
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      console.error('Error fetching invitation codes:', error);
      throw new Error('Failed to fetch invitation codes');
    }
  }

  /**
   * Clean up expired codes (mark as inactive)
   * @returns Number of codes cleaned up
   */
  static async cleanupExpiredCodes(): Promise<number> {
    try {
      const result = await db.invitationCode.updateMany({
        where: {
          expiresAt: { lte: new Date() },
          isActive: true
        },
        data: { isActive: false }
      });

      return result.count;
    } catch (error) {
      console.error('Error cleaning up expired codes:', error);
      return 0;
    }
  }
}