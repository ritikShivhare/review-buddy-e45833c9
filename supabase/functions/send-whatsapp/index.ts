// Sends a WhatsApp message via Twilio (production-ready).
// Handles WhatsApp's 24-hour rule:
//  - If complaint's last_inbound_at is within 24h → freeform text is allowed.
//  - Otherwise the FIRST outbound message must be an approved template (ContentSid + variables).
// Failures are logged into complaint_messages with status='failed' + Twilio error code, so the dashboard can show them.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const TWILIO_API_KEY = Deno.env.get("TWILIO_API_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const TWILIO_FROM = Deno.env.get("TWILIO_WHATSAPP_FROM")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const TPL_OWNER = Deno.env.get("TWILIO_TEMPLATE_OWNER_SID") ?? "";
const TPL_CUSTOMER_ACK = Deno.env.get("TWILIO_TEMPLATE_CUSTOMER_ACK_SID") ?? "";

const waFrom = TWILIO_FROM?.startsWith("whatsapp:") ? TWILIO_FROM : `whatsapp:${TWILIO_FROM}`;

function normalizePhone(p: string) {
  const cleaned = p.trim().replace(/[\s\-()]/g, "");
  return cleaned.startsWith("+") ? cleaned : `+${cleaned}`;
}

type TwilioResult =
  | { ok: true; sid: string }
  | { ok: false; code?: string; message: string; status: number };

async function callTwilio(params: URLSearchParams): Promise<TwilioResult> {
  const res = await fetch("https://connector-gateway.lovable.dev/twilio/Messages.json", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": TWILIO_API_KEY,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("Twilio send failed", { status: res.status, data });
    return {
      ok: false,
      code: data?.code ? String(data.code) : undefined,
      message: data?.message || data?.error || `Twilio ${res.status}`,
      status: res.status,
    };
  }
  return { ok: true, sid: data.sid };
}

function sendFreeform(to: string, body: string) {
  return callTwilio(new URLSearchParams({
    To: `whatsapp:${normalizePhone(to)}`,
    From: waFrom,
    Body: body,
  }));
}

function sendTemplate(to: string, contentSid: string, variables: Record<string, string>) {
  return callTwilio(new URLSearchParams({
    To: `whatsapp:${normalizePhone(to)}`,
    From: waFrom,
    ContentSid: contentSid,
    ContentVariables: JSON.stringify(variables),
  }));
}

function within24h(iso?: string | null) {
  if (!iso) return false;
  return Date.now() - new Date(iso).getTime() < 24 * 60 * 60 * 1000;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { complaint_id, body, side } = await req.json();
    if (!complaint_id || !body || !["customer", "owner"].includes(side)) {
      return jsonResponse({ error: "complaint_id, body, side required" }, 400);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: complaint, error: cErr } = await admin
      .from("complaints")
      .select("id, business_id, customer_phone, customer_name, last_inbound_at, businesses(manager_phone, business_name, user_id)")
      .eq("id", complaint_id)
      .single();
    if (cErr || !complaint) throw new Error("Complaint not found");

    const biz: any = (complaint as any).businesses;

    // ---------------- OWNER → CUSTOMER ----------------
    if (side === "owner") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) throw new Error("Unauthorized");
      const userClient = createClient(SUPABASE_URL, ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: claims, error: aErr } = await userClient.auth.getClaims(authHeader.replace("Bearer ", ""));
      if (aErr || claims?.claims?.sub !== biz.user_id) throw new Error("Forbidden");
      if (!complaint.customer_phone) throw new Error("Customer phone unknown");

      let result: TwilioResult;
      if (within24h(complaint.last_inbound_at)) {
        result = await sendFreeform(complaint.customer_phone, body);
      } else if (TPL_CUSTOMER_ACK) {
        // Outside 24h window — must use an approved template.
        result = await sendTemplate(complaint.customer_phone, TPL_CUSTOMER_ACK, {
          "1": complaint.customer_name || "there",
          "2": body.slice(0, 200),
        });
      } else {
        await admin.from("complaint_messages").insert({
          complaint_id, direction: "out", body, status: "failed",
          error_code: "no_template",
          error_message: "Customer hasn't replied in 24h. Approved template required to send (TWILIO_TEMPLATE_CUSTOMER_ACK_SID not configured).",
        });
        return jsonResponse({ ok: false, error: "Outside 24-hour window. Configure an approved template." });
      }

      await admin.from("complaint_messages").insert({
        complaint_id,
        direction: "out",
        body,
        twilio_sid: result.ok ? result.sid : null,
        status: result.ok ? "sent" : "failed",
        error_code: result.ok ? null : result.code,
        error_message: result.ok ? null : result.message,
      });
      return jsonResponse({ ok: result.ok, error: result.ok ? undefined : result.message });
    }

    // ---------------- CUSTOMER → OWNER (initial complaint) ----------------
    if (!biz?.manager_phone) throw new Error("Manager phone missing");

    // Customer just submitted complaint → mark inbound so 24h window opens.
    await admin.from("complaints").update({ last_inbound_at: new Date().toISOString() }).eq("id", complaint_id);

    // Notify the business owner. Owner is a business contact (not an end-user opt-in),
    // but WhatsApp still requires approved templates for business-initiated messages.
    // Use template if configured, otherwise fall back to freeform (works only if owner messaged us in last 24h or on sandbox).
    let result: TwilioResult;
    if (TPL_OWNER) {
      result = await sendTemplate(biz.manager_phone, TPL_OWNER, {
        "1": biz.business_name || "your business",
        "2": complaint.customer_name || "A customer",
        "3": body.slice(0, 500),
      });
    } else {
      const prefix = `New complaint for ${biz.business_name}:\n`;
      result = await sendFreeform(biz.manager_phone, prefix + body);
    }

    await admin.from("complaint_messages").insert({
      complaint_id,
      direction: "in",
      body,
      twilio_sid: result.ok ? result.sid : null,
      status: result.ok ? "sent" : "failed",
      error_code: result.ok ? null : result.code,
      error_message: result.ok ? null : result.message,
    });
    return jsonResponse({ ok: result.ok, error: result.ok ? undefined : result.message });
  } catch (e: any) {
    console.error("send-whatsapp error", e);
    return jsonResponse({ ok: false, error: e.message });
  }
});
