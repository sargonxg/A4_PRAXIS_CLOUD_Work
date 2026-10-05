# Instructions for this SIGNAL build-kit folder

This directory contains a portable instruction kit and reference code. The production target is the existing PRAXIS repository at `/signal`.

For the user's request to build SIGNAL, begin with `BOOTSTRAP.md`. Resolve the actual kit and repository paths. Preserve the existing repository's instructions, authentication, evidence plane, capsules, model gateway and deployment workflow. Never replace that repository with this reference harness.

For edits to this kit, keep documentation, research sources, fixtures and code consistent. Run `node scripts/check-kit.mjs` and the applicable `node --test` reference suites. Test artifact integrity after packaging. Do not include secrets, customer material, runtime SQLite files, dependency directories or downloaded third-party datasets/models in the ZIP.

Once installed under `docs/signal-build/`, this file remains scoped to that folder. It does not override the repository's root AGENTS.md. Follow `codex/CONTROLLER.md` and the current phase for production work.
