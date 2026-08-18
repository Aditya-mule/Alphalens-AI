import { Router } from 'express';
import { z } from 'zod';
import { ComparisonController } from './comparison.controller.js';
import { authenticateJWT } from '../../middleware/auth.middleware.js';
import { validateRequest } from '../../middleware/validation.middleware.js';

const router = Router();
const controller = new ComparisonController();

const comparisonValidationSchema = z.object({
  query: z.object({
    tickers: z.string().min(1, 'Tickers comma-separated list parameter is required'),
  }),
});

router.get(
  '/',
  authenticateJWT as any,
  validateRequest(comparisonValidationSchema),
  controller.compare
);

export default router;
export { router as comparisonRoutes };
