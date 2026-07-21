import mongoose from 'mongoose';

const practiceQuestionSchema = new mongoose.Schema({
  questionId: {
    type: String,
    required: true,
  },
  question: {
    type: String,
    required: true,
  },
  options: {
    type: [String],
    required: true,
    validate: [
      (val) => val.length === 4,
      'Multiple choice questions must have exactly 4 options.',
    ],
  },
  correctAnswer: {
    type: String,
    required: true,
  },
  userAnswer: {
    type: String,
    default: null,
  },
  isCorrect: {
    type: Boolean,
    default: null,
  },
  aiFeedback: {
    type: String,
    default: null,
  },
  topic: {
    type: String,
    default: '',
  },
});

const practiceSessionSchema = new mongoose.Schema({
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
  difficulty: {
    type: String,
    enum: ['EASY', 'MEDIUM', 'HARD'],
    required: true,
  },
  questions: {
    type: [practiceQuestionSchema],
    default: [],
  },
  totalQuestions: {
    type: Number,
    required: true,
  },
  correctAnswers: {
    type: Number,
    default: 0,
  },
  scorePercentage: {
    type: Number,
    default: 0,
  },
  timeTaken: {
    type: Number, // In seconds
    default: 0,
  },
  status: {
    type: String,
    enum: ['IN_PROGRESS', 'COMPLETED'],
    default: 'IN_PROGRESS',
  },
  startedAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: {
    type: Date,
    default: null,
  },
});

const PracticeSession = mongoose.model('PracticeSession', practiceSessionSchema);
export default PracticeSession;
