# Supabase Migration Guide

## 🎯 Overview

This guide walks you through migrating DataBridge from standalone PostgreSQL to Supabase.

## 📋 Prerequisites

- Supabase account and project created
- Supabase connection credentials

## 🚀 Migration Steps

### 1. Get Supabase Credentials

#### A. Public Keys (for client-side)
From Supabase Dashboard → **Settings** → **API**:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

#### B. Database Connection String
From Supabase Dashboard → **Settings** → **Database** → **Connection string** → **URI**:

**Use Connection Pooler (Recommended for serverless):**
```env
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

**Or Direct Connection (for persistent connections):**
```env
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

> 💡 **Tip:** Replace `[PASSWORD]` with your actual database password from Supabase.

### 2. Update Local Environment

Create `apps/web/.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://iwdqwnlceronytffoeai.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3ZHF3bmxjZXJvbnl0ZmZvZWFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNDI2NjIsImV4cCI6MjA3NzkxODY2Mn0.qMkLubDfHyTDVzNtU1d6daJr4zzD9YmlPic-G-Sg4Wo

# Database Connection (Get from Supabase Dashboard)
DATABASE_URL=postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# Session Secret (keep existing or generate new)
SESSION_SECRET=your-existing-session-secret

# Redis (for BullMQ job queue)
REDIS_URL=redis://localhost:6379

# Vercel Cron (for scheduled migrations)
CRON_SECRET=your-cron-secret-here

# SAP Object Store (optional, for attachment migration)
SAP_OBJECT_STORE_URL=https://your-sap-url
SAP_OBJECT_STORE_API_KEY=your-api-key
```

### 3. Run Database Migrations

```bash
# Navigate to schema package
cd packages/schema

# Run migrations on Supabase
yarn db:deploy

# Verify migration
yarn db:studio
```

### 4. Update GitHub Secrets (for CI/CD)

Update the following secrets in your GitHub repository:

**Settings** → **Secrets and variables** → **Actions**:

```
DATABASE_URL = postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
NEXT_PUBLIC_SUPABASE_URL = https://iwdqwnlceronytffoeai.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 5. Update Vercel Environment Variables

**Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**:

Add/Update:
- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Make sure to set them for:
- ✅ Production
- ✅ Preview
- ✅ Development

### 6. Test Local Development

```bash
# Start dev server
cd apps/web
yarn dev

# Visit http://localhost:3000
# Test database connectivity
```

### 7. Redeploy to Vercel

```bash
# Push changes to trigger deployment
git add .
git commit -m "chore: migrate to Supabase"
git push origin main
```

## ✅ Verification Checklist

- [ ] Local dev server connects to Supabase successfully
- [ ] Migrations ran successfully on Supabase
- [ ] Can view data in Supabase Dashboard → Table Editor
- [ ] GitHub Secrets updated
- [ ] Vercel Environment Variables updated
- [ ] Production deployment successful
- [ ] Health check passes (returns 200)
- [ ] Can perform CRUD operations

## 🔧 Troubleshooting

### Connection Errors

**Error:** `connection refused` or `timeout`
- ✅ Check if DATABASE_URL has correct password
- ✅ Verify connection pooler is enabled in Supabase
- ✅ Check firewall/network restrictions

### Migration Errors

**Error:** `relation already exists`
- Your tables already exist in Supabase
- Either drop tables manually or use `--force` flag

**Error:** `permission denied`
- Check database user permissions in Supabase
- Verify you're using the correct connection string

### Vercel Deployment Fails

- ✅ Ensure all environment variables are set
- ✅ Check build logs for connection errors
- ✅ Verify DATABASE_URL doesn't have special characters that need escaping

## 📚 Additional Resources

- [Supabase Connection Pooler](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [Drizzle ORM with Supabase](https://orm.drizzle.team/docs/get-started-postgresql)
- [Supabase Dashboard](https://app.supabase.com/)

## 🆘 Need Help?

Check the connection is working:
```bash
# Test connection
psql "postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
```

Or use Supabase's SQL Editor to verify tables exist.

