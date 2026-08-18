import os
import logging
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams, PointStruct
from openai import OpenAI
from app.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("qdrant-seeder")

SEED_STOCKS_DATA = {
    "TCS": [
        {
            "doc_id": "auto_sync_tcs_q3",
            "page": 1,
            "content": (
                "Tata Consultancy Services (TCS) Q3 Financial & Business Highlights: "
                "Operating Revenue registered YoY growth of 4.58%, with Net Profit reaching ₹49,210 Crores. "
                "Operating Margin (OPM) stood resilient at 25.10%, backed by operational efficiency and disciplined execution. "
                "Return on Capital Employed (ROCE) reached 55.18% and Return on Equity (ROE) reached 45.89%. "
                "Order book TCV for the quarter stood at $10.2 Billion with strong order pipeline in Enterprise Cloud, AI transformation, and Cyber Security."
            )
        },
        {
            "doc_id": "auto_sync_tcs_q3",
            "page": 2,
            "content": (
                "TCS Segment Performance & Risk Profile: "
                "BFSI vertical showed solid demand recovery in Tier-1 banks across UK and North America. "
                "Consumer Business and Life Sciences verticals maintained double-digit operating margin contributions. "
                "Key Operating Risks: Foreign exchange rate fluctuations (INR vs USD/EUR), potential regulatory policy shifts by RBI/SEC, and global tech spending delays."
            )
        }
    ],
    "RELIANCE": [
        {
            "doc_id": "auto_sync_reliance_q3",
            "page": 1,
            "content": (
                "Reliance Industries Limited (RIL) Financial Update: "
                "Consolidated EBITDA grew 11.5% YoY driven by robust performance across Retail and Digital Services (Jio). "
                "Jio Platforms subscriber base exceeded 470 Million with ARPU increasing to ₹182. Oil-to-Chemicals (O2C) segment maintained steady throughput."
            )
        },
        {
            "doc_id": "auto_sync_reliance_q3",
            "page": 2,
            "content": (
                "Reliance New Energy & Strategic Capital Allocation: "
                "RIL committed ₹75,000 Crores towards Green Energy Giga Factories in Jamnagar (Solar PV, Energy Storage, Green Hydrogen). "
                "Debt to Equity ratio remains conservative at 0.38 with strong net cash flow generation from retail operations."
            )
        }
    ],
    "HDFCBANK": [
        {
            "doc_id": "auto_sync_hdfcbank_q3",
            "page": 1,
            "content": (
                "HDFC Bank Limited Financial Update: "
                "Net Interest Income (NII) expanded by 16.2% YoY with Net Interest Margin (NIM) stable at 3.6%. "
                "Gross NPA ratio improved to 1.24% and Net NPA ratio stood at 0.31%, reflecting superior credit underwriting standards."
            )
        }
    ]
}

def seed_qdrant_cloud():
    logger.info(f"Target Qdrant Endpoint: {settings.QDRANT_URL}")
    
    if not settings.OPENAI_API_KEY or settings.OPENAI_API_KEY == "your-openai-api-key-here":
        logger.error("OPENAI_API_KEY is missing in environment variables.")
        return

    qclient = QdrantClient(
        url=settings.QDRANT_URL,
        api_key=settings.QDRANT_API_KEY
    )
    
    openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
    
    for ticker, docs in SEED_STOCKS_DATA.items():
        collection_name = f"company_{ticker.lower()}"
        logger.info(f"Seeding Qdrant collection: {collection_name}")
        
        # Create collection if not exists
        try:
            collections = qclient.get_collections().collections
            exists = any(c.name == collection_name for c in collections)
            if not exists:
                qclient.create_collection(
                    collection_name=collection_name,
                    vectors_config=VectorParams(size=1536, distance=Distance.COSINE)
                )
                logger.info(f"Created collection {collection_name}")
        except Exception as e:
            logger.error(f"Error checking/creating collection {collection_name}: {e}")
            continue

        # Embed texts and prepare points
        points = []
        for idx, item in enumerate(docs):
            try:
                emb_res = openai_client.embeddings.create(
                    model="text-embedding-3-small",
                    input=[item["content"]]
                )
                vec = emb_res.data[0].embedding
                
                points.append(
                    PointStruct(
                        id=idx + 1,
                        vector=vec,
                        payload={
                            "document_id": item["doc_id"],
                            "ticker": ticker.upper(),
                            "page": item["page"],
                            "content": item["content"]
                        }
                    )
                )
            except Exception as e:
                logger.error(f"Failed embedding item {idx} for {ticker}: {e}")

        if points:
            qclient.upsert(collection_name=collection_name, points=points)
            logger.info(f"Successfully indexed {len(points)} vectors into {collection_name}")

if __name__ == "__main__":
    seed_qdrant_cloud()
