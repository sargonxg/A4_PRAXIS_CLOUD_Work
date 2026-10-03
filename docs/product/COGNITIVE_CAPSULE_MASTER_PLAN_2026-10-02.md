# TACITUS / PRAXIS
# Cognitive Capsule Architecture and Master CODEX Build Plan

**Repository:** `sargonxg/A4_PRAXIS_CLOUD_Work`  
**Architecture companion:** DIALECTICA by TACITUS  
**Baseline reviewed:** PRAXIS `main` around `8ff509b877f1dcd2b3ed6d074d2d5e96e3f9b923`  
**Purpose:** Turn PRAXIS into a serious knowledge-work operating environment built around portable Cognitive Capsules that preserve not only facts and documents, but expert distinctions, tacit knowledge, reasoning structures, language, precedent and practice.

---

# 0. READ THIS FIRST

Do not interpret this plan as:

> “Build a more elaborate RAG system.”

Do not interpret it as:

> “Put all documents into a knowledge graph.”

Do not interpret it as:

> “Try to recreate the entire human brain.”

The target is narrower and more useful.

## TACITUS thesis

Expert performance depends on more than access to information.

Experts know:

- what matters;
- what can safely be ignored;
- which distinctions are consequential;
- which terms are misleading;
- which actors are actually the same organization;
- when the same organization is no longer the same organization;
- which source is authoritative for which proposition;
- what an apparently strong statement does **not** establish;
- what is normal;
- what is anomalous;
- which anomaly matters;
- what usually happens next;
- what exception breaks the usual rule;
- what wording carries institutional or diplomatic meaning;
- what should never be inferred without another check;
- which precedent is actually analogous;
- which precedent only looks analogous;
- what evidence would cause them to change their mind;
- how the problem should be decomposed;
- which questions a novice does not know to ask.

A Cognitive Capsule is a portable computational representation of that expertise.

It is not a brain.

It is an **expert cognitive scaffold**.

---

# 1. PRODUCT NORTH STAR

TACITUS should ultimately consist of four tightly integrated systems.

```text
                    TACITUS
                       │
       ┌───────────────┼─────────────────┐
       │               │                 │
       ▼               ▼                 ▼
  DIALECTICA      CAPSULE LIBRARY       PRAXIS
 Context Engine    / REGISTRY          Workbench
       │               │                 │
       └───────────────┼─────────────────┘
                       │
                 Cognitive Capsules
                       │
                       ▼
                AGENT WORKFLOWS
```

## 1.1 DIALECTICA

Builds, compiles and validates sophisticated context.

It owns:

- ingestion;
- source normalization;
- evidence extraction;
- entity resolution;
- semantic graph construction;
- temporal modeling;
- provenance;
- ontology alignment;
- context compilation;
- portable capsule artifacts;
- structural validation;
- deterministic reasoning recipes.

## 1.2 Capsule Library / Registry

Stores and distributes reusable knowledge objects.

It owns:

- discovery;
- installation;
- versioning;
- dependencies;
- publishing;
- provenance;
- authorship;
- licensing;
- certifications;
- evaluations;
- private / organization / public distribution;
- later commercial marketplace functions.

## 1.3 PRAXIS

The expert knowledge-work environment.

It owns:

- asking;
- analysis;
- research;
- capsule attachment;
- expert elicitation;
- capsule inspection;
- capsule improvement;
- human review;
- agent orchestration;
- writing;
- deliberation;
- approvals;
- handover;
- outputs.

## 1.4 Agent Runtime

Uses Capsules to make AI substantially more capable for particular domains.

It owns:

- triage;
- worker selection;
- worker communication;
- tools;
- research;
- evidence checking;
- specialist analysis;
- red teaming;
- drafting;
- language review;
- handoffs;
- durable runs.

---

# 2. THE KEY DESIGN CHANGE

The current PRAXIS Capsule architecture has many correct ingredients.

Current code already contains:

```text
humanTacitKnowledge
workingAssumptions
hiddenConstraints
redLines
institutionalHabits
approvalPolitics
practicalHeuristics
stakeholderSensitivities
caveats
recurringDecisions
promptlessKnowledge
```

It also already contains:

```text
claimLedger
temporality
causality
ontologyBinding
embeddedGraph
sourceSpine
reasoningScaffold
agentOperatingContract
reviewCards
marketplaceProfile
evaluation
```

This is excellent groundwork.

The main weakness is representational.

Much of the sophisticated knowledge remains:

```ts
string[]
```

The next Capsule architecture must make expert knowledge **typed, relational and computable**.

For example, this:

```ts
practicalHeuristics: [
  "A public rejection may still leave room for a private compromise."
]
```

should be able to become:

```text
HEURISTIC H17

applies_when:
  actor has made public rejection

look_for:
  private-channel language
  qualifying modal verbs
  mediator activity
  absence of stated red line

do_not_infer:
  negotiating position has ended

possible_interpretation:
  audience-cost management

exceptions:
  formal legal prohibition
  explicit irreversible commitment
  verified breakdown of contact

expert_rationale:
  Public positions frequently serve a different audience from private
  negotiating positions.

examples:
  Case A
  Case B

reviewed_by:
  Expert X

scope:
  multilateral diplomacy

confidence_kind:
  expert-practice-rule
```

That is usable expertise.

---

# 3. DO NOT BUILD ONE GIANT GRAPH

A Capsule should contain multiple related cognitive layers.

They may be stored in one physical graph engine, but conceptually they must remain distinct.

Use these layers.

```text
1. WORLD GRAPH
2. EPISTEMIC GRAPH
3. ARGUMENT / RATIONALE GRAPH
4. EXPERTISE / TACIT KNOWLEDGE GRAPH
5. LANGUAGE / PRAGMATICS GRAPH
6. PROCEDURE / METHOD GRAPH
7. TEMPORAL / CAUSAL GRAPH
8. CASE / PRECEDENT GRAPH
9. NORM / CONSTRAINT GRAPH
10. PROVENANCE GRAPH
```

The Context Compiler selects from these layers differently depending on the task.

---

# 4. WORLD GRAPH

The World Graph describes the domain.

PRAXIS already has a strong base with the eight TACITUS / ACO primitives:

```text
Actor
Claim
Interest
Constraint
Leverage
Commitment
Event
Narrative
```

Keep them as the stable domain-world substrate.

Do **not** try to force all expert cognition into those eight types.

Add separate cognitive namespaces around them.

Examples:

```text
aco:Actor
aco:Claim
aco:Interest
aco:Constraint
aco:Leverage
aco:Commitment
aco:Event
aco:Narrative
```

The eight primitives remain stable.

Expert cognition uses other namespaces.

---

# 5. EPISTEMIC GRAPH

The Epistemic Graph represents:

> Who believes what, based on what, with what status?

Core objects:

```text
Claim
Evidence
Source
Observation
Assessment
Assumption
Hypothesis
Unknown
Dispute
Corroboration
```

Core relations:

```text
SUPPORTS
CONTRADICTS
QUALIFIES
CORROBORATES
DISPUTES
REPORTS
ALLEGES
ASSERTS
INFERS
ASSUMES
SUPERSEDES
RETRACTS
FAILS_TO_ESTABLISH
REQUIRES_ADDITIONAL_EVIDENCE
```

This distinction is critical.

A news article saying:

> “Officials believe militia X is responsible.”

must not become:

```text
Militia X -> perpetrated -> attack
```

It should become something more like:

```text
OfficialGroup -> ASSESSES -> Proposition P
NewsOutlet -> REPORTS -> Assessment A
Assessment A -> ABOUT -> Proposition P
Evidence E -> SUPPORTS -> Assessment A
```

Only later human review may establish a stronger proposition.

---

# 6. ARGUMENT AND RATIONALE GRAPH

This is one of the most important additions.

Facts alone do not capture reasoning.

Represent explicit analytical argument structures.

Objects:

```text
Proposition
Premise
Conclusion
Inference
AlternativeExplanation
CounterArgument
Assumption
DecisionCriterion
Option
Tradeoff
Question
```

Relations:

```text
SUPPORTS
UNDERCUTS
REBUTS
DEPENDS_ON
ASSUMES
QUALIFIES
EXCEPTION_TO
WEIGHS_FOR
WEIGHS_AGAINST
EXPLAINS
DOES_NOT_IMPLY
DISTINGUISHES
ALTERNATIVE_TO
WOULD_CHANGE_IF
```

Example:

```text
P1:
Government forces moved north.

P2:
Supply depots were opened.

H1:
Major offensive preparation.

H2:
Defensive reinforcement.

P1 SUPPORTS H1.
P1 SUPPORTS H2.
P2 STRONGLY_SUPPORTS H1.
WeatherConstraint WEIGHS_AGAINST H1.
AbsenceOfArtillery QUALIFIES H1.
```

The LLM can reason over this much more effectively than over paragraphs alone.

It also makes disagreement inspectable.

---

# 7. EXPERTISE / TACIT KNOWLEDGE GRAPH

This is the real TACITUS differentiator.

New first-class objects:

