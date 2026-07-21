import { z } from 'zod';

export const profileUpdateSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required'),
  rollNumber: z.string().trim().min(1, 'Roll number is required'),
  branch: z.enum(['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL'], {
    errorMap: () => ({
      message: 'Branch must be one of: CSE, ECE, EEE, MECH, CIVIL',
    }),
  }),
  college: z.string().trim().min(1, 'College name is required'),
  targetCompanies: z.array(z.string().trim().min(1)).default([]),
});
