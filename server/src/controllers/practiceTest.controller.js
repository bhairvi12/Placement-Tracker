import PracticeSession from '../models/PracticeSession.model.js';
import TestScore from '../models/TestScore.model.js';
import ActivityFeed from '../models/ActivityFeed.model.js';
import * as geminiService from '../services/gemini.service.js';

// In-memory sliding-window rate limiter for Practice Sessions (Max 20 per hour per user)
const practiceLimitLogs = new Map();
const MAX_PRACTICE_PER_HOUR = 20;

const checkPracticeRateLimit = (userId) => {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;

  if (!practiceLimitLogs.has(userId)) {
    practiceLimitLogs.set(userId, [now]);
    return true;
  }

  const timestamps = practiceLimitLogs.get(userId);
  const recent = timestamps.filter((time) => now - time < oneHour);

  if (recent.length >= MAX_PRACTICE_PER_HOUR) {
    return false;
  }

  recent.push(now);
  practiceLimitLogs.set(userId, recent);
  return true;
};

/**
 * POST /api/v1/practice/start
 * Starts a new AI practice test session.
 */
export const startPracticeSession = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();
    if (!checkPracticeRateLimit(userId)) {
      return res.status(429).json({
        success: false,
        message: `Rate limit exceeded. Max ${MAX_PRACTICE_PER_HOUR} practice tests per hour are allowed.`,
      });
    }

    const { subject, difficulty, questionCount = 5 } = req.body;
    if (!subject || !difficulty) {
      return res.status(400).json({
        success: false,
        message: 'Subject and difficulty are required.',
      });
    }

    const upperSubject = subject.toUpperCase();
    const upperDifficulty = difficulty.toUpperCase();

    if (!['APTITUDE', 'CODING', 'VERBAL', 'QUANT', 'DSA'].includes(upperSubject)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subject. Must be one of APTITUDE, CODING, VERBAL, QUANT, DSA.',
      });
    }

    if (!['EASY', 'MEDIUM', 'HARD'].includes(upperDifficulty)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid difficulty. Must be EASY, MEDIUM, or HARD.',
      });
    }

    // Call Gemini to generate questions
    const aiData = await geminiService.generatePracticeQuestions(
      upperSubject,
      upperDifficulty,
      questionCount
    );

    const mappedQuestions = aiData.questions.map((q) => ({
      questionId: q.id,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      topic: q.topic || '',
    }));

    // Create session in Database
    const session = await PracticeSession.create({
      userId: req.user._id,
      subject: upperSubject,
      difficulty: upperDifficulty,
      questions: mappedQuestions,
      totalQuestions: mappedQuestions.length,
      status: 'IN_PROGRESS',
    });

    // Strip correctAnswer key from response to prevent cheating
    const returnedSession = session.toObject();
    returnedSession.questions = returnedSession.questions.map((q) => {
      const { correctAnswer, ...rest } = q;
      return rest;
    });

    // Log Activity (Write operation)
    await ActivityFeed.create({
      userId: req.user._id,
      actionType: 'PRACTICE_START',
      description: `Started a new ${upperDifficulty} ${upperSubject} practice session`,
    });

    res.status(201).json({
      success: true,
      message: 'Practice test started successfully',
      data: returnedSession,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/practice/:sessionId
 * Fetch details of a practice session (stripping answers if status is IN_PROGRESS)
 */
export const getPracticeSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const session = await PracticeSession.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Practice session not found.',
      });
    }

    // Ownership check
    if (session.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not own this practice session.',
      });
    }

    const sessionObj = session.toObject();

    // If session is still in progress, hide correct answers
    if (sessionObj.status === 'IN_PROGRESS') {
      sessionObj.questions = sessionObj.questions.map((q) => {
        const { correctAnswer, ...rest } = q;
        return rest;
      });
    }

    res.status(200).json({
      success: true,
      message: 'Practice session retrieved successfully',
      data: sessionObj,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/practice/:sessionId/submit
 * Submits answers, evaluates them via Gemini, updates user stats and returns results.
 */
export const submitPracticeSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { answers, timeTaken = 0 } = req.body;

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: 'Answers array is required.',
      });
    }

    const session = await PracticeSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Practice session not found.',
      });
    }

    // Ownership check
    if (session.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not own this practice session.',
      });
    }

    if (session.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Practice session has already been submitted.',
      });
    }

    // Map user answers for quick lookup
    const userAnswersMap = {};
    answers.forEach((ans) => {
      userAnswersMap[ans.questionId] = ans.userAnswer;
    });

    // Prepare questions array to feed to Gemini evaluator
    const evalInput = session.questions.map((q) => ({
      questionId: q.questionId,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      userAnswer: userAnswersMap[q.questionId] || '',
      topic: q.topic || '',
    }));

    // Call Gemini API to evaluate answers
    const evaluation = await geminiService.evaluatePracticeAnswers(
      session.subject,
      evalInput
    );

    // Update individual questions status with AI evaluation feedback
    let correctCount = 0;
    const updatedQuestions = session.questions.map((q) => {
      const aiRes =
        evaluation.results.find((r) => r.questionId === q.questionId) || {};
      const isCorrect = aiRes.isCorrect === true;
      if (isCorrect) {
        correctCount += 1;
      }

      q.userAnswer = userAnswersMap[q.questionId] || '';
      q.isCorrect = isCorrect;
      q.aiFeedback = aiRes.feedback || '';
      return q;
    });

    // Calculate score percentage
    const scorePercentage = (correctCount / session.totalQuestions) * 100;
    const roundedScore = Math.round(scorePercentage * 100) / 100;

    // Update Practice Session values
    session.status = 'COMPLETED';
    session.completedAt = new Date();
    session.timeTaken = timeTaken;
    session.correctAnswers = correctCount;
    session.scorePercentage = roundedScore;
    session.questions = updatedQuestions;
    await session.save();

    // Recalculate Running Averages in TestScore
    const completedSessions = await PracticeSession.find({
      userId: req.user._id,
      subject: session.subject,
      status: 'COMPLETED',
    });

    const sumScores = completedSessions.reduce((sum, s) => sum + s.scorePercentage, 0);
    const avgScore = completedSessions.length > 0 ? sumScores / completedSessions.length : 0;

    const easySolved = completedSessions.filter((s) => s.difficulty === 'EASY').length;
    const mediumSolved = completedSessions.filter((s) => s.difficulty === 'MEDIUM').length;
    const hardSolved = completedSessions.filter((s) => s.difficulty === 'HARD').length;

    let testScore = await TestScore.findOne({
      userId: req.user._id,
      subject: session.subject,
    });

    if (!testScore) {
      testScore = new TestScore({
        userId: req.user._id,
        subject: session.subject,
      });
    }

    testScore.easySolved = easySolved;
    testScore.mediumSolved = mediumSolved;
    testScore.hardSolved = hardSolved;
    testScore.scorePercentage = Math.round(avgScore * 100) / 100;
    await testScore.save();

    // Log Activity (Write operation)
    await ActivityFeed.create({
      userId: req.user._id,
      actionType: 'PRACTICE_SUBMIT',
      description: `Completed ${session.subject} practice test - Score: ${roundedScore}%`,
    });

    res.status(200).json({
      success: true,
      message: 'Practice test evaluated successfully',
      data: {
        session,
        evaluationSummary: {
          overallFeedback: evaluation.overallFeedback,
          strongTopics: evaluation.strongTopics || [],
          weakTopics: evaluation.weakTopics || [],
          studyRecommendations: evaluation.studyRecommendations || [],
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/practice/history
 * Fetch all completed practice sessions of the user.
 */
export const getPracticeHistory = async (req, res, next) => {
  try {
    const history = await PracticeSession.find({
      userId: req.user._id,
      status: 'COMPLETED',
    }).sort({ completedAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Practice session history fetched successfully',
      data: history,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/practice/history/:subject
 * Fetch completed practice sessions of user filtered by subject.
 */
export const getPracticeHistoryBySubject = async (req, res, next) => {
  try {
    const { subject } = req.params;
    const upperSubject = subject.toUpperCase();

    if (!['APTITUDE', 'CODING', 'VERBAL', 'QUANT', 'DSA'].includes(upperSubject)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subject filter.',
      });
    }

    const history = await PracticeSession.find({
      userId: req.user._id,
      subject: upperSubject,
      status: 'COMPLETED',
    }).sort({ completedAt: -1 });

    res.status(200).json({
      success: true,
      message: `Practice history for ${upperSubject} fetched successfully`,
      data: history,
    });
  } catch (error) {
    next(error);
  }
};
