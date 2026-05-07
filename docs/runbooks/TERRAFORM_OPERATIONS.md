# Terraform Operations

## Signals
- GCP resources exist without committed Terraform.
- Drift appears between console state and infrastructure code.
- A cost-impacting change is requested.

## Triage
1. Identify whether the resource is already Terraform-managed.
2. Run plan in staging before production.
3. Record cost and blast radius before applying.

## Mitigation
- Do not hand-click production changes except for emergency rollback.
- Import existing resources into Terraform before modifying them.

## Escalation
Cloud SQL HA, CMEK, Cloud Armor, multi-region, and VPC Service Controls are owner-gated.
