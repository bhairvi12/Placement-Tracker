import mongoose from 'mongoose';

const certificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    platform: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['completed', 'in_progress', 'planned'],
      default: 'planned',
    },
    progressPercent: {
      type: Number,
      default: 0,
    },
    completedDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Certification = mongoose.model('Certification', certificationSchema);
export default Certification;
