import { Router } from 'express';
import {
  getSkills,
  createSkill,
  deleteSkill,
  getGapAnalysis,
} from '../controllers/skills.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';
import { skillSchema } from '../validators/skill.validator.js';

const router = Router();

router.use(authMiddleware);

// Define static routes before parameterized routes to avoid param matching collisions
router.get('/gap-analysis', getGapAnalysis);

router.get('/', getSkills);
router.post('/', validate(skillSchema), createSkill);
router.delete('/:id', deleteSkill);

export default router;
