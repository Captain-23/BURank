# Scalable Cron + Cache Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop hitting LeetCode/Sheets on every page load — serve all reads from Postgres, refreshed every ~30 min by a GitHub Actions job that POSTs stats into a Bearer-authed ingest endpoint.

**Architecture:** A GitHub Actions runner runs `scripts/refresh.ts` (via `tsx`): it reads the roster from the published Google Sheet CSV, fetches each user's LeetCode stats (throttled), computes "First Blood", and POSTs the finished rows + settings to `/api/cron/ingest` (`Authorization: Bearer CRON_SECRET`). Ingest bulk-upserts `UserStat`/`Setting` in Postgres and reconciles deletes. Every browser-facing route (`/api/leaderboard`, `/api/qotw`, `/card/[enrollment]`) then does only fast Postgres reads — no route ever touches LeetCode or Sheets again.

**Tech Stack:** Next.js 14 App Router, Prisma 6 + Postgres (already provisioned for NextAuth), `tsx` for the runner script, GitHub Actions cron, Vitest for pure-logic unit tests.

**Reference spec:** `docs/superpowers/specs/2026-07-04-scalable-cache-and-ui-redesign-design.md` (Workstream A).

---

## File Structure

**New files:**
- `src/lib/roster.ts` — pure `parseRosterCsv(csv)` → `SheetEntry[]` (extracted from `sheets.ts`, unit-tested, importable by the runner).
- `src/lib/roster.test.ts` — tests for `parseRosterCsv`.
- `src/lib/first-blood.ts` — pure `computeFirstBlood(users, qotwUrl, qotwTimestamp)` → `string | null` (extracted from the leaderboard route, unit-tested, used by the runner).
- `src/lib/first-blood.test.ts` — tests for `computeFirstBlood`.
- `src/lib/ingest-reconcile.ts` — pure `computeStaleUsernames(existing, incoming)` → `string[]`.
- `src/lib/ingest-reconcile.test.ts` — tests for `computeStaleUsernames`.
- `src/app/api/cron/ingest/route.ts` — Bearer-authed bulk upsert + reconcile + settings write.
- `scripts/refresh.ts` — the Actions runner: sheet → LeetCode → compute → POST ingest.
- `.github/workflows/refresh.yml` — `schedule: */30 * * * *` runs the runner.
- `.github/workflows/ci.yml` — lint + test + build on push/PR.

**Modified files:**
- `google-apps-script.js` — add an `email` column to the writer + header; read `body.email`.
- `src/lib/sheets.ts` — use `parseRosterCsv`; remove now-dead GAS QOTW/first-blood helpers.
- `src/lib/leetcode.ts` — change `import { LeetCodeUser }` to `import type` so the runner can import it under `tsx` without alias resolution at runtime.
- `prisma/schema.prisma` — add `UserStat` + `Setting` models (+ a migration).
- `src/app/api/leaderboard/route.ts` — read from `UserStat` (no LeetCode/Sheets).
- `src/app/api/qotw/route.ts` — read from `Setting`.
- `src/app/card/[enrollment]/route.ts` — read from `UserStat`.
- `src/app/api/auth/register/route.ts` — after a successful sheet add, upsert the just-fetched user into `UserStat` for instant appearance.
- `src/app/api/admin/action/route.ts` — `set_qotw` writes `Setting` in Postgres (+ instant Postgres delete on `delete`).
- `.env.local.example` — complete the deployable env var set (add `CRON_SECRET`, `SITE_URL`, etc.).
- `package.json` — add `tsx` dev dependency + a `refresh` script.

---

## Task 1: Align the sheet column schema (prerequisite bug fix)

The reader (`sheets.ts`) expects columns `[username, email, addedAt, yearStudying, enrollmentNo]`, but the Apps Script writer appends `[username, addedAt, yearStudying, enrollmentNo, password]` — no `email` column — so every field the reader pulls after `username` is shifted by one. Fix the writer to include `email` as column 2, matching the reader. The reader already has the correct order and needs no change here.

**Files:**
- Modify: `google-apps-script.js:52-90`

- [ ] **Step 1: Add the `email` column to the sheet header and the append row**

In `google-apps-script.js`, change the header creation (currently line 57):

```javascript
    // Create sheet with headers if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.getRange(1, 1, 1, 6).setValues([["username", "email", "addedAt", "yearStudying", "enrollmentNo", "password"]]);
    }
```

Change the `add` block to read `body.email` and append it as column 2 (replace the block currently at lines 71-90):

```javascript
    // Default 'add' logic below
    const email = (body.email || "").trim().toLowerCase();
    const addedAt = body.addedAt || new Date().toISOString();
    const yearStudying = body.yearStudying || "";
    const enrollmentNo = (body.enrollmentNo || "").trim().toUpperCase();
    const password = body.password || "";

    // Check for duplicates
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).toLowerCase() === username) {
        return jsonResponse({ status: "duplicate", message: "LeetCode username already exists." });
      }
      if (data[i][4] && String(data[i][4]).toUpperCase() === enrollmentNo) {
        return jsonResponse({ status: "duplicate", message: "Enrollment number already registered." });
      }
    }

    // Append new row: [username, email, addedAt, yearStudying, enrollmentNo, password]
    sheet.appendRow([username, email, addedAt, yearStudying, enrollmentNo, password]);
    return jsonResponse({ status: "success", message: "Added successfully." });
```

Note the enrollment duplicate check moved from `data[i][3]` to `data[i][4]` because `enrollmentNo` is now column 5 (index 4).

- [ ] **Step 2: Document the one-time production migration**

At the top of `google-apps-script.js`, inside the setup comment block, append this line after the existing numbered steps (before the closing `*/`):

