#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-praxisbytacitus}"

bq --project_id="${PROJECT_ID}" query --use_legacy_sql=false < infrastructure/bigquery/views/events.sql
bq --project_id="${PROJECT_ID}" query --use_legacy_sql=false < infrastructure/bigquery/queries/kpis.sql
