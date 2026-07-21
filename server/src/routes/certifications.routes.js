import { Router } from 'express';
import {
  getCertifications,
  createCertification,
  updateCertification,
  deleteCertification,
} from '../controllers/certifications.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';
import { certificationSchema } from '../validators/certification.validator.js';

const router = Router();

// Define partial schema for optional fields in updates
const certificationUpdateSchema = certificationSchema.partial();

router.use(authMiddleware);

router.get('/', getCertifications);
router.post('/', validate(certificationSchema), createCertification);
router.put('/:id', validate(certificationUpdateSchema), updateCertification);
router.delete('/:id', deleteCertification);

export default router;