```text
Cue
Pattern
Heuristic
Distinction
Exception
Rule
Threshold
RedFlag
AntiPattern
FailureMode
DiagnosticQuestion
Check
Expectation
Anomaly
ExpertJudgment
PracticeNote
```

## 7.1 Cue

A clue an expert notices.

Example:

```text
Cue:
Repeated postponement without formal cancellation.

PossibleMeaning:
Actor wants flexibility without absorbing cost of withdrawal.

Check:
Look for continued technical-level engagement.

DoNotInfer:
Negotiations have ended.
```

## 7.2 Distinction

Something a novice tends to collapse.

```text
Distinction:
allocation != obligation != disbursement != expenditure
```

with:

```text
whyItMatters
tests
examples
counterexamples
frequentMistake
```

## 7.3 Heuristic

A reusable expert shortcut.

```text
When:
three independent indicators A/B/C

Consider:
interpretation X

Unless:
condition D

NextCheck:
source E

FailureMode:
false positive when F
```

## 7.4 Pattern

A recurring configuration.

Naturalistic expert decision-making is often pattern recognition.

Represent:

```text
Pattern
  expected cues
  optional cues
  disconfirming cues
  typical interpretation
  likely evolution
  recommended checks
  known failure conditions
```

## 7.5 Red Flag

Example:

```text
RedFlag:
An actor adopts the exact terminology of another actor shortly before
organizational integration.

PossibleSignificance:
coordination or messaging alignment.

DoNotInfer:
formal command relationship.

NextEvidence:
joint statements
personnel overlap
command appointment
operational coordination
```

---

# 8. LANGUAGE / PRAGMATICS GRAPH

This layer is essential for diplomacy, negotiation, law, politics, mediation and institutions.

Traditional RAG largely treats language as semantic similarity.

Experts often care about the **specific communicative act**.

Use objects:

```text
Term
Phrase
Alias
Register
SpeechAct
Frame
Euphemism
LoadedTerm
PreferredTerm
ForbiddenTerm
Translation
Formula
InstitutionalUsage
```

Relations:

```text
MEANS_IN_CONTEXT
ALIAS_OF
PREFERRED_OVER
AVOID_FOR_AUDIENCE
IMPLIES_RECOGNITION_OF
DOES_NOT_IMPLY
SIGNALS
HEDGES
COMMITS
REQUESTS
URGES
DEMANDS
REASSURES
THREATENS
CONCEDES
REJECTS
ACCEPTS_CONDITIONALLY
LEAVES_AMBIGUOUS
```

ISO 24617-2 dialogue-act concepts should be studied as a compatibility reference.

Do not blindly implement the entire standard.

Borrow the idea that an utterance may simultaneously have multiple communicative functions.

---

# 9. LANGUAGE MUST ALSO LIVE ON EDGES

A generic graph edge:

```text
State A -> supports -> proposal X
```

is inadequate.

The edge itself needs semantics.

Create something like:

```ts
interface CognitiveStatement {
  id: string;

  subject: NodeRef;
  predicate: string;
  object: NodeRef | LiteralValue;

  layer:
    | 'world'
    | 'epistemic'
    | 'argument'
    | 'expertise'
    | 'language'
    | 'procedure'
    | 'temporal'
    | 'normative';

  polarity:
    | 'positive'
    | 'negative'
    | 'mixed';

  modality?:
    | 'asserted'
    | 'possible'
    | 'probable'
    | 'conditional'
    | 'counterfactual'
    | 'desired'
    | 'obligatory';

  strength?: string;

  conditions?: NodeRef[];
  exceptions?: NodeRef[];

  validFrom?: string;
  validUntil?: string;

  observedAt?: string;

  assertedBy?: NodeRef;
  addressedTo?: NodeRef[];

  audience?: NodeRef[];
  channel?: 'public' | 'private' | 'confidential' | 'internal';

  speechAct?: string;

  language?: string;
  wordingRef?: EvidenceSpanRef;

  sourceRefs: EvidenceSpanRef[];

  rationaleRef?: NodeRef;

  reviewState:
    | 'proposed'
    | 'reviewed'
    | 'accepted'
    | 'rejected'
    | 'superseded';

  generatedBy: ProvenanceActor;
}
```

This is the basic semantic unit of TACITUS.

---

# 10. EXAMPLE: DIPLOMATIC LANGUAGE

Source text:

> “We would be prepared to consider such arrangements under appropriate circumstances.”

A generic model may summarize:

> State A supports the arrangement.

Wrong.

TACITUS representation:

```text
speaker:
  State A representative

speech_act:
  conditional openness

object:
  proposed arrangement

modality:
  conditional

commitment_strength:
  low

condition:
  "appropriate circumstances"
  unresolved

channel:
  public

interpretation:
  signals negotiability

does_not_establish:
  acceptance
  commitment
  implementation authority

follow_up_questions:
  What circumstances?
  Was speaker authorized?
  Was the same language used privately?
  Did later statements narrow the opening?
```

Now an agent cannot casually collapse:

```text
"prepared to consider"
```

into:

```text
"agreed"
```

---

# 11. EXAMPLE: ARMED-GROUP IDENTITY

A generic model might treat all of these as one name cluster:

```text
Group X
X Brigade
X Front
X Military Council
X-affiliated factions
former X fighters
```

That is dangerous.

Use:

```text
Organization
Faction
UmbrellaOrganization
OperationalCoalition
PoliticalWing
MilitaryWing
FormerMemberNetwork
UnknownAffiliate
```

Relations:

```text
ALIAS_OF
FORMERLY_KNOWN_AS
SPLINTERED_FROM
MERGED_INTO
MEMBER_OF
AFFILIATED_WITH
COOPERATES_WITH
CLAIMS_MEMBERSHIP_IN
REPORTED_AS_AFFILIATE_OF
INTEGRATED_INTO
DISSOLVED_INTO
```

All time bounded.

Example:

```text
Faction A
  SPLINTERED_FROM
Parent Movement

valid_from:
  2024-03-01

Faction A
  INTEGRATED_INTO
New Security Force

valid_from:
  2025-01-15
```

Therefore a query about December 2024 and one about February 2025 may resolve the actor differently.

This is exactly why symbolic identity matters.

---

# 12. PROCEDURAL / METHOD GRAPH

Expertise is also procedural.

Represent:

```text
Procedure
Step
DecisionPoint
Input
Output
Check
StopCondition
EscalationCondition
Tool
Role
```

Relations:

```text
PRECEDES
REQUIRES
PRODUCES
CHECK_WITH
BRANCHES_ON
STOP_IF
ESCALATE_IF
VALIDATE_WITH
REPEAT_UNTIL
```

Example Tool Capsule:

```text
Analysis of Competing Hypotheses

Step 1:
define hypotheses

Step 2:
collect diagnostic evidence

Step 3:
score consistency

Rule:
focus more on evidence inconsistent with a hypothesis than evidence merely
consistent with it

Stop condition:
hypotheses remain insufficiently discriminated

Output:
hypothesis matrix + unresolved evidence
```

Do not just store a prose prompt saying:

> “Use ACH.”

Encode the procedure.

---

# 13. CASE / PRECEDENT GRAPH

Experts often reason from examples.

Add:

```text
Case
Episode
Decision
Outcome
Lesson
Analogy
Counterexample
```

and:

```text
SIMILAR_TO
DIFFERS_FROM
PRECEDENT_FOR
COUNTEREXAMPLE_TO
LESSON_FROM
ANALOGY_VALID_IF
ANALOGY_BREAKS_IF
```

This is critical.

Generic AI analogies often match superficial similarity.

Experts know which dimensions make the precedent relevant.

Example:

```text
Case A analogous to Case B
because:
  same institutional authority
  similar coalition structure

analogy breaks on:
  different enforcement mechanism
  different external guarantor
```

---

# 14. EXPERT METACOGNITION

A Capsule should know not only things, but how to recognize its own limits.

Represent:

```text
Unknown
EvidenceGap
Ambiguity
Disagreement
OutOfScope
StalenessCondition
RevisionTrigger
```

Examples:

```text
UNKNOWN:
actual private position of Actor A

KNOWN:
public position

DO_NOT_COLLAPSE
```

and:

```text
RevisionTrigger:
If ministry publishes implementation regulation,
reassess "policy announced but not operational."
```

This produces better AI behavior than a generic “confidence 68%.”

---

# 15. COGNITIVE MEMORY MODEL

Think of the Capsule as containing several kinds of memory.

Not literally neurological memory—functional analogues.

## Semantic memory

What things mean.

```text
concepts
entities
relations
definitions
taxonomy
```

## Episodic memory

What happened.

```text
events
cases
meetings
decisions
precedents
```

## Procedural memory

How work is done.

```text
methods
steps
checks
decision rules
```

## Pragmatic memory

How language functions in context.

```text
phrasing
speech acts
register
audience sensitivity
institutional terminology
```

## Expert-pattern memory

What experienced practitioners notice.

```text
cues
patterns
exceptions
anomalies
heuristics
red flags
```

## Metacognitive memory

What the expert does not know and when to reconsider.

```text
unknowns
uncertainty
revision triggers
diagnostic questions
```

This is a much better model for TACITUS than “long-term agent memory.”

