import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import Profile from '../models/Profile.model.js';
import ActivityFeed from '../models/ActivityFeed.model.js';
import { sendWelcomeEmail, sendPasswordResetEmail } from '../services/email.service.js';

const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};


const background = (promise, label) => {
  Promise.resolve(promise).catch((err) => {
    console.error(`[background:${label}] failed:`, err.message);
  });
};


export const register = async (req, res, next) => {
  try {
    const { email, password, fullName, rollNumber, branch, college } = req.body;

    
    const existingUser = await User.findOne({ email }).lean();
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email is already registered.',
      });
    }

    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = await User.create({
      email,
      passwordHash,
      role: 'student',
    });

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
      await User.findByIdAndDelete(user._id);
      throw profileError;
    }

    const token = generateToken(user._id, user.role);

    const userData = {
      _id: user._id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };

    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { token, user: userData, profile },
    });

    
    background(
      ActivityFeed.create({
        userId: user._id,
        actionType: 'AUTH_REGISTER',
        description: 'Account created successfully',
      }),
      'activity:register'
    );

    background(sendWelcomeEmail(user.email, profile.fullName), 'email:welcome');
  } catch (error) {
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Email is already registered.',
      });
    }
    next(error);
  }
};


export const login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User with this email not found.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

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

    const profile = await Profile.findOne({ userId: user._id });
    const token = generateToken(user._id, user.role);

    const userData = { _id: user._id, email: user.email, role: user.role };

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { token, user: userData, profile },
    });

    background(
      ActivityFeed.create({
        userId: user._id,
        actionType: 'AUTH_LOGIN',
        description: 'User logged in successfully',
      }),
      'activity:login'
    );
  } catch (error) {
    next(error);
  }
};


export const me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash').lean();
    const profile = await Profile.findOne({ userId: user._id }).lean();

    res.status(200).json({
      success: true,
      message: 'Current user details fetched successfully',
      data: { user, profile },
    });
  } catch (error) {
    next(error);
  }
};


export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'Reset email sent',
        data: null,
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetToken = resetTokenHash;
    user.resetTokenExpiry = Date.now() + 15 * 60 * 1000;
    await user.save();

   
    res.status(200).json({
      success: true,
      message: 'Reset email sent',
      data: null,
    });

    background(
      ActivityFeed.create({
        userId: user._id,
        actionType: 'AUTH_FORGOT_PASSWORD',
        description: 'Requested password reset link',
      }),
      'activity:forgot-password'
    );

    const resetLink =
      (process.env.FRONTEND_URL || 'http://localhost:5173') + '/reset-password/' + resetToken;
    background(sendPasswordResetEmail(user.email, resetLink), 'email:reset');
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

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({ resetToken: tokenHash });

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

    const saltRounds = 12;
    user.passwordHash = await bcrypt.hash(password, saltRounds);
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful',
      data: null,
    });

    background(
      ActivityFeed.create({
        userId: user._id,
        actionType: 'AUTH_RESET_PASSWORD',
        description: 'Password reset completed successfully',
      }),
      'activity:reset-password'
    );
  } catch (error) {
    next(error);
  }
};