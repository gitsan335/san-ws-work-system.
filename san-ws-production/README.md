# SAN WS WORK SYSTEM v1.0

WhatsApp Group Operations Management — multi-user web app.

## Deploy to Vercel

See **[DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md)** for full step-by-step instructions.

You need:
1. Free PostgreSQL (Neon.tech or Vercel Postgres)
2. GitHub account
3. Vercel account

## Local development

For local use only, you can temporarily set schema provider to `sqlite` and:

```bash
DATABASE_URL="file:./dev.db"
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Production / Vercel **requires PostgreSQL**.

## Demo logins

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@sanws.local | Admin@ChangeMe1 |
| Worker | james@sanws.local | Worker@123 |

Change passwords before real use. Demo operations are marked for deletion.
