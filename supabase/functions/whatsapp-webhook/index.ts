// Twilio inbound webhook. Twilio POSTs application/x-www-form-urlencoded with From, To, Body.
// We match To (business WhatsApp number = manager_phone) and From (customer phone) to the most
// recent open complaint and append the reply as direction='in' (customer -> business) or
// direction='out' (business owner replying from their own WhatsApp -> customer).
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TWILIO_FROM = Deno.env.get("TWILIO_WHATSAPP_FROM") ?? "";

function strip(p: string) {
  return p.replace(/^whatsapp:/, "").replace(/[\s\-()+]/g, "");
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("ok");
  try {
    const form = await req.formData();
    const from = strip(String(form.get("From") ?? ""));
    const to = strip(String(form.get("To") ?? ""));
    const body = String(form.get("Body") ?? "").trim();
    const sid = String(form.get("MessageSid") ?? "");
    if (!from || !to || !body) return new Response("<Response/>", { headers: { "Content-Type": "text/xml" } });

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const twilioFromDigits = strip(TWILIO_FROM);

    // Determine if this came from a customer (To = our Twilio number) or from a business owner replying directly
    let complaintId: string | null = null;
    let direction: "in" | "out" = "in";

    if (to === twilioFromDigits) {
      // Customer -> our number. Find latest open complaint by customer phone.
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
      // Reply landing on the manager_phone (from === manager, to === customer)
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
      await admin.from("complaint_messages").insert({ complaint_id: complaintId, direction, body, twilio_sid: sid });
      // Bump complaint status to contacted on first reply
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
