import prisma from '../../config/prisma.js';

export interface CompanyFinancials {
  ticker: str;
  name: string;
  price: number;
  revenue: number;
  revenueGrowthYoY: number;
  netIncome: number;
  operatingMargin: number;
  roe: number;
  roce: number;
  debtToEquity: number;
  peRatio?: number;
  pbRatio?: number;
  dividendYield?: number;
  marketCap?: number;
  sector: string;
  industry: string;
}

// Fallback high-quality financial data for local demo testing
const MOCK_COMPANIES: Record<string, CompanyFinancials> = {
  RELIANCE: {
    ticker: 'RELIANCE',
    name: 'Reliance Industries Limited',
    price: 2950.45,
    revenue: 9741500000000,
    revenueGrowthYoY: 8.2,
    netIncome: 696210000000,
    operatingMargin: 12.8,
    roe: 9.8,
    roce: 10.2,
    debtToEquity: 0.38,
    peRatio: 28.5,
    pbRatio: 2.4,
    dividendYield: 0.45,
    marketCap: 1995000,
    sector: 'Energy & Conglomerates',
    industry: 'Oil, Gas & Telecom'
  },
  TCS: {
    ticker: 'TCS',
    name: 'Tata Consultancy Services Limited',
    price: 3820.80,
    revenue: 2408900000000,
    revenueGrowthYoY: 6.8,
    netIncome: 459100000000,
    operatingMargin: 26.2,
    roe: 48.5,
    roce: 52.8,
    debtToEquity: 0.02,
    peRatio: 30.2,
    pbRatio: 12.8,
    dividendYield: 1.45,
    marketCap: 1385000,
    sector: 'Technology',
    industry: 'IT Services & Consulting'
  },
  INFY: {
    ticker: 'INFY',
    name: 'Infosys Limited',
    price: 1475.25,
    revenue: 1536700000000,
    revenueGrowthYoY: 4.7,
    netIncome: 262300000000,
    operatingMargin: 21.0,
    roe: 32.4,
    roce: 38.5,
    debtToEquity: 0.05,
    peRatio: 23.5,
    pbRatio: 7.2,
    dividendYield: 2.30,
    marketCap: 615000,
    sector: 'Technology',
    industry: 'IT Services & Consulting'
  },
  HDFCBANK: {
    ticker: 'HDFCBANK',
    name: 'HDFC Bank Limited',
    price: 1530.10,
    revenue: 2164000000000,
    revenueGrowthYoY: 14.3,
    netIncome: 608100000000,
    operatingMargin: 42.5,
    roe: 16.5,
    roce: 12.4,
    debtToEquity: 7.2,
    peRatio: 19.2,
    pbRatio: 2.8,
    dividendYield: 1.25,
    marketCap: 1165000,
    sector: 'Financial Services',
    industry: 'Private Sector Banking'
  },
  SUZLON: {
    ticker: 'SUZLON',
    name: 'Suzlon Energy Limited',
    price: 50.25,
    revenue: 59400000000,
    revenueGrowthYoY: 18.5,
    netIncome: 6600000000,
    operatingMargin: 11.2,
    roe: 22.4,
    roce: 20.5,
    debtToEquity: 0.15,
    peRatio: 38.5,
    pbRatio: 5.4,
    dividendYield: 0.00,
    marketCap: 68500,
    sector: 'Energy & Conglomerates',
    industry: 'Wind Power & Renewable Energy'
  },
  ZOMATO: {
    ticker: 'ZOMATO',
    name: 'Zomato Limited',
    price: 185.50,
    revenue: 121100000000,
    revenueGrowthYoY: 37.2,
    netIncome: 3500000000,
    operatingMargin: 2.8,
    roe: 4.2,
    roce: 8.5,
    debtToEquity: 0.02,
    peRatio: 85.0,
    pbRatio: 8.2,
    dividendYield: 0.00,
    marketCap: 165000,
    sector: 'Technology',
    industry: 'Food Delivery & Quick Commerce'
  },
  IREDA: {
    ticker: 'IREDA',
    name: 'Indian Renewable Energy Development Agency Limited',
    price: 165.20,
    revenue: 49800000000,
    revenueGrowthYoY: 24.6,
    netIncome: 12500000000,
    operatingMargin: 25.1,
    roe: 15.8,
    roce: 11.8,
    debtToEquity: 5.8,
    peRatio: 35.6,
    pbRatio: 4.8,
    dividendYield: 0.85,
    marketCap: 44500,
    sector: 'Financial Services',
    industry: 'Green Financing & Infrastructure'
  },
  TATAMOTORS: {
    ticker: 'TATAMOTORS',
    name: 'Tata Motors Limited',
    price: 960.30,
    revenue: 4379000000000,
    revenueGrowthYoY: 26.6,
    netIncome: 318000000000,
    operatingMargin: 7.2,
    roe: 25.2,
    roce: 23.8,
    debtToEquity: 0.85,
    peRatio: 10.8,
    pbRatio: 3.8,
    dividendYield: 0.65,
    marketCap: 352000,
    sector: 'General Industries',
    industry: 'Automotive & Commercial Vehicles'
  },
  WIPRO: {
    ticker: 'WIPRO',
    name: 'Wipro Limited',
    price: 480.20,
    revenue: 900000000000,
    revenueGrowthYoY: 3.5,
    netIncome: 110000000000,
    operatingMargin: 16.0,
    roe: 18.2,
    roce: 19.5,
    debtToEquity: 0.12,
    peRatio: 21.4,
    pbRatio: 3.2,
    dividendYield: 0.20,
    marketCap: 251000,
    sector: 'Technology',
    industry: 'IT Services & Consulting'
  },
  HCLTECH: {
    ticker: 'HCLTECH',
    name: 'HCL Technologies Limited',
    price: 1350.50,
    revenue: 1050000000000,
    revenueGrowthYoY: 5.4,
    netIncome: 145000000000,
    operatingMargin: 18.5,
    roe: 22.0,
    roce: 24.5,
    debtToEquity: 0.08,
    peRatio: 24.8,
    pbRatio: 5.6,
    dividendYield: 3.80,
    marketCap: 366000,
    sector: 'Technology',
    industry: 'IT Services & Consulting'
  },
  KPITTECH: {
    ticker: 'KPITTECH.NS',
    name: 'KPIT Technologies Limited',
    price: 1482.00,
    revenue: 48000000000,
    revenueGrowthYoY: 38.5,
    netIncome: 6500000000,
    operatingMargin: 15.2,
    roe: 25.4,
    roce: 25.69,
    debtToEquity: 0.06,
    peRatio: 65.2,
    pbRatio: 15.4,
    dividendYield: 0.45,
    marketCap: 40500,
    sector: 'Technology',
    industry: 'Automotive Software Solutions'
  },
  LODHA: {
    ticker: 'LODHA.NS',
    name: 'Macrotech Developers Limited (Lodha)',
    price: 1243.90,
    revenue: 100000000000,
    revenueGrowthYoY: 15.0,
    netIncome: 12000000000,
    operatingMargin: 20.0,
    roe: 11.2,
    roce: 12.5,
    debtToEquity: 0.45,
    peRatio: 48.2,
    pbRatio: 4.1,
    dividendYield: 0.80,
    marketCap: 122000,
    sector: 'Real Estate',
    industry: 'Residential Real Estate Development'
  },
  HDBFS: {
    ticker: 'HDBFS.NS',
    name: 'HDB Financial Services Limited',
    price: 685.00,
    revenue: 140000000000,
    revenueGrowthYoY: 11.5,
    netIncome: 20000000000,
    operatingMargin: 18.0,
    roe: 14.5,
    roce: 12.8,
    debtToEquity: 6.2,
    peRatio: 24.5,
    pbRatio: 3.6,
    dividendYield: 1.10,
    marketCap: 54000,
    sector: 'Financial Services',
    industry: 'Non-Banking Financial Company (NBFC)'
  },
  SBIN: {
    ticker: 'SBIN',
    name: 'State Bank of India',
    price: 740.50,
    revenue: 4200000000000,
    revenueGrowthYoY: 12.4,
    netIncome: 610000000000,
    operatingMargin: 38.0,
    roe: 18.5,
    roce: 11.2,
    debtToEquity: 8.5,
    peRatio: 10.5,
    pbRatio: 1.6,
    dividendYield: 1.85,
    marketCap: 660000,
    sector: 'Financial Services',
    industry: 'Public Sector Banking'
  },
  ICICIBANK: {
    ticker: 'ICICIBANK',
    name: 'ICICI Bank Limited',
    price: 1120.40,
    revenue: 1800000000000,
    revenueGrowthYoY: 16.5,
    netIncome: 410000000000,
    operatingMargin: 40.2,
    roe: 17.8,
    roce: 13.5,
    debtToEquity: 6.9,
    peRatio: 17.8,
    pbRatio: 3.1,
    dividendYield: 0.90,
    marketCap: 785000,
    sector: 'Financial Services',
    industry: 'Private Sector Banking'
  },
  AXISBANK: {
    ticker: 'AXISBANK',
    name: 'Axis Bank Limited',
    price: 1040.60,
    revenue: 1200000000000,
    revenueGrowthYoY: 13.8,
    netIncome: 260000000000,
    operatingMargin: 37.5,
    roe: 15.2,
    roce: 12.0,
    debtToEquity: 7.5,
    peRatio: 14.2,
    pbRatio: 2.2,
    dividendYield: 0.10,
    marketCap: 321000,
    sector: 'Financial Services',
    industry: 'Private Sector Banking'
  },
  BAJFINANCE: {
    ticker: 'BAJFINANCE',
    name: 'Bajaj Finance Limited',
    price: 6850.00,
    revenue: 520000000000,
    revenueGrowthYoY: 22.4,
    netIncome: 145000000000,
    operatingMargin: 35.0,
    roe: 20.2,
    roce: 15.8,
    debtToEquity: 3.5,
    peRatio: 31.4,
    pbRatio: 5.8,
    dividendYield: 0.55,
    marketCap: 423000,
    sector: 'Financial Services',
    industry: 'Consumer Lending & NBFC'
  },
  ONGC: {
    ticker: 'ONGC',
    name: 'Oil and Natural Gas Corporation Limited',
    price: 260.40,
    revenue: 6400000000000,
    revenueGrowthYoY: 5.8,
    netIncome: 390000000000,
    operatingMargin: 12.0,
    roe: 14.5,
    roce: 13.2,
    debtToEquity: 0.45,
    peRatio: 7.2,
    pbRatio: 1.1,
    dividendYield: 4.85,
    marketCap: 328000,
    sector: 'Energy & Conglomerates',
    industry: 'Oil & Gas Exploration'
  },
  NTPC: {
    ticker: 'NTPC',
    name: 'NTPC Limited',
    price: 350.25,
    revenue: 1700000000000,
    revenueGrowthYoY: 9.8,
    netIncome: 180000000000,
    operatingMargin: 16.5,
    roe: 12.8,
    roce: 9.8,
    debtToEquity: 1.6,
    peRatio: 18.5,
    pbRatio: 2.1,
    dividendYield: 2.20,
    marketCap: 339000,
    sector: 'Energy & Conglomerates',
    industry: 'Power Generation & Utility'
  },
  ITC: {
    ticker: 'ITC',
    name: 'ITC Limited',
    price: 430.20,
    revenue: 700000000000,
    revenueGrowthYoY: 6.5,
    netIncome: 205000000000,
    operatingMargin: 36.2,
    roe: 28.5,
    roce: 38.2,
    debtToEquity: 0.01,
    peRatio: 26.2,
    pbRatio: 7.8,
    dividendYield: 3.20,
    marketCap: 537000,
    sector: 'Consumer Goods',
    industry: 'Diversified Conglomerate & FMCG'
  },
  HINDUNILVR: {
    ticker: 'HINDUNILVR',
    name: 'Hindustan Unilever Limited',
    price: 2450.40,
    revenue: 600000000000,
    revenueGrowthYoY: 4.8,
    netIncome: 102000000000,
    operatingMargin: 22.5,
    roe: 20.4,
    roce: 28.5,
    debtToEquity: 0.02,
    peRatio: 55.4,
    pbRatio: 11.2,
    dividendYield: 1.65,
    marketCap: 575000,
    sector: 'Consumer Goods',
    industry: 'Fast Moving Consumer Goods (FMCG)'
  },
  SUNPHARMA: {
    ticker: 'SUNPHARMA',
    name: 'Sun Pharmaceutical Industries Limited',
    price: 1540.80,
    revenue: 480000000000,
    revenueGrowthYoY: 10.4,
    netIncome: 95000000000,
    operatingMargin: 24.5,
    roe: 16.8,
    roce: 18.5,
    debtToEquity: 0.04,
    peRatio: 38.8,
    pbRatio: 5.2,
    dividendYield: 0.85,
    marketCap: 370000,
    sector: 'Healthcare',
    industry: 'Generic & Specialty Pharmaceuticals'
  },
  LT: {
    ticker: 'LT',
    name: 'Larsen & Toubro Limited',
    price: 3650.00,
    revenue: 2300000000000,
    revenueGrowthYoY: 14.5,
    netIncome: 125000000000,
    operatingMargin: 11.5,
    roe: 14.8,
    roce: 12.0,
    debtToEquity: 1.25,
    peRatio: 32.5,
    pbRatio: 4.5,
    dividendYield: 0.75,
    marketCap: 501000,
    sector: 'General Industries',
    industry: 'Engineering & Construction'
  }
};

