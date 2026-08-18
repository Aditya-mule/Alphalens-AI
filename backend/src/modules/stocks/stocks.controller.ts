import { Request, Response, NextFunction } from 'express';
import { StocksService } from './stocks.service.js';

export class StocksController {
  private stocksService: StocksService;

  constructor() {
    this.stocksService = new StocksService();
  }

  search = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query.query as string || '';
      const results = await this.stocksService.searchStocks(query);
      res.status(200).json(results);
    } catch (error) {
      next(error);
    }
  };

  getAnalysis = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { ticker } = req.params;
      const report = await this.stocksService.getFundamentalAnalysis(ticker);
      res.status(200).json(report);
    } catch (error: any) {
      if (error.message === 'StockNotFound') {
        res.status(404).json({ error: 'NotFound', message: `Stock ticker not found` });
        return;
      }
      next(error);
    }
  };

  compare = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tickerA = req.query.tickerA as string || 'TCS';
      const tickerB = req.query.tickerB as string || 'INFY';
      const comparison = await this.stocksService.compareStocks(tickerA, tickerB);
      res.status(200).json(comparison);
    } catch (error: any) {
      if (error.message === 'StockNotFound') {
        res.status(404).json({ error: 'NotFound', message: `One or both comparison stock tickers not found` });
        return;
      }
      next(error);
    }
  };
}

export default StocksController;
