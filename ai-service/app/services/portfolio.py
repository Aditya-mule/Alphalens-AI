import logging
from typing import List, Dict, Optional
from pydantic import BaseModel, Field
from openai import OpenAI
from app.config import settings

logger = logging.getLogger("alphalens-ai")

class PortfolioHoldingItem(BaseModel):
    ticker: str
    weight: float
    sector: str

class PortfolioAuditPayload(BaseModel):
    portfolio_name: str
    total_value: float
    hhi_index: float
    sector_weights: Dict
    holdings: List[PortfolioHoldingItem]

class PortfolioAuditResponse(BaseModel):
    audit_review: str

def generate_portfolio_audit_llm(payload: PortfolioAuditPayload, api_key: Optional[str]) -> PortfolioAuditResponse:
    if not api_key or api_key == "your-openai-api-key-here":
        logger.warning("No OPENAI_API_KEY configured. Returning mock portfolio audit.")
        return PortfolioAuditResponse(
            audit_review=f"OpenAI API Key is not set. (Mock Audit Review): Portfolio '{payload.portfolio_name}' has a concentration HHI of {payload.hhi_index}. "
            "Asset allocations are appropriate for Indian IT and banking segments, but watch out for financial sector exposures."
        )

    client = OpenAI(api_key=api_key)

    system_prompt = (
        "You are an expert investment risk officer specialized in the Indian Stock Market. "
        "Your task is to write a detailed, professional audit review of the user's equity portfolio. "
        "Analyze the concentration risk based on the HHI Index (where HHI > 2500 indicates high concentration, "
        "1500-2500 is moderate, and < 1500 is well-diversified). Provide strategic allocation "
        "critiques in the context of Indian macro sectors, regulations, and risk tolerances. Keep the audit "
        "professional, structured, and constructive."
    )

    user_message = (
        f"Portfolio Audit Request Details:\n"
        f"- Portfolio Name: {payload.portfolio_name}\n"
        f"- Total Portfolio Value: ₹{payload.total_value:,.2f}\n"
        f"- Concentration Index (HHI): {payload.hhi_index}\n"
        f"- Sector Weight Distributions: {payload.sector_weights}\n"
        f"- Holdings detail: {[h.model_dump() for h in payload.holdings]}\n"
    )

    try:
        logger.info(f"Calling OpenAI Structured Outputs for Portfolio Audit: {payload.portfolio_name}")
        completion = client.beta.chat.completions.parse(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            response_format=PortfolioAuditResponse,
            temperature=0.2
        )

        parsed_response = completion.choices[0].message.parsed
        if parsed_response:
            return parsed_response
        else:
            raise ValueError("OpenAI returned empty parsing response.")
    except Exception as e:
        logger.error(f"Failed to generate portfolio audit via LLM: {e}")
        return PortfolioAuditResponse(
            audit_review=f"Audit execution fallback: Concentration index stands at {payload.hhi_index}. sector holdings are primarily located in: {list(payload.sector_weights.keys())}."
        )
