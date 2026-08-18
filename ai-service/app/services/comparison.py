import logging
from typing import List, Optional
from pydantic import BaseModel, Field
from openai import OpenAI
from app.config import settings

logger = logging.getLogger("alphalens-ai")

class CompareCompanyItem(BaseModel):
    ticker: str
    name: str
    price: float
    market_cap: Optional[float] = 5000.0
    pe_ratio: Optional[float] = 25.0
    pb_ratio: Optional[float] = 3.5
    revenue_growth_yoy: float
    operating_margin: float
    roe: float
    roce: float
    debt_to_equity: float
    dividend_yield: Optional[float] = 1.2

class ComparisonPayload(BaseModel):
    companies: List[CompareCompanyItem]

class ComparisonResponse(BaseModel):
    ticker_a: str = Field(..., description="First company ticker symbol")
    ticker_b: str = Field(..., description="Second company ticker symbol")
    winner_ticker: str = Field(..., description="Overall winning ticker symbol or DRAW")
    winner_reason: str = Field(..., description="1-2 sentence core justification for the winner")
    valuation_winner: str = Field(..., description="Ticker with superior valuation parameters")
    growth_winner: str = Field(..., description="Ticker with superior revenue growth CAGR")
    margins_winner: str = Field(..., description="Ticker with superior operating margins and ROCE")
    debt_winner: str = Field(..., description="Ticker with healthier debt-to-equity ratio")
    valuation_analysis: str = Field(..., description="Comparative evaluation of P/E and P/B ratios")
    growth_analysis: str = Field(..., description="Comparative evaluation of revenue growth rate")
    margins_analysis: str = Field(..., description="Comparative evaluation of OPM, ROCE, and ROE")
    debt_analysis: str = Field(..., description="Comparative evaluation of leverage and solvency")
    verdict_summary: str = Field(..., description="Final head-to-head investment thesis summary")

def generate_company_comparison_llm(payload: ComparisonPayload, api_key: Optional[str]) -> ComparisonResponse:
    tickers = [c.ticker for c in payload.companies]
    tA = tickers[0] if len(tickers) > 0 else "STOCK_A"
    tB = tickers[1] if len(tickers) > 1 else "STOCK_B"

    # Rule-based deterministic fallback logic when OpenAI API key is missing or offline
    cA = payload.companies[0] if len(payload.companies) > 0 else None
    cB = payload.companies[1] if len(payload.companies) > 1 else None

    def get_fallback():
        winner = tA
        winner_reason = f"{tA} shows overall higher capital efficiency and return metrics."
        val_w = tA
        growth_w = tA
        margin_w = tA
        debt_w = tA

        if cA and cB:
            if cB.roce > cA.roce and cB.operating_margin > cA.operating_margin:
                winner = tB
                winner_reason = f"{tB} outpaces {tA} with higher ROCE ({cB.roce}%) and superior operating margin ({cB.operating_margin}%)."
            val_w = tB if (cB.pe_ratio or 25) < (cA.pe_ratio or 25) else tA
            growth_w = tB if cB.revenue_growth_yoy > cA.revenue_growth_yoy else tA
            margin_w = tB if cB.operating_margin > cA.operating_margin else tA
            debt_w = tB if cB.debt_to_equity < cA.debt_to_equity else tA

        return ComparisonResponse(
            ticker_a=tA,
            ticker_b=tB,
            winner_ticker=winner,
            winner_reason=winner_reason,
            valuation_winner=val_w,
            growth_winner=growth_w,
            margins_winner=margin_w,
            debt_winner=debt_w,
            valuation_analysis=f"Comparing valuation: {tA} trades at P/E {cA.pe_ratio if cA else 25} and P/B {cA.pb_ratio if cA else 3.5}, whereas {tB} trades at P/E {cB.pe_ratio if cB else 25} and P/B {cB.pb_ratio if cB else 3.5}. {val_w} offers a more attractive relative valuation.",
            growth_analysis=f"Comparing growth: {tA} generated {cA.revenue_growth_yoy if cA else 5}% YoY revenue growth vs {cB.revenue_growth_yoy if cB else 5}% for {tB}. {growth_w} exhibits stronger top-line growth momentum.",
            margins_analysis=f"Comparing margins & capital return: {tA} delivers {cA.operating_margin if cA else 15}% OPM and {cA.roce if cA else 12}% ROCE vs {cB.operating_margin if cB else 15}% OPM and {cB.roce if cB else 12}% ROCE for {tB}.",
            debt_analysis=f"Comparing debt health: {tA} operates with D/E of {cA.debt_to_equity if cA else 0.5} vs {cB.debt_to_equity if cB else 0.5} for {tB}. {debt_w} maintains a safer balance sheet profile.",
            verdict_summary=f"Head-to-Head Verdict: {winner} edges out {tB if winner == tA else tA} as the quality bet based on overall capital efficiency, margins, and financial health."
        )

    if not api_key or api_key == "your-openai-api-key-here":
        logger.warning("No OPENAI_API_KEY configured. Returning fallback structured comparison scorecard.")
        return get_fallback()

    client = OpenAI(api_key=api_key)

    system_prompt = (
        "You are a Senior Equity Research Analyst evaluating two Indian listed companies in a head-to-head VS Mode comparison. "
        "Your task is to produce a structured comparative scorecard evaluating: "
        "1. Overall Winner & Core Reason "
        "2. Valuation Winner (P/E, P/B) "
        "3. Growth Winner (Revenue CAGR) "
        "4. Margins & ROCE Winner (Operating Efficiency) "
        "5. Debt Health Winner (Solvency & D/E) "
        "Provide concise, professional analysis paragraphs for each section under current Indian stock market dynamics."
    )

    user_message = (
        f"Head-to-Head Stock Comparison Data Input:\n"
        f"- Target Companies:\n"
        f"{[c.model_dump() for c in payload.companies]}\n"
    )

    try:
        logger.info(f"Calling OpenAI Structured Outputs for Stock VS Mode Comparison: {tickers}")
        completion = client.beta.chat.completions.parse(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            response_format=ComparisonResponse,
            temperature=0.2
        )

        parsed_response = completion.choices[0].message.parsed
        if parsed_response:
            return parsed_response
        else:
            raise ValueError("OpenAI returned empty parsing response.")
    except Exception as e:
        logger.error(f"Failed to generate comparison thesis via LLM: {e}")
        return get_fallback()
