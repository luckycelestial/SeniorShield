"""
SeniorShield Backend - main.py
==============================
Clean, production-style FastAPI AI analysis service.

Endpoints:
    GET  /health       -> Service health check
    POST /api/analyze  -> Unified AI fraud analysis pipeline
    POST /api/events   -> Event distribution to Neo4j graph database
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(dotenv_path=env_path)

from api.health import router as health_router
from api.analysis import router as analysis_router
from api.events import router as events_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load the classifier ONCE into memory before accepting requests."""
    print("[Startup] Loading bert-tiny scam classifier...")
    from ai.classifier.model_loader import load_classifier
    load_classifier()
    print("[Startup] Classifier ready. Server accepting requests.")
    yield
    print("[Shutdown] Server shutting down.")
    # Close Neo4j driver cleanly if connected
    try:
        from neo4j import get_event_repository
        get_event_repository().client.close()
    except Exception:
        pass


app = FastAPI(
    title="SeniorShield AI Backend",
    description="Clean, modular fraud analysis and threat intelligence service for SeniorShield.",
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

# Primary Endpoints
app.include_router(health_router)
app.include_router(analysis_router)
app.include_router(events_router)