```javascript
 *  IMPORTANT — migrating an existing sheet:
 *  If your "users" tab already has data in the OLD layout
 *  [username, addedAt, yearStudying, enrollmentNo, password],
 *  insert a new blank column B titled "email" (Right-click column B → Insert 1 left)
 *  BEFORE deploying this version, so existing rows line up with the new
 *  [username, email, addedAt, yearStudying, enrollmentNo, password] schema.
```

- [ ] **Step 3: Verify no code references the old column indices**

Run: `grep -n "data\[i\]\[3\]\|1, 1, 1, 5" google-apps-script.js`
Expected: no matches (both the old header width `1, 1, 1, 5` and the old enrollment index `data[i][3]` are gone).

- [ ] **Step 4: Commit**

```bash
git add google-apps-script.js
git commit -m "fix(sheet): add email column to Apps Script writer to match reader schema"
```

---

## Task 2: Extract a pure, testable roster CSV parser

Pull the CSV-parsing logic out of `fetchUsernamesFromSheet` into a pure function so it can be unit-tested and imported by the runner script.

**Files:**
- Create: `src/lib/roster.ts`
- Test: `src/lib/roster.test.ts`
- Modify: `src/lib/sheets.ts:61-95`

- [ ] **Step 1: Write the failing test**

Create `src/lib/roster.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { parseRosterCsv } from "./roster";

describe("parseRosterCsv", () => {
  it("parses rows and lowercases username/email", () => {
    const csv =
      "username,email,addedAt,yearStudying,enrollmentNo\n" +
      "NealWu,Neal@BU.edu,2026-01-01,3rd,E21CSE001\n";
    const rows = parseRosterCsv(csv);
    expect(rows).toEqual([
      {
        username: "nealwu",
        email: "neal@bu.edu",
        addedAt: "2026-01-01",
        yearStudying: "3rd",
        enrollmentNo: "E21CSE001",
      },
    ]);
  });

  it("skips the header and blank/empty-username rows", () => {
    const csv = "username,email,addedAt,yearStudying,enrollmentNo\n,,,,\nbob,b@x.com,,,\n";
    const rows = parseRosterCsv(csv);
    expect(rows.map((r) => r.username)).toEqual(["bob"]);
  });

  it("tolerates short rows by defaulting missing fields to empty string", () => {
    const csv = "username,email,addedAt,yearStudying,enrollmentNo\nalice\n";
    const rows = parseRosterCsv(csv);
    expect(rows[0]).toEqual({
      username: "alice",
      email: "",
      addedAt: "",
      yearStudying: "",
      enrollmentNo: "",
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- roster`
Expected: FAIL — `Cannot find module './roster'`.

- [ ] **Step 3: Create the implementation**

Create `src/lib/roster.ts`:

```typescript
import type { SheetEntry } from "@/types";

/**
 * Parses the published Google Sheet CSV into roster entries.
 * Expected columns: username, email, addedAt, yearStudying, enrollmentNo
 * (a trailing `password` column, if present, is ignored).
 * Pure and dependency-free so it can be unit-tested and run outside Next.js.
 */
export function parseRosterCsv(csv: string): SheetEntry[] {
  const lines = csv.trim().split("\n").slice(1); // drop header
  return lines
    .map((line) => {
      const [username, email, addedAt, yearStudying, enrollmentNo] = line
        .split(",")
        .map((v) => v.trim());
      return {
        username: username?.toLowerCase() ?? "",
        email: email?.toLowerCase() ?? "",
        addedAt: addedAt ?? "",
        yearStudying: yearStudying ?? "",
        enrollmentNo: enrollmentNo ?? "",
      };
    })
    .filter((e) => e.username && e.username.length > 0);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- roster`
Expected: PASS (3 tests).

- [ ] **Step 5: Refactor `fetchUsernamesFromSheet` to use it**

In `src/lib/sheets.ts`, add the import at the top (after the existing `SheetEntry` import line):

```typescript
import { parseRosterCsv } from "./roster";
```

Replace the body of `fetchUsernamesFromSheet` (lines 61-95) with:

```typescript
export async function fetchUsernamesFromSheet(): Promise<SheetEntry[]> {
  if (!SHEET_CSV_URL) {
    console.warn("NEXT_PUBLIC_SHEET_CSV_URL not set");
    return [];
  }

  try {
    const res = await fetch(`${SHEET_CSV_URL}&cachebust=${Date.now()}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status}`);
    return parseRosterCsv(await res.text());
  } catch (err) {
    console.error("fetchUsernamesFromSheet error:", err);
    return [];
  }
}
```

- [ ] **Step 6: Verify the build still passes**

Run: `DATABASE_URL="postgresql://x:x@localhost:5432/x" RESEND_API_KEY="x" EMAIL_FROM="x@x.com" NEXTAUTH_SECRET="x" NEXTAUTH_URL="http://localhost:3000" npm run build`
Expected: build completes with no errors.

- [ ] **Step 7: Commit**

```bash
git add src/lib/roster.ts src/lib/roster.test.ts src/lib/sheets.ts
git commit -m "refactor(sheets): extract pure parseRosterCsv with tests"
```

---

## Task 3: Extract a pure, testable First Blood computation

Move the "earliest solver of the QOTW slug" logic out of the leaderboard route into a pure function the runner can call.

