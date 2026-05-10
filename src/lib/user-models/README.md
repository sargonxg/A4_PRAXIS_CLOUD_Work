# User Models module

Future home for first-class versioned User Models. Each authenticated user
already has an `AnalystProfile` (Firestore: `users/{uid}/profile/analyst`) and
versioned snapshots (`users/{uid}/profile_versions/{vN}`). This module will
elevate that data shape into a first-class artifact with explicit versioning,
diff, comparison, and (future) Postgres `user_model_versions` storage.

Status: empty placeholder. Do not add files here without an approved ADR.

References:

- `docs/adr/0037-user-models-as-first-class-versioned-artifacts.md` — proposed ADR.
- `src/types/analyst-profile.ts` — current AnalystProfile shape.
- `src/lib/firebase/analyst-profile-service.ts` — current persistence path.
