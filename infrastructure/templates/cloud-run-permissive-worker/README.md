# Cloud Run Permissive Extraction Worker Template

Use this template for optional extraction dependencies that carry permissive
licenses but should remain isolated from the main PRAXIS API runtime.

- Workers expose `/healthz` and one domain endpoint.
- Workers do not import PRAXIS database clients.
- Workers return structured candidates for the main backend to validate through
  the symbolic firewall and review queue.
- Workers should run with no public ingress and IAM-only invocation.
