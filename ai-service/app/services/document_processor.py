import os
import logging
from typing import List
from pypdf import PdfReader
from qdrant_client.http.models import Distance, VectorParams, PointStruct
from app.services.qdrant import qdrant_client
from app.config import settings
from openai import OpenAI

logger = logging.getLogger("alphalens-ai")

def process_pdf_document(doc_id: str, filepath: str, ticker: str) -> dict:
    logger.info(f"Processing PDF document {doc_id} for ticker {ticker} at path: {filepath}")
    
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"PDF file not found at: {filepath}")

    # 1. Extract text page by page
    reader = PdfReader(filepath)
    raw_text_chunks = []
    
    for page_num, page in enumerate(reader.pages):
        text = page.extract_text()
        if text:
            # Keep track of the page number in metadata
            raw_text_chunks.append({
                "text": text,
                "page": page_num + 1
            })
            
    logger.info(f"Extracted text from {len(reader.pages)} pages")

    # 2. Chunk text segment (overlapping chunks: ~1000 chars, ~200 overlap)
    chunk_size = 1000
    chunk_overlap = 200
    processed_chunks = []

    for item in raw_text_chunks:
        text = item["text"]
        page = item["page"]
        
        start = 0
        while start < len(text):
            end = start + chunk_size
            chunk = text[start:end]
            processed_chunks.append({
                "content": chunk,
                "page": page,
                "ticker": ticker.upper(),
                "document_id": doc_id
            })
            start += (chunk_size - chunk_overlap)

    logger.info(f"Created {len(processed_chunks)} overlapping semantic chunks")

    # 3. Generate embeddings & upsert to Qdrant
    if not qdrant_client:
        raise ValueError("Qdrant Client is not initialized.")

    api_key = settings.OPENAI_API_KEY
    if not api_key or api_key == "your-openai-api-key-here":
        logger.warning("No OPENAI_API_KEY found. Mocking Qdrant write flow.")
        return {"status": "mocked", "chunks_processed": len(processed_chunks)}

    client = OpenAI(api_key=api_key)
    collection_name = f"company_{ticker.lower()}"

    # 4. Check/Create Qdrant collection (1536 dimension for text-embedding-3-small)
    try:
        collections = qdrant_client.get_collections().collections
        exists = any(c.name == collection_name for c in collections)
        
        if not exists:
            logger.info(f"Creating new Qdrant collection: {collection_name}")
            qdrant_client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(size=1536, distance=Distance.COSINE),
            )
    except Exception as e:
        logger.error(f"Failed to check/create Qdrant collection: {e}")
        raise e

    # 5. Compute embeddings in batch and prepare Qdrant points
    points = []
    
    # Process in batches of 50 to avoid token limits
    batch_size = 50
    for i in range(0, len(processed_chunks), batch_size):
        batch = processed_chunks[i:i + batch_size]
        texts = [c["content"] for c in batch]
        
        try:
            response = client.embeddings.create(
                model="text-embedding-3-small",
                input=texts
            )
            
            for idx, item in enumerate(response.data):
                chunk_data = batch[idx]
                point_id = f"{doc_id}-{i + idx}"
                
                points.append(
                    PointStruct(
                        id=i + idx, # numeric ID
                        vector=item.embedding,
                        payload={
                            "document_id": doc_id,
                            "ticker": chunk_data["ticker"],
                            "page": chunk_data["page"],
                            "content": chunk_data["content"]
                        }
                    )
                )
        except Exception as e:
            logger.error(f"Failed to generate embeddings: {e}")
            raise e

    # 6. Upsert to Qdrant
    try:
        logger.info(f"Upserting {len(points)} vectors to Qdrant collection {collection_name}")
        qdrant_client.upsert(
            collection_name=collection_name,
            points=points
        )
    except Exception as e:
        logger.error(f"Failed to upsert points to Qdrant: {e}")
        raise e

    return {
        "status": "success",
        "chunks_processed": len(processed_chunks),
        "vectors_indexed": len(points),
        "collection": collection_name
    }
