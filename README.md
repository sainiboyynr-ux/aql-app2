# BeautySureAQL — AQL Inspection Platform
**ISO 2859-1 · BSAQL-QA-SOP-22-F-02**

Multi-tenant SaaS platform for cosmetics finished-goods AQL inspection.

---

## How signup works (simple flow)

```
Company Admin fills signup form
        ↓
Supabase sends standard confirmation email
        ↓
Admin clicks link in email → account confirmed
        ↓
Admin logs in → company profile auto-created at signup
        ↓
Admin adds team members (QA Manager / QA Executive) from the Team tab
```

No manual approval step — this uses Supabase's built-in email confirmation, exactly like any standard SaaS signup (Google, Notion, etc).

---

## STEP 1 — Supabase Setup

1. Go to https://supabase.com → Create project
2. **SQL Editor** → paste entire `supabase_schema.sql` → Run
3. **Authentication → Settings → Email**
   - Keep **"Confirm email"** turned **ON** (this is what sends the confirmation link)
   - Under **URL Configuration**, set:
     - **Site URL** → your Vercel app URL (e.g. `https://beautysureaql.vercel.app`)
     - **Redirect URLs** → add `https://beautysureaql.vercel.app/**`
4. **Settings → API** → copy Project URL and anon key

That's it — no Edge Functions, no Resend account needed for this simplified flow.

---

## STEP 2 — Push to GitHub

```bash
git init
git add .
git commit -m "BeautySureAQL platform"
git remote add origin https://github.com/YOUR_USERNAME/beautysureaql.git
git push -u origin main
```

---

## STEP 3 — Deploy on Vercel

1. https://vercel.com → Add New Project → Import GitHub repo
2. Add Environment Variables:

| Variable | Value |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |

3. Deploy — live in ~1 minute ✅
4. Go back to Supabase → update Site URL / Redirect URLs with your real Vercel domain if it changed

---

## STEP 4 — Set Up Demo Account

In Supabase → **Authentication → Users → Add User**:
- Email: `demo@beautysureaql.com`
- Password: `Demo@1234`
- Toggle **Auto Confirm** ON

Then run in SQL Editor:
```sql
UPDATE profiles SET
  role       = 'demo',
  status     = 'active',
  emp_id     = 'DEMO001',
  full_name  = 'Demo User',
  company_id = '00000000-0000-0000-0000-000000000001'
WHERE email = 'demo@beautysureaql.com';
```

The Login screen has a **"Fill Demo Credentials"** button that auto-fills these.

---

## STEP 5 (Optional) — Make yourself a platform admin

If you want a superuser account that can see across all companies later, sign up normally, then run:
```sql
UPDATE profiles SET role = 'platform_admin', status = 'active'
WHERE email = 'your-email@example.com';
```

---

## User Roles

| Role | Permissions |
|---|---|
| `platform_admin` | Full platform access (optional, for you) |
| `company_admin` | Manages own company, team, all inspections |
| `qa_manager` | All inspections in company, view team reports |
| `qa_executive` | Create and submit own inspections |
| `demo` | Read-only demo access |

---

## How a new company signs up

1. They visit your live app → click **"Register Your Company"**
2. Fill in name, email, password, company name, country
3. Click **Create Admin Account**
4. Supabase sends them a confirmation email automatically
5. They click the link → return to the app → log in
6. Their company profile is already created — they land straight on the Dashboard
7. They go to the **Team** tab → add QA Managers / QA Executives

---

## Data security

Every table uses Supabase Row Level Security (RLS), filtered by `company_id`.
Company A can never see Company B's inspections, team members, or data — even though everyone shares the same database.

---

## File Structure

```
src/
├── App.jsx                    Main router — auth state machine
├── supabaseClient.js          Supabase connection
├── hooks/useAuth.js           Auth + profile + company state
├── components/
│   ├── Login.jsx              Login + demo fill + register company button
│   ├── AdminSignup.jsx        Company registration (standard email confirm)
│   ├── CompanySetup.jsx       Fallback company profile setup
│   ├── Navbar.jsx             Top bar + bottom nav (role-aware)
│   ├── Dashboard.jsx          Home with stats, drafts, recent
│   ├── InspectionForm.jsx     AQL form with defect counters
│   ├── History.jsx            Submitted inspections log
│   └── TeamManager.jsx        Add/suspend team members (admin only)
└── utils/
    ├── aqlCalculator.js       ISO 2859-1 + BeautySureAQL defect types
    └── pdfReport.js           PDF with auto page-break fix
```
