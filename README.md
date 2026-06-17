# ESME AQL Inspection App
**SOP Ref: ESME-QA-SOP-22-F-02 | ISO 2859-1 General Inspection Level II**

---

## Tech Stack
- React + Vite (frontend)
- Supabase (auth + Postgres database)
- Vercel (free hosting)
- jsPDF (PDF report generation)

---

## Setup Instructions

### Step 1 — Set up Supabase

1. Go to https://supabase.com → create a free account → **New Project**
2. Go to **SQL Editor** → paste the full contents of `supabase_schema.sql` → click **Run**
3. Go to **Authentication → Settings** → turn OFF **"Confirm email"** (internal tool, no email needed)
4. Go to **Settings → API** → copy your:
   - **Project URL** (looks like `https://xxxx.supabase.co`)
   - **anon public key** (long string starting with `eyJ...`)

### Step 2 — Add your team to Supabase

1. Go to **Authentication → Users → Invite User**
2. Enter each inspector's work email and invite them
3. They will receive an email to set their password
4. After they sign up, go to **SQL Editor** and run this to assign their profile:

```sql
-- Replace the values below with real data
UPDATE profiles
SET emp_id = 'EMP001', full_name = 'Amit Sharma', role = 'qa_executive'
WHERE id = (SELECT id FROM auth.users WHERE email = 'amit@esme.com');
```

Roles: `qa_executive` or `qa_manager`

### Step 3 — Push to GitHub

1. Create a new repository on https://github.com (name it `aql-app`)
2. In your terminal:
```bash
git init
git add .
git commit -m "Initial commit — ESME AQL App"
git remote add origin https://github.com/YOUR_USERNAME/aql-app.git
git push -u origin main
```

### Step 4 — Deploy on Vercel

1. Go to https://vercel.com → Sign in with GitHub
2. Click **Add New Project** → Import your `aql-app` repository
3. Before clicking Deploy, go to **Environment Variables** and add:

| Variable Name | Value |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon public key |

4. Click **Deploy** — your app will be live in ~1 minute
5. Vercel gives you a free URL like `https://aql-app-xxxx.vercel.app`

Every time you push to GitHub, Vercel auto-deploys the update.

---

## AQL Decision Rules (ESME-QA-SOP-22-F-02)

| Defect Category | AQL Limit | Decision if exceeded |
|---|---|---|
| Critical | 0% (zero tolerance) | REJECT |
| Major | > 1% of sample | HOLD |
| Minor | > 4% of sample | HOLD |

Sample sizes per ISO 2859-1 General Inspection Level II:

| Batch Size | Letter | Sample Size |
|---|---|---|
| Up to 150 | F | 20 |
| 151–280 | G | 32 |
| 281–500 | H | 50 |
| 501–1,200 | J | 80 |
| 1,201–3,200 | K | 125 |
| 3,201–10,000 | L | 200 |
| 10,001–35,000 | M | 315 |
| 35,001–150,000 | N | 500 |
| 150,001–500,000 | P | 800 |
| 500,001+ | Q | 1,250 |

---

## Local Development (optional)

```bash
npm install
cp .env.example .env
# Fill in your Supabase credentials in .env
npm run dev
```

Open http://localhost:5173

---

## File Structure

```
src/
├── main.jsx                  Entry point
├── App.jsx                   Main router + auth gate
├── supabaseClient.js         Supabase connection
├── index.css                 Global styles
├── hooks/
│   └── useAuth.js            Login / logout / session
├── components/
│   ├── Login.jsx             Login screen
│   ├── Navbar.jsx            Top bar + bottom nav
│   ├── Dashboard.jsx         Home screen with stats
│   ├── InspectionForm.jsx    AQL form + defect counters
│   └── History.jsx           Submitted inspections log
└── utils/
    ├── aqlCalculator.js      ISO 2859-1 logic + defect types
    └── pdfReport.js          PDF report generator
```
