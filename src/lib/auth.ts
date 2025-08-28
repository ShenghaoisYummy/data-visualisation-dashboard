import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/database';
import { User, UserStatus } from '@/generated/prisma';

export interface JWTPayload {
  userId: string;
  username: string;
  email: string;
  status: UserStatus;
}

export interface AuthResult {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
  errors?: Record<string, string>;
}

export class AuthService {
  /**
   * Hash a password using bcrypt
   * @param password Plain text password
   * @returns Hashed password
   */
  static async hashPassword(password: string): Promise<string> {
    try {
      return await bcrypt.hash(password, 12);
    } catch (error) {
      console.error('Error hashing password:', error);
      throw new Error('Failed to hash password');
    }
  }

  /**
   * Compare a password with its hash
   * @param password Plain text password
   * @param hashedPassword Hashed password from database
   * @returns Whether passwords match
   */
  static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      console.error('Error comparing password:', error);
      return false;
    }
  }

  /**
   * Generate JWT token with user information
   * @param user User data to encode in token
   * @returns JWT token
   */
  static generateToken(user: User): string {
    try {
      const payload: JWTPayload = {
        userId: user.id,
        username: user.username,
        email: user.email,
        status: user.status,
      };

      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw new Error('JWT_SECRET environment variable is not set');
      }

      return jwt.sign(payload, secret, { 
        expiresIn: '24h',
        issuer: 'data-viz-dashboard'
      });
    } catch (error) {
      console.error('Error generating token:', error);
      throw new Error('Failed to generate authentication token');
    }
  }

  /**
   * Verify and decode JWT token
   * @param token JWT token to verify
   * @returns Decoded payload or null if invalid
   */
  static verifyToken(token: string): JWTPayload | null {
    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw new Error('JWT_SECRET environment variable is not set');
      }

      const decoded = jwt.verify(token, secret, {
        issuer: 'data-viz-dashboard'
      }) as JWTPayload;

      return decoded;
    } catch (error) {
      console.error('Error verifying token:', error);
      return null;
    }
  }

  /**
   * Authenticate user login
   * @param username Username or email
   * @param password Plain text password
   * @returns Authentication result
   */
  static async login(username: string, password: string): Promise<AuthResult> {
    try {
      // Find user by username or email
      const user = await db.user.findFirst({
        where: {
          OR: [
            { username: username.trim().toLowerCase() },
            { email: username.trim().toLowerCase() }
          ]
        }
      });

      if (!user) {
        return {
          success: false,
          message: 'Invalid credentials'
        };
      }

      // Check if user is active
      if (user.status !== UserStatus.ACTIVE) {
        const statusMessages = {
          [UserStatus.SUSPENDED]: 'Your account has been suspended. Please contact your administrator.',
          [UserStatus.TERMINATED]: 'Your account has been terminated. Please contact your administrator.'
        };
        
        return {
          success: false,
          message: statusMessages[user.status] || 'Your account is not active'
        };
      }

      // Verify password
      const isPasswordValid = await this.comparePassword(password, user.password);
      if (!isPasswordValid) {
        return {
          success: false,
          message: 'Invalid credentials'
        };
      }

      // Update last login time
      await db.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });

      // Generate token
      const token = this.generateToken(user);

      return {
        success: true,
        message: 'Login successful',
        user,
        token
      };
    } catch (error) {
      console.error('Error during login:', error);
      return {
        success: false,
        message: 'An error occurred during login'
      };
    }
  }

  /**
   * Register a new user with invitation code
   * @param userData User registration data
   * @returns Registration result
   */
  static async register(userData: {
    username: string;
    email: string;
    password: string;
    invitationCode: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<AuthResult> {
    try {
      const { username, email, password, invitationCode, ipAddress, userAgent } = userData;

      // Validate invitation code first
      const { InvitationCodeService } = await import('@/lib/invitation-codes');
      const codeValidation = await InvitationCodeService.validateCode(invitationCode);
      
      if (!codeValidation.valid) {
        return {
          success: false,
          message: codeValidation.reason || 'Invalid invitation code',
          errors: { invitationCode: codeValidation.reason || 'Invalid invitation code' }
        };
      }

      // Check if username or email already exists
      const existingUser = await db.user.findFirst({
        where: {
          OR: [
            { username: username.trim().toLowerCase() },
            { email: email.trim().toLowerCase() }
          ]
        }
      });

      if (existingUser) {
        const field = existingUser.username.toLowerCase() === username.trim().toLowerCase() 
          ? 'username' 
          : 'email';
        
        return {
          success: false,
          message: `${field === 'username' ? 'Username' : 'Email'} already exists`,
          errors: { [field]: `This ${field} is already taken` }
        };
      }

      // Hash password
      const hashedPassword = await this.hashPassword(password);

      // Create user
      const newUser = await db.user.create({
        data: {
          username: username.trim().toLowerCase(),
          email: email.trim().toLowerCase(),
          password: hashedPassword,
          invitationCodeUsed: invitationCode.trim().toUpperCase(),
          status: UserStatus.ACTIVE
        }
      });

      // Update invitation code usage
      if (codeValidation.codeData) {
        await InvitationCodeService.useCode(codeValidation.codeData.id, email);
      }

      // Create registration audit log
      await db.registrationAudit.create({
        data: {
          userId: newUser.id,
          invitationCode: invitationCode.trim().toUpperCase(),
          userEmail: email.trim().toLowerCase(),
          ipAddress,
          userAgent
        }
      });

      // Generate token for immediate login
      const token = this.generateToken(newUser);

      return {
        success: true,
        message: 'Registration successful',
        user: newUser,
        token
      };
    } catch (error) {
      console.error('Error during registration:', error);
      return {
        success: false,
        message: 'An error occurred during registration'
      };
    }
  }

  /**
   * Get user by ID and verify status
   * @param userId User ID
   * @returns User data if active, null otherwise
   */
  static async getActiveUser(userId: string): Promise<User | null> {
    try {
      const user = await db.user.findFirst({
        where: {
          id: userId,
          status: UserStatus.ACTIVE
        }
      });

      return user;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  /**
   * Update user status (for admin operations)
   * @param userId User ID
   * @param newStatus New user status
   * @returns Success status
   */
  static async updateUserStatus(userId: string, newStatus: UserStatus): Promise<boolean> {
    try {
      await db.user.update({
        where: { id: userId },
        data: { 
          status: newStatus,
          updatedAt: new Date()
        }
      });

      return true;
    } catch (error) {
      console.error('Error updating user status:', error);
      return false;
    }
  }

  /**
   * Bulk deactivate users by invitation code (emergency use)
   * @param invitationCode Code used for registration
   * @returns Number of users affected
   */
  static async bulkDeactivateByCode(invitationCode: string): Promise<number> {
    try {
      const result = await db.user.updateMany({
        where: { 
          invitationCodeUsed: invitationCode.trim().toUpperCase(),
          status: UserStatus.ACTIVE
        },
        data: { 
          status: UserStatus.SUSPENDED,
          updatedAt: new Date()
        }
      });

      return result.count;
    } catch (error) {
      console.error('Error bulk deactivating users:', error);
      return 0;
    }
  }
}