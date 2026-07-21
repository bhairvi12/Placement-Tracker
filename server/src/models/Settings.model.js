import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  value: {
    type: String,
    required: true,
    trim: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt timestamp before saving
settingsSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const Settings = mongoose.model('Settings', settingsSchema);
export default Settings;
