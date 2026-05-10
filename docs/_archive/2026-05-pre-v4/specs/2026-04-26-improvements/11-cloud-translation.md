# Spec #11 — Cloud Translation multilingual analyst calibration

## Problem
Today the analyst's `outputLanguage` is honoured in the system prompt
(model responds in French / Arabic / etc.), but uploaded source documents
stay in their original language and the corpus retriever never translates
them for the model. A French analyst with an Arabic OCHA report sees
none of its evidence in their tool prompts.

## Persona impact
- Francophone Africa, MENA, Latin America analysts.
- Researchers building multilingual dossiers.

## Files
- `src/lib/i18n/translate.ts` (NEW) — server-only Cloud Translation v3
  client with caching.
- `cloud_functions/on_document_uploaded/main.py` (EDIT) — detect
  language, store `documents/{id}.detectedLanguage`, optionally enqueue
  a translation pass.
- `cloud_functions/translate_document/main.py` (NEW) — Pub/Sub-driven
  function that translates and writes
  `documents/{id}/translations/{lang}` subdoc with translated text.
- `src/lib/firebase/documents-service.ts` (EDIT) — `retrieveRelevantChunks`
  takes an optional `targetLanguage` and prefers translated chunks
  when available.
- `tests/services/translate.test.ts` (NEW) — unit tests for cache
  hits, language detection, error fallback.

## Interface contract
```ts
export interface TranslateInput { text: string; sourceLang?: string; targetLang: string; }
export interface TranslateResult { text: string; sourceLang: string; cached: boolean; }
export async function translate(input: TranslateInput): Promise<TranslateResult>;
export async function detectLanguage(text: string): Promise<string>;
```

## Implementation order
1. Provision Cloud Translation API in `setup-gcp.sh` + grant the
   Cloud Function SA `roles/cloudtranslate.user`.
2. Author `src/lib/i18n/translate.ts` with in-memory LRU cache (size
   1000) + Firestore-backed cross-instance cache for high-value
   pairs.
3. On document upload, run language detection. If `detectedLanguage
   !== outputLanguage`, publish to a `praxis.translate` Pub/Sub topic.
4. `translate_document` function consumes the topic, calls Cloud
   Translation v3, writes the translated subdoc, retriggers chunk
   embedding for the translated copy.
5. Update RAG retrieval to prefer the translated chunks when the
   analyst's `outputLanguage` matches.

## Definition of done
- A French analyst uploads an Arabic OCHA report → within 30 seconds
  the document subdoc has a `translations/fr` entry; subsequent RAG
  retrievals return French chunks.
- Cache hit rate >40% on repeat uploads (test with 10 same-source
  uploads of the same document).

## Validation gate
- `tests/services/translate.test.ts` passes.
- Cost cap unit test: a 100k-character doc translation does not
  exceed N USD (parameterise N).

## Risks / open questions
- Cost: translation is per character. Cap document size or summarise
  first? Default: full translation up to 200k chars, summarise above.
- Quality: medical / legal text occasionally mistranslates. Keep the
  original alongside and let the UI offer "View original" / "View
  translated".