---

# 16. CAPSULE TYPES

All Capsules should share one underlying architecture.

Different profiles emphasize different layers.

Recommended primary profiles:

```text
Situation Capsule
Expertise Capsule
Method Capsule
Language Capsule
Organization Capsule
Role/User Capsule
Casebook Capsule
Output Capsule
```

## Situation Capsule

Specific case or issue.

## Expertise Capsule

A specialist's domain cognition.

Example:

```text
UN Security Council political affairs expertise
```

## Method Capsule

Reusable analytical procedure.

Example:

```text
ACH
stakeholder mapping
mediation readiness assessment
```

## Language Capsule

Terminology and pragmatics.

Example:

```text
UN diplomatic drafting language
Syrian armed actor nomenclature
EU sanctions terminology
```

## Organization Capsule

Institutional procedures and habits.

Example:

```text
DPPA briefing workflow
Company investment committee
```

## Role Capsule

User / professional role.

Example:

```text
Political Affairs Officer
Mediation Advisor
Investment Analyst
```

## Casebook Capsule

Precedents and analogies.

## Output Capsule

What a deliverable should contain.

---

# 17. CAPSULE COMPOSITION

Do not bind the architecture permanently to the current four UI slots.

Keep the surface simple, but allow richer composition underneath.

A Task Context may contain:

```text
1 Role/User Capsule
1 primary Situation Capsule
0..N Expertise Capsules
0..N Method Capsules
0..N Language Capsules
0..N Organization Capsules
0..N Casebooks
1 Output Capsule
0..N Reference Capsules
```

The UI can still show four understandable groups:

```text
WHO AM I?
WHAT AM I WORKING ON?
HOW SHOULD I THINK?
WHAT AM I MAKING?
```

Under “How should I think?” multiple expertise/method/language capsules can be stacked.

---

# 18. CAPSULE BUILDER: THE FIRST MAJOR PRODUCT

This is one of the most important things PRAXIS needs.

Build a serious:

# Capsule Studio

It must support:

```text
CREATE
INGEST
INTERVIEW
STRUCTURE
INSPECT
CHAT
TEST
REVIEW
VERSION
PUBLISH
```

Do not make Capsule creation a long settings form.

---

# 19. CAPSULE STUDIO MODES

## Mode A — Start from sources

User provides:

```text
documents
URLs
notes
transcripts
emails
datasets
existing reports
```

DIALECTICA proposes structure.

Nothing important becomes canonical without review.

---

## Mode B — Interview an expert

The Capsule Chat becomes an expertise elicitation agent.

It must use Cognitive Task Analysis-inspired questioning.

Ask things like:

```text
What does a beginner usually miss here?

What clue makes you change your interpretation?

Give me an example where the obvious rule failed.

What words in this field carry more meaning than outsiders realize?

Which sources do you trust for which questions?

What would make you distrust an otherwise authoritative source?

What distinction do junior analysts repeatedly collapse?

What are you looking for when you read this kind of document?

What would make you say "something is wrong here"?

What do you know from experience that is rarely written down?

When would you NOT apply this rule?

What evidence would change your mind?

Which two cases look similar but really are not?

What do people in this institution say publicly but mean differently privately?

Which terms should never be substituted for each other?

What is a dangerous but plausible inference?

What would you check before putting this sentence in a briefing?
```

---

# 20. CRITICAL DECISION INTERVIEW

Add a specific workflow based on critical incidents.

User gives a real case.

The AI asks:

```text
What first caught your attention?

What did you notice that another person might not?

At what point did your interpretation change?

What alternatives did you consider?

What did you rule out?

What information were you expecting to see?

What was missing?

What would a novice probably have done?

What would have made that action wrong?

What prior case did this remind you of?

Where did the analogy fail?

What did you do next and why?
```

Convert the answers into proposed:

```text
Cue
Pattern
Heuristic
Exception
DiagnosticQuestion
Precedent
FailureMode
```

---

# 21. TEACH-BY-CORRECTION

This may become one of TACITUS's strongest learning mechanisms.

Whenever the expert corrects PRAXIS:

> “No. You cannot say this funding was spent. It was authorized, but no expenditure has been reported.”

PRAXIS should detect:

```text
EXPERT CORRECTION CANDIDATE
```

and offer:

```text
Save as distinction?
Save as domain rule?
Save as example?
Save as language rule?
Ignore?
```

Potential resulting object:

```text
Distinction:
authorization != expenditure

Rule:
Never infer expenditure solely from authorization.

Required evidence:
payment / obligation / disbursement / expenditure records,
depending on claimed stage.
```

Over time the Capsule becomes better because of actual expert work.

---

# 22. CAPSULE CHAT

Every Capsule gets an embedded chatbot.

Not merely:

> “Ask this document questions.”

The chatbot understands the Capsule architecture.

Commands/questions should include:

```text
Explain this capsule.

What are its strongest pieces of expert knowledge?

What would a novice miss?

Show unresolved contradictions.

Show unsupported heuristics.

Why does this edge exist?

Which knowledge came from Expert A?

Which knowledge came from documents?

Which rules have exceptions?

What has changed since v7?

Which terms are sensitive?

Which actors have ambiguous identities?

Which knowledge is stale?

What would you add to make this capsule stronger?

Test this capsule against this scenario.

Compare this capsule with another one.

Find duplicated rules.

Find conflicting heuristics.

Show me every assumption affecting this conclusion.

Show the evidence behind this pattern.

Turn this conversation into proposed capsule changes.
```

All proposed changes appear as review cards.

---

# 23. CAPSULE STUDIO VISUAL STRUCTURE

Suggested internal sections:

```text
Overview
Knowledge
Graph
Expertise
Language
Methods
Cases
Sources
Questions & Gaps
Tests
History
```

These do not all need to be permanent top-level application navigation.

They are modes inside Capsule Studio.

---

# 24. GRAPH INSPECTION

The graph must be useful, not decorative.

Allow layer filtering:

```text
World
Evidence
Reasoning
Expertise
Language
Methods
Temporal
Cases
```

Click an edge and show:

```text
relationship
plain-language meaning
conditions
exceptions
validity period
source
expert rationale
reviewer
history
```

Example:

```text
Actor A
 ── ACCEPTS_CONDITIONALLY ──>
 Proposal B
```

edge inspector:

```text
condition:
international monitoring mechanism

public/private:
private

speaker:
deputy foreign minister

authority:
negotiating representative, not final decision-maker

source:
meeting record 14 March

valid from:
14 March

last confirmed:
20 March

expert note:
Do not translate this into "supports Proposal B."
```

That is a useful graph.

---

# 25. FIRST-CLASS STATEMENTS

Internally, allow statements about relationships.

Model something like:

```text
Statement S1:
Actor A -- supports --> Proposal B

Annotations:
asserted_by: Newspaper N
source: Article 1
stance: reported_claim
valid_from: X
confidence_kind: reported
contradicted_by: Statement S2
```

This maps well to emerging RDF 1.2 statement/reification semantics.

Do not make RDF itself a mandatory runtime database.

Design the TACITUS model so export to RDF/JSON-LD is natural.

---

# 26. GRAPH VALIDATION

Create explicit constraints.

Examples:

```text
A Commitment must have an actor.

A direct quotation must have an EvidenceSpan.

A reviewed factual Claim must have provenance.

A SpeechAct must identify a speaker or explicitly mark unknown.

An organizational identity change must carry a validity interval.

A hard DecisionRule must specify scope.

A Heuristic must not be presented as a universal fact.

A case analogy must indicate relevant dimensions or explicitly remain proposed.

A superseded statement cannot be current without a new assertion.
```

Use deterministic validation.

Study SHACL and map TACITUS constraints to it.

Stable SHACL can serve as interoperability/export validation even if internal validation is TypeScript/Rust.

---

# 27. SOURCE EVIDENCE

Every important knowledge object should be able to link to exact evidence.

Use:

```text
source
source version
page
character offsets
exact quote
prefix
suffix
bounding box
hash
```

The current PRAXIS spatial source infrastructure is already a good start.

Do not throw it away.

Unify it with DIALECTICA evidence spans.

---

# 28. PROVENANCE

Every knowledge object should answer:

```text
Who said this?

Who extracted it?

Who reviewed it?

From what source?

When?

Was it inferred?

What version?

What replaced it?
```

Use a provenance model compatible with W3C PROV where feasible.

Distinguish:

```text
human authored
human confirmed
model extracted
model proposed
rule inferred
imported
derived
```

---

# 29. EXPLICIT RATIONALE, NOT HIDDEN MODEL CHAIN-OF-THOUGHT

Do not store model hidden reasoning.

TACITUS should store **inspectable rationale objects**.

Examples:

```text
Expert rationale
Method step
Argument relation
Evidence relation
Decision criterion
Exception
Analytical note
```

These are authored/approved content.

They are not hidden chain-of-thought.

---

# 30. PORTABLE CAPSULE FORMAT

A Capsule must be usable outside PRAXIS.

Published Capsule versions become immutable portable artifacts.

Suggested structure:

```text
my-capsule.capsule
│
├── mimetype
├── manifest.json
├── README.md
│
├── graph.jsonld
│
├── statements.jsonl
│
├── claims.jsonl
│
├── evidence/
│   ├── sources.jsonl
│   ├── spans.jsonl
│   └── documents.json
│
├── expertise/
│   ├── cues.jsonl
│   ├── patterns.jsonl
│   ├── heuristics.jsonl
│   ├── distinctions.jsonl
│   ├── exceptions.jsonl
│   ├── red_flags.jsonl
│   └── questions.jsonl
│
├── language/
│   ├── terms.jsonl
│   ├── aliases.jsonl
│   ├── speech_acts.jsonl
│   ├── registers.jsonl
│   └── language_rules.jsonl
│
├── methods/
│   ├── procedures.jsonl
│   └── decisions.jsonl
│
├── cases/
│   ├── cases.jsonl
│   └── analogies.jsonl
│
├── temporal/
│   └── episodes.json
│
├── governance/
│   ├── rights.json
│   ├── review.json
│   └── provenance.json
│
├── evals/
│   ├── golden_tasks.jsonl
│   └── results.json
│
├── runtime/
│   ├── context_profiles.json
│   └── agent_contract.json
│
├── graph/
│   └── embedded-portable-projection
│
└── attestations/
    └── ...
```

Not every Capsule requires every layer.

---

# 31. CANONICAL VS DERIVED CONTENT

Canonical:

```text
typed semantic records
evidence spans
expert knowledge
language rules
procedures
cases
review state
provenance
```

Derived:

```text
embeddings
vector indexes
full-text indexes
graph database binary projections
prompt blocks
summaries
visual layouts
retrieval caches
```

Derived artifacts may always be regenerated.

Never make an embedding the authoritative form of knowledge.

---

# 32. PORTABLE GRAPH

The Capsule needs a graph that travels.

Canonical portable semantic representation:

```text
graph.jsonld
```

plus typed records.

Generate an embedded query projection for fast local use.

PRAXIS and DIALECTICA must converge on one portable graph strategy.

Do not maintain incompatible:

```text
PRAXIS graph artifact
DIALECTICA graph artifact
```

forever.

DIALECTICA should compile the shared portable projection.

PRAXIS should consume it.

---

# 33. CAPSULE LIBRARY

The Capsule Library should eventually work as a standalone product.

Conceptually:

```text
CAPSULE LIBRARY
│
├── My Capsules
├── Team Capsules
├── Installed
├── Discover
├── Updates
└── Published
```

Each Capsule card:

```text
name
author
type
domain
version
updated
scope
source posture
expertise depth
review state
eval posture
dependencies
license
```

---

# 34. REGISTRY BEFORE MARKETPLACE

Do not start by building commerce.

Build a package registry.

Identity:

```text
publisher/name
```

Version:

```text
publisher/name@1.4.2
```

Digest:

```text
sha256:...
```

Examples:

```text
tacitus/un-security-council-language@2.1.0
tacitus/analysis-of-competing-hypotheses@3.0.1
org/sudan-political-context@12.2.0
expert-x/mediation-practice@1.0.0
```

Commands later:

```text
install
update
fork
extend
compare
publish
deprecate
withdraw
```

---

# 35. CAPSULE DEPENDENCIES

Capsules may depend on other Capsules.

Example:

```text
Sudan Situation Capsule
  imports:
    UN Terminology Capsule
    Humanitarian Method Capsule
    Regional Actors Casebook
```

Dependencies must be exact or semver-constrained.

Resolved published builds should lock exact digests.

---

# 36. MARKETPLACE

Once registry and quality infrastructure are strong, add commerce.

People should eventually be able to sell:

```text
expertise
methods
casebooks
language knowledge
institutional knowledge
domain context
analysis templates
```

Possible commercial products:

```text
Former mediator's negotiation practice capsule
Sanctions lawyer's designation analysis method
Country expert's political context capsule
Investment analyst's diligence method
Medical specialist's diagnostic workflow
Cyber responder's incident playbook
```

Do not market this as selling “a person's brain.”

Market it as:

> structured expert context and practice.

---

# 37. MARKETPLACE TRUST

Do not use one generic “verified” badge.

Display dimensions:

```text
Human authored
Human reviewed
Source backed
Expert reviewed
Last reviewed
Evaluation tested
Provenance complete
Method documented
Freshness monitored
```

Separately:

```text
TACITUS structural validation passed
```

Structural validation does not mean factual truth.

---

# 38. EXPERT INTELLECTUAL PROPERTY

Future commercial Capsules create an IP problem.

Offer modes:

```text
open
private
organization
licensed
```

Eventually explore:

```text
sealed-use Capsule
```

where customers can use server-side compiled context without receiving the entire raw expert package.

Do not promise perfect prevention of extraction.

Treat it as access control, not magical DRM.

---

# 39. SIGNING AND ATTESTATION

Published versions should be content addressed.

Use:

```text
content digest
author signature
review attestation
evaluation attestation
publication attestation
```

The current Sigstore/in-toto types in PRAXIS are useful.

Build actual verification.

External attestation should not mutate the Capsule artifact.

---

# 40. CAPSULE QUALITY: REPLACE THE SINGLE SCORE

Do not reduce quality to:

```text
87/100
```

Expose a profile.

Example:

```text
Evidence depth          HIGH
Expertise capture       HIGH
Language/pragmatics     MEDIUM
Case coverage           LOW
Method completeness     HIGH
Temporal coverage       MEDIUM
Human review            CURRENT
Freshness               18 days
Evaluation coverage     14 tasks
```

An internal aggregate score may exist.

Do not let it masquerade as epistemic confidence.

---

# 41. COGNITIVE DEPTH LADDER

Use a maturity model.

```text
LEVEL 0 — DOCUMENTS
Raw source collection.

LEVEL 1 — SEMANTICS
Entities, concepts and definitions.

LEVEL 2 — EVIDENCE
Claims connected to provenance.

LEVEL 3 — STRUCTURE
Temporal, causal and relational graph.

LEVEL 4 — EXPERT DISTINCTIONS
Heuristics, cues, exceptions and red flags.

LEVEL 5 — PRACTICE
Procedures, methods and decision rules.

LEVEL 6 — EXPERIENCE
Cases, precedents, analogy boundaries.

LEVEL 7 — TESTED EXPERTISE
Human reviewed and evaluated on representative tasks.
```

This is more useful than “capsule quality 91.”

---

# 42. AGENT WORKFLOWS: CAPSULES MUST ACTUALLY CHANGE PERFORMANCE

A Capsule that looks impressive but does not improve the agent is a failure.

The runtime architecture should be:

```text
USER TASK
   │
   ▼
TRIAGE SUPERVISOR
   │
   ▼
CONTEXT COMPILER
   │
   ├── worker-specific context view
   ├── worker-specific context view
   └── worker-specific context view
   │
   ▼
SPECIALIST WORKERS
   │
   ▼
SHARED WORKING BLACKBOARD
   │
   ▼
REVIEW / SYNTHESIS
   │
   ▼
OUTPUT
```

---

# 43. TRIAGE SUPERVISOR

Triage decides:

```text
quick answer
attached-source analysis
research
deep research
timeline analysis
stakeholder analysis
hypothesis analysis
language review
decision memo
red team
multi-agent review
capsule improvement
```

It also chooses workers.

Do not run ten workers on a trivial question.

---

# 44. WORKER ROLES

Initial generic worker registry:

```text
Planner
Researcher
Source Verifier
Entity Resolver
Temporal Analyst
Graph Analyst
Domain Specialist
Hypothesis Analyst
Pragmatics / Language Analyst
Red Team
Writer
Sourceability Reviewer
Capsule Curator
```

A workflow does not need all of them.

---

# 45. WORKER-SPECIFIC CONTEXT VIEWS

This is critical.

Do not send the exact same giant Capsule prompt to every worker.

## Researcher receives

```text
known facts
source gaps
entity aliases
freshness requirements
diagnostic questions
```

## Entity Resolver receives

```text
actors
aliases
historical identities
splinter rules
time intervals
```

## Domain Specialist receives

```text
expertise patterns
distinctions
rules
exceptions
cases
```

## Language Analyst receives

```text
terminology
speech acts
register
forbidden substitutions
audience constraints
```

## Writer receives

```text
accepted claims
evidence
uncertainties
output contract
language rules
```

## Red Team receives

```text
hypotheses
assumptions
counterevidence
weak claims
alternative patterns
```

This is a real Context Compiler.

---

# 46. SHARED WORKING BLACKBOARD

Workers should not communicate only through prose messages.

Create typed run-scoped objects:

```text
WorkingClaim
EvidenceCandidate
Question
Hypothesis
ActorCandidate
EntityResolution
TimelineEvent
Contradiction
SourceGap
AnalysisProposal
GraphProposal
DraftBlock
ReviewIssue
```

Worker A can create:

```text
Question Q7
```

Worker B can resolve it.

Worker C can use the result.

All references use IDs.

---

# 47. CANONICAL CAPSULE IS NEVER THE BLACKBOARD

This distinction is fundamental.

