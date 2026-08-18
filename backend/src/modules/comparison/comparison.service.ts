import axios from 'axios';
import { StocksRepository } from '../stocks/stocks.repository.js';
import logger from '../../config/logger.js';

export class ComparisonService {
  private stocksRepository: StocksRepository;
  private aiServiceUrl: string;

  constructor() {
    this.stocksRepository = new StocksRepository();
    this.aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
  }

  async compareCompanies(tickers: string[]) {
    logger.info(`Comparing companies: ${tickers.join(', ')}`);
    const companiesData = [];

    // Retrieve financials for each stock symbol
    for (const ticker of tickers) {
      const financials = await this.stocksRepository.findByTicker(ticker);
      if (financials) {
        companiesData.push(financials);
      }
    }

    if (companiesData.length === 0) {
      throw new Error('NoValidCompaniesFound');
    }

    try {
      const payload = {
        companies: companiesData.map((c) => ({
          ticker: c.ticker,
          name: c.name,
          price: c.price,
          revenue_growth_yoy: c.revenueGrowthYoY,
          operating_margin: c.operatingMargin,
          roe: c.roe,
          roce: c.roce,
          debt_to_equity: c.debtToEquity,
        })),
      };

      logger.info(`Forwading comparison payload to AI service: ${JSON.stringify(payload)}`);
      
      const response = await axios.post(`${this.aiServiceUrl}/api/compare`, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 20000,
      });

      return {
        matrix: companiesData,
        analysis: response.data.comparison_thesis,
      };
    } catch (error: any) {
      logger.error(`AI Comparison API call failed: ${error.message}`);
      
      // Fallback
      return {
        matrix: companiesData,
        analysis: "AI Comparison summary temporary offline. View metrics in the grid."
      };
    }
  }
}

export default ComparisonService;
