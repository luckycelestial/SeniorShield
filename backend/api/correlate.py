"""
api/correlate.py
================
POST /api/v1/correlate — Leiden Campaign Correlation Engine endpoint.
GET  /api/v1/correlate/health — Correlation engine liveness + AuraDB connectivity.

Imports CorrelationService from the correlation_engine package.
Detected scam campaigns are automatically persisted to Neo4j AuraDB
for live graph visualization.
"""

import os
import logging
from fastapi import APIRouter, HTTPException, status, Header

from correlation_engine import (
    CorrelateEventRequest,
    CorrelateEventResponse,
    CorrelationService,
    Neo4jScamGraphStore,
)

logger = logging.getLogger("SeniorShield.Correlate")

router = APIRouter(prefix="/api/v1", tags=["Correlation Engine"])

# Single shared service instance (200 baseline events pre-loaded from events.csv)
_correlation_service: CorrelationService | None = None


def get_correlation_service() -> CorrelationService:
    global _correlation_service
    if _correlation_service is None:
        _correlation_service = CorrelationService()
        logger.info(
            f"[CorrelationEngine] Leiden service initialised — "
            f"{len(_correlation_service.events)} baseline events loaded."
        )
    return _correlation_service


# ── Health ────────────────────────────────────────────────────────────────────

@router.get("/correlate/health", tags=["Health"])
async def correlation_health():
    """
    Liveness probe for the Leiden campaign correlation engine.
    Returns event count in memory and AuraDB connectivity status.
    """
    svc = get_correlation_service()
    neo4j_status = "SKIPPED"

    uri = os.getenv("NEO4J_URI", "neo4j+ssc://6d61e62c.databases.neo4j.io")
    user = os.getenv("NEO4J_USER", "neo4j")
    pwd = os.getenv("NEO4J_PASSWORD", "ljN94kP1sPlIcftBipMwLcCGch879WqxoHRkXOqlldY")
    db = os.getenv("NEO4J_DATABASE", "neo4j")

    try:
        with Neo4jScamGraphStore(uri=uri, username=user, password=pwd, database=db) as store:
            store.driver.verify_connectivity()
        neo4j_status = "CONNECTED"
    except Exception as e:
        neo4j_status = f"UNREACHABLE ({type(e).__name__})"

    return {
        "status": "HEALTHY",
        "events_in_memory": len(svc.events),
        "neo4j_auradb": neo4j_status,
    }


# ── Correlate ─────────────────────────────────────────────────────────────────

@router.post(
    "/correlate",
    response_model=CorrelateEventResponse,
    status_code=status.HTTP_200_OK,
)
async def correlate_event(
    req: CorrelateEventRequest,
    x_neo4j_required: bool = Header(False, alias="X-Neo4j-Required"),
):
    """
    Accepts one normalised multi-channel event, runs the frozen Leiden
    community detection algorithm, identifies which scam campaign it belongs
    to, syncs the graph to Neo4j AuraDB, and returns a structured decision.
    """
    if x_neo4j_required:
        uri = os.getenv("NEO4J_URI", "neo4j+ssc://6d61e62c.databases.neo4j.io")
        user = os.getenv("NEO4J_USER", "neo4j")
        pwd = os.getenv("NEO4J_PASSWORD", "ljN94kP1sPlIcftBipMwLcCGch879WqxoHRkXOqlldY")
        db = os.getenv("NEO4J_DATABASE", "neo4j")
        try:
            with Neo4jScamGraphStore(uri=uri, username=user, password=pwd, database=db) as store:
                store.driver.verify_connectivity()
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Neo4j AuraDB is unavailable.",
            )

    try:
        svc = get_correlation_service()
        response = svc.correlate_single_event(req, sync_neo4j=True)
        return response
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error(f"Correlation error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal correlation engine failure.",
        )
