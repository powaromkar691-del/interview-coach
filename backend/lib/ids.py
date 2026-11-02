"""String uuid4 ids for Mongo documents (never ObjectId — it is not JSON-serializable)."""

import uuid


def new_id() -> str:
    return str(uuid.uuid4())
