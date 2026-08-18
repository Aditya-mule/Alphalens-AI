import axios from 'axios';
import { PortfoliosRepository } from './portfolios.repository.js';
import { StocksService } from '../stocks/stocks.service.js';
import logger from '../../config/logger.js';

export class PortfoliosService {
  private portfoliosRepository: PortfoliosRepository;
  private stocksService: StocksService;
  private aiServiceUrl: string;

  constructor() {
    this.portfoliosRepository = new PortfoliosRepository();
    this.stocksService = new StocksService();
    this.aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
  }

  async create(userId: string, name: string) {
    return this.portfoliosRepository.createPortfolio({ userId, name });
  }

  async addTransaction(userId: string, data: {
    portfolioId: string;
    ticker: string;
    quantity: number;
    purchasePrice: number;
    transactionDate?: string;
  }) {
    // Verify user owns the portfolio
    const portfolio = await this.portfoliosRepository.findPortfolioById(data.portfolioId);
    if (!portfolio || portfolio.userId !== userId) {
      throw new Error('UnauthorizedPortfolioAccess');
    }

    return this.portfoliosRepository.addTransaction({
      portfolioId: data.portfolioId,
      ticker: data.ticker,
      quantity: data.quantity,
      purchasePrice: data.purchasePrice,
      transactionDate: data.transactionDate ? new Date(data.transactionDate) : undefined,
    });
  }

  async getUserPortfolios(userId: string) {
    return this.portfoliosRepository.findUserPortfolios(userId);
  }

  async getPortfolioAudit(userId: string, portfolioId: string) {
    const portfolio = await this.portfoliosRepository.findPortfolioById(portfolioId);
    if (!portfolio || portfolio.userId !== userId) {
      throw new Error('UnauthorizedPortfolioAccess');
    }

    // 1. Resolve positions
    const positions = await this.portfoliosRepository.getPortfolioPositions(portfolioId);
    if (positions.length === 0) {
      return {
        portfolioName: portfolio.name,
        positions: [],
        metrics: { totalValue: 0, hhiIndex: 0, sectorWeights: {} },
        audit: "No active holdings in this portfolio to analyze."
      };
    }

    // 2. Fetch sector mappings and compute total portfolio & invested values
    let totalPortfolioValue = 0;
    let totalInvestedCapital = 0;
    const positionsWithSector = [];

    for (const pos of positions) {
      const companyInfo = await this.stocksService.getStockDetails(pos.ticker);
      const sector = companyInfo ? companyInfo.sector : 'General Services';
      
      const currentPrice = companyInfo ? companyInfo.price : pos.avgPrice;
      const currentValue = pos.quantity * currentPrice;
      const investedValue = pos.quantity * pos.avgPrice;

      totalPortfolioValue += currentValue;
      totalInvestedCapital += investedValue;

      positionsWithSector.push({
        ...pos,
        sector,
        currentPrice,
        currentValue,
        investedValue,
      });
    }

    // 3. Compute Sector weights, HHI Index, and PnL
    const sectorTotals: Record<string, number> = {};
    let hhiSum = 0;

    const formattedPositions = positionsWithSector.map((pos) => {
      const weightPercentage = totalPortfolioValue > 0 
        ? Number(((pos.currentValue / totalPortfolioValue) * 100).toFixed(2))
        : 0;

      const positionPnL = pos.currentValue - pos.investedValue;
      const positionPnLPercent = pos.investedValue > 0 
        ? Number(((positionPnL / pos.investedValue) * 100).toFixed(2))
        : 0;

      // Add to HHI: sum of squared weights
      hhiSum += weightPercentage * weightPercentage;

      // Add to sector allocations
      sectorTotals[pos.sector] = (sectorTotals[pos.sector] || 0) + pos.currentValue;

      return {
        ticker: pos.ticker,
        quantity: pos.quantity,
        avgPrice: pos.avgPrice,
        currentPrice: pos.currentPrice,
        investedValue: Number(pos.investedValue.toFixed(2)),
        currentValue: Number(pos.currentValue.toFixed(2)),
        unrealizedPnL: Number(positionPnL.toFixed(2)),
        unrealizedPnLPercent: positionPnLPercent,
        weight: weightPercentage,
        sector: pos.sector,
      };
    });

    const sectorWeights: Record<string, number> = {};
    let maxSectorName = '';
    let maxSectorWeight = 0;

    for (const [sector, value] of Object.entries(sectorTotals)) {
      const weight = totalPortfolioValue > 0
        ? Number(((value / totalPortfolioValue) * 100).toFixed(2))
        : 0;
      sectorWeights[sector] = weight;
      if (weight > maxSectorWeight) {
        maxSectorWeight = weight;
        maxSectorName = sector;
      }
    }

    const totalUnrealizedPnL = Number((totalPortfolioValue - totalInvestedCapital).toFixed(2));
    const totalReturnPercentage = totalInvestedCapital > 0 
      ? Number(((totalUnrealizedPnL / totalInvestedCapital) * 100).toFixed(2))
      : 0;

    const hhiIndex = Number(hhiSum.toFixed(2));
    const concentrationWarning = maxSectorWeight >= 35
      ? `Warning: High Concentration Risk — ${maxSectorWeight}% of portfolio is concentrated in ${maxSectorName}`
      : null;

    const metrics = {
      totalValue: Number(totalPortfolioValue.toFixed(2)),
      totalInvested: Number(totalInvestedCapital.toFixed(2)),
      totalPnL: totalUnrealizedPnL,
      totalReturnPercent: totalReturnPercentage,
      hhiIndex,
      sectorWeights,
      concentrationWarning,
    };

    // 4. Request FastAPI AI Review Audit
    try {
      const payload = {
        portfolio_name: portfolio.name,
        total_value: metrics.totalValue,
        hhi_index: metrics.hhiIndex,
        sector_weights: metrics.sectorWeights,
        holdings: formattedPositions.map((p) => ({
          ticker: p.ticker,
          weight: p.weight,
          sector: p.sector,
        })),
      };

      logger.info(`Requesting AI portfolio audit audit payload: ${JSON.stringify(payload)}`);
      
      const response = await axios.post(`${this.aiServiceUrl}/api/portfolio/analyze`, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      });

      return {
        portfolioName: portfolio.name,
        positions: formattedPositions,
        metrics,
        audit: response.data.audit_review,
      };
    } catch (error: any) {
      logger.error(`AI Portfolio Audit API call failed: ${error.message}`);
      
      // Graceful fallback
      return {
        portfolioName: portfolio.name,
        positions: formattedPositions,
        metrics,
        audit: `Audit warning: AI service is currently offline. Your objective diversification index (HHI) is ${hhiIndex}. ` +
          (hhiIndex > 2500 
            ? "Your portfolio is highly concentrated in single holdings, indicating high risk exposure." 
            : "Your portfolio has appropriate diversification parameters.")
      };
    }
  }

  async delete(userId: string, portfolioId: string) {
    const portfolio = await this.portfoliosRepository.findPortfolioById(portfolioId);
    if (!portfolio || portfolio.userId !== userId) {
      throw new Error('UnauthorizedPortfolioAccess');
    }
    return this.portfoliosRepository.deletePortfolio(portfolioId);
  }

  async deleteHolding(userId: string, portfolioId: string, ticker: string) {
    const portfolio = await this.portfoliosRepository.findPortfolioById(portfolioId);
    if (!portfolio || portfolio.userId !== userId) {
      throw new Error('UnauthorizedPortfolioAccess');
    }
    return this.portfoliosRepository.deleteHolding(portfolioId, ticker);
  }
}

export default PortfoliosService;
