# BURank UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert BURank from its dark theme to the approved light theme, rebuilding the leaderboard and profile pages to match the approved mockups, and reskinning the remaining surfaces.

**Architecture:** Shared design tokens + component classes live in `src/app/globals.css` (ported verbatim from the two approved mockup files, which are the source of truth for markup and styles). Thin React components render those classes with real data. Pure logic (best-badge selection, highlight computation) is extracted to `src/lib` and unit-tested with Vitest; visual output is verified against the mockups in a running dev server.

**Tech Stack:** Next.js 14 (App Router), React 18, TypeScript, plain CSS in `globals.css` (the app already mixes CSS variables + inline styles), Vitest for logic tests.

**Source-of-truth mockups (in repo):**
- `docs/superpowers/specs/assets/leaderboard-redesign.html`
- `docs/superpowers/specs/assets/profile-redesign.html`

**Git policy:** The maintainer commits their own work. Treat every **Commit** step as a checkpoint: stage the listed files, summarize what changed, and let the maintainer run the commit. Do **not** run `git commit` unless they explicitly approve it in that turn.

---

## File Structure

**Create:**
- `vitest.config.ts` — test runner config with the `@/*` path alias
- `src/lib/best-badge.ts` — `getBestBadge(user)` → single best badge for the badge tag
- `src/lib/best-badge.test.ts`
- `src/lib/highlights.ts` — `computeHighlights(users, firstBlood)` → the 4 highlight cards
- `src/lib/highlights.test.ts`
- `src/components/leaderboard/ChampionCard.tsx`
- `src/components/leaderboard/ChampionsPodium.tsx`
- `src/components/leaderboard/HighlightCards.tsx`
- `src/components/leaderboard/LeaderboardTable.tsx`
- `src/components/leaderboard/BestBadgeTag.tsx` — presentational tag pill

**Modify:**
- `src/app/globals.css` — new light tokens + ported component classes
- `tailwind.config.js` — repoint `bu.*` colors to light values
- `src/app/page.tsx` — rebuild leaderboard layout with new components
- `src/app/user/[username]/page.tsx` — rebuild profile in light theme
- `src/components/Heatmap.tsx` — light-theme colors
- `src/components/Navbar.tsx` — light theme (used by other pages if any); leaderboard uses its own header
- `src/app/admin/page.tsx`, `src/app/auth/signin/page.tsx`, `src/app/auth/verify/page.tsx`, `src/app/auth/error/page.tsx`, `src/components/AddUserModal.tsx`, `src/components/UserProfileModal.tsx` — light-theme polish
- `package.json` — add `vitest` dev dep + `test` script

---

## Task 1: Test runner setup

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json`

- [ ] **Step 1: Install Vitest**

Run: `npm install -D vitest`
Expected: `vitest` added to `devDependencies`.

- [ ] **Step 2: Add the test script**

In `package.json`, add to `"scripts"`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Create the Vitest config with the path alias**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
```

- [ ] **Step 4: Verify the runner starts (no tests yet)**

Run: `npm test`
Expected: Vitest runs and reports "No test files found" (exit non-zero is fine at this point).

- [ ] **Step 5: Commit (checkpoint)**

```bash
git add package.json package-lock.json vitest.config.ts
# maintainer commits: "chore: add vitest for logic tests"
```

---

## Task 2: Light theme tokens (foundation)

Replaces the dark palette. Repoints the existing `--bu-*` variables to light values so the not-yet-rebuilt pages (admin/auth/modals) become light automatically, and adds the new tokens used by the redesigned components.

**Files:**
- Modify: `src/app/globals.css:7-31` (the `:root` block + `body`)
- Modify: `tailwind.config.js:10-20`

- [ ] **Step 1: Replace the `:root` and `body` blocks in `globals.css`**

Replace lines 7–31 (the `:root {…}` and `body {…}` blocks) with:

```css
:root {
  /* new light tokens */
  --card: #ffffff;
  --bg-2: #eef0f4;
  --ink: #14141c;
  --ink-2: #3d3d4c;
  --sub: #71718a;
  --muted: #a6a6b8;
  --line: #e7e8ee;
  --line-2: #eff0f4;
  --red: #1b2a4a;        /* navy accent (replaces Bennett red) */
  --red-soft: #e9ecf3;
  --gold: #e0a93b;
  --gold-soft: #fbf0d8;
  --silver: #98a2b3;
  --bronze: #c08457;
  --easy: #00a98f;
  --medium: #e0972b;
  --hard: #e24a47;
  --track: #eaecf1;
  --shadow: 0 1px 2px rgba(20,20,28,.04), 0 8px 24px rgba(20,20,28,.06);
  --shadow-lg: 0 2px 6px rgba(20,20,28,.05), 0 20px 48px rgba(20,20,28,.12);
  --sans: "Inter", system-ui, sans-serif;
  --mono: "JetBrains Mono", "Fira Code", monospace;

  /* legacy --bu-* repointed to light so un-rebuilt pages stay usable */
  --bu-red: #1b2a4a;
  --bu-red-dim: rgba(27,42,74,0.10);
  --bu-dark: #f5f6f8;
  --bu-card: #ffffff;
  --bu-border: #e7e8ee;
  --bu-muted: #a6a6b8;
  --bu-text: #14141c;
  --bu-sub: #71718a;
}

* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  color: var(--ink);
  font-family: var(--sans);
  -webkit-font-smoothing: antialiased;
  font-variant-numeric: tabular-nums;
  background-color: #ffffff;
  background-image: linear-gradient(180deg, #e3e6ec 0%, #eaedf1 34%, #f5f6f8 66%, #ffffff 100%);
  background-repeat: no-repeat;
  background-size: 100% 720px;
}
```

