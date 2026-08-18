import axios from 'axios';
import prisma from '../../config/prisma.js';
import { StocksRepository } from '../stocks/stocks.repository.js';
import { StocksService } from '../stocks/stocks.service.js';
import logger from '../../config/logger.js';

const INDIAN_SECTOR_UNIVERSE: Record<string, string[]> = {
  "defense": [
    "HAL.NS", "BEL.NS", "BHEL.NS", "BDL.NS", "MAZDOCK.NS", "COCHINSHIP.NS", "DATAPATTNS.NS"
  ],
  "defence": [
    "HAL.NS", "BEL.NS", "BHEL.NS", "BDL.NS", "MAZDOCK.NS", "COCHINSHIP.NS", "DATAPATTNS.NS"
  ],
  "banking": [
    "HDFCBANK.NS", "ICICIBANK.NS", "SBIN.NS", "AXISBANK.NS", "KOTAKBANK.NS", 
    "BANKBARODA.NS", "CANBK.NS", "PNB.NS", "INDUSINDBK.NS", "FEDERALBNK.NS", "IDFCFIRSTB.NS", "AUBANK.NS", "BANDHANBNK.NS"
  ],
  "bank": [
    "HDFCBANK.NS", "ICICIBANK.NS", "SBIN.NS", "AXISBANK.NS", "KOTAKBANK.NS", 
    "BANKBARODA.NS", "CANBK.NS", "PNB.NS", "INDUSINDBK.NS", "FEDERALBNK.NS", "IDFCFIRSTB.NS", "AUBANK.NS", "BANDHANBNK.NS"
  ],
  "finance": [
    "BAJFINANCE.NS", "BAJAJFINSV.NS", "CHOLAFIN.NS", "MUTHOOTFIN.NS", "SHRIRAMFIN.NS", "PFC.NS", "RECLTD.NS", "JIOFIN.NS", "MANAPPURAM.NS", "LICHSGFIN.NS"
  ],
  "nbfc": [
    "BAJFINANCE.NS", "BAJAJFINSV.NS", "CHOLAFIN.NS", "MUTHOOTFIN.NS", "SHRIRAMFIN.NS", "PFC.NS", "RECLTD.NS", "JIOFIN.NS", "MANAPPURAM.NS", "LICHSGFIN.NS"
  ],
  "psu": [
    "SBIN.NS", "COALINDIA.NS", "ONGC.NS", "IOC.NS", "BPCL.NS", "PFC.NS", 
    "RECLTD.NS", "GAIL.NS", "IREDA.NS", "BEL.NS", "HAL.NS", "BHEL.NS", "NTPC.NS", "POWERGRID.NS", "HPCL.NS", "NHPC.NS", "SJVN.NS", "OIL.NS", "NMDC.NS", "IRCTC.NS", "IRFC.NS", "RVNL.NS", "CONCOR.NS"
  ],
  "renewable energy": [
    "TATAPOWER.NS", "ADANIGREEN.NS", "SUZLON.NS", "IREDA.NS", "ADANIPOWER.NS", "TORNTPOWER.NS", "NHPC.NS", "SJVN.NS"
  ],
  "green energy": [
    "TATAPOWER.NS", "ADANIGREEN.NS", "SUZLON.NS", "IREDA.NS", "ADANIPOWER.NS", "TORNTPOWER.NS", "NHPC.NS", "SJVN.NS"
  ],
  "real estate": [
    "DLF.NS", "GODREJPROP.NS", "OBEROIRLTY.NS", "PRESTIGE.NS", 
    "PHOENIXLTD.NS", "BRIGADE.NS", "SOBHA.NS", "SUNTECK.NS", "LODHA.NS"
  ],
  "technology": [
    "TCS.NS", "INFY.NS", "WIPRO.NS", "HCLTECH.NS", "TECHM.NS", 
    "LTIM.NS", "COFORGE.NS", "PERSISTENT.NS", "KPITTECH.NS", "OFSS.NS", "TATAELXSI.NS", "MPHASIS.NS", "CYIENT.NS"
  ],
  "it": [
    "TCS.NS", "INFY.NS", "WIPRO.NS", "HCLTECH.NS", "TECHM.NS", 
    "LTIM.NS", "COFORGE.NS", "PERSISTENT.NS", "KPITTECH.NS", "OFSS.NS", "TATAELXSI.NS", "MPHASIS.NS", "CYIENT.NS"
  ],
  "financial services": [
    "HDFCBANK.NS", "ICICIBANK.NS", "SBIN.NS", "AXISBANK.NS", "KOTAKBANK.NS", 
    "BANKBARODA.NS", "BAJFINANCE.NS", "BAJAJFINSV.NS", "CHOLAFIN.NS", "MUTHOOTFIN.NS", "SHRIRAMFIN.NS", "PFC.NS", "RECLTD.NS"
  ],
  "consumer goods": [
    "HINDUNILVR.NS", "ITC.NS", "NESTLEIND.NS", "BRITANNIA.NS", "TATACONSUM.NS", 
    "DABUR.NS", "GODREJCP.NS", "MARICO.NS", "COLPAL.NS", "VBL.NS", "TITAN.NS", "TRENT.NS", "DMART.NS"
  ],
  "fmcg": [
    "HINDUNILVR.NS", "ITC.NS", "NESTLEIND.NS", "BRITANNIA.NS", "TATACONSUM.NS", 
    "DABUR.NS", "GODREJCP.NS", "MARICO.NS", "COLPAL.NS", "VBL.NS"
  ],
  "healthcare": [
    "SUNPHARMA.NS", "DRREDDY.NS", "CIPLA.NS", "DIVISLAB.NS", "APOLLOHOSP.NS", 
    "MANKIND.NS", "TORNTPHARM.NS", "LUPIN.NS", "ZYDUSLIFE.NS", "MAXHEALTH.NS", "FORTIS.NS", "BIOCON.NS"
  ],
  "pharma": [
    "SUNPHARMA.NS", "DRREDDY.NS", "CIPLA.NS", "DIVISLAB.NS", "APOLLOHOSP.NS", 
    "MANKIND.NS", "TORNTPHARM.NS", "LUPIN.NS", "ZYDUSLIFE.NS", "MAXHEALTH.NS", "BIOCON.NS"
  ],
  "energy & conglomerates": [
    "RELIANCE.NS", "NTPC.NS", "ONGC.NS", "POWERGRID.NS", "TATAPOWER.NS", 
    "ADANIGREEN.NS", "COALINDIA.NS", "IOC.NS", "BPCL.NS", "GAIL.NS", "ADANIENT.NS"
  ],
  "automotive": [
    "TATAMOTORS.NS", "M&M.NS", "MARUTI.NS", "BAJAJ-AUTO.NS", "EICHERMOT.NS", "HEROMOTOCO.NS", "TVSMOTOR.NS", "BOSCHLTD.NS", "MOTHERSON.NS", "BALKRISIND.NS"
  ],
  "auto": [
    "TATAMOTORS.NS", "M&M.NS", "MARUTI.NS", "BAJAJ-AUTO.NS", "EICHERMOT.NS", "HEROMOTOCO.NS", "TVSMOTOR.NS", "BOSCHLTD.NS", "MOTHERSON.NS"
  ],
  "metals": [
    "TATASTEEL.NS", "JSWSTEEL.NS", "HINDALCO.NS", "COALINDIA.NS", "NMDC.NS", "VEDL.NS", "NATIONALUM.NS", "JINDALSTEL.NS", "SAIL.NS"
  ],
  "metal": [
    "TATASTEEL.NS", "JSWSTEEL.NS", "HINDALCO.NS", "COALINDIA.NS", "NMDC.NS", "VEDL.NS", "NATIONALUM.NS", "JINDALSTEL.NS", "SAIL.NS"
  ],
  "chemicals": [
    "PIDILITIND.NS", "SRF.NS", "DEEPAKNTR.NS", "LINDEINDIA.NS", "TATACHEM.NS", "UPL.NS", "GUJGASLTD.NS"
  ],
  "industrial & infrastructure": [
    "LT.NS", "SIEMENS.NS", "ABB.NS", "HAL.NS", "BEL.NS", "BHEL.NS", "POLYCAB.NS", "HAVELLS.NS", "CUMMINSIND.NS", "CGPOWER.NS", "TITAGARH.NS", "RVNL.NS"
  ],
  "railways": [
    "IRCTC.NS", "IRFC.NS", "RVNL.NS", "CONCOR.NS", "TITAGARH.NS", "TEXRAIL.NS"
  ]
};

