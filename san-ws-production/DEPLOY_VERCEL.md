# Deploy SAN WS WORK SYSTEM to Vercel

You cannot deploy from this chat directly — Vercel needs **your** account.
Follow these steps (about 10–15 minutes).

---

## Step 1 — Free PostgreSQL database (Neon)

1. Go to https://neon.tech and sign up (free).
2. Create a project (e.g. `san-ws`).
3. Copy the **connection string** (looks like):
   `postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`

---

## Step 2 — Put the code on GitHub

1. Create a new empty repo on https://github.com (e.g. `san-ws-work-system`).
2. On your computer:

```bash
unzip san-ws-work-system-source.zip
cd san-ws-src
git init
git add .
git commit -m "SAN WS WORK SYSTEM v1.0"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/san-ws-work-system.git
git push -u origin main
```

---

## Step 3 — Deploy on Vercel

1. Go to https://vercel.com and sign in (GitHub login is easiest).
2. **Add New Project** → import your `san-ws-work-system` repo.
3. Before deploying, open **Environment Variables** and add:

| Name | Value |
|------|--------|
| `DATABASE_URL` | Your Neon connection string |
| `AUTH_SECRET` | Run `openssl rand -base64 32` and paste the result |
| `NODE_ENV` | `production` |

4. Click **Deploy**.

---

## Step 4 — Create tables and seed data

After the first deploy succeeds:

```bash
# On your computer, in the project folder:
export DATABASE_URL="your-neon-connection-string"
npx prisma db push
npm run db:seed
```

Or use Vercel’s CLI:

```bash
npm i -g vercel
vercel login
vercel env pull
npx prisma db push
npm run db:seed
```

---

## Step 5 — Open your site

Vercel will show a URL like:

`https://san-ws-work-system.vercel.app`

### Login

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@sanws.local | Admin@ChangeMe1 |
| Worker | james@sanws.local | Worker@123 |

**Change these passwords after first login.**

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Build fails on Prisma | Ensure `DATABASE_URL` is set in Vercel env vars |
| Login fails after deploy | Run `prisma db push` and `db:seed` against Neon |
| 500 errors | Check Vercel → Project → Logs |

---

## Optional: Vercel Postgres instead of Neon

Vercel Dashboard → Storage → Create Database → Postgres  
Copy `DATABASE_URL` into the same environment variables.
