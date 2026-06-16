# Plan: Production WhatsApp for B2B Customers

You want real customers (not just sandbox testers) to receive WhatsApp messages. That means moving from Twilio Sandbox to an **approved WhatsApp Business Sender**, and updating the code to handle WhatsApp's 24-hour rule with **approved templates**.

---

## Part 1 — What you need to do in Twilio + Meta (one-time, outside the app)

This part I cannot do for you. It needs your Twilio + Facebook Business accounts.

1. **Facebook Business Manager**
   - Create one at business.facebook.com if you don't have it.
   - Start **Business Verification** (Meta will ask for company docs: GST certificate, utility bill, or incorporation proof). Usually 1–3 business days.

2. **Twilio Console → Messaging → Senders → WhatsApp senders → Create new sender**
   - Pick a phone number you own (it must not already be on WhatsApp — if your `+91 9340093116` is on personal WhatsApp, delete that WhatsApp account first, or use a different number).
   - Choose a display name (e.g. your brand name).
   - Twilio submits it to Meta for review.

3. **Submit message templates for approval** (Twilio Console → Content Template Builder). We need at least two:
   - `complaint_received_owner` — notifies the business owner that a customer filed a complaint.
   - `complaint_ack_customer` — acknowledges the customer that their complaint was received.
   - Template approval is also 1–3 days. Keep wording transactional, not promotional.

4. Once approved, you'll have:
   - An **E.164 sender number** (e.g. `+9180XXXXXXXX`)
   - **Content SIDs** for each template (e.g. `HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)

---

## Part 2 — What I'll change in the app (after you give me the SIDs + sender)

### 2.1 Update secrets
- Update `TWILIO_WHATSAPP_FROM` to the approved sender number.
- Add new secrets:
  - `TWILIO_TEMPLATE_OWNER_SID` — content SID for owner notification
  - `TWILIO_TEMPLATE_CUSTOMER_ACK_SID` — content SID for customer acknowledgement

### 2.2 Update `send-whatsapp` edge function
Right now it sends freeform text via Twilio. WhatsApp blocks freeform outbound messages outside the 24-hour customer window — that's what would silently fail in production. I'll change it to:

- For the **first outbound** to a user (owner notification when a complaint comes in, or customer ack): send via Twilio **ContentSid + ContentVariables** (approved template).
- For **replies inside the 24-hour window** (owner → customer chat from `ComplaintThread`): keep freeform text — that's allowed.
- Track `last_inbound_at` per complaint so we know whether the 24-hour window is open. If a manager replies after 24h of silence, the function returns a clear error telling them to use a template instead of silently failing.

### 2.3 Small DB change
Add a `last_inbound_at timestamptz` column on `complaints`, updated by the `whatsapp-webhook` function whenever a customer message arrives. Used to decide template vs freeform.

### 2.4 Better error surfacing
- Save the Twilio error code + message into `complaint_messages` (new nullable `error_code`, `error_message` columns) when a send fails, so failures are visible in the dashboard instead of disappearing.
- Show a small "delivery failed" badge in `ComplaintThread` when a message has an error.

### 2.5 Webhook URL for Twilio
The `whatsapp-webhook` function is already deployed. After your sender is approved, you'll paste this URL into Twilio's sender config (Incoming Messages webhook):
`https://yvyuqqkejfxtftwpgijt.functions.supabase.co/whatsapp-webhook`
I'll surface this URL in the app's Settings page so you can copy it without leaving the dashboard.

---

## Part 3 — Suggested rollout order

1. You start Meta Business Verification + WhatsApp sender request in Twilio today (it's the long pole — 1–3 days).
2. While waiting, I implement 2.2 / 2.3 / 2.4 / 2.5 so the code is ready.
3. Once Twilio approves the sender and templates, you share with me:
   - the approved sender number
   - the two content SIDs
4. I update the secrets, and we run one real end-to-end test (QR complaint → owner gets WhatsApp template → owner replies → customer gets reply).

---

## Technical details (for reference)

- Twilio API call shape for template send:
  ```
  POST /Messages.json
  To=whatsapp:+91XXXXXXXXXX
  From=whatsapp:+91YYYYYYYYYY
  ContentSid=HXxxxxxxxx
  ContentVariables={"1":"Ravi","2":"Service was slow"}
  ```
- 24-hour window check: `now() - complaints.last_inbound_at < interval '24 hours'` → freeform OK, else template required.
- Error codes to special-case: `63016` (outside 24h window, no template), `63007` (sender not found), `63018` (template not approved).

---

**Question before I start coding Part 2:** do you want me to proceed implementing 2.2–2.5 now (so it's ready when Twilio approves), or wait until the sender + templates are approved so we can test as we go? I recommend starting now.
