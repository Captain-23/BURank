# Deploy & Operations Runbook

This app serves the leaderboard from a Postgres **cache** that a scheduled
GitHub Action refreshes every ~30 min. Browser-facing routes never call
LeetCode or Google Sheets directly. Follow these steps once to go live.

---

## 1. Environment variables

Set these on your host (e.g. Vercel → Project → Settings → Environment Variables).
See `.env.local.example` for the full annotated list.

| Variable | Required | What it is |
|---|---|---|
| `DATABASE_URL` | ✅ | Postgres connection string (Prisma + NextAuth + cache) |
| `NEXTAUTH_SECRET` | ✅ | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | ✅ | Deployed base URL, e.g. `https://burank.vercel.app` |
| `RESEND_API_KEY` | ✅ | Resend key for magic-link email |
| `EMAIL_FROM` | ✅ | e.g. `BURank <noreply@yourdomain.com>` |
| `ADMIN_PASSWORD` | ✅ | Admin dashboard password |
| `ADMIN_SESSION_SECRET` | ▲ recommended | `openssl rand -base64 32` — signs the admin cookie. If unset, falls back to `ADMIN_PASSWORD`. Set a real one in prod. |
| `NEXT_PUBLIC_SHEET_CSV_URL` | ✅ | Published Google Sheet CSV export URL (read-only, public) |
| `SHEET_WRITE_URL` | ✅ | Apps Script web-app URL. **Renamed from `NEXT_PUBLIC_SHEET_WRITE_URL`** so it stays server-only. |
| `SHEET_WRITE_SECRET` | ▲ recommended | `openssl rand -base64 32` — shared secret that locks the sheet-write endpoint. Must match the value in `google-apps-script.js`. |
| `CRON_SECRET` | ✅ | `openssl rand -base64 32` — Bearer secret for `/api/cron/ingest` |
| `SITE_URL` | ✅ | Same as `NEXTAUTH_URL`; the refresh runner POSTs here |
| `NEXT_PUBLIC_COLLEGE_NAME` | optional | Display name, default "Bennett University" |

> **Migrating from an older deploy:** rename `NEXT_PUBLIC_SHEET_WRITE_URL` → `SHEET_WRITE_URL`.
> (The code still reads the old name as a fallback, but renaming keeps the URL out of the browser bundle.)

---

## 2. Apply the database migration

The cache tables (`UserStat`, `Setting`) ship as a committed migration but are
**not applied automatically**. Run once against the production database:

```bash
# with the production DATABASE_URL in your env:
npx prisma migrate deploy
```

On Vercel you can instead set the Build Command to:
`prisma generate && prisma migrate deploy && next build`

---

## 3. Update the Google Apps Script (one time)

1. Open your Sheet → Extensions → Apps Script, paste the latest `google-apps-script.js`.
2. If locking the endpoint: set `const SHEET_WRITE_SECRET = "..."` at the top to the
   **same value** as the app's `SHEET_WRITE_SECRET` env var.
3. **Existing sheets only:** the writer now includes an `email` column. If your
   `users` tab predates this, insert a blank column B titled `email`
   (right-click column B → Insert 1 left) before deploying, so existing rows line
   up with `[username, email, addedAt, yearStudying, enrollmentNo, password]`.
4. Deploy → Manage deployments → edit → **New version**.

---

## 4. Add GitHub Actions secrets (for the 30-min refresh)

Repo → Settings → Secrets and variables → Actions → New repository secret:

- `NEXT_PUBLIC_SHEET_CSV_URL`
- `SITE_URL`
- `CRON_SECRET` (must equal the app's `CRON_SECRET`)

---

## 5. First run — populate the cache

Until the cron runs once, `UserStat` is empty and the leaderboard shows nothing.
Trigger it manually: repo → Actions → **Refresh leaderboard cache** → Run workflow.

Or run locally with the same env set:

```bash
npm run refresh
```

---

## 6. Verify end-to-end

- Load the site → leaderboard populates from Postgres.
- Sign in with a magic link (any email — the Bennett-domain gate is currently disabled).
- `/admin` → log in with `ADMIN_PASSWORD`, set a Question of the Week, confirm it appears.
- Register a new user → they appear immediately (cache is upserted + invalidated on register).

---

## How it works (quick reference)

```
GitHub Action (every 30 min)
   └─ scripts/refresh.ts
        ├─ reads roster from Google Sheet CSV
        ├─ fetches LeetCode stats (throttled)
        ├─ computes First Blood
        └─ POST /api/cron/ingest  (Bearer CRON_SECRET)
               └─ bulk upsert UserStat + Setting, reconcile deletes,
                  revalidate caches

Browser
   └─ /api/leaderboard, /api/qotw, /card/[enrollment]
        └─ fast Postgres reads, served from Data Cache
           (invalidated on ingest / register / admin actions)
```
