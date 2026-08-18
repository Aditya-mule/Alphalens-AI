import logging
from typing import Optional
from pydantic import BaseModel, Field
from openai import OpenAI
from app.config import settings

logger = logging.getLogger("alphalens-ai")

class NewsEnrichmentPayload(BaseModel):
    title: str
    ticker: str
    raw_text: str

class NewsEnrichmentResponse(BaseModel):
    summary: str = Field(..., description="Bulleted summary of the article contents")
    sentiment_score: float = Field(..., description="Sentiment score from -1.0 (extremely negative) to +1.0 (extremely positive)")
    impact_explanation: str = Field(..., description="Brief summary of potential stock/business impact")

def generate_news_enrichment_llm(payload: NewsEnrichmentPayload, api_key: Optional[str]) -> NewsEnrichmentResponse:
    if not api_key or api_key == "your-openai-api-key-here":
        logger.warning(f"No OPENAI_API_KEY configured. Returning mock news enrichment for {payload.ticker}.")
        return NewsEnrichmentResponse(
            summary=f"Mock Summary: {payload.title}. The company announced new investment expansions.",
            sentiment_score=0.45,
            impact_explanation="Positive impact: signals organic growth and capital efficiency gains in the energy/IT sector."
        )

    client = OpenAI(api_key=api_key)

    system_prompt = (
        "You are an expert financial journalist and sentiment analyst. "
        "Your task is to analyze the provided financial news article. "
        "Summarize it in short bullet points, output a sentiment score between -1.0 (highly negative/bearish) "
        "and +1.0 (highly positive/bullish), and briefly explain the potential short-term and long-term "
        "business impact on the target company ticker. Strictly follow the JSON output schema."
    )

    user_message = (
        f"News Article Details:\n"
        f"- Target Ticker: {payload.ticker}\n"
        f"- Title: {payload.title}\n"
        f"- Raw Content Snippet: {payload.raw_text}\n"
    )

    try:
        logger.info(f"Calling OpenAI Structured Outputs for News Ingestion: {payload.title}")
        completion = client.beta.chat.completions.parse(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            response_format=NewsEnrichmentResponse,
            temperature=0.1
        )

        parsed_response = completion.choices[0].message.parsed
        if parsed_response:
            return parsed_response
        else:
            raise ValueError("OpenAI returned empty parsing response.")
    except Exception as e:
        logger.error(f"Failed to generate news enrichment via LLM: {e}")
        return NewsEnrichmentResponse(
            summary=f"Summary fallback for: {payload.title}.",
            sentiment_score=0.0,
            impact_explanation="Neutral impact: unable to run active LLM models."
        )
