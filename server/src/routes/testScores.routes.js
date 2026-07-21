import { Router } from 'express';
import {
  getLatestScores,
  logPractice,
  getSubjectHistory,
  getBenchmark,
} from '../controllers/testScores.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';
import { z } from 'zod';

const router = Router();

const practiceSchema = z.object({
  subject: z.enum(['APTITUDE', 'CODING', 'VERBAL', 'QUANT', 'DSA'], {
    errorMap: () => ({
      message: 'Subject must be one of: APTITUDE, CODING, VERBAL, QUANT, DSA',
    }),
  }),
  difficulty: z
    .enum(['easy', 'medium', 'hard', 'EASY', 'MEDIUM', 'HARD'], {
      errorMap: () => ({
        message: 'Difficulty must be one of: easy, medium, hard',
      }),
    })
    .transform((val) => val.toLowerCase()),
});

router.use(authMiddleware);

router.get('/', getLatestScores);
router.post('/practice', (req, res) => {
  return res.status(400).json({
    success: false,
    message: 'Use POST /api/v1/practice/start for real practice tests',
  });
});
router.get('/history/:subject', getSubjectHistory);
router.get('/benchmark', getBenchmark);

export default router;
