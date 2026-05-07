import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MessageSquare, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBusiness } from "@/hooks/useBusiness";
import { useEffect } from "react";

const statusConfig = {
  new: { label: "Open", variant: "destructive" as const, icon: AlertTriangle },
  contacted: { label: "Contacted", variant: "secondary" as const, icon: MessageSquare },
  resolved: { label: "Resolved", variant: "default" as const, icon: CheckCircle },
};

const ComplaintsPage = () => {
  const { data: business } = useBusiness();
  const queryClient = useQueryClient();

  const { data: complaints = [], isLoading } = useQuery({
    queryKey: ["complaints", business?.id],
    queryFn: async () => {
      if (!business) return [];
      const { data, error } = await supabase
        .from("complaints")
        .select("*")
        .eq("business_id", business.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!business,
  });

  // Realtime subscription
  useEffect(() => {
    if (!business) return;
    const channel = supabase
      .channel("complaints-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "complaints", filter: `business_id=eq.${business.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["complaints", business.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [business, queryClient]);

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status };
      if (status === "resolved") updates.resolved_at = new Date().toISOString();
      const { error } = await supabase.from("complaints").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
    },
  });

  const sendApology = (id: string) => {
    updateStatus.mutate({ id, status: "contacted" });
    toast.success("Apology sent via WhatsApp");
  };

  const markResolved = (id: string) => {
    updateStatus.mutate({ id, status: "resolved" });
    toast.success("Complaint marked as resolved");
  };

  const openCount = complaints.filter((c) => c.status === "new").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Complaints</h1>
        <p className="text-sm text-muted-foreground">
          {openCount} unresolved complaint{openCount !== 1 ? "s" : ""}
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      ) : complaints.length === 0 ? (
        <Card className="shadow-sm"><CardContent className="py-12 text-center text-sm text-muted-foreground">No complaints yet — that's great!</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {complaints.map((c) => {
            const st = statusConfig[c.status as keyof typeof statusConfig] || statusConfig.new;
            return (
              <Card key={c.id} className={`shadow-sm transition-shadow hover:shadow-md ${c.status === "new" ? "border-destructive/30" : ""}`}>
                <CardContent className="p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-foreground">{c.customer_name}</h3>
                        <Badge variant={st.variant} className="text-xs">
                          <st.icon className="mr-1 h-3 w-3" />{st.label}
                        </Badge>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        {c.rating && (
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`h-3.5 w-3.5 ${i < (c.rating ?? 0) ? "fill-destructive text-destructive" : "text-border"}`} />
                            ))}
                          </div>
                        )}
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(c.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </span>
                      </div>
                      {c.complaint_text && <p className="mt-2 text-sm text-muted-foreground">{c.complaint_text}</p>}
                      {c.customer_phone && <p className="mt-1 text-xs text-muted-foreground tabular-nums">{c.customer_phone}</p>}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {c.status === "new" && (
                        <Button size="sm" variant="secondary" onClick={() => sendApology(c.id)}>
                          <MessageSquare className="mr-1.5 h-3.5 w-3.5" /> Send Apology
                        </Button>
                      )}
                      {c.status !== "resolved" && (
                        <Button size="sm" variant="outline" onClick={() => markResolved(c.id)}>
                          <CheckCircle className="mr-1.5 h-3.5 w-3.5" /> Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ComplaintsPage;
