# BURank — Scalable Cache Architecture + UI Redesign

**Date:** 2026-07-04
**Status:** Approved design, pending implementation plan

This spec covers two independent workstreams agreed with the maintainer:

- **A. Scalable cron + cache backend** — stop hitting LeetCode on every page load; serve reads from Postgres, refreshed by a scheduled job.
- **B. Light-theme UI redesign** — new leaderboard and profile pages, matching approved mockups.

They can be built and shipped independently. Approved mockups are preserved at:
- `docs/superpowers/specs/assets/leaderboard-redesign.html`
- `docs/superpowers/specs/assets/profile-redesign.html`

---

## Workstream A — Scalable cron + cache

### Problem
Today `/api/leaderboard` is `force-dynamic, revalidate=0` and fetches every registered user from LeetCode's GraphQL API on **every request** (serial chunks of 5). `/card/[enrollment]` refetches **all** users to rank one person. This blows Vercel's 10s function limit past ~50 users and gets the serverless IP rate-limited by LeetCode. "First Blood" is also computed as a **write during a GET**.

### Approved decisions
- **Cache store:** Postgres via Prisma (already provisioned for NextAuth). No new infra.
- **Refresh mechanism:** GitHub Actions, every ~30 min (works on Vercel free plan; flexible interval).
- **Fetching location:** in the **Actions runner**, not a Vercel route — avoids the 10s function timeout entirely.
- **Roster source of truth:** the Google Sheet stays the human-editable roster. Postgres is a cache of stats + roster metadata.

### Architecture
```
GitHub Actions (cron: */30 * * * *)
   → runs scripts/refresh.mjs in the runner
        · reads roster from the published Google Sheet CSV
        · fetches LeetCode stats per user (throttled) + submission calendar (see note)
        · computes "First Blood" for the current QOTW
        · POSTs the finished rows + settings to /api/cron/ingest  (Authorization: Bearer CRON_SECRET)
                                        │
                                        ▼
                          /api/cron/ingest  →  bulk upsert UserStat + Setting, reconcile deletes
                                        │
                                        ▼
                                    Postgres
                                        ▲
   Browser → /api/leaderboard ──────────┘   single fast prisma.userStat.findMany()
   Browser → /api/qotw, /card ──────────┘   read Setting / UserStat only
```

Vercel only ever does a **fast DB write** (ingest) and **fast DB reads** (pages). No page path touches LeetCode or Sheets.

### Data model (Prisma / Postgres)
```prisma
model UserStat {
  username             String   @id
  realName             String?
  avatar               String?
  ranking              Int?
  totalSolved          Int      @default(0)
  easySolved           Int      @default(0)
  mediumSolved         Int      @default(0)
  hardSolved           Int      @default(0)
  contestRating        Int      @default(0)
  contestGlobalRanking Int      @default(0)
  attendedContestsCount Int     @default(0)
  topPercentage        Float    @default(100)
  // roster metadata mirrored from the sheet
  email                String?
  enrollmentNo         String?
  yearStudying         String?
  addedAt              String?
  // health
  fetchError           Boolean  @default(false)
  lastFetchedAt        DateTime?
  updatedAt            DateTime @updatedAt
}

model Setting {          // qotw_url, qotw_timestamp, first_blood
  key   String @id
  value String
}
```
YAGNI: current-snapshot only (one row per user). A history table can be added later on this shape if we want progress charts; out of scope now.

### Component changes
| Component | Before | After |
|---|---|---|
| `/api/leaderboard` | sheet + N× LeetCode, force-dynamic | `prisma.userStat.findMany()` sorted — instant |
| `/api/qotw` | GAS GET per call | reads `Setting` rows from Postgres |
| `/card/[enrollment]` | refetches all users' LeetCode | reads `UserStat` from Postgres |
| First Blood | written during a GET | computed only in the refresh job |
| `scripts/refresh.mjs` (new) | — | Actions job: sheet → LeetCode → compute → POST ingest |
| `/api/cron/ingest` (new) | — | Bearer-auth'd bulk upsert + reconcile |
| `.github/workflows/refresh.yml` (new) | — | `schedule: */30 * * * *` runs the script |
| Admin "Set QOTW" | writes GAS settings tab | writes `Setting` in Postgres |

