# Synthetic acceptance seeds

`synthetic-cases.json` contains invented training examples, not current events or an analyst-labeled geopolitical gold set. Preserve the synthetic marker in UI, graph and exported artifacts. The country labels test generality and language handling; they do not make claims about actual institutions.

Each case includes original text, exact evidence quote, hash/offsets, an intended reading and forbidden inference. Validators can check hashes and slices deterministically. Model semantic fidelity still requires human labeling; do not score a model by naive string equality to the example reading.

These six seeds cover proposal versus adoption, source revision, Arabic negation, attributed allegation, country ambiguity and conditional action. Build a separate permissioned and held-out evaluation set for release. Do not replace the 200-record evaluation target with these six examples or copy them into real customer desks.
