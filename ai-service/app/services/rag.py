import logging
from typing import List, Dict, Optional
from openai import OpenAI
from app.services.qdrant import qdrant_client
from app.services.yfinance_service import fetch_yfinance_financials
from app.config import settings

logger = logging.getLogger("alphalens-ai")

def perform_rag_query(
    ticker: str,
    query: str,
    chat_history: Optional[List[dict]] = None
) -> dict:
    logger.info(f"Executing RAG query for ticker {ticker}: {query}")

    api_key = settings.OPENAI_API_KEY
    if not api_key or api_key == "your-openai-api-key-here":
        logger.warning("No OPENAI_API_KEY configured. Returning mock RAG answer.")
        return {
            "answer": f"OpenAI API Key is not set. (Mock Answer): The latest annual filing details for {ticker} show strong revenue expansion across its segment lines.",
            "citations": ["System Placeholder Filings Page 12"]
        }

    # Fetch live verified financial metrics for the target ticker
    fin_data = {}
    try:
        fin_data = fetch_yfinance_financials(ticker)
    except Exception as e:
        logger.warning(f"Could not fetch yfinance metrics for RAG prompt: {e}")

    collection_name = f"company_{ticker.lower()}"
    client = OpenAI(api_key=api_key)
    
    context_chunks = []
    citations = []

    # 1. Attempt Vector search in Qdrant if client is connected
    if qdrant_client:
        try:
            collections = qdrant_client.get_collections().collections
            exists = any(c.name == collection_name for c in collections)
            
            if exists:
                embed_response = client.embeddings.create(
                    model="text-embedding-3-small",
                    input=[query]
                )
                query_vector = embed_response.data[0].embedding

                if hasattr(qdrant_client, "query_points"):
                    query_res = qdrant_client.query_points(
                        collection_name=collection_name,
                        query=query_vector,
                        limit=5
                    )
                    search_results = query_res.points
                elif hasattr(qdrant_client, "search"):
                    search_results = qdrant_client.search(
                        collection_name=collection_name,
                        query_vector=query_vector,
                        limit=5
                    )
                else:
                    search_results = qdrant_client.search_points(
                        collection_name=collection_name,
                        vector=query_vector,
                        limit=5
                    ).points

                for result in search_results:
                    payload = result.payload
                    if payload:
                        content = payload.get("content", "")
                        page = payload.get("page", "?")
                        doc_id = payload.get("document_id", "DOC")
                        
                        context_chunks.append(content)
                        citation_str = f"Page {page} (Doc ID: {doc_id})"
                        if citation_str not in citations:
                            citations.append(citation_str)
        except Exception as e:
            logger.warning(f"Vector search failed or skipped: {e}")

    # 2. Construct hybrid context (Structured Financials + Document Chunks)
    financials_summary = (
        f"Verified Financial Metrics for {fin_data.get('name', ticker)} ({ticker}):\n"
        f"- Share Price: ₹{fin_data.get('price', 'N/A')}\n"
        f"- Market Cap: ₹{fin_data.get('marketCap', 'N/A')} Cr\n"
        f"- Sector: {fin_data.get('sector', 'N/A')} | Industry: {fin_data.get('industry', 'N/A')}\n"
        f"- Revenue Growth (YoY/CAGR): {fin_data.get('revenueGrowthYoY', 'N/A')}%\n"
        f"- Net Income: ₹{fin_data.get('netIncome', 'N/A'):,}\n"
        f"- Operating Margin (OPM): {fin_data.get('operatingMargin', 'N/A')}%\n"
        f"- Capital Return (ROCE): {fin_data.get('roce', 'N/A')}%\n"
        f"- Return on Equity (ROE): {fin_data.get('roe', 'N/A')}%\n"
        f"- Debt to Equity (D/E): {fin_data.get('debtToEquity', 'N/A')}\n"
        f"- P/E Ratio: {fin_data.get('peRatio', 'N/A')} | P/B Ratio: {fin_data.get('pbRatio', 'N/A')}\n"
        f"- Dividend Yield: {fin_data.get('dividendYield', 'N/A')}%\n"
    )

    doc_context = "\n\n---\n\n".join(context_chunks) if context_chunks else "No specific indexed filing document chunk matched this prompt."
    if not citations:
        citations = [f"Verified Financial Gateway ({ticker})"]

    system_prompt = (
        f"You are AlphaLens AI, an expert Senior Equity & Financial Intelligence Analyst for {ticker}.\n"
        "Your mission is to provide clean, elegant, bulleted equity intelligence for any question asked.\n"
        "Formatting Rules:\n"
        "1. DO NOT use raw markdown tables (no '| Metric | Value |'). Use clean bullet points with bold titles.\n"
        "2. Separate different sections with double line breaks for readability.\n"
        "3. Keep bullet points concise, well-spaced, and easy to read.\n"
        "4. Combine (A) Verified Structured Financial Metrics, (B) Document/Filing snippets, and (C) Your deep equity financial knowledge."
    )

    user_prompt = (
        f"{financials_summary}\n\n"
        f"Indexed Document Snippets:\n{doc_context}\n\n"
        f"User Question: {query}\n"
    )

    try:
        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.3
        )
        
        answer = completion.choices[0].message.content
        return {
            "answer": answer,
            "citations": citations
        }
    except Exception as e:
        logger.error(f"Failed to execute LLM completion: {e}")
        return {
            "answer": f"Unable to generate response for {ticker}: {str(e)}",
            "citations": citations
        }