### Key behaviors
- **Failure handling:** if a user's LeetCode fetch fails during a run, keep their last-good `UserStat` row and set `fetchError = true`; do **not** overwrite good stats with zeros. New users that have never fetched successfully appear with `fetchError` until a run succeeds.
- **Reconciliation:** the ingest deletes `UserStat` rows whose username is no longer present in the sheet roster (propagates sheet/admin deletes).
- **Instant appearance on register:** on a successful `/api/auth/register`, do one LeetCode fetch for that username and upsert its `UserStat` immediately, so the user shows up without waiting for the next cron run.
- **QOTW:** admin writes `qotw_url` / `qotw_timestamp` to `Setting`; the cron computes `first_blood` (earliest solver of the QOTW slug after `qotw_timestamp`) and writes it to `Setting`.
- **Streak (optional, deferred):** the profile heatmap and any "Longest Streak" highlight need the submission calendar. The refresh script may fetch the calendar per user (extra request each). Keep it out of the first cut unless cheap; profile page can fetch its own user's calendar on demand instead.

### Prerequisite bug fix (folded in)
The refresh job depends on reading the sheet correctly, but today the reader (`src/lib/sheets.ts`, `[username, email, addedAt, yearStudying, enrollmentNo]`) and the Apps Script writer (`google-apps-script.js`, `[username, addedAt, yearStudying, enrollmentNo, password]` — no `email` column) disagree on column layout. Align them: add an `email` column to the Apps Script writer + header and fix the reader's column order so they share one schema. This is required for the cron to populate `email`/`enrollmentNo`/`yearStudying` correctly.

### Security / config
- New env var **`CRON_SECRET`** shared between the Action and `/api/cron/ingest`. Ingest rejects requests without a matching `Authorization: Bearer` header.
- The Action needs the deployed base URL and the existing `NEXT_PUBLIC_SHEET_CSV_URL` (roster read).
- Complete `.env.local.example` so the project is actually deployable (currently missing `DATABASE_URL`, `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_PASSWORD`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, and now `CRON_SECRET`).

### Out of scope (noted follow-ups, not this spec)
The earlier code review flagged three security issues unrelated to caching: the forgeable static `admin_session` cookie, `isBennettEmail()` hardcoded to `true`, and the `NEXT_PUBLIC_` write URL exposing the unauthenticated Apps Script endpoint. These are **not** part of this spec but should be a fast follow-up pass.

---

## Workstream B — Light-theme UI redesign

Convert the app from the current dark theme to a **light theme** across the whole app (approved). Two pages are specced from mockups; other surfaces (admin, auth pages, emails, SVG card) follow the same tokens in the implementation plan.

### Design tokens
- **Ground:** continuous vertical gradient grey→white (grey confined to the top ~720px, white below). Cards `#FFFFFF`.
- **Ink:** `#14141C` / secondary `#3D3D4C` / sub `#71718A` / muted `#A6A6B8`.
- **Lines:** `#E7E8EE` / `#EFF0F4`.
- **Accent:** deep navy **`#1B2A4A`** (replaces the old Bennett red everywhere — no red brand).
- **Rank metals:** gold `#E0A93B`, silver `#98A2B3`, bronze `#C08457`.
- **Difficulty:** easy `#00A98F`, medium `#E0972B`, hard `#E24A47`.
- **Type:** system sans (`-apple-system`/SF Pro/system-ui) for UI; mono (SF Mono/JetBrains Mono) for all figures. `tabular-nums` throughout.
- **Gradient accent** (usernames/handles): linear `#2E9BF0 → #C24BE0`.

