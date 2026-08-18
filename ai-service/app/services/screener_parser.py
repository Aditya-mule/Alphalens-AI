import logging
from typing import Optional
from pydantic import BaseModel, Field
from openai import OpenAI
from app.config import settings

logger = logging.getLogger("alphalens-ai")

class ScreenerParserPayload(BaseModel):
    query: str

class ScreenerParserResponse(BaseModel):
    sector: Optional[str] = Field(None, description="The industry sector or sub-category to filter for (e.g. 'Defense', 'Banking', 'Finance', 'PSU', 'Renewable Energy', 'Automotive', 'Technology', 'Financial Services', 'Energy & Conglomerates', 'Consumer Goods', 'Healthcare', 'Real Estate') or null if not specified")
    min_roce: Optional[float] = Field(None, description="Minimum Return on Capital Employed (ROCE) percentage or null if not specified")
    max_debt_to_equity: Optional[float] = Field(None, description="Maximum Debt-to-Equity leverage ratio or null if not specified")
    max_pe: Optional[float] = Field(None, description="Maximum Price-to-Earnings (P/E) ratio or null if not specified")
    max_pb: Optional[float] = Field(None, description="Maximum Price-to-Book (P/B) ratio or null if not specified")
    min_cagr: Optional[float] = Field(None, description="Minimum Revenue CAGR / YoY growth percentage or null if not specified")
    min_opm: Optional[float] = Field(None, description="Minimum Operating Profit Margin (OPM) percentage or null if not specified")
    min_dividend_yield: Optional[float] = Field(None, description="Minimum Dividend Yield percentage or null if not specified")
    min_market_cap: Optional[float] = Field(None, description="Minimum Market Capitalization in INR Crores or null if not specified (e.g. 5000 for mid/large cap)")
    explanation: str = Field(..., description="Short explanation of how the natural language search was translated into parameters")

def parse_screener_query_llm(payload: ScreenerParserPayload, api_key: Optional[str]) -> ScreenerParserResponse:
    if not api_key or api_key == "your-openai-api-key-here":
        logger.warning(f"No OPENAI_API_KEY configured. Returning basic screener translation.")
        
        # Simple rule-based translation fallback for local demo offline testing
        query_lower = payload.query.lower()
        sector = None
        min_roce = None
        max_debt = None
        max_pe = None
        max_pb = None
        min_cagr = None
        min_opm = None
        min_div = None
        min_mcap = None
        
        if "defence" in query_lower or "defense" in query_lower or "aerospace" in query_lower:
            sector = "Defense"
        elif "bank" in query_lower:
            sector = "Banking"
        elif "nbfc" in query_lower or "finance" in query_lower or "financial" in query_lower:
            sector = "Finance"
        elif "psu" in query_lower or "government" in query_lower or "public sector" in query_lower:
            sector = "PSU"
        elif "renewable" in query_lower or "green energy" in query_lower or "solar" in query_lower:
            sector = "Renewable Energy"
        elif "auto" in query_lower or "vehicle" in query_lower or "ev" in query_lower:
            sector = "Automotive"
        elif "tech" in query_lower or "software" in query_lower or "it" in query_lower:
            sector = "Technology"
        elif "energy" in query_lower or "oil" in query_lower:
            sector = "Energy & Conglomerates"
        elif "consumer" in query_lower or "fmcg" in query_lower:
            sector = "Consumer Goods"
        elif "health" in query_lower or "pharma" in query_lower:
            sector = "Healthcare"
        elif "real" in query_lower or "property" in query_lower:
            sector = "Real Estate"
            
        if "high roce" in query_lower or "roce >" in query_lower or "roce" in query_lower:
            min_roce = 30.0
            
        if "low debt" in query_lower or "no debt" in query_lower or "leverage" in query_lower:
            max_debt = 0.5
            
        if "pe <" in query_lower or "low pe" in query_lower or "pe" in query_lower:
            max_pe = 30.0
            
        if "pb <" in query_lower or "low pb" in query_lower or "pb" in query_lower:
            max_pb = 3.0
            
        if "cagr >" in query_lower or "cagr" in query_lower or "growth" in query_lower:
            min_cagr = 15.0
            
        if "margin" in query_lower or "opm" in query_lower:
            min_opm = 15.0
            
        if "dividend" in query_lower or "yield" in query_lower:
            min_div = 1.5
            
        if "large cap" in query_lower or "mcap" in query_lower:
            min_mcap = 20000.0
            
        return ScreenerParserResponse(
            sector=sector,
            min_roce=min_roce,
            max_debt_to_equity=max_debt,
            max_pe=max_pe,
            max_pb=max_pb,
            min_cagr=min_cagr,
            min_opm=min_opm,
            min_dividend_yield=min_div,
            min_market_cap=min_mcap,
            explanation=f"Rule-based fallback: mapped '{payload.query}' to sector={sector}, min_roce={min_roce}, max_debt={max_debt}, max_pe={max_pe}, min_cagr={min_cagr}."
        )

    client = OpenAI(api_key=api_key)

    system_prompt = (
        "You are an NLP database parser for an Indian stock screening application. "
        "Your task is to translate the user's natural language stock screening query into a structured "
        "JSON filter format. Map target industry sectors or sub-categories to exact standard sector tags: "
        "'Defense', 'Banking' (pure banks), 'Finance' (NBFCs/financial services), 'PSU' (public sector enterprises), "
        "'Renewable Energy', 'Automotive', 'Technology', 'Financial Services', 'Energy & Conglomerates', "
        "'Consumer Goods', 'Healthcare', 'Real Estate'. "
        "Extract numerical parameters for ROCE (min_roce), Debt-to-Equity (max_debt_to_equity), PE Ratio (max_pe), "
        "PB Ratio (max_pb), CAGR/growth (min_cagr), OPM/margins (min_opm), Dividend Yield (min_dividend_yield), "
        "and Market Capitalization (min_market_cap) based on the query semantics."
    )

    try:
        logger.info(f"Calling OpenAI Structured Outputs for Screener parsing: {payload.query}")
        completion = client.beta.chat.completions.parse(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Screener Prompt: {payload.query}"}
            ],
            response_format=ScreenerParserResponse,
            temperature=0.1
        )

        parsed_response = completion.choices[0].message.parsed
        if parsed_response:
            return parsed_response
        else:
            raise ValueError("OpenAI returned empty parsing response.")
    except Exception as e:
        logger.error(f"Failed to parse screener query via LLM: {e}")
        return ScreenerParserResponse(
            sector=None,
            min_roce=None,
            max_debt_to_equity=None,
            max_pe=None,
            max_pb=None,
            min_cagr=None,
            min_opm=None,
            min_dividend_yield=None,
            min_market_cap=None,
            explanation="Failed to compile LLM parser. Showing general metrics."
        )
