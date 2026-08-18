import axios from 'axios';
import prisma from '../config/prisma.js';

function classifySector(symbol: string, name: string): { sector: string; industry: string } {
  const sym = symbol.toUpperCase();
  const n = name.toLowerCase();

  // Defense
  if (n.includes('defense') || n.includes('defence') || n.includes('aeronautics') || n.includes('shipyard') || n.includes('dock') || ['HAL', 'BEL', 'BHEL', 'BDL', 'MAZDOCK', 'COCHINSHIP', 'DATAPATTNS', 'PARAS'].includes(sym)) {
    return { sector: 'Defense', industry: 'Aerospace & Defense' };
  }
  // Banking
  if ((n.includes('bank') && !n.includes('world bank')) || ['HDFCBANK', 'ICICIBANK', 'SBIN', 'AXISBANK', 'KOTAKBANK', 'BANKBARODA', 'CANBK', 'PNB', 'INDUSINDBK', 'FEDERALBNK', 'IDFCFIRSTB', 'AUBANK', 'BANDHANBNK', 'BANKINDIA', 'IOB', 'UCOBANK'].includes(sym)) {
    return { sector: 'Banking', industry: 'Commercial Banking' };
  }
  // Finance / NBFC
  if (n.includes('finance') || n.includes('financial') || n.includes('capital') || n.includes('securities') || n.includes('credit') || n.includes('nbfc') || ['BAJFINANCE', 'BAJAJFINSV', 'CHOLAFIN', 'MUTHOOTFIN', 'SHRIRAMFIN', 'PFC', 'RECLTD', 'JIOFIN', 'MANAPPURAM', 'LICHSGFIN'].includes(sym)) {
    return { sector: 'Finance', industry: 'Non-Banking Financial Services' };
  }
  // Real Estate
  if (n.includes('realty') || n.includes('estate') || n.includes('properties') || n.includes('developers') || n.includes('housing') || n.includes('land') || ['DLF', 'GODREJPROP', 'OBEROIRLTY', 'PRESTIGE', 'PHOENIXLTD', 'BRIGADE', 'SOBHA', 'SUNTECK', 'LODHA'].includes(sym)) {
    return { sector: 'Real Estate', industry: 'Real Estate & Property Development' };
  }
  // Technology
  if (n.includes('tech') || n.includes('software') || n.includes('infotech') || n.includes('system') || n.includes('digital') || n.includes('comput') || ['TCS', 'INFY', 'WIPRO', 'HCLTECH', 'TECHM', 'LTIM', 'COFORGE', 'PERSISTENT', 'KPITTECH', 'OFSS', 'TATAELXSI', 'MPHASIS'].includes(sym)) {
    return { sector: 'Technology', industry: 'IT Services & Software' };
  }
  // Healthcare / Pharma
  if (n.includes('pharma') || n.includes('health') || n.includes('hospital') || n.includes('lab') || n.includes('bio') || n.includes('drugs') || ['SUNPHARMA', 'DRREDDY', 'CIPLA', 'DIVISLAB', 'APOLLOHOSP', 'MANKIND', 'TORNTPHARM', 'LUPIN', 'ZYDUSLIFE', 'MAXHEALTH'].includes(sym)) {
    return { sector: 'Healthcare', industry: 'Pharmaceuticals & Healthcare Services' };
  }
  // Automotive
  if (n.includes('motor') || n.includes('auto') || n.includes('vehicle') || n.includes('tyre') || n.includes('tire') || ['TATAMOTORS', 'M&M', 'MARUTI', 'BAJAJ-AUTO', 'EICHERMOT', 'HEROMOTOCO', 'TVSMOTOR', 'BOSCHLTD', 'MOTHERSON'].includes(sym)) {
    return { sector: 'Automotive', industry: 'Automobiles & Auto Components' };
  }
  // Consumer Goods / FMCG
  if (n.includes('consumer') || n.includes('fmcg') || n.includes('food') || n.includes('beverage') || n.includes('retail') || n.includes('sugar') || n.includes('tea') || n.includes('dairy') || ['HINDUNILVR', 'ITC', 'NESTLEIND', 'BRITANNIA', 'TATACONSUM', 'DABUR', 'GODREJCP', 'MARICO', 'COLPAL', 'VBL', 'TITAN', 'TRENT', 'DMART'].includes(sym)) {
    return { sector: 'Consumer Goods', industry: 'Fast Moving Consumer Goods (FMCG)' };
  }
  // Energy & Utilities
  if (n.includes('power') || n.includes('energy') || n.includes('gas') || n.includes('oil') || n.includes('solar') || n.includes('wind') || ['RELIANCE', 'NTPC', 'ONGC', 'POWERGRID', 'TATAPOWER', 'ADANIGREEN', 'COALINDIA', 'IOC', 'BPCL', 'GAIL', 'SUZLON', 'IREDA'].includes(sym)) {
    return { sector: 'Energy & Conglomerates', industry: 'Power, Oil & Gas' };
  }
  // Metals & Mining
  if (n.includes('steel') || n.includes('metal') || n.includes('mine') || n.includes('iron') || n.includes('zinc') || n.includes('aluminum') || ['TATASTEEL', 'JSWSTEEL', 'HINDALCO', 'COALINDIA', 'NMDC', 'VEDL', 'NATIONALUM', 'JINDALSTEL', 'SAIL'].includes(sym)) {
    return { sector: 'Metals & Mining', industry: 'Mining & Basic Metals' };
  }
  // Chemicals
  if (n.includes('chem') || n.includes('petro') || n.includes('fertilizer') || n.includes('polymer') || ['PIDILITIND', 'SRF', 'DEEPAKNTR', 'LINDEINDIA', 'TATACHEM', 'UPL', 'GUJGASLTD'].includes(sym)) {
    return { sector: 'Chemicals', industry: 'Specialty & Basic Chemicals' };
  }
  // Infrastructure & Construction
  if (n.includes('infra') || n.includes('construct') || n.includes('engineer') || n.includes('cable') || n.includes('pipe') || ['LT', 'SIEMENS', 'ABB', 'POLYCAB', 'HAVELLS', 'CUMMINSIND', 'CGPOWER', 'TITAGARH', 'TEXRAIL'].includes(sym)) {
    return { sector: 'Industrial & Infrastructure', industry: 'Capital Goods & Infrastructure' };
  }

  // General default fallback
  return { sector: 'Industrial & Infrastructure', industry: 'Diversified Listed Equities' };
}

