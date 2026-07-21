import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  fullName: z.string().trim().min(1, 'Full name is required'),
  rollNumber: z.string().trim().min(1, 'Roll number is required'),
  branch: z.enum(['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL'], {
    errorMap: () => ({
      message: 'Branch must be one of: CSE, ECE, EEE, MECH, CIVIL',
    }),
  }),
  college: z.string().trim().min(1, 'College name is required'),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
  role: z.enum(['student', 'admin']).optional(),
});
