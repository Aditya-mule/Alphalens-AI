import logging
from typing import List, Optional
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from app.services.qdrant import check_qdrant_health
from app.config import settings
from app.services.llm import generate_fundamental_analysis_llm
from app.services.document_processor import process_pdf_document
from app.services.rag import perform_rag_query
from app.services.portfolio import generate_portfolio_audit_llm, PortfolioAuditPayload, PortfolioAuditResponse
from app.services.comparison import generate_company_comparison_llm, ComparisonPayload, ComparisonResponse
from app.services.news_enricher import generate_news_enrichment_llm, NewsEnrichmentPayload, NewsEnrichmentResponse
from app.services.screener_parser import parse_screener_query_llm, ScreenerParserPayload, ScreenerParserResponse
from app.services.exchange_crawler import crawl_and_sync_disclosure
from app.services.yfinance_service import fetch_yfinance_financials


# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("alphalens-ai")

app = FastAPI(
    title="AlphaLens AI Microservice",
    description="Python FastAPI engine for document vectorization, RAG queries, and financial models",
    version="1.0.0"
)

# Enable CORS for internal and gateway service resolution
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Schemas for Financial Report Request/Response
class FinancialMetrics(BaseModel):
    ticker: str = Field(..., example="AAPL")
    revenue_growth_yoy: float = Field(..., description="YoY Revenue growth rate percentage")
    profit_margin: float = Field(..., description="Operating margin percentage")
    roe: float = Field(..., description="Return on Equity percentage")
    roce: float = Field(..., description="Return on Capital Employed percentage")
    debt_to_equity: float = Field(..., description="Debt to Equity ratio")

class PeerComparisonItem(BaseModel):
    ticker: str
    valuation_pe: float
    net_margin: float

class AnalysisReportResponse(BaseModel):
    ticker: str
    overview: str
    revenue_analysis: str
    profitability_analysis: str
    debt_analysis: str
    risks: List[str]
    opportunities: List[str]
    peer_comparison: List[PeerComparisonItem]
    valuation_verdict: str

class ChatQueryRequest(BaseModel):
    ticker: str
    query: str
    chat_history: Optional[List[dict]] = []

class ChatQueryResponse(BaseModel):
    answer: str
    citations: List[str] = []

class DocumentProcessRequest(BaseModel):
    document_id: str
    filepath: str
    ticker: str

@app.get("/health", status_code=status.HTTP_200_OK)
def health_check():
    return {
        "status": "healthy",
        "service": "alphalens-ai-microservice",
        "qdrant_connected": check_qdrant_health()
    }

@app.post("/api/analyze", response_model=AnalysisReportResponse)
def generate_fundamental_analysis(data: FinancialMetrics):
    logger.info(f"Generating fundamental report for: {data.ticker}")
    return generate_fundamental_analysis_llm(
        ticker=data.ticker,
        revenue_growth_yoy=data.revenue_growth_yoy,
        profit_margin=data.profit_margin,
        roe=data.roe,
        roce=data.roce,
        debt_to_equity=data.debt_to_equity,
        api_key=settings.OPENAI_API_KEY
    )

@app.post("/api/chat", response_model=ChatQueryResponse)
def company_rag_chat(payload: ChatQueryRequest):
    logger.info(f"RAG chat query received for ticker {payload.ticker}: {payload.query}")
    try:
        result = perform_rag_query(
            ticker=payload.ticker,
            query=payload.query,
            chat_history=payload.chat_history
        )
        return ChatQueryResponse(
            answer=result["answer"],
            citations=result["citations"]
        )
    except Exception as e:
        logger.error(f"RAG query execution failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"RAG execution error: {str(e)}"
        )

@app.post("/api/document/process")
def process_document(payload: DocumentProcessRequest):
    logger.info(f"Processing PDF doc {payload.document_id} located at {payload.filepath}")
    try:
        result = process_pdf_document(
            doc_id=payload.document_id,
            filepath=payload.filepath,
            ticker=payload.ticker
        )
        return result
    except Exception as e:
        logger.error(f"Document processing failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ingestion pipeline error: {str(e)}"
        )

