import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import dotenv from 'dotenv';
import logger from './config/logger.js';
import authRoutes from './modules/auth/auth.routes.js';
import stocksRoutes from './modules/stocks/stocks.routes.js';
import documentsRoutes from './modules/documents/documents.routes.js';
import chatRoutes from './modules/chat/chat.routes.js';
import portfoliosRoutes from './modules/portfolios/portfolios.routes.js';
import comparisonRoutes from './modules/comparison/comparison.routes.js';
import newsRoutes from './modules/news/news.routes.js';
import screenerRoutes from './modules/screener/screener.routes.js';
import watchlistRoutes from './modules/watchlist/watchlist.routes.js';
import crawlerRoutes from './modules/crawler/crawler.routes.js';
import { startSyncScheduler } from './queue/sync.scheduler.js';

// Instantiate BullMQ Worker listener processes
import './queue/document.worker.js';
import './queue/sync.worker.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// Rate Limiting (Relaxed limit for active dev / testing)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // Increased to 5000 requests per 15 minutes for development
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});
app.use('/api', limiter);

// Mount Routing modules
app.use('/api/auth', authRoutes);
app.use('/api/stocks', stocksRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/portfolios', portfoliosRoutes);
app.use('/api/comparison', comparisonRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/screener', screenerRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/crawler', crawlerRoutes);

// Base Health Check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Centralized Error Handling Middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(`${err.message} \nStack: ${err.stack}`);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

app.listen(PORT, async () => {
  logger.info(`🚀 API Gateway running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  await startSyncScheduler();
});
