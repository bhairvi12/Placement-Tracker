import ResumeScore from '../models/ResumeScore.model.js';
import ActivityFeed from '../models/ActivityFeed.model.js';
import { parseAndScore } from '../services/resume.service.js';
import { uploadToCloudinary } from '../config/cloudinary.js';

/**
 * Upload a resume, parse PDF content, calculate scores and save stats.
 */
export const uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a PDF resume file.',
      });
    }

    // we will be back here for solve this problem now we direct parse pdf

    // const folder = 'preptracker/resumes';
    // const publicId = `resume_${req.user._id}_${Date.now()}`;

    // const uploadResult = await uploadToCloudinary(req.file.buffer, {
    //   folder,
    //   public_id: publicId,
    //   resource_type: 'auto', // PDF needs raw upload type in Cloudinary
    // });

    // 2. Parse text and score content
    const analysis = await parseAndScore(req.file.buffer);

    // 3. Save ResumeScore in database
    const savedScore = await ResumeScore.create({
      userId: req.user._id,
      atsScore: analysis.atsScore,
      keywordScore: analysis.keywordScore,
      formatScore: analysis.formatScore,
      impactScore: analysis.impactScore,
      overallScore: analysis.overallScore,
      fileUrl: null,//uploadResult.secure_url,
      detectedSections: analysis.detectedSections,
      matchedKeywords: analysis.matchedKeywords,
      missingKeywords: analysis.missingKeywords,
    });

    // 4. Log Activity
    await ActivityFeed.create({
      userId: req.user._id,
      actionType: 'RESUME_UPLOAD',
      description: `Uploaded resume - Score: ${analysis.overallScore}/100`,
    });

    res.status(201).json({
      success: true,
      message: 'Resume uploaded and analyzed successfully',
      data: savedScore,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all resume score histories for user
 */
export const getResumeHistory = async (req, res, next) => {
  try {
    const history = await ResumeScore.find({ userId: req.user._id }).sort({
      uploadedAt: -1,
    });

    res.status(200).json({
      success: true,
      message: 'Resume history retrieved successfully',
      data: history,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get the latest resume score stats
 */
export const getLatestResume = async (req, res, next) => {
  try {
    const latest = await ResumeScore.findOne({ userId: req.user._id }).sort({
      uploadedAt: -1,
    });

    res.status(200).json({
      success: true,
      message: 'Latest resume details retrieved successfully',
      data: latest,
    });
  } catch (error) {
    next(error);
  }
};
