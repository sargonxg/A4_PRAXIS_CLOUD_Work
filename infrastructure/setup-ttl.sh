#!/bin/bash
# Configure Firestore TTL policies for the operational spine collections.
# Each doc must include a Timestamp field named `expiresAt` for TTL to fire;
# the TypeScript and Python spine helpers set this on creation.
#
# Firestore deletes expired docs asynchronously, usually within 24-72h.
set -e

PROJECT_ID="${PROJECT_ID:-praxisbytacitus}"
DB="(default)"

echo "Configuring Firestore TTL on PRAXIS spine collections..."

# system_events: 365d retention (per Giulio 2026-04-25)
gcloud firestore fields ttls update expiresAt \
  --collection-group=system_events \
  --enable-ttl \
  --database="$DB" \
  --project="$PROJECT_ID" || echo "  system_events ttl update returned non-zero (may already be set)"

# background_jobs: 90d retention — operational, not historical
gcloud firestore fields ttls update expiresAt \
  --collection-group=background_jobs \
  --enable-ttl \
  --database="$DB" \
  --project="$PROJECT_ID" || echo "  background_jobs ttl update returned non-zero"

# tool_runs: 365d retention — feeds the user activity feed long-term
gcloud firestore fields ttls update expiresAt \
  --collection-group=tool_runs \
  --enable-ttl \
  --database="$DB" \
  --project="$PROJECT_ID" || echo "  tool_runs ttl update returned non-zero"

# users/{uid}/notifications/{id}: 180d retention — user-facing activity
gcloud firestore fields ttls update expiresAt \
  --collection-group=notifications \
  --enable-ttl \
  --database="$DB" \
  --project="$PROJECT_ID" || echo "  notifications ttl update returned non-zero"

# audit_logs: 365d minimum (compliance — see docs/COMPLIANCE.md)
gcloud firestore fields ttls update expiresAt \
  --collection-group=audit_logs \
  --enable-ttl \
  --database="$DB" \
  --project="$PROJECT_ID" || echo "  audit_logs ttl update returned non-zero"

# rate_limits: 5 min retention (write path already sets `expiresAt`)
gcloud firestore fields ttls update expiresAt \
  --collection-group=rate_limits \
  --enable-ttl \
  --database="$DB" \
  --project="$PROJECT_ID" || echo "  rate_limits ttl update returned non-zero"

echo "✓ TTL policies configured. Existing docs without expiresAt are unaffected."
