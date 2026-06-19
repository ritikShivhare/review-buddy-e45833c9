## What is happening

There are two different WhatsApp paths:

1. **Customers page → Open WhatsApp**
   - This uses a `wa.me` link only.
   - It does not send automatically; WhatsApp opens with a pre-filled message and you must tap **Send** inside WhatsApp.
   - It can fail if the phone is not stored with a country code like `+91...`, or if the preview/browser blocks opening the external app.

2. **Complaints chat → Send**
   - This uses the backend `send-whatsapp` function through Twilio.
   - The current code only sends automatically after the customer has replied on WhatsApp within the 24-hour WhatsApp window.
   - If there is no inbound WhatsApp reply yet and no approved Twilio template configured, the message cannot be sent by WhatsApp rules.

I also checked recent backend logs and there were **no recent calls** to `send-whatsapp` or `whatsapp-webhook`, which means the broken action is likely not reaching the backend yet, and the current issue is mostly the frontend link/send flow plus WhatsApp 24-hour/template rules.

## Plan to fix

1. **Make Open WhatsApp more reliable**
   - Update both customer request and complaint chat buttons to use the safest WhatsApp URL format.
   - Use normal clickable links with `target="_blank"` and keep the copy-link fallback.
   - Improve phone normalization so valid Indian numbers and international numbers work consistently.

2. **Make complaint chat behavior clear and functional**
   - In the complaint dialog, keep **Open WhatsApp** for manual chat when automation is not available.
   - Only show automatic **Send** when Twilio can legally send: customer has replied within the 24-hour window, or an approved template is configured.
   - Show the real reason when automatic send is blocked: “customer has not replied yet / approved template missing”.

3. **Verify Twilio backend function path**
   - Check `send-whatsapp` invocation from the app.
   - If needed, deploy/redeploy the WhatsApp edge functions.
   - Test the function directly with an existing complaint after the UI fix, using the current logged-in session.

4. **Add better error handling**
   - If WhatsApp cannot open, users can copy the exact link.
   - If Twilio send fails, show the Twilio/backend error instead of a generic failure.

## Expected result

- From **Customers**, Open WhatsApp opens a pre-filled review request for the customer.
- From **Complaints**, Open WhatsApp opens a pre-filled apology/reply chat.
- Automatic in-app sending works only when WhatsApp/Twilio rules allow it, and otherwise the app clearly tells you what is missing.