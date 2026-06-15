# Fix complaint capture + WhatsApp delivery

## What's actually wrong

After inspecting the DB and code:

- **All recent complaints in the DB show `customer_name='Anonymous'`, `customer_phone=NULL`, `complaint_text='Complaint filed via QR — details sent on WhatsApp'`, `rating=NULL`.** That placeholder text no longer exists anywhere in the codebase — it came from a previous version of the QR flow. So no real customer data has reached the DB since that change.
- **No rows in `complaint_messages`** and **zero invocations** of either `send-whatsapp` or `whatsapp-webhook` in the logs → WhatsApp has effectively never run end-to-end with the current code.
- **The QR form never asks for a star rating**, so even when the new form works, `rating` will always stay NULL.
- **`QRRoutingPage` swallows WhatsApp errors silently** (`console.warn`) and still shows the success screen, so the customer/you never see why WhatsApp failed.
- One business has a leading space in `manager_phone` (`" +91 8989595109"`) — harmless after normalize, but worth trimming.
- Twilio WhatsApp likely requires the recipient (manager + customer) to have **joined the Twilio WhatsApp Sandbox** for number `+1 586 354 9500`, or to be on an approved template. We can't fix Twilio config from code, but we should surface the real error.

## Plan

### 1. QR complaint form (`src/pages/QRRoutingPage.tsx`)
- Add a **required 1–5 star rating** picker above the name field.
- Phone field: light client-side validation (≥10 digits, auto-prefix `+91` if missing).
- On submit, pass `_rating` to a new RPC param (see step 3).
- **Show real WhatsApp errors**: if `send-whatsapp` returns an error, show a toast like "Complaint saved, but WhatsApp delivery failed: <reason>" instead of silently succeeding. Still mark as submitted so the complaint is recorded.

### 2. Complaints dashboard (`src/pages/ComplaintsPage.tsx`)
- Already renders `customer_name`, `customer_phone`, `rating`, `complaint_text` — no change needed once data flows.
- Add a small "WhatsApp not delivered" indicator when `complaint_messages` has zero outbound rows for that complaint (optional, low priority).

### 3. DB migration
- Update `public.file_complaint` to accept `_rating int` and insert it into `complaints.rating` (validated 1–5).
- Trim leading/trailing whitespace on `manager_phone` for the existing business row (data fix, via insert tool).

### 4. `send-whatsapp` edge function
- Return a **200 with `{ ok:false, error }`** instead of 400 when Twilio fails, so the client can show the reason without the request being treated as a network failure.
- Log Twilio's full response body to function logs for debugging.
- Trim `manager_phone` before sending.

### 5. Twilio sandbox guidance (chat reply only, no code)
After the fix, if WhatsApp still doesn't deliver, the cause is almost certainly the **Twilio WhatsApp Sandbox opt-in**: every recipient (your `+91 8989595109` manager number and each customer number) must first send `join <sandbox-keyword>` to `+1 586 354 9500` from their WhatsApp. I'll spell this out after deploying the code fix.

## Technical notes
- `file_complaint` RPC signature change is backward-compatible — `_rating` defaults to NULL.
- No RLS changes needed; existing policies already let owners read their own complaints.
- Realtime is already wired on `complaints` in `ComplaintsPage.tsx`.

## Files touched
- `src/pages/QRRoutingPage.tsx` (rating picker, phone validation, error surfacing)
- `supabase/functions/send-whatsapp/index.ts` (better error responses + logging, trim manager phone)
- New migration: update `file_complaint` to accept `_rating`
- Data fix: trim `manager_phone` whitespace
