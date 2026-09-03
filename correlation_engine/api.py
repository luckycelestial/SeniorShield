import os
import sys
import logging
from typing import Dict, Any

from fastapi import FastAPI, Request, HTTPException, status, Header
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError

from schemas import CorrelateEventRequest, CorrelateEventResponse
from services import CorrelationService
from neo4j_exporter import Neo4jScamGraphStore

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SeniorShieldAPI")

app = FastAPI(
    title="SeniorShield Fraud Intelligence Engine",
    description="Multi-Channel Scam Campaign Correlation & Graph Intelligence API",
    version="1.0.0"
)

# Allow requests from the React Native dev client and local backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Correlation Service Instance
correlation_service = CorrelationService()

# -------------------------------------------------------------------------
# Custom Error Handlers (400, 422, 500, 503)
# -------------------------------------------------------------------------
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Handles request validation errors:
    - 400 Bad Request for missing event_id or timestamp.
    - 422 Unprocessable Entity for invalid channels, risk_scores, or timestamp formats.
    """
    errors = exc.errors()
    missing_fields = []
    invalid_fields = []

    for err in errors:
        loc = err.get("loc", [])
        field_name = str(loc[-1]) if loc else "field"
        msg = err.get("msg", "Invalid value")
        
        if "missing" in msg.lower() or "required" in msg.lower() or "cannot be empty" in msg.lower():
            missing_fields.append(field_name)
        else:
            invalid_fields.append(f"{field_name}: {msg}")

    if missing_fields:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": "Bad Request", "detail": f"Missing required field(s): {', '.join(missing_fields)}"}
        )

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"error": "Unprocessable Entity", "detail": f"Invalid field value(s): {'; '.join(invalid_fields)}"}
    )

@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request: Request, exc: HTTPException):
    error_title = "Service Unavailable" if exc.status_code == 503 else ("Bad Request" if exc.status_code == 400 else "HTTP Error")
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": error_title, "detail": exc.detail}
    )

@app.exception_handler(Exception)
async def internal_server_error_handler(request: Request, exc: Exception):
    # Log internal error traceback without exposing internal details/passwords to client
    logger.error(f"Internal Correlation Error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"error": "Internal Server Error", "detail": "An internal correlation failure occurred while processing the event."}
    )

# -------------------------------------------------------------------------
# API Endpoints
# -------------------------------------------------------------------------
@app.get("/")
async def root():
    return {
        "service": "SeniorShield Scam Campaign Correlation API",
        "status": "ONLINE",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    return {"status": "HEALTHY", "events_in_memory": len(correlation_service.events)}

@app.get("/health/neo4j")
async def neo4j_health_check():
    """Verifies connection to Neo4j AuraDB instance. Returns 503 if unreachable."""
    try:
        uri = os.getenv("NEO4J_URI", "neo4j+ssc://6d61e62c.databases.neo4j.io")
        user = os.getenv("NEO4J_USER", "neo4j")
        pwd = os.getenv("NEO4J_PASSWORD", "ljN94kP1sPlIcftBipMwLcCGch879WqxoHRkXOqlldY")
        db = os.getenv("NEO4J_DATABASE", "neo4j")
        
        with Neo4jScamGraphStore(uri=uri, username=user, password=pwd, database=db) as store:
            store.driver.verify_connectivity()
        return {"neo4j_status": "CONNECTED", "uri": uri}
    except Exception as e:
        logger.warning(f"Neo4j Health Check Failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Neo4j database service is currently unavailable."
        )

@app.post("/api/v1/correlate", response_model=CorrelateEventResponse, status_code=status.HTTP_200_OK)
async def correlate_event(
    req: CorrelateEventRequest,
    x_neo4j_required: bool = Header(False, alias="X-Neo4j-Required")
):
    """
    Accepts one normalized multi-channel event, correlates it against the frozen Leiden campaign graph,
    retrieves campaign threat evidence, updates Neo4j AuraDB graph, and returns structured decision contract.
    """
    if x_neo4j_required:
        # Verify Neo4j connectivity before proceeding if header specifies strict dependency
        try:
            uri = os.getenv("NEO4J_URI", "neo4j+ssc://6d61e62c.databases.neo4j.io")
            user = os.getenv("NEO4J_USER", "neo4j")
            pwd = os.getenv("NEO4J_PASSWORD", "ljN94kP1sPlIcftBipMwLcCGch879WqxoHRkXOqlldY")
            db = os.getenv("NEO4J_DATABASE", "neo4j")
            with Neo4jScamGraphStore(uri=uri, username=user, password=pwd, database=db) as store:
                store.driver.verify_connectivity()
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Neo4j graph database is unavailable."
            )

    try:
        response = correlation_service.correlate_single_event(req, sync_neo4j=not x_neo4j_required or True)
        return response
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error(f"Error in correlate_event: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing the correlation engine."
        )

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("CORRELATION_ENGINE_PORT", "8002"))
    host = os.getenv("CORRELATION_ENGINE_HOST", "0.0.0.0")
    logger.info(f"Starting SeniorShield Correlation Engine on {host}:{port}")
    uvicorn.run("api:app", host=host, port=port, reload=False)