@app.post("/api/portfolio/analyze", response_model=PortfolioAuditResponse)
def audit_portfolio(payload: PortfolioAuditPayload):
    logger.info(f"Auditing portfolio: {payload.portfolio_name}")
    try:
        result = generate_portfolio_audit_llm(payload, settings.OPENAI_API_KEY)
        return result
    except Exception as e:
        logger.error(f"Portfolio audit generation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Risk engine error: {str(e)}"
        )

@app.post("/api/compare", response_model=ComparisonResponse)
def compare_stocks(payload: ComparisonPayload):
    logger.info(f"Comparing stocks database records")
    try:
        result = generate_company_comparison_llm(payload, settings.OPENAI_API_KEY)
        return result
    except Exception as e:
        logger.error(f"Stock comparison thesis failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Comparison engine error: {str(e)}"
        )

@app.post("/api/news/enrich", response_model=NewsEnrichmentResponse)
def enrich_news(payload: NewsEnrichmentPayload):
    logger.info(f"Enriching news article: {payload.title}")
    try:
        result = generate_news_enrichment_llm(payload, settings.OPENAI_API_KEY)
        return result
    except Exception as e:
        logger.error(f"News enrichment failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"News enrichment error: {str(e)}"
        )

class CrawlerSyncRequest(BaseModel):
    ticker: str

@app.post("/api/screener", response_model=ScreenerParserResponse)
def parse_screener(payload: ScreenerParserPayload):
    logger.info(f"Parsing natural language screener query: {payload.query}")
    try:
        result = parse_screener_query_llm(payload, settings.OPENAI_API_KEY)
        return result
    except Exception as e:
        logger.error(f"Screener parsing failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"NLP Screener parser error: {str(e)}"
        )

@app.post("/api/crawler/sync")
def sync_exchange_disclosures(payload: CrawlerSyncRequest):
    logger.info(f"Triggering automated exchange sync for: {payload.ticker}")
    try:
        result = crawl_and_sync_disclosure(payload.ticker)
        return result
    except Exception as e:
        logger.error(f"Exchange disclosure sync failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Exchange sync crawler error: {str(e)}"
        )

@app.get("/api/stocks/{ticker}/yfinance")
def get_yfinance_data(ticker: str):
    logger.info(f"Received request for yfinance data of ticker: {ticker}")
    try:
        data = fetch_yfinance_financials(ticker)
        return data
    except Exception as e:
        logger.error(f"Failed to fetch yfinance data for {ticker}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"yfinance service error: {str(e)}"
        )

@app.get("/api/stocks/search")
def search_yfinance_stocks(query: str):
    import requests
    logger.info(f"YFinance Live Search requested for query: {query}")
    if not query.strip():
        return []
    
    url = f"https://query2.finance.yahoo.com/v1/finance/search?q={query}"
    try:
        res = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
        if res.status_code != 200:
            return []
        
        quotes = res.json().get("quotes", [])
        results = []
        for q in quotes:
            symbol = q.get("symbol", "")
            quote_type = q.get("quoteType", "")
            is_indian = (exchange in ["NSI", "BSE"] or symbol.endswith(".NS") or symbol.endswith(".BO") or not exchange)
            if quote_type == "EQUITY" and symbol and is_indian:
                results.append({
                    "ticker": symbol,
                    "name": q.get("longname") or q.get("shortname") or symbol,
                    "exchange": exchange
                })
        return results
    except Exception as e:
        logger.error(f"Live search failed: {e}")
        return []

@app.post("/api/compare", response_model=ComparisonResponse)
def compare_companies(payload: ComparisonPayload):
    logger.info(f"Received request for company comparison: {[c.ticker for c in payload.companies]}")
    try:
        result = generate_company_comparison_llm(payload, settings.OPENAI_API_KEY)
        return result
    except Exception as e:
        logger.error(f"Company comparison analysis failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Comparison service error: {str(e)}"
        )
@app.get("/")
def root():
    return {
        "service": "AlphaLens AI Service",
        "status": "running"
    }
