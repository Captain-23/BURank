# BURank

BURank is a LeetCode leaderboard for Bennett University. It turns individual problem-solving activity into a clear, continuously refreshed view of student rankings, batch performance, achievements, and recent submissions.

The project is designed for university coding communities that want a focused competitive programming dashboard without building a large data platform from scratch.

Live application: [burank.app](https://www.burank.app)

## Contents

- [What BURank Provides](#what-burank-provides)
- [Screenshots](#screenshots)
- [How the Data Pipeline Works](#how-the-data-pipeline-works)
- [Technology](#technology)
- [Repository Structure](#repository-structure)
- [Run Locally](#run-locally)
- [Configuration](#configuration)
- [Database and Migrations](#database-and-migrations)
- [Google Sheets Roster](#google-sheets-roster)
- [Scheduled Refresh](#scheduled-refresh)
- [Deployment](#deployment)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

## What BURank Provides

### Individual leaderboard

The main leaderboard ranks registered students by total LeetCode problems solved. Each row includes:

- Student name and LeetCode username
- Badge highlights
- Academic batch
- Total solved count
- Easy, Medium, and Hard totals
- Contest rating and attended contest count
- Global LeetCode rank
- A link to the student's BURank profile

The leaderboard supports name and username search, manual refresh, loading states, retry behavior, responsive layouts, and light or dark themes.

### Champions podium and highlights

The homepage surfaces the current top three students and summarizes notable results, including:

- Most solved problems
- Highest contest rating
- Most Hard problems solved
- First Blood for the current Question of the Week

### Batch Wars

Batch Wars groups registered students by their year of study and compares:

- Number of coders in each batch
- Average problems solved
- Total Easy problems solved
- Total Medium problems solved
- Total Hard problems solved

### Recent Activity

The activity feed shows recently recorded accepted submissions with:

- Student identity and avatar
- Problem number and title
- Difficulty
- Relative submission time
- A `NEW` indicator for recent activity
- Direct links to the student's profile and the LeetCode problem

The feed polls periodically in the browser and can be expanded to show more activity.

### Question of the Week

Administrators can publish a LeetCode problem as the current Question of the Week. The homepage can use that setting to identify the challenge and calculate the first student to solve it during the active period.

### Passwordless student access

Students sign in through a passwordless email link powered by NextAuth and Resend. The application validates Bennett University email addresses on both the client and server. Sessions use signed JWT cookies and remain valid for 30 days.

After signing in, a student can join the leaderboard by providing:

- LeetCode username
- Enrollment number
- Year of study

Registration validates the LeetCode account, rejects duplicate usernames, enrollment numbers, and email addresses, writes the roster entry, and places the initial statistics in the cache immediately.

### Student profiles

Each student profile includes:

- Name, username, avatar, batch, and enrollment number
- Global LeetCode rank
- Contest rating and contests attended
- Total solved count
- Easy, Medium, and Hard breakdown
- Submission activity heatmap for the past 12 months
- Earned badges and next-badge progress
- Link to the student's LeetCode profile

### Badges

Badges are computed from current LeetCode statistics. Available milestones include:

- Rookie, Century, Grinder, and Legend for total problems solved
- Brave, Savage, and Hard Enjoyer for Hard problems solved
- Contestant, Rated, Expert, and Master for contest participation and rating
- Balanced for Medium problems solved

### GitHub README cards

Profiles can generate a dynamic SVG rank card for use in a GitHub profile README. Students can:

- Preview their card
- Choose from multiple card themes
- Copy the image URL
- Copy ready-to-paste Markdown

Available themes include Classic, Velvet Red, Sea Blue, Evergreen, and Sunset Gold.

### Administrator dashboard

The `/admin` dashboard is protected by a dedicated password and signed HTTP-only session cookie. It provides:

- Registered user count and roster inspection
- User deletion from the roster and statistics cache
- Suppression of deleted users so stale refresh data cannot immediately restore them
- Question of the Week management
- Cache refresh and dashboard data reload controls

## Screenshots

Add screenshots manually in the placeholders below. Replace each placeholder with an image link or HTML image element when the final assets are ready.

### Homepage and individual leaderboard

<!-- Add screenshot here: homepage / individual leaderboard -->

`[Screenshot placeholder]`

### Batch Wars

<!-- Add screenshot here: Batch Wars view -->

`[Screenshot placeholder]`

### Student profile

<!-- Add screenshot here: student profile with badges and activity heatmap -->

`[Screenshot placeholder]`

### GitHub README card generator

<!-- Add screenshot here: profile card preview and Markdown controls -->

`[Screenshot placeholder]`

### Admin dashboard

<!-- Add screenshot here: administrator dashboard -->

`[Screenshot placeholder]`

### Sign-in and registration

<!-- Add screenshot here: passwordless sign-in or Join Leaderboard modal -->

`[Screenshot placeholder]`

## How the Data Pipeline Works

BURank separates the public read path from the external data refresh path.

```text
Google Sheet roster
        |
        | published CSV
        v
GitHub Actions scheduled refresh
        |
        | fetch and throttle LeetCode statistics
        v
scripts/refresh.ts
        |
        | authenticated POST using CRON_SECRET
        v
/api/cron/ingest
        |
        | transactional upserts and reconciliation
        v
PostgreSQL cache via Prisma
        |
        v
Public Next.js routes and pages
```

The refresh process also enriches recent submissions with problem metadata, computes First Blood for the current Question of the Week, stores activity events, removes stale roster entries, and invalidates relevant Next.js caches.

Browser-facing leaderboard, activity, Question of the Week, and card routes read from PostgreSQL. They do not call LeetCode or Google Sheets directly.

## Technology

| Area                 | Technology                               |
| -------------------- | ---------------------------------------- |
| Application          | Next.js 14 App Router                    |
| Language             | TypeScript                               |
| UI                   | React 18, Tailwind CSS, custom CSS       |
| Authentication       | NextAuth.js email provider, JWT sessions |
| Email delivery       | Resend                                   |
| Database             | PostgreSQL                               |
| ORM                  | Prisma                                   |
| Roster management    | Google Sheets published CSV              |
| Roster writes        | Google Apps Script Web App               |
| External statistics  | LeetCode GraphQL API                     |
| Scheduled operations | GitHub Actions                           |
| Hosting target       | Vercel                                   |
| Tests                | Vitest                                   |

## Repository Structure

```text
.
|-- src/app/                 Next.js pages and API route handlers
|-- src/components/          Shared UI, leaderboard, and profile components
|-- src/lib/                 Authentication, LeetCode, roster, cache, badges, and activity logic
|-- src/types/               Shared TypeScript types
|-- prisma/                  Prisma schema and database migrations
|-- scripts/                 Scheduled refresh and maintenance scripts
|-- assets/screenshots/      Screenshot assets
|-- docs/                    Product plans, specifications, and design references
|-- google-apps-script.js    Google Sheets write endpoint
|-- DEPLOY.md                Detailed production deployment runbook
`-- PRD.md                   Product requirements and architecture background
```

Important routes include:

| Route                | Purpose                                                         |
| -------------------- | --------------------------------------------------------------- |
| `/`                  | Public leaderboard, Batch Wars, highlights, and recent activity |
| `/auth/signin`       | Passwordless email sign-in                                      |
| `/auth/verify`       | Magic-link verification state                                   |
| `/user/[username]`   | Student profile                                                 |
| `/card/[enrollment]` | Dynamic SVG rank card                                           |
| `/admin`             | Protected administration dashboard                              |
| `/api/leaderboard`   | Current leaderboard data                                        |
| `/api/feed`          | Recent activity events                                          |
| `/api/qotw`          | Question of the Week settings                                   |
| `/api/problems`      | Cached problem metadata                                         |
| `/api/auth/register` | Authenticated student registration                              |
| `/api/cron/ingest`   | Authenticated cache ingestion endpoint                          |

## Run Locally

### Prerequisites

- Node.js 20 or newer
- npm
- A PostgreSQL database
- A Resend account and verified sender address for magic-link email
- A published Google Sheet CSV URL for roster data

### Installation

```bash
git clone https://github.com/Captain-23/BURank.git
cd BURank
npm install
```

Create the local environment file:

```bash
cp .env.local.example .env.local
```

Fill in the required values described in [Configuration](#configuration), then apply the Prisma schema:

```bash
npx prisma migrate deploy
npx prisma generate
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Configuration

The complete annotated template is available in `.env.local.example`.

### Required application variables

| Variable                    | Purpose                                                              |
| --------------------------- | -------------------------------------------------------------------- |
| `DATABASE_URL`              | PostgreSQL connection string used by Prisma, NextAuth, and the cache |
| `NEXTAUTH_SECRET`           | Secret used to sign NextAuth tokens                                  |
| `NEXTAUTH_URL`              | Application base URL                                                 |
| `RESEND_API_KEY`            | Resend API key for magic-link delivery                               |
| `EMAIL_FROM`                | Verified sender address, for example `BURank <noreply@example.com>`  |
| `ADMIN_PASSWORD`            | Password for `/admin`                                                |
| `NEXT_PUBLIC_SHEET_CSV_URL` | Published, read-only Google Sheet CSV export URL                     |
| `SHEET_WRITE_URL`           | Server-only Google Apps Script write endpoint                        |
| `SHEET_WRITE_SECRET`        | Shared secret for protecting Apps Script writes                      |
| `CRON_SECRET`               | Bearer secret for `/api/cron/ingest`                                 |
| `SITE_URL`                  | Deployed URL used by the refresh script                              |

### Optional variables

| Variable                   | Purpose                                                               |
| -------------------------- | --------------------------------------------------------------------- |
| `ADMIN_SESSION_SECRET`     | Dedicated signing key for the admin cookie; recommended in production |
| `NEXT_PUBLIC_COLLEGE_NAME` | Card branding and college name; defaults to `Bennett University`      |

Generate secrets with:

```bash
openssl rand -base64 32
```

Keep `SHEET_WRITE_URL`, `SHEET_WRITE_SECRET`, `ADMIN_PASSWORD`, and all signing secrets server-side. Do not expose them through `NEXT_PUBLIC_` variables.

## Database and Migrations

Prisma uses PostgreSQL for authentication, cached user statistics, settings, problem metadata, and activity events.

The schema contains:

- `User`, `Account`, `Session`, and `VerificationToken` for authentication
- `UserStat` for the refreshed leaderboard cache
- `Setting` for Question of the Week and First Blood state
- `Problem` for cached problem metadata
- `ActivityEvent` for recent accepted submissions

Apply committed migrations with:

```bash
npx prisma migrate deploy
```

For local schema work, use the normal Prisma workflow and commit the generated migration. Do not use `prisma db push` as a substitute for production migrations.

## Google Sheets Roster

Google Sheets remains the editable roster source, while PostgreSQL serves the application cache.

The `users` sheet uses these columns:

```text
username | email | addedAt | yearStudying | enrollmentNo | password
```

The `settings` sheet stores the Question of the Week URL, its timestamp, and First Blood state.

To configure writes:

1. Open the roster sheet and select Extensions, then Apps Script.
2. Paste the contents of `google-apps-script.js`.
3. Set `SHEET_WRITE_SECRET` in the script to the same value used by the application, or keep both disabled only for a controlled local setup.
4. Deploy the script as a Web App executed as the owner and accessible to users who have the URL.
5. Put the deployment URL in the server-only `SHEET_WRITE_URL` variable.

For an existing sheet created with an older column layout, follow the migration notes in `DEPLOY.md` before deploying the updated script.

## Scheduled Refresh

The workflow in `.github/workflows/refresh.yml` runs every 15 minutes and can also be started manually from GitHub Actions.

It requires these repository secrets:

- `NEXT_PUBLIC_SHEET_CSV_URL`
- `SITE_URL`
- `CRON_SECRET`

The refresh command can also be run locally:

```bash
npm run refresh
```

The command reads the roster CSV, fetches LeetCode data in throttled chunks, enriches recent activity, computes First Blood, and submits the result to the protected ingestion route.

Until the first refresh completes, the PostgreSQL cache may be empty and the public leaderboard may contain no users.

## Deployment

The application is intended for deployment on Vercel with a managed PostgreSQL database.

At minimum:

1. Create the production PostgreSQL database.
2. Configure the required environment variables in the hosting provider.
3. Run `npx prisma migrate deploy` against the production database.
4. Deploy the Next.js application.
5. Configure the Google Apps Script Web App and published roster CSV.
6. Add the GitHub Actions secrets for scheduled refreshes.
7. Run the refresh workflow once manually and verify the leaderboard.

The full production checklist, including Google Sheet migration details and verification steps, is in [DEPLOY.md](DEPLOY.md).

## Testing

Run the test suite with:

```bash
npm test
```

Run the linter with:

```bash
npm run lint
```

The tests cover roster parsing and reconciliation, enrollment handling, activity processing, badge logic, CSV URL handling, highlight calculations, and suppressed-user behavior.

## Contributing

Contributions are welcome. Before opening a pull request:

1. Create a focused feature branch.
2. Keep changes scoped to one problem or feature.
3. Preserve the existing TypeScript and component patterns.
4. Run the relevant tests and linter.
5. Describe behavior changes and include screenshots for meaningful UI changes.

```bash
git checkout -b feature/your-change
npm install
npm test
npm run lint
```

For larger changes, open an issue first so the implementation can be discussed before work begins.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the repository contribution workflow.

## License

This project is distributed under the license in [LICENSE](LICENSE).
