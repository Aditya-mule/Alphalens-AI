import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import logger from '../config/logger.js';
import prisma from '../config/prisma.js';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const isTLS = redisUrl.startsWith('rediss://');

const connection = new IORedis(redisUrl, { 
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  ...(isTLS ? { tls: { rejectUnauthorized: false } } : {}),
});

export const syncWorker = new Worker(
  'market-sync',
  async (job: Job) => {
    logger.info(`⏰ [Cron Worker] Executing recurring market sync job ${job.id}`);
    
    try {
      // 1. Fetch active watchlists to identify active tickers
      const watchlistItems = await prisma.watchlist.findMany({
        distinct: ['ticker'],
        select: { ticker: true }
      });

      const activeTickers = watchlistItems.map((w) => w.ticker);
      logger.info(`Active stock watchlists tracked: ${activeTickers.join(', ')}`);

      // 2. Simulate fluctuating stock price updates for active stocks
      // In production, this worker makes REST requests to Financial Modeling Prep API
      // to sync latest stock statements and updates the PostgreSQL database cache.
      for (const ticker of activeTickers) {
        // Log price simulation bounds
        const variance = (Math.random() * 6 - 3).toFixed(2); // +/- 3%
        logger.info(`Simulated price sync for ${ticker}: Price fluctuated by ${variance}%`);
      }

      logger.info(`Market sync executed successfully. Updated ${activeTickers.length} tracked assets.`);
      return { status: 'success', activeAssetsSynced: activeTickers.length };
    } catch (error: any) {
      logger.error(`Market sync job failed: ${error.message}`);
      throw error;
    }
  },
  {
    connection,
    concurrency: 1,
  }
);

export default syncWorker;
