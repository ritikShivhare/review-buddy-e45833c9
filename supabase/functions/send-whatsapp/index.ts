// Sends a WhatsApp message via Twilio.
// - Customer-side (anon): provide complaint_id + body. Server looks up business manager_phone, sends WA, logs as direction='out' from business POV? No: a customer-originated message is direction='in'.
//   For initial submission, the customer is the sender and the manager is the recipient — we log direction='in' (incoming to business).
// - Owner-side (authenticated): provide complaint_id + body. Server sends WA to customer_phone, logs direction='out'.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const TWILIO_API_KEY = Deno.env.get("TWILIO_API_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const TWILIO_FROM = Deno.env.get("TWILIO_WHATSAPP_FROM")!; // e.g. +15863549500 or whatsapp:+15863549500
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const waFrom = TWILIO_FROM.startsWith("whatsapp:") ? TWILIO_FROM : `whatsapp:${TWILIO_FROM}`;

function normalizePhone(p: string) {
  const cleaned = p.replace(/[\s\-()]/g, "");
  return cleaned.startsWith("+") ? cleaned : `+${cleaned}`;
}

async function sendTwilio(to: string, body: string) {
  const res = await fetch("https://connector-gateway.lovable.dev/twilio/Messages.json", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": TWILIO_API_KEY,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: `whatsapp:${normalizePhone(to)}`, From: waFrom, Body: body }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Twilio ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { complaint_id, body, side } = await req.json();
    if (!complaint_id || !body || !["customer", "owner"].includes(side)) {
      return new Response(JSON.stringify({ error: "complaint_id, body, side required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: complaint, error: cErr } = await admin
      .from("complaints")
      .select("id, business_id, customer_phone, businesses(manager_phone, business_name, user_id)")
      .eq("id", complaint_id)
      .single();
    if (cErr || !complaint) throw new Error("Complaint not found");

    const biz: any = (complaint as any).businesses;

    if (side === "owner") {
      // Auth required: confirm caller owns the business
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) throw new Error("Unauthorized");
      const userClient = createClient(SUPABASE_URL, ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: claims, error: aErr } = await userClient.auth.getClaims(authHeader.replace("Bearer ", ""));
      if (aErr || claims?.claims?.sub !== biz.user_id) throw new Error("Forbidden");
      if (!complaint.customer_phone) throw new Error("Customer phone unknown");
      const sent = await sendTwilio(complaint.customer_phone, body);
      await admin.from("complaint_messages").insert({
        complaint_id, direction: "out", body, twilio_sid: sent.sid,
      });
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // side === "customer": send to manager's WhatsApp, log direction='in'
    if (!biz?.manager_phone) throw new Error("Manager phone missing");
    const prefix = `New complaint for ${biz.business_name}:\n`;
    const sent = await sendTwilio(biz.manager_phone, prefix + body);
    await admin.from("complaint_messages").insert({
      complaint_id, direction: "in", body, twilio_sid: sent.sid,
    });
    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("send-whatsapp error", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
