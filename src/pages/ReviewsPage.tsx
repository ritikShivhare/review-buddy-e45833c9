import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Star, Download } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBusiness } from "@/hooks/useBusiness";
import { toast } from "sonner";

function StarsDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`h-3.5 w-3.5 ${i < rating ? "fill-warning text-warning" : "text-border"}`} />
      ))}
    </div>
  );
}

const routeMap: Record<string, { label: string; variant: "default" | "destructive" | "secondary" }> = {
  whatsapp: { label: "WhatsApp", variant: "default" },
  sms: { label: "SMS", variant: "secondary" },
  qr: { label: "QR", variant: "secondary" },
  manual: { label: "Manual", variant: "secondary" },
};

const ReviewsPage = () => {
  const { data: business } = useBusiness();
  
  const [ratingFilter, setRatingFilter] = useState("all");

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["reviews", business?.id],
    queryFn: async () => {
      if (!business) return [];
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("business_id", business.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!business,
  });

  // Subscribe to realtime updates
  const filtered = reviews.filter((r) => {
    if (ratingFilter !== "all" && r.rating !== Number(ratingFilter)) return false;
    return true;
  });

  const handleExportCSV = () => {
    if (reviews.length === 0) {
      toast.error("No reviews to export yet");
      return;
    }
    const escape = (v: unknown) => {
      const s = String(v ?? "");
      const safe = s.replace(/"/g, '""');
      // Prevent CSV formula injection in Excel/LibreOffice
      return /^[=+\-@\t\r]/.test(safe) ? `"'${safe}"` : `"${safe}"`;
    };
    const headers = ["Customer", "Rating", "Source", "Google Redirect", "Date"];
    const rows = reviews.map((r) => [
      escape(r.customer_name),
      escape(r.rating),
      escape(r.source || "whatsapp"),
      escape(r.redirected_to_google ? "Yes" : "No"),
      escape(new Date(r.created_at).toLocaleDateString("en-IN")),
    ]);
    const csv = [headers.map(escape).join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reviews-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reviews</h1>
          <p className="text-sm text-muted-foreground">{reviews.length} total reviews</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="mr-1.5 h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={ratingFilter} onValueChange={setRatingFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Rating" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ratings</SelectItem>
            {[5, 4, 3, 2, 1].map((r) => (
              <SelectItem key={r} value={String(r)}>{r} star{r > 1 ? "s" : ""}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">No reviews yet. Add customers and collect ratings!</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Google</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => {
                  const badge = routeMap[r.source || "whatsapp"] || routeMap.whatsapp;
                  return (
                    <TableRow key={r.id} className="hover:bg-muted/40">
                      <TableCell className="font-medium text-foreground">{r.customer_name}</TableCell>
                      <TableCell><StarsDisplay rating={r.rating} /></TableCell>
                      <TableCell><Badge variant={badge.variant} className="text-xs">{badge.label}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.redirected_to_google ? "✅" : "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground tabular-nums">
                        {new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReviewsPage;