- [ ] **Step 2: Update the difficulty helper colors in `globals.css`**

Replace the `.easy/.medium/.hard` rules (currently lines ~66–74) with:

```css
.easy { color: var(--easy); }
.medium { color: var(--medium); }
.hard { color: var(--hard); }
```

- [ ] **Step 3: Repoint the Tailwind `bu` colors to light**

In `tailwind.config.js`, replace the `bu` color object with:

```js
bu: {
  red: "#1B2A4A",
  dark: "#F5F6F8",
  card: "#FFFFFF",
  border: "#E7E8EE",
  muted: "#A6A6B8",
  text: "#14141C",
  sub: "#71718A",
},
```

- [ ] **Step 4: Verify the app builds and the ground is light**

Run: `RESEND_API_KEY=re_x EMAIL_FROM=a@b.co ADMIN_PASSWORD=x NEXTAUTH_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx NEXTAUTH_URL=http://localhost:3000 DATABASE_URL="postgresql://u:p@localhost:5432/db" npm run dev`
Then open http://localhost:3000. Expected: page background is the light grey→white gradient (data may fail to load without a real sheet — that's fine; you're verifying the theme ground, not data).

- [ ] **Step 5: Commit (checkpoint)**

```bash
git add src/app/globals.css tailwind.config.js
# maintainer commits: "feat(ui): light theme tokens"
```

---

## Task 3: Port leaderboard component classes into globals.css

Copies the redesigned leaderboard's CSS from the approved mockup into `globals.css` so the React components can use the exact same classes.

**Files:**
- Modify: `src/app/globals.css` (append)

- [ ] **Step 1: Copy the leaderboard component classes**

Open `docs/superpowers/specs/assets/leaderboard-redesign.html`. From its `<style>` block, copy **every rule** EXCEPT the `:root {…}` block and the `body {…}` block (those are already handled in Task 2) and append them to the end of `src/app/globals.css`. This includes, in order: `.wrap`, `.hero-wrap`, `.sheet`, `.sheet-inner`, `.topbar`, `.brand`, `.search`, `.nav-actions`, `.chip-btn`, `.segmented`/`.seg-wrap`, `.hero`, `.ghost`, `.podium`, `.champ`, `.band`, `.c1/.c2/.c3 .band`, `.place`, `.avatar`, `.avatar-in`, `.badge-row`, `.icon-pill`, `.xpill`, `.body`, `.name-row`, `.vf`, `.role`, `.stats`, `.stat`, `.emh`, `.profile-btn`, `.highlights`, `.hl`, `.board`, `.board-head`, `.list-scroll`, `.rows`, `.rows-head`, `.row`, `.inner`, `.rk`, `.coder`, `.batch-tag`, `.badges`, `.bdg`, `.num-cell`, `.sub-cell`, `.contest-cell`, `.xscore`, `.best-tag`, `.acts`, `.icob`, `.chev`, `.r`, the `@keyframes rise`, and the `@media (max-width: 820px)` block.

- [ ] **Step 2: Verify no CSS syntax errors**

Run the dev server (same command as Task 2 Step 4). Expected: it compiles with no CSS parse errors in the terminal.

- [ ] **Step 3: Commit (checkpoint)**

```bash
git add src/app/globals.css
# maintainer commits: "feat(ui): leaderboard component styles"
```

---

## Task 4: Port profile component classes into globals.css

**Files:**
- Modify: `src/app/globals.css` (append)

- [ ] **Step 1: Copy the profile component classes**

Open `docs/superpowers/specs/assets/profile-redesign.html`. From its `<style>` block, copy every rule EXCEPT the `:root {…}` and `body {…}` blocks and the navbar rules already added in Task 3 (`.topbar`, `.brand`, `.search*`). Append the remaining rules to `src/app/globals.css`: `.back`, `.card`, `.header`, `.p-ava`, `.p-id`, `.p-handle`, `.p-pills`, `.pill`, `.pill.rank`, `.pill.year`, `.p-side`, `.prow`, `.solved`, `.diff`, `.bar-row`, `.track`, `.fill`, `.cal`, `.cal-head`, `.heat-scroll`, `.heat`, `.cell`, `.legend`, and the profile `@media` block.

- [ ] **Step 2: Verify compile**

Run the dev server. Expected: compiles, no CSS errors.

- [ ] **Step 3: Commit (checkpoint)**

```bash
git add src/app/globals.css
# maintainer commits: "feat(ui): profile component styles"
```

