import logging
from qdrant_client import QdrantClient
from qdrant_client.http.exceptions import UnexpectedResponse
from app.config import settings

logger = logging.getLogger("alphalens-ai")

# Initialize client using connection settings
try:
    qdrant_client = QdrantClient(
        url=settings.QDRANT_URL,
        api_key=settings.QDRANT_API_KEY
    )
except Exception as e:
    logger.error(f"Failed to initialize Qdrant Client: {e}")
    qdrant_client = None

def check_qdrant_health() -> bool:
    if qdrant_client is None:
        return False
    try:
        # Simple query to check connection health
        qdrant_client.get_collections()
        return True
    except UnexpectedResponse as e:
        logger.error(f"Qdrant response error: {e}")
        return False
    except Exception as e:
        logger.error(f"Qdrant connection exception: {e}")
        return False
