# Local cognitive capsule packages and PRAXIS CLI

The CLI lives in `cli/praxis.ts`, outside the Next.js application bundle. It uses the shared cognitive schemas, graph, package reader and registry rather than an independent semantic model. Run it with `npm run praxis -- <command>` or `npx tsx cli/praxis.ts <command>`.

The native `.capsule` format is `tacitus-native-capsule/1`, carrying `cognitive-capsule/vNext`. It is separate from historical Capsule+ interoperability exports and does not replace persisted ContextCapsule v3 records. ZIP artifacts contain a mimetype, manifest, canonical JSON-LD graph, statement and evidence records, typed expertise/language/procedure/case files, governance metadata, runtime contract and structural evaluation posture. Empty knowledge layers remain valid. Original documents are excluded; exact evidence quotations already present in the capsule remain present and retain their source/version anchors.

## Local commands

```powershell
npm run praxis -- help
npm run praxis -- capsule inspect .\example.capsule
npm run praxis -- capsule validate .\example.capsule
npm run praxis -- capsule graph .\example.capsule
npm run praxis -- capsule diff .\before.capsule .\after.capsule
npm run praxis -- capsule eval .\example.capsule
npm run praxis -- capsule pack .\capsule.json --output .\example.capsule --allow-write
npm run praxis -- capsule unpack .\example.capsule --output .\new-directory --allow-write
npm run praxis -- capsule list --directory .\packages
```

Inspect, validate, graph, diff and eval also accept cognitive capsule JSON. Pack accepts JSON and writes an immutable artifact: existing files are never overwritten. Unpack requires a new directory and rejects existing destinations and symlink ancestors. Package input is validated completely before extraction.

Validation checks structure, semantic references and package integrity. It does not prove factual truth. `capsule eval` reports deterministic graph reference and JSON-LD roundtrip checks; it makes no claim of model evaluation or with/without-capsule ablation.

## Local policy task: inspect, attach, export and reopen

`capsule task` attaches one supported local capsule snapshot to an objective,
role, scope and explicit as-of date, using the existing worker context compiler.
It prepares a cited draft prompt; it does not generate an answer, collect sources,
resolve dependencies, call a hosted API or write a database. UTF-8 bytes for the
**entire prompt**, including task instructions, escaped records, graph labels
and evidence, must fit `--max-bytes` (1,024–64,000; default 16,000). The existing
character-based selector is rerun with a smaller ceiling when necessary; this
can leave unused byte capacity. It is a deterministic selection control, not
measured saliency, efficiency or analytical-quality improvement.

From the repository root, after `npm ci`:

```bash
npm run praxis -- capsule task tests/fixtures/cognitive-capsule/policy-context.json --objective "Draft a finance brief with cited evidence and explicit gaps." --scope public-finance --as-of 2026-11-07 --role domain-specialist --max-bytes 16000
npm run praxis -- capsule task tests/fixtures/cognitive-capsule/policy-context.json --objective "Draft a finance brief with cited evidence and explicit gaps." --scope public-finance --as-of 2026-11-07 --role domain-specialist --max-bytes 16000 --output /tmp/praxis-finance-task --allow-write
npm run praxis -- capsule reopen /tmp/praxis-finance-task
npm run praxis -- capsule reopen /tmp/praxis-finance-task --format prompt
```

The fixture, source text and identities are synthetic. Its recorded accepted
and proposed states exercise schema mechanics; they are not real human review.
Inspect the JSON preview before using the prompt: `sources` retains every exact
quotation, source/version ID, anchor status and stance, including unselected
evidence. `ontology` preserves typed nodes and provenance. `researchMemory`
exposes questions, unknowns and revision triggers. `view` records selected
knowledge, unapplied conditional candidates, evidence and omission reasons.
Source independence, factual truth and freshness are unverified. Unknown dates
and missing evidence stay unknown; setting an as-of date does not verify them.

Export requires a **new directory** and `--allow-write`. The directory contains:

- `source.capsule`: original native bytes, or an existing-format package created
  from supported JSON without changing its semantic records or review states.