---

## Task 5: `getBestBadge()` helper (TDD)

Selects the single "best" earned badge for a user and maps it to a display icon + tone for the badge tag on cards and table rows.

**Files:**
- Create: `src/lib/best-badge.ts`
- Test: `src/lib/best-badge.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/best-badge.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { getBestBadge } from "@/lib/best-badge";
import type { LeetCodeUser } from "@/types";

const base: LeetCodeUser = {
  username: "u", realName: "U", avatar: "", ranking: 1,
  totalSolved: 0, easySolved: 0, mediumSolved: 0, hardSolved: 0,
  acceptanceRate: 0, contestRating: 0, contestGlobalRanking: 0,
  attendedContestsCount: 0, topPercentage: 100,
};

describe("getBestBadge", () => {
  it("returns null when no badge is earned", () => {
    expect(getBestBadge(base)).toBeNull();
  });

  it("picks the highest-tier earned badge", () => {
    // 500 solved => 'legend' (elite) is the best
    const u = { ...base, totalSolved: 600, hardSolved: 60 };
    const b = getBestBadge(u);
    expect(b?.label).toBe("Legend");
    expect(b?.tone).toBe("gold");
  });

  it("falls back to a lower tier when no elite/gold earned", () => {
    const u = { ...base, totalSolved: 60 }; // only 'rookie' (bronze)
    const b = getBestBadge(u);
    expect(b?.label).toBe("Rookie");
    expect(b?.tone).toBe("default");
  });

  it("provides an icon string", () => {
    const u = { ...base, totalSolved: 250 }; // grinder (gold)
    expect(typeof getBestBadge(u)?.icon).toBe("string");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- best-badge`
Expected: FAIL — cannot find module `@/lib/best-badge`.

- [ ] **Step 3: Implement `getBestBadge`**

Create `src/lib/best-badge.ts`:

```ts
import { LeetCodeUser } from "@/types";
import { computeBadges, Badge } from "@/lib/badges";

export interface BestBadge {
  label: string;
  icon: string;
  tone: "gold" | "default";
}

const TIER_RANK: Record<Badge["tier"], number> = {
  elite: 4, gold: 3, silver: 2, bronze: 1,
};

const ICONS: Record<string, string> = {
  legend: "🏆", grinder: "⚙️", century: "💯", rookie: "🌱",
  "hard-enjoyer": "🔥", savage: "⚔️", brave: "🗡️",
  master: "👑", expert: "🎯", rated: "📈", contestant: "🎮",
  balanced: "⚖️",
};

export function getBestBadge(user: LeetCodeUser): BestBadge | null {
  const earned = computeBadges(user);
  if (earned.length === 0) return null;

  const best = earned.reduce((a, b) =>
    TIER_RANK[b.tier] > TIER_RANK[a.tier] ? b : a
  );

  return {
    label: best.label,
    icon: ICONS[best.id] ?? "🏅",
    tone: best.tier === "gold" || best.tier === "elite" ? "gold" : "default",
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- best-badge`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit (checkpoint)**

```bash
git add src/lib/best-badge.ts src/lib/best-badge.test.ts
# maintainer commits: "feat: getBestBadge helper"
```

---

## Task 6: `computeHighlights()` helper (TDD)

Computes the four highlight cards from the user list + the First-Blood username.

**Files:**
- Create: `src/lib/highlights.ts`
- Test: `src/lib/highlights.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/highlights.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { computeHighlights } from "@/lib/highlights";
import type { LeetCodeUser } from "@/types";

const mk = (over: Partial<LeetCodeUser>): LeetCodeUser => ({
  username: "u", realName: "U", avatar: "", ranking: 1,
  totalSolved: 0, easySolved: 0, mediumSolved: 0, hardSolved: 0,
  acceptanceRate: 0, contestRating: 0, contestGlobalRanking: 0,
  attendedContestsCount: 0, topPercentage: 100, ...over,
});

describe("computeHighlights", () => {
  const users = [
    mk({ username: "a", realName: "Aa", totalSolved: 842, hardSolved: 60, contestRating: 1800 }),
    mk({ username: "b", realName: "Bb", totalSolved: 700, hardSolved: 118, contestRating: 2210 }),
  ];

  it("finds most solved, top rating, most hard", () => {
    const h = computeHighlights(users, "");
    expect(h.mostSolved?.username).toBe("a");
    expect(h.topRating?.username).toBe("b");
    expect(h.mostHard?.username).toBe("b");
  });

  it("resolves first blood from username", () => {
    const h = computeHighlights(users, "a");
    expect(h.firstBlood?.username).toBe("a");
  });

  it("returns null slots for an empty list", () => {
    const h = computeHighlights([], "");
    expect(h.mostSolved).toBeNull();
    expect(h.firstBlood).toBeNull();
  });

  it("ignores errored users", () => {
    const withError = [...users, mk({ username: "c", totalSolved: 9999, error: true })];
    const h = computeHighlights(withError, "");
    expect(h.mostSolved?.username).toBe("a");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- highlights`
Expected: FAIL — cannot find module `@/lib/highlights`.

