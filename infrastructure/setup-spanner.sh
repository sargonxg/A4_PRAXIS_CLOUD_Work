#!/bin/bash
# PRAXIS — Set up Cloud Spanner Graph instance and apply schema
set -e
PROJECT_ID="${GCP_PROJECT_ID:-praxisbytacitus}"
INSTANCE_ID="praxis-graph"
DATABASE_ID="praxis-graph-db"
REGION="regional-us-central1"

# Create instance (100 PU minimum)
gcloud spanner instances create "$INSTANCE_ID" \
  --config="$REGION" \
  --description="PRAXIS conflict knowledge graph" \
  --processing-units=100 \
  --project="$PROJECT_ID" \
  2>/dev/null || echo "Instance already exists"

# Create database
gcloud spanner databases create "$DATABASE_ID" \
  --instance="$INSTANCE_ID" \
  --project="$PROJECT_ID" \
  2>/dev/null || echo "Database already exists"

# Apply schema
gcloud spanner databases ddl update "$DATABASE_ID" \
  --instance="$INSTANCE_ID" \
  --project="$PROJECT_ID" \
  --ddl-file=backend/migrations/001_spanner_graph_schema.sql

echo "Spanner Graph setup complete"
echo "  Project:  $PROJECT_ID"
echo "  Instance: $INSTANCE_ID"
echo "  Database: $DATABASE_ID"
