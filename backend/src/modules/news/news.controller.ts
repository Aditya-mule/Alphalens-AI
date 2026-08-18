import { Request, Response, NextFunction } from 'express';
import { NewsService } from './news.service.js';

export class NewsController {
  private newsService: NewsService;

  constructor() {
    this.newsService = new NewsService();
  }

  getNewsByTicker = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { ticker } = req.params;
      const articles = await this.newsService.getNewsForTicker(ticker);
      res.status(200).json(articles);
    } catch (error) {
      next(error);
    }
  };

  listAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const articles = await this.newsService.getAllEnrichedNews();
      res.status(200).json(articles);
    } catch (error) {
      next(error);
    }
  };
}

export default NewsController;
