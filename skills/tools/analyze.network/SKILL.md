# Analyze Network

## Purpose
Compute graph analytics over the active case graph: centrality, PageRank, Louvain communities, and k-core backbone metrics.

## When To Use
Use this when an analyst needs to identify brokers, de-facto coalitions, influence concentration, resilient backbone nodes, or structural chokepoints in a case graph.

## When Not To Use
Do not use it as evidence of intent, factual truth, or prediction. Network position is structural context that needs substantive interpretation.

## Inputs
- `caseId`: Active case graph.
- `louvainSeed`: Optional deterministic community-detection seed.
- `weightField`: Optional edge metadata field for weighting.

## Outputs
- `topBrokers`: Highest betweenness nodes.
- `topPrestige`: Highest eigenvector centrality nodes.
- `communities`: Louvain community labels.
- `coreNumbers`: K-core decomposition.
- `metricsWritten`: Count of nodes updated with additive metrics.

## Context Requirements
Requires an owner-scoped case graph with at least five nodes. Documents are not required. Low context health is advisory.

## Composition
Can chain from contradiction finding and into brief export or community synthesis. It writes additive graph-node metrics only.

## Examples
Run on a Sudan case to identify which actor bridges military, commercial, and mediation clusters.

## Pitfalls
Centrality can overstate importance in sparse or biased graphs. Always report graph coverage, seed, and known missing data.
