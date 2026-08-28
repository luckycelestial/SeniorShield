"""
neo4j/client.py
===============
Neo4j Graph Database Client for SeniorShield Event Storage.

Provides connection pooling with graceful fallback when Neo4j is offline or unconfigured.
"""

import os
import logging
from typing import Optional
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
load_dotenv(dotenv_path=env_path)

logger = logging.getLogger("seniorshield.neo4j")


class Neo4jClient:
    """
    Manages connection to Neo4j graph database.
    """

    def __init__(self):
        self.uri = os.environ.get("NEO4J_URI", "bolt://localhost:7687").strip()
        self.username = os.environ.get("NEO4J_USERNAME", "neo4j").strip()
        self.password = os.environ.get("NEO4J_PASSWORD", "").strip()
        self._driver = None
        self._is_connected = False
        self._init_driver()

    def _init_driver(self):
        """Attempt to initialize the Neo4j driver."""
        if not self.password or self.password == "your_neo4j_password_here":
            logger.info("[Neo4j] NEO4J_PASSWORD not configured. Running in offline/mock event mode.")
            self._is_connected = False
            return

        try:
            from neo4j import GraphDatabase
            self._driver = GraphDatabase.driver(
                self.uri,
                auth=(self.username, self.password),
                connection_timeout=2.0,
                max_connection_lifetime=300
            )
            # Verify connectivity
            self._driver.verify_connectivity()
            self._is_connected = True
            logger.info(f"[Neo4j] Connected successfully to {self.uri}")
        except Exception as e:
            logger.warning(f"[Neo4j] Live Neo4j connection unavailable ({e}). Fallback to in-memory event store.")
            self._is_connected = False
            self._driver = None

    @property
    def is_connected(self) -> bool:
        return self._is_connected

    def get_session(self):
        """Returns a session if connected, otherwise None."""
        if self._is_connected and self._driver:
            return self._driver.session()
        return None

    def close(self):
        """Close driver connection."""
        if self._driver:
            try:
                self._driver.close()
            except Exception:
                pass
            self._is_connected = False
