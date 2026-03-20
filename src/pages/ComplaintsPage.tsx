import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MessageSquare, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface Complaint {
  id: string;
  customer: string;
  phone: string;
  rating: number;
  comment: string;
  time: string;
  status: "open" | "apology_sent" | "resolved";
}

const initialComplaints: Complaint[] = [
  { id: "1", customer: "Rahul Verma", phone: "+91 87654 32109", rating: 2, comment: "Food was cold and took too long to arrive", time: "25 min ago", status: "open" },
  { id: "2", customer: "Vikram Singh", phone: "+91 65432 10987", rating: 1, comment: "Terrible wait time, staff was rude", time: "2 hrs ago", status: "open" },
  { id: "3", customer: "Suresh Kumar", phone: "+91 43210 98765", rating: 3, comment: "Average experience, nothing special", time: "4 hrs ago", status: "apology_sent" },
  { id: "4", customer: "Amit Joshi", phone: "+91 32109 87654", rating: 2, comment: "Overpriced for the quality of food", time: "1 day ago", status: "resolved" },
  { id: "5", customer: "Kavita Rao", phone: "+91 21098 76543", rating: 1, comment: "Found hair in my food, very unhygienic", time: "2 days ago", status: "apology_sent" },
];

const statusConfig = {
  open: { label: "Open", variant: "destructive" as const, icon: AlertTriangle },
  apology_sent: { label: "Apology Sent", variant: "secondary" as const, icon: MessageSquare },
  resolved: { label: "Resolved", variant: "default" as const, icon: CheckCircle },
};

const ComplaintsPage = () => {
  const [complaints, setComplaints] = useState(initialComplaints);

  const sendApology = (id: string) => {
    setComplaints((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "apology_sent" as const } : c))
    );
    toast.success("Apology sent via WhatsApp");
  };

  const markResolved = (id: string) => {
    setComplaints((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "resolved" as const } : c))
    );
    toast.success("Complaint marked as resolved");
  };

  const openCount = complaints.filter((c) => c.status === "open").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Complaints</h1>
        <p className="text-sm text-muted-foreground">
          {openCount} unresolved complaint{openCount !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="space-y-3">
        {complaints.map((c) => {
          const st = statusConfig[c.status];
          return (
            <Card key={c.id} className={`shadow-sm transition-shadow hover:shadow-md ${c.status === "open" ? "border-destructive/30" : ""}`}>
              <CardContent className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-foreground">{c.customer}</h3>
                      <Badge variant={st.variant} className="text-xs">
                        <st.icon className="mr-1 h-3 w-3" />{st.label}
                      </Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-3.5 w-3.5 ${i < c.rating ? "fill-destructive text-destructive" : "text-border"}`} />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />{c.time}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{c.comment}</p>
                    <p className="mt-1 text-xs text-muted-foreground tabular-nums">{c.phone}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {c.status === "open" && (
                      <Button size="sm" variant="warning" onClick={() => sendApology(c.id)}>
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
    </div>
  );
};

export default ComplaintsPage;
