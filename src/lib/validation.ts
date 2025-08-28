import { z } from 'zod';

// Registration validation schema
export const registrationSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be no more than 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .transform(val => val.trim().toLowerCase()),
  
  email: z
    .string()
    .email('Please enter a valid email address')
    .max(255, 'Email must be no more than 255 characters')
    .transform(val => val.trim().toLowerCase()),
  
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be no more than 100 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  
  invitationCode: z
    .string()
    .min(6, 'Invitation code must be at least 6 characters')
    .max(50, 'Invitation code must be no more than 50 characters')
    .transform(val => val.trim().toUpperCase())
});

// Login validation schema
export const loginSchema = z.object({
  username: z
    .string()
    .min(1, 'Username or email is required')
    .max(255, 'Username or email is too long')
    .transform(val => val.trim().toLowerCase()),
  
  password: z
    .string()
    .min(1, 'Password is required')
    .max(100, 'Password is too long')
});

// Invitation code creation schema (admin)
export const createInvitationCodeSchema = z.object({
  department: z
    .string()
    .max(100, 'Department name must be no more than 100 characters')
    .optional()
    .transform(val => val?.trim()),
  
  maxUses: z
    .number()
    .min(1, 'Maximum uses must be at least 1')
    .max(100, 'Maximum uses must be no more than 100')
    .default(10),
  
  expiresAt: z
    .string()
    .datetime('Please provide a valid date and time')
    .transform(val => new Date(val)),
  
  description: z
    .string()
    .max(255, 'Description must be no more than 255 characters')
    .optional()
    .transform(val => val?.trim()),
  
  prefix: z
    .string()
    .max(20, 'Prefix must be no more than 20 characters')
    .regex(/^[A-Z0-9_]*$/, 'Prefix can only contain uppercase letters, numbers, and underscores')
    .optional()
    .transform(val => val?.trim().toUpperCase())
});

// Product validation schema (for Phase 2)
export const productSchema = z.object({
  productId: z
    .string()
    .min(1, 'Product ID is required')
    .max(50, 'Product ID must be no more than 50 characters')
    .transform(val => val.trim()),
  
  productName: z
    .string()
    .min(1, 'Product name is required')
    .max(500, 'Product name must be no more than 500 characters')
    .transform(val => val.trim()),
  
  openingInventory: z
    .number()
    .min(0, 'Opening inventory cannot be negative')
    .int('Opening inventory must be a whole number')
});

// Daily data validation schema (for Phase 2)
export const dailyDataSchema = z.object({
  daySequence: z
    .number()
    .min(1, 'Day sequence must be between 1 and 3')
    .max(3, 'Day sequence must be between 1 and 3')
    .int('Day sequence must be a whole number'),
  
  procurementQty: z
    .number()
    .min(0, 'Procurement quantity cannot be negative')
    .int('Procurement quantity must be a whole number')
    .nullable()
    .optional(),
  
  procurementPrice: z
    .number()
    .min(0, 'Procurement price cannot be negative')
    .nullable()
    .optional(),
  
  salesQty: z
    .number()
    .min(0, 'Sales quantity cannot be negative')
    .int('Sales quantity must be a whole number')
    .nullable()
    .optional(),
  
  salesPrice: z
    .number()
    .min(0, 'Sales price cannot be negative')
    .nullable()
    .optional()
});

// Environment variables validation
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL URL'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters long'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL').optional()
});

// Type exports for TypeScript
export type RegistrationInput = z.infer<typeof registrationSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateInvitationCodeInput = z.infer<typeof createInvitationCodeSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type DailyDataInput = z.infer<typeof dailyDataSchema>;
export type EnvConfig = z.infer<typeof envSchema>;

// Validation helper function
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
} {
  try {
    const result = schema.safeParse(data);
    
    if (result.success) {
      return {
        success: true,
        data: result.data
      };
    } else {
      const errors: Record<string, string> = {};
      result.error.issues.forEach(issue => {
        const path = issue.path.join('.');
        errors[path] = issue.message;
      });
      
      return {
        success: false,
        errors
      };
    }
  } catch (error) {
    console.error('Validation error:', error);
    return {
      success: false,
      errors: { _general: 'Validation failed' }
    };
  }
}