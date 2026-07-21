import { Router } from 'express';
import multer from 'multer';
import {
  getProfile,
  updateProfile,
  uploadAvatar,
  deleteAvatar,
} from '../controllers/profile.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';
import { profileUpdateSchema } from '../validators/profile.validator.js';

const router = Router();

// Multer Config: memoryStorage, max 2MB, jpeg/png only
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Only .jpeg and .png images are allowed!'), false);
    }
  },
});

router.use(authMiddleware);

router.get('/', getProfile);
router.put('/', validate(profileUpdateSchema), updateProfile);

// Avatar uploads
router.post(
  '/avatar',
  (req, res, next) => {
    upload.single('avatar')(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }
      next();
    });
  },
  uploadAvatar
);

router.delete('/avatar', deleteAvatar);

export default router;
