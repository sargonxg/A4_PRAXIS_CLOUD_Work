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
