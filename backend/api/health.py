"""
api/health.py
=============
GET /health — liveness probe for the SeniorShield backend.

Returns a simple JSON payload confirming the service is running.
"""

from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter()


@router.get("/health", tags=["Health"])
async def health_check() -> JSONResponse:
    """
    Liveness probe.

    Returns:
        200 OK with service status confirmation.
    """
    return JSONResponse(
        status_code=200,
        content={
            "status": "ok",
            "service": "SeniorShield Backend",
        },
    )
