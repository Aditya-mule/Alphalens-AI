import { Router } from 'express';
import { z } from 'zod';
import { PortfoliosController } from './portfolios.controller.js';
import { authenticateJWT } from '../../middleware/auth.middleware.js';
import { validateRequest } from '../../middleware/validation.middleware.js';

const router = Router();
const controller = new PortfoliosController();

const createPortfolioSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Portfolio name is required'),
  }),
});

const addTransactionSchema = z.object({
  params: z.object({
    portfolioId: z.string().min(1, 'Portfolio ID parameter is required'),
  }),
  body: z.object({
    ticker: z.string().min(1, 'Ticker symbol is required'),
    quantity: z.number().int().gt(0, 'Quantity must be greater than zero'),
    purchasePrice: z.number().gt(0, 'Purchase price must be greater than zero'),
    transactionDate: z.string().optional(),
  }),
});

const auditSchema = z.object({
  params: z.object({
    portfolioId: z.string().min(1, 'Portfolio ID parameter is required'),
  }),
});

router.use(authenticateJWT as any);

router.post('/', validateRequest(createPortfolioSchema), controller.create as any);
router.get('/', controller.list as any);
router.post('/:portfolioId/transactions', validateRequest(addTransactionSchema), controller.addTransaction as any);
router.get('/:portfolioId/audit', validateRequest(auditSchema), controller.getAudit as any);
router.delete('/:portfolioId', controller.delete as any);
router.delete('/:portfolioId/holdings/:ticker', controller.deleteHolding as any);

export default router;
export { router as portfoliosRoutes };
