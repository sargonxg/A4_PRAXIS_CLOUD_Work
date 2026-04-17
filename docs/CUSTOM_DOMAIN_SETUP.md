# Custom Domain Setup: praxis.tacitus.me

## Step 1: Verify domain ownership

In [Google Search Console](https://search.google.com/search-console), verify ownership of `tacitus.me`.

## Step 2: Run the setup script

```bash
./infrastructure/setup-domain.sh
```

Cloud Run will provision a TLS certificate automatically.

## Step 3: Add DNS record

In your DNS provider for tacitus.me, add:

| Type | Name | Value |
|------|------|-------|
| CNAME | praxis | ghs.googlehosted.com |

(TLS cert provisioning takes up to 30 minutes)

## Step 4: Firebase Auth — add authorized domain

Firebase Console → Authentication → Settings → Authorized domains → Add `praxis.tacitus.me`

## Step 5: OAuth Client — add authorized origins

Google Cloud Console → APIs & Services → Credentials → your OAuth 2.0 Client ID:
- Authorized JavaScript origins: add `https://praxis.tacitus.me`
- Authorized redirect URIs: add `https://praxis.tacitus.me/__/auth/handler`

## Step 6: Verify

```bash
curl -I https://praxis.tacitus.me/api/health
# Expected: HTTP/2 200
```
