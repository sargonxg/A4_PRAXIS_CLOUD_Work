# TACITUS native-v2 attachment boundary

This is a local contract/adapter/persistence checkpoint, not hosted native
artifact registration or a deployed provider integration. The hosted authority
seam deliberately returns `native_authority_unavailable` for nonempty native
selections until a separately reviewed backing store is supplied. No security
rule, new Firestore collection, storage grant, cognitive schema/package, existing
PR, deployment configuration or workbench `localAccess` guard is changed.

## Separate contracts

Legacy cognitive ZIP format `tacitus-native-capsule/1` retains its semantic
versions. Rust native-v2 has integer `package_version`, manifest schema 2 and
manifest profile `context`. Its supported graph artifact is
`tacitus.uploaded-knowledge/1`; this adapter labels that capability
`uploaded-knowledge/1`. Other profiles/capabilities and opaque native packages
are refused by validation or the pinned inspector.

`ActiveContextStackState.nativeAttachments` is a separate optional lock list,
limited to four reference/comparison attachments. Native attachments cannot
govern the stack, grant tools, change cognitive version resolution or promote
unreviewed proposals. Locks contain server-derived artifact ID, archive digest,
manifest ID/profile/integer package version, adapter capability and current
artifact/parent revisions. Client owner, storage path, revocation fields, extra
lock fields and malformed versions/digests are rejected. Saved locks remain
untrusted selectors; old receipts never establish current access.

## Authority and process boundary

`NativeArtifactAuthority` is a server-only interface supplied by trusted server
composition. It must resolve exact owner-scoped immutable artifact bytes and
live account/current-parent state, return authoritative revocations, and
atomically validate all involved snapshots at release. The backing store must
advance its revision for access, parent, revocation and byte changes, including
revoke/reinstate cycles. That hosted implementation and its transaction/race
proof are deferred. No browser selects an owner, object path, runner or server
revocation list.

The adapter checks owner/account/current-parent eligibility, hashes exact
archive bytes, runs the strict uploaded-knowledge inspector, compares every
lock, checks snapshots again before reuse, and rechecks after all reuse work.
Context injection checks again after its remaining asynchronous context work.
Any failure refuses the request; it never substitutes cognitive/latest/demo
context. Tests establish no downstream provider invocation on refusal; they do
not establish real hosted provider behavior.

The runner accepts only `inspect` and `reuse`, uses argument arrays with no
shell, passes only fixed nonsecret locale/timezone/production environment,
verifies a server-supplied binary digest against pinned core/patch metadata,
and executes a private temporary copy. Build receipts and expected binary hash
must be trusted deployment inputs: constants alone do not attest a binary's
source. Input is at most 8 MiB; query JSON 16 KiB; output 2 MiB; stderr 8 KiB;
at most two processes run per runner instance. Timeout is at most ten seconds.
Cancellation kills the child and cleanup waits for close. Scratch and inputs
are removed on success/refusal/error/timeout/cancellation. No model, shell tool,
network permission or persistent grant is exposed by this runner.

## Persistence and context budgets

Existing `users/{uid}/contextStacks` records retain native locks through
normalization, default and named selection, compatibility edits, pointer
reload, and capsule mirror updates. Named selection writes active/named native
metadata in one batch. The active pointer always replaces its native list;
Clear and switching cannot leave stale locks. Because `contextStacks/default`
also stores the active pointer, `savedDefaultNativeAttachments` preserves the
default's saved selection while another stack is active. These fields never
become cognitive capsule content. The existing owner-only stack rules are
unchanged; server revalidation is mandatory because selectors are writable
metadata, not grants.

The adapter measures actual UTF-8 envelope bytes, includes complete contexts
or explicit whole-record omissions, and never slices evidence records. The
inherited character budget includes or omits the entire native section.
`contextJson` retains the exact original native UTF-8 JSON, with reversible
JSON/markup escaping; it is not parsed and reserialized as evidence. This
preserves native i64 values beyond JavaScript's safe integer range. Receipts
hash the original Context bytes. Source instructions remain quoted data.

## Reproduce the real local subprocess check

Install the unchanged lock with `npm ci --ignore-scripts`. Build the pinned core
and source-span patch using the public workbench's `scripts/build-core.sh` in a
fresh directory. Record the resulting executable's SHA-256; compiler/platform
can change binary bytes. Then run:

```sh
TACITUS_NATIVE_TEST_BIN=/absolute/path/to/knowledge_capture \
TACITUS_NATIVE_TEST_BIN_SHA256=<verified-build-receipt-sha256> \
TACITUS_NATIVE_TEST_ARCHIVE="$PWD/tests/fixtures/tacitus-native/synthetic.native-v2.zip" \
node_modules/.bin/vitest run tests/unit/lib/context/tacitus-native.test.ts \
  tests/unit/app/api/workspace-native-stack.test.ts
```

Without the real-binary/fixture environment, that one subprocess acceptance case
is explicitly skipped; the remaining runner safety tests use generated test
executables. The route tests use a simulated authority and in-memory Firestore;
the fresh-process test uses actual disk bytes and a new Node process. No hosted
Firestore/Storage transaction, authentication journey, live model, deployment,
answer-quality gain or production-readiness claim follows from these tests.

The integration began at private repository commit
`360095cf2c161a7555ec7cd76baec83f2e541b96`. Fresh ancestry checks found PR24
`1e59b0b35003e04e8e5f885f89722850843e3e4e`, PR29
`b7cdb72dc0f1856a39605c34f717e3a5da13fb6e` and PR32
`9bece88bc0706d2076fc46bf08d93b0038feb8dd` already contained by that commit.
Their PR records remain unchanged.