export class StocksRepository {
  async findByTicker(ticker: string): Promise<CompanyFinancials | null> {
    const uppercaseTicker = ticker.toUpperCase().trim();
    
    try {
      // 1. Exact DB match
      let dbRecord = await prisma.company.findUnique({
        where: { ticker: uppercaseTicker }
      });

      // 2. Fuzzy DB match if exact ticker not found (e.g. ICICI -> ICICIBANK, SBI -> SBIN)
      if (!dbRecord) {
        dbRecord = await prisma.company.findFirst({
          where: {
            OR: [
              { ticker: { startsWith: uppercaseTicker, mode: 'insensitive' } },
              { ticker: { contains: uppercaseTicker, mode: 'insensitive' } },
              { name: { contains: uppercaseTicker, mode: 'insensitive' } }
            ]
          },
          orderBy: { marketCap: 'desc' }
        });
      }

      if (dbRecord) {
        return {
          ticker: dbRecord.ticker,
          name: dbRecord.name,
          price: dbRecord.price,
          revenue: dbRecord.revenue,
          revenueGrowthYoY: dbRecord.revenueGrowthYoY,
          netIncome: dbRecord.netIncome,
          operatingMargin: dbRecord.operatingMargin,
          roe: dbRecord.roe,
          roce: dbRecord.roce,
          debtToEquity: dbRecord.debtToEquity,
          peRatio: dbRecord.peRatio,
          pbRatio: dbRecord.pbRatio,
          dividendYield: dbRecord.dividendYield,
          marketCap: dbRecord.marketCap,
          sector: dbRecord.sector,
          industry: dbRecord.industry
        };
      }
    } catch (err: any) {
      // DB fallback
    }

    if (MOCK_COMPANIES[uppercaseTicker]) {
      return MOCK_COMPANIES[uppercaseTicker];
    }

    return null;
  }

