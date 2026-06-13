## Goal

Every new signup gets an automatic 14-day Starter trial. Plans differ only by usage caps. Users get email + in-app reminders 2 days and 1 day before expiry. After expiry with no paid plan, the dashboard is locked behind a paywall.

## Plan tiers (caps-only)

| Capability | Trial (14d) | Starter ₹499/mo | Growth ₹1,499/mo |
|---|---|---|---|
| Review requests / month | 50 | 500 | Unlimited |
| Business locations | 1 | 1 | Unlimited |
| Team members | 1 | 1 | Unlimited |
| All features (dashboard, CSV import/export, QR, complaints, WhatsApp, templates, analytics) | ✓ | ✓ | ✓ |

All feature pages stay open for every plan. Only the numeric caps are enforced.

## 1. Database changes

Extend `subscriptions` table:
- `trial_started_at timestamptz`
- `trial_ends_at timestamptz`
- `reminder_2d_sent_at timestamptz`
- `reminder_1d_sent_at timestamptz`
- `status` values: `trialing` | `active` | `expired` | `canceled`

Update `handle_new_user()` trigger so every new auth user gets a row with `plan='trial'`, `status='trialing'`, `trial_started_at=now()`, `trial_ends_at=now()+14 days`.

Add helper SQL function `get_plan_limits(plan text)` returning `{ max_requests_per_month, max_locations, max_team }`.

Backfill: existing users on `plan='free'` get a trial window starting from their `created_at`.

## 2. Access control

New hook `usePlanAccess()` returns `{ plan, status, trialEndsAt, daysLeft, isExpired, limits }`.

`ProtectedRoute` (and `DashboardLayout`) reads this:
- `status === 'trialing'` and `daysLeft >= 0` → allow.
- `status === 'active'` (starter/growth) → allow.
- Otherwise → redirect to new `/upgrade` page (paywall) showing Starter/Growth cards and a "Choose a Plan" CTA. No dashboard route renders.

Settings page gets a "Billing" section showing current plan, trial countdown, and upgrade buttons.

## 3. Cap enforcement (where caps actually matter)

- **Add customer / send review request**: count this calendar month's requests for the business; if `>= max_requests_per_month`, block with a toast linking to `/upgrade`.
- **Onboarding / add location**: hide multi-location UI unless Growth.
- **Team members**: hide invite UI unless Growth (placeholder page is fine for now).

CSV export, QR, complaints, WhatsApp messaging, templates, analytics stay available to everyone with an active plan or trial.

## 4. In-app reminder popup

New `<TrialReminderDialog />` mounted in `DashboardLayout`. Shows once per day when `daysLeft <= 2 && status === 'trialing'`:
- Headline: "Only {n} day(s) left in your free trial"
- CTA buttons: "Upgrade to Starter" / "Upgrade to Growth" → `/upgrade`
- "Remind me later" stores dismissal in `localStorage` keyed by date.

## 5. Reminder emails (Lovable Emails)

Set up Lovable Cloud email infrastructure with a sender domain, then scaffold two app email templates:
- `trial-reminder-2d` — "2 days left in your ReviewFlow trial"
- `trial-reminder-1d` — "Last day of your ReviewFlow trial"

Both branded with the green/white aesthetic and a CTA button linking to `/upgrade`.

New scheduled edge function `trial-reminder-cron` runs hourly via `pg_cron`:
1. Find subscriptions where `status='trialing'` and `trial_ends_at` is between 47-48h from now and `reminder_2d_sent_at IS NULL` → enqueue `trial-reminder-2d`, stamp `reminder_2d_sent_at`.
2. Same for 23-24h window → `trial-reminder-1d`.
3. Find subscriptions where `trial_ends_at < now()` and `status='trialing'` → set `status='expired'`.

## 6. Upgrade page (`/upgrade`)

New public-after-auth page showing Starter and Growth cards (reusing pricing styles). Buttons currently mark the subscription as `active` with chosen plan (placeholder — real payment integration can be wired later via Stripe/Paddle when the user is ready).

## Technical details

- New migration adds the columns, updates the trigger, creates `get_plan_limits()`, backfills, and registers the `pg_cron` job pointing at the new edge function.
- New edge function: `supabase/functions/trial-reminder-cron/index.ts`.
- Email setup uses `email_domain--setup_email_infra` + `email_domain--scaffold_transactional_email`; requires the user to add a sender domain via the email setup dialog before reminders can actually send (in-app popup works without it).
- New files: `src/hooks/usePlanAccess.tsx`, `src/components/TrialReminderDialog.tsx`, `src/pages/UpgradePage.tsx`. Edits: `ProtectedRoute`, `DashboardLayout`, `App.tsx` routes, `CustomersPage` (quota check), `OnboardingPage` (location cap), `SettingsPage` (billing section).

## Out of scope

Real card processing — buttons will toggle the plan in DB as a stub. Connect Stripe/Paddle later when you're ready.
