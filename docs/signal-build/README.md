# PRAXIS SIGNAL build kit

Unzip anywhere Codex can access. Begin with [START_HERE.md](START_HERE.md) and give Codex [BOOTSTRAP.md](BOOTSTRAP.md). The bootstrap locates the existing PRAXIS checkout and installs the kit into `docs/signal-build/` while preserving its instructions and progress. The Codex prompts implement a global module at `/signal`; production integration and deployment remain to be done there.

The separate local reference requires Node 22.13+ with `node:sqlite` and no npm dependencies:

```sh
node scripts/check-kit.mjs
node --test code/domain.test.mjs code/http.test.mjs code/analysis-baselines.test.mjs
node code/server.mjs
```

Open `http://127.0.0.1:4310`. Optional watched-country discovery: `node code/server.mjs BR JP`. This loop only runs while the local process is alive and uses 15-minute bounded checks. Production watched jobs require the existing durable worker/scheduler. External GDELT requests have not been live-validated here.

Environment options for the local reference: `SIGNAL_PORT` (default 4310) and `SIGNAL_LOCAL_DB` (default `signal.sqlite` beside this README). Use only the printed loopback address. The single-owner harness has no production tenant authentication; reviewer names are self-entered. Stop it with Ctrl+C. Do not expose it to the internet or deploy its SQLite store as PRAXIS production infrastructure.

Verified: 29 deterministic/domain/HTTP/analytical-guard tests (17 core and 12 additional method tests) on Node 24.19.0. Global registry, supplied text captures, exact quote/hash guards, append-only review, scope isolation, durable reopening, failure states, draft brief and extension capsule exports work in the reference. Deeper analysis, native capsule import, real auth, durable cloud jobs and deployment are production phases. Browser interaction and Windows execution were not run here.

All included scenario content is synthetic and labeled. The visual graph shows source/claim/topic relations; it does not prove influence, coordination, audience belief or disinformation. See the researched blueprint for the proposed analytical product and its implementation gates.

The expanded [research supplement](research/README.md) includes 23 additional primary references, source-access planning, multilingual evaluation, temporal context, the paid brief and a solo-founder execution plan. See [CHANGELOG.md](CHANGELOG.md) for this release.
