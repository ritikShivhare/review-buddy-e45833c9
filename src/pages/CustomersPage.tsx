import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, Send, RotateCw } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBusiness } from "@/hooks/useBusiness";
import { usePlanAccess } from "@/hooks/usePlanAccess";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PhoneInput } from "@/components/PhoneInput";
import { isValidPhoneNumber } from "libphonenumber-js";

const CustomersPage = () => {
  const { data: business } = useBusiness();
  const { plan, limits } = usePlanAccess();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers", business?.id],
    queryFn: async () => {
      if (!business) return [];
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("business_id", business.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!business,
  });

  const addCustomer = useMutation({
    mutationFn: async () => {
      if (!business) throw new Error("No business");
      if (!newPhone || !isValidPhoneNumber(newPhone)) {
        throw new Error("Please enter a valid phone number");
      }
      if (customers.length >= limits.maxRequests) {
        throw new Error(`QUOTA:Your ${plan} plan allows ${limits.maxRequests} customers. Upgrade for more.`);
      }
      const { error } = await supabase.from("customers").insert({
        business_id: business.id,
        name: newName.trim(),
        phone: newPhone,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setDialogOpen(false);
      setNewName("");
      setNewPhone("");
      toast.success("Customer added");
    },
    onError: (err: any) => {
      const msg = err.message || "Failed";
      if (msg.startsWith("QUOTA:")) {
        toast.error(msg.replace("QUOTA:", ""), {
          action: { label: "Upgrade", onClick: () => navigate("/upgrade") },
        });
      } else {
        toast.error(msg);
      }
    },
  });

  const buildWaForCustomer = (customer: { name: string; phone: string }) => {
    if (!business) return null;
    const raw = customer.phone || "";
    if (!raw.startsWith("+") || !isValidPhoneNumber(raw)) return null;
    const phone = raw.replace(/\D/g, "");
    if (phone.length < 8) return null;
    const link = `${window.location.origin}/r/${business.id}`;
    const msg = `Hi ${customer.name}, thanks for visiting ${business.business_name}! We'd love your feedback: ${link}`;
    return { url: `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, msg, link };
  };

  const markRequested = async (customerId: string) => {
    const { error } = await supabase
      .from("customers")
      .update({ status: "requested" })
      .eq("id", customerId);
    if (error) {
      toast.error(error.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["customers"] });
    toast.success("WhatsApp opened — tap Send in WhatsApp to deliver the request");
  };

  const copyWaLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("WhatsApp link copied — paste it in a new tab");
    } catch {
      toast.error("Could not copy. Long-press the button to copy the link.");
    }
  };


  const filtered = customers.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );


  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Customers</h1>
          <p className="text-sm text-muted-foreground">{customers.length} customers added</p>
        </div>
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
                <Input placeholder="Customer name" value={newName} onChange={(e) => setNewName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Phone (WhatsApp)</Label>
                <PhoneInput value={newPhone} onChange={setNewPhone} />
                <p className="text-xs text-muted-foreground">Pick the country, then enter the number.</p>
              </div>
              <Button
                className="w-full"
                onClick={() => addCustomer.mutate()}
                disabled={!newName.trim() || !newPhone || !isValidPhoneNumber(newPhone) || addCustomer.isPending}
              >
                {addCustomer.isPending ? "Adding..." : "Add Customer"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search by name or phone..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <p className="text-xs text-muted-foreground -mt-3">
        Tip: <span className="font-medium">Open WhatsApp</span> launches a pre-filled message — review it in WhatsApp and tap Send.
      </p>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {customers.length === 0 ? "No customers yet. Add your first customer!" : "No matching customers"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium text-foreground">{c.name}</TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">{c.phone}</TableCell>
                    <TableCell>
                      <Badge variant={c.status === "reviewed" ? "default" : c.status === "complained" ? "destructive" : "secondary"} className="text-xs capitalize">
                        {c.status || "pending"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => sendRequest.mutate(c)} disabled={sendRequest.isPending}>
                        {c.status === "requested" ? (
                          <><RotateCw className="mr-1.5 h-3.5 w-3.5" /> Resend</>
                        ) : (
                          <><Send className="mr-1.5 h-3.5 w-3.5" /> Open WhatsApp</>
                        )}
                      </Button>
                    </TableCell>

                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomersPage;
