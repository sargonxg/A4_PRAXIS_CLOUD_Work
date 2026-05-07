# Red Team Analysis

## Purpose
Model how a target actor may perceive interests, constraints, likely moves, and other actors. Based on the Heuer-Pherson red-team SAT tradition.

## When To Use
Use when an analyst needs to challenge mirror-imaging, dominant-hypothesis bias, or assumptions about a specific actor's incentives.

## When Not To Use
Do not use to generate operational planning, targeting advice, advocacy, or content that could assist harmful action.

## Inputs
Target Actor, one-hop actor subgraph, interests, constraints, recent events, case frame, and optional analyst framing.

## Outputs
Framing disclaimer, perceived interests, perceived constraints, likely moves in coarse probability bands, and views of other actors.

## Context Requirements
Needs a target Actor and enough case graph context to ground perspective modeling. Outputs are synthesized and capped at confidence 0.6.

## Composition
Can append a Red Team annex to Memo Studio and can route individual user-accepted claims to the review queue through the symbolic firewall.

## Examples
Model how a sanctioned actor may interpret a proposed pressure strategy without endorsing or advising that actor.

## Pitfalls
Never advocate for the modeled actor and never provide specific operational plans. Keep the disclaimer prominent.