```text
CANONICAL CAPSULE
reviewed durable knowledge

WORKING BLACKBOARD
temporary run knowledge
```

Agents freely write proposals to the blackboard.

Agents do **not** freely mutate the Capsule.

Useful run discoveries become:

```text
CapsuleChangeProposal
```

for human review.

---

# 48. MULTI-AGENT EXAMPLE

User:

> “Prepare options for reopening talks with armed movement X.”

Triage:

```text
complex
needs current sources
needs actor identity
needs negotiation practice
```

Attached Capsules:

```text
Sudan Situation
Armed Actor Identity
Mediation Practice
UN Diplomatic Language
Decision Brief Output
```

Workers:

```text
1 Researcher
2 Entity Resolver
3 Mediation Specialist
4 Red Team
5 Writer
6 Sourceability Reviewer
```

Entity Resolver notices:

```text
Source 1 refers to X-Main.
Source 2 refers to X-North faction.
Do not merge.
```

Mediation Specialist recognizes pattern:

```text
public refusal + indirect mediator contact
```

but checks exception:

```text
leadership succession makes old pattern unreliable
```

Language specialist prevents writer from saying:

```text
“X has agreed to talks.”
```

Instead:

```text
“X has maintained its public refusal while leaving indirect channels open.”
```

This is exactly how the Capsule should improve AI.

---

# 49. WORKFLOW SPECIFICATION

Make workflows data-driven.

```ts
interface WorkflowSpec {
  id: string;
  version: string;

  purpose: string;

  triggerPatterns: string[];

  requiredCapsuleKinds: string[];

  workerGraph: WorkerNode[];

  toolPermissions: ToolPermission[];

  approvalGates: ApprovalGate[];

  outputContract: string;

  evaluationSuite: string;
}
```

Future Method Capsules may contain WorkflowSpecs.

This makes workflows installable.

---

# 50. MCP

Keep MCP as the tool/resource boundary.

Useful Capsule resources:

```text
capsule://...
statement://...
evidence://...
case://...
term://...
run://...
```

Useful tools:

```text
query_capsule
search_evidence
inspect_statement
resolve_actor
compile_context
compare_capsule_versions
propose_capsule_change
validate_capsule
run_capsule_eval
```

Write operations remain gated.

Current MCP's resources/tools/prompts distinction fits TACITUS well.

---

# 51. AG-UI

Do not replace PRAXIS's run ledger.

Add AG-UI compatibility later.

Map:

```text
PRAXIS run events
tool events
worker events
activity
state
```

into AG-UI's event stream.

This helps make the frontend portable without making AG-UI the architecture.

---

# 52. A2A

A2A becomes valuable later when external specialist agents participate.

Example:

```text
PRAXIS
  ├── internal political analyst
  ├── external sanctions agent
  └── external translation agent
```

They exchange:

```text
Task
Artifact
CapsuleRef
EvidenceRef
```

not the entire internal state.

Defer until the Capsule and workflow contracts stabilize.

---

# 53. PRAXIS CLI — BUILD AN MVP NOW

A CLI fits this architecture extremely well.

Start simple.

Command:

```bash
praxis
```

Initial commands:

```bash
praxis login
praxis whoami

praxis capsule list
praxis capsule inspect <id>
praxis capsule chat <id>
praxis capsule graph <id>
praxis capsule validate <id>
praxis capsule diff <a> <b>
praxis capsule pack <id>
praxis capsule unpack <file>
praxis capsule eval <id>

praxis ask "question" --capsule <id>

praxis run research \
  --capsule situation-id \
  --capsule expertise-id

praxis run memo \
  --capsule situation-id \
  --output decision-brief

praxis receipt <run-id>
```

Then add:

```bash
praxis capsule install
praxis capsule publish
praxis capsule fork
praxis capsule update
```

---

# 54. CLI ARCHITECTURE

Do not duplicate application logic.

CLI talks to:

```text
PRAXIS API
DIALECTICA API
Capsule Registry
```

and can inspect local `.capsule` files.

Create something like:

```text
packages/praxis-cli/
```

if repository structure allows.

Otherwise begin:

```text
cli/
```

Do not turn the main Next.js application into a CLI bundle.

---

# 55. LOCAL CAPSULE WORKFLOW

Eventually:

```bash
praxis capsule init mediation-expert
cd mediation-expert

praxis capsule ingest ./sources/
praxis capsule interview
praxis capsule validate
praxis capsule graph
praxis capsule eval
praxis capsule pack
praxis capsule publish
```

A Capsule becomes a first-class artifact developers and analysts can work with.

---

# 56. WHERE STANDARD AI FALLS SHORT

These are not hypothetical edge cases.

They are where TACITUS should demonstrate value.

---

## Diplomacy

Generic AI may collapse:

```text
consider
welcome
support
endorse
accept
commit
```

or:

```text
urge
call upon
request
demand
decide
```

Expert Capsule encodes:

```text
speech act
institutional authority
binding effect
audience
hedging
commitment strength
historical usage
```

---

## Armed conflict

Generic AI may merge:

```text
umbrella movement
military wing
political wing
local faction
splinter
affiliate
former fighter
new integrated force
```

Expert Capsule encodes identity through time.

---

## UN / multilateral institutions

Generic AI may confuse:

```text
Secretariat assessment
Member State position
Security Council decision
Council president statement
Secretary-General recommendation
mandate language
informal negotiating text
```

Capsule makes institutional authority explicit.

---

## Sanctions

Generic AI may treat:

```text
listed entity
alias
subsidiary
controlled entity
former name
associated individual
```

as simple name matching.

Capsule represents:

```text
authority
jurisdiction
designation date
alias status
ownership/control
validity
delisting
```

---

## Intelligence analysis

Generic AI may collapse:

```text
source reliability
information credibility
corroboration
independent corroboration
same-source repetition
analyst assessment
```

Capsule forces those distinctions.

---

## Humanitarian analysis

Generic AI may merge:

```text
reported denial
administrative delay
physical access constraint
insecurity
logistical inability
deliberate obstruction
```

Capsule keeps causal categories separate.

---

## Public finance

Generic AI frequently blurs:

```text
authorized
appropriated
allocated
obligated
disbursed
expended
implemented
```

Expert Capsule makes them explicit distinctions.

---

## Law

Generic AI can blur:

```text
holding
dicta
procedural posture
standard of review
binding authority
persuasive authority
jurisdiction
effective date
```

Legal Expertise Capsule structures them.

---

## Investment analysis

Generic AI may confuse:

```text
management guidance
booked revenue
contracted revenue
adjusted EBITDA
cash flow
one-off adjustment
covenant definition
```

Expert Capsule carries company- and methodology-specific distinctions.

---

## Medicine

Generic AI has broad textbook knowledge but an experienced specialist often notices:

```text
pattern combinations
exception cases
contraindications
red flags
threshold interactions
when the guideline is inappropriate
```

A clinical Capsule could structure such expert practice with appropriate governance and safety constraints.

---

## Cyber incident response

Generic AI may treat an indicator as proof of attribution.

Expert Capsule distinguishes:

```text
indicator
artifact
TTP
cluster
campaign
attribution hypothesis
confidence basis
false-positive pattern
```

---

## M&A / organizational diligence

Generic AI may summarize stated corporate structure while missing:

```text
actual decision rights
informal veto players
founder influence
approval culture
integration failure patterns
```

Tacit Expertise Capsule can encode those patterns.

---

# 57. SYMBOLIC REASONING: WHERE IT HELPS

Do not claim symbolic systems “solve reasoning.”

Use them where determinism is valuable.

Excellent uses:

```text
identity
aliases
time validity
constraints
required relationships
incompatible states
source lineage
terminology
workflow conditions
exceptions
review status
rights
dependencies
```

Example:

```text
IF
Claim = "Actor formally accepted agreement"

THEN REQUIRE
SpeechAct = acceptance OR commitment
AND
Speaker authority >= required authority
AND
EvidenceSpan exists

OTHERWISE
validation issue
```

The LLM can still propose interpretation.

The symbolic layer prevents unsupported promotion.

---

# 58. NEURO-SYMBOLIC TACITUS RULE

Architecture principle:

```text
LLM
  proposes
  extracts
  summarizes
  generates hypotheses
  discovers analogies
  conducts interviews
       │
       ▼
SYMBOLIC LAYER
  types
  validates
  links
  checks
  constrains
  tracks provenance
       │
       ▼
HUMAN EXPERT
  confirms
  rejects
  qualifies
  adds exception
  promotes
```

Never reverse that order.

---

# 59. CONTEXT COMPILER

Once Cognitive Capsules exist, the Context Compiler becomes very powerful.

Its job is not:

```text
concatenate Capsule into prompt
```

Its job is:

```text
TASK
  ↓
Determine cognition needed
  ↓
Select relevant Capsule layers
  ↓
Retrieve evidence
  ↓
Retrieve counterevidence
  ↓
Retrieve applicable heuristics
  ↓
Retrieve terminology / language rules
  ↓
Retrieve analogous cases
  ↓
Retrieve procedures
  ↓
Apply constraints
  ↓
Identify missing information
  ↓
Generate worker-specific view
```

---

# 60. ATTENTION POLICY