- `task.json`: the local `praxis-local-task/1` recipe, exact artifact and semantic
  digests, compiler version, selected-view digest and prompt digest.
- `prompt.txt`: the draft prompt bounded by the requested UTF-8 byte budget.

`capsule reopen` is read-only. It checks package integrity, capsule and artifact
digests, compiler version, recomputed view and the exact prompt. Changed recipes,
prompts and packages fail rather than appearing to be the saved task. These
checks are reproducibility/integrity checks, not proof of author identity. After
a compiler change, prepare a new directory from the preserved source package.
The three filenames are fixed; recipe fields cannot redirect reads outside the
directory. Symlink ancestors and malformed UTF-8 prompts are rejected.
Use another task objective/role and directory to revise a task. To change the
research memory itself, explicitly edit/review the source capsule and save a
new capsule version; task preparation cannot accept a proposal or alter an
earlier snapshot. Original documents are not added to the package.

### Format boundaries

| Surface / artifact | Contract | This local workflow |
| --- | --- | --- |
| PRAXIS cognitive JSON | `cognitive-capsule/vNext` | Validated input; packaged with the existing native writer on export |
| PRAXIS native `.capsule` | `tacitus-native-capsule/1`, carrying the cognitive schema | Validated input; exact original artifact bytes preserved on export |
| Local task directory | `praxis-local-task/1` recipe plus native package and prompt | Local export/reopen only; not a native capsule or hosted AgentRun |
| Persisted workbench ContextCapsule | Numeric V1/V2/V3 owner-scoped envelope | Separate storage contract; not silently imported by this command |
| TACITUS website uploaded-knowledge inspector | Native-v2 from the `tacitus-political-policy-second-brain` public-core lineage | Separate contract; no automatic conversion/import |
| TACITUS website saved selection | `tacitus-uploaded-knowledge-context/1` containing `tacitus-layered-policy-context/1` | Separate local selection export; not accepted as a PRAXIS native package |

Names such as “capsule”, “native” and “v2” do not establish compatibility.
Cross-tool interchange, review promotion and shared ontology identity require
an explicit adapter and independent acceptance evidence. They are not provided
by this workflow.

### Validation on 7 November 2026

The CLI and cognitive-context suites pass **130 tests in 23 files**. Typecheck,
lint and the webpack production build pass (seven existing lint warnings).
The local task was also prepared and reopened independently: **6,875 of 16,000
UTF-8 prompt bytes**, with identical prompt content and owner-only saved files.

The full repository suite has **3,234 passing tests, four failures and one skip**.
The failures also reproduce on untouched main `4b77dcd3`: three allowance
assertions in `tests/unit/lib/billing/polar-webhook.test.ts` and one process
cleanup case in `tests/unit/lib/firebase/emulator-process.test.ts`. The
public-surface copy-marker audit also fails on that baseline. The default
Turbopack build is blocked by this environment's local-port restriction; the
supported webpack build passes. GCP auditing was explicitly skipped to avoid
live cloud queries. These checks establish the local workflow, not a clean
repository-wide release gate or hosted acceptance.

## Private local registry

The default registry is `$HOME\.praxis\registry`; choose another private directory with `--registry`. It contains a JSON version manifest and SHA-256 addressed immutable artifacts under `objects/`. Nothing is sent to an external registry. Publish, install, fork and deprecate require `--allow-write` even though they are local operations.

```powershell
npm run praxis -- capsule publish .\example.capsule --allow-write
npm run praxis -- capsule list
npm run praxis -- capsule install tacitus/example 1.0.0 --allow-write
npm run praxis -- capsule fork tacitus/example 1.0.0 local/my-example --output .\fork.json --allow-write
npm run praxis -- capsule deprecate tacitus/example 1.0.0 --reason "Use version 1.1.0" --allow-write
```

Identity is `publisher/name`; every publication fixes an exact semantic version and artifact digest. A different artifact at an already published version is rejected. Publish a changed capsule under a new version. Fork produces a draft under a distinct identity and version `0.1.0`; it does not publish the draft. Restricted licensed or organization capsules cannot be forked without a rights grant, which this local MVP does not infer.

