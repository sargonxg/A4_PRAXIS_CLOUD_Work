# PRAXIS Context Creation Release - 2026-05-01

## Objective

Make every AI/tool result more informed by the user's actual situation and
analyst profile, especially immediately after onboarding and first situation
creation.

## Shipped

- Expanded the calibrated `<situation-frame>` so AI routes receive:
  - situation id, status, type, region, actors;
  - risk/Glasl trend;
  - domain and domain confidence;
  - workflow path;
  - actor, graph, document, and source inventory;
  - situation description;
  - analyst context notes;
  - analyst-provided source URLs and custom sources;
  - situation date/language overrides when present.
- Added default SKC retrieval for calibrated AI routes when a route does not
  provide its own retrieval query. The default query uses tool id, situation
  name, region, domain, workflow path, description, actors, profile lenses, and
  audience.
- Hardened situation creation context intake:
  - URL normalization and protocol validation;
  - deduped and capped source URLs;
  - capped analyst notes;
  - filtered custom sources.
- Added an AI context quality readout to the situation creation review step so
  users see whether summary, actors, region, sources, documents, and notes are
  present before creating the workspace.
- Added regression coverage for enriched situation prompt blocks and default
  retrieval behavior.

## Why It Matters

The user should not need to understand the internal context stack. If they add
context during onboarding or situation creation, PRAXIS should reliably carry it
into tool prompts, retrieval, confidence warnings, and next actions.

## Remaining Follow-Ups

- Feed saved tool-output summaries into the default retrieval query.
- Add per-package onboarding questions for missing graph/source/document
  context.
- Add a lightweight authenticated smoke script that can create a situation,
  verify dashboard context quality, and clean up the test case.
