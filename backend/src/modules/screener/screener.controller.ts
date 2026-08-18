import { Request, Response, NextFunction } from 'express';
import { ScreenerService } from './screener.service.js';

export class ScreenerController {
  private screenerService: ScreenerService;

  constructor() {
    this.screenerService = new ScreenerService();
  }

  screen = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query.query as string;
      if (!query) {
        res.status(400).json({ error: 'BadRequest', message: 'Query parameter is required (e.g. ?query=high growth technology stocks)' });
        return;
      }

      const results = await this.screenerService.screenStocks(query);
      res.status(200).json(results);
    } catch (error) {
      next(error);
    }
  };
}

export default ScreenerController;
