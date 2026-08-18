import { Router } from 'express';
import { z } from 'zod';
import { ScreenerController } from './screener.controller.js';
import { authenticateJWT } from '../../middleware/auth.middleware.js';
import { validateRequest } from '../../middleware/validation.middleware.js';

const router = Router();
const controller = new ScreenerController();

const screenerValidationSchema = z.object({
  query: z.object({
    query: z.string().min(1, 'Screener query cannot be empty'),
  }),
});

router.get(
  '/',
  authenticateJWT as any,
  validateRequest(screenerValidationSchema),
  (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  },
  controller.screen
);

export default router;
export { router as screenerRoutes };
