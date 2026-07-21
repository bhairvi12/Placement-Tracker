import './config/env.js'
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import morgan from 'morgan';

// Route Imports
import authRoutes from './routes/auth.routes.js';
import profileRoutes from './routes/profile.routes.js';
import resumeRoutes from './routes/resume.routes.js';
import testScoresRoutes from './routes/testScores.routes.js';
import certificationsRoutes from './routes/certifications.routes.js';
import skillsRoutes from './routes/skills.routes.js';
import activityRoutes from './routes/activity.routes.js';
import adminRoutes from './routes/admin.routes.js';
import aiRoutes from './routes/ai.routes.js';
import practiceTestRoutes from './routes/practiceTest.routes.js';

// Middleware Imports
import errorHandler from './middleware/errorHandler.middleware.js';

const app = express();

// Apply Security Headers
app.use(helmet());

// Apply CORS Policy
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
})
app.use(globalLimiter);

// Logging request middleware
app.use(morgan('dev'));

// Parsing middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount API Routes under /api/v1/
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/resume', resumeRoutes);
app.use('/api/v1/tests', testScoresRoutes);
app.use('/api/v1/certifications', certificationsRoutes);
app.use('/api/v1/skills', skillsRoutes);
app.use('/api/v1/activity', activityRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/practice', practiceTestRoutes);

// Centralized error handler mounted last
app.use(errorHandler);

export default app;
