# Multilingual processing and evaluation protocol

## Preserve originals

Store source language/script, original representation, normalized retrieval text and any translation as distinct linked objects. An analyst must be able to inspect the original wording that supports a translated claim. Record language uncertainty, dialect, transliteration and mixed-script content rather than forcing every item into one assumed national language.

Use offset maps whenever normalization, OCR or translation changes text. Exact locators bind the original representation and hash; repeated quotes need a selected occurrence. JavaScript UTF-16 code-unit offsets, Unicode code points and bytes are different coordinate systems. W3C selectors provide a reference for the original/derived locator design. [R17]

Arabic and Hebrew evidence views need explicit direction/isolation, sensible mixed-script rendering, copied text fidelity and original-language review. W3C internationalization guidance describes HTML mechanisms for isolating bidirectional text. Add actual browser tests for names, dates, URLs and quotations in mixed RTL/LTR evidence cards. [R18]

## Candidate retrieval providers

Measure the currently configured PRAXIS embedding provider first. Candidate namespaces should pin provider, exact model/version, dimension, task/prefix, tokenizer/chunking and normalization. Do not reuse an index across changes. E5 and Google's documented embedding options are candidates, not a promise that every language or local register works equally well. [R02,R03]

Long articles must be sectioned with overlapping locator-preserving chunks and budget bounds. Keep paragraphs around negation, speaker attribution and qualifications together when possible. Translate for analyst access or interpretation where permitted; preserve the original in retrieval/evidence. Do not assume a translated text is a new independent source.

## Benchmark relevance

| Reference | Component it can inform | What it cannot establish |
| --- | --- | --- |
| SemEval-2023 Task 3 | Genre, frame and persuasion evaluation in its news/language setup | Truth, deceptive intent or Arabic political competence |
| WANLP-2022 shared task | Arabic technique classification/span evaluation in its social-text setup | General conflict/diplomatic judgment or all Arabic varieties |
| MIRACL | Multilingual retrieval; the paper covers eighteen languages | Narrative fidelity, local-media completeness or inference accuracy |
| Local analyst labels | Actual desk questions, aliases, modality and evidence relations | Universal quality beyond the sampled mandate and panel |

References: [R01,R13,R14]. Benchmark/data terms must be checked before downloading or reusing examples. No external dataset is included in this kit.

## Build the actual gold set

The initial target remains 200 permissioned records across at least three countries and two languages. Use distinct source families and preserve date/scope/representation provenance. A held-out group should include later time periods or different source families to reduce duplicate leakage. Mark synthetic cases separately; they exercise validators and cannot establish live semantic accuracy.

Label retrieval relevance, attributed proposition, original evidence span, polarity/modality/conditions, actor ambiguity, frame if supported, cross-source relation and unknowns. Use two reviewers on a meaningful overlap where feasible, recording disagreements rather than manufacturing consensus. Document language competence and the decision rubric. Maintain an adjudicated version and unresolved-label set.

Compare keyword baseline, current raw-model pipeline and reviewed-context pipeline on the same inputs. Report retrieval Recall@k/MRR, evidence/proposition precision and recall, modality/attribution error counts, language breakdown and analyst correction time. Do not use a single aggregate to hide a weak language or an unsupported local source type.

## Release decision

Require exact locator validity and no accepted fabricated quotations. The proposed 95% span-precision target is not a claim that it has been achieved. Semantic fidelity and customer usefulness require human assessment and an actual pilot. If a language/tier fails, restrict or mark that capability and continue the proven text workflow elsewhere.

Do not use the inspected non-commercial NLLB checkpoint in the default paid product. Choose the licensed existing gateway or a separately cleared alternative; model permission and source/dataset rights are different gates. [R12]