### Leaderboard page
- **Navbar:** a **search bar** on the left (replaces the BUrank wordmark — leaderboard only), placeholder "Search coders, usernames, batches…"; Refresh + "Join Leaderboard" (navy) on the right. Segmented **Individuals / Batch Wars** toggle centered below.
- **Champions podium:** three **equal-height** cards, ordered **1 → 2 → 3** left to right (no staircase). Each: holographic pastel gradient band on top, **flat-top (90°) hexagon** avatar with a white ring overlapping the band, big italic **1st/2nd/3rd** corner numeral, name (no verified tick), **username** as the gradient subtitle, three stats (Solved / Contest / E·M·H one line), a **single best-badge tag** (e.g. `🛡 Guardian`, `⚔️ Knight`) on the right, and an outlined **Profile** button pinned to the bottom.
- **Highlight cards row:** four cards — **Most Solved · Top Contest Rating · Most Hard Solved · First Blood (QOTW)** — each with a small avatar, label, name, and value.
- **Ranked table ("bars"):** full-width rows rendered as **rounded parallelograms** (skewX with border-radius + thin outline). **Rank number inside** each bar on the left. Columns: Coder (avatar + name + `@handle`), Badges, Batch, Solved, E/M/H, Contest, Global, **Top Badge** (single tag), chevron. **Grey vertical dividers** between identity / stats / badge groups. **Top-3** get gold/silver/bronze outlines; the rest thin grey. **No shadow** on bars. Header sits above with a gap; the badge column header label is hidden.
- **Cursor:** default across the page; **pointer only on a bar** (each bar opens that coder's full profile).
- **Score model:** the leaderboard ranks by **total solved** (headline metric); the on-bar "Top Badge" is the coder's best LeetCode badge, not a numeric score.

### Profile page (`/user/[username]`)
Light-theme recreation of the current dark profile:
- **Header card:** avatar, name, gradient `@handle`, a **Global Rank** pill and a **Batch** pill, and **Contest Rating** / **Contests Attended** stacked on the right.
- **Total Solved** card (big mono number) + **Difficulty Breakdown** card (Easy/Medium/Hard horizontal bars with counts, in teal/amber/red on a light track).
- **Submission Calendar** card: 12-month heatmap (green scale on light, Less→More legend), horizontally scrollable.
- **Navbar keeps the BUrank wordmark** here (BU ink, *rank* navy) plus the search bar and a "← Leaderboard" link.

### Responsiveness
- Podium stacks to one column (1st on top) on narrow screens.
- Highlight cards go 2-up; the ranked table scrolls horizontally inside its own container (page body never scrolls sideways).
- Profile header stacks; the middle row collapses to one column.

### Notes for implementation
- The mockups use placeholder avatars/data; real LeetCode avatars and computed badges (`computeBadges()`) slot into the same slots.
- The "best badge" tag maps to the top of the existing badge computation; expose a single "best" badge per user.
- Keep the difficulty/rank/gradient colors as named CSS variables so the whole app can share them.

---

## Testing
- **Backend:** unit-test the sheet CSV parser and the leaderboard sort/rank + First-Blood computation against fixtures; a smoke test that `/api/cron/ingest` upserts and reconciles a small roster; verify `/api/leaderboard` returns cached rows with zero LeetCode calls.
- **Frontend:** visual check against the two mockups at desktop + mobile widths; verify the ranked table doesn't cause horizontal page scroll and that only bars are pointer targets.
- **CI:** add a GitHub Actions workflow running lint + build (there is currently no CI, only issue templates).

## Sequencing
1. Prerequisite: align the sheet column schema (reader + Apps Script).
2. Backend A: Prisma models → ingest route → refresh script → workflow → switch reads to Postgres → register instant-upsert → move QOTW to `Setting`.
3. Frontend B: theme tokens → leaderboard page → profile page → remaining surfaces (admin/auth/email/SVG card) → responsive pass.
4. Follow-up (separate): the three security fixes noted above; CI lint+build.

## Open items
- Whether to fetch the submission calendar in the refresh job (for a "Longest Streak" highlight) or on-demand on the profile page. Default: on-demand on the profile page for now.
