import prisma from '../../config/prisma.js';

export interface CreateNewsData {
  title: string;
  url: string;
  summary?: string;
  sentimentScore?: number;
  companyTicker: string;
  publishedAt: Date;
}

export class NewsRepository {
  async createNewsArticle(data: CreateNewsData) {
    return prisma.news.upsert({
      where: { url: data.url },
      update: {
        summary: data.summary,
        sentimentScore: data.sentimentScore,
        companyTicker: data.companyTicker.toUpperCase(),
      },
      create: {
        title: data.title,
        url: data.url,
        summary: data.summary,
        sentimentScore: data.sentimentScore,
        companyTicker: data.companyTicker.toUpperCase(),
        publishedAt: data.publishedAt,
      },
    });
  }

  async findNewsByTicker(ticker: string) {
    return prisma.news.findMany({
      where: { companyTicker: ticker.toUpperCase() },
      orderBy: { publishedAt: 'desc' },
    });
  }

  async listAllNews(limit: number = 20) {
    return prisma.news.findMany({
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });
  }
}

export default NewsRepository;
