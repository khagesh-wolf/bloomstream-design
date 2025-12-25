# Deployment Guide: Cloudflare Pages + R2 + Supabase

This guide covers deploying the Chiyadani POS system with the optimal free-tier stack that can handle ~50,000+ monthly customers.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Your Customers                           │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│              Cloudflare Pages (Frontend)                     │
│              ✓ Unlimited bandwidth                           │
│              ✓ Global CDN (300+ locations)                   │
│              ✓ Automatic HTTPS                               │
└───────────┬─────────────────────────────────┬───────────────┘
            │                                 │
┌───────────▼───────────┐     ┌───────────────▼───────────────┐
│   Cloudflare R2       │     │        Supabase               │
│   (Image Storage)     │     │   (Database + Realtime)       │
│   ✓ 10GB bandwidth    │     │   ✓ 500MB database            │
│   ✓ WebP optimization │     │   ✓ Realtime subscriptions    │
│   ✓ Global caching    │     │   ✓ Unlimited API calls       │
└───────────────────────┘     └───────────────────────────────┘
```

## Free Tier Limits

| Service | Free Limit | Bottleneck at |
|---------|------------|---------------|
| Cloudflare Pages | Unlimited bandwidth | Never |
| Cloudflare R2 | 10GB/month egress | ~16,000 visits |
| Supabase Database | 500MB, unlimited ops | ~100k menu items |
| Supabase Realtime | Included | N/A |
| Cloudflare Workers | 100k requests/day | ~3M/month |

**Expected capacity: ~50,000+ monthly customers**

---

## Step 1: Supabase Setup

### 1.1 Create Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click **New Project**
3. Choose a name and region (closest to your customers)
4. Save the **Project URL** and **anon/public key**

### 1.2 Database Schema

Run the complete SQL schema from `supabase/schema.sql` in Supabase SQL Editor.

This creates all tables with:
- Categories, Menu Items, Orders, Bills
- Staff, Customers, Settings, Expenses
- Waiter Calls, Transactions
- Row Level Security policies
- Realtime enabled for orders, bills, waiter_calls
- Performance indexes

---

## Step 2: Cloudflare Pages Setup

### 2.1 Create Cloudflare Account

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Sign up for a free account
3. Navigate to **Pages** in the sidebar

### 2.2 Connect GitHub Repository

```bash
# If not already pushed to GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/chiyadani-pos.git
git push -u origin main
```

In Cloudflare Pages:
1. Click **Create a project**
2. Select **Connect to Git**
3. Choose your repository
4. Configure build settings:

```yaml
Framework preset: Vite
Build command: npm run build
Build output directory: dist
Root directory: /
```

### 2.3 Environment Variables

Add these in Cloudflare Pages → Settings → Environment Variables:

```bash
# Supabase (Required)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# R2 Image Storage (Optional - for menu images)
VITE_R2_PUBLIC_URL=https://your-bucket.your-account-id.r2.dev
VITE_API_URL=https://your-worker.workers.dev
```

---

## Step 3: Cloudflare R2 Setup (Optional - for menu images)

### 3.1 Create R2 Bucket

1. In Cloudflare Dashboard → **R2**
2. Click **Create bucket**
3. Name: `chiyadani-images`
4. Location: Auto (or nearest to customers)

### 3.2 Enable Public Access

1. Go to bucket settings
2. Enable **Public access**
3. Note the public URL: `https://chiyadani-images.YOUR_ACCOUNT_ID.r2.dev`

### 3.3 Deploy Image Upload Worker

```bash
cd workers
npm install -g wrangler
wrangler login
wrangler deploy
```

---

## Step 4: Deploy

### Automatic Deployment

Cloudflare Pages automatically deploys on push:

```bash
git add .
git commit -m "Deploy to production"
git push origin main
```

### Custom Domain (Optional)

1. In Pages → Custom domains
2. Add your domain
3. Follow DNS instructions

---

## Monitoring & Optimization

### Performance Tips

1. **Image Optimization**
   - All images auto-convert to WebP
   - Lazy loading enabled by default
   - Responsive srcset for different screen sizes

2. **Caching Strategy**
   - Static assets: 1 year cache
   - Images: 1 year cache (immutable)
   - API responses: Edge cached

3. **Database Optimization**
   - Indexes created automatically via schema.sql
   - Use Supabase connection pooling for high traffic

### Monitoring

- **Cloudflare Analytics**: Real-time traffic stats
- **Supabase Dashboard**: Database metrics, realtime connections
- **R2 Metrics**: Storage and bandwidth usage

---

## Cost Estimation

| Traffic Level | Monthly Cost |
|---------------|--------------|
| 0 - 10,000 visitors | $0 (Free) |
| 10,000 - 50,000 visitors | $0 (Free) |
| 50,000 - 100,000 visitors | ~$5 (R2 overage) |
| 100,000+ visitors | ~$20-50 |

---

## Troubleshooting

### Common Issues

1. **"Cannot connect to cloud" Error**
   - Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set
   - Verify database tables exist (run schema.sql)
   - Check browser console for specific errors

2. **Realtime Not Working**
   - Ensure tables are added to supabase_realtime publication
   - Check Supabase Dashboard → Database → Replication

3. **Image Upload Fails**
   - Verify R2 API token permissions
   - Check VITE_API_URL points to your worker

4. **CORS Errors**
   - Ensure Worker has correct CORS headers
   - Check R2 bucket CORS settings

### Support

- Cloudflare: [community.cloudflare.com](https://community.cloudflare.com)
- Supabase: [github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions)

---

## Quick Reference

```bash
# Local development
npm run dev

# Production build
npm run build

# Deploy to Cloudflare (auto on push)
git push origin main

# Check Wrangler logs (for image worker)
cd workers && wrangler tail
```

**Your app is now ready to serve 50,000+ customers for FREE!** 🎉
