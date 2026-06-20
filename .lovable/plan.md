## Goal
Customers aur Complaints dono jagah se WhatsApp message **backend Twilio se directly** chala jaye — user ke phone me WhatsApp open karne ki zaroorat nahi, aur "number not saved" wala issue khatam.

## Important: WhatsApp ka rule (read first)
WhatsApp business policy ke according, jab business **first message** kisi customer ko bhejta hai (ya customer ne pichhle 24 ghante me reply nahi kiya), to **sirf approved Template message** hi bhej sakte ho — freeform text WhatsApp reject kar dega (Twilio error 63016).

Iska matlab:
- **Backend code main bana sakta hu aaj hi.**
- Lekin actual sending tab kaam karegi jab aap Twilio Console me 2 templates approve karwa lo (~1–24 ghante Meta approval) aur unke Content SIDs secrets me daal do.
- Jab tak template approved nahi, app saaf-saaf bata degi *"Template approval pending — meanwhile use Open WhatsApp"*.

## Templates jo aapko Twilio Console → Content Template Builder me banane honge

1. **Review request** (Customers page se bheja jata hai)
   - Category: **Marketing** (ya Utility agar transactional justify ho)
   - Example body:
     `Hi {{1}}, thanks for visiting {{2}}! We'd love your feedback — please share your experience here: {{3}}`
   - Variables: `1`=customer name, `2`=business name, `3`=review link
   - Approve hone ke baad Content SID milega (`HX...`) → secret `TWILIO_TEMPLATE_REVIEW_REQUEST_SID` me daalna hai.

2. **Complaint apology** (Complaints chat se owner ka first reply)
   - Category: **Utility**
   - Example body:
     `Hi {{1}}, this is {{2}}. We're sorry about your recent experience. {{3}}`
   - Variables: `1`=customer name, `2`=business name, `3`=owner ka message
   - Secret name: `TWILIO_TEMPLATE_CUSTOMER_ACK_SID` (yeh already code me referenced hai).

## App-side changes

### 1. New edge function `send-review-request`
- Input: `customer_id`
- Auth check (business owner only).
- Customer ka phone normalize karke Twilio gateway pe POST `/Messages.json`:
  - Agar `TWILIO_TEMPLATE_REVIEW_REQUEST_SID` set hai → `ContentSid` + `ContentVariables` se send.
  - Warna → return `{ ok: false, error: "Template not configured" }` (no freeform attempt, kyunki fail hi hoga).
- Success pe `customers.status` ko `requested` mark kare aur `last_sent_at` update kare.
- Failure pe Twilio ka actual error message return kare.

### 2. Update `src/pages/CustomersPage.tsx`
- "Open WhatsApp" button ko **"Send via WhatsApp"** se replace karo, jo `send-review-request` invoke kare.
- Sending state, success toast (*"Review request sent ✓"*), failure pe Twilio error dikhao.
- Ek small **"Open WhatsApp manually"** secondary link rakho fallback ke liye (jab tak template approve nahi).
- Agar function `template_not_configured` error de, toast me clear message: *"Twilio template approve pending. Aap manual WhatsApp se bhej sakte ho."*

### 3. Update `src/components/ComplaintThread.tsx`
- `send` function pehle se `send-whatsapp` invoke karta hai — woh already template route handle karta hai. Bas UI me:
  - "Send" button hamesha dikhao (na sirf `hasInbound` pe), kyunki ab outside-24h bhi template se ja sakta hai.
  - Disabled state + tooltip agar template missing: *"Approve customer-ack template in Twilio to enable auto-send."*

### 4. Settings page me chhota status indicator (optional, helpful)
- Settings me ek "WhatsApp setup" card:
  - ✓ Twilio connected
  - ✓ / ✗ Review request template configured
  - ✓ / ✗ Complaint apology template configured
- Yeh `fetch_secrets` ki jagah ek edge function endpoint `whatsapp-status` se aayega jo bas `boolean` return kare (no secret values exposed).

## Aapko kya karna padega (one-time)
1. Twilio Console → Messaging → Content Template Builder me upar diye 2 templates banao aur approve karao (Meta review).
2. Approved hone par Content SIDs (`HXxxxxxxxx...`) copy karke mujhe do — main secrets me add kar dunga (`TWILIO_TEMPLATE_REVIEW_REQUEST_SID` aur `TWILIO_TEMPLATE_CUSTOMER_ACK_SID`).
3. Bas — uske baad har button click pe message Twilio se directly chala jayega, customer ke phone pe "number not saved" warning dikhega hi nahi kyunki aap apne phone se kuch nahi kar rahe.

## Expected result
- **Customers → Send via WhatsApp:** ek click → message Twilio se customer ko deliver, status `requested` mark.
- **Complaints → Send:** ek click → reply Twilio se customer ko deliver, thread me `sent` badge.
- Template missing/pending ho to UI saaf-saaf bataye aur manual fallback offer kare — koi silent failure nahi.

## Non-goals
- SMS fallback (alag request hai).
- vCard / save contact button (alag request hai).
- WhatsApp Business API onboarding ka aur koi part — Twilio aur number already verified hai.