export class ScreenerService {
  private stocksRepository: StocksRepository;
  private stocksService: StocksService;
  private aiServiceUrl: string;

  constructor() {
    this.stocksRepository = new StocksRepository();
    this.stocksService = new StocksService();
    this.aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
  }

  async screenStocks(naturalLanguageQuery: string) {
    logger.info(`Screener query received: "${naturalLanguageQuery}"`);

    // 1. Request FastAPI parsing
    let filters: any = {
      sector: null as string | null,
      min_roce: null as number | null,
      max_debt_to_equity: null as number | null,
      explanation: "Natural language parsing offline. Showing all tech blue-chips."
    };

    try {
      const response = await axios.post(`${this.aiServiceUrl}/api/screener`, {
        query: naturalLanguageQuery,
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      });

      filters = response.data;
      logger.info(`FastAPI returned structured filters: ${JSON.stringify(filters)}`);
    } catch (err: any) {
      logger.error(`AI Screener API call failed: ${err.message}`);
    }

    // 2. Fetch all candidate stocks (DB records + sector universe + user stocks)
    const dbCompanies = await this.stocksRepository.queryCompaniesFromDB(filters.sector);
    
    // Dynamically discover tickers matching the parsed sector query
    const discoveredTickers: string[] = [];
    if (filters.sector) {
      const secKey = filters.sector.toLowerCase().trim();
      const mapped = INDIAN_SECTOR_UNIVERSE[secKey] || [];
      discoveredTickers.push(...mapped);

      try {
        const searchResponse = await axios.get(`${this.aiServiceUrl}/api/stocks/search?query=${encodeURIComponent(filters.sector)}`, {
          timeout: 4000
        });
        if (Array.isArray(searchResponse.data)) {
          for (const item of searchResponse.data) {
            if (item.ticker) {
              discoveredTickers.push(item.ticker);
            }
          }
        }
      } catch (err: any) {
        logger.warn(`Failed to dynamically discover stocks for sector ${filters.sector}: ${err.message}`);
      }
    } else {
      // If no specific sector was requested, include all major sector leaders as candidates
      Object.values(INDIAN_SECTOR_UNIVERSE).forEach(list => discoveredTickers.push(...list));
    }
    
    // Find all custom tickers in database
    const watched = await prisma.watchlist.findMany({ select: { ticker: true } }) as { ticker: string }[];
    const transactions = await prisma.transaction.findMany({ select: { ticker: true } }) as { ticker: string }[];
    const dbTickers = Array.from(new Set([
      ...watched.map((w) => w.ticker),
      ...transactions.map((t) => t.ticker),
      ...discoveredTickers
    ]));
    
    const uniqueTickers = Array.from(new Set([
      ...dbCompanies.map(c => c.ticker),
      ...dbTickers
    ]));
    
    // Resolve candidate tickers in small concurrency chunks of 5 to avoid Yahoo Finance rate limits
    const resolvedCompanies: any[] = [];
    const chunkSize = 5;

    for (let i = 0; i < uniqueTickers.length; i += chunkSize) {
      const chunk = uniqueTickers.slice(i, i + chunkSize);
      const chunkResults = await Promise.all(
        chunk.map(async ticker => {
          try {
            const details = await this.stocksService.getStockDetails(ticker);
            const isMockFallback = !details || details.name?.includes('Corporation') || details.marketCap === 5000;

            if (details && !isMockFallback) {
              prisma.company.upsert({
                where: { ticker: details.ticker },
                update: {
                  name: details.name,
                  sector: details.sector,
                  industry: details.industry,
                  price: details.price,
                  revenue: details.revenue,
                  revenueGrowthYoY: details.revenueGrowthYoY,
                  netIncome: details.netIncome,
                  operatingMargin: details.operatingMargin,
                  roe: details.roe,
                  roce: details.roce,
                  debtToEquity: details.debtToEquity,
                  peRatio: details.peRatio,
                  pbRatio: details.pbRatio,
                  dividendYield: details.dividendYield,
                  marketCap: details.marketCap
                },
                create: {
                  ticker: details.ticker,
                  name: details.name,
                  sector: details.sector,
                  industry: details.industry,
                  price: details.price,
                  revenue: details.revenue,
                  revenueGrowthYoY: details.revenueGrowthYoY,
                  netIncome: details.netIncome,
                  operatingMargin: details.operatingMargin,
                  roe: details.roe,
                  roce: details.roce,
                  debtToEquity: details.debtToEquity,
                  peRatio: details.peRatio !== undefined ? details.peRatio : 25,
                  pbRatio: details.pbRatio !== undefined ? details.pbRatio : 3.5,
                  dividendYield: details.dividendYield !== undefined ? details.dividendYield : 1.2,
                  marketCap: details.marketCap || 5000
                }
              }).catch(() => {});
              return details;
            }

            // If live resolution returned mock fallback or failed, use seeded PostgreSQL record
            const dbMatch = dbCompanies.find(c => c.ticker === ticker);
            if (dbMatch) return dbMatch;
            return details;
          } catch (err: any) {
            logger.warn(`Failed to resolve ticker ${ticker} for screener: ${err.message}`);
            return dbCompanies.find(c => c.ticker === ticker) || null;
          }
        })
      );

      resolvedCompanies.push(...chunkResults);
      if (i + chunkSize < uniqueTickers.length) {
        await new Promise(res => setTimeout(res, 80));
      }
    }
    
    const allCompanies = resolvedCompanies.filter(c => c !== null) as any[];
    
    // 3. Apply filters locally
    const filtered = allCompanies.filter((company) => {
      // Sector filter
      if (filters.sector && company.sector.toLowerCase() !== filters.sector.toLowerCase()) {
        if (discoveredTickers.includes(company.ticker)) {
          company.sector = filters.sector;
        } else {
          return false;
        }
      }
      // ROCE filter
      if (filters.min_roce !== null && filters.min_roce !== undefined && company.roce < filters.min_roce) {
        return false;
      }
      // Leverage filter
      if (filters.max_debt_to_equity !== null && filters.max_debt_to_equity !== undefined && company.debtToEquity > filters.max_debt_to_equity) {
        return false;
      }
      // PE Ratio filter
      if (filters.max_pe !== null && filters.max_pe !== undefined) {
        const val = company.peRatio !== undefined ? company.peRatio : 25.0;
        if (val > filters.max_pe) return false;
      }
      // PB Ratio filter
      if (filters.max_pb !== null && filters.max_pb !== undefined) {
        const val = company.pbRatio !== undefined ? company.pbRatio : 3.5;
        if (val > filters.max_pb) return false;
      }
      // CAGR filter
      if (filters.min_cagr !== null && filters.min_cagr !== undefined) {
        if (company.revenueGrowthYoY < filters.min_cagr) return false;
      }
      // Operating Profit Margin filter
      if (filters.min_opm !== null && filters.min_opm !== undefined) {
        if (company.operatingMargin < filters.min_opm) return false;
      }
      // Dividend Yield filter
      if (filters.min_dividend_yield !== null && filters.min_dividend_yield !== undefined) {
        const val = company.dividendYield !== undefined ? company.dividendYield : 1.2;
        if (val < filters.min_dividend_yield) return false;
      }
      // Market Cap filter
      if (filters.min_market_cap !== null && filters.min_market_cap !== undefined) {
        const val = company.marketCap !== undefined ? company.marketCap : 5000.0;
        if (val < filters.min_market_cap) return false;
      }
      return true;
    });

    return {
      filters: {
        sector: filters.sector,
        minRoce: filters.min_roce,
        maxDebtToEquity: filters.max_debt_to_equity,
        maxPe: filters.max_pe,
        maxPb: filters.max_pb,
        minCagr: filters.min_cagr,
        minOpm: filters.min_opm,
        minDividendYield: filters.min_dividend_yield,
        minMarketCap: filters.min_market_cap,
      },
      explanation: filters.explanation,
      results: filtered,
    };
  }
}

export default ScreenerService;