  async resolveTicker(query: string): Promise<string> {
    const term = query.trim().toUpperCase();
    if (!term) return term;

    try {
      const exactMatch = await prisma.company.findUnique({
        where: { ticker: term }
      });
      if (exactMatch) return exactMatch.ticker;

      const topMatch = await prisma.company.findFirst({
        where: {
          OR: [
            { ticker: { startsWith: term, mode: 'insensitive' } },
            { ticker: { contains: term, mode: 'insensitive' } },
            { name: { contains: term, mode: 'insensitive' } }
          ]
        },
        orderBy: { marketCap: 'desc' }
      });

      if (topMatch) {
        return topMatch.ticker;
      }
    } catch (err: any) {
      // DB error
    }

    return term;
  }

  async seedCompanies() {
    try {
      const companies = Object.values(MOCK_COMPANIES);
      for (const comp of companies) {
        await prisma.company.upsert({
          where: { ticker: comp.ticker },
          update: {
            name: comp.name,
            sector: comp.sector,
            industry: comp.industry,
            price: comp.price,
            revenue: comp.revenue,
            revenueGrowthYoY: comp.revenueGrowthYoY,
            netIncome: comp.netIncome,
            operatingMargin: comp.operatingMargin,
            roe: comp.roe,
            roce: comp.roce,
            debtToEquity: comp.debtToEquity,
            peRatio: comp.peRatio !== undefined ? comp.peRatio : 25,
            pbRatio: comp.pbRatio !== undefined ? comp.pbRatio : 3.5,
            dividendYield: comp.dividendYield !== undefined ? comp.dividendYield : 1.2,
            marketCap: comp.marketCap || 5000
          },
          create: {
            ticker: comp.ticker,
            name: comp.name,
            sector: comp.sector,
            industry: comp.industry,
            price: comp.price,
            revenue: comp.revenue,
            revenueGrowthYoY: comp.revenueGrowthYoY,
            netIncome: comp.netIncome,
            operatingMargin: comp.operatingMargin,
            roe: comp.roe,
            roce: comp.roce,
            debtToEquity: comp.debtToEquity,
            peRatio: comp.peRatio !== undefined ? comp.peRatio : 25,
            pbRatio: comp.pbRatio !== undefined ? comp.pbRatio : 3.5,
            dividendYield: comp.dividendYield !== undefined ? comp.dividendYield : 1.2,
            marketCap: comp.marketCap || 5000
          }
        });
      }
    } catch (err: any) {
      // Ignore DB seed warnings
    }
  }

