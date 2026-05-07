# Memo Refresh

## Purpose
Refresh an existing memo against current case context, new evidence, stale claims, and citation gaps.

## When To Use
Use after a case graph, source library, or tool output changes and the memo needs targeted updates.

## When Not To Use
Do not use to rewrite a memo wholesale or bypass the user's review of contested claims.

## Inputs
Existing memo blocks, case graph changes, source freshness, tool-run artifacts, user writing preferences, and analyst notes.

## Outputs
Refresh summary, changed-evidence list, stale or contradicted blocks, suggested edits, and review checklist.

## Context Requirements
Needs the current memo state, case context, source provenance, and user communication preferences.

## Composition
Can consume Contradiction Finder, Fact-Check Traceback, and marketplace run artifacts before feeding Memo Studio.

## Examples
Refresh a cabinet brief after new graph evidence changes the confidence on two key claims.

## Pitfalls
Do not auto-apply changes, bury stale claims in style edits, or remove provenance from user-authored text.