Experts do not recall everything they know on every decision.

Capsules should include attention rules.

Example:

```text
Task:
draft Security Council briefing

Prioritize:
current facts
member positions
mandate language
recent changes
attribution
known sensitivities

Deprioritize:
old historical background
unless causal explanation required
```

This becomes part of the Expertise Capsule.

---

# 61. CONTEXT VIEW

Define:

```ts
interface CognitiveContextView {
  objective: string;

  facts: Statement[];
  claims: Statement[];
  counterEvidence: EvidenceSpan[];

  cues: Cue[];
  patterns: Pattern[];
  distinctions: Distinction[];
  heuristics: Heuristic[];
  exceptions: ExceptionRule[];

  languageRules: LanguageRule[];
  cases: CaseAnalogy[];

  procedures: Procedure[];

  constraints: Constraint[];

  openQuestions: DiagnosticQuestion[];

  omissions: ContextOmission[];

  receipt: ContextCompilationReceipt;
}
```

This is what agents consume.

---

# 62. RUN CONTEXT LOCK

Retain the useful part of the earlier architecture.

Once the compiler builds a Context View, freeze its dependencies.

```text
RunContextLock
```

records exact:

```text
Capsule versions
Capsule digests
source versions
evidence spans
compiler version
method versions
tool versions
model route
```

This is necessary for reproducibility.

But it is not the Capsule's identity.

---

# 63. LIVING CAPSULES

Expert knowledge evolves.

Do not mutate published history.

```text
v12 ACTIVE

new evidence
    ↓
proposal

v13 CANDIDATE
    ↓
diff
    ↓
review

v13 ACTIVE
```

PRAXIS can show:

```text
Knowledge changed

Actor X:
"aligned with coalition Y"
→
"formally integrated into coalition Y"

Reason:
official announcement + command reorganization

Affected outputs:
4
```

---

# 64. CAPSULE REVIEW MODEL

Every proposed change has:

```text
proposal
type
reason
evidence
author / model
affected objects
confidence kind
reviewer
decision
review note
```

Actions:

```text
Accept
Accept with edit
Reject
Need evidence
Mark exception
Merge duplicate
Supersede existing
```

---

# 65. REVIEW SHOULD TEACH THE CAPSULE

When reviewer chooses:

```text
Reject
```

ask optionally:

```text
Why?
```

If rationale contains reusable expertise, propose:

```text
new heuristic
new distinction
new exception
new failure mode
```

This creates a continuous expert-learning loop.

---

# 66. EVALUATION

Do not evaluate only factual QA.

We need an Expert Cognition Benchmark.

Dimensions:

```text
Entity identity
Terminology fidelity
Temporal correctness
Source role
Claim/evidence fidelity
Counterevidence recall
Tacit cue application
Exception handling
Method adherence
Analogy quality
Language/pragmatic accuracy
Uncertainty handling
Decision usefulness
```

---

# 67. CAPSULE ABLATION TESTING

For a representative task, test:

```text
Generic model
+ documents
+ graph
+ expert distinctions
+ tacit heuristics
+ language layer
+ cases
+ full Capsule
```

This tells us which Capsule layers actually add value.

This is extremely important scientifically and commercially.

---

# 68. EXPERT BLIND-SPOT TEST

Design tasks where the correct outcome depends on something a competent generalist often misses.

Examples:

```text
splinter group identity changed
diplomatic phrase is not a commitment
source repetition is not independent corroboration
funding authorization is not expenditure
legal case is non-binding due to jurisdiction
precedent appears analogous but procedural posture differs
```

If the Capsule cannot improve these tasks, it is not capturing useful expertise.

---

# 69. GOLDEN CASES

Every serious Expertise Capsule should include a small test suite:

```text
typical case
difficult case
exception case
adversarial case
out-of-scope case
```

Expected results do not need exact prose.

They can specify:

```text
must identify X
must not infer Y
must ask Z
must cite Q
```

---

# 70. DOCUMENT INGESTION

Keep improving the existing source stack.

Add a parser-independent:

```text
DocumentIR
```

with:

```text
Document
Page
Block
Heading
Paragraph
Table
Cell
Image
Footnote
Span
Geometry
```

Use current Google Document AI path.

Benchmark Docling as an additional parser.

Do not make either parser's native schema canonical.

---

# 71. GRAPH TECHNOLOGY

Do not add another graph database because it is fashionable.

Canonical semantic content must survive without any particular graph engine.

Use:

```text
typed records + graph.jsonld
```

as portable semantic truth.

Generate:

```text
embedded graph projection
Postgres projection
vector projection
full-text projection
```

as needed.

DIALECTICA should own graph compilation.

---

# 72. RDF / JSON-LD

Align the semantic model with RDF 1.2 concepts where useful.

Particularly valuable:

```text
statements about statements
relation annotations
language tags
named graphs
```

Do not block implementation waiting for standards finalization.

Internally use clear typed schemas.

Export JSON-LD.

---

# 73. SHACL

Use SHACL conceptually and for export validation.

Examples:

```text
CommitmentShape
SpeechActShape
HeuristicShape
EvidenceBoundClaimShape
ActorIdentityShape
```

Internal validators may be Rust / TypeScript.

Aim for semantic compatibility.

---

# 74. WEB ANNOTATION

Source anchors should support:

```text
TextQuoteSelector
TextPositionSelector
```

conceptually.

Also retain PDF geometry.

This makes evidence resilient and portable.

---

# 75. CAPSULE PACKAGE INTEROPERABILITY

Provide optional export profiles.

Potential:

```text
TACITUS native .capsule
JSON-LD
RO-Crate profile
```

RO-Crate is attractive for packaging files and metadata.

Do not replace the native Capsule contract with RO-Crate.

---

# 76. REGISTRY STORAGE

Later prototype storing immutable Capsule artifacts using OCI/ORAS-compatible artifact distribution.

This could give:

```text
content-addressed artifacts
versions/tags
registries
related attestations
standard distribution tooling
```

Given TACITUS already uses GCP, Google Artifact Registry may eventually be a practical backend.

Do not make this an immediate P0 dependency.

---

# 77. PRAXIS CURRENT CODE: EVOLVE, DO NOT RESTART

Important current assets to preserve:

```text
src/lib/context/capsule-v3.ts
src/types/context-capsule.ts
src/lib/context/capsule-service.ts
src/lib/capsules/storage.ts
src/lib/capsules/resolve.ts
src/lib/context/agent-context-packet.ts
src/lib/context/context-injection.ts
src/lib/agent-runtime/*
src/types/source-receipt.ts
src/types/spatial-source.ts
```

Do not throw them away.

---

# 78. NEW COGNITIVE SCHEMA

Create:

```text
src/lib/cognitive-capsule/
```

Suggested:

```text
types.ts
schema.ts
nodes.ts
statements.ts
epistemics.ts
expertise.ts
language.ts
procedures.ts
cases.ts
constraints.ts
provenance.ts
compiler.ts
validation.ts
migration.ts
```

Longer term move language-neutral schemas under:

```text
schemas/capsule/
```

---

# 79. SCHEMA VERSION

Do not casually overload the existing V3 model.

Current repo has:

```text
ContextCapsule v2
ContextCapsuleV3 normalized/enriched layer
DIALECTICA spec-3.x imports
```

Avoid naming confusion.

Call the design temporarily:

```text
Cognitive Capsule vNext
```

If a canonical version bump is approved, likely use:

```text
capsule/v4
```

rather than inventing a second “v3.”

---

# 80. V4 TACIT KNOWLEDGE TYPES

Replace only-string representation with typed objects.

Example:

```ts
interface ExpertiseLayer {
  cues: ExpertCue[];
  patterns: ExpertPattern[];
  heuristics: ExpertHeuristic[];
  distinctions: ExpertDistinction[];
  exceptions: ExpertException[];
  redFlags: ExpertRedFlag[];
  failureModes: ExpertFailureMode[];
  diagnosticQuestions: ExpertQuestion[];
}
```

Keep old string arrays as derived summaries/backward compatibility.

---

# 81. EXPERT CUE TYPE

```ts
interface ExpertCue {
  id: string;

  label: string;
  description: string;

  domainScope: string[];

  suggests: StatementRef[];

  significance:
    | 'weak'
    | 'moderate'
    | 'strong'
    | 'context_dependent';

  onlyWhen?: Condition[];

  falsePositiveConditions: Condition[];

  followUpChecks: string[];

  doNotInfer: string[];

  examples: CaseRef[];

  provenance: KnowledgeProvenance;

  reviewState: ReviewState;
}
```

---

# 82. HEURISTIC TYPE

```ts
interface ExpertHeuristic {
  id: string;

  name: string;

  when: Condition[];

  attendTo: StatementRef[];

  interpretation: string;

  action?: string;

  exceptions: Condition[];

  failureModes: string[];

  nextChecks: string[];

  rationale: string;

  cases: CaseRef[];

  provenance: KnowledgeProvenance;

  reviewState: ReviewState;
}
```

---

# 83. DISTINCTION TYPE

