import { Router } from 'express';
import {
  getStudents,
  getStudentById,
  updateStudentPlacement,
  getAdminStats,
  getLeaderboard,
  exportStudentsCsv,
  getSettings,
  updateSettings,
} from '../controllers/admin.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';
import isAdminMiddleware from '../middleware/isAdmin.middleware.js';
import validate from '../middleware/validate.middleware.js';
import { z } from 'zod';

const router = Router();

// Zod schema for placement updates
const placementUpdateSchema = z.object({
  isPlaced: z.boolean({
    required_error: 'isPlaced status is required',
  }),
  placedCompany: z.string().trim().optional().nullable(),
});

// Zod schema for settings updates
const settingsUpdateSchema = z.object({
  placementSeasonDate: z.string().trim().min(1, 'placementSeasonDate is required'),
});

// Secure all admin routes with auth and administrator check middlewares
router.use(authMiddleware);
router.use(isAdminMiddleware);

// Define static routes first to prevent wildcard parameter collisions with :id
router.get('/stats', getAdminStats);
router.get('/leaderboard', getLeaderboard);
router.get('/export/csv', exportStudentsCsv);

router.route('/settings')
  .get(getSettings)
  .put(validate(settingsUpdateSchema), updateSettings);

router.get('/students', getStudents);
router.get('/students/:id', getStudentById);
router.put(
  '/students/:id/placement',
  validate(placementUpdateSchema),
  updateStudentPlacement
);

export default router;