- [ ] **Step 3: Implement `computeHighlights`**

Create `src/lib/highlights.ts`:

```ts
import { LeetCodeUser } from "@/types";

export interface Highlights {
  mostSolved: LeetCodeUser | null;
  topRating: LeetCodeUser | null;
  mostHard: LeetCodeUser | null;
  firstBlood: LeetCodeUser | null;
}

function maxBy(users: LeetCodeUser[], sel: (u: LeetCodeUser) => number): LeetCodeUser | null {
  const valid = users.filter((u) => !u.error);
  if (valid.length === 0) return null;
  return valid.reduce((a, b) => (sel(b) > sel(a) ? b : a));
}

export function computeHighlights(users: LeetCodeUser[], firstBlood: string): Highlights {
  const valid = users.filter((u) => !u.error);
  const rated = valid.filter((u) => u.contestRating > 0);
  return {
    mostSolved: maxBy(valid, (u) => u.totalSolved),
    topRating: rated.length ? maxBy(rated, (u) => u.contestRating) : null,
    mostHard: maxBy(valid, (u) => u.hardSolved),
    firstBlood: firstBlood
      ? valid.find((u) => u.username.toLowerCase() === firstBlood.toLowerCase()) ?? null
      : null,
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- highlights`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit (checkpoint)**

```bash
git add src/lib/highlights.ts src/lib/highlights.test.ts
# maintainer commits: "feat: computeHighlights helper"
```

---

## Task 7: `BestBadgeTag` component

A presentational pill used on both cards and table rows.

**Files:**
- Create: `src/components/leaderboard/BestBadgeTag.tsx`

- [ ] **Step 1: Write the component**

Create `src/components/leaderboard/BestBadgeTag.tsx`:

```tsx
import { getBestBadge } from "@/lib/best-badge";
import { LeetCodeUser } from "@/types";

export default function BestBadgeTag({ user }: { user: LeetCodeUser }) {
  const badge = getBestBadge(user);
  if (!badge) return <span className="best-tag">—</span>;
  return (
    <span className={`best-tag${badge.tone === "gold" ? " gold" : ""}`}>
      <span className="ic">{badge.icon}</span> {badge.label}
    </span>
  );
}
```

- [ ] **Step 2: Verify it type-checks**

Run: `npx tsc --noEmit`
Expected: no new errors from this file.

- [ ] **Step 3: Commit (checkpoint)**

```bash
git add src/components/leaderboard/BestBadgeTag.tsx
# maintainer commits: "feat(ui): BestBadgeTag component"
```

---

## Task 8: `ChampionCard` + `ChampionsPodium`

**Files:**
- Create: `src/components/leaderboard/ChampionCard.tsx`
- Create: `src/components/leaderboard/ChampionsPodium.tsx`

- [ ] **Step 1: Write `ChampionCard`**

Create `src/components/leaderboard/ChampionCard.tsx`:

```tsx
import Image from "next/image";
import Link from "next/link";
import { LeetCodeUser } from "@/types";
import BestBadgeTag from "./BestBadgeTag";

const PLACE = ["", "1", "2", "3"];
const SUP = ["", "st", "nd", "rd"];
const BAND = ["", "c1", "c2", "c3"];

export default function ChampionCard({ user, place }: { user: LeetCodeUser; place: 1 | 2 | 3 }) {
  return (
    <article className={`champ ${BAND[place]}`}>
      <div className="band">
        <div className="place">{PLACE[place]}<sup>{SUP[place]}</sup></div>
      </div>
      <div className="avatar-wrap">
        <div className="avatar">
          {user.avatar ? (
            <Image className="avatar-in" src={user.avatar} alt={user.username} width={100} height={88} unoptimized style={{ objectFit: "cover" }} />
          ) : (
            <div className="avatar-in" />
          )}
        </div>
      </div>
      <div className="badge-row"><BestBadgeTag user={user} /></div>
      <div className="body">
        <div className="name-row"><h3>{user.realName || user.username}</h3></div>
        <p className="role">@{user.username}</p>
        <div className="stats">
          <div className="stat"><div className="v">{user.totalSolved}</div><div className="k">Solved</div></div>
          <div className="stat"><div className="v">{user.contestRating > 0 ? user.contestRating : "—"}</div><div className="k">Contest</div></div>
          <div className="stat">
            <div className="emh">
              <span className="e">{user.easySolved}</span> <span className="d">·</span>{" "}
              <span className="m">{user.mediumSolved}</span> <span className="d">·</span>{" "}
              <span className="h">{user.hardSolved}</span>
            </div>
            <div className="k">E · M · H</div>
          </div>
        </div>
        <Link href={`/user/${user.username}`} className="profile-btn" style={{ display: "grid", placeItems: "center", textDecoration: "none" }}>
          Profile
        </Link>
      </div>
    </article>
  );
}
```

Note: `.emh .d` is styled in the ported CSS; keep the `d` spans.

- [ ] **Step 2: Write `ChampionsPodium`**

Create `src/components/leaderboard/ChampionsPodium.tsx`:

```tsx
import { LeetCodeUser } from "@/types";
import ChampionCard from "./ChampionCard";

export default function ChampionsPodium({ top }: { top: LeetCodeUser[] }) {
  if (top.length < 3) return null;
  return (
    <div className="hero">
      <div className="ghost">Champions</div>
      <div className="podium">
        <ChampionCard user={top[0]} place={1} />
        <ChampionCard user={top[1]} place={2} />
        <ChampionCard user={top[2]} place={3} />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 4: Commit (checkpoint)**

```bash
git add src/components/leaderboard/ChampionCard.tsx src/components/leaderboard/ChampionsPodium.tsx
# maintainer commits: "feat(ui): champions podium"
```

---

## Task 9: `HighlightCards` component

**Files:**
- Create: `src/components/leaderboard/HighlightCards.tsx`

- [ ] **Step 1: Write the component**

Create `src/components/leaderboard/HighlightCards.tsx`:

```tsx
import { LeetCodeUser } from "@/types";
import { computeHighlights } from "@/lib/highlights";

function Card({ label, name, value, dotColor, dot }: {
  label: string; name: string; value: React.ReactNode; dotColor: string; dot: string;
}) {
  return (
    <div className="hl">
      <div className="ava"><div className="dot" style={{ background: dotColor }}>{dot}</div></div>
      <div className="txt"><div className="lab">{label}</div><div className="who">{name}</div></div>
      <div className="num">{value}</div>
    </div>
  );
}

