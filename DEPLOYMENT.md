# Haqqi — Deployment Guide

This guide walks you through deploying Haqqi to production using **Supabase** (database) + **Vercel** (hosting).

---

## Prerequisites

- A [GitHub](https://github.com) account (repo already at https://github.com/almizanpro-del/Haqqi)
- A [Supabase](https://supabase.com) account (free tier is fine)
- A [Vercel](https://vercel.com) account (free tier is fine)

---

## Step 1: Create the Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New Project**
3. Name it `haqqi-prod` (or similar)
4. Set a strong database password — save it somewhere safe
5. Choose the region closest to Jordan:
   - **Frankfurt (eu-central-1)** — best latency from Jordan (~80ms)
   - **Mumbai (ap-south-1)** — alternative (~120ms)
6. Wait 2-3 minutes for the project to provision

### Get your connection strings

1. Go to **Project Settings → Database**
2. Copy the **Connection string** (URI format)
3. You need TWO connection strings:
   - **Pooling connection** (port `6543`) — for the app (DATABASE_URL)
   - **Direct connection** (port `5432`) — for migrations (DIRECT_URL)

They look like:
```
postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].supabase.com:5432/postgres
```

### Enable pgvector

1. Go to **SQL Editor** in Supabase
2. Click **New query**
3. Paste the contents of `prisma/migrations/001_setup_pgvector.sql` from this repo
4. Click **Run**
5. You should see `vector` in the extensions list

---

## Step 2: Deploy to Vercel

### Connect the repo

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New → Project**
3. Import the `almizanpro-del/Haqqi` repository
4. Vercel will auto-detect Next.js — keep the default settings

### Set environment variables

In the Vercel project settings → **Environment Variables**, add each of these:

| Key | Value | Notes |
|-----|-------|-------|
| `DATABASE_URL` | `postgresql://postgres.[REF]:[PWD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true` | Pooling connection |
| `DIRECT_URL` | `postgresql://postgres.[REF]:[PWD]@aws-0-[REGION].supabase.com:5432/postgres` | Direct connection |
| `SHADOW_DATABASE_URL` | Same as `DIRECT_URL` | For Prisma migrations |
| `ZAI_BASE_URL` | *(from your .z-ai-config)* | LLM provider |
| `ZAI_API_KEY` | *(from your .z-ai-config)* | LLM provider |
| `NEXTAUTH_URL` | `https://haqqi.vercel.app` (your Vercel URL) | Auth callback URL |
| `NEXTAUTH_SECRET` | *(generate with `openssl rand -base64 32`)* | Auth secret |
| `SUPABASE_URL` | `https://[REF].supabase.co` | For Storage + Auth |
| `SUPABASE_ANON_KEY` | *(from Supabase → Settings → API)* | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | *(from Supabase → Settings → API)* | Server-side key |

**Important**: Set these for **Production**, **Preview**, and **Development** environments.

### Deploy

1. Click **Deploy**
2. Wait for the build to complete (~2-3 minutes)
3. Vercel will give you a URL like `https://haqqi-[hash].vercel.app`

---

## Step 3: Push the Schema to Supabase

Run these commands locally (you need the repo cloned with `.env` pointing to Supabase):

```bash
# 1. Update your local .env to point to Supabase
#    (copy values from Vercel env vars above)

# 2. Push the Prisma schema
bun run db:push

# 3. Run the pgvector SQL migration
#    (paste prisma/migrations/001_setup_pgvector.sql into Supabase SQL Editor)

# 4. Seed the database
bun run scripts/seed.ts
bun run scripts/seed-forum.ts
bun run scripts/verify-all-docs.ts
bun run scripts/embed-documents.ts
```

---

## Step 4: Verify

1. Visit your Vercel URL
2. The consent modal should appear on first load
3. Click through the onboarding tour
4. Try the AI Intake (should work with z-ai-web-dev-sdk)
5. Try the Rights Calculator
6. Generate a draft → switch to Lawyer role → approve → switch back → send

---

## Production Checklist

- [ ] Supabase project created (Frankfurt region)
- [ ] pgvector extension enabled + index created
- [ ] Vercel project connected to GitHub repo
- [ ] All environment variables set in Vercel
- [ ] `bun run db:push` succeeded against Supabase
- [ ] Seed scripts ran successfully
- [ ] Embeddings generated for RAG corpus
- [ ] First deployment succeeded
- [ ] AI Intake works (LLM calls succeed)
- [ ] Draft generation works (LLM calls succeed)
- [ ] PDF export downloads a valid .pdf file
- [ ] RAG search returns results from pgvector

---

## Cost Estimates (Free Tier)

| Service | Free Tier | Expected Usage |
|---------|-----------|----------------|
| **Supabase** | 500MB DB, 1GB storage, 50K MAU | ✅ Enough for MVP |
| **Vercel** | 100GB bandwidth, 100hrs serverless | ✅ Enough for MVP |
| **z-ai-web-dev-sdk** | Included in platform | ✅ No extra cost |

**Total monthly cost for MVP: $0**

When you outgrow free tiers:
- Supabase Pro: $25/month (8GB DB, 100GB storage)
- Vercel Pro: $20/month (1TB bandwidth, 1000hrs serverless)

---

## Troubleshooting

### "Prisma can't connect to database"
- Ensure `DATABASE_URL` uses the pooling connection (port 6543) with `?pgbouncer=true`
- Ensure `DIRECT_URL` uses the direct connection (port 5432)

### "pgvector extension not found"
- Run the SQL in `prisma/migrations/001_setup_pgvector.sql` in Supabase SQL Editor
- Supabase has pgvector pre-installed, you just need to `CREATE EXTENSION IF NOT EXISTS vector`

### "LLM calls fail on Vercel"
- Ensure `ZAI_BASE_URL` and `ZAI_API_KEY` are set in Vercel env vars
- The z-ai-web-dev-sdk needs these on the server side

### "Build fails on Vercel"
- Ensure `SHADOW_DATABASE_URL` is set (Prisma needs it for migrations)
- Check that all env vars are set for the Production environment

---

## Next Steps (Post-Launch)

1. **Set up Supabase Auth** to replace the demo user (PRD §6.3)
2. **Set up Supabase Storage** for real evidence file uploads (PRD §5.2.3)
3. **Configure Vercel Cron** for notification reminders (PRD §5.1.2)
4. **Add Cloudflare CDN** in front of Vercel for Middle East latency optimization
5. **Set up Sentry** for error monitoring (PRD §6.1)
6. **Set up Plausible/Matomo** for analytics (PRD §6.1)