Dependencies lock an exact name, version and **artifact byte digest**, not the capsule's semantic digest. All dependencies must already exist in the local registry and pass recursive integrity and rights checks. Cycles, deprecated versions, absent dependencies and mismatched locks fail. Install marks the exact validated dependency closure as installed. Open redistribution cannot import private, organization or licensed dependencies; differing licensed terms fail rather than assuming compatibility. Open and licensed capsules must declare a license.

Publication and installation metadata stay outside artifact bytes. A directory lock serializes local writes. After a process crash, inspect any remaining `.write-lock` directory before removing it; the CLI does not silently break a possibly active lock. Files use private permissions where the operating system supports them; protect the Windows directory with the account's normal ACLs. There is no commerce or credential storage.

## Existing PRAXIS API commands

Remote commands execute only when explicitly invoked. Supply `PRAXIS_BASE_URL` and `PRAXIS_AUTH_ORIGIN` as the same exact origin, and `PRAXIS_SESSION` as an existing URL-encoded signed `tacitus-auth-session` cookie through process environment. The CLI does not create or persist credentials. Do not put cookie values in files or shell history.

```powershell
npm run praxis -- whoami
npm run praxis -- ask "What changed?" --capsule CAPSULE_ID
npm run praxis -- run "Research the change and prepare a brief" --capsule CAPSULE_ID
npm run praxis -- list --capsule CAPSULE_ID
npm run praxis -- receipt RUN_ID
```

Ask uses `/api/ai/ask-praxis`; run creates a manual run through `/api/agents/runs`; list and receipt read the existing run ledger and its context receipt fields. Run creation follows the server's normal dispatch behavior and approval boundaries. Whoami reads `/api/auth/session`. Remote capsule IDs identify existing server capsules; a local package is not silently uploaded or promoted into a server capsule.

The transport requires HTTPS except localhost, checks the declared authentication origin, rejects raw unsigned sessions, and rejects redirects. It scopes the signed session to that origin only. Credentials are redacted from returned output and API errors expose status codes rather than response bodies. Ask may return streaming response text from the existing endpoint. The CLI has no persistent login command or independent bearer-token authentication path.

## Integrity and resource limits

Every payload file has a SHA-256 byte digest and byte count in the manifest. The graph has a separate canonical semantic capsule digest. The reader checks exact declared file membership, canonical projections, capsule identity/version, graph references and ZIP CRCs. Digests establish content integrity; they do not independently establish author identity or human review quality.

`attestCapsulePackage(bytes, { privateKey, keyId, actorId, kind, issuedAt })` creates a detached Ed25519 author/review/evaluation/publication attestation using a caller-supplied key. It signs canonical metadata binding the exact artifact bytes, semantic digest, schema, capsule identity and immutable version. `verifyCapsuleAttestation(bytes, attestation, trustedKeys)` requires an explicit caller-supplied public-key-to-actor mapping and rejects unknown keys, mismatched identities, tampered bytes/digests and unsupported algorithms. The library neither generates nor stores keys. Verification reports `trustedKeyMapping: "caller-supplied"`; a valid signature does not independently establish the actor's identity, expertise, factual accuracy or review quality. Attestations stay outside the package and never mutate published bytes.

Default limits are 16 MiB compressed archive, 64 MiB total decompressed data, 8 MiB per file, 128 entries and a maximum 1000:1 expansion ratio. Before JSZip loads the archive, the reader checks central and local headers, verifies paths and declared sizes, and bounds actual DEFLATE output. Traversal, absolute paths, Windows reserved names, case collisions, duplicates, overlapping entries, symlinks, encryption, unexpected files, ZIP64 and multidisk archives are rejected. The writer produces deterministic uncompressed ZIP bytes so a given canonical capsule yields one stable artifact digest.

Tests: `npx vitest run tests/unit/lib/cognitive-capsule/package.test.ts tests/unit/lib/cognitive-capsule/registry.test.ts tests/unit/cli/praxis.test.ts`.