export default function HighlightCards({ users, firstBlood }: { users: LeetCodeUser[]; firstBlood: string }) {
  const h = computeHighlights(users, firstBlood);
  const nm = (u: LeetCodeUser | null) => (u ? u.realName || u.username : "—");
  return (
    <div className="highlights">
      <Card label="Most Solved" name={nm(h.mostSolved)} value={h.mostSolved?.totalSolved ?? "—"} dotColor="var(--red)" dot="▲" />
      <Card label="Top Contest Rating" name={nm(h.topRating)} value={h.topRating?.contestRating ?? "—"} dotColor="#3B7DD8" dot="★" />
      <Card label="Most Hard Solved" name={nm(h.mostHard)} value={h.mostHard?.hardSolved ?? "—"} dotColor="var(--hard)" dot="◆" />
      <Card label="First Blood · QOTW" name={nm(h.firstBlood)} value={h.firstBlood ? "🔥" : "—"} dotColor="#12A594" dot="🩸" />
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit (checkpoint)**

```bash
git add src/components/leaderboard/HighlightCards.tsx
# maintainer commits: "feat(ui): highlight cards"
```

---

## Task 10: `LeaderboardTable` component

Renders the parallelogram "bars". Reuses the existing sort state passed from the page.

**Files:**
- Create: `src/components/leaderboard/LeaderboardTable.tsx`

- [ ] **Step 1: Write the component**

Create `src/components/leaderboard/LeaderboardTable.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { LeetCodeUser } from "@/types";
import { computeBadges } from "@/lib/badges";
import BestBadgeTag from "./BestBadgeTag";

export default function LeaderboardTable({ users }: { users: LeetCodeUser[] }) {
  const router = useRouter();
  return (
    <div className="board">
      <div className="list-scroll">
        <div className="rows">
          <div className="rows-head">
            <div></div><div>Coder</div><div>Badges</div><div>Batch</div>
            <div className="r">Solved</div><div>E / M / H</div><div>Contest</div>
            <div className="r">Global</div><div></div><div></div>
          </div>

          {users.map((u, i) => {
            const rank = i + 1;
            const g = rank <= 3 ? ` g${rank}` : "";
            const badges = computeBadges(u).slice(0, 2);
            return (
              <div key={u.username} className={`row${g}`} onClick={() => router.push(`/user/${u.username}`)}>
                <div className="inner">
                  <div className="rk">{rank}</div>
                  <div>
                    <div className="coder">
                      {u.avatar ? (
                        <Image className="ava2" src={u.avatar} alt={u.username} width={40} height={40} unoptimized style={{ objectFit: "cover" }} />
                      ) : (
                        <div className="ava2">{u.username[0]?.toUpperCase()}</div>
                      )}
                      <div>
                        <div className="nm">{u.realName || u.username}</div>
                        <div className="un">@{u.username}</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="badges">
                      {badges.map((b) => (
                        <span key={b.id} className="bdg grind">{b.label}</span>
                      ))}
                    </div>
                  </div>
                  <div><span className="batch-tag">{u.yearStudying || "—"}</span></div>
                  <div className="r num-cell">{u.totalSolved}</div>
                  <div>
                    <span className="emh">
                      <span className="e">{u.easySolved}</span> <span className="m">{u.mediumSolved}</span> <span className="h">{u.hardSolved}</span>
                    </span>
                  </div>
                  <div className="contest-cell">
                    {u.contestRating > 0 ? (<><b>{u.contestRating}</b> <span>({u.attendedContestsCount})</span></>) : <b>—</b>}
                  </div>
                  <div className="r sub-cell">#{u.ranking?.toLocaleString() ?? "—"}</div>
                  <div><BestBadgeTag user={u} /></div>
                  <div className="acts"><span className="chev">›</span></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

Note: the `.bdg grind` class gives every badge the same neutral green pill; that matches "one style, colored only for top-3 rows" from the design (the row outline conveys rank, not the badge chips).

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit (checkpoint)**

```bash
git add src/components/leaderboard/LeaderboardTable.tsx
# maintainer commits: "feat(ui): leaderboard table bars"
```

---

## Task 11: Rebuild the leaderboard page

Rewires `page.tsx` to the new layout while keeping all existing data/sort/filter/search/session logic. The Batch Wars view keeps its existing markup but inside the light `.card` styling.

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Replace the imports and top of the component**

At the top of `src/app/page.tsx`, replace the component imports block (lines ~3–14) so it also imports the new pieces and drops the old `StatCard`/`BadgeList`/`Navbar` for the header:

```tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { LeetCodeUser } from "@/types";
import AddUserModal from "@/components/AddUserModal";
import ChampionsPodium from "@/components/leaderboard/ChampionsPodium";
import HighlightCards from "@/components/leaderboard/HighlightCards";
import LeaderboardTable from "@/components/leaderboard/LeaderboardTable";
```

Keep the existing state, `fetchLeaderboard`, `processed` (sort/filter), `batchStats`, and summary-stat memos unchanged.

Add one memo for the podium so it always shows the true top-3 by total solved (independent of the search box). Place it next to the other memos:

```tsx
const topThree = useMemo(
  () =>
    [...users]
      .filter((u) => !u.error)
      .sort((a, b) => b.totalSolved - a.totalSolved)
      .slice(0, 3),
  [users],
);
```

- [ ] **Step 2: Replace the returned JSX with the new light layout**

Replace the entire `return (…)` of `LeaderboardPage` with:

```tsx
  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Navbar: search left, actions right */}
      <div className="topbar">
        <div className="search">
          <span className="s-ic">⌕</span>
          <input
            placeholder="Search coders, usernames, batches…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="nav-actions">
          <button className="chip-btn" onClick={fetchLeaderboard} disabled={loading}>
            ↻ {loading ? "Loading…" : "Refresh"}
          </button>
          {session ? (
            <>
              {!isRegistered && (
                <button className="chip-btn primary" onClick={() => setShowModal(true)}>+ Join Leaderboard</button>
              )}
              <button className="chip-btn" onClick={() => signOut({ callbackUrl: "/" })}>Logout</button>
            </>
          ) : (
            <button className="chip-btn primary" onClick={() => signIn(undefined, { callbackUrl: "/" })}>Sign In</button>
          )}
        </div>
      </div>

      {/* segmented toggle */}
      <div className="seg-wrap">
        <div className="segmented">
          <button className={viewMode === "individuals" ? "on" : ""} onClick={() => setViewMode("individuals")}>Individuals</button>
          <button className={viewMode === "batches" ? "on" : ""} onClick={() => setViewMode("batches")}>Batch Wars</button>
        </div>
      </div>

      {viewMode === "individuals" ? (
        <>
          <div className="wrap hero-wrap">
            {!loading && <ChampionsPodium top={topThree} />}
          </div>

          <section className="sheet">
            <div className="sheet-inner">
              <HighlightCards users={users} firstBlood={firstBlood} />

              <div className="board-head" style={{ marginTop: 28 }}>
                <h2>All Coders · {users.filter((u) => !u.error).length} registered</h2>
                <div className="re">
                  {lastRefreshed ? `↻ Refreshed ${lastRefreshed.toLocaleTimeString()}` : ""} · every 30 min
                </div>
              </div>

              {error && (
                <div style={{ color: "var(--hard)", padding: "8px 6px" }}>{error}</div>
              )}

              {loading ? (
                <div className="board"><div className="list-scroll"><div className="rows">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div className="row" key={i}>
                      <div className="inner" style={{ cursor: "default" }}>
                        <div className="skeleton" style={{ height: 20, gridColumn: "1 / -1" }} />
                      </div>
                    </div>
                  ))}
                </div></div></div>
              ) : (
                <LeaderboardTable users={processed} />
              )}
            </div>
          </section>
        </>
      ) : (
        <section className="sheet">
          <div className="sheet-inner">
            {/* Batch Wars: keep existing batchStats markup, wrapped in light .card styling */}
            <div className="highlights" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
              {batchStats.map((batch) => (
                <div key={batch.year} className="hl" style={{ display: "block", padding: 20 }}>
                  <div className="lab">Batch {batch.year === "Unknown" ? "Unassigned" : batch.year} · {batch.totalStudents} coders</div>
                  <div className="num" style={{ marginTop: 6 }}>{batch.avgSolved}</div>
                  <div className="lab" style={{ marginTop: 4 }}>avg solved · {batch.totalEasy}E / {batch.totalMedium}M / {batch.totalHard}H</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {showModal && <AddUserModal onClose={() => setShowModal(false)} onSuccess={fetchLeaderboard} />}
    </div>
  );
```

Note: the `UserProfileModal` / `selectedUser` flow is dropped — bars now navigate to `/user/[username]` (per the approved "clickable bar opens the full profile"). Remove the `selectedUser` state and the `UserProfileModal` import/usage if present.

- [ ] **Step 3: Verify with the dev server**

Run the dev server (Task 2 command). Open http://localhost:3000. Expected: light theme; navbar with search on the left; if data loads, the podium (1→2→3), highlight cards, and parallelogram bars render matching `leaderboard-redesign.html`. If the sheet isn't configured, the empty state is fine — verify layout/theme, not data.

- [ ] **Step 4: Type-check + build**

Run: `npx tsc --noEmit` then the production build command from the spec.
Expected: compiles.

- [ ] **Step 5: Commit (checkpoint)**

```bash
git add src/app/page.tsx
# maintainer commits: "feat(ui): rebuild leaderboard page (light)"
```

---

## Task 12: Light-theme Heatmap

**Files:**
- Modify: `src/components/Heatmap.tsx:57-63` (the `getColor` function) and the label/legend colors

- [ ] **Step 1: Replace `getColor` with the light green scale**

Replace the `getColor` function (lines 57–63) with:

```tsx
  const getColor = (count: number) => {
    if (count === 0) return "#EAECF1";
    if (count === 1) return "#BEE9DC";
    if (count <= 3) return "#6FD3BC";
    if (count <= 6) return "#22B79B";
    return "#00A98F";
  };
```

- [ ] **Step 2: Fix the hover ring + tooltip for light**

In the day-cell JSX, change `hover:ring-white/50` to `hover:ring-black/20`, and change the tooltip classes `bg-gray-900 text-white` to `bg-[var(--ink)] text-white`.

- [ ] **Step 3: Verify on the profile page (after Task 13) or in isolation**

Run the dev server and open a `/user/<known-username>` route once Task 13 is done. Expected: heatmap squares use the green-on-light scale.

- [ ] **Step 4: Commit (checkpoint)**

```bash
git add src/components/Heatmap.tsx
# maintainer commits: "feat(ui): light-theme heatmap"
```

---

## Task 13: Rebuild the profile page

**Files:**
- Modify: `src/app/user/[username]/page.tsx`

- [ ] **Step 1: Replace the file with the light layout**

Replace `src/app/user/[username]/page.tsx` with:

```tsx
import { fetchLeetCodeUser, fetchLeetCodeCalendar } from "@/lib/leetcode";
import { fetchUsernamesFromSheet } from "@/lib/sheets";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Heatmap from "@/components/Heatmap";

interface Props { params: { username: string } }

export default async function UserProfilePage({ params }: Props) {
  const { username } = params;
  const [user, calendar, sheetUsers] = await Promise.all([
    fetchLeetCodeUser(username),
    fetchLeetCodeCalendar(username),
    fetchUsernamesFromSheet(),
  ]);
  if (!user) notFound();

  const sheetEntry = sheetUsers.find((u) => u.username === user.username);
  const yearStudying = sheetEntry?.yearStudying || "";

  const max = Math.max(user.easySolved, user.mediumSolved, user.hardSolved, 1);
  const pct = (n: number) => `${Math.max(2, Math.round((n / max) * 100))}%`;

  return (
    <div style={{ minHeight: "100vh" }}>
      <div className="topbar">
        <div className="brand">BU<span>rank</span></div>
        <div className="search">
          <span className="s-ic">⌕</span>
          <input placeholder="Search coders, usernames, batches…" />
        </div>
        <Link className="back" href="/">← Leaderboard</Link>
      </div>

      <div className="wrap" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* header */}
        <div className="card header">
          {user.avatar ? (
            <Image className="p-ava" src={user.avatar} alt={user.username} width={108} height={108} unoptimized style={{ objectFit: "cover" }} />
          ) : (
            <div className="p-ava" />
          )}
          <div className="p-id">
            <h1>{user.realName || user.username}</h1>
            <p className="p-handle">@{user.username}</p>
            <div className="p-pills">
              <span className="pill rank">Global Rank · #{user.ranking?.toLocaleString() ?? "—"}</span>
              {yearStudying && <span className="pill year">Batch {yearStudying}</span>}
            </div>
          </div>
          <div className="p-side">
            <div><div className="lbl">Contest Rating</div><div className="val">{user.contestRating > 0 ? user.contestRating : "—"}</div></div>
            <div><div className="lbl">Contests Attended</div><div className="val">{user.attendedContestsCount}</div></div>
          </div>
        </div>

        {/* total solved + difficulty */}
        <div className="prow">
          <div className="card solved">
            <div className="lbl">Total Solved</div>
            <div className="big">{user.totalSolved}</div>
          </div>
          <div className="card diff">
            <h2>Difficulty Breakdown</h2>
            <div className="bar-row">
              <span className="name e">Easy</span>
              <div className="track"><div className="fill e" style={{ width: pct(user.easySolved) }} /></div>
              <span className="num">{user.easySolved}</span>
            </div>
            <div className="bar-row">
              <span className="name m">Medium</span>
              <div className="track"><div className="fill m" style={{ width: pct(user.mediumSolved) }} /></div>
              <span className="num">{user.mediumSolved}</span>
            </div>
            <div className="bar-row">
              <span className="name h">Hard</span>
              <div className="track"><div className="fill h" style={{ width: pct(user.hardSolved) }} /></div>
              <span className="num">{user.hardSolved}</span>
            </div>
          </div>
        </div>

        {/* calendar */}
        <div className="card cal">
          <div className="cal-head">
            <h2>Submission Calendar</h2>
            <span className="sub">Past 12 Months</span>
          </div>
          {calendar ? <Heatmap data={calendar} /> : (
            <div style={{ padding: 40, textAlign: "center", color: "var(--sub)" }}>No activity data available.</div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify against the mockup**

Run the dev server. Open `/user/<a-real-leetcode-username>` (e.g. one you know exists). Expected: matches `profile-redesign.html` — header with avatar/name/handle/pills/rating, total solved, difficulty bars, heatmap.

- [ ] **Step 3: Type-check + build**

Run: `npx tsc --noEmit` and the build.
Expected: compiles.

- [ ] **Step 4: Commit (checkpoint)**

```bash
git add src/app/user/[username]/page.tsx
# maintainer commits: "feat(ui): rebuild profile page (light)"
```

---

## Task 14: Reskin the remaining surfaces

These pages already read `--bu-*` variables (now repointed to light in Task 2), but contain hardcoded `text-white`, dark `rgba(255,255,255,…)` fills, and `#ff375f` reds that must be fixed for legibility on light.

**Files:**
- Modify: `src/app/admin/page.tsx`, `src/app/auth/signin/page.tsx`, `src/app/auth/verify/page.tsx`, `src/app/auth/error/page.tsx`, `src/components/AddUserModal.tsx`, `src/components/UserProfileModal.tsx`, `src/components/Navbar.tsx`

- [ ] **Step 1: Sweep each file for dark-only values**

In each file above, replace:
- `text-white` → `text-[var(--ink)]` (or remove where the parent already sets ink)
- `background: "rgba(255,255,255,0.05)"` / similar low-alpha white fills → `background: "var(--bg-2)"`
- hardcoded `#ff375f` / `var(--bu-red)` used as the accent → keep `var(--bu-red)` (now navy) or `var(--hard)` where it's semantically an error/delete action
- In `Navbar.tsx`, replace the inline dark styles and the `BU rge` wordmark with a light version: wordmark `BU` + `<span style={{color:'var(--red)'}}>rank</span>`, border `1px solid var(--line)`, text `var(--ink)`.

- [ ] **Step 2: Verify each surface**

Run the dev server and visit `/admin`, `/auth/signin`, `/auth/verify`, `/auth/error`, open the Add-User modal from the leaderboard. Expected: all legible on light (no white-on-white text, no dark cards).

- [ ] **Step 3: Type-check + build**

Run: `npx tsc --noEmit` and the build.
Expected: compiles.

- [ ] **Step 4: Commit (checkpoint)**

```bash
git add src/app/admin/page.tsx src/app/auth src/components/AddUserModal.tsx src/components/UserProfileModal.tsx src/components/Navbar.tsx
# maintainer commits: "feat(ui): reskin admin/auth/modals (light)"
```

---

## Task 15: Final verification pass

**Files:** none (verification only)

- [ ] **Step 1: Run the full logic test suite**

Run: `npm test`
Expected: PASS (best-badge + highlights tests).

- [ ] **Step 2: Production build**

Run: `RESEND_API_KEY=re_x EMAIL_FROM=a@b.co ADMIN_PASSWORD=x NEXTAUTH_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx NEXTAUTH_URL=http://localhost:3000 DATABASE_URL="postgresql://u:p@localhost:5432/db" npx next build`
Expected: build succeeds, all routes compile.

- [ ] **Step 3: Visual diff against mockups**

With the dev server running and a configured sheet (or a small hardcoded fixture), compare the leaderboard and a profile page side-by-side with `leaderboard-redesign.html` and `profile-redesign.html`. Confirm: podium ordering 1→2→3, hexagon avatars, best-badge tags, parallelogram bars with grey dividers, pointer only on bars, one continuous grey→white ground, and the profile header/bars/heatmap layout.

- [ ] **Step 4: Responsive check**

Resize to ~375px width. Expected: podium stacks (1st on top), highlight cards go 2-up, the ranked table scrolls horizontally inside its container without the page body scrolling sideways, profile sections stack.

- [ ] **Step 5: Commit any final fixes (checkpoint)**

Stage and let the maintainer commit any adjustments found during verification.

---

## Notes / follow-ups (not this plan)
- The old `StatCard`, `BadgeList`, `BadgePill`, and `UserProfileModal` components may become unused after this redesign; leave removal to a cleanup pass so this plan stays focused on the visible redesign.
- The email template and the SVG rank card (`src/app/card/[enrollment]/route.ts`) still carry the old red/BUrge branding; reskinning them is a small follow-up, tracked separately.
- Backend cron+cache (Workstream A) is a separate plan.
