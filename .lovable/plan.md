## Problem

Two flows are non-functional:

1. **"Request" button** on `/dashboard/customers` (CustomersPage.tsx, line 132) has no `onClick` handler. Clicking it does nothing — no WhatsApp open, no DB update.
2. **"File a Complaint"** on the public QR page (`/r/:businessId`) opens a WhatsApp chat to the manager but **never inserts a row into the `complaints` table**. So the Complaints page and sidebar badge stay empty even after a customer "files" one.

Since no Twilio is wired yet, the "Send Request" action should also be a WhatsApp deep-link (consistent with the rest of the app — Indian market, WhatsApp-first).

## Plan

### 1. CustomersPage — make "Request" send a WhatsApp review request
- Add `handleRequest(customer)` that:
  - Builds the public review link: `${window.location.origin}/r/${business.id}`
  - Normalizes the customer's phone (strip spaces/`+`/`-`/`()`), defaulting to `91` country code if missing.
  - Opens `https://wa.me/<phone>?text=<encoded message>` in a new tab. Message:
    `"Hi <name>, thanks for visiting <business_name>! We'd love your feedback: <link>"`
  - Updates the customer row: `status = "requested"`, `last_requested_at = now()` (if column exists; otherwise just `status`).
  - Invalidates the `customers` query and toasts "Request sent".
- Wire `onClick={() => handleRequest(c)}` on the Request button.

### 2. QRRoutingPage — actually create a complaint row
- In `handleComplaint`, before opening WhatsApp:
  - Insert into `public.complaints` via a new `SECURITY DEFINER` RPC `file_complaint(_business_id, _customer_name?, _customer_phone?, _complaint_text?)` that inserts a row with `status='new'`. Public/anon callable.
  - On success, then open the WhatsApp URL (existing logic).
- Optionally add a tiny pre-submit form (name + short message) on the public page so the complaint row carries useful info. **Decision needed** — see questions.

### 3. Migration
- Create `public.file_complaint` SECURITY DEFINER function that allows anon to insert a complaint scoped to a business id. Grant EXECUTE to `anon, authenticated`.
- Verify `complaints` table has columns used (`customer_name`, `customer_phone`, `complaint_text`, `status`, `business_id`) — already present per ComplaintsPage usage.

### 4. Verify
- Add a customer → click Request → WhatsApp tab opens with prefilled link; row status flips to "requested".
- Open `/r/<businessId>` in incognito → click File a Complaint → row appears in Complaints page and sidebar badge increments in realtime.

## Open question

Before filing a complaint, should the public page show a small form (name + message) so the complaint row carries context, or just insert a stub row ("Complaint via QR") and rely on the WhatsApp chat for details?
