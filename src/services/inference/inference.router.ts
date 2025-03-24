import { Router } from 'express';
import { handleInferenceRequest } from './inference.controller';
import { authenticateUser } from '../../middleware/auth.middleware';
import { createRateLimiters } from '../../config/security';

const router = Router();
const { aiLimiter } = createRateLimiters();

router.post('/',
  authenticateUser,
  aiLimiter,
  handleInferenceRequest
);

export default router; 