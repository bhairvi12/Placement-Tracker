import * as geminiService from '../services/gemini.service.js';
import ActivityFeed from '../models/ActivityFeed.model.js';

// In-memory sliding-window rate limiter state
// Key: userId string, Value: array of timestamps (numbers) of AI requests
const aiRequestLogs = new Map();

/**
 * Checks and logs AI requests for a user against hourly limit (max 20 requests per hour).
 * @param {string} userId - User identifier
 * @returns {boolean} - True if allowed, false if rate limited
 */
const checkAiRateLimit = (userId) => {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;

  if (!aiRequestLogs.has(userId)) {
    aiRequestLogs.set(userId, [now]);
    return true;
  }

  const timestamps = aiRequestLogs.get(userId);
  // Keep only requests from the last hour
  const recentTimestamps = timestamps.filter((time) => now - time < oneHour);

  if (recentTimestamps.length >= 20) {
    return false;
  }

  recentTimestamps.push(now);
  aiRequestLogs.set(userId, recentTimestamps);
  return true;
};

/**
 * POST /api/v1/ai/analyze-resume
 */
export const handleAnalyzeResume = async (req, res, next) => {
  try {
    if (!checkAiRateLimit(req.user._id.toString())) {
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded. Max 20 AI requests per hour are allowed.',
      });
    }

    const { resumeText, targetRole } = req.body;
    if (!resumeText || !targetRole) {
      return res.status(400).json({
        success: false,
        message: 'resumeText and targetRole are required.',
      });
    }

    const result = await geminiService.analyzeResume(resumeText, targetRole);

    // Log Activity
    await ActivityFeed.create({
      userId: req.user._id,
      actionType: 'AI_RESUME_ANALYSIS',
      description: `Invoked AI resume analysis for target role: ${targetRole}`,
    });

    res.status(200).json({
      success: true,
      message: 'Resume analysis generated successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/ai/interview-questions
 */
export const handleInterviewQuestions = async (req, res, next) => {
  try {
    if (!checkAiRateLimit(req.user._id.toString())) {
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded. Max 20 AI requests per hour are allowed.',
      });
    }

    const { company, roundType, skills } = req.body;
    if (!company || !roundType || !skills) {
      return res.status(400).json({
        success: false,
        message: 'company, roundType, and skills are required.',
      });
    }

    const result = await geminiService.generateInterviewQuestions(
      company,
      roundType,
      skills
    );

    // Log Activity
    await ActivityFeed.create({
      userId: req.user._id,
      actionType: 'AI_QUESTIONS_GENERATE',
      description: `Generated AI interview questions for ${company} (${roundType})`,
    });

    res.status(200).json({
      success: true,
      message: 'Interview questions generated successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/ai/evaluate-answer
 */
export const handleEvaluateAnswer = async (req, res, next) => {
  try {
    if (!checkAiRateLimit(req.user._id.toString())) {
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded. Max 20 AI requests per hour are allowed.',
      });
    }

    const { question, answer, topic } = req.body;
    if (!question || !answer || !topic) {
      return res.status(400).json({
        success: false,
        message: 'question, answer, and topic are required.',
      });
    }

    const result = await geminiService.evaluateAnswer(question, answer, topic);

    // Log Activity
    await ActivityFeed.create({
      userId: req.user._id,
      actionType: 'AI_ANSWER_EVALUATE',
      description: `Evaluated practice answer on topic: ${topic}. Score: ${result.score}/10`,
    });

    res.status(200).json({
      success: true,
      message: 'Answer evaluation completed successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/ai/study-plan
 */
export const handleStudyPlan = async (req, res, next) => {
  try {
    if (!checkAiRateLimit(req.user._id.toString())) {
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded. Max 20 AI requests per hour are allowed.',
      });
    }

    const { weakSubjects, targetCompanies, daysAvailable } = req.body;
    if (!weakSubjects || !targetCompanies || !daysAvailable) {
      return res.status(400).json({
        success: false,
        message: 'weakSubjects, targetCompanies, and daysAvailable are required.',
      });
    }

    const result = await geminiService.generateStudyPlan(
      weakSubjects,
      targetCompanies,
      daysAvailable
    );

    // Log Activity
    await ActivityFeed.create({
      userId: req.user._id,
      actionType: 'AI_STUDY_PLAN',
      description: `Created AI personalized study plan for ${daysAvailable} days`,
    });

    res.status(200).json({
      success: true,
      message: 'Study plan created successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/ai/explain-skill
 */
export const handleExplainSkill = async (req, res, next) => {
  try {
    if (!checkAiRateLimit(req.user._id.toString())) {
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded. Max 20 AI requests per hour are allowed.',
      });
    }

    const { skill, company, studentLevel } = req.body;
    if (!skill || !company || !studentLevel) {
      return res.status(400).json({
        success: false,
        message: 'skill, company, and studentLevel are required.',
      });
    }

    const result = await geminiService.explainSkillGap(
      skill,
      company,
      studentLevel
    );

    // Log Activity
    await ActivityFeed.create({
      userId: req.user._id,
      actionType: 'AI_SKILL_EXPLAIN',
      description: `Requested AI explanation for missing skill gap: ${skill}`,
    });

    res.status(200).json({
      success: true,
      message: 'Skill gap breakdown completed successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