export async function seedFullNSEUniverse() {
  console.log('Fetching official active NSE equities master list...');
  try {
    const response = await axios.get('https://archives.nseindia.com/content/equities/EQUITY_L.csv', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 15000
    });

    const lines = response.data.split('\n');
    console.log(`Downloaded ${lines.length} lines from NSE archives.`);

    let count = 0;
    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const parts = line.split(',');
      if (parts.length < 2) continue;

      const rawSymbol = parts[0]?.trim();
      const rawName = parts[1]?.trim().replace(/^"|"$/g, '');
      if (!rawSymbol || !rawName || rawSymbol === 'SYMBOL') continue;

      const ticker = `${rawSymbol}.NS`;
      const { sector, industry } = classifySector(rawSymbol, rawName);

      // Generate baseline realistic financials for full market indexing
      const marketCap = Math.floor(Math.random() * 80000) + 500;
      const peRatio = parseFloat((Math.random() * 40 + 8).toFixed(2));
      const pbRatio = parseFloat((Math.random() * 6 + 0.8).toFixed(2));
      const roce = parseFloat((Math.random() * 35 + 5).toFixed(2));
      const debtToEquity = parseFloat((Math.random() * 1.5).toFixed(2));
      const operatingMargin = parseFloat((Math.random() * 25 + 5).toFixed(2));
      const revenueGrowthYoY = parseFloat((Math.random() * 25 + 2).toFixed(2));
      const dividendYield = parseFloat((Math.random() * 3.5).toFixed(2));
      const price = parseFloat((Math.random() * 1500 + 50).toFixed(2));

      await prisma.company.upsert({
        where: { ticker },
        update: {
          name: rawName,
          sector,
          industry,
          price,
          revenue: marketCap * 10000000 * 0.8,
          revenueGrowthYoY,
          netIncome: marketCap * 10000000 * 0.1,
          operatingMargin,
          roe: roce * 0.85,
          roce,
          debtToEquity,
          peRatio,
          pbRatio,
          dividendYield,
          marketCap
        },
        create: {
          ticker,
          name: rawName,
          sector,
          industry,
          price,
          revenue: marketCap * 10000000 * 0.8,
          revenueGrowthYoY,
          netIncome: marketCap * 10000000 * 0.1,
          operatingMargin,
          roe: roce * 0.85,
          roce,
          debtToEquity,
          peRatio,
          pbRatio,
          dividendYield,
          marketCap
        }
      });
      count++;
      if (count % 500 === 0) {
        console.log(`Seeded ${count} companies into PostgreSQL...`);
      }
    }

    console.log(`✅ Successfully seeded ${count} active NSE listed companies into PostgreSQL database!`);
  } catch (err: any) {
    console.error(`Failed to seed full NSE universe: ${err.message}`);
  }
}

seedFullNSEUniverse().then(() => process.exit(0));
