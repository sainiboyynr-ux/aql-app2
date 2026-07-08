# ESME AQL Inspection Platform — SaaS Setup Guide
**ISO 2859-1 · ESME-QA-SOP-22-F-02**

---

## Architecture Overview

```
New Company → Signup Form → Approval Email → sainiboyynr@zohomail.in
                                                    ↓
                                          Approve / Reject Link
                                                    ↓
                                     Company Admin activated in DB
                                                    ↓
                                    Admin sets up Company Profile
                                                    ↓
                                    Admin adds team (QA Manager / Executive)
```

---

## STEP 1 — Supabase Setup

1. Go to https://supabase.com → Create project
2. **SQL Editor** → paste entire `supabase_schema.sql` → Run
3. **Authentication → Settings → Email** → turn OFF "Confirm email"
4. **Settings → API** → copy Project URL and anon key

---

## STEP 2 — Set up Resend (free email service — 3000 emails/month)

1. Go to https://resend.com → Sign up free
2. **API Keys** → Create API key → copy it
3. **Domains** → Add your domain OR use the free `resend.dev` sandbox
   - For sandbox: emails can only be sent to verified addresses
   - For production: verify your own domain (takes 5 minutes)

---

## STEP 3 — Deploy Edge Functions to Supabase

Install Supabase CLI:
```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

Set Edge Function secrets:
```bash
supabase secrets set RESEND_API_KEY=your_resend_key
supabase secrets set APP_URL=https://your-app.vercel.app
```

Deploy both functions:
```bash
supabase functions deploy send-approval-email
supabase functions deploy handle-approval
```

---

## STEP 4 — Push to GitHub

```bash
git init
git add .
git commit -m "ESME AQL SaaS Platform"
git remote add origin https://github.com/YOUR_USERNAME/aql-app.git
git push -u origin main
```

---

## STEP 5 — Deploy on Vercel

1. https://vercel.com → Add New Project → Import GitHub repo
2. Add Environment Variables:

| Variable | Value |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `VITE_APP_URL` | Your Vercel URL (e.g. https://aql-app.vercel.app) |

3. Deploy — live in ~1 minute ✅

---

## STEP 6 — Create Your Platform Admin Account

1. Go to your live app → Register Your Company
   - Use email: `sainiboyynr@zohomail.in`
   - Company name: `ESME Consumer Pvt. Ltd.`
2. Go to **Supabase → SQL Editor** and run:
```sql
UPDATE profiles
SET role = 'platform_admin', status = 'active'
WHERE email = 'sainiboyynr@zohomail.in';
```
3. You can now log in with full platform access.

---

## STEP 7 — Set Up Demo Account

1. In Supabase → **Authentication → Users → Add User**
   - Email: `demo@esmeqa.com`
   - Password: `Demo@1234`
   - Toggle Auto Confirm ON
2. Run in SQL Editor:
```sql
INSERT INTO companies (id, name, country, contact_email, industry)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Demo Company',
  'India',
  'demo@esmeqa.com',
  'Cosmetics'
);

UPDATE profiles SET
  role = 'demo',
  status = 'active',
  emp_id = 'DEMO001',
  full_name = 'Demo User',
  company_id = '00000000-0000-0000-0000-000000000001'
WHERE email = 'demo@esmeqa.com';
```

Demo login credentials shown on the login screen:
- **Email:** demo@esmeqa.com
- **Password:** Demo@1234

---

## How the Approval Flow Works

1. Company visits your app → clicks **"Register Your Company"**
2. They fill in name, company, email, password
3. Supabase creates their account with `status = 'pending_approval'`
4. Edge Function sends a rich HTML email to **sainiboyynr@zohomail.in**
5. You click **✅ APPROVE** or **❌ REJECT** directly in the email
6. On approval:
   - Company record is created in the database
   - Admin's profile is activated and linked to the company
   - Admin receives a welcome email with login link
7. Admin logs in → completes company profile setup → adds team members

---

## User Roles

| Role | Permissions |
|---|---|
| `platform_admin` | Full access to everything (you) |
| `company_admin` | Manage own company, team, all inspections |
| `qa_manager` | All inspections in company, view team reports |
| `qa_executive` | Create and submit own inspections |
| `demo` | Read-only demo access |

---

## File Structure

```
src/
├── App.jsx                    Main router — handles all auth states
├── supabaseClient.js          Supabase connection
├── hooks/useAuth.js           Auth + profile + company state
├── components/
│   ├── Login.jsx              Login + demo fill + register company button
│   ├── AdminSignup.jsx        Company registration form + pending screen
│   ├── PendingApproval.jsx    Waiting screen for unapproved admins
│   ├── CompanySetup.jsx       First-time company profile setup
│   ├── Navbar.jsx             Top bar + bottom nav (role-aware)
│   ├── Dashboard.jsx          Home with stats, drafts, recent
│   ├── InspectionForm.jsx     AQL form with defect counters
│   ├── History.jsx            Submitted inspections log
│   └── TeamManager.jsx        Add/suspend team members (admin only)
└── utils/
    ├── aqlCalculator.js       ISO 2859-1 + ESME defect types
    └── pdfReport.js           PDF with auto page-break fix

supabase/functions/
├── send-approval-email/       Sends approval request to sainiboyynr@zohomail.in
└── handle-approval/           Handles approve/reject link click
```
