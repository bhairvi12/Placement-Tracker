import { z } from 'zod';

export const skillSchema = z.object({
  name: z.string().trim().min(1, 'Skill name is required'),
  category: z.enum(['LANGUAGE', 'FRAMEWORK', 'TOOL', 'CS_FUNDAMENTAL'], {
    errorMap: () => ({
      message:
        'Category must be one of: LANGUAGE, FRAMEWORK, TOOL, CS_FUNDAMENTAL',
    }),
  }),
  proficiencyLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'], {
    errorMap: () => ({
      message:
        'Proficiency level must be one of: BEGINNER, INTERMEDIATE, ADVANCED',
    }),
  }),
});
