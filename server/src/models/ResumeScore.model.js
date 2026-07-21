import mongoose from 'mongoose';

const resumeScoreSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  atsScore: {
    type: Number,
    required: true,
  },
  keywordScore: {
    type: Number,
    required: true,
  },
  formatScore: {
    type: Number,
    required: true,
  },
  impactScore: {
    type: Number,
    required: true,
  },
  overallScore: {
    type: Number,
    required: true,
  },
  fileUrl: {
    type: String,
    default:null,
  },
  detectedSections: {
    type: [String],
    default: [],
  },
  matchedKeywords: {
    type: [String],
    default: [],
  },
  missingKeywords: {
    type: [String],
    default: [],
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

const ResumeScore = mongoose.model('ResumeScore', resumeScoreSchema);
export default ResumeScore;
