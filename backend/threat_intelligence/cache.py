"""
threat_intelligence/cache.py
============================
Thread-safe in-memory cache with TTL for Threat Intelligence lookups.
"""

import time
import threading
from typing import Optional, Dict, Any
from threat_intelligence.models import ThreatIntelResult


class ThreatIntelCache:
    """
    In-memory TTL cache for entity reputation results.
    """

    def __init__(self, default_ttl_seconds: int = 300):
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._lock = threading.Lock()
        self._default_ttl = default_ttl_seconds

    def _make_key(self, entity_type: str, entity_value: str) -> str:
        return f"{entity_type.upper()}:{entity_value.strip().lower()}"

    def get(self, entity_type: str, entity_value: str) -> Optional[ThreatIntelResult]:
        """
        Retrieve cached reputation result if not expired.
        """
        key = self._make_key(entity_type, entity_value)
        with self._lock:
            entry = self._cache.get(key)
            if entry is None:
                return None

            # Check expiration
            if time.time() > entry["expires_at"]:
                del self._cache[key]
                return None

            result: ThreatIntelResult = entry["result"]
            # Mark status as cached
            cached_copy = result.model_copy(update={"status": "cached"}) if hasattr(result, "model_copy") else result.copy(update={"status": "cached"})
            return cached_copy

    def set(self, entity_type: str, entity_value: str, result: ThreatIntelResult, ttl_seconds: Optional[int] = None):
        """
        Store reputation result with TTL.
        """
        key = self._make_key(entity_type, entity_value)
        ttl = ttl_seconds or self._default_ttl
        with self._lock:
            self._cache[key] = {
                "result": result,
                "expires_at": time.time() + ttl
            }

    def clear(self):
        """Clear all entries."""
        with self._lock:
            self._cache.clear()
