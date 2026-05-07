# Analysis of Competing Hypotheses

## Purpose
Create and maintain an ACH matrix that tests competing explanations by looking for inconsistent evidence. Based on Richards J. Heuer Jr. and the Heuer-Pherson Structured Analytic Techniques canon.

## When To Use
Use when a case has multiple plausible explanations, disputed actor intent, or competing claims that need disciplined comparison.

## When Not To Use
Do not use ACH when there is only one live explanation or when the task is simple source retrieval.

## Inputs
Competing hypotheses, case graph claims and events, document excerpts, source receipts, evidence weights, and analyst free-text evidence.

## Outputs
Hypothesis inventory, evidence inventory, scored ACH matrix, rankings by inconsistency count, and review-queue candidates.

## Context Requirements
Needs at least two competing claims or hypotheses. Source receipts and graph nodes improve evidence quality, but the surface remains usable with free-text evidence.

## Composition
Can append an ACH annex to Memo Studio and can feed Contradiction Finder or Brief Exporter after analyst review.

## Examples
Compare whether public signals indicate implementation progress, tactical delay, or performative messaging.

## Pitfalls
Do not rank by support count. ACH is a disconfirmation method: the least inconsistent hypothesis is strongest.
