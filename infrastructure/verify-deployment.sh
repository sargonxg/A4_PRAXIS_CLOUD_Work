#!/usr/bin/env bash
# Post-deploy smoke check. Polls the live frontend and API until both
# return 200, or fails after 60 seconds.
#
# Run from Cloud Build (post-deploy step) or locally:
#   ./infrastructure/verify-deployment.sh
#
# Override the target host via SMOKE_HOST env var (default praxis.tacitus.me).

set -euo pipefail

HOST="${SMOKE_HOST:-praxis.tacitus.me}"
DEADLINE=$(( $(date +%s) + 60 ))
URLS=(
  "https://${HOST}/"
  "https://${HOST}/api/health"
)

echo "[smoke] target host: ${HOST}"

while [[ $(date +%s) -lt ${DEADLINE} ]]; do
  ALL_OK=1
  for url in "${URLS[@]}"; do
    code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${url}" || echo "000")
    echo "[smoke] ${url} -> ${code}"
    if [[ "${code}" != "200" ]]; then
      ALL_OK=0
    fi
  done
  if [[ ${ALL_OK} -eq 1 ]]; then
    echo "[smoke] all green"
    exit 0
  fi
  sleep 5
done

echo "[smoke] FAILED after 60s — one or more endpoints did not return 200"
exit 1