```ts
interface ExpertDistinction {
  id: string;

  conceptA: string;
  conceptB: string;

  explanation: string;

  whyItMatters: string;

  decisionTests: string[];

  commonMistake: string;

  examples: Example[];

  counterexamples: Example[];

  sourceRefs: EvidenceSpanRef[];

  expertRefs: ExpertRef[];
}
```

---

# 84. LANGUAGE RULE TYPE

```ts
interface LanguageRule {
  id: string;

  expression: string;

  language: string;

  meaning: string;

  domain: string;

  speechAct?: string;

  audience?: string[];

  preferredAlternatives?: string[];
  avoidAlternatives?: string[];

  implications: string[];
  nonImplications: string[];

  examples: EvidenceSpanRef[];

  validFrom?: string;
  validUntil?: string;

  provenance: KnowledgeProvenance;
}
```

---

# 85. CASE TYPE

```ts
interface ExpertCase {
  id: string;

  title: string;

  situation: string;

  cues: string[];
  interpretation: string;
  decision: string;
  outcome?: string;

  lessons: string[];

  analogyDimensions: string[];
  nonTransferableDimensions: string[];

  sourceRefs: EvidenceSpanRef[];

  reviewedBy: ExpertRef[];
}
```

---

# 86. CAPSULE STUDIO IMPLEMENTATION

Do not add another top-level app.

Within existing Capsules surface, add:

```text
Open Capsule
    ↓
Capsule Studio
```

Components:

```text
CapsuleStudioShell
CapsuleOverview
CognitiveGraphPanel
ExpertisePanel
LanguagePanel
MethodsPanel
CasesPanel
EvidencePanel
CapsuleReviewInbox
CapsuleChatPanel
CapsuleEvalPanel
CapsuleHistoryPanel
```

Build incrementally.

---

# 87. CAPSULE CHAT AGENT ROLES

The current:

```text
tacit-knowledge-interviewer
capsule-editor-agent
source-spine-agent
claim-ledger-agent
...
```

are good foundations.

Expand:

```text
expertise-elicitor
case-interviewer
language-curator
distinction-finder
exception-finder
analogy-reviewer
ontology-curator
capsule-tester
```

These agents only create proposals.

---

# 88. CHAT → STRUCTURED PROPOSAL

Never let Capsule Chat directly rewrite canonical context.

Conversation:

```text
Expert:
"When they say 'review' here it does not mean the program will end."
```

Agent:

```text
Proposed Language Rule

Expression:
review

Context:
EU program authorization

Meaning:
formal reassessment milestone

Does not imply:
automatic termination

Save?
```

Human accepts.

Then canonical state changes.

---

# 89. GRAPH PROPOSAL UX

Every AI graph proposal should show:

```text
BEFORE
AFTER
WHY
SOURCE
IMPACT
```

Example:

```text
ADD EDGE

Faction A
  SPLINTERED_FROM
Movement B

why:
three sources refer to 2024 organizational split

evidence:
[three passages]

impact:
7 historical events currently attributed to Movement B may require review
```

---

# 90. CAPSULE DIFF

Build semantic diffs.

Not just JSON diff.

Example:

```text
Added:
  2 actor aliases
  1 heuristic
  1 language rule

Changed:
  Actor X membership relation
  valid_to added

Superseded:
  Claim C4

Removed:
  none

Affected workflows:
  research memo
  actor mapping
```

---

# 91. CAPSULE DEPENDENCY IMPACT

When updating:

```text
Language Capsule
```

show:

```text
used by:
27 Capsules
4 workflows
13 active agents
```

When changing a breaking rule, require major version.

---

# 92. CLI FIRST IMPLEMENTATION WAVE

Add a minimum CLI early because it forces clean API boundaries.

First commands:

```text
capsule list
capsule inspect
capsule validate
capsule diff
capsule pack
ask
run
receipt
```

If these cannot work outside React components, architecture is too coupled.

---

# 93. AGENT RUNTIME: DO NOT ADD A NEW FRAMEWORK

Current:

```text
Cloud SQL
Cloud Tasks
Cloud Run
Genkit/ADK bridges
PRAXIS AgentRun
```

is enough.

Focus on:

```text
worker specialization
context compilation
shared blackboard
receipts
fault tolerance
```

not more frameworks.

---

# 94. AGENT WORKING STATE TYPES

Create:

```text
src/lib/agent-runtime/blackboard/
```

Types:

```text
WorkingClaim
WorkingQuestion
WorkingHypothesis
WorkingEvidence
WorkingEntityResolution
WorkingTimelineEvent
WorkingAnalysis
WorkingDraftBlock
WorkingReviewIssue
CapsuleChangeProposal
```

Persistence can use existing run ledger / Postgres.

---

# 95. WORKER COMMUNICATION

Workers should communicate by:

```text
blackboard objects
events
artifact refs
```

not huge copied chat histories.

A worker event could say:

```text
entity_resolution.created
object_id=er_91
```

Next worker loads `er_91`.

---

# 96. AGENT TOOL PERMISSIONS

Capsule may constrain tools.

Example Expertise Capsule:

```text
allowed:
source search
graph query
timeline
claim checking

requires approval:
external send
canonical capsule promotion

forbidden:
automatic publication
```

Preserve current approval architecture.

---

# 97. CONTEXT PORTABILITY

A Capsule should work with:

```text
PRAXIS
CLI
MCP client
external agent
local model
future TACITUS desktop
```

Hence:

```text
Capsule Core
    ↓
Context Compiler
    ↓
Target adapters
```

Target adapters:

```text
Gemini
Claude
GPT
MCP
A2A
Markdown
JSON
```

No model-specific semantics in the Capsule core.

---

# 98. COMPANY STRATEGY

This architecture creates a much larger company opportunity than policy-chat software.

The product stack becomes:

```text
TACITUS Capsule Format
        ↓
DIALECTICA Builder / Compiler
        ↓
Capsule Registry
        ↓
PRAXIS Knowledge Workbench
        ↓
Specialist Workflows
        ↓
Expert Capsule Marketplace
```

Potential enterprise use cases:

```text
policy
diplomacy
mediation
law
compliance
intelligence
investment
medicine
engineering
operations
corporate strategy
```

The common problem:

> General-purpose AI knows a great deal, but organizations still possess local distinctions, methods, experience and judgment that are not reliably represented in the model.

TACITUS packages that missing layer.

---

# 99. MOAT

The moat is not:

```text
LLM access
RAG
vector database
knowledge graph
```

Those are commodities.

Potential moat:

```text
Capsule semantic specification

expertise-elicitation workflows

expertise graph

language/pragmatics representation

review and promotion system

portable expert-context artifacts

Capsule Registry

evaluation data

installed Capsule ecosystem

workflow + Capsule compatibility

institutional knowledge continuity
```

---

# 100. IMPLEMENTATION MASTER PLAN

Execute in this order.

---

## WAVE 0 — ARCHITECTURE CONVERGENCE

Goal:

agree on the Cognitive Capsule model without breaking production.

Tasks:

1. Create:
   `docs/architecture/COGNITIVE_CAPSULE_ARCHITECTURE.md`

2. Inventory mappings:

```text
current V2
current V3
DIALECTICA
target Cognitive Capsule
```

3. Inventory all graph models.

4. Inventory all tacit-knowledge fields.

5. Inventory all source/evidence types.

6. Inventory all agent context packets.

7. Do not migrate data yet.

Done when:

every current concept has a target location.

---

## WAVE 1 — COGNITIVE SCHEMA

Implement typed:

```text
Statement
Cue
Pattern
Heuristic
Distinction
Exception
RedFlag
DiagnosticQuestion
LanguageRule
Procedure
Case
Unknown
RevisionTrigger
```

Add Zod tests.

Add JSON Schema generation.

Do not change UI yet.

---

## WAVE 2 — V3 → COGNITIVE ADAPTER

Current V3 string arrays become backward-compatible inputs.

Example:

```text
practicalHeuristics[]
```

can produce proposed:

```text
ExpertHeuristic[]
```

Do not pretend automatic conversions have expert-level structure.

Mark:

```text
migration_status = needs_review
```

---

## WAVE 3 — COGNITIVE GRAPH

Build canonical graph representation.

Support:

```text
typed nodes
typed statements
statement annotations
conditions
exceptions
provenance
temporality
review state
```

Export:

```text
graph.jsonld
```

Generate embedded projection.

---

## WAVE 4 — CAPSULE STUDIO MVP

Within Capsules:

```text
Overview
Knowledge
Graph
Expertise
Sources
Review
Chat
```

Ship first.

Language, Methods and Cases can follow.

---

## WAVE 5 — EXPERT INTERVIEWER

Upgrade current tacit-knowledge interviewer.

Implement:

```text
CTA interview
Critical decision interview
Distinction elicitation
Exception elicitation
Language elicitation
Case elicitation
```

Every output is a proposal.

---

## WAVE 6 — TEACH-BY-CORRECTION

When user edits/rejects meaningful AI output:

offer:

```text
Save lesson to Capsule
```

Generate proposal.

This is a high-value product capability.

---

## WAVE 7 — EVIDENCE UNIFICATION

Create canonical:

```text
EvidenceSpan
```

Unify:

