#!/usr/bin/env bash
set -euo pipefail

cat <<'CYPHER'
CREATE CONSTRAINT actor_id IF NOT EXISTS FOR (a:Actor) REQUIRE a.id IS UNIQUE;
CREATE INDEX actor_tenant IF NOT EXISTS FOR (a:Actor) ON (a.tenantId);
CYPHER