**Files:**
- Create: `src/lib/first-blood.ts`
- Test: `src/lib/first-blood.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/first-blood.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { computeFirstBlood } from "./first-blood";

const QOTW_URL = "https://leetcode.com/problems/two-sum/";
const QOTW_TS = "2026-01-01T00:00:00.000Z"; // => unix 1767225600

describe("computeFirstBlood", () => {
  it("returns the earliest solver at/after the qotw timestamp", () => {
    const users = [
      { username: "late", recentSubmissions: [{ titleSlug: "two-sum", timestamp: "1767230000" }] },
      { username: "early", recentSubmissions: [{ titleSlug: "two-sum", timestamp: "1767225601" }] },
    ];
    expect(computeFirstBlood(users, QOTW_URL, QOTW_TS)).toBe("early");
  });

  it("ignores submissions before the qotw timestamp", () => {
    const users = [
      { username: "before", recentSubmissions: [{ titleSlug: "two-sum", timestamp: "1767220000" }] },
    ];
    expect(computeFirstBlood(users, QOTW_URL, QOTW_TS)).toBeNull();
  });

  it("ignores submissions for other problems", () => {
    const users = [
      { username: "other", recentSubmissions: [{ titleSlug: "add-two-numbers", timestamp: "1767230000" }] },
    ];
    expect(computeFirstBlood(users, QOTW_URL, QOTW_TS)).toBeNull();
  });

  it("returns null when url or timestamp is missing", () => {
    const users = [{ username: "x", recentSubmissions: [{ titleSlug: "two-sum", timestamp: "1767230000" }] }];
    expect(computeFirstBlood(users, "", QOTW_TS)).toBeNull();
    expect(computeFirstBlood(users, QOTW_URL, "")).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- first-blood`
Expected: FAIL — `Cannot find module './first-blood'`.

- [ ] **Step 3: Create the implementation**

Create `src/lib/first-blood.ts`:

```typescript
interface SubmissionUser {
  username: string;
  recentSubmissions?: { titleSlug: string; timestamp: string }[];
}

/**
 * Returns the username of the earliest person to solve the QOTW problem
 * at or after `qotwTimestamp`, or null if none / inputs missing.
 * Pure and dependency-free so it can be unit-tested and run outside Next.js.
 */
export function computeFirstBlood(
  users: SubmissionUser[],
  qotwUrl: string,
  qotwTimestamp: string,
): string | null {
  if (!qotwUrl || !qotwTimestamp) return null;

  const match = qotwUrl.match(/problems\/([^/]+)/);
  const titleSlug = match ? match[1] : null;
  if (!titleSlug) return null;

  const qotwTime = new Date(qotwTimestamp).getTime() / 1000;
  if (Number.isNaN(qotwTime)) return null;

  let earliestSolver: string | null = null;
  let earliestTime = Infinity;

  for (const user of users) {
    if (!user.recentSubmissions) continue;
    for (const submission of user.recentSubmissions) {
      if (submission.titleSlug !== titleSlug) continue;
      const t = parseInt(submission.timestamp, 10);
      if (t >= qotwTime && t < earliestTime) {
        earliestTime = t;
        earliestSolver = user.username;
      }
    }
  }

  return earliestSolver;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- first-blood`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/first-blood.ts src/lib/first-blood.test.ts
git commit -m "feat(lib): pure computeFirstBlood with tests"
```

---

## Task 4: Pure reconcile helper for the ingest route

The ingest endpoint deletes `UserStat` rows whose username is no longer in the incoming roster. Extract that set-difference as a pure function.

**Files:**
- Create: `src/lib/ingest-reconcile.ts`
- Test: `src/lib/ingest-reconcile.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/ingest-reconcile.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { computeStaleUsernames } from "./ingest-reconcile";

