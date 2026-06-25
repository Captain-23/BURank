# Product Requirements Document (PRD)
## Bennett University — LeetCode Leaderboard

---

### 1. Product Overview

**Product Name:** Bennett University LeetCode Leaderboard  
**Description:** A zero-cost, production-ready leaderboard built for colleges. It provides a real-time, competitive environment where students can track their LeetCode progress, view their ranking among peers, and compete in batch-wise (year-of-study) group competitions.  
**Target Audience:** Students, faculty, and coding clubs at Bennett University (or any academic institution when customized).  

---

### 2. Goals & Objectives

- **Encourage Competitive Programming:** Foster a competitive but healthy coding culture by displaying individual and batch-wise rankings.
- **Zero Maintenance & Cost:** Leverage serverless architecture (Vercel) and a Google Sheet database to keep running costs at zero while minimizing maintenance.
- **Easy Onboarding:** Allow students to join the leaderboard seamlessly with basic information (Username, Enrollment Number, Year of Study) while ensuring data validity against the LeetCode API.
- **Administrative Control:** Provide a secure admin dashboard to moderate the leaderboard, remove invalid entries, and set dynamic engaging content (e.g., Question of the Week).

---

### 3. Key Features

#### 3.1. Public Leaderboard (Individual View)
- Real-time ranking based on the number of LeetCode problems solved.
- Displays key statistics per user:
  - Total solved
  - Easy/Medium/Hard breakdown
  - Contest Rating & Contests Attended
  - Global LeetCode Rank
  - Batch (Year of Studying)
- Sorting, searching, and filtering capabilities (Top 10, Contestants only).

#### 3.2. Batch Wars (Group Competition)
- Aggregates user statistics by their Batch (Year of Studying).
- Displays average problems solved per batch to encourage cohort-based competition.
- Shows total cumulative Easy/Medium/Hard problems solved by the batch.
- Visual progress bars showing the relative dominance of the top-performing batch.

#### 3.3. Question of the Week (QOTW)
- A dynamic banner on the homepage displaying a curated LeetCode problem.
- Designed to direct students towards practicing specific concepts simultaneously.
- Configurable directly from the Admin Dashboard.

#### 3.4. User Registration (Add User Modal)
- Secure modal to collect:
  - LeetCode Username
  - College Enrollment Number (used as a unique primary key to prevent duplicates/fake accounts)
  - Year of Studying
- Live validation against the LeetCode GraphQL API to ensure the account exists.
- Duplicate checking to prevent the same username or enrollment number from being added twice.

#### 3.5. Admin Dashboard
- **Authentication:** Password-protected route (`/admin`) using HTTP-only cookies.
- **User Management:** View all registered users (including their enrollment numbers) and execute one-click deletions.
- **Settings Management:** Input a LeetCode URL to update the "Question of the Week" banner globally.

---

### 4. Technical Architecture

#### 4.1. Tech Stack
- **Frontend:** Next.js 14 (App Router), React, Tailwind CSS
- **Backend/API:** Next.js Serverless Route Handlers
- **Database:** Google Sheets
- **Database Connector:** Google Apps Script (GAS) configured as a Web App to handle read/write operations via JSON.
- **External APIs:** LeetCode GraphQL API (for fetching live stats)
- **Hosting:** Vercel

#### 4.2. Data Flow
1. **Reads:** The frontend fetches the published CSV URL of the Google Sheet directly or via Next.js API routes. LeetCode stats are fetched server-side in parallel to avoid CORS and rate limits.
2. **Writes:** The Next.js API routes (`/api/add-user`, `/api/admin/action`) send POST requests to the Google Apps Script Web App URL. The script processes the JSON payload and updates the spreadsheet.
3. **Authentication:** The Admin login route sets a secure, HTTP-only `admin_session` cookie. Admin actions read this cookie from the incoming request before executing operations.

#### 4.3. Data Schema (Google Sheets)
- **`users` Tab:** 
  - `username` (string)
  - `addedAt` (ISO date string)
  - `yearStudying` (string, e.g., "2024-2028")
  - `enrollmentNo` (string, e.g., "E24CSE001")
- **`settings` Tab:**
  - Column A: `key` (e.g., "QOTW")
  - Column B: `value` (e.g., "https://leetcode.com/problems/two-sum")

---

### 5. Non-Functional Requirements

- **Performance:** Leaderboard fetches should not block rendering. Use React `Suspense` and skeleton loaders during data fetching. Parallelize LeetCode API fetches in chunks to avoid rate limiting.
- **Security:** 
  - Admin password must be stored as an environment variable (`ADMIN_PASSWORD`).
  - Write operations must only happen via Next.js API routes, not directly from the browser, to keep the Google Apps Script URL hidden from public users.
- **Responsiveness:** The UI must be fully functional on mobile devices, with scrollable data tables and responsive modal forms.
- **Aesthetics:** Use a dark-mode-first approach with vibrant accents, glassmorphism, and micro-animations to create a premium, engaging feel.

---

### 6. Future Enhancements (Roadmap)
- **User Profiles:** Clickable usernames that navigate to a detailed user page showing an activity heatmap and historical progress.
- **Automated Discord/WhatsApp Bot:** A bot that announces daily top solvers and the Question of the Week.
- **Custom Badges:** Internal university-specific achievements (e.g., "First to solve QOTW", "100 Day Streak").
