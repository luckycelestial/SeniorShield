"""
SeniorShield Backend - main.py
==============================
Clean, minimal AI fraud analysis service for SeniorShield.

Endpoints:
    GET  /health                  -> Service health check (returns {"status": "ok"})
    GET  /api/v1/correlate/health -> Correlation engine + AuraDB liveness
    POST /api/analyze             -> Unified AI fraud analysis pipeline (DistilBERT + XAI + Rules + TI + Groq)
    POST /api/v1/correlate        -> Leiden campaign correlation + AuraDB sync
"""

import os
import sys
import threading
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(dotenv_path=env_path)

# ── Inject workspace root into Python path ────────────────────────────────────
_WORKSPACE_ROOT = os.path.abspath(os.path.join(
    os.path.dirname(os.path.abspath(__file__)), ".."
))
if _WORKSPACE_ROOT not in sys.path:
    sys.path.append(_WORKSPACE_ROOT)

from api.health import router as health_router
from api.analysis import router as analysis_router
from api.correlate import router as correlate_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI lifespan startup.
    Yields immediately so Uvicorn binds to 0.0.0.0:$PORT without any delay.
    Starts background warmup thread for the ML classifier.
    """
    print("[Startup] SeniorShield API starting. Initiating background model warmup...")
    from ai.classifier.model_loader import load_classifier

    # Start background model loading so Uvicorn opens port immediately
    warmup_thread = threading.Thread(target=load_classifier, daemon=True)
    warmup_thread.start()

    yield

    print("[Shutdown] Server shutting down cleanly.")


app = FastAPI(
    title="SeniorShield AI Backend",
    description="Clean, minimal fraud analysis and threat intelligence service for SeniorShield.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root-level health check for zero-dependency liveness probes
@app.get("/health", tags=["Health"])
async def health_check():
    """Liveness probe: returns status 200 OK immediately without external dependencies."""
    return {"status": "ok"}


@app.get("/", tags=["Health"])
async def root_check():
    """Root probe: returns status 200 OK."""
    return {"status": "ok"}


# Primary Endpoints
app.include_router(health_router)
app.include_router(analysis_router)
app.include_router(correlate_router)
