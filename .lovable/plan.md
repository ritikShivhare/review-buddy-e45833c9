
## Goals

1. Every phone input gets a country-code dropdown with full country list, defaulting to **+91 (India)** but auto-detecting from browser locale/timezone when possible. User can change at any time.
2. Fix the broken "send review request" + "reply to complaint" experience by making it explicit and reliable via WhatsApp click-to-chat (wa.me), with clear UI state and an easy switch to automated Twilio template sends later.
3. No database schema changes. Phone numbers continue to be stored in E.164 format (`+<countrycode><number>`).

---

## 1. Country-code picker component

Create `src/components/PhoneInput.tsx` — a reusable controlled input that returns a full E.164 string (e.g. `+919876543210`).

- Library: install `libphonenumber-js` (small, no native deps) for validation + parsing + country metadata.
- UI: shadcn `Popover` + `Command` (searchable) on the left, native `Input` on the right. Shows flag emoji + dial code (e.g. 🇮🇳 +91). Search by country name or dial code.
- Auto-detect default country:
  1. If a value is already passed in, parse it and use that country.
  2. Else try `Intl.DateTimeFormat().resolvedOptions().timeZone` → map common Asia/Kolkata, Asia/Dubai, America/*, Europe/* etc. to ISO codes.
  3. Else `navigator.language` region.
  4. Fallback: `IN`.
- Validation: live check via `isValidPhoneNumber`; show inline error.
- Props: `value`, `onChange(e164 | "")`, `onValidChange?(boolean)`, `defaultCountry?`.

Replace existing hardcoded "+91" prefix UI in:
- `src/pages/CustomersPage.tsx` (Add Customer dialog).
- `src/pages/SettingsPage.tsx` (Manager Phone field — Business Info tab).
- `src/pages/QRRoutingPage.tsx` (customer complaint form).
- `src/pages/OnboardingPage.tsx` (if it asks for manager phone — to be confirmed when editing).

The `normalizePhone` helpers in `QRRoutingPage` and `CustomersPage` will be removed in favor of the already-E.164 value coming from `PhoneInput`.

---

## 2. Review-request "send" flow — make click-to-chat explicit & reliable

The current `Send Request` action in **Customers** opens `wa.me/...` in a new tab and marks the customer as `requested`. The user expected it to send automatically — that requires approved Twilio templates which aren't ready yet.

Changes (frontend only, no backend):
- Rename the button label/tooltip from `Request` → `Open WhatsApp` with a small WhatsApp icon, and add a one-line helper under the table: "Tapping Open WhatsApp launches a pre-filled message — review and hit send in WhatsApp."
- Detect popup blockers: if `window.open(...)` returns `null`, show a toast with a "Copy message" / "Copy link" fallback that copies the wa.me URL to the clipboard.
- Only mark the customer `status = 'requested'` **after** the user confirms (button now toggles to "Mark as Sent" once the WhatsApp tab opens, OR auto-marks after 3s if not cancelled). Prevents false "requested" status when the WhatsApp tab fails to open.
- Add a "Resend" affordance for customers already in `requested` status.
- In **Settings → WhatsApp** tab, add a clearly-worded panel at the top:
  > **Current mode: Manual (Click-to-chat)** — review requests and replies open WhatsApp pre-filled; you tap Send. To enable fully automated sending, complete the Twilio template approval checklist below.
  Show a disabled "Enable automatic sending" button that will activate once template SIDs are configured (out of scope for this task).

---

## 3. Complaint reply flow — make it work end-to-end

Today: customer files a complaint via the web form (QR page). No WhatsApp contact has happened, so `last_inbound_at` is null. When the owner clicks Send in `ComplaintThread`, `send-whatsapp` requires a Twilio template (not approved) → message fails.

Changes (frontend only):
- `ComplaintThread.tsx`: if the complaint has no `last_inbound_at` (or messages array contains no inbound message yet), replace the in-dialog text composer with a prominent **"Open WhatsApp to reply"** button that:
  - Uses customer's stored phone (already E.164).
  - Opens `wa.me/<phone>?text=<urlencoded apology template>` (template comes from Settings → Apology template).
  - After it opens, prompts the owner to optionally log what was said: a textarea + "Save to thread" button that writes an outbound row via existing flow but marked `channel = 'whatsapp_manual'` (we'll store a marker in `body` or `status`, no schema change required — store as `status = 'manual_logged'`).
- Once the customer has replied at least once via WhatsApp (inbound message exists, set by `whatsapp-webhook`), the in-app composer becomes available again — that path already works.
- Show a small badge in the dialog header: "WhatsApp not connected yet — opens in your phone/desktop WhatsApp" so the owner understands the current mode.
- Keep failure UI from previous iteration (delivery failed badge) for when automatic sending is enabled later.

---

## 4. Touched files

```text
new:      src/components/PhoneInput.tsx
edited:   src/pages/CustomersPage.tsx       (PhoneInput + send flow rework)
edited:   src/pages/SettingsPage.tsx        (PhoneInput + WhatsApp mode banner)
edited:   src/pages/QRRoutingPage.tsx       (PhoneInput, remove normalizePhone)
edited:   src/pages/OnboardingPage.tsx      (PhoneInput for manager phone if present)
edited:   src/components/ComplaintThread.tsx (click-to-chat reply mode when no inbound yet)
package:  add libphonenumber-js
```

No database migration, no edge-function changes, no secrets needed.

---

## Out of scope (do later when Twilio templates are approved)

- Switching `send-whatsapp` calls back on automatically.
- Storing per-business sender number and Content SIDs in DB / Settings UI.
- Outbound delivery-status webhook wiring.
