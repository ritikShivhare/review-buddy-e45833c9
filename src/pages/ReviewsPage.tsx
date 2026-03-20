import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Star, Download } from "lucide-react";

const mockReviews = [
  { id: "1", customer: "Priya Sharma", rating: 5, route: "google", comment: "Excellent service!", date: "Mar 20, 2026" },
  { id: "2", customer: "Rahul Verma", rating: 2, route: "manager", comment: "Food was cold", date: "Mar 20, 2026" },
  { id: "3", customer: "Anita Desai", rating: 4, route: "google", comment: "Very nice ambiance", date: "Mar 19, 2026" },
  { id: "4", customer: "Vikram Singh", rating: 1, route: "manager", comment: "Terrible wait time", date: "Mar 19, 2026" },
  { id: "5", customer: "Meera Patel", rating: 5, route: "google", comment: "Best biryani in town!", date: "Mar 18, 2026" },
  { id: "6", customer: "Suresh Kumar", rating: 3, route: "apology", comment: "Average experience", date: "Mar 18, 2026" },
  { id: "7", customer: "Deepa Nair", rating: 4, route: "google", comment: "Good food, friendly staff", date: "Mar 17, 2026" },
  { id: "8", customer: "Amit Joshi", rating: 2, route: "manager", comment: "Overpriced for quality", date: "Mar 17, 2026" },
];

const routeMap: Record<string, { label: string; variant: "default" | "destructive" | "secondary" }> = {
  google: { label: "Google", variant: "default" },
  manager: { label: "Complaint", variant: "destructive" },
  apology: { label: "Apology", variant: "secondary" },
};

function StarsDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`h-3.5 w-3.5 ${i < rating ? "fill-warning text-warning" : "text-border"}`} />
      ))}
    </div>
  );
}

const ReviewsPage = () => {
  const [ratingFilter, setRatingFilter] = useState("all");
  const [routeFilter, setRouteFilter] = useState("all");

  const filtered = mockReviews.filter((r) => {
    if (ratingFilter !== "all" && r.rating !== Number(ratingFilter)) return false;
    if (routeFilter !== "all" && r.route !== routeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reviews</h1>
          <p className="text-sm text-muted-foreground">{mockReviews.length} total reviews</p>
        </div>
        <Button variant="outline" size="sm">
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
        <Select value={routeFilter} onValueChange={setRouteFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Route" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All routes</SelectItem>
            <SelectItem value="google">Google</SelectItem>
            <SelectItem value="manager">Complaint</SelectItem>
            <SelectItem value="apology">Apology</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Route</TableHead>
                <TableHead className="hidden sm:table-cell">Comment</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => {
                const badge = routeMap[r.route];
                return (
                  <TableRow key={r.id} className="hover:bg-muted/40">
                    <TableCell className="font-medium text-foreground">{r.customer}</TableCell>
                    <TableCell><StarsDisplay rating={r.rating} /></TableCell>
                    <TableCell><Badge variant={badge.variant} className="text-xs">{badge.label}</Badge></TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground max-w-[200px] truncate">{r.comment}</TableCell>
                    <TableCell className="text-sm text-muted-foreground tabular-nums">{r.date}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReviewsPage;
