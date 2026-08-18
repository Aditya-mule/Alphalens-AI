import { WatchlistRepository } from './watchlist.repository.js';
import { StocksService } from '../stocks/stocks.service.js';
import logger from '../../config/logger.js';

export class WatchlistService {
  private watchlistRepository: WatchlistRepository;
  private stocksService: StocksService;

  constructor() {
    this.watchlistRepository = new WatchlistRepository();
    this.stocksService = new StocksService();
  }

  async add(userId: string, ticker: string) {
    const uppercaseTicker = ticker.toUpperCase();
    logger.info(`Adding ticker ${uppercaseTicker} to user ${userId} watchlist`);

    // Verify ticker exists
    const stock = await this.stocksService.getStockDetails(uppercaseTicker);
    if (!stock) {
      throw new Error('StockNotFound');
    }

    return this.watchlistRepository.addToWatchlist(userId, uppercaseTicker);
  }

  async remove(userId: string, ticker: string) {
    logger.info(`Removing ticker ${ticker} from user ${userId} watchlist`);
    try {
      return await this.watchlistRepository.removeFromWatchlist(userId, ticker);
    } catch (error) {
      throw new Error('WatchlistItemNotFound');
    }
  }

  async getUserWatchlist(userId: string) {
    logger.info(`Fetching watchlist for user: ${userId}`);
    const items = await this.watchlistRepository.getWatchlistByUser(userId);
    
    const enrichedList = [];
    for (const item of items) {
      const companyInfo = await this.stocksService.getStockDetails(item.ticker);
      
      enrichedList.push({
        id: item.id,
        ticker: item.ticker,
        companyName: companyInfo ? companyInfo.name : `${item.ticker} Corp`,
        price: companyInfo ? companyInfo.price : 100.0,
        sector: companyInfo ? companyInfo.sector : 'General Services',
        createdAt: item.createdAt,
      });
    }

    return enrichedList;
  }
}

export default WatchlistService;
