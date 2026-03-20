import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Upload, Search, Send, Star } from "lucide-react";

const mockCustomers = [
  { id: "1", name: "Priya Sharma", phone: "+91 98765 43210", lastRating: 5, lastReview: "2 days ago" },
  { id: "2", name: "Rahul Verma", phone: "+91 87654 32109", lastRating: 2, lastReview: "1 week ago" },
  { id: "3", name: "Anita Desai", phone: "+91 76543 21098", lastRating: 4, lastReview: "3 days ago" },
  { id: "4", name: "Vikram Singh", phone: "+91 65432 10987", lastRating: null, lastReview: "Never" },
  { id: "5", name: "Meera Patel", phone: "+91 54321 09876", lastRating: 5, lastReview: "Today" },
  { id: "6", name: "Suresh Kumar", phone: "+91 43210 98765", lastRating: 3, lastReview: "5 days ago" },
];

const CustomersPage = () => {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const filtered = mockCustomers.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Customers</h1>
          <p className="text-sm text-muted-foreground">{mockCustomers.length} customers added</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Upload className="mr-1.5 h-4 w-4" /> Import CSV
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="mr-1.5 h-4 w-4" /> Add Customer</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Customer</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input placeholder="Customer name" />
                </div>
                <div className="space-y-2">
                  <Label>Phone (WhatsApp)</Label>
                  <Input placeholder="+91 98765 43210" />
                </div>
                <Button className="w-full" onClick={() => setDialogOpen(false)}>
                  Add & Send Review Request
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search by name or phone..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Last Rating</TableHead>
                <TableHead>Last Review</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium text-foreground">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">{c.phone}</TableCell>
                  <TableCell>
                    {c.lastRating ? (
                      <div className="flex items-center gap-1">
                        <Star className={`h-3.5 w-3.5 ${c.lastRating >= 4 ? "fill-warning text-warning" : "fill-destructive text-destructive"}`} />
                        <span className="text-sm tabular-nums">{c.lastRating}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.lastReview}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      <Send className="mr-1.5 h-3.5 w-3.5" /> Request
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomersPage;
