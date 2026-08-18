import axios from 'axios';
import { NewsRepository } from './news.repository.js';
import logger from '../../config/logger.js';

export class NewsService {
  private newsRepository: NewsRepository;
  private aiServiceUrl: string;

  constructor() {
    this.newsRepository = new NewsRepository();
    this.aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
  }

  async getNewsForTicker(ticker: string) {
    const uppercaseTicker = ticker.toUpperCase();
    logger.info(`Fetching news for ticker: ${uppercaseTicker}`);
    
    // 1. Fetch existing articles from DB
    let articles = await this.newsRepository.findNewsByTicker(uppercaseTicker);
    
    // 2. If no articles exist, seed mock Indian financial news and trigger AI enrichment
    if (articles.length === 0) {
      logger.info(`No local news found for ${uppercaseTicker}. Seeding mock news feed.`);
      const mockFeeds = this.getMockNewsFeed(uppercaseTicker);
      
      for (const item of mockFeeds) {
        try {
          // Request FastAPI AI News Enricher
          const enrichResponse = await axios.post(`${this.aiServiceUrl}/api/news/enrich`, {
            title: item.title,
            ticker: uppercaseTicker,
            raw_text: item.content
          }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000,
          });

          await this.newsRepository.createNewsArticle({
            title: item.title,
            url: item.url,
            summary: enrichResponse.data.summary,
            sentimentScore: enrichResponse.data.sentiment_score,
            companyTicker: uppercaseTicker,
            publishedAt: item.publishedAt,
          });
        } catch (err: any) {
          logger.error(`Failed to enrich mock news article: ${err.message}`);
          // Save with basic mock values
          await this.newsRepository.createNewsArticle({
            title: item.title,
            url: item.url,
            summary: "Enrichment offline. Mapped to Indian business sector reports.",
            sentimentScore: 0.1,
            companyTicker: uppercaseTicker,
            publishedAt: item.publishedAt,
          });
        }
      }
      
      // Query again
      articles = await this.newsRepository.findNewsByTicker(uppercaseTicker);
    }

    return articles;
  }

  async getAllEnrichedNews() {
    return this.newsRepository.listAllNews();
  }

  private getMockNewsFeed(ticker: string) {
    const now = new Date();
    return [
      {
        title: `${ticker} announces expansion of its green energy operations`,
        url: `https://www.livemint.com/industry/${ticker.toLowerCase()}-green-expansion-${Date.now()}`,
        content: `${ticker} declared a fresh investment of ₹10,000 crores into its clean-tech and carbon-neutral utilities, aiming to accelerate production over the next fiscal cycle.`,
        publishedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
      {
        title: `Analysts bullish on ${ticker} following latest quarterly audit results`,
        url: `https://www.moneycontrol.com/news/business/stocks/${ticker.toLowerCase()}-analyst-review-${Date.now()}`,
        content: `Leading brokerage firms upgraded the target price of ${ticker} following positive operating efficiency reports, highlighting strong ROCE margins and lower corporate leverage.`,
        publishedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000), // 12 hours ago
      }
    ];
  }
}

export default NewsService;
