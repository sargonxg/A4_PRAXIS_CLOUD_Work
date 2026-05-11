---
name: analysis.ach-hypothesis
description: Generate competing hypotheses and diagnostic evidence checks for an uncertain question.
---

## Purpose
`analysis.ach-hypothesis` structures uncertainty by comparing rival explanations against evidence.

## When To Use
Use for uncertain judgments, red-team review, confidence checks, and briefing quality control.

## When Not To Use
Do not use for one-answer drafting or when no question and evidence set exist.

## Inputs
Requires `caseId` and question; optional hypotheses and evidence hints.

## Outputs
Returns hypotheses, evidence matrix, diagnosticity notes, leading hypothesis, citations, and next collection moves.

## Context Requirements
Needs at least two plausible explanations and evidence or source receipts to compare.

## Composition
Can consume Deep Research and Contradiction Finder; can feed Memo Drafter and Scenario Projector.

## Examples
Foreign policy: explain actor behavior. Domestic policy: explain regulatory coalition movement. Corporate: explain market or policy pressure.

## Pitfalls
Rank by disconfirmation, not support count; avoid false precision.