```text
source receipts
spatial citations
DIALECTICA spans
document chunks
original passages
```

---

## WAVE 8 — CONTEXT COMPILER

Compile:

```text
facts
evidence
counterevidence
expertise
language
methods
cases
constraints
gaps
```

worker-specific.

Retain exact dependency receipt.

---

## WAVE 9 — RUN CONTEXT LOCK

Freeze exact context used per run.

Implement after richer context exists.

This is where the earlier plan belongs.

---

## WAVE 10 — SHARED AGENT BLACKBOARD

Add typed run-scoped collaboration objects.

Migrate selected multi-worker workflows from prose handoff to object handoff.

---

## WAVE 11 — SPECIALIST WORKERS

Prioritize:

```text
Researcher
Source Verifier
Entity Resolver
Domain Specialist
Language Analyst
Red Team
Writer
```

Avoid worker proliferation.

---

## WAVE 12 — CLI MVP

Ship:

```text
list
inspect
validate
diff
pack
ask
run
receipt
```

Use production APIs.

---

## WAVE 13 — PORTABLE PACKAGE

DIALECTICA compiles the full `.capsule`.

Implement:

```text
manifest
graph
expertise
language
methods
cases
evidence
governance
evals
```

---

## WAVE 14 — CAPSULE REGISTRY

Support:

```text
push
pull
install
fork
version
dependency resolution
deprecate
```

Start private/internal.

---

## WAVE 15 — EVALUATION

Build Cognitive Capsule Benchmark.

Demonstrate:

```text
generic AI
vs
documents
vs
RAG
vs
graph
vs
Cognitive Capsule
```

---

## WAVE 16 — MARKETPLACE

Only after:

```text
portable artifacts work
versioning works
install works
quality signals work
rights work
eval works
```

Then add commerce.

---

# 101. FIRST CODEX EXECUTION PACK

CODEX SHOULD BEGIN HERE.

## TASK 1

Read:

```text
README.md
CLAUDE.md
AGENTS.md
ARCHITECTURE.md
docs/architecture/PRAXIS_ARCHITECTURE.md
docs/architecture/DIALECTICA_PRAXIS_CONTEXT_CONTRACT.md
src/lib/context/capsule-v3.ts
src/types/context-capsule.ts
src/lib/context/capsule-service.ts
src/lib/capsules/storage.ts
src/lib/capsules/resolve.ts
src/lib/context/agent-context-packet.ts
src/types/source-receipt.ts
src/types/spatial-source.ts
```

Then inventory.

Do not code before inventory.

---

## TASK 2

Create:

```text
docs/architecture/COGNITIVE_CAPSULE_ARCHITECTURE.md
```

based on this specification.

Add mapping table:

```text
CURRENT OBJECT
PURPOSE
KEEP / MODIFY / DEPRECATE
TARGET OBJECT
MIGRATION
```

---

## TASK 3

Create types only:

```text
src/lib/cognitive-capsule/types.ts
```

with:

```text
CognitiveStatement
ExpertCue
ExpertPattern
ExpertHeuristic
ExpertDistinction
ExpertException
ExpertRedFlag
DiagnosticQuestion
LanguageRule
ExpertCase
Procedure
KnowledgeProvenance
ReviewState
```

No production route changes.

---

## TASK 4

Create validation schemas and tests.

```text
src/lib/cognitive-capsule/schema.ts
tests/unit/lib/cognitive-capsule/*
```

Test:

```text
conditions
exceptions
time
provenance
review
invalid statement
missing evidence
```

---

## TASK 5

Create:

```text
src/lib/cognitive-capsule/from-v3.ts
```

Adapter only.

Old `humanTacitKnowledge` arrays remain supported.

Converted rich objects must be marked:

```text
proposal / needs_review
```

unless already backed by structured human-reviewed data.

---

## TASK 6

Create a minimal `CognitiveGraph`.

Do not select a new database.

Use in-memory typed objects first.

Functions:

```text
addNode
addStatement
getNode
getStatements
findSupportingEvidence
findContradictions
findApplicableHeuristics
findLanguageRules
findCases
validate
```

---

## TASK 7

Add JSON-LD projection.

```text
toJsonLd()
fromJsonLd()
```

Test round-trip semantic preservation.

---

## TASK 8

Prototype Capsule Studio Expertise panel.

Inside existing Capsule surface.

Display:

```text
Cues
Patterns
Heuristics
Distinctions
Exceptions
Questions
```

Read-only first.

---

## TASK 9

Wire current `tacit-knowledge-interviewer` to create typed proposal objects.

No direct canonical mutation.

---

## TASK 10

Add proposal review.

User can:

```text
accept
edit + accept
reject
need evidence
```

Accepted object enters draft Capsule state.

---

# 102. ACCEPTANCE SCENARIO ONE — DIPLOMACY

Create synthetic fixture.

Expert says:

```text
"Prepared to consider" is not acceptance.
```

System stores typed LanguageRule.

Ask PRAXIS:

> Has State A accepted the proposal?

Without Capsule baseline may say yes.

With Capsule:

must say no / not established.

Test passes only if the distinction affects the answer.

---

# 103. ACCEPTANCE SCENARIO TWO — ARMED GROUPS

Fixture:

```text
Movement A
Faction A-North
Faction A-East
Umbrella A
```

with temporal splinter/integration relationships.

Ask different dates.

System must resolve correct identities.

---

# 104. ACCEPTANCE SCENARIO THREE — PUBLIC FINANCE

Expert Distinction:

```text
authorization
allocation
obligation
disbursement
expenditure
```

Ask:

> Was the funding spent?

Evidence only says authorized.

System must return:

```text
not established
```

---

# 105. ACCEPTANCE SCENARIO FOUR — EXPERT HEURISTIC

Heuristic:

```text
Public rejection + continuing technical contact may indicate audience
management rather than termination.

Exception:
formal withdrawal notice.
```

Case includes:

```text
public rejection
continued contacts
formal withdrawal
```

System must recognize exception and not apply heuristic.

---

# 106. ACCEPTANCE SCENARIO FIVE — TEACH-BY-CORRECTION

PRAXIS drafts wrong statement.

Expert corrects it and explains why.

System proposes a Distinction.

Expert accepts.

Later task triggers that Distinction.

This demonstrates the knowledge flywheel.

---

# 107. WHAT NOT TO DO

Do not:

```text
build another vector DB
add another graph DB
rewrite the app
add 20 new agents
store tacit knowledge only as prose
store reasoning only as prompt text
let AI approve its own proposals
call embeddings knowledge
make GraphLite/Ladybug/etc. canonical semantics
make chat history canonical context
build marketplace before registry
build commerce before package/version trust
expose hidden chain-of-thought
claim a Capsule is a human brain
claim "verified" means factually true
reduce all expertise to one score
```

---

# 108. DEFINITION OF SUCCESS

The Capsule is successful when an expert can say:

> “Yes. This actually captures the things I repeatedly have to teach junior people.”

And an analyst can ask:

> “Why did PRAXIS make that distinction?”

and receive:

```text
Because the attached Diplomatic Practice Capsule contains Distinction D17:

"Prepared to consider" is an exploratory/conditional speech act, not an
acceptance.

D17 was authored by Expert E1, reviewed on 12 September, and illustrated
by Cases C4 and C9.

The source statement in this case uses that formulation.

No later binding acceptance was found.
```

Or:

> “Why did PRAXIS not merge these armed groups?”

and receive:

```text
Because the Actor Identity Capsule represents Group X-North as a faction
that split from Group X in March 2025.

The relation is time-bounded and supported by Sources S18 and S21.

The source you supplied refers specifically to X-North.
```

Or:

> “Why is the recommendation different from ChatGPT's?”

and receive:

```text
Because three attached expert rules changed the analysis:

1. An institutional authority distinction prevented treating the announcement
   as an implemented decision.

2. A practice heuristic caused PRAXIS to treat continuing technical contact
   as relevant despite public rejection.

3. A case analogy was rejected because the earlier precedent used a different
   enforcement mechanism.

Two unresolved evidence gaps remain.
```

That is TACITUS.

---

# 109. FINAL PRODUCT VISION

PRAXIS becomes a workplace where professionals can:

```text
ASK
RESEARCH
THINK
WRITE
REVIEW
DELIBERATE
BUILD KNOWLEDGE
REUSE KNOWLEDGE
TEACH THE SYSTEM
HAND WORK TO OTHERS
```

while their expertise accumulates in portable Capsules instead of disappearing into:

```text
chat histories
personal notebooks
departing employees
prompt files
scattered documents
```

DIALECTICA turns raw material and expert input into structured cognitive context.

The Capsule Library gives that context persistence, distribution and eventually economic value.

PRAXIS applies it to real work.

Agents operationalize it.

The CLI makes it portable and developer-friendly.

The registry turns it into an ecosystem.

The marketplace eventually lets experts distribute structured practice.

The long-term TACITUS proposition is therefore:

> **Build the missing context layer between general intelligence and expert work.**

Not just what the expert knows.

Also:

> what the expert notices, distinguishes, questions, expects, distrusts, calls things, does next, and knows not to infer.