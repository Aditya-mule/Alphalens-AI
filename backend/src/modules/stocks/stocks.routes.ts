import { Router } from 'express';
import { z } from 'zod';
import { StocksController } from './stocks.controller.js';
import { authenticateJWT } from '../../middleware/auth.middleware.js';
import { validateRequest } from '../../middleware/validation.middleware.js';

const router = Router();
const controller = new StocksController();

const searchValidationSchema = z.object({
  query: z.object({
    query: z.string().min(1, 'Search query parameter is required'),
  }),
});

const analysisValidationSchema = z.object({
  params: z.object({
    ticker: z.string().min(1, 'Ticker symbol parameter is required'),
  }),
});

router.get('/search', validateRequest(searchValidationSchema), controller.search);
router.get('/compare', authenticateJWT as any, controller.compare);
router.get('/:ticker/analysis', authenticateJWT as any, validateRequest(analysisValidationSchema), controller.getAnalysis);

export default router;
export { router as stocksRoutes };
