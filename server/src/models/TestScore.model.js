import mongoose from 'mongoose';

const testScoreSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  subject: {
    type: String,
    enum: ['APTITUDE', 'CODING', 'VERBAL', 'QUANT', 'DSA'],
    required: true,
  },
  easySolved: {
    type: Number,
    default: 0,
  },
  mediumSolved: {
    type: Number,
    default: 0,
  },
  hardSolved: {
    type: Number,
    default: 0,
  },
  scorePercentage: {
    type: Number,
    default: 0,
  },
  recordedAt: {
    type: Date,
    default: Date.now,
  },
});

const TestScore = mongoose.model('TestScore', testScoreSchema);
export default TestScore;
