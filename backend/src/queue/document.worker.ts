import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import prisma from '../config/prisma.js';
import logger from '../config/logger.js';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';

const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
});

export const documentWorker = new Worker(
  'document-processing',
  async (job: Job) => {
    const { docId, filepath, ticker } = job.data;
    logger.info(`Starting background job ${job.id} for document ${docId} (ticker: ${ticker})`);

    // 1. Set status to PROCESSING
    await prisma.document.update({
      where: { id: docId },
      data: { status: 'PROCESSING' },
    });

    try {
      // 2. Trigger the FastAPI microservice processing
      const payload = {
        document_id: docId,
        filepath: path.resolve(filepath),
        ticker: ticker.toUpperCase(),
      };

      logger.info(`Posting document request to FastAPI: ${JSON.stringify(payload)}`);
      
      const response = await axios.post(`${aiServiceUrl}/api/document/process`, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 300000, // 5 minutes timeout for text parsing, chunking, embedding, vector database write
      });

      logger.info(`FastAPI responded successfully: ${JSON.stringify(response.data)}`);

      // 3. Mark COMPLETED
      await prisma.document.update({
        where: { id: docId },
        data: { status: 'COMPLETED' },
      });

      // 4. Cleanup local temp file
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        logger.info(`Cleaned up temp file: ${filepath}`);
      }

      return response.data;
    } catch (error: any) {
      logger.error(`Job failed for document ${docId}: ${error.message}`);

      // 5. Update to FAILED
      await prisma.document.update({
        where: { id: docId },
        data: { status: 'FAILED' },
      });

      throw error;
    }
  },
  {
    connection,
    concurrency: 2, // Limit concurrent processing tasks
  }
);

// Graceful shutdown handling
documentWorker.on('failed', (job, err) => {
  logger.error(`Worker job ${job?.id} failed with error: ${err.message}`);
});

documentWorker.on('completed', (job) => {
  logger.info(`Worker job ${job.id} completed successfully`);
});

export default documentWorker;
