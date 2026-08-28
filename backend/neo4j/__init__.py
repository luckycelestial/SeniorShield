"""
neo4j/__init__.py
=================
Neo4j Graph Database module for SeniorShield.
"""

from neo4j.client import Neo4jClient
from neo4j.repository import EventRepository

_repo_instance = None


def get_event_repository() -> EventRepository:
    global _repo_instance
    if _repo_instance is None:
        _repo_instance = EventRepository()
    return _repo_instance


__all__ = [
    "Neo4jClient",
    "EventRepository",
    "get_event_repository",
]
