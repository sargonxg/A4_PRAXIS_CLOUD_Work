# SIGNAL native evidence-impact review

Status: integration proposal on a feature branch; not a production capability.

For an owner-authenticated PRAXIS SIGNAL desk, trace a source-revision ID to dependent claims, narratives, assessments, human-review receipts, and historically approved briefs. The output identifies human re-review obligations, not inferred truth, and does not change stored state.

A URL-selected scenario such as `source_withdrawn` is hypothetical unless an actual stored withdrawal, superseding source revision, or recorded analyst inspection establishes its status. Source rights and approved-brief export restrictions must be checked separately at export time. No downloaded source body or source quotation should be returned by the impact endpoint.

Acceptance gates: (1) owner-only access and bounded input; (2) explicit paths from source to each affected artifact; (3) inclusion of archived approved briefs and pinned-context evidence; (4) full output without source text; (5) previously approved review receipts are never treated as renewed approvals; (6) rights-only changes trigger a rights review without calling evidence false; (7) native typecheck, Vitest, and authenticated route tests before merge.
