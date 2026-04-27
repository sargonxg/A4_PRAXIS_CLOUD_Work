# PRAXIS Tool Quality Audit — 2026-04-28

Scope: every page under `src/app/app/<tool>` should produce a useful, non-empty output for the demo Nordalia situation and for a real authenticated situation. This audit is the working log for the strategic priority: every tool produces something.

Categories:

- `silently empty`: route returns 2xx or UI completes, but no useful result appears.
- `demo leak`: hard-coded demo/Nordalia content appears in a real situation.
- `route-renders-but-UI-empty`: route returns data, but the page does not render it.
- `credit-deducted-no-output`: billing/credits run, but no durable result is shown or saved.
- `ok`: output is useful, non-empty, cited/provenanced where applicable, and saved.

Current shared-layer improvements in this pass:

- `AiPopulate` now blocks successful-but-empty responses from being saved and turns them into a visible generation error.
- `AiPopulate` now renders `OutputProvenancePanel` for generated/persisted outputs with analyst profile version, domain version, framework chips, source pills, and live-feed receipts when available.
- `OutputProvenancePanel` now supports framework chips, calibration labels, and source receipt pills with feed name + timestamp.
- Dashboard now surfaces the first ten Core MVP tools as a grouped readiness widget.

| Tool | Works | Non-empty | Cited / provenance | Saved | Regression category | Notes |
|---|---:|---:|---:|---:|---|---|
| dashboard | Partial | Unknown | Partial | Yes | ok / needs browser audit | Daily Read route exists; dashboard now has Core MVP tools widget. |
| early-warning | Unknown | Unknown | Shared receipt | Unknown | needs audit | Uses `ToolPageShell`; verify Regenerate on Nordalia and real situation. |
| risk-monitor | Unknown | Unknown | Shared receipt | Unknown | needs audit | High-priority Core MVP tool; verify no demo-shaped renderer leak. |
| actor-profiles | Unknown | Unknown | Shared receipt | Unknown | needs audit | Verify route output renders profiles and persists under the same tool id the page reads. |
| stakeholder-map | Unknown | Unknown | Partial | Unknown | needs audit | Explorer flagged possible page/route persistence mismatch. |
| briefing | Unknown | Unknown | Shared receipt | Unknown | needs audit | Verify generated slides/sections render after Regenerate. |
| talking-points | Unknown | Unknown | Partial | Unknown | needs audit | Not fully wrapped by shared shell; verify provenance and saved output. |
| negotiation-prep | Unknown | Unknown | Shared receipt | Unknown | needs audit | Verify ZOPA/BATNA output is situation-specific. |
| commitments | Unknown | Unknown | Shared receipt | Unknown | needs audit | Verify commitment rows save and render after reload. |
| sanctions | Unknown | Unknown | Shared receipt | Unknown | needs audit | Verify source pills for sanctions/designation data. |
| treaty-analyzer | Unknown | Unknown | Shared receipt | Unknown | needs audit | Uses `ToolPageShell`; verify legal instrument output is non-empty. |
| legal-tracker | Unknown | Unknown | Shared receipt | Unknown | needs audit | Verify hyphen/underscore persistence does not hide saved output. |
| human-rights | Unknown | Unknown | Shared receipt | Unknown | needs audit | Specialized policy tool; verify IHL/IHRL sections and citations. |
| economic-impact | Unknown | Unknown | Shared receipt | Unknown | needs audit | Verify macro/sector fields are not empty placeholders. |
| humanitarian | Unknown | Unknown | Partial | Unknown | demo leak sweep follow-up | Round 6 closed known leak; re-test real situation. |
| dossier | Unknown | Unknown | Partial | Unknown | demo leak sweep follow-up | Round 6 closed known leak; re-test real situation. |

Next audit procedure:

1. Start the app locally and sign in with a real non-demo account that has a Nordalia situation.
2. For each row, open `/app/<tool>`, click `Regenerate`, and watch UI + network response + persistence.
3. Mark `Works`, `Non-empty`, `Cited / provenance`, and `Saved` as yes/no.
4. Add exact route, console, or Firestore symptoms to `Notes`.
5. Promote tools from `needs audit` to one of the named categories above.
