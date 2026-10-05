# Implementable analysis method

This is the proposed SIGNAL method. Implement it through the existing PRAXIS provider, evidence and review services. Source references support particular components; the complete workflow is a design to test.

## Retrieval and duplicate handling

Maintain original text, headings, language and section/slice maps as versioned representations. Normalize a separate retrieval form; do not alter the canonical quote representation. Exact content hashes identify identical representations. Near-duplicate fingerprints and embeddings generate reuse candidates. Syndication or a shared quotation can explain similar language without establishing common control.

Retrieve within tenant, desk relevance, permissions and window before ranking. Combine a lexical route for names, dates and exact phrases with a multilingual semantic route. Semantic search documentation distinguishes query-to-passage retrieval from similarity between comparable texts. Configure the task accordingly, and evaluate the union/reranked candidates on actual desk questions. [R16]

For an initial corpus, reuse available full-text/vector services and bounded top-k results. A separate reranker is optional. Record why an item matched, its index namespace, source revision and any scope uncertainty. Retrieval rank is not evidential weight or truth probability. Never compare vectors across model/chunking namespaces, even when dimensions match.

## Attributed propositions

Extract what a source reports: actor, action/proposition, polarity, modality, conditions, time, place and exact evidence. The pipeline retains speaker uncertainty, allegations, denials and future/conditional acts. The same actor welcoming, adopting and implementing a proposal expresses different propositions. Structured parsing and exact span/hash verification precede saving a proposal.

Cross-source comparison first checks whether actor, proposition, scope and modality are comparable. A generic NLI or embedding match may nominate a relation, but it cannot prove that two statements conflict in the same sense. Record incompatible times, disputed identities and different conditions before suggesting contradiction. Keep model labels proposed and inspectable.

## Frames and persuasion

A topic says what is discussed. A frame says how the source interprets it: for example, an invented negotiation can be framed as institutional progress or an inadequate procedural gesture. Those are analytical illustrations, not claims about a current process. A narrative dossier groups attributed propositions around a reviewed frame and question.

Genre, frame and rhetorical-technique evaluation should be separate from factual support. SemEval's shared-task structure is a useful reference for that separation. WANLP offers an Arabic technique-detection reference, with its own domain and annotation design. These benchmarks do not validate the full SIGNAL product or its campaign attribution. [R01,R13]

Technique tags need an exact span, a description of the observed wording, an alternative reading and reviewer status. The interface may show language such as an appeal or demeaning label where a reviewer finds it supported. It should not turn that label into proof of falsity, intent or a foreign operation.

## Stable narrative continuity

Use a canonical narrative ID and versioned membership assertions. Each version stores its question/frame, admitted claims, source families, window, alternatives and review history. Newly retrieved claims are candidate additions. Changes to interpretation create assessment revisions, not only new cluster labels.

At a scheduled checkpoint, rank new claim/representation candidates against active dossiers. Propose addition, new dossier, merge or split with supporting examples. A reviewer decides changes that affect a published assessment. Preserve predecessor/successor links and the earlier artifact's membership manifest. BERTopic may assist exploratory topic discovery, but incremental topic IDs cannot replace this ledger. [R04,R05]

## Observable circulation

Show capture/first-observed time in the monitored panel, explicit citations, quoted text, canonical publisher attribution and reviewed reuse groups. Sort by the time actually available and distinguish publication from discovery. An earlier captured item is not necessarily the original author. A public hyperlink proves a link, not successful persuasion.

Graph predicates should describe those observations: quotes, links_to, cites, shared_text_candidate, frames_as, supports_reading and depends_on. Influence/coordination/ownership edges require separate evidence and qualified review. With missing platform reach, use a monitored-source count, never an invented audience size.

## Attention changes

Count defined source families within a fixed window, panel revision, topic/narrative membership revision and comparable inclusion policy. Display the matched-family numerator and eligible-family denominator. Health and panel changes must qualify or suppress the comparison. Count raw publications separately from deduplicated families.

Use a modest alert candidate such as an attention-rate increase only after minimum observed volume, sufficient baseline windows and valid collection health. This is a proposed screen to benchmark, not statistical evidence of an influence campaign. Robust baselines and seasonal matching may follow when enough measured history exists. Do not use one universal threshold across countries and languages without evaluation.

## Dependency and assessment changes

An artifact manifest pins evidence, context, model/prompt/compiler and review inputs. Deterministically compare old/new input digests to identify changed, missing, withdrawn and added records. Traverse typed dependencies to find affected judgments. The model then drafts a qualified explanation; it does not decide that an input change proves a new geopolitical conclusion.

The new reference module implements guards for locators, vector namespaces, comparable attention windows and manifest changes. These guards are useful building blocks; they do not generate real embeddings, discover frames or deliver live country analysis.
