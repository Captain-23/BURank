# 🏆 Bennett University — LeetCode Leaderboard

A zero-cost, production-ready leaderboard for tracking LeetCode progress across your college.  
Built with **Next.js 14**, **Tailwind CSS**, **Google Sheets** (as DB), and deployed free on **Vercel**.

---

## ✨ Features

- **Live Individual Leaderboard:** Track problems solved, E/M/H breakdown, contest rating, and global rank.
- **Batch Wars:** A group competition view comparing batches (years of study) by average problems solved to encourage peer engagement.
- **Question of the Week:** A dynamic, admin-curated LeetCode problem banner on the homepage to focus practice.
- **Secure Registration:** Students add themselves via a modal. Enrollment Numbers prevent duplicates, and usernames are validated live against LeetCode before saving.
- **Admin Dashboard:** A password-protected portal to manage users and set the Question of the Week.
- **Zero-Maintenance Database:** Uses Google Sheets and Google Apps Script as a free backend.
- **Server-Side APIs:** Custom API routes handle data aggregation and circumvent LeetCode CORS restrictions.
- **Premium UI/UX:** Responsive, dark mode, skeleton loading states, and dynamic filtering (Top 10 / Contestants).

---

## 🗂 Project Structure

```
src/
├── app/
│   ├── admin/                 # Secure Admin Dashboard UI
│   ├── api/
│   │   ├── admin/             # Auth and Action routes for Admin
│   │   ├── leaderboard/       # GET all users with stats
│   │   ├── qotw/              # GET Question of the week
│   │   └── add-user/          # POST validate + add username
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx               # Main leaderboard UI (Individuals & Batch Wars)
├── components/
│   ├── AddUserModal.tsx       # Registration form
│   ├── Heatmap.tsx            # Activity heatmap component
│   ├── SkeletonRows.tsx
│   └── StatCard.tsx
├── lib/
│   ├── leetcode.ts            # LeetCode GraphQL fetcher
│   └── sheets.ts              # Google Sheets read/write functions
└── types/index.ts
```

---

## 🚀 Setup Guide (Step by Step)

### Step 1 — Create the Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new sheet.
2. Rename the first tab to `users`.
3. In Row 1, add these headers:
   - `A1` → `username`
   - `B1` → `addedAt`
   - `C1` → `yearStudying`
   - `D1` → `enrollmentNo`
4. Add a second tab and name it `settings`.
   - `A1` → `key`
   - `B1` → `value`

### Step 2 — Publish the Sheet as CSV (for reading)

1. File → Share → **Publish to web**
2. Select the `users` tab.
3. Format: **Comma-separated values (.csv)**
4. Click **Publish**
5. Copy the URL — it looks like:  
   `https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/pub?gid=0&single=true&output=csv`

### Step 3 — Deploy the Apps Script (for writing)

1. In your Google Sheet, go to **Extensions → Apps Script**.
2. Delete any existing code.
3. Paste the complete contents of `google-apps-script.js` (included in this repository).
4. Save (Ctrl+S), name it anything.
5. Click **Deploy → New Deployment**.
   - Type: **Web App**
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Click Deploy, authorize when prompted.
7. Copy the **Web App URL**.

### Step 4 — Configure environment variables

Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

Fill in the required variables:

```env
NEXT_PUBLIC_SHEET_CSV_URL=<your CSV URL from Step 2>
NEXT_PUBLIC_SHEET_WRITE_URL=<your Apps Script URL from Step 3>
NEXT_PUBLIC_COLLEGE_NAME=Bennett University
ADMIN_PASSWORD=<your_super_secret_admin_password>
```

### Step 5 — Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)
Access the Admin Dashboard at [http://localhost:3000/admin](http://localhost:3000/admin)

---

## ☁️ Deploy to Vercel (Free)

1. Push this repo to GitHub.
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your repo.
3. In **Environment Variables**, add:
   - `NEXT_PUBLIC_SHEET_CSV_URL`
   - `NEXT_PUBLIC_SHEET_WRITE_URL`
   - `NEXT_PUBLIC_COLLEGE_NAME`
   - `ADMIN_PASSWORD`
4. Click **Deploy** — done! 🎉

Your app will be live at `your-project.vercel.app` in ~1 minute.

---

## 🔒 Notes on Trust & Security

This leaderboard uses a **trust-based** model on the frontend, supplemented by enrollment verification.  
- **Duplicate Prevention:** The system actively checks for duplicate usernames and enrollment numbers.
- **Data Integrity:** Usernames are queried against LeetCode's API before insertion; if the user doesn't exist, the registration is rejected.
- **Admin Moderation:** The secure `/admin` portal allows authorized personnel to delete problematic or fake entries instantly.

---

## 🛠 Tech Stack

| Tool | Purpose | Cost |
|---|---|---|
| Next.js 14 | Frontend + API routes | Free |
| Tailwind CSS | Styling | Free |
| LeetCode GraphQL API | Stats data | Free (public) |
| Google Sheets | Database | Free |
| Google Apps Script | Write endpoint | Free |
| Vercel | Hosting | Free |

**Total monthly cost: ₹0**

---

## 🤝 Contributing

Fork, improve, and share with your college! PRs welcome. For detailed product vision and requirements, see `PRD.md`.
