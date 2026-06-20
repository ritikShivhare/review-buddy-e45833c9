// Sends a WhatsApp review request to a customer via Twilio (template-only).
// WhatsApp policy: business-initiated messages MUST use an approved template.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const TWILIO_API_KEY = Deno.env.get("TWILIO_API_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const TWILIO_FROM = Deno.env.get("TWILIO_WHATSAPP_FROM")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const TPL_REVIEW = Deno.env.get("TWILIO_TEMPLATE_REVIEW_REQUEST_SID") ?? "";

const waFrom = TWILIO_FROM?.startsWith("whatsapp:") ? TWILIO_FROM : `whatsapp:${TWILIO_FROM}`;

function normalizePhone(p: string) {
  const cleaned = p.trim().replace(/[\s\-()]/g, "");
  return cleaned.startsWith("+") ? cleaned : `+${cleaned}`;
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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ ok: false, error: "Unauthorized" }, 401);
    }

    const { customer_id } = await req.json();
    if (!customer_id) return jsonResponse({ ok: false, error: "customer_id required" }, 400);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims, error: aErr } = await userClient.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (aErr || !claims?.claims?.sub) return jsonResponse({ ok: false, error: "Unauthorized" }, 401);
    const userId = claims.claims.sub;

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: customer, error: cErr } = await admin
      .from("customers")
      .select("id, name, phone, business_id, businesses(id, business_name, user_id)")
      .eq("id", customer_id)
      .single();
    if (cErr || !customer) return jsonResponse({ ok: false, error: "Customer not found" }, 404);

    const biz: any = (customer as any).businesses;
    if (biz?.user_id !== userId) return jsonResponse({ ok: false, error: "Forbidden" }, 403);
    if (!customer.phone) return jsonResponse({ ok: false, error: "Customer has no phone" }, 400);

    if (!TPL_REVIEW) {
      return jsonResponse({
        ok: false,
        error: "template_not_configured",
        message: "Review-request template not approved yet. Use Open WhatsApp to send manually.",
      });
    }

    const reviewLink = `${new URL(req.url).origin.replace("functions.supabase.co", "lovable.app")}/r/${biz.id}`;
    // Use a stable public link: derive from request? Better — use a fixed base if available.
    // Fallback: just use review path; the customer can also paste it.
    const link = `https://${req.headers.get("x-forwarded-host") ?? "review-flow.store"}/r/${biz.id}`;

    const params = new URLSearchParams({
      To: `whatsapp:${normalizePhone(customer.phone)}`,
      From: waFrom,
      ContentSid: TPL_REVIEW,
      ContentVariables: JSON.stringify({
        "1": customer.name || "there",
        "2": biz.business_name || "our business",
        "3": link,
      }),
    });

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
      console.error("Twilio send-review-request failed", { status: res.status, data });
      return jsonResponse({
        ok: false,
        error: data?.message || `Twilio ${res.status}`,
        code: data?.code,
      });
    }

    await admin.from("customers").update({ status: "requested" }).eq("id", customer_id);

    return jsonResponse({ ok: true, sid: data.sid });
  } catch (e: any) {
    console.error("send-review-request error", e);
    return jsonResponse({ ok: false, error: e.message }, 500);
  }
});
