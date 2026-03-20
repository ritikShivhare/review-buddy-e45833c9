import { Star, MessageSquare, Users, AlertTriangle, TrendingUp, ArrowUpRight, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

const stats = [
  { title: "Total Reviews", value: "127", change: "+12 this week", icon: Star, color: "text-primary" },
  { title: "Sent to Google", value: "89", change: "70% redirect rate", icon: ArrowUpRight, color: "text-primary" },
  { title: "Private Complaints", value: "24", change: "5 unresolved", icon: AlertTriangle, color: "text-destructive" },
  { title: "Apologies Sent", value: "14", change: "58% resolved", icon: MessageSquare, color: "text-warning" },
];

const recentFeedback = [
  { name: "Priya Sharma", rating: 5, time: "10 min ago", route: "google" },
  { name: "Rahul Verma", rating: 2, time: "25 min ago", route: "manager" },
  { name: "Anita Desai", rating: 4, time: "1 hr ago", route: "google" },
  { name: "Vikram Singh", rating: 1, time: "2 hrs ago", route: "manager" },
  { name: "Meera Patel", rating: 5, time: "3 hrs ago", route: "google" },
  { name: "Suresh Kumar", rating: 3, time: "4 hrs ago", route: "apology" },
];

const chartData = Array.from({ length: 14 }, (_, i) => ({
  day: `Mar ${i + 7}`,
  google: Math.floor(Math.random() * 8) + 2,
  complaint: Math.floor(Math.random() * 4),
}));

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
  manager: { label: "Complaint", variant: "destructive" },
  apology: { label: "Apology", variant: "secondary" },
};

const DashboardPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Overview of your review performance</p>
      </div>

      {/* Stats */}
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
        {/* Chart */}
        <Card className="lg:col-span-3 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Reviews — Last 14 Days</CardTitle>
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

        {/* Recent feedback */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Recent Feedback</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {recentFeedback.map((fb, i) => {
                const badge = routeBadge[fb.route];
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
          </CardContent>
        </Card>
      </div>

      {/* Flow diagram */}
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
