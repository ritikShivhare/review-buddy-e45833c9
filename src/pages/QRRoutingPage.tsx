import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, MessageSquare, ExternalLink, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const QRRoutingPage = () => {
  const { businessId } = useParams<{ businessId: string }>();
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", message: "" });

  useEffect(() => {
    if (!businessId) return;
    (async () => {
      const { data, error } = await supabase
        .rpc("get_public_business", { _business_id: businessId })
        .maybeSingle();
      if (error || !data) setError("Business not found");
      else setBusiness(data);
      setLoading(false);
    })();
  }, [businessId]);

  const submitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) return;
    if (!form.phone.trim() || !form.message.trim()) {
      toast.error("Phone and message are required");
      return;
    }
    setSubmitting(true);
    try {
      const { data: complaintId, error: rpcErr } = await supabase.rpc("file_complaint", {
        _business_id: businessId,
        _customer_name: form.name || "Anonymous",
        _customer_phone: form.phone,
        _complaint_text: form.message,
      });
      if (rpcErr || !complaintId) throw rpcErr ?? new Error("Failed to file complaint");

      const { error: waErr } = await supabase.functions.invoke("send-whatsapp", {
        body: { complaint_id: complaintId, body: form.message, side: "customer" },
      });
      if (waErr) console.warn("WhatsApp send failed", waErr);

      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.message ?? "Could not submit complaint");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary/30">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary/30 p-4">
        <Card className="max-w-sm shadow-lg">
          <CardContent className="p-8 text-center">
            <p className="text-lg font-semibold text-foreground">Business not found</p>
            <p className="mt-2 text-sm text-muted-foreground">This QR code link may be invalid.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const googleUrl = business.google_review_url || "#";

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/30 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
            <Star className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{business.business_name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">How was your experience?</p>
        </div>

        {submitted ? (
          <Card className="shadow-lg">
            <CardContent className="p-8 text-center space-y-3">
              <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
              <h3 className="font-semibold text-foreground">Complaint received</h3>
              <p className="text-sm text-muted-foreground">
                We've notified {business.business_name} on WhatsApp. They'll reply to your number shortly.
              </p>
            </CardContent>
          </Card>
        ) : showForm ? (
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <form className="space-y-4" onSubmit={submitComplaint}>
                <div className="space-y-1.5">
                  <Label htmlFor="name">Your name (optional)</Label>
                  <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">WhatsApp number *</Label>
                  <Input id="phone" placeholder="+91 98765 43210" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="msg">Your complaint *</Label>
                  <Textarea id="msg" rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" className="flex-1" onClick={() => setShowForm(false)}>Cancel</Button>
                  <Button type="submit" className="flex-1" disabled={submitting}>
                    {submitting ? "Sending…" : "Send"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <Card className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer border-primary/20">
              <CardContent className="p-0">
                <a href={googleUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-6">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Star className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">Leave a Review</h3>
                    <p className="text-sm text-muted-foreground">Share your experience on Google</p>
                  </div>
                  <ExternalLink className="h-5 w-5 text-muted-foreground" />
                </a>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer border-destructive/20">
              <CardContent className="p-0">
                <button onClick={() => setShowForm(true)} className="flex w-full items-center gap-4 p-6 text-left">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-destructive/10">
                    <MessageSquare className="h-6 w-6 text-destructive" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">File a Complaint</h3>
                    <p className="text-sm text-muted-foreground">Chat with us privately on WhatsApp</p>
                  </div>
                </button>
              </CardContent>
            </Card>
          </div>
        )}

        <p className="mt-8 text-center text-xs text-muted-foreground">Powered by ReviewFlow</p>
      </div>
    </div>
  );
};

export default QRRoutingPage;