describe("computeStaleUsernames", () => {
  it("returns usernames present in existing but not incoming", () => {
    expect(computeStaleUsernames(["a", "b", "c"], ["a", "c"])).toEqual(["b"]);
  });

  it("is case-insensitive", () => {
    expect(computeStaleUsernames(["Bob"], ["bob"])).toEqual([]);
  });

  it("returns empty when everything is still present", () => {
    expect(computeStaleUsernames(["a"], ["a", "b"])).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- ingest-reconcile`
Expected: FAIL — `Cannot find module './ingest-reconcile'`.

- [ ] **Step 3: Create the implementation**

Create `src/lib/ingest-reconcile.ts`:

```typescript
/**
 * Given the usernames currently in the DB and the usernames in the fresh
 * roster, returns the DB usernames that are no longer in the roster and
 * should be deleted. Case-insensitive.
 */
export function computeStaleUsernames(
  existing: string[],
  incoming: string[],
): string[] {
  const keep = new Set(incoming.map((u) => u.toLowerCase()));
  return existing.filter((u) => !keep.has(u.toLowerCase()));
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- ingest-reconcile`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/ingest-reconcile.ts src/lib/ingest-reconcile.test.ts
git commit -m "feat(lib): pure computeStaleUsernames reconcile helper with tests"
```

---

## Task 5: Add `UserStat` and `Setting` Prisma models

**Files:**
- Modify: `prisma/schema.prisma` (append at end, after `VerificationToken`)

- [ ] **Step 1: Append the models**

Add to the end of `prisma/schema.prisma`:

```prisma
model UserStat {
  username              String    @id
  realName              String?
  avatar                String?
  ranking               Int?
  totalSolved           Int       @default(0)
  easySolved            Int       @default(0)
  mediumSolved          Int       @default(0)
  hardSolved            Int       @default(0)
  contestRating         Int       @default(0)
  contestGlobalRanking  Int       @default(0)
  attendedContestsCount Int       @default(0)
  topPercentage         Float     @default(100)

  // roster metadata mirrored from the sheet
  email                 String?
  enrollmentNo          String?
  yearStudying          String?
  addedAt               String?

  // health
  fetchError            Boolean   @default(false)
  lastFetchedAt         DateTime?
  updatedAt             DateTime  @updatedAt

  @@index([totalSolved])
}

model Setting {
  key   String @id
  value String
}
```

- [ ] **Step 2: Hand-author the migration SQL (no DB available in this environment)**

There is no live database in this environment, so `prisma migrate dev` cannot run. Create the migration file manually so it's committed and ready to apply at deploy time. It follows Prisma's exact Postgres DDL conventions so a later `prisma migrate deploy` accepts it.

Create `prisma/migrations/20260704000000_add_cache_tables/migration.sql`:

```sql
-- CreateTable
CREATE TABLE "UserStat" (
    "username" TEXT NOT NULL,
    "realName" TEXT,
    "avatar" TEXT,
    "ranking" INTEGER,
    "totalSolved" INTEGER NOT NULL DEFAULT 0,
    "easySolved" INTEGER NOT NULL DEFAULT 0,
    "mediumSolved" INTEGER NOT NULL DEFAULT 0,
    "hardSolved" INTEGER NOT NULL DEFAULT 0,
    "contestRating" INTEGER NOT NULL DEFAULT 0,
    "contestGlobalRanking" INTEGER NOT NULL DEFAULT 0,
    "attendedContestsCount" INTEGER NOT NULL DEFAULT 0,
    "topPercentage" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "email" TEXT,
    "enrollmentNo" TEXT,
    "yearStudying" TEXT,
    "addedAt" TEXT,
    "fetchError" BOOLEAN NOT NULL DEFAULT false,
    "lastFetchedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserStat_pkey" PRIMARY KEY ("username")
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "UserStat_totalSolved_idx" ON "UserStat"("totalSolved");
```

- [ ] **Step 3: Regenerate the Prisma Client offline and verify the models**

Run: `DATABASE_URL="postgresql://x:x@localhost:5432/x" npx prisma generate`
Expected: "Generated Prisma Client" with no error (generate reads the schema; it does not connect).

Then verify the client exposes the new models:
Run: `node -e "const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();console.log(typeof p.userStat.findMany, typeof p.setting.upsert)"`
Expected: `function function`

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(db): add UserStat and Setting cache models"
```

> **Deferred (needs your DB):** this migration is committed but NOT applied here. At deploy time, run `npx prisma migrate deploy` against the production `DATABASE_URL` to create the tables.

---

## Task 6: Make `leetcode.ts` runner-importable

The runner imports `fetchLeetCodeUser`. That module imports `LeetCodeUser` as a value import, which forces `tsx` to resolve the `@/types` alias at runtime. Switching it to a type-only import lets `tsx`/esbuild erase it entirely.

**Files:**
- Modify: `src/lib/leetcode.ts:1`

- [ ] **Step 1: Change to a type-only import**

In `src/lib/leetcode.ts`, replace line 1:

```typescript
import type { LeetCodeUser } from "@/types";
```

- [ ] **Step 2: Verify the build still passes**

Run: `DATABASE_URL="postgresql://x:x@localhost:5432/x" RESEND_API_KEY="x" EMAIL_FROM="x@x.com" NEXTAUTH_SECRET="x" NEXTAUTH_URL="http://localhost:3000" npm run build`
Expected: build completes with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/leetcode.ts
git commit -m "refactor(leetcode): type-only import so the runner can import it"
```

---

## Task 7: The Bearer-authed ingest route

Accepts the runner's payload, bulk-upserts `UserStat` (preserving last-good stats on fetch errors), reconciles deletes, and upserts `Setting` rows.

**Files:**
- Create: `src/app/api/cron/ingest/route.ts`

- [ ] **Step 1: Create the route**

Create `src/app/api/cron/ingest/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeStaleUsernames } from "@/lib/ingest-reconcile";

export const dynamic = "force-dynamic";

interface IngestUser {
  username: string;
  realName?: string;
  avatar?: string;
  ranking?: number;
  totalSolved?: number;
  easySolved?: number;
  mediumSolved?: number;
  hardSolved?: number;
  contestRating?: number;
  contestGlobalRanking?: number;
  attendedContestsCount?: number;
  topPercentage?: number;
  email?: string;
  enrollmentNo?: string;
  yearStudying?: string;
  addedAt?: string;
  fetchError?: boolean;
}

interface IngestBody {
  users: IngestUser[];
  settings?: Record<string, string | null | undefined>;
}

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: IngestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const users = Array.isArray(body.users) ? body.users : [];
  if (users.length === 0) {
    return NextResponse.json({ error: "No users provided" }, { status: 400 });
  }

  const now = new Date();

  for (const u of users) {
    const username = u.username.toLowerCase();
    const meta = {
      realName: u.realName ?? null,
      avatar: u.avatar ?? null,
      ranking: u.ranking ?? null,
      email: u.email ?? null,
      enrollmentNo: u.enrollmentNo ?? null,
      yearStudying: u.yearStudying ?? null,
      addedAt: u.addedAt ?? null,
    };

    if (u.fetchError) {
      // Preserve last-good stats: update only metadata + the error flag.
      await prisma.userStat.upsert({
        where: { username },
        update: { ...meta, fetchError: true, lastFetchedAt: now },
        create: {
          username,
          ...meta,
          fetchError: true,
          totalSolved: 0,
          easySolved: 0,
          mediumSolved: 0,
          hardSolved: 0,
          contestRating: 0,
          contestGlobalRanking: 0,
          attendedContestsCount: 0,
          topPercentage: 100,
          lastFetchedAt: now,
        },
      });
    } else {
      const stats = {
        totalSolved: u.totalSolved ?? 0,
        easySolved: u.easySolved ?? 0,
        mediumSolved: u.mediumSolved ?? 0,
        hardSolved: u.hardSolved ?? 0,
        contestRating: u.contestRating ?? 0,
        contestGlobalRanking: u.contestGlobalRanking ?? 0,
        attendedContestsCount: u.attendedContestsCount ?? 0,
        topPercentage: u.topPercentage ?? 100,
      };
      await prisma.userStat.upsert({
        where: { username },
        update: { ...meta, ...stats, fetchError: false, lastFetchedAt: now },
        create: { username, ...meta, ...stats, fetchError: false, lastFetchedAt: now },
      });
    }
  }

  // Reconcile: delete rows whose username is no longer in the roster.
  const existing = (
    await prisma.userStat.findMany({ select: { username: true } })
  ).map((r) => r.username);
  const stale = computeStaleUsernames(
    existing,
    users.map((u) => u.username),
  );
  if (stale.length > 0) {
    await prisma.userStat.deleteMany({ where: { username: { in: stale } } });
  }

  // Settings: upsert any provided non-empty keys.
  if (body.settings) {
    for (const [key, value] of Object.entries(body.settings)) {
      if (value === undefined || value === null) continue;
      await prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    }
  }

  return NextResponse.json({
    ok: true,
    upserted: users.length,
    deleted: stale.length,
  });
}
```

- [ ] **Step 2: Verify the build compiles the new route**

Run: `DATABASE_URL="postgresql://x:x@localhost:5432/x" RESEND_API_KEY="x" EMAIL_FROM="x@x.com" NEXTAUTH_SECRET="x" NEXTAUTH_URL="http://localhost:3000" npm run build`
Expected: build output lists `ƒ /api/cron/ingest` and completes with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/cron/ingest/route.ts
git commit -m "feat(api): Bearer-authed cron ingest with upsert + reconcile"
```

---

## Task 8: The refresh runner script

Reads the roster, fetches LeetCode stats (throttled), computes First Blood, and POSTs everything to ingest. Run via `tsx` so it can import the shared TS modules.

**Files:**
- Create: `scripts/refresh.ts`
- Modify: `package.json` (add `tsx` dev dep + `refresh` script)

- [ ] **Step 1: Add `tsx` and a `refresh` script**

Run: `npm install --save-dev tsx`

Then in `package.json`, add to the `scripts` block:

```json
    "refresh": "tsx scripts/refresh.ts"
```

- [ ] **Step 2: Create the runner**

Create `scripts/refresh.ts`:

```typescript
import { parseRosterCsv } from "../src/lib/roster";
import { computeFirstBlood } from "../src/lib/first-blood";
import { fetchLeetCodeUser } from "../src/lib/leetcode";

const SHEET_CSV_URL = process.env.NEXT_PUBLIC_SHEET_CSV_URL;
const SITE_URL = process.env.SITE_URL;
const CRON_SECRET = process.env.CRON_SECRET;

const CHUNK = 5;
const DELAY_MS = 300;

async function main() {
  if (!SHEET_CSV_URL || !SITE_URL || !CRON_SECRET) {
    throw new Error(
      "Missing required env: NEXT_PUBLIC_SHEET_CSV_URL, SITE_URL, CRON_SECRET",
    );
  }

  // 1. Roster
  const csvRes = await fetch(`${SHEET_CSV_URL}&cachebust=${Date.now()}`, {
    cache: "no-store",
  });
  if (!csvRes.ok) throw new Error(`Sheet fetch failed: ${csvRes.status}`);
  const roster = parseRosterCsv(await csvRes.text());

  // Dedupe by username
  const seen = new Set<string>();
  const entries = roster.filter((e) => {
    if (seen.has(e.username)) return false;
    seen.add(e.username);
    return true;
  });

  // 2. Fetch LeetCode stats, throttled
  const users: Array<Record<string, unknown>> = [];
  for (let i = 0; i < entries.length; i += CHUNK) {
    const chunk = entries.slice(i, i + CHUNK);
    const results = await Promise.all(
      chunk.map(async (e) => {
        const u = await fetchLeetCodeUser(e.username);
        if (!u) {
          return {
            username: e.username,
            realName: e.username,
            avatar: "",
            ranking: 0,
            totalSolved: 0,
            easySolved: 0,
            mediumSolved: 0,
            hardSolved: 0,
            contestRating: 0,
            contestGlobalRanking: 0,
            attendedContestsCount: 0,
            topPercentage: 100,
            email: e.email,
            enrollmentNo: e.enrollmentNo,
            yearStudying: e.yearStudying,
            addedAt: e.addedAt,
            fetchError: true,
            recentSubmissions: [],
          };
        }
        return {
          ...u,
          email: e.email,
          enrollmentNo: e.enrollmentNo,
          yearStudying: e.yearStudying,
          addedAt: e.addedAt,
          fetchError: false,
        };
      }),
    );
    users.push(...results);
    if (i + CHUNK < entries.length) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }

  // 3. First Blood — read current QOTW settings from the deployed app.
  const qotwRes = await fetch(`${SITE_URL}/api/qotw`, { cache: "no-store" });
  const qotw = qotwRes.ok
    ? await qotwRes.json()
    : { qotw_url: "", qotw_timestamp: "", first_blood: "" };
  const firstBlood =
    qotw.first_blood ||
    computeFirstBlood(
      users as { username: string; recentSubmissions?: { titleSlug: string; timestamp: string }[] }[],
      qotw.qotw_url || "",
      qotw.qotw_timestamp || "",
    ) ||
    "";

  // 4. POST to ingest (strip recentSubmissions — not stored)
  const payload = {
    users: users.map(({ recentSubmissions, ...rest }) => rest),
    settings: { first_blood: firstBlood },
  };

  const res = await fetch(`${SITE_URL}/api/cron/ingest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CRON_SECRET}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Ingest failed: ${res.status} ${await res.text()}`);
  }

  console.log(
    `Refreshed ${users.length} users; first_blood=${firstBlood || "none"}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 3: Verify the runner runs under tsx and its imports resolve**

Run it with no env set — it must reach `main()` and fail on the env guard (not on a module-resolution error), which proves `tsx` resolved all three shared imports:

Run: `npx tsx scripts/refresh.ts; echo "exit=$?"`
Expected: prints `Error: Missing required env: NEXT_PUBLIC_SHEET_CSV_URL, SITE_URL, CRON_SECRET` and `exit=1` (NOT a `Cannot find module` / `Cannot find package` error).

- [ ] **Step 4: Commit**

```bash
git add scripts/refresh.ts package.json package-lock.json
git commit -m "feat(cron): refresh runner script (sheet -> leetcode -> ingest)"
```

---

## Task 9: The scheduled GitHub Actions workflow

**Files:**
- Create: `.github/workflows/refresh.yml`

- [ ] **Step 1: Create the workflow**

Create `.github/workflows/refresh.yml`:

```yaml
name: Refresh leaderboard cache

on:
  schedule:
    - cron: "*/30 * * * *"
  workflow_dispatch: {}

jobs:
  refresh:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run refresh
        env:
          NEXT_PUBLIC_SHEET_CSV_URL: ${{ secrets.NEXT_PUBLIC_SHEET_CSV_URL }}
          SITE_URL: ${{ secrets.SITE_URL }}
          CRON_SECRET: ${{ secrets.CRON_SECRET }}
```

- [ ] **Step 2: Validate the YAML parses**

Run: `node -e "const fs=require('fs');const s=fs.readFileSync('.github/workflows/refresh.yml','utf8');if(!s.includes('*/30 * * * *'))process.exit(1);console.log('schedule present')"`
Expected: `schedule present`

- [ ] **Step 3: Document the required GitHub secrets**

Append to `.github/workflows/refresh.yml` as a trailing comment:

```yaml
# Required repository secrets (Settings → Secrets and variables → Actions):
#   NEXT_PUBLIC_SHEET_CSV_URL  - published Google Sheet CSV export URL
#   SITE_URL                   - deployed base URL, e.g. https://burank.vercel.app
#   CRON_SECRET                - shared secret, must match the app's CRON_SECRET env var
```

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/refresh.yml
git commit -m "ci: scheduled cache refresh workflow (every 30 min)"
```

---

## Task 10: Switch `/api/leaderboard` to Postgres reads

Replace the sheet + N× LeetCode fan-out and the First-Blood write with a single `UserStat` query.

**Files:**
- Modify: `src/app/api/leaderboard/route.ts` (replace entire file)

- [ ] **Step 1: Rewrite the route**

Replace the entire contents of `src/app/api/leaderboard/route.ts` with:

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { LeetCodeUser } from "@/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const rows = await prisma.userStat.findMany({
      orderBy: { totalSolved: "desc" },
    });

    const users: LeetCodeUser[] = rows.map((r) => ({
      username: r.username,
      realName: r.realName || r.username,
      avatar: r.avatar || "",
      ranking: r.ranking ?? 0,
      totalSolved: r.totalSolved,
      easySolved: r.easySolved,
      mediumSolved: r.mediumSolved,
      hardSolved: r.hardSolved,
      acceptanceRate: 0,
      contestRating: r.contestRating,
      contestGlobalRanking: r.contestGlobalRanking,
      attendedContestsCount: r.attendedContestsCount,
      topPercentage: r.topPercentage,
      email: r.email ?? "",
      addedAt: r.addedAt ?? "",
      yearStudying: r.yearStudying ?? "",
      enrollmentNo: r.enrollmentNo ?? "",
      error: r.fetchError,
    }));

    return NextResponse.json({ users });
  } catch (err) {
    console.error("/api/leaderboard error:", err);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 2: Verify the build passes**

Run: `DATABASE_URL="postgresql://x:x@localhost:5432/x" RESEND_API_KEY="x" EMAIL_FROM="x@x.com" NEXTAUTH_SECRET="x" NEXTAUTH_URL="http://localhost:3000" npm run build`
Expected: build completes with no errors.

- [ ] **Step 3: Confirm no LeetCode/Sheets imports remain**

Run: `grep -n "leetcode\|sheets" src/app/api/leaderboard/route.ts || echo "clean"`
Expected: `clean`

- [ ] **Step 4: Commit**

```bash
git add src/app/api/leaderboard/route.ts
git commit -m "perf(leaderboard): read from Postgres UserStat instead of live LeetCode"
```

---

## Task 11: Switch `/api/qotw` to Postgres reads

**Files:**
- Modify: `src/app/api/qotw/route.ts` (replace entire file)

- [ ] **Step 1: Rewrite the route**

Replace the entire contents of `src/app/api/qotw/route.ts` with:

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const rows = await prisma.setting.findMany({
      where: { key: { in: ["qotw_url", "qotw_timestamp", "first_blood"] } },
    });
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return NextResponse.json({
      qotw_url: map.qotw_url ?? "",
      qotw_timestamp: map.qotw_timestamp ?? "",
      first_blood: map.first_blood ?? "",
    });
  } catch {
    return NextResponse.json({
      qotw_url: "",
      qotw_timestamp: "",
      first_blood: "",
    });
  }
}
```

- [ ] **Step 2: Verify the build passes**

Run: `DATABASE_URL="postgresql://x:x@localhost:5432/x" RESEND_API_KEY="x" EMAIL_FROM="x@x.com" NEXTAUTH_SECRET="x" NEXTAUTH_URL="http://localhost:3000" npm run build`
Expected: build completes with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/qotw/route.ts
git commit -m "perf(qotw): read settings from Postgres instead of GAS"
```

---

## Task 12: Switch `/card/[enrollment]` to Postgres reads

Replace the sheet lookup + all-users LeetCode fan-out with a single `UserStat` query, ranking by `totalSolved`.

**Files:**
- Modify: `src/app/card/[enrollment]/route.ts:257-357` (the `GET` handler and its imports)

- [ ] **Step 1: Replace the imports**

At the top of `src/app/card/[enrollment]/route.ts`, replace lines 1-3:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
```

(Removes the `fetchUsernamesFromSheet` and `fetchLeetCodeUser` imports; keeps `buildCard`/`errorCard`/`escapeXml`/`truncate` unchanged.)

- [ ] **Step 2: Rewrite the `GET` handler**

Replace the entire `GET` function (from `export async function GET(` to the final closing brace of the file) with:

```typescript
export async function GET(
  _req: NextRequest,
  { params }: { params: { enrollment: string } },
) {
  const enrollment = (params.enrollment ?? "").trim().toLowerCase();

  if (!enrollment) {
    return new NextResponse(errorCard("No enrollment number provided."), {
      status: 400,
      headers: { "Content-Type": "image/svg+xml" },
    });
  }

  try {
    // Rank everyone by totalSolved (successful fetches only).
    const rows = await prisma.userStat.findMany({
      where: { fetchError: false },
      orderBy: { totalSolved: "desc" },
    });

    const idx = rows.findIndex(
      (r) => (r.enrollmentNo ?? "").toLowerCase() === enrollment,
    );

    if (idx === -1) {
      return new NextResponse(
        errorCard(`Enrollment number "${enrollment.toUpperCase()}" not found.`),
        {
          status: 404,
          headers: {
            "Content-Type": "image/svg+xml",
            "Cache-Control": "no-store",
          },
        },
      );
    }

    const me = rows[idx];
    const svg = buildCard({
      username: me.username,
      realName: me.realName || me.username,
      enrollmentNo: enrollment,
      collegeRank: idx + 1,
      totalSolved: me.totalSolved,
      easySolved: me.easySolved,
      mediumSolved: me.mediumSolved,
      hardSolved: me.hardSolved,
      contestRating: me.contestRating,
      totalUsers: rows.length,
    });

    return new NextResponse(svg, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=600, stale-while-revalidate=300",
      },
    });
  } catch (err) {
    console.error("/card/[enrollment] error:", err);
    return new NextResponse(errorCard("Server error. Try again later."), {
      status: 500,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "no-store",
      },
    });
  }
}
```

- [ ] **Step 3: Verify the build passes**

Run: `DATABASE_URL="postgresql://x:x@localhost:5432/x" RESEND_API_KEY="x" EMAIL_FROM="x@x.com" NEXTAUTH_SECRET="x" NEXTAUTH_URL="http://localhost:3000" npm run build`
Expected: build completes with no errors.

- [ ] **Step 4: Commit**

```bash
git add "src/app/card/[enrollment]/route.ts"
git commit -m "perf(card): rank from Postgres UserStat instead of live LeetCode"
```

---

## Task 13: Instant appearance on register

After a user is added to the sheet, upsert the LeetCode data already fetched during validation into `UserStat` so they show up before the next cron run.

**Files:**
- Modify: `src/app/api/auth/register/route.ts:77-86`

- [ ] **Step 1: Add the prisma import**

At the top of `src/app/api/auth/register/route.ts`, add after the existing imports:

```typescript
import { prisma } from "@/lib/prisma";
```

- [ ] **Step 2: Upsert the new user after a successful sheet add**

Replace the block that writes to the sheet and returns (lines 77-86) with:

```typescript
    // 3. Write to sheet
    const result = await addUsernameToSheet(
      username,
      email!,
      yearStudying,
      enrollmentNo,
    );

    // 4. Instant appearance: upsert the just-fetched stats into the cache
    //    so the user shows up without waiting for the next cron run.
    if (result.success) {
      try {
        await prisma.userStat.upsert({
          where: { username },
          update: {
            realName: user.realName,
            avatar: user.avatar,
            ranking: user.ranking,
            totalSolved: user.totalSolved,
            easySolved: user.easySolved,
            mediumSolved: user.mediumSolved,
            hardSolved: user.hardSolved,
            contestRating: user.contestRating,
            contestGlobalRanking: user.contestGlobalRanking,
            attendedContestsCount: user.attendedContestsCount,
            topPercentage: user.topPercentage,
            email,
            enrollmentNo,
            yearStudying,
            addedAt: new Date().toISOString(),
            fetchError: false,
            lastFetchedAt: new Date(),
          },
          create: {
            username,
            realName: user.realName,
            avatar: user.avatar,
            ranking: user.ranking,
            totalSolved: user.totalSolved,
            easySolved: user.easySolved,
            mediumSolved: user.mediumSolved,
            hardSolved: user.hardSolved,
            contestRating: user.contestRating,
            contestGlobalRanking: user.contestGlobalRanking,
            attendedContestsCount: user.attendedContestsCount,
            topPercentage: user.topPercentage,
            email,
            enrollmentNo,
            yearStudying,
            addedAt: new Date().toISOString(),
            fetchError: false,
            lastFetchedAt: new Date(),
          },
        });
      } catch (e) {
        console.error("register: UserStat upsert failed (non-fatal):", e);
      }
    }

    return NextResponse.json(result);
