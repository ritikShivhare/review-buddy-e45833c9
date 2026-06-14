import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { toast } from "sonner";

interface Props {
  complaintId: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  customerName?: string;
}

const ComplaintThread = ({ complaintId, open, onOpenChange, customerName }: Props) => {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const queryClient = useQueryClient();
  const endRef = useRef<HTMLDivElement>(null);

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

  const send = async () => {
    if (!complaintId || !text.trim()) return;
    setSending(true);
    const { error } = await supabase.functions.invoke("send-whatsapp", {
      body: { complaint_id: complaintId, body: text.trim(), side: "owner" },
    });
    setSending(false);
    if (error) {
      toast.error("Failed to send WhatsApp message");
      return;
    }
    setText("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Chat with {customerName ?? "customer"}</DialogTitle>
        </DialogHeader>
        <div className="flex h-96 flex-col">
          <div className="flex-1 space-y-2 overflow-y-auto rounded-md border bg-secondary/20 p-3">
            {messages.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground">No messages yet</p>
            ) : (
              messages.map((m: any) => (
                <div key={m.id} className={`flex ${m.direction === "out" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${m.direction === "out" ? "bg-primary text-primary-foreground" : "bg-card border"}`}>
                    {m.body}
                    <div className="mt-1 text-[10px] opacity-70">
                      {new Date(m.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={endRef} />
          </div>
          <div className="mt-3 flex gap-2">
            <Textarea
              rows={2}
              placeholder="Type your reply…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            />
            <Button onClick={send} disabled={sending || !text.trim()} className="self-end">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ComplaintThread;
