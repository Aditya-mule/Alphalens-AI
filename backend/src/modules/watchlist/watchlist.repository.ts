import prisma from '../../config/prisma.js';

export class WatchlistRepository {
  async addToWatchlist(userId: string, ticker: string) {
    const uppercaseTicker = ticker.toUpperCase();
    return prisma.watchlist.upsert({
      where: {
        userId_ticker: {
          userId,
          ticker: uppercaseTicker,
        },
      },
      update: {}, // Do nothing if it already exists
      create: {
        userId,
        ticker: uppercaseTicker,
      },
    });
  }

  async removeFromWatchlist(userId: string, ticker: string) {
    return prisma.watchlist.delete({
      where: {
        userId_ticker: {
          userId,
          ticker: ticker.toUpperCase(),
        },
      },
    });
  }

  async getWatchlistByUser(userId: string) {
    return prisma.watchlist.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export default WatchlistRepository;
