import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import Profile from '../models/Profile.model.js';
import ActivityFeed from '../models/ActivityFeed.model.js';
import { sendWelcomeEmail, sendPasswordResetEmail } from '../services/email.service.js';

// Helper to generate JWT Token
const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * Register a new User and Profile
 */
export const register = async (req, res, next) => {
  try {
    const { email, password, fullName, rollNumber, branch, college } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email is already registered.',
      });
    }

    // Hash Password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create User (default role is student)
    const user = await User.create({
      email,
      passwordHash,
      role: 'student',
    });

    // Create Profile
    let profile;
    try {
      profile = await Profile.create({
        userId: user._id,
        fullName,
        rollNumber,
        branch,
        college,
      });
    } catch (profileError) {
      // Rollback User creation if Profile creation fails
      await User.findByIdAndDelete(user._id);
      throw profileError;
    }

    // Add to Activity Feed
    await ActivityFeed.create({
      userId: user._id,
      actionType: 'AUTH_REGISTER',
      description: 'Account created successfully',
    });

    // Generate Token
    const token = generateToken(user._id, user.role);

    // Send Welcome Email
    try {
      await sendWelcomeEmail(user.email, profile.fullName);
    } catch (emailError) {
      console.log(`Welcome email failed to execute: ${emailError.message}`);
    }

    // Return response in standard shape
    const userData = {
      _id: user._id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user: userData,
        profile,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * User Login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    // Find User by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User with this email not found.',
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    // Role-based portal validation
    if (role && user.role !== role) {
      if (role === 'student' && user.role === 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Please use the Admin Login portal.',
        });
      }
      if (role === 'admin' && user.role === 'student') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Please use the Student Login portal.',
        });
      }
    }

    // Find Profile
    const profile = await Profile.findOne({ userId: user._id });

    // Generate Token
    const token = generateToken(user._id, user.role);

    // Log Activity
    await ActivityFeed.create({
      userId: user._id,
      actionType: 'AUTH_LOGIN',
      description: 'User logged in successfully',
    });

    const userData = {
      _id: user._id,
      email: user.email,
      role: user.role,
    };

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: userData,
        profile,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Authenticated User and Profile Details
 */
export const me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash');
    const profile = await Profile.findOne({ userId: user._id });

    res.status(200).json({
      success: true,
      message: 'Current user details fetched successfully',
      data: {
        user,
        profile,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Request Password Reset Token
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    // Always return 200 with same message if user not found to prevent user enumeration
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'Reset email sent',
        data: null,
      });
    }

    // Generate Reset Token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Save token & expiry to user (15 minutes)
    user.resetToken = resetTokenHash;
    user.resetTokenExpiry = Date.now() + (15 * 60 * 1000);
    await user.save();

    // Log Activity
    await ActivityFeed.create({
      userId: user._id,
      actionType: 'AUTH_FORGOT_PASSWORD',
      description: 'Requested password reset link',
    });

    // Send Reset Email
    const resetLink = (process.env.FRONTEND_URL || 'http://localhost:5173') + '/reset-password/' + resetToken;
    try {
      await sendPasswordResetEmail(user.email, resetLink);
    } catch (emailError) {
      console.log(`Password reset email failed to execute: ${emailError.message}`);
    }

    res.status(200).json({
      success: true,
      message: 'Reset email sent',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset Password using Token
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Hash incoming token to match saved token
    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Step 1: Find user by reset token only
    const user = await User.findOne({
      resetToken: tokenHash,
    });

    // Step 2: Check validity and expiry separately in memory
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Reset token is invalid.',
      });
    }

    if (user.resetTokenExpiry < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Reset token has expired. Please request a new one.',
      });
    }

    // Hash and save new password
    const saltRounds = 12;
    user.passwordHash = await bcrypt.hash(password, saltRounds);

    // Clear reset credentials
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    // Log Activity
    await ActivityFeed.create({
      userId: user._id,
      actionType: 'AUTH_RESET_PASSWORD',
      description: 'Password reset completed successfully',
    });

    res.status(200).json({
      success: true,
      message: 'Password reset successful',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};
