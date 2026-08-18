import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import axios from 'axios';
import { authenticateJWT } from '../../middleware/auth.middleware.js';
import { validateRequest } from '../../middleware/validation.middleware.js';
import logger from '../../config/logger.js';

const router = Router();
const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';

const syncValidationSchema = z.object({
  params: z.object({
    ticker: z.string().min(1, 'Ticker symbol parameter is required'),
  }),
});

router.post(
  '/:ticker/sync-disclosures',
  authenticateJWT as any,
  validateRequest(syncValidationSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { ticker } = req.params;
    logger.info(`REST Gateway triggering automated disclosure sync crawler for ticker: ${ticker}`);

    try {
      const response = await axios.post(`${aiServiceUrl}/api/crawler/sync`, {
        ticker: ticker.toUpperCase(),
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000, // 60 seconds timeout for scraper PDF generation & Qdrant write
      });

      res.status(200).json(response.data);
    } catch (error: any) {
      logger.error(`Automated disclosure crawler trigger failed: ${error.message}`);
      res.status(502).json({
        error: 'BadGateway',
        message: 'Exchange sync service was temporarily unavailable or timed out.'
      });
    }
  }
);

export default router;
export { router as crawlerRoutes };
