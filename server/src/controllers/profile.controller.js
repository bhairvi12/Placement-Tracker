import Profile from '../models/Profile.model.js';
import ActivityFeed from '../models/ActivityFeed.model.js';
import { uploadToCloudinary, cloudinary } from '../config/cloudinary.js';

/**
 * Get Profile of logged in user
 */
export const getProfile = async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ userId: req.user._id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile fetched successfully',
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Profile details
 */
export const updateProfile = async (req, res, next) => {
  try {
    const { fullName, rollNumber, branch, college, targetCompanies } = req.body;

    const profile = await Profile.findOne({ userId: req.user._id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found.',
      });
    }

    // Update fields
    profile.fullName = fullName;
    profile.rollNumber = rollNumber;
    profile.branch = branch;
    profile.college = college;
    profile.targetCompanies = targetCompanies || [];

    // Check if profile is complete (all required details are set)
    // In our validator, fullName, rollNumber, branch, and college are required.
    if (fullName && rollNumber && branch && college) {
      profile.profileComplete = true;
    }

    await profile.save();

    // Log Activity
    await ActivityFeed.create({
      userId: req.user._id,
      actionType: 'PROFILE_UPDATE',
      description: 'Profile details updated',
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload Avatar to Cloudinary
 */
export const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a image file.',
      });
    }

    const profile = await Profile.findOne({ userId: req.user._id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found.',
      });
    }

    // Upload buffer to Cloudinary using helper
    const publicId = `avatar_${req.user._id}`;
    const folder = 'preptracker/avatars';

    const result = await uploadToCloudinary(req.file.buffer, {
      folder,
      public_id: publicId,
      overwrite: true,
      invalidate: true,
      resource_type: 'image',
    });

    // Update avatarUrl in Profile
    profile.avatarUrl = result.secure_url;
    await profile.save();

    // Log Activity
    await ActivityFeed.create({
      userId: req.user._id,
      actionType: 'PROFILE_AVATAR_UPLOAD',
      description: 'Profile avatar uploaded successfully',
    });

    res.status(200).json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        avatarUrl: profile.avatarUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Avatar from Cloudinary and reset in Profile
 */
export const deleteAvatar = async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ userId: req.user._id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found.',
      });
    }

    if (!profile.avatarUrl) {
      return res.status(400).json({
        success: false,
        message: 'No avatar url exists on this profile.',
      });
    }

    // Delete image from Cloudinary using publicId
    const publicId = `preptracker/avatars/avatar_${req.user._id}`;
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (destroyErr) {
      // Swallowing destroy error in case image is already removed or config is off
    }

    // Update avatarUrl in Profile
    profile.avatarUrl = null;
    await profile.save();

    // Log Activity
    await ActivityFeed.create({
      userId: req.user._id,
      actionType: 'PROFILE_AVATAR_DELETE',
      description: 'Profile avatar deleted successfully',
    });

    res.status(200).json({
      success: true,
      message: 'Avatar deleted successfully',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};
