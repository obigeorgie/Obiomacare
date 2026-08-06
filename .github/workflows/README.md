# GitHub Actions Setup

## Required Secrets

Add these secrets in your GitHub repo settings (Settings → Secrets and variables → Actions):

### 1. `VERCEL_TOKEN`
Get this from [Vercel Settings → Tokens](https://vercel.com/account/tokens)

### 2. `VERCEL_ORG_ID`
Run locally:
```bash
vercel whoami
# Or check ~/.vercel/auth.json
```
Or find it in your Vercel dashboard URL: `vercel.com/<org-id>/...`

### 3. `VERCEL_PROJECT_ID`
Run locally in your project:
```bash
vercel env ls
# Or check .vercel/project.json after running `vercel link`
```

---

## Workflows

### `deploy.yml`
- **Triggers**: Push to `master`, or manual dispatch
- **Does**: Install deps → Build → Deploy to Vercel production

### `ci.yml`  
- **Triggers**: Pull requests to `master`, pushes to non-master branches
- **Does**: Install deps → Build → Syntax check API files → Validate sitemap completeness

---

## First-Time Setup

```bash
# 1. Make sure you're logged into Vercel CLI
npx vercel login

# 2. Link project (if not already)
npx vercel link

# 3. Get your IDs
cat .vercel/project.json
# {"orgId":"...","projectId":"..."}

# 4. Create a Vercel token at https://vercel.com/account/tokens

# 5. Add all three as GitHub secrets
```

---

After pushing this workflow file, the next push to `master` will trigger an automated deployment.
