import { Star, MessageSquare, Users, AlertTriangle, TrendingUp, ArrowUpRight, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBusiness } from "@/hooks/useBusiness";

function StarsDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`h-3.5 w-3.5 ${i < rating ? "fill-warning text-warning" : "text-border"}`} />
      ))}
    </div>
  );
}

const routeBadge: Record<string, { label: string; variant: "default" | "destructive" | "secondary" | "outline" }> = {
  google: { label: "Google", variant: "default" },
  complaint: { label: "Complaint", variant: "destructive" },
};

const DashboardPage = () => {
  const { data: business } = useBusiness();

  const { data: reviews = [] } = useQuery({
    queryKey: ["dashboard-reviews", business?.id],
    queryFn: async () => {
      if (!business) return [];
      const { data } = await supabase
        .from("reviews")
        .select("*")
        .eq("business_id", business.id)
        .order("created_at", { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!business,
  });

  const { data: complaintsCount = 0 } = useQuery({
    queryKey: ["dashboard-complaints-count", business?.id],
    queryFn: async () => {
      if (!business) return 0;
      const { count } = await supabase
        .from("complaints")
        .select("*", { count: "exact", head: true })
        .eq("business_id", business.id);
      return count ?? 0;
    },
    enabled: !!business,
  });

  const { data: unresolvedCount = 0 } = useQuery({
    queryKey: ["dashboard-unresolved", business?.id],
    queryFn: async () => {
      if (!business) return 0;
      const { count } = await supabase
        .from("complaints")
        .select("*", { count: "exact", head: true })
        .eq("business_id", business.id)
        .eq("status", "new");
      return count ?? 0;
    },
    enabled: !!business,
  });

  const totalReviews = reviews.length;
  const googleRedirects = reviews.filter((r) => r.redirected_to_google).length;
  const redirectRate = totalReviews > 0 ? Math.round((googleRedirects / totalReviews) * 100) : 0;

  const stats = [
    { title: "Total Reviews", value: String(totalReviews), change: "from database", icon: Star, color: "text-primary" },
    { title: "Sent to Google", value: String(googleRedirects), change: `${redirectRate}% redirect rate`, icon: ArrowUpRight, color: "text-primary" },
    { title: "Complaints", value: String(complaintsCount), change: `${unresolvedCount} unresolved`, icon: AlertTriangle, color: "text-destructive" },
    { title: "Customers", value: "—", change: "Add customers to start", icon: Users, color: "text-muted-foreground" },
  ];

  const recentFeedback = reviews.slice(0, 6).map((r) => ({
    name: r.customer_name,
    rating: r.rating,
    time: new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    route: r.rating >= 4 ? "google" : "complaint",
  }));

  // Simple chart data from reviews
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayStr = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    const dayReviews = reviews.filter((r) => new Date(r.created_at).toDateString() === d.toDateString());
    return {
      day: dayStr,
      google: dayReviews.filter((r) => r.rating >= 4).length,
      complaint: dayReviews.filter((r) => r.rating < 4).length,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Overview of your review performance</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">{stat.title}</span>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <div className="mt-2 text-3xl font-bold text-foreground tabular-nums">{stat.value}</div>
              <p className="mt-1 text-xs text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Reviews — Last 7 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={2}>
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} width={24} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 13 }} />
                  <Bar dataKey="google" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Google" />
                  <Bar dataKey="complaint" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="Complaint" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Recent Feedback</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentFeedback.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">No reviews yet</div>
            ) : (
              <div className="divide-y">
                {recentFeedback.map((fb, i) => {
                  const badge = routeBadge[fb.route] || routeBadge.google;
                  return (
                    <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-muted/40 transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{fb.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <StarsDisplay rating={fb.rating} />
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />{fb.time}
                          </span>
                        </div>
                      </div>
                      <Badge variant={badge.variant} className="shrink-0 text-xs">{badge.label}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">How ReviewFlow Routes Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center justify-center gap-3 py-4 text-sm">
            <div className="rounded-lg border bg-muted/50 px-4 py-2 font-medium text-foreground">Customer Visits</div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground rotate-90" />
            <div className="rounded-lg border bg-muted/50 px-4 py-2 font-medium text-foreground">WhatsApp: "Rate 1–5"</div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground rotate-90" />
            <div className="rounded-lg border bg-muted/50 px-4 py-2 font-medium text-foreground">Customer Replies</div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground rotate-90" />
            <div className="flex gap-3">
              <div className="rounded-lg border-2 border-primary bg-secondary px-4 py-2 font-medium text-primary">4-5★ → Google Link</div>
              <div className="rounded-lg border-2 border-destructive bg-destructive/5 px-4 py-2 font-medium text-destructive">1-3★ → Manager Alert</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;
