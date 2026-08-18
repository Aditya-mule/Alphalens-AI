import { Response, NextFunction } from 'express';
import { WatchlistService } from './watchlist.service.js';
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js';

export class WatchlistController {
  private watchlistService: WatchlistService;

  constructor() {
    this.watchlistService = new WatchlistService();
  }

  add = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { ticker } = req.body;

      const item = await this.watchlistService.add(userId, ticker);
      res.status(211).json({ message: 'Stock added to watchlist successfully', item });
    } catch (error: any) {
      if (error.message === 'StockNotFound') {
        res.status(404).json({ error: 'NotFound', message: 'Stock ticker not found' });
        return;
      }
      next(error);
    }
  };

  remove = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { ticker } = req.params;

      await this.watchlistService.remove(userId, ticker);
      res.status(200).json({ message: 'Stock removed from watchlist successfully' });
    } catch (error: any) {
      if (error.message === 'WatchlistItemNotFound') {
        res.status(404).json({ error: 'NotFound', message: 'Ticker not found in your watchlist' });
        return;
      }
      next(error);
    }
  };

  get = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const items = await this.watchlistService.getUserWatchlist(userId);
      res.status(200).json(items);
    } catch (error) {
      next(error);
    }
  };
}

export default WatchlistController;
