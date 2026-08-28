# intelligence/__init__.py
# ========================
# RESERVED — Threat intelligence and campaign graph module.
#
# Planned implementation:
#   - Multi-channel campaign correlation (SMS + Call + Link events over time).
#   - Knowledge graph storage of known scam campaigns (Neo4j or in-memory).
#   - Cumulative risk score computation across a 7-day rolling window.
#   - Mirrors and extends the client-side campaignTracker.ts logic server-side.
#
# Dependencies to add when implementing:
#   neo4j  OR  networkx (for in-memory graph)
#
# Do NOT add any logic until this step is authorised.
