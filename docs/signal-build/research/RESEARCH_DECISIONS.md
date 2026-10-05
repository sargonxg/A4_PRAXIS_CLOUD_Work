# Decisions from the additional research

## Preserve analytical distinctions

SemEval-2023 Task 3 separates article genre, frames and persuasion techniques. Its published task uses nine languages, with fourteen generic frames and twenty-three persuasion techniques. This supports treating those as separate evaluation targets; it does not establish event truth or deceptive intent. SIGNAL should add explicit, evidenced frame/rhetoric proposals to an attributed claim ledger, then let an analyst decide their relevance. [R01]

Do not ship a binary propaganda classifier as the central product. A source can use an emotional appeal in a truthful account, or present an unsupported claim in restrained prose. The proposed SIGNAL workflow records rhetorical form, factual support, authenticity, coordination and intent independently. A reviewed label must identify its evidence and meaning.

## Reuse retrieval before adding infrastructure

Use the existing PRAXIS embedding/retrieval service where available. Google's current model documentation lists multilingual embedding options with different dimensions and input lengths. Pin the provider/model revision, output dimension, normalization, task type and chunking profile in the index namespace. A model change requires a new compatible index or complete re-embedding, even if two models return vectors of the same size. [R02]

An open baseline such as multilingual E5 can be benchmarked separately. Its base card reports MIT licensing, 768 dimensions and a 512-token limit, with prescribed retrieval prefixes and weaker performance possible in low-resource languages. Do not deploy it or download its weights simply because it is named here. First measure the current PRAXIS option on the same permissioned evaluation set. [R03]

## Keep stable narratives separate from topic batches

BERTopic documents incremental and time-dependent topic modeling. Those are useful research candidates for a background topic explorer. They do not provide a production narrative identity, political interpretation or provenance model by themselves. Keep a stable narrative ledger with reviewed membership and aliases; a changed cluster becomes a merge/split proposal, not a new identity silently replacing the old one. [R04,R05]

For the initial pilot, combine deterministic duplicate/relevance processing, multilingual retrieval and bounded structured interpretation. A large clustering dependency is optional until corpus volume and a measured user workflow justify it.

## Treat collection access as a configurable dependency

ACLED's EULA requires corporate licensing for commercial access/use, and its content terms constrain AI-related uses. Keep that connector disabled until the actual SIGNAL entitlement covers the intended processing and deliverables. No licence was obtained here. [R06,R07]

UCDP's current API documentation requires an access token and explicit dataset version. Treat it as an optional contextual event series with its own definitions and release cadence; confirm commercial/redistribution terms before use. Do not silently interpret its events as independent verification of a particular media claim. [R08,R09]

Media Cloud offers story URL discovery and research functionality; its FAQ says it cannot provide actual story text. ReliefWeb requires an approved appname. Neither integration substitutes for permitted original source capture. [R10,R11]

## Validate models and data licences separately

The NLLB checkpoint inspected carries a non-commercial model licence. It is excluded from the default commercial implementation unless a different entitlement is established. A model's licence does not authorize redistribution of source texts or evaluation datasets. [R12]

SemEval, WANLP and MIRACL are methodological/evaluation references. Their relevance does not mean all associated data may be bundled into a customer product. Use owned synthetic seeds to build validators, then separately obtain and record permissions for a representative evaluation corpus. [R01,R13,R14]

## Make the handoff portable

The new bootstrap resolves its physical folder instead of assuming `docs/signal-build/` already exists. The launcher uses Codex's documented working-directory and additional-directory options. The kit is then installed into the real PRAXIS worktree, preserving existing instructions and progress. [R15]

Source details and URLs are in [SOURCE_REGISTER.md](SOURCE_REGISTER.md). Recommendations here are design judgments for SIGNAL, not externally established claims that this architecture is uniquely best or commercially validated.
