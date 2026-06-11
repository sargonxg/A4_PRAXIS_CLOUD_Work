# Disposable Firebase Golden-Path User

Purpose: keep `.github/workflows/persona-smoke.yml` proving the authenticated path on every push to `main`:

1. public home
2. login
3. capsule attach
4. Ask turn
5. run queue
6. memo draft/export proof

The workflow uses a disposable Firebase Auth user in project `praxisbytacitus` and reads only these GitHub Actions secrets:

- `TEST_FIREBASE_EMAIL`
- `TEST_FIREBASE_PASSWORD`

## Create Or Rotate The User

Prerequisites:

- Firebase Console access to project `praxisbytacitus`.
- GitHub repository admin access for Actions secrets.
- A password manager entry for the disposable canary credentials.

Steps:

1. Open Firebase Console, select project `praxisbytacitus`, then open Authentication -> Users.
2. Add a user with an email dedicated to CI, for example `praxis-golden-path-ci+YYYYMMDD@tacitus.test`.
3. Generate a unique random password of at least 24 characters.
4. Store the email and password in the password manager entry named `PRAXIS disposable Firebase golden-path CI user`.
5. Keep the user unprivileged. Do not grant admin claims or production operator roles.
6. If rotating, disable or delete the previous disposable user after the new workflow run passes.

## Add GitHub Actions Secrets

In GitHub:

1. Open repository Settings -> Secrets and variables -> Actions.
2. Add or update `TEST_FIREBASE_EMAIL` with the disposable Firebase user email.
3. Add or update `TEST_FIREBASE_PASSWORD` with the disposable Firebase user password.
4. Confirm the existing public Firebase web config secrets still point at `praxisbytacitus`:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`

## Validate

Run the workflow manually after any credential change:

```powershell
gh workflow run persona-smoke.yml --ref main
gh run list --workflow persona-smoke.yml --limit 3
```

Expected behavior:

- If `TEST_FIREBASE_EMAIL` or `TEST_FIREBASE_PASSWORD` is missing, `Verify Firebase disposable test credentials` fails.
- If credentials are present but login or the product path breaks, `Run authenticated golden path proof` fails.
- Local runs without credentials still skip the golden-path spec unless `REQUIRE_AUTH_GOLDEN_PATH=1` is set.

Local strict proof:

```powershell
$env:REQUIRE_AUTH_GOLDEN_PATH = "1"
$env:PLAYWRIGHT_BASE_URL = "http://127.0.0.1:3000"
npx playwright test tests/e2e/golden-path.spec.ts
```

## Rotation And Incident Response

- Rotate after any suspected leak, failed access review, or at least quarterly.
- Delete the old Firebase user once the new secret pair passes `persona-smoke`.
- Do not commit the email, password, Firebase ID token, session cookie, or workflow logs containing credentials.
- If the disposable user gains unexpected permissions, disable it immediately and file an Identity Platform incident using `docs/runbooks/IDENTITY_PLATFORM_INCIDENT.md`.
