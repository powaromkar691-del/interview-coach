"""Shared Mongo handle — support both real MongoDB or in-memory mongomock-motor transparently."""

import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from pymongo import ASCENDING, DESCENDING, IndexModel

load_dotenv(Path(__file__).parent.parent / ".env")

mongo_url = os.environ.get("MONGO_URL", "mock://localhost")
db_name = os.environ.get("DB_NAME", "interview_coach")

logger = logging.getLogger(__name__)

# Check if real mongo connection or mock requested
if not mongo_url or mongo_url.startswith("mock://") or mongo_url.startswith("memory://"):
    from mongomock_motor import AsyncMongoMockClient
    logger.info("Using AsyncMongoMockClient for in-memory MongoDB storage.")
    client = AsyncMongoMockClient()
else:
    # A configured MongoDB URI must never silently fall back to volatile memory:
    # that would make successful writes disappear after a restart.
    from motor.motor_asyncio import AsyncIOMotorClient
    client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)

db = client[db_name]

# One entry per collection: every field a route filters, sorts, or dedupes on. Applied by ensure_indexes() at startup.
INDEXES: dict[str, list[IndexModel]] = {
    "status_checks": [IndexModel([("timestamp", DESCENDING)], name="timestamp_desc")],
    "users": [
        IndexModel([("user_id", ASCENDING)], name="user_id", unique=True),
        IndexModel([("email", ASCENDING)], name="email_unique", unique=True, sparse=True),
    ],
    "profiles": [IndexModel([("user_id", ASCENDING)], name="user_id", unique=True)],
    "interviews": [
        IndexModel([("id", ASCENDING)], name="id", unique=True),
        IndexModel([("user_id", ASCENDING), ("created_at", DESCENDING)], name="user_created"),
    ],
    "resume_analyses": [
        IndexModel([("id", ASCENDING)], name="id", unique=True),
        IndexModel([("user_id", ASCENDING), ("created_at", DESCENDING)], name="user_created"),
    ],
    "quiz_sets": [
        IndexModel([("id", ASCENDING)], name="id", unique=True),
        IndexModel([("created_at", ASCENDING)], name="created_ttl", expireAfterSeconds=7200),
    ],
    "quiz_attempts": [
        IndexModel([("id", ASCENDING)], name="id", unique=True),
        IndexModel([("user_id", ASCENDING), ("created_at", DESCENDING)], name="user_created"),
    ],
    "roadmaps": [
        IndexModel([("id", ASCENDING)], name="id", unique=True),
        IndexModel([("user_id", ASCENDING)], name="user_id_unique", unique=True),
    ],
}


async def ensure_indexes() -> None:
    for collection, models in INDEXES.items():
        for model in models:
            try:
                await db[collection].create_indexes([model])
            except Exception as exc:
                logger.warning("ensure_indexes(%s.%s) failed: %s", collection, model.document.get("name", ""), exc)
