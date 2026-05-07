# Match Sanctions

## Purpose
Match Actor entities against OpenSanctions/yente and return ranked sanctions, PEP, and related risk matches with provenance links.

## When To Use
Use this when a case includes actors, companies, armed groups, officials, intermediaries, or financial entities that may appear in sanctions or PEP datasets.

## When Not To Use
Do not use it as a legal determination or final compliance decision. It is an entity-resolution assistive tool that requires human review.

## Inputs
- `actorIds`: Optional list of graph Actor ids.
- `threshold`: Match score threshold, default `0.7`.
- `dataset`: Optional OpenSanctions catalog selector.

## Outputs
- Actor-keyed ranked matches.
- OpenSanctions entity ids and URLs.
- Match scores, schemas, topics, and datasets.
- Review and licensing posture.

## Context Requirements
Requires owner-scoped Actor nodes in the case graph. Matching results may persist only to that tenant's actor metadata.

## Composition
Can chain from GLiNER extraction and into brief export. It can also run on demand from the Tools tab.

## Examples
Run on a sanctions enforcement audit case to flag companies and individuals that need OpenSanctions record review.

## Pitfalls
False positives are common with transliteration and common names. Keep thresholds visible and preserve source links.
