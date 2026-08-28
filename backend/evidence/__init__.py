# evidence/__init__.py
# ====================
# RESERVED — Evidence collection and incident report module.
#
# Planned implementation:
#   - Persist scam event evidence locally (SQLite) or to PostgreSQL.
#   - Format structured incident reports for 1-tap submission to the
#     National Cyber Crime Portal (cybercrime.gov.in / 1930 helpline).
#   - Store sender number, timestamp, message transcript, and payment links.
#   - Zero PII exported to third parties without explicit user consent.
#
# Dependencies to add when implementing:
#   asyncpg  OR  aiosqlite  +  sqlalchemy
#
# Do NOT add any logic until this step is authorised.
