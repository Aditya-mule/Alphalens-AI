import { Response, NextFunction } from 'express';
import { PortfoliosService } from './portfolios.service.js';
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js';

export class PortfoliosController {
  private portfoliosService: PortfoliosService;

  constructor() {
    this.portfoliosService = new PortfoliosService();
  }

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { name } = req.body;

      const portfolio = await this.portfoliosService.create(userId, name);
      res.status(211).json({ message: 'Portfolio created successfully', portfolio });
    } catch (error) {
      next(error);
    }
  };

  addTransaction = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { portfolioId } = req.params;
      const { ticker, quantity, purchasePrice, transactionDate } = req.body;

      const transaction = await this.portfoliosService.addTransaction(userId, {
        portfolioId,
        ticker,
        quantity,
        purchasePrice,
        transactionDate,
      });

      res.status(211).json({ message: 'Transaction added successfully', transaction });
    } catch (error: any) {
      if (error.message === 'UnauthorizedPortfolioAccess') {
        res.status(403).json({ error: 'Forbidden', message: 'You do not own this portfolio' });
        return;
      }
      next(error);
    }
  };

  list = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const portfolios = await this.portfoliosService.getUserPortfolios(userId);
      res.status(200).json(portfolios);
    } catch (error) {
      next(error);
    }
  };

  getAudit = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { portfolioId } = req.params;

      const auditReport = await this.portfoliosService.getPortfolioAudit(userId, portfolioId);
      res.status(200).json(auditReport);
    } catch (error: any) {
      if (error.message === 'UnauthorizedPortfolioAccess') {
        res.status(403).json({ error: 'Forbidden', message: 'You do not own this portfolio' });
        return;
      }
      next(error);
    }
  };

  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { portfolioId } = req.params;
      await this.portfoliosService.delete(userId, portfolioId);
      res.status(200).json({ message: 'Portfolio deleted successfully' });
    } catch (error: any) {
      if (error.message === 'UnauthorizedPortfolioAccess') {
        res.status(403).json({ error: 'Forbidden', message: 'You do not own this portfolio' });
        return;
      }
      next(error);
    }
  };

  deleteHolding = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { portfolioId, ticker } = req.params;
      await this.portfoliosService.deleteHolding(userId, portfolioId, ticker);
      res.status(200).json({ message: 'Holding deleted successfully' });
    } catch (error: any) {
      if (error.message === 'UnauthorizedPortfolioAccess') {
        res.status(403).json({ error: 'Forbidden', message: 'You do not own this portfolio' });
        return;
      }
      next(error);
    }
  };
}

export default PortfoliosController;
export type AuthenticatedRequestHandler = (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
