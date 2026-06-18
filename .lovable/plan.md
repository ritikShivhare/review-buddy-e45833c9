## Root cause

Both the **Open WhatsApp** button on Customers and the **Open WhatsApp to reply** button in the complaint chat use `window.open(url, "_blank")`. Inside the Lovable preview iframe (and on many mobile browsers when a button click goes through async code like a mutation), the browser blocks that call and returns `null`, which surfaces as the *"Popup blocked / error"* you're seeing. Twilio is not actually involved in this manual flow — nothing is broken on the backend.

The complaint chat itself only exposes the in‑app composer once the customer has sent an inbound WhatsApp message (`hasInbound`). Until then the only action is that same blocked popup, so the chat feels "not working".

## Fix plan

### 1. Replace `window.open` with real anchor links (works inside iframes & mobile)

**`src/pages/CustomersPage.tsx`**
- Remove the `sendRequest` mutation's `window.open` call.
- Render the action cell as an `<a href={waUrl} target="_blank" rel="noopener noreferrer">` styled as the existing Button (using `asChild`). Anchor navigations are user‑gesture safe and are not popup‑blocked.
- On click of the anchor, fire a lightweight `onClick` that updates the customer's `status` to `requested` (no await before navigation).
- Keep a "Copy link" secondary action (icon button) as a fallback for environments where the new tab still fails.
- Keep the existing toast "WhatsApp opened — tap Send in WhatsApp to deliver" but only show it after the click.

**`src/components/ComplaintThread.tsx`**
- Convert the "Open WhatsApp to reply" Button to a `Button asChild` wrapping an `<a target="_blank" rel="noopener noreferrer" href={waUrl}>`.
- Compute `waUrl` synchronously from `complaint.customer_phone` + `buildApology()` so the href is ready at render time.
- Add a small "Copy message" + "Copy link" pair underneath as fallback.
- Show a clear inline error chip if `customer_phone` is missing or too short, instead of only a toast on click.

### 2. Make the chat actually usable before any inbound message

Currently the in‑app composer is hidden until `hasInbound` is true. Since Twilio template sending isn't live yet, that path never sends anyway — so the composer should always be visible for **logging** what was said:

- Always render the textarea + a primary "Save reply to thread" button (manual log, `status: 'manual_logged'`), regardless of `hasInbound`.
- Keep "Open WhatsApp to reply" above it as the recommended action when `!hasInbound`.
- Only show the auto‑send Send button (calls `send-whatsapp` edge function) when `hasInbound` is true, with a tooltip explaining why it's disabled otherwise.
- Keep the "Manual mode" badge.

### 3. Phone-number sanity

Some older customer rows may have been saved before `PhoneInput` enforced E.164. Add a guard:
- In both buttons, if the stored phone doesn't start with `+` or fails `isValidPhoneNumber`, show "Phone number missing country code — edit the customer to fix" instead of opening a broken `wa.me` link.

### Files touched
- `src/pages/CustomersPage.tsx` — anchor-based Open WhatsApp, copy-link fallback, phone validity guard.
- `src/components/ComplaintThread.tsx` — anchor-based reply link, always-on manual log composer, copy fallbacks, phone validity guard.

### Out of scope
- No Twilio/edge-function changes — automated sending stays disabled until templates are approved (per your earlier decision).
- No DB schema changes.

## Why this fixes it
Anchor `target="_blank"` clicks are treated as direct user navigation, so the preview iframe and mobile browsers won't block them the way `window.open` is blocked. The complaint chat becomes useful immediately because you can always log replies, with the WhatsApp deep link one tap away.