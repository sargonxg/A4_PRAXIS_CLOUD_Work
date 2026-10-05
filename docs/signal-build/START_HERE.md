# Start PRAXIS SIGNAL with Codex

Prepared 5 October 2026. Release 0.2. Target: `https://praxis.tacitus.me/signal` in the existing PRAXIS application.

## Unzip anywhere and start

Extract the complete ZIP into any folder Codex can access. The actual kit root is the folder containing `BOOTSTRAP.md`; the archive has one top-level `PRAXIS_SIGNAL_Build_Kit` folder. Keep all its relative folders together.

Open your existing PRAXIS project in Codex and give it the extracted kit location. Paste:

> Read BOOTSTRAP.md in the extracted PRAXIS SIGNAL build-kit folder I provided. Follow it to locate my existing PRAXIS checkout, preserve its instructions and work, install this kit, and implement and test SIGNAL at /signal. Begin with phase 00, maintain docs/signal/PROGRESS.md, and continue through the text-pilot phases. Prepare a reviewable release and accurately record blocked live checks.

If using the PowerShell CLI, the new launcher starts Codex against the real repository with the extracted kit accessible. Replace both example paths with your actual paths:

```powershell
& "C:\path\to\PRAXIS_SIGNAL_Build_Kit\scripts\Launch-SignalBuild.ps1" `
  -RepositoryPath "C:\path\to\A4_PRAXIS_CLOUD_Work"
```

The launcher does not copy files, alter Git or deploy. Codex follows `BOOTSTRAP.md` to inspect and integrate. If it cannot locate your production checkout, it needs that local path; this ZIP does not contain the private PRAXIS repository. A separate worktree is recommended when an appropriate clean baseline is available. The optional preparation script and detailed tool setup are in [POWERSHELL_SETUP.md](codex/POWERSHELL_SETUP.md).

## What is included

This package contains the product/architecture blueprint, an expanded primary-source research supplement, twelve ordered coding prompts, runtime model templates, schemas, synthetic fixtures, a PDF report, PowerShell/Cloud instructions and tested local reference code. Its reference harness is **not integrated into PRAXIS**. The production application, Cloud development environment and `/signal` deployment have **not been created by this handoff**.

| File | Purpose |
| --- | --- |
| [BOOTSTRAP.md](BOOTSTRAP.md) | Portable entry point for Codex, from any extraction folder |
| [docs/PROJECT.md](docs/PROJECT.md) | Product, buyer hypotheses, costs and architecture |
| [docs/PRAXIS_SIGNAL_Project.pdf](docs/PRAXIS_SIGNAL_Project.pdf) | Readable full project report |
| [research/README.md](research/README.md) | Added research, analytical method and implementation decisions |
| [research/SOURCE_REGISTER.md](research/SOURCE_REGISTER.md) | Additional primary sources and checked dates |
| [docs/IMPLEMENTATION.md](docs/IMPLEMENTATION.md) | Production integration and lifecycle design |
| [docs/DATA_CONTRACTS.md](docs/DATA_CONTRACTS.md) | Canonical entities, review semantics and API expectations |
| [docs/ACCEPTANCE.md](docs/ACCEPTANCE.md) | Evidence required before a pilot |
| [docs/SOURCE_PACKS.md](docs/SOURCE_PACKS.md) | Global country and regional desk configuration |
| [codex/CONTROLLER.md](codex/CONTROLLER.md) | Persistent coding workflow and decision rules |
| [codex/BUILD_ORDER.md](codex/BUILD_ORDER.md) | Twelve ordered implementation phases |
| [codex/model-prompts/EXTRACT_CLAIMS.md](codex/model-prompts/EXTRACT_CLAIMS.md) | Runtime extraction template; distinct from coding prompts |
| [codex/MCP_AND_ACCESS.md](codex/MCP_AND_ACCESS.md) | Necessary access, optional MCPs and secrets |
| [codex/PROGRESS.template.md](codex/PROGRESS.template.md) | Durable checklist initialized in phase 00 |
| `code/` and `prototype/` | Runnable reference and 29 automated tests |
| [RELEASE.json](RELEASE.json) and `MANIFEST.sha256` | Version, verification boundaries and file integrity |

Use [RESUME_PROMPT.md](codex/RESUME_PROMPT.md) after a session ends. The durable `docs/signal/PROGRESS.md` records which phases actually passed. Optional media must not block a complete text pilot. For Cloud, follow [CLOUD_SETUP.md](codex/CLOUD_SETUP.md) after the kit is on your feature branch and the environment can run the same repository checks.

## Try the reference locally

Use Node 22.13 or newer with `node:sqlite`; tests were run on Node 24.19.0. From the extracted kit root:

```powershell
node .\scripts\check-kit.mjs
node --test .\code\domain.test.mjs .\code\http.test.mjs .\code\analysis-baselines.test.mjs
node .\code\server.mjs
```

Open `http://127.0.0.1:4310`. The local harness stores supplied evidence in SQLite, anchors exact quotations, records review decisions and exports a source graph, draft evidence note and extension capsule. The added pure utilities demonstrate compatible retrieval, panel comparison and dependency invalidation. No npm install or API key is required for deterministic checks.

External GDELT collection requires network access and has not been live-validated here. Topic labels are keyword triage; the reference does not perform real AI narrative analysis. Browser interaction QA, Windows script execution, production auth, native capsule import and deployment were not run here. These are explicit production gates, not completed features.

The first production milestone is an authenticated PRAXIS user choosing any country, capturing evidence, reviewing a claim, reopening the desk and exporting a pinned draft. The commercial milestone is a customer using a reviewed country or regional briefing in an actual decision workflow.
