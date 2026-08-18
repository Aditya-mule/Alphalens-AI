import prisma from '../../config/prisma.js';

export interface CreatePortfolioData {
  userId: string;
  name: string;
}

export interface AddTransactionData {
  portfolioId: string;
  ticker: string;
  quantity: number;
  purchasePrice: number;
  transactionDate?: Date;
}

export class PortfoliosRepository {
  async createPortfolio(data: CreatePortfolioData) {
    return prisma.portfolio.create({
      data: {
        userId: data.userId,
        name: data.name,
      },
    });
  }

  async addTransaction(data: AddTransactionData) {
    return prisma.transaction.create({
      data: {
        portfolioId: data.portfolioId,
        ticker: data.ticker.toUpperCase(),
        quantity: data.quantity,
        purchasePrice: data.purchasePrice,
        transactionDate: data.transactionDate || new Date(),
      },
    });
  }

  async findUserPortfolios(userId: string) {
    return prisma.portfolio.findMany({
      where: { userId },
      include: {
        transactions: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPortfolioById(portfolioId: string) {
    return prisma.portfolio.findUnique({
      where: { id: portfolioId },
      include: {
        transactions: true,
      },
    });
  }

  async getPortfolioPositions(portfolioId: string) {
    const transactions = await prisma.transaction.findMany({
      where: { portfolioId },
    });

    // Aggregate quantities and compute average prices grouped by ticker
    const positionsMap: Record<string, { ticker: string; quantity: number; totalCost: number }> = {};

    for (const tx of transactions) {
      if (!positionsMap[tx.ticker]) {
        positionsMap[tx.ticker] = {
          ticker: tx.ticker,
          quantity: 0,
          totalCost: 0,
        };
      }

      positionsMap[tx.ticker].quantity += tx.quantity;
      positionsMap[tx.ticker].totalCost += tx.quantity * tx.purchasePrice;
    }

    // Filter out fully liquidated positions (quantity <= 0)
    return Object.values(positionsMap)
      .filter((pos) => pos.quantity > 0)
      .map((pos) => ({
        ticker: pos.ticker,
        quantity: pos.quantity,
        avgPrice: Number((pos.totalCost / pos.quantity).toFixed(2)),
        totalValue: pos.totalCost,
      }));
  }

  async deletePortfolio(portfolioId: string) {
    await prisma.transaction.deleteMany({
      where: { portfolioId },
    });
    return prisma.portfolio.delete({
      where: { id: portfolioId },
    });
  }

  async deleteHolding(portfolioId: string, ticker: string) {
    return prisma.transaction.deleteMany({
      where: {
        portfolioId,
        ticker: ticker.toUpperCase(),
      },
    });
  }
}

export default PortfoliosRepository;
