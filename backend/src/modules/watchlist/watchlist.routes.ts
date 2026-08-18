import { Router } from 'express';
import { z } from 'zod';
import { WatchlistController } from './watchlist.controller.js';
import { authenticateJWT } from '../../middleware/auth.middleware.js';
import { validateRequest } from '../../middleware/validation.middleware.js';

const router = Router();
const controller = new WatchlistController();

const addWatchlistSchema = z.object({
  body: z.object({
    ticker: z.string().min(1, 'Ticker symbol is required'),
  }),
});

router.use(authenticateJWT as any);

router.post('/', validateRequest(addWatchlistSchema), controller.add as any);
router.get('/', controller.get as any);
router.delete('/:ticker', controller.remove as any);

export default router;
export { router as watchlistRoutes };