```

- [ ] **Step 3: Verify the build passes**

Run: `DATABASE_URL="postgresql://x:x@localhost:5432/x" RESEND_API_KEY="x" EMAIL_FROM="x@x.com" NEXTAUTH_SECRET="x" NEXTAUTH_URL="http://localhost:3000" npm run build`
Expected: build completes with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/auth/register/route.ts
git commit -m "feat(register): upsert new user into cache for instant appearance"
```

---

## Task 14: Admin QOTW → Postgres (and instant cache delete)

The admin "Set QOTW" writes `Setting` rows in Postgres instead of GAS, and admin delete removes the cached row immediately (the cron reconcile would otherwise leave it for up to 30 min).

**Files:**
- Modify: `src/app/api/admin/action/route.ts` (replace entire file)

- [ ] **Step 1: Rewrite the admin action route**

Replace the entire contents of `src/app/api/admin/action/route.ts` with:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { deleteUserFromSheet } from "@/lib/sheets";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = req.cookies.get("admin_session");
    if (!session || session.value !== "authenticated") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    if (body.action === "delete") {
      if (!body.username) {
        return NextResponse.json({ success: false, message: "Username required" }, { status: 400 });
      }
      const username = String(body.username).toLowerCase();
      const success = await deleteUserFromSheet(username);
      // Remove from the cache immediately so the leaderboard updates now.
      await prisma.userStat.deleteMany({ where: { username } });
      return NextResponse.json({
        success,
        message: success ? "User deleted" : "Failed to delete user",
      });
    }

    if (body.action === "set_qotw") {
      const qotwUrl = String(body.qotw_url || "");
      const now = new Date().toISOString();
      await prisma.$transaction([
        prisma.setting.upsert({
          where: { key: "qotw_url" },
          update: { value: qotwUrl },
          create: { key: "qotw_url", value: qotwUrl },
        }),
        prisma.setting.upsert({
          where: { key: "qotw_timestamp" },
          update: { value: now },
          create: { key: "qotw_timestamp", value: now },
        }),
        // New QOTW resets first blood; the next cron run recomputes it.
        prisma.setting.upsert({
          where: { key: "first_blood" },
          update: { value: "" },
          create: { key: "first_blood", value: "" },
        }),
      ]);
      return NextResponse.json({ success: true, message: "QOTW updated" });
    }

    return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("[Admin Action Error]", err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Remove the now-dead GAS QOTW/first-blood helpers from `sheets.ts`**

In `src/lib/sheets.ts`, delete these three now-unused exported functions (they were the GAS-based QOTW/first-blood writers/reader, replaced by Postgres): `setQuestionOfTheWeek` (lines ~153-158), `setFirstBlood` (lines ~160-168), and `getQuestionOfTheWeek` (lines ~170-217). Leave `addUsernameToSheet`, `deleteUserFromSheet`, and `postToGAS` intact (the sheet is still the roster source of truth).

- [ ] **Step 3: Verify nothing still imports the removed functions**

Run: `grep -rn "getQuestionOfTheWeek\|setQuestionOfTheWeek\|setFirstBlood" src/`
Expected: no matches.

- [ ] **Step 4: Verify the build passes**

Run: `DATABASE_URL="postgresql://x:x@localhost:5432/x" RESEND_API_KEY="x" EMAIL_FROM="x@x.com" NEXTAUTH_SECRET="x" NEXTAUTH_URL="http://localhost:3000" npm run build`
Expected: build completes with no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/admin/action/route.ts src/lib/sheets.ts
git commit -m "feat(admin): QOTW writes to Postgres; instant cache delete; drop dead GAS helpers"
```

---

## Task 15: Env example + CI workflow

Complete the deployable env var set and add a lint/test/build CI workflow.

**Files:**
- Modify (or create): `.env.local.example`
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Write a complete `.env.local.example`**

Replace the contents of `.env.local.example` with:

```bash
# --- Database (Postgres, used by Prisma / NextAuth / the cache) ---
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# --- NextAuth ---
NEXTAUTH_SECRET="generate-with: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"

# --- Email (magic-link auth via Resend) ---
RESEND_API_KEY="re_xxxxxxxx"
EMAIL_FROM="BURank <noreply@yourdomain.com>"

# --- Admin ---
ADMIN_PASSWORD="choose-a-strong-password"

# --- Google Sheet roster ---
NEXT_PUBLIC_SHEET_CSV_URL="https://docs.google.com/spreadsheets/d/e/.../pub?gid=0&single=true&output=csv"
NEXT_PUBLIC_SHEET_WRITE_URL="https://script.google.com/macros/s/.../exec"

# --- Cron / cache refresh ---
# Shared secret between the GitHub Action and /api/cron/ingest
CRON_SECRET="generate-with: openssl rand -base64 32"
# Deployed base URL the refresh runner POSTs to (Action secret, not needed locally)
SITE_URL="https://your-app.vercel.app"

# --- Optional branding ---
NEXT_PUBLIC_COLLEGE_NAME="Bennett University"
```

- [ ] **Step 2: Create the CI workflow**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request: {}

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npx prisma generate
      - run: npm run lint
      - run: npm test
      - run: npm run build
        env:
          DATABASE_URL: "postgresql://x:x@localhost:5432/x"
          NEXTAUTH_SECRET: "ci-secret"
          NEXTAUTH_URL: "http://localhost:3000"
          RESEND_API_KEY: "ci-key"
          EMAIL_FROM: "ci@example.com"
          CRON_SECRET: "ci-cron"
```

- [ ] **Step 3: Validate the CI YAML and run the full local gate**

Run: `node -e "require('fs').readFileSync('.github/workflows/ci.yml','utf8').includes('npm run build')||process.exit(1);console.log('ci ok')"`
Expected: `ci ok`

Run: `npm test`
Expected: all suites pass (the existing UI tests plus the new `roster`, `first-blood`, `ingest-reconcile` suites).

- [ ] **Step 4: Commit**

```bash
git add .env.local.example .github/workflows/ci.yml
git commit -m "chore: complete env example and add lint/test/build CI"
```

---

## Post-implementation notes (not tasks)

- **Deploy-time env:** set `CRON_SECRET` and `SITE_URL` in Vercel, and add `NEXT_PUBLIC_SHEET_CSV_URL`, `SITE_URL`, `CRON_SECRET` as GitHub repo secrets so `refresh.yml` can run.
- **First run:** trigger the workflow manually (`workflow_dispatch`) once after deploy to populate `UserStat` before anyone loads the leaderboard; until then the board reads an empty table.
- **Out of scope (separate follow-up, per the spec):** the forgeable `admin_session` cookie, `isBennettEmail()` hardcoded to `true`, and the `NEXT_PUBLIC_` write URL exposing the unauthenticated Apps Script endpoint. Also deferred: the submission-calendar fetch in the runner (profile page fetches its own on demand for now).
```
