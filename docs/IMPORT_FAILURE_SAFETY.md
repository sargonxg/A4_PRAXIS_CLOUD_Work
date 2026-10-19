# Import failure and chronology boundaries

DIALECTICA JSON/spec-3 packages are validated before persistence. Capsule,
version history, proposed review and any existing active-stack mirror are then
committed in one owner-checked Firestore transaction. An unavailable/deleting
owner, conflicting source identity, invalid proposal or failed transaction must
leave these records unchanged. No rules, grants or credentials are changed.

Imports remain proposals. Updating a source preserves existing reviewed content,
private extension fields, immutable versions and earlier review decisions.
Existing Firestore Date, Timestamp and GeoPoint values are preserved without
JSON conversion. Staging writes scoped import/review metadata; it does not
replace active attachments, their ordering, roles or historical version pins.
Retries use the stored import receipt, including after a human decision advances
the envelope version. Returning from package A to B to A creates a new transition
review without rewriting the first A review. Local fault-injection tests verify
the staging behavior; live Firestore/authenticated acceptance remains separate.

`src/lib/package-zip.ts` validates ZIP transport in both browser previews and
server parsers. It checks original central/local names before JSZip normalizes
them, rejects traversal/absolute/drive/Windows-reserved paths, aliases, duplicate
names, symlinks and overlapping entries, and bounds archive size, entries,
declared expansion and actual streamed output. CRC and actual size must agree.
Defaults: 2 MiB archive/per file, 8 MiB total, 128 entries, expansion ratio 100.
This does not establish a strict CPU deadline or immediate cancellation: the
inflater may complete its current input chunk before a pause is honored.

Native cognitive, DIALECTICA and Capsule+ retain distinct manifests/contracts.
The existing native cognitive reader keeps its own integrity/rights checks.
Sharing ZIP transport validation does not grant rights or accept a foreign
schema as native.

Capsule+ import is explicitly unavailable (503; demo403) pending its own atomic
retention of all native nodes, edges, proposals and source receipts. Its former
handler could write a capsule before a failed review and reported rows it had
not retained. Local preview/export remain available; the preview's confirmation
control is disabled for Capsule+. No package data is read or saved by the held
endpoint. Its earlier implementation remains in Git history for reviewed repair.

Chronology is not causation. V3 normalization requires an explicit supported
causal relation; missing, unknown and order-only relations cannot default to
`causes`. The timeline omits unsupported causal rows with a warning and preserves
normal temporal edges such as `precedes`. A receipt identifier alone does not
establish causal validity or human review.

Focused regression commands (Node22):

```sh
npx vitest run tests/unit/lib/package-zip.test.ts tests/unit/lib/context/dialectica-zip-safety.test.ts tests/unit/lib/context/capsule-service.test.ts tests/unit/lib/context/capsule-v3.test.ts tests/unit/lib/context/temporal-timeline.test.ts tests/unit/app/api/dialectica-import-route-contract.test.ts tests/unit/app/api/capsule-plus-import-hold.test.ts
```
