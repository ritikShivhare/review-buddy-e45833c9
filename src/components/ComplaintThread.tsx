import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, MessageCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useBusiness } from "@/hooks/useBusiness";

interface Props {
  complaintId: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  customerName?: string;
}

const ComplaintThread = ({ complaintId, open, onOpenChange, customerName }: Props) => {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [logging, setLogging] = useState(false);
  const queryClient = useQueryClient();
  const endRef = useRef<HTMLDivElement>(null);
  const { data: business } = useBusiness();

  const { data: complaint } = useQuery({
    queryKey: ["complaint", complaintId],
    queryFn: async () => {
      if (!complaintId) return null;
      const { data, error } = await supabase
        .from("complaints")
        .select("id, customer_name, customer_phone, complaint_text, last_inbound_at")
        .eq("id", complaintId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!complaintId && open,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["complaint_messages", complaintId],
    queryFn: async () => {
      if (!complaintId) return [];
      const { data, error } = await supabase
        .from("complaint_messages")
        .select("*")
        .eq("complaint_id", complaintId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!complaintId && open,
  });

  useEffect(() => {
    if (!complaintId || !open) return;
    const channel = supabase
      .channel(`thread-${complaintId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "complaint_messages", filter: `complaint_id=eq.${complaintId}` },
        () => queryClient.invalidateQueries({ queryKey: ["complaint_messages", complaintId] }),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [complaintId, open, queryClient]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const hasInbound = !!complaint?.last_inbound_at || messages.some((m: any) => m.direction === "in");

  const send = async () => {
    if (!complaintId || !text.trim()) return;
    setSending(true);
    const { data, error } = await supabase.functions.invoke("send-whatsapp", {
      body: { complaint_id: complaintId, body: text.trim(), side: "owner" },
    });
    setSending(false);
    if (error || (data && data.ok === false)) {
      toast.error(data?.error || "Failed to send WhatsApp message");
      return;
    }
    setText("");
  };

  const buildApology = () => {
    const name = complaint?.customer_name || customerName || "there";
    const biz = business?.business_name || "our team";
    const offer = business?.apology_offer || "";
    const parts = [
      `Hi ${name},`,
      `This is ${biz}. We're really sorry about your recent experience — thank you for letting us know.`,
      offer ? `As an apology, we'd like to offer: ${offer}.` : "",
      `Can we make it right?`,
    ].filter(Boolean);
    return parts.join("\n\n");
  };

  const rawPhone = complaint?.customer_phone || "";
  const phoneDigits = rawPhone.replace(/\D/g, "");
  const phoneValid = rawPhone.startsWith("+") && phoneDigits.length >= 8;
  const apologyMsg = buildApology();
  const waUrl = phoneValid ? `https://wa.me/${phoneDigits}?text=${encodeURIComponent(apologyMsg)}` : "";

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Could not copy");
    }
  };

  const logManualReply = async () => {
    if (!complaintId || !text.trim()) return;
    setLogging(true);
    const { error } = await supabase.from("complaint_messages").insert({
      complaint_id: complaintId,
      direction: "out",
      body: text.trim(),
      status: "manual_logged",
    });
    setLogging(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setText("");
    queryClient.invalidateQueries({ queryKey: ["complaint_messages", complaintId] });
    toast.success("Saved to thread");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Chat with {customerName ?? "customer"}
            {!hasInbound && (
              <Badge variant="secondary" className="text-[10px] font-normal">
                <MessageCircle className="mr-1 h-3 w-3" /> Manual mode
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="flex h-96 flex-col">
          <div className="flex-1 space-y-2 overflow-y-auto rounded-md border bg-secondary/20 p-3">
            {messages.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground">No messages yet</p>
            ) : (
              messages.map((m: any) => (
                <div key={m.id} className={`flex ${m.direction === "out" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${m.direction === "out" ? "bg-primary text-primary-foreground" : "bg-card border"} ${m.status === "failed" ? "opacity-80 ring-1 ring-destructive" : ""}`}>
                    {m.body}
                    <div className="mt-1 flex items-center gap-1.5 text-[10px] opacity-70">
                      <span>{new Date(m.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                      {m.status === "failed" && (
                        <span className="rounded bg-destructive px-1 py-0.5 text-[9px] font-semibold text-destructive-foreground" title={m.error_message || "Delivery failed"}>
                          delivery failed
                        </span>
                      )}
                      {m.status === "manual_logged" && (
                        <span className="rounded bg-muted px-1 py-0.5 text-[9px] font-semibold text-muted-foreground" title="Sent manually via WhatsApp">
                          via WhatsApp
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={endRef} />
          </div>

          <div className="mt-3 space-y-2">
            {!hasInbound && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-2.5 text-[11px] text-muted-foreground dark:border-amber-900/50 dark:bg-amber-950/30">
                WhatsApp automation isn't active yet. Use "Open WhatsApp" to reply from your phone, then log what you sent below. The customer's first WhatsApp reply will unlock auto-sending.
              </div>
            )}

            {!phoneValid ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2.5 text-xs text-destructive">
                Customer phone is missing or has no country code — cannot open WhatsApp.
              </div>
            ) : (
              <div className="flex gap-2">
                <Button asChild className="flex-1">
                  <a href={waUrl} target="_blank" rel="noopener noreferrer" onClick={() => setText(apologyMsg)}>
                    <ExternalLink className="mr-1.5 h-4 w-4" /> Open WhatsApp
                  </a>
                </Button>
                <Button variant="outline" size="sm" onClick={() => copy(waUrl, "Link")}>
                  Copy link
                </Button>
              </div>
            )}

            <Textarea
              rows={3}
              placeholder="Type or paste the reply you sent on WhatsApp…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (hasInbound && e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={logManualReply}
                disabled={logging || !text.trim()}
              >
                {logging ? "Saving…" : "Save reply to thread"}
              </Button>
              {hasInbound && (
                <Button onClick={send} disabled={sending || !text.trim()} size="sm">
                  <Send className="mr-1.5 h-4 w-4" /> Send
                </Button>
              )}
            </div>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
};

export default ComplaintThread;
