# Storage Recovery

## Signals
- Upload/download errors increase.
- A user reports missing documents or exports.
- Bucket public-access posture changes.

## Triage
1. Run `npm run audit:gcp-production-posture`.
2. Verify public access prevention and bucket versioning.
3. Check object version history for the affected path.

## Mitigation
- Restore the prior object version where versioning is available.
- Disable public links if signed URL TTL or access policy regressed.

## Escalation
CMEK, lifecycle, bucket deletion, and public-access changes are Terraform/owner-gated.
