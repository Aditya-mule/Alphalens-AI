import { Request, Response, NextFunction } from 'express';
import { documentQueue } from '../../queue/document.queue.js';
import prisma from '../../config/prisma.js';
import logger from '../../config/logger.js';
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js';

export class DocumentsController {
  upload = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const file = req.file;
      const { ticker } = req.body;

      if (!file) {
        res.status(400).json({ error: 'BadRequest', message: 'No PDF file uploaded' });
        return;
      }

      if (!ticker) {
        res.status(400).json({ error: 'BadRequest', message: 'Ticker symbol is required' });
        return;
      }

      logger.info(`Received document upload request for ticker: ${ticker}, file: ${file.originalname}`);

      // 1. Create document record in database
      const document = await prisma.document.create({
        data: {
          companyTicker: ticker.toUpperCase(),
          filename: file.originalname,
          size: file.size,
          qdrantCollection: `company_${ticker.toLowerCase()}`,
          status: 'PENDING',
        },
      });

      // 2. Add job to BullMQ processing queue
      const job = await documentQueue.add('process-document', {
        docId: document.id,
        filepath: file.path,
        ticker: ticker,
      });

      res.status(202).json({
        message: 'File uploaded and queued for processing',
        documentId: document.id,
        jobId: job.id,
        status: document.status,
      });
    } catch (error) {
      next(error);
    }
  };

  getStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { docId } = req.params;
      const document = await prisma.document.findUnique({
        where: { id: docId },
      });

      if (!document) {
        res.status(404).json({ error: 'NotFound', message: 'Document not found' });
        return;
      }

      res.status(200).json({
        id: document.id,
        ticker: document.companyTicker,
        filename: document.filename,
        status: document.status,
        updatedAt: document.updatedAt,
      });
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ticker = req.query.ticker as string;
      const filter = ticker ? { companyTicker: ticker.toUpperCase() } : {};
      
      const documents = await prisma.document.findMany({
        where: filter,
        orderBy: { createdAt: 'desc' },
      });
      
      res.status(200).json(documents);
    } catch (error) {
      next(error);
    }
  };
}

export default DocumentsController;
