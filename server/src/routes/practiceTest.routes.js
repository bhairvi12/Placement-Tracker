import { Router } from 'express';
import {
  startPracticeSession,
  getPracticeSession,
  submitPracticeSession,
  getPracticeHistory,
  getPracticeHistoryBySubject,
} from '../controllers/practiceTest.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';
import { z } from 'zod';

const router = Router();

// Zod validation schema for starting session
const startSessionSchema = z.object({
  subject: z.enum(['APTITUDE', 'CODING', 'VERBAL', 'QUANT', 'DSA'], {
    errorMap: () => ({
      message: 'Subject must be one of: APTITUDE, CODING, VERBAL, QUANT, DSA',
    }),
  }),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'easy', 'medium', 'hard'], {
    errorMap: () => ({
      message: 'Difficulty must be one of: EASY, MEDIUM, HARD',
    }),
  }),
  questionCount: z.number().min(1).max(20).optional().default(5),
});

// Zod validation schema for submitting session
const submitSessionSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().min(1, 'questionId is required'),
      userAnswer: z.string().trim().default(''),
    })
  ),
  timeTaken: z.number().min(0).optional().default(0),
});

router.use(authMiddleware);

// Define static routes before parameterized sessions to avoid path conflicts
router.post('/start', validate(startSessionSchema), startPracticeSession);
router.get('/history', getPracticeHistory);
router.get('/history/:subject', getPracticeHistoryBySubject);

router.get('/:sessionId', getPracticeSession);
router.post('/:sessionId/submit', validate(submitSessionSchema), submitPracticeSession);

export default router;
