import { Router } from 'express';
import { z } from 'zod';
import { NewsController } from './news.controller.js';
import { authenticateJWT } from '../../middleware/auth.middleware.js';
import { validateRequest } from '../../middleware/validation.middleware.js';

const router = Router();
const controller = new NewsController();

const tickerValidationSchema = z.object({
  params: z.object({
    ticker: z.string().min(1, 'Ticker symbol parameter is required'),
  }),
});

router.use(authenticateJWT as any);

router.get('/', controller.listAll);
router.get('/:ticker', validateRequest(tickerValidationSchema), controller.getNewsByTicker);

export default router;
export { router as newsRoutes };
