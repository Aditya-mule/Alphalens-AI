import { Request, Response, NextFunction } from 'express';
import { ComparisonService } from './comparison.service.js';

export class ComparisonController {
  private comparisonService: ComparisonService;

  constructor() {
    this.comparisonService = new ComparisonService();
  }

  compare = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tickersStr = req.query.tickers as string;
      if (!tickersStr) {
        res.status(400).json({ error: 'BadRequest', message: 'Tickers query parameter is required (e.g. ?tickers=TCS,INFY)' });
        return;
      }

      const tickers = tickersStr.split(',')
        .map((t) => t.trim().toUpperCase())
        .filter((t) => t.length > 0);

      if (tickers.length < 2) {
        res.status(400).json({ error: 'BadRequest', message: 'Provide at least 2 company tickers to compare' });
        return;
      }

      const result = await this.comparisonService.compareCompanies(tickers);
      res.status(200).json(result);
    } catch (error: any) {
      if (error.message === 'NoValidCompaniesFound') {
        res.status(404).json({ error: 'NotFound', message: 'No valid company financials found for the tickers provided' });
        return;
      }
      next(error);
    }
  };
}

export default ComparisonController;
