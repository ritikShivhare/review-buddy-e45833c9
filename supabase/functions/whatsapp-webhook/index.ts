// Twilio inbound webhook. Verifies X-Twilio-Signature before processing.
// Twilio POSTs application/x-www-form-urlencoded with From, To, Body.
import { createClient } from "npm:@supabase/supabase-js@2";
import { createHmac } from "node:crypto";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TWILIO_FROM = Deno.env.get("TWILIO_WHATSAPP_FROM") ?? "";
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN") ?? "";

function strip(p: string) {
  return p.replace(/^whatsapp:/, "").replace(/[\s\-()+]/g, "");
}

function verifyTwilioSignature(url: string, params: Record<string, string>, signature: string): boolean {
  if (!TWILIO_AUTH_TOKEN || !signature) return false;
  const sortedKeys = Object.keys(params).sort();
  let data = url;
  for (const k of sortedKeys) data += k + params[k];
  const expected = createHmac("sha1", TWILIO_AUTH_TOKEN).update(data).digest("base64");
  return expected === signature;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("ok");
  try {
    const signature = req.headers.get("x-twilio-signature") ?? "";
    const form = await req.formData();
    const params: Record<string, string> = {};
    for (const [k, v] of form.entries()) params[k] = String(v);

    // Reconstruct the URL Twilio used (use forwarded proto/host if available)
    const proto = req.headers.get("x-forwarded-proto") ?? "https";
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? new URL(req.url).host;
    const path = new URL(req.url).pathname + new URL(req.url).search;
    const fullUrl = `${proto}://${host}${path}`;

    if (!verifyTwilioSignature(fullUrl, params, signature)) {
      console.warn("whatsapp-webhook: invalid signature", { fullUrl });
      return new Response("Forbidden", { status: 403 });
    }

    const from = strip(params["From"] ?? "");
    const to = strip(params["To"] ?? "");
    const body = (params["Body"] ?? "").trim();
    const sid = params["MessageSid"] ?? "";
    if (!from || !to || !body) return new Response("<Response/>", { headers: { "Content-Type": "text/xml" } });

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const twilioFromDigits = strip(TWILIO_FROM);

    let complaintId: string | null = null;
    let direction: "in" | "out" = "in";

    if (to === twilioFromDigits) {
      const { data } = await admin
        .from("complaints")
        .select("id, customer_phone")
        .order("created_at", { ascending: false })
        .limit(50);
      const match = (data ?? []).find((c) => c.customer_phone && strip(c.customer_phone) === from);
      if (match) {
        complaintId = match.id;
        direction = "in";
      }
    } else {
      const { data } = await admin
        .from("complaints")
        .select("id, customer_phone, business_id, businesses(manager_phone)")
        .order("created_at", { ascending: false })
        .limit(50);
      const match = (data as any[] | null)?.find(
        (c) => c.businesses?.manager_phone && strip(c.businesses.manager_phone) === from && c.customer_phone && strip(c.customer_phone) === to,
      );
      if (match) {
        complaintId = match.id;
        direction = "out";
      }
    }

    if (complaintId) {
      await admin.from("complaint_messages").insert({ complaint_id: complaintId, direction, body, twilio_sid: sid, status: "sent" });
      if (direction === "in") {
        // Customer replied — open/refresh the 24h freeform window.
        await admin.from("complaints").update({ last_inbound_at: new Date().toISOString() }).eq("id", complaintId);
      }
      if (direction === "out") {
        await admin.from("complaints").update({ status: "contacted" }).eq("id", complaintId).eq("status", "new");
      }
    } else {
      console.log("whatsapp-webhook: no matching complaint", { from, to });
    }

    return new Response("<Response/>", { headers: { "Content-Type": "text/xml" } });
  } catch (e) {
    console.error("whatsapp-webhook error", e);
    return new Response("<Response/>", { headers: { "Content-Type": "text/xml" } });
  }
});
