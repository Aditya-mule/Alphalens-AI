import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import logger from '../config/logger.js';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });

export const syncQueue = new Queue('market-sync', { connection });

export const startSyncScheduler = async () => {
  try {
    logger.info('Initializing Market Sync Cron Scheduler repeatable jobs');

    // Remove any existing repeatable jobs to prevent duplicates
    const repeatableJobs = await syncQueue.getRepeatableJobs();
    for (const job of repeatableJobs) {
      await syncQueue.removeRepeatableByKey(job.key);
    }

    // Enqueue a repeatable market data sync job to run every 10 minutes
    const job = await syncQueue.add(
      'refresh-market-data',
      {},
      {
        repeat: {
          pattern: '*/10 * * * *', // standard cron (every 10 minutes)
        },
      }
    );

    logger.info(`Market Sync repeatable Cron registered successfully (Job ID: ${job.id})`);
  } catch (error: any) {
    logger.error(`Failed to register sync scheduler: ${error.message}`);
  }
};

export default startSyncScheduler;
