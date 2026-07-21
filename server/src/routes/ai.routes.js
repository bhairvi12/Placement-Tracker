import { Router } from 'express';
import {
  handleAnalyzeResume,
  handleInterviewQuestions,
  handleEvaluateAnswer,
  handleStudyPlan,
  handleExplainSkill,
} from '../controllers/ai.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';
import { z } from 'zod';

const router = Router();

router.use(authMiddleware);

// Validate Analyze Resume
const analyzeResumeSchema = z.object({
  resumeText: z.string().trim().min(1, 'resumeText is required'),
  targetRole: z.string().trim().min(1, 'targetRole is required'),
});

// Validate Interview Questions
const interviewQuestionsSchema = z.object({
  company: z.string().trim().min(1, 'company is required'),
  roundType: z.string().trim().min(1, 'roundType is required'),
  skills: z.string().trim().min(1, 'skills is required'),
});

// Validate Evaluate Answer
const evaluateAnswerSchema = z.object({
  question: z.string().trim().min(1, 'question is required'),
  answer: z.string().trim().min(1, 'answer is required'),
  topic: z.string().trim().min(1, 'topic is required'),
});

// Validate Study Plan
const studyPlanSchema = z.object({
  weakSubjects: z.union([z.string(), z.array(z.string())]),
  targetCompanies: z.union([z.string(), z.array(z.string())]),
  daysAvailable: z.union([z.number(), z.string()]),
});

// Validate Explain Skill
const explainSkillSchema = z.object({
  skill: z.string().trim().min(1, 'skill name is required'),
  company: z.string().trim().min(1, 'company name is required'),
  studentLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'], {
    errorMap: () => ({
      message: 'studentLevel must be one of: BEGINNER, INTERMEDIATE, ADVANCED',
    }),
  }),
});

router.post('/analyze-resume', validate(analyzeResumeSchema), handleAnalyzeResume);
router.post('/interview-questions', validate(interviewQuestionsSchema), handleInterviewQuestions);
router.post('/evaluate-answer', validate(evaluateAnswerSchema), handleEvaluateAnswer);
router.post('/study-plan', validate(studyPlanSchema), handleStudyPlan);
router.post('/explain-skill', validate(explainSkillSchema), handleExplainSkill);

export default router;
