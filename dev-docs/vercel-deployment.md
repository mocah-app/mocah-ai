# Vercel Deployment Guide

## 🚨 Quick Fix for 404 Error

If you're getting a 404 error after deployment, follow these steps:

1. Go to your Vercel project → **Settings** → **General**
2. Scroll to **Build & Development Settings**
3. Click **Edit** next to Root Directory
4. Set to: `apps/web`
5. Click **Edit** next to Build Command
6. Set to: `cd ../.. && pnpm db:migrate:deploy && turbo build --filter=web`
7. Click **Save**
8. Go to **Deployments** tab
9. Click **⋯** (three dots) on latest deployment
10. Click **Redeploy**

This ensures Vercel knows where your Next.js app is located in the monorepo.

---

## Project Configuration

### 1. Vercel Project Settings

**Build & Development Settings:**
- **Framework Preset:** Next.js
- **Root Directory:** `apps/web` ⚠️ **IMPORTANT**
- **Build Command:** `cd ../.. && pnpm db:migrate:deploy && turbo build --filter=web`
- **Install Command:** `pnpm install`
- **Output Directory:** Leave empty (auto-detected)
- **Node Version:** 20.x (recommended)

**⚠️ Critical Settings:**
1. Root Directory MUST be set to `apps/web`
2. Build command MUST use `cd ../..` to access workspace root
3. Do NOT override Output Directory (let Vercel auto-detect)

### 2. Environment Variables

Add these to your Vercel project (Settings → Environment Variables):

#### Database
```
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
```

#### Authentication
```
BETTER_AUTH_SECRET=your-secret-key-min-32-chars
BETTER_AUTH_URL=https://your-domain.vercel.app
CORS_ORIGIN=https://your-domain.vercel.app
```

#### Google OAuth
```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

#### Stripe
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_FREE=price_...
STRIPE_PRICE_ID_STARTER=price_...
STRIPE_PRICE_ID_PRO=price_...
STRIPE_PRICE_ID_PRO_ANNUAL=price_...
STRIPE_PRICE_ID_SCALE=price_...
STRIPE_PRICE_ID_SCALE_ANNUAL=price_...
```

#### Email (Resend)
```
RESEND_API_KEY=re_...
RESEND_EMAIL_DOMAIN=your-domain.com
RESEND_FROM_EMAIL=noreply@your-domain.com
```

#### Storage (Tigris)
```
TIGRIS_ENDPOINT_URL=https://fly.storage.tigris.dev
TIGRIS_ACCESS_KEY_ID=tid_...
TIGRIS_SECRET_ACCESS_KEY=tsec_...
TIGRIS_BUCKET_NAME=your-bucket-name
TIGRIS_PUBLIC_URL=storage.mocah.ai
```

### 3. Deployment Flow

#### First Deployment
1. Connect your GitHub repository to Vercel
2. Set **Root Directory** to `apps/web`
3. Configure environment variables (see above)
4. Deploy!

#### Deployment Process (Automatic)
```bash
1. cd apps/web               # Vercel sets root directory
2. cd ../.. && pnpm install  # Install from workspace root (triggers postinstall)
3. pnpm db:migrate:deploy    # Applies migrations to production DB
4. turbo build --filter=web  # Builds Next.js app and dependencies
5. Deploy                    # Vercel serves the app from apps/web/.next
```

### 4. Important Notes

#### Database Migrations
- ✅ Migrations run automatically via `db:migrate:deploy`
- ✅ Only applies committed migration files from `packages/db/prisma/migrations/`
- ⚠️ Make sure migrations are tested in staging first
- ⚠️ Never use `db:push` in production

#### Prisma Client Generation
- ✅ Automatically generated via `postinstall` hook
- ✅ Runs before build, ensuring client is available
- ✅ No manual intervention needed

#### Monorepo Setup
- ✅ Root directory set to `apps/web` tells Vercel where to find Next.js
- ✅ Build command uses `cd ../..` to run commands from workspace root
- ✅ `--filter=web` ensures only web app is built

### 5. Troubleshooting

#### Error: "Model user does not exist"
- **Cause:** Prisma client not generated
- **Fix:** Already handled by `postinstall` hook ✅

#### Error: "prisma command not found"
- **Cause:** Prisma not in dependencies
- **Fix:** Already in `@mocah/db/devDependencies` ✅

#### Error: "Migration failed"
- **Cause:** Database connection issue or conflicting migrations
- **Fix:** 
  1. Check `DATABASE_URL` is correct
  2. Ensure database is accessible from Vercel
  3. Verify migrations in staging first

#### Build Timeout
- **Cause:** Long migration or build process
- **Fix:** Upgrade to Vercel Pro for longer build times

### 6. CI/CD Best Practices

#### Staging Environment
```bash
# Create a preview branch
git checkout -b staging

# Vercel will auto-deploy to preview URL
# Configure staging environment variables in Vercel
```

#### Production Deployment
```bash
# Merge to main/master
git checkout main
git merge your-feature-branch
git push origin main

# Vercel auto-deploys to production
```

### 7. Vercel CLI (Optional)

For manual deployments:

```bash
# Install Vercel CLI
pnpm add -g vercel

# Login
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### 8. Post-Deployment Checks

- [ ] Visit your Vercel URL
- [ ] Check authentication flow (sign up/login)
- [ ] Test database connections (create/read data)
- [ ] Verify file uploads (Tigris integration)
- [ ] Check Stripe webhooks
- [ ] Monitor Vercel logs for errors

## Quick Reference

| Environment | Branch | Auto-Deploy | Migrations |
|-------------|--------|-------------|------------|
| Production | `main` | ✅ Yes | `migrate:deploy` |
| Preview | `feature/*` | ✅ Yes | `migrate:deploy` |
| Development | Local | ❌ No | `migrate dev` |

## Support

- **Vercel Docs:** https://vercel.com/docs
- **Prisma + Vercel:** https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel
- **Next.js Monorepo:** https://vercel.com/docs/concepts/monorepos

