import os
from dotenv import load_dotenv
from qdrant_client import QdrantClient

load_dotenv()

try:
    client = QdrantClient(
        url=os.getenv("QDRANT_URL"),
        api_key=os.getenv("QDRANT_API_KEY")
    )

    collections = client.get_collections()

    print("✅ Qdrant Cloud connected successfully")
    print("Collections:", collections.collections)

except Exception as e:
    print("❌ Qdrant connection failed")
    print(type(e).__name__, ":", str(e))