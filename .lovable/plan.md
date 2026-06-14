## 1. Make onboarding optional after signup

- Add a **"Skip for now"** button on `OnboardingPage` that navigates straight to `/dashboard`.
- Stop forcing onboarding: today the dashboard route only loads, but if no business exists, parts of Settings/QR break. Show a soft banner on dashboard pages when `business` is missing: *"Complete your business info in Settings → Business Info to start collecting reviews."*
- `Settings → Business Info` already exists and is editable; if no business row exists yet, switch the **Save** mutation from `update` to `upsert` so the first save from Settings creates the row.

## 2. Auto-redirect already-registered users

- `SignInPage` and `SignUpPage`: if `useAuth().user` exists and not loading, `<Navigate to="/dashboard" replace />`. Same guard on `/onboarding` already redirects if business exists — keep it but allow the page to render with a Skip option (see step 1).
- `LandingPage` header CTAs already link to /sign-up; no change.

## 3. Remove the video/preview mock on landing page

- Delete the entire `{/* Product Preview */}` section (the "See ReviewFlow in action" block with the fake browser frame, roughly lines 235–275 of `src/pages/LandingPage.tsx`).

## 4. Complaints not appearing + no WhatsApp message received

Two separate problems are bundled here:

### 4a. Complaint not showing in dashboard
The QR page already calls `file_complaint` RPC so a row IS inserted into `complaints`. The dashboard list likely just isn't refreshing. Fix:
- Add Supabase **Realtime** subscription on `public.complaints` filtered by `business_id`, and `ALTER PUBLICATION supabase_realtime ADD TABLE public.complaints` via migration. Dashboard + Complaints page will then update live.
- Also invalidate the React Query cache on focus.

### 4b. No WhatsApp message arrives on the business owner's phone
Today the complaint button opens a `wa.me` deep link on the **customer's** phone with a prefilled message — the customer still has to tap **Send**, and there is no inbound channel that puts the conversation into your dashboard. That is why nothing appears in your WhatsApp.

To get a real two-way chat we need to switch from `wa.me` links to the **WhatsApp Business API via Twilio** (already documented as our messaging provider). Proposed flow:

```text
Customer scans QR → /r/:businessId
   ↓ taps "File a complaint"
Form on the page (name, phone, message) — no wa.me link
   ↓ submit
Edge function `send-complaint`:
  • insert row in complaints
  • Twilio API → send WhatsApp to manager_phone
   ↓
Twilio inbound webhook `whatsapp-webhook`:
  • append every reply to a new `complaint_messages` table
   ↓
Dashboard → Complaints → open thread → live chat (Realtime)
   ↓ owner types reply → edge function → Twilio → customer's WhatsApp
```

New pieces:
- `complaint_messages` table (`id, complaint_id, direction in ('in','out'), body, created_at`) with RLS scoped to the owning business, plus realtime publication.
- Edge functions `send-complaint` and `whatsapp-webhook` (Twilio signature verified).
- Connect the **Twilio** connector (requires you to provide Account SID + API key, and a WhatsApp-enabled sender or sandbox number).
- New `ComplaintThread` UI inside the Complaints page with message list + reply input.

### What I need from you before building 4b
- Confirm you want the full Twilio two-way chat (otherwise we keep the `wa.me` link and only fix 4a).
- A Twilio account with WhatsApp sender enabled (sandbox is fine for testing).

## Technical notes

- Files touched: `src/pages/OnboardingPage.tsx`, `src/pages/SignInPage.tsx`, `src/pages/SignUpPage.tsx`, `src/pages/LandingPage.tsx`, `src/pages/SettingsPage.tsx` (upsert), `src/pages/ComplaintsPage.tsx`, `src/pages/DashboardPage.tsx`, `src/hooks/useBusiness.tsx` (upsert mutation).
- New: `supabase/functions/send-complaint`, `supabase/functions/whatsapp-webhook`, migration for `complaint_messages` + realtime publication.
- No schema change for steps 1–3.
