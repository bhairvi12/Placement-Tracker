import { z } from 'zod';

export const certificationSchema = z.object({
  name: z.string().trim().min(1, 'Certification name is required'),
  platform: z.string().trim().optional(),
  status: z.enum(['completed', 'in_progress', 'planned']).default('planned'),
  progressPercent: z.number().min(0).max(100).default(0),
  completedDate: z
    .preprocess((val) => (val ? new Date(val) : null), z.date().nullable())
    .optional(),
});
