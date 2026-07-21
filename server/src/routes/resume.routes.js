import { Router } from 'express';
import multer from 'multer';
import {
  uploadResume,
  getResumeHistory,
  getLatestResume,
} from '../controllers/resume.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';

const router = Router();

// Multer Config: memoryStorage, max 5MB, pdf only
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'), false);
    }
  },
});

router.use(authMiddleware);

// Route to handle resume upload and parse
router.post(
  '/upload',
  (req, res, next) => {
    upload.single('resume')(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }
      next();
    });
  },
  uploadResume
);

router.get('/history', getResumeHistory);
router.get('/latest', getLatestResume);

export default router;
