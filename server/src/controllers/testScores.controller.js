import TestScore from '../models/TestScore.model.js';
import ActivityFeed from '../models/ActivityFeed.model.js';

/**
 * Get latest test scores for the 5 subjects.
 */
export const getLatestScores = async (req, res, next) => {
  try {
    const subjects = ['APTITUDE', 'CODING', 'VERBAL', 'QUANT', 'DSA'];

    const scores = await Promise.all(
      subjects.map(async (subject) => {
        const doc = await TestScore.findOne({
          userId: req.user._id,
          subject,
        }).sort({ recordedAt: -1 });

        return (
          doc || {
            userId: req.user._id,
            subject,
            easySolved: 0,
            mediumSolved: 0,
            hardSolved: 0,
            scorePercentage: 0,
            recordedAt: new Date(),
          }
        );
      })
    );

    res.status(200).json({
      success: true,
      message: 'Latest test scores retrieved successfully',
      data: scores,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Log a solved practice question, update totals and append to history.
 */
export const logPractice = async (req, res, next) => {
  try {
    const { subject, difficulty } = req.body;

    if (!subject || !difficulty) {
      return res.status(400).json({
        success: false,
        message: 'Subject and difficulty are required.',
      });
    }

    const upperSubject = subject.toUpperCase();
    const lowerDifficulty = difficulty.toLowerCase();

    if (!['APTITUDE', 'CODING', 'VERBAL', 'QUANT', 'DSA'].includes(upperSubject)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subject. Must be one of APTITUDE, CODING, VERBAL, QUANT, DSA.',
      });
    }

    if (!['easy', 'medium', 'hard'].includes(lowerDifficulty)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid difficulty. Must be easy, medium, or hard.',
      });
    }

    // Get the latest score sheet for this subject to retrieve cumulative counts
    const latestDoc = await TestScore.findOne({
      userId: req.user._id,
      subject: upperSubject,
    }).sort({ recordedAt: -1 });

    let easySolved = latestDoc ? latestDoc.easySolved : 0;
    let mediumSolved = latestDoc ? latestDoc.mediumSolved : 0;
    let hardSolved = latestDoc ? latestDoc.hardSolved : 0;

    // Increment based on difficulty solved
    if (lowerDifficulty === 'easy') {
      easySolved += 1;
    } else if (lowerDifficulty === 'medium') {
      mediumSolved += 1;
    } else if (lowerDifficulty === 'hard') {
      hardSolved += 1;
    }

    // Calculate score percentage
    // Formula: (easy*1 + medium*3 + hard*5) / ((easy+medium+hard)*5) * 100
    const totalSolved = easySolved + mediumSolved + hardSolved;
    const scorePercentage =
      totalSolved > 0
        ? ((easySolved * 1 + mediumSolved * 3 + hardSolved * 5) / (totalSolved * 5)) * 100
        : 0;

    const roundedPercentage = Math.round((scorePercentage + Number.EPSILON) * 100) / 100;

    // Save as a new snapshot in database for history logs
    const newScoreDoc = await TestScore.create({
      userId: req.user._id,
      subject: upperSubject,
      easySolved,
      mediumSolved,
      hardSolved,
      scorePercentage: roundedPercentage,
    });

    // Log Activity
    await ActivityFeed.create({
      userId: req.user._id,
      actionType: 'TEST_PRACTICE_LOG',
      description: `Solved a ${lowerDifficulty} question in ${upperSubject}. New Score: ${roundedPercentage}%`,
    });

    res.status(201).json({
      success: true,
      message: 'Practice progress logged successfully',
      data: newScoreDoc,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get full history of scores for a specific subject (for line chart)
 */
export const getSubjectHistory = async (req, res, next) => {
  try {
    const { subject } = req.params;
    const upperSubject = subject.toUpperCase();

    if (!['APTITUDE', 'CODING', 'VERBAL', 'QUANT', 'DSA'].includes(upperSubject)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subject.',
      });
    }

    const history = await TestScore.find({
      userId: req.user._id,
      subject: upperSubject,
    }).sort({ recordedAt: 1 });

    res.status(200).json({
      success: true,
      message: `History for ${upperSubject} retrieved successfully`,
      data: history,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get benchmark comparison data (class averages and top 10 averages)
 */
export const getBenchmark = async (req, res, next) => {
  try {
    // 1. Calculate class average per subject
    const classAverage = await TestScore.aggregate([
      { $sort: { recordedAt: -1 } },
      {
        $group: {
          _id: { userId: '$userId', subject: '$subject' },
          latestScore: { $first: '$scorePercentage' },
        },
      },
      {
        $group: {
          _id: '$_id.subject',
          averageScore: { $avg: '$latestScore' },
        },
      },
      {
        $project: {
          subject: '$_id',
          averageScore: { $round: ['$averageScore', 2] },
          _id: 0,
        },
      },
    ]);

    // 2. Calculate top 10 performing scores average per subject
    const topTen = await TestScore.aggregate([
      { $sort: { recordedAt: -1 } },
      {
        $group: {
          _id: { userId: '$userId', subject: '$subject' },
          latestScore: { $first: '$scorePercentage' },
        },
      },
      { $sort: { latestScore: -1 } },
      {
        $group: {
          _id: '$_id.subject',
          scores: { $push: '$latestScore' },
        },
      },
      {
        $project: {
          subject: '$_id',
          averageScore: {
            $avg: { $slice: ['$scores', 10] },
          },
          _id: 0,
        },
      },
      {
        $project: {
          subject: 1,
          averageScore: { $round: ['$averageScore', 2] },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      message: 'Benchmark comparisons calculated successfully',
      data: {
        classAverage,
        topTen,
      },
    });
  } catch (error) {
    next(error);
  }
};
