"""Tiny in-memory sliding-window rate limiter for AI-heavy endpoints.

Sufficient for a single-process deployment; swap for Redis if the backend
ever scales horizontally.
"""

import time
from collections import defaultdict, deque

from fastapi import HTTPException

_buckets: dict[str, deque] = defaultdict(deque)


def enforce(key: str, limit: int, window_seconds: int) -> None:
    """Raise 429 when `key` exceeds `limit` calls within `window_seconds`."""
    now = time.monotonic()
    bucket = _buckets[key]
    while bucket and now - bucket[0] > window_seconds:
        bucket.popleft()
    if len(bucket) >= limit:
        raise HTTPException(
            status_code=429,
            detail="Too many requests — please slow down and try again shortly.",
        )
    bucket.append(now)