  async queryCompaniesFromDB(sector?: string | null): Promise<CompanyFinancials[]> {
    try {
      this.seedCompanies().catch(() => {});
      let whereClause: any = {};
      if (sector && sector.trim()) {
        whereClause.sector = {
          contains: sector.trim(),
          mode: 'insensitive'
        };
      }
      const dbRecords = await prisma.company.findMany({
        where: whereClause,
        orderBy: { marketCap: 'desc' }
      });
      if (dbRecords.length > 0) {
        return dbRecords as CompanyFinancials[];
      }
    } catch (err: any) {
      // Fallback to in-memory MOCK_COMPANIES
    }
    return Object.values(MOCK_COMPANIES);
  }

  async search(query: string): Promise<CompanyFinancials[]> {
    const term = query.trim();
    if (!term) {
      return Object.values(MOCK_COMPANIES);
    }

    try {
      // 1. Search PostgreSQL DB across all ~2,553 listed NSE companies
      const dbMatches = await prisma.company.findMany({
        where: {
          OR: [
            { ticker: { contains: term, mode: 'insensitive' } },
            { name: { contains: term, mode: 'insensitive' } }
          ]
        },
        orderBy: { marketCap: 'desc' },
        take: 12
      });

      if (dbMatches.length > 0) {
        return dbMatches as CompanyFinancials[];
      }
    } catch (err: any) {
      // DB search error fallback
    }

    const uppercaseTerm = term.toUpperCase();
    const results = Object.values(MOCK_COMPANIES).filter(
      (c) => c.ticker.includes(uppercaseTerm) || c.name.toUpperCase().includes(uppercaseTerm)
    );

    return results;
  }
}

export default StocksRepository;
export type str = string;
