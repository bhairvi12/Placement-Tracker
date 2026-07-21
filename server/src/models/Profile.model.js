import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    rollNumber: {
      type: String,
      required: true,
      trim: true,
    },
    branch: {
      type: String,
      enum: ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL'],
      required: true,
    },
    college: {
      type: String,
      trim: true,
    },
    targetCompanies: {
      type: [String],
      default: [],
    },
    avatarUrl: {
      type: String,
      default: null,
    },
    isPlaced: {
      type: Boolean,
      default: false,
    },
    profileComplete: {
      type: Boolean,
      default: false,
    },
    placedCompany: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Profile = mongoose.model('Profile', profileSchema);
export default Profile;
