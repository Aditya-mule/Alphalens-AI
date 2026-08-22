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
    
    // Purge outdated Reliance mock template articles if ticker is not Reliance
    const cleanSym = uppercaseTicker.replace('.NS', '').replace('.BO', '');
    if (cleanSym !== 'RELIANCE') {
      const corrupted = articles.filter(a => a.title.includes('RELIANCE') || a.summary?.includes('RELIANCE'));
      if (corrupted.length > 0) {
        logger.info(`Purging ${corrupted.length} corrupted Reliance articles for ticker: ${uppercaseTicker}`);
        await this.newsRepository.deleteNewsByTicker(uppercaseTicker);
        articles = [];
      }
    }
    
    // 2. If no articles exist, seed company & sector specific news feed
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
    const sym = ticker.toUpperCase().replace('.NS', '').replace('.BO', '');

    if (['KPITTECH', 'TCS', 'INFY', 'WIPRO', 'HCLTECH', 'TECHM', 'LTIM'].includes(sym)) {
      return [
        {
          title: `${sym} secures multi-million dollar cloud & AI transformation contract`,
          url: `https://www.livemint.com/market/${sym.toLowerCase()}-cloud-contract-${Date.now()}`,
          content: `${sym} announced a strategic partnership with global enterprise leaders to scale AI integration and cloud infrastructure, driving operating revenue growth.`,
          publishedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        },
        {
          title: `Brokerages issue Buy rating on ${sym} following strong quarterly operating performance`,
          url: `https://www.moneycontrol.com/news/business/stocks/${sym.toLowerCase()}-rating-${Date.now()}`,
          content: `Analyst reports highlight robust EBIT margins and strong digital deal momentum for ${sym}, reaffirming positive long-term return on capital.`,
          publishedAt: new Date(now.getTime() - 10 * 60 * 60 * 1000),
        }
      ];
    } else if (['HDFCBANK', 'ICICIBANK', 'SBIN', 'AXISBANK', 'KOTAKBANK'].includes(sym)) {
      return [
        {
          title: `${sym} reports healthy credit expansion and stable Net Interest Margins`,
          url: `https://www.livemint.com/banking/${sym.toLowerCase()}-credit-growth-${Date.now()}`,
          content: `${sym} registered double-digit loan book expansion with pristine asset quality and improving Net NPA figures across retail and corporate banking segments.`,
          publishedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
        },
        {
          title: `Institutional investors increase stake in ${sym} amidst favorable banking outlook`,
          url: `https://www.moneycontrol.com/news/business/${sym.toLowerCase()}-institutional-stake-${Date.now()}`,
          content: `Foreign and domestic institutional investors expanded holdings in ${sym}, citing robust return on equity (ROE) and capital adequacy ratios.`,
          publishedAt: new Date(now.getTime() - 14 * 60 * 60 * 1000),
        }
      ];
    } else {
      return [
        {
          title: `${sym} reports resilient quarterly performance and steady operational expansion`,
          url: `https://www.livemint.com/companies/${sym.toLowerCase()}-quarterly-performance-${Date.now()}`,
          content: `${sym} announced steady top-line growth driven by core market demand, maintaining healthy operating margins and disciplined capital allocation.`,
          publishedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        },
        {
          title: `Analysts highlight strong balance sheet health and ROCE metrics for ${sym}`,
          url: `https://www.moneycontrol.com/news/business/stocks/${sym.toLowerCase()}-balance-sheet-${Date.now()}`,
          content: `Market analysts noted ${sym}'s conservative leverage profile and sustained return metrics as key growth drivers for upcoming quarters.`,
          publishedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
        }
      ];
    }
  }
}

export default NewsService;
